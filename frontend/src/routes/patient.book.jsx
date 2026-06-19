import * as React from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/patient/book")({
  component: () => (
    <RequireAuth roles={["patient"]}>
      <BookPage />
    </RequireAuth>
  ),
});

function BookPage() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [dept, setDept] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get("/departments").then((r) => setDepartments(r.data));
    api.get("/doctors").then((r) => setDoctors(r.data));
  }, []);

  const filtered = dept ? doctors.filter((d) => d.department?._id === dept) : doctors;

  const submit = async (e) => {
    e.preventDefault();
    if (!doctorId) return toast.error("Select a doctor");
    setLoading(true);
    try {
      const { data } = await api.post("/appointments", { doctorId, date: new Date(date).toISOString(), reason });
      toast.success(`Token #${data.token.number} issued!`);
      router.navigate({ to: "/patient" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader><CardTitle>Book an appointment</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={dept} onValueChange={(v) => { setDept(v); setDoctorId(""); }}>
                <SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
                <SelectContent>
                  {filtered.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.user.name} · {d.department?.name} {d.specialty ? `· ${d.specialty}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe your symptoms briefly" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Booking..." : "Book & get token"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
