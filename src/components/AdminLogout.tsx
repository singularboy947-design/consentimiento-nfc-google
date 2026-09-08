export function AdminLogout() {
  return (
    <form action="/api/admin/logout" method="POST" className="admin-logout">
      <button type="submit" className="ghost">
        Salir
      </button>
    </form>
  );
}
