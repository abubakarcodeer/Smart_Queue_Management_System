import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/patient/history")({
  component: () => (
    <RequireAuth roles={["patient"]}>
      <HistoryPage />
    </RequireAuth>
  ),
});

function HistoryPage() {
  const { data = [] } = useQuery({
    queryKey: ["history"],
    queryFn: async () => (await api.get("/appointments/me")).data,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Appointment history</h1>
      <div className="space-y-3">
        {data.length === 0 && <p className="text-sm text-muted-foreground">No appointments yet.</p>}
        {data.map((a) => (
          <Card key={a._id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{a.doctor?.user?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {a.doctor?.department?.name} · {new Date(a.date).toLocaleString()}
                </div>
                {a.reason && <div className="mt-1 text-sm text-muted-foreground">{a.reason}</div>}
              </div>
              <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" || a.status === "skipped" ? "destructive" : "secondary"}>
                {a.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
