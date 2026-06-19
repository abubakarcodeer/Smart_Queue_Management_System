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
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/departments")({
  component: () => (
    <RequireAuth roles={["admin"]}>
      <DepartmentsAdmin />
    </RequireAuth>
  ),
});

function DepartmentsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = () => api.get("/departments").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/departments", form);
      setForm({ name: "", description: "" });
      toast.success("Created");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const del = async (id) => {
    await api.delete(`/departments/${id}`);
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Departments</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle>New department</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit">Add</Button></div>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((d) => (
          <Card key={d._id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{d.name}</div>
                {d.description && <div className="text-xs text-muted-foreground">{d.description}</div>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(d._id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
