import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";

export function RequireAuth({ roles, children }) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.navigate({ to: "/login" });
    } else if (roles && !roles.includes(user.role)) {
      router.navigate({ to: "/" });
    }
  }, [user, roles, router]);

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
