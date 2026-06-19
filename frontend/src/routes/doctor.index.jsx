import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, SkipForward, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/doctor/")({
  component: () => (
    <RequireAuth roles={["doctor"]}>
      <DoctorDashboard />
    </RequireAuth>
  ),
});

function DoctorDashboard() {
  const [me, setMe] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTokens = () => api.get("/appointments/today").then((r) => setTokens(r.data));

  useEffect(() => {
    api.get("/doctors/me").then((r) => setMe(r.data));
    loadTokens();
  }, []);

  useEffect(() => {
    if (!me?._id) return;
    const s = getSocket();
    s.emit("join:queue", { doctorId: me._id });
    const handler = () => loadTokens();
    s.on("queue:update", handler);
    return () => { s.off("queue:update", handler); };
  }, [me?._id]);

  const current = tokens.find((t) => t.status === "in_progress");
  const waiting = tokens.filter((t) => t.status === "waiting");
  const completed = tokens.filter((t) => t.status === "completed").length;
  const skipped = tokens.filter((t) => t.status === "skipped").length;

  const callNext = async () => {
    if (!me?._id) return;
    setLoading(true);
    try {
      await api.post(`/queue/${me._id}/next`);
      await loadTokens();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  const complete = async (id) => {
    await api.post(`/queue/token/${id}/complete`);
    await loadTokens();
  };
  const skip = async (id) => {
    await api.post(`/queue/token/${id}/skip`);
    await loadTokens();
  };

  const toggleAvail = async (v) => {
    if (!me) return;
    const { data } = await api.patch(`/doctors/${me._id}/availability`, { available: v });
    setMe({ ...me, available: data.available });
  };

  if (!me) return <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{me.user.name}</h1>
          <p className="text-sm text-muted-foreground">{me.department.name} · {me.avgConsultMinutes} min avg</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="avail" className="text-sm">Accepting patients</Label>
          <Switch id="avail" checked={me.available} onCheckedChange={toggleAvail} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Now serving" value={current ? `#${current.number}` : "—"} />
        <StatCard label="Waiting" value={waiting.length} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Skipped" value={skipped} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Current patient</CardTitle></CardHeader>
          <CardContent>
            {current ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Token</div>
                  <div className="mt-1 text-5xl font-bold tabular-nums text-primary">#{current.number}</div>
                  <div className="mt-3 text-lg font-medium">{current.patient.name}</div>
                  {current.patient.phone && <div className="text-xs text-muted-foreground">{current.patient.phone}</div>}
                  {current.appointment?.reason && <div className="mt-2 text-sm text-muted-foreground">{current.appointment.reason}</div>}
                </div>
                <Button onClick={() => complete(current._id)} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark complete
                </Button>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No patient in consultation.</p>
            )}
            <Button onClick={callNext} disabled={loading || waiting.length === 0} className="mt-4 w-full" variant="default">
              <PhoneCall className="mr-2 h-4 w-4" /> Call next patient
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Today's queue</CardTitle></CardHeader>
          <CardContent>
            {tokens.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No patients yet today.</p>}
            <div className="space-y-2">
              {tokens.map((t) => (
                <div key={t._id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center text-xl font-bold tabular-nums text-primary">#{t.number}</div>
                    <div>
                      <div className="font-medium">{t.patient.name}</div>
                      {t.appointment?.reason && <div className="text-xs text-muted-foreground">{t.appointment.reason}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === "in_progress" ? "default" : t.status === "completed" ? "secondary" : t.status === "skipped" ? "destructive" : "outline"}>
                      {t.status}
                    </Badge>
                    {t.status === "waiting" && (
                      <Button size="sm" variant="ghost" onClick={() => skip(t._id)}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
