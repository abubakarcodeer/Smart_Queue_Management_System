import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/doctors")({
  component: () => (
    <RequireAuth roles={["admin"]}>
      <DoctorsAdmin />
    </RequireAuth>
  ),
});

function DoctorsAdmin() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", department: "", specialty: "", avgConsultMinutes: 10 });
  const [q, setQ] = useState("");

  const load = () => Promise.all([
    api.get("/doctors").then((r) => setDoctors(r.data)),
    api.get("/departments").then((r) => setDepartments(r.data)),
  ]);

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/doctors", { ...form, avgConsultMinutes: Number(form.avgConsultMinutes) });
      toast.success("Doctor added");
      setForm({ name: "", email: "", password: "", phone: "", department: "", specialty: "", avgConsultMinutes: 10 });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const filtered = doctors.filter((d) =>
    !q || d.user.name.toLowerCase().includes(q.toLowerCase()) || d.user.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Doctors</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Add doctor</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Specialty</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
              <div className="space-y-1"><Label>Avg consult (min)</Label><Input type="number" min={1} value={form.avgConsultMinutes} onChange={(e) => setForm({ ...form, avgConsultMinutes: Number(e.target.value) })} /></div>
              <Button type="submit" className="w-full">Add doctor</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>All doctors</span>
              <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.map((d) => (
                <div key={d._id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <div className="font-medium">{d.user.name}</div>
                    <div className="text-xs text-muted-foreground">{d.user.email} · {d.department?.name} {d.specialty ? `· ${d.specialty}` : ""}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.avgConsultMinutes} min avg · {d.available ? "available" : "off"}</div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground">No doctors.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
