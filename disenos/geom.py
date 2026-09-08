"""Geometría 3D reutilizada de NFCTap (generar_tarjetas.py)."""
from __future__ import annotations

import math
import struct
from pathlib import Path

from google_g import google_g_poly  # noqa: E402

from google_g import google_g_pil, google_g_poly, google_g_svg  # noqa: F401

OUT = Path(__file__).resolve().parent / "stl"


# ---------------------------------------------------------------------------
# Geometría 2D / 3D
# ---------------------------------------------------------------------------

def rounded_rect(w: float, h: float, r: float, segs: int = 10) -> list[tuple[float, float]]:
    r = min(r, w / 2 - 0.01, h / 2 - 0.01)
    corners = (
        (w / 2 - r, h / 2 - r, 0.0),
        (-w / 2 + r, h / 2 - r, 90.0),
        (-w / 2 + r, -h / 2 + r, 180.0),
        (w / 2 - r, -h / 2 + r, 270.0),
    )
    pts: list[tuple[float, float]] = []
    for cx, cy, start in corners:
        for i in range(segs + 1):
            a = math.radians(start + 90.0 * i / segs)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def circle(cx: float, cy: float, r: float, segs: int = 48) -> list[tuple[float, float]]:
    return [
        (cx + r * math.cos(math.radians(i * 360 / segs)),
         cy + r * math.sin(math.radians(i * 360 / segs)))
        for i in range(segs)
    ]


def rectangle(w: float, h: float, cx: float = 0.0, cy: float = 0.0) -> list[tuple[float, float]]:
    return [
        (cx - w / 2, cy - h / 2),
        (cx + w / 2, cy - h / 2),
        (cx + w / 2, cy + h / 2),
        (cx - w / 2, cy + h / 2),
    ]


def star(cx: float, cy: float, r_out: float, r_in: float | None = None, n: int = 5) -> list[tuple[float, float]]:
    if r_in is None:
        r_in = r_out * 0.42
    pts = []
    for i in range(n * 2):
        ang = math.radians(-90 + i * 180 / n)
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def translate(pts: list[tuple[float, float]], dx: float, dy: float) -> list[tuple[float, float]]:
    return [(x + dx, y + dy) for x, y in pts]


def area(poly: list[tuple[float, float]]) -> float:
    a = 0.0
    for i, (x1, y1) in enumerate(poly):
        x2, y2 = poly[(i + 1) % len(poly)]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def ensure_ccw(poly: list[tuple[float, float]]) -> list[tuple[float, float]]:
    return poly if area(poly) > 0 else list(reversed(poly))


def ensure_cw(poly: list[tuple[float, float]]) -> list[tuple[float, float]]:
    return poly if area(poly) < 0 else list(reversed(poly))


def ear_clip(poly: list[tuple[float, float]]) -> list[tuple[int, int, int]]:
    """Triangula un polígono simple (sin agujeros)."""
    pts = list(poly)
    idx = list(range(len(pts)))
    if area(pts) < 0:
        idx.reverse()
        pts = [pts[i] for i in range(len(pts) - 1, -1, -1)]
        idx = list(range(len(pts)))

    def cross(i, j, k):
        ax, ay = pts[i]
        bx, by = pts[j]
        cx, cy = pts[k]
        return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)

    def inside(p, a, b, c):
        def sign(p1, p2, p3):
            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
        b1 = sign(p, a, b) < 0.0
        b2 = sign(p, b, c) < 0.0
        b3 = sign(p, c, a) < 0.0
        return b1 == b2 == b3

    tris = []
    guard = 0
    while len(idx) > 3 and guard < 10000:
        guard += 1
        clipped = False
        m = len(idx)
        for t in range(m):
            i_prev, i, i_next = idx[(t - 1) % m], idx[t], idx[(t + 1) % m]
            if cross(i_prev, i, i_next) <= 1e-9:
                continue
            ear = True
            for j in idx:
                if j in (i_prev, i, i_next):
                    continue
                if inside(pts[j], pts[i_prev], pts[i], pts[i_next]):
                    ear = False
                    break
            if ear:
                tris.append((i_prev, i, i_next))
                del idx[t]
                clipped = True
                break
        if not clipped:
            break
    if len(idx) == 3:
        tris.append((idx[0], idx[1], idx[2]))
    return tris


# ---------------------------------------------------------------------------
# Malla
# ---------------------------------------------------------------------------

class Mesh:
    def __init__(self) -> None:
        self.tris: list[tuple[tuple[float, float, float], ...]] = []

    def add(self, a, b, c) -> None:
        self.tris.append((a, b, c))

    def extend(self, other: "Mesh") -> None:
        self.tris.extend(other.tris)

    def _normal(self, a, b, c):
        ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
        vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        l = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        return (nx / l, ny / l, nz / l)

    def write_stl(self, path: Path, name: str = "tarjeta") -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as f:
            header = name.encode("ascii", "ignore")[:80]
            f.write(header + b"\0" * (80 - len(header)))
            f.write(struct.pack("<I", len(self.tris)))
            for a, b, c in self.tris:
                n = self._normal(a, b, c)
                f.write(struct.pack("<3f", *n))
                f.write(struct.pack("<3f", *a))
                f.write(struct.pack("<3f", *b))
                f.write(struct.pack("<3f", *c))
                f.write(struct.pack("<H", 0))
        print(f"  STL  {path.name:40s}  {len(self.tris):6d} triángulos")


def extrude(poly: list[tuple[float, float]], z0: float, z1: float) -> Mesh:
    """Extruye un polígono simple (sin agujeros) entre z0 y z1."""
    poly = ensure_ccw(poly)
    m = Mesh()
    n = len(poly)
    tris = ear_clip(poly)
    for i, j, k in tris:
        m.add((poly[i][0], poly[i][1], z0), (poly[k][0], poly[k][1], z0), (poly[j][0], poly[j][1], z0))
        m.add((poly[i][0], poly[i][1], z1), (poly[j][0], poly[j][1], z1), (poly[k][0], poly[k][1], z1))
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        m.add((x1, y1, z0), (x2, y2, z0), (x2, y2, z1))
        m.add((x1, y1, z0), (x2, y2, z1), (x1, y1, z1))
    return m


def google_g_mesh(cx: float, cy: float, r_out: float, z0: float, z1: float, segs: int = 72) -> Mesh:
    """G oficial de Google (mismo path que la web), un color de acento."""
    del segs
    return extrude(google_g_poly(cx, cy, r_out * 2.0, flip_y=True), z0, z1)


def extrude_ring(outer: list[tuple[float, float]], inner: list[tuple[float, float]], z0: float, z1: float) -> Mesh:
    """Pared entre un contorno exterior y un hueco interior."""
    outer = ensure_ccw(outer)
    inner = ensure_cw(inner)
    m = Mesh()

    def cap(z: float, flip: bool) -> None:
        # Abanico desde el centroide del hueco hacia el anillo: no es robusto
        # para formas cóncavas. Usamos puentes por índice proporcional.
        no, ni = len(outer), len(inner)
        steps = max(no, ni)
        ring = []
        for s in range(steps):
            o = outer[int(s * no / steps) % no]
            i = inner[int(s * ni / steps) % ni]
            ring.append((o, i))
        for s in range(steps):
            o1, i1 = ring[s]
            o2, i2 = ring[(s + 1) % steps]
            if flip:
                m.add((o1[0], o1[1], z), (i1[0], i1[1], z), (o2[0], o2[1], z))
                m.add((o2[0], o2[1], z), (i1[0], i1[1], z), (i2[0], i2[1], z))
            else:
                m.add((o1[0], o1[1], z), (o2[0], o2[1], z), (i1[0], i1[1], z))
                m.add((o2[0], o2[1], z), (i2[0], i2[1], z), (i1[0], i1[1], z))

    cap(z0, flip=True)
    cap(z1, flip=False)

    for i in range(len(outer)):
        x1, y1 = outer[i]
        x2, y2 = outer[(i + 1) % len(outer)]
        m.add((x1, y1, z0), (x2, y2, z0), (x2, y2, z1))
        m.add((x1, y1, z0), (x2, y2, z1), (x1, y1, z1))
    for i in range(len(inner)):
        x1, y1 = inner[i]
        x2, y2 = inner[(i + 1) % len(inner)]
        m.add((x1, y1, z0), (x1, y1, z1), (x2, y2, z1))
        m.add((x1, y1, z0), (x2, y2, z1), (x2, y2, z0))
    return m


def _ray_hit_poly(
    ox: float, oy: float, dx: float, dy: float, poly: list[tuple[float, float]]
) -> tuple[float, float] | None:
    best_t = 1e18
    hit: tuple[float, float] | None = None
    for i, (ax, ay) in enumerate(poly):
        bx, by = poly[(i + 1) % len(poly)]
        ex, ey = bx - ax, by - ay
        det = dx * ey - dy * ex
        if abs(det) < 1e-12:
            continue
        tx, ty = ax - ox, ay - oy
        t = (tx * ey - ty * ex) / det
        u = (tx * dy - ty * dx) / det
        if t > 1e-8 and -1e-6 <= u <= 1.0 + 1e-6 and t < best_t:
            best_t = t
            hit = (ox + t * dx, oy + t * dy)
    return hit


def extrude_matched_ring(
    outer_pts: list[tuple[float, float]],
    inner_pts: list[tuple[float, float]],
    z0: float,
    z1: float,
) -> Mesh:
    """Anillo 1:1 (outer[i] con inner[i]). No reordenar: si no, el hueco se tapa."""
    n = len(inner_pts)
    m = Mesh()

    def cap(z: float, flip: bool) -> None:
        for s in range(n):
            o1, i1 = outer_pts[s], inner_pts[s]
            o2, i2 = outer_pts[(s + 1) % n], inner_pts[(s + 1) % n]
            if flip:
                m.add((o1[0], o1[1], z), (i1[0], i1[1], z), (o2[0], o2[1], z))
                m.add((o2[0], o2[1], z), (i1[0], i1[1], z), (i2[0], i2[1], z))
            else:
                m.add((o1[0], o1[1], z), (o2[0], o2[1], z), (i1[0], i1[1], z))
                m.add((o2[0], o2[1], z), (i2[0], i2[1], z), (i1[0], i1[1], z))

    cap(z0, flip=True)
    cap(z1, flip=False)
    for i in range(n):
        x1, y1 = outer_pts[i]
        x2, y2 = outer_pts[(i + 1) % n]
        m.add((x1, y1, z0), (x2, y2, z0), (x2, y2, z1))
        m.add((x1, y1, z0), (x2, y2, z1), (x1, y1, z1))
        x1, y1 = inner_pts[i]
        x2, y2 = inner_pts[(i + 1) % n]
        m.add((x1, y1, z0), (x1, y1, z1), (x2, y2, z1))
        m.add((x1, y1, z0), (x2, y2, z1), (x2, y2, z0))
    return m


def extrude_plate_hole(
    outer: list[tuple[float, float]],
    hole: list[tuple[float, float]],
    z0: float,
    z1: float,
) -> Mesh:
    """Placa con hueco convexo (también si el pozo no está centrado). No tapa el centro."""
    outer = ensure_ccw(outer)
    hole_ccw = ensure_ccw(hole)
    cx = sum(p[0] for p in hole_ccw) / len(hole_ccw)
    cy = sum(p[1] for p in hole_ccw) / len(hole_ccw)
    hits: list[tuple[float, float]] = []
    for x, y in hole_ccw:
        h = _ray_hit_poly(cx, cy, x - cx, y - cy, outer)
        hits.append(h if h is not None else (x, y))
    return extrude_matched_ring(hits, hole_ccw, z0, z1)
