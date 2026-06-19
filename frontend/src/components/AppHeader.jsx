import { Link, useRouter } from "@tanstack/react-router";
import { Activity, Moon, Sun, LogOut, Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { user, logout } = useAuthStore();
  const { dark, toggle, init } = useThemeStore();
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!user) return;
    api.get("/notifications/me").then((r) => setNotifs(r.data)).catch(() => {});
    const s = getSocket();
    s.emit("join:user", { userId: user._id });
    const handler = (n) => setNotifs((prev) => [n, ...prev]);
    s.on("notification:new", handler);
    return () => {
      s.off("notification:new", handler);
    };
  }, [user]);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (unread === 0) return;
    try {
      await api.post("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const removeNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/notifications");
      setNotifs([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg">SmartQueue</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user?.role === "patient" && (
            <>
              <Link to="/patient" className="rounded-md px-3 py-2 text-sm hover:bg-accent">Dashboard</Link>
              <Link to="/patient/book" className="rounded-md px-3 py-2 text-sm hover:bg-accent">Book</Link>
              <Link to="/patient/history" className="rounded-md px-3 py-2 text-sm hover:bg-accent">History</Link>
            </>
          )}
          {user?.role === "doctor" && (
            <Link to="/doctor" className="rounded-md px-3 py-2 text-sm hover:bg-accent">Queue</Link>
          )}
          {user?.role === "admin" && (
            <>
              <Link to="/admin" className="rounded-md px-3 py-2 text-sm hover:bg-accent">Analytics</Link>
              <Link to="/admin/doctors" className="rounded-md px-3 py-2 text-sm hover:bg-accent">Doctors</Link>
              <Link to="/admin/departments" className="rounded-md px-3 py-2 text-sm hover:bg-accent">Departments</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user && (
            <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
                      {unread}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between pr-2">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  {notifs.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifs.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                )}
                <div className="max-h-[300px] overflow-y-auto">
                  {notifs.slice(0, 15).map((n) => (
                    <div key={n._id} className="relative group">
                      <DropdownMenuItem
                        className={`flex-col items-start gap-1 pr-8 ${!n.read ? "bg-primary/5" : ""}`}
                      >
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.body}
                        </div>
                      </DropdownMenuItem>
                      <button
                        onClick={(e) => removeNotif(e, n._id)}
                        className="absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                        aria-label="Remove notification"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">{user.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="capitalize">{user.role}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); router.navigate({ to: "/login" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm"><Link to="/login">Sign in</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
}
