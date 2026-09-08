#!/usr/bin/env python3
"""Tarjeta NFC vertical tamaño crédito: solo 5 estrellas + G.

54 × 85,6 × 2,0 mm (ISO 7810 en vertical). Pausa a mitad (1,00 mm).
Pozo holgado Ø32 bajo la G (Timeskey Ø25), para verlo y colocar el chip.
G centrada en vertical; 5 estrellas encima, dentro de la placa.
"""

from __future__ import annotations

import math
from pathlib import Path

from geom import (
    Mesh,
    circle,
    extrude,
    extrude_plate_hole,
    extrude_ring,
    google_g_mesh,
    rounded_rect,
    star,
)
from google_g import google_g_svg

HERE = Path(__file__).resolve().parent
OUT = HERE / "stl" / "singularboy-credito-vertical"

# ISO 7810 ID-1 en VERTICAL (la estrecha es el ancho).
CARD_W = 53.98
CARD_H = 85.60
CARD_T = 2.00
CARD_R = 3.2
RELIEF = 0.35

STICKER_D = 25.0
WELL_D = 32.0
PAD_D = 25.0
PAD_H = 0.35
Z_FLOOR = 0.40
Z_PAUSE = 1.00
FIRST_LAYER = 0.25
LAYER_H = 0.20

G_R = 13.0
G_Y = 0.0
STAR_Y = 26.5


def pause_layer() -> int:
    return 1 + int(round((Z_PAUSE - FIRST_LAYER) / LAYER_H))


def star_layout() -> list[tuple[float, float, float]]:
    sizes = (2.35, 2.95, 3.85, 2.95, 2.35)
    lift = (0.0, 1.7, 3.4, 1.7, 0.0)
    return [((i - 2) * 8.2, STAR_Y + lift[i], sizes[i]) for i in range(5)]


def body() -> Mesh:
    outer = rounded_rect(CARD_W, CARD_H, CARD_R)
    well = circle(0.0, G_Y, WELL_D / 2, 56)
    m = Mesh()
    m.extend(extrude(outer, 0.0, Z_FLOOR))
    m.extend(extrude_plate_hole(outer, well, Z_FLOOR, Z_PAUSE))
    m.extend(extrude(outer, Z_PAUSE, CARD_T))
    return m


def nfc_mira() -> Mesh:
    m = Mesh()
    m.extend(extrude(circle(0.0, G_Y, PAD_D / 2, 48), Z_FLOOR, Z_FLOOR + PAD_H))
    m.extend(
        extrude_ring(
            circle(0.0, G_Y, WELL_D / 2 - 0.15, 48),
            circle(0.0, G_Y, WELL_D / 2 - 1.35, 40),
            Z_FLOOR + 0.05,
            Z_PAUSE - 0.05,
        )
    )
    return m


def accent() -> Mesh:
    m = nfc_mira()
    z0, z1 = CARD_T, CARD_T + RELIEF
    for x, y, r in star_layout():
        m.extend(extrude(star(x, y, r), z0, z1 + 0.08))
    m.extend(google_g_mesh(0.0, G_Y, G_R, z0, z1 + 0.06))
    return m


def _star_svg(cx: float, cy: float, r: float) -> str:
    pts = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        rr = r if i % 2 == 0 else r * 0.42
        pts.append(f"{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}")
    return " ".join(pts)


def write_preview(path: Path) -> None:
    body_c, acc, bg = "#141416", "#E2B43A", "#F3EEE4"
    sc = 10.0
    ox, oy = 0.1, 80

    def sx(x: float) -> float:
        return ox + (x + CARD_W / 2) * sc

    def sy(y: float) -> float:
        return oy + (CARD_H / 2 - y) * sc

    stars = " ".join(
        f'<polygon points="{_star_svg(sx(x), sy(y), r * sc)}" fill="{acc}"/>' for x, y, r in star_layout()
    )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 1100" width="540" height="1100">
  <rect width="540" height="1100" fill="{bg}"/>
  <text x="270" y="48" text-anchor="middle" fill="#1C1915" font-family="Georgia, serif" font-size="22">Singular Boy · crédito vertical 2 mm</text>
  <rect x="{sx(-CARD_W/2):.1f}" y="{sy(CARD_H/2):.1f}" width="{CARD_W*sc:.1f}" height="{CARD_H*sc:.1f}" rx="{CARD_R*sc:.1f}" fill="{body_c}"/>
  {stars}
  {google_g_svg(sx(0), sy(G_Y), G_R * sc, acc)}
  <circle cx="{sx(0):.1f}" cy="{sy(G_Y):.1f}" r="{(WELL_D/2)*sc:.1f}" fill="none" stroke="#E2B43A" stroke-width="2.2" stroke-dasharray="6 4" opacity="0.85"/>
  <circle cx="{sx(0):.1f}" cy="{sy(G_Y):.1f}" r="{(STICKER_D/2)*sc:.1f}" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.45"/>
  <text x="270" y="1020" text-anchor="middle" fill="#1C1915" font-family="Georgia, serif" font-size="16">54 × 85,6 × 2,0 mm · NFC Ø25 bajo la G</text>
  <text x="270" y="1048" text-anchor="middle" fill="#7A6A52" font-family="Georgia, serif" font-size="13">Pozo Ø{WELL_D:.0f} · mira Ø{PAD_D:.0f} · pausa capa {pause_layer()} (mitad)</text>
</svg>
"""
    path.write_text(svg, encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    body().write_stl(OUT / "01_cuerpo.stl", "cuerpo")
    accent().write_stl(OUT / "02_acento.stl", "acento")
    write_preview(OUT / "vista-previa.svg")
    layer = pause_layer()
    (OUT / "PAUSA_NFC.txt").write_text(
        (
            "Pausa NFC — tarjeta crédito vertical 2 mm (Singular Boy)\n"
            "=======================================================\n"
            f"Tamaño: {CARD_W:.2f} × {CARD_H:.2f} × {CARD_T:.2f} mm (ISO 7810 en vertical)\n"
            f"Altura pausa: {Z_PAUSE:.2f} mm · capa {layer} (primera 0,25 + 0,20 mm) = MITAD\n"
            f"Centro del pozo = centro de la G (y={G_Y:.1f} mm, en medio). NO va abajo.\n"
            f"Pozo Ø{WELL_D:.0f} (holgado) · mira amarilla Ø{PAD_D:.0f} · pegatina Timeskey Ø{STICKER_D:.0f}\n"
            f"Suelo {Z_FLOOR:.2f} mm · tapa encima {CARD_T - Z_PAUSE:.2f} mm. Luego se imprime la G encima.\n"
            "\n"
            "Stock: Timeskey NTAG215 Ø25 mm (Amazon B08LD99GZT).\n"
            "Proyecto NUEVO en Flash. Importa 01_cuerpo.stl + 02_acento.stl → Agrupar → NO Reparar.\n"
            "Rebanar 0,20 mm Standard @FF AD5X. Cuerpo negro, acento amarillo.\n"
            "\n"
            "La mira se imprime ANTES de la pausa:\n"
            "disco amarillo Ø25 en el suelo + anillo del pozo Ø32, justo donde irá la G.\n"
            "\n"
            "En Previsualización:\n"
            f"1. Slider DERECHO BAJA hasta la capa {layer} (~{Z_PAUSE:.2f} mm).\n"
            "   Hueco REDONDO GRANDE + círculo amarillo = sitio de la G.\n"
            "2. Clic derecho en esa capa → Añadir pausa.\n"
            "3. Imprime.\n"
            "\n"
            "Cuando pare (mira desde ARRIBA):\n"
            "- El círculo amarillo (donde irá la G) = aquí la pegatina.\n"
            "- Timeskey Ø25 ENCIMA de ese círculo, hundida, adhesivo ABAJO.\n"
            "- El pozo es Ø32: entra holgado para verlo. Que no sobresalga. No apagues. Continuar.\n"
        ),
        encoding="utf-8",
    )
    (OUT / "LEEME.txt").write_text(
        (
            "Tarjeta NFC crédito vertical 2 mm — Singular Boy\n"
            "===============================================\n\n"
            "Solo 5 estrellas (arriba) + G de Google (centro). Sin TAP, sin atril.\n"
            f"Imprime agrupando 01_cuerpo + 02_acento. Pausa capa {layer} ({Z_PAUSE:.2f} mm, mitad).\n"
            "Pozo Ø32 bajo la G (chip Ø25). Programa el chip DESPUÉS con NFC Tools → URL de Vercel.\n"
        ),
        encoding="utf-8",
    )
    print(f"Pausa NFC capa {layer} ({Z_PAUSE:.2f} mm)  pozo Ø{WELL_D:.0f} bajo la G  grosor {CARD_T:.2f} mm")


if __name__ == "__main__":
    main()
