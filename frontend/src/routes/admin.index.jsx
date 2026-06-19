import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <RequireAuth roles={["admin"]}>
      <AdminDashboard />
    </RequireAuth>
  ),
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
    refetchInterval: 10000,
  });
  const { data: queues = [] } = useQuery({
    queryKey: ["live-queues"],
    queryFn: async () => (await api.get("/admin/queues")).data,
    refetchInterval: 5000,
  });

  if (!data) return <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Admin analytics</h1>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Patients" v={data.totals.patients} />
        <Stat label="Doctors" v={data.totals.doctors} />
        <Stat label="Departments" v={data.totals.departments} />
        <Stat label="Today's bookings" v={data.totals.todayAppointments} />
        <Stat label="Completed today" v={data.totals.completedToday} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Last 7 days</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By department (today)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Live queues</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {queues.map((q) => (
              <div key={q.doctor._id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="font-medium">{q.doctor.user.name}</div>
                  <div className="text-xs text-muted-foreground">{q.doctor.department?.name}</div>
                </div>
                <div className="flex gap-6 text-sm">
                  <span><span className="font-semibold text-primary">{q.inProgress}</span> active</span>
                  <span><span className="font-semibold">{q.waiting}</span> waiting</span>
                </div>
              </div>
            ))}
            {queues.length === 0 && <p className="text-sm text-muted-foreground">No doctors yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, v }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold tabular-nums">{v}</div>
      </CardContent>
    </Card>
  );
}
