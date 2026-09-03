import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import AppHeader from "@/components/AppHeader";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>

      <div className="app-main-wrapper">
        <AppHeader />

        <main className="app-content">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
