import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarPlus } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/patient/")({
  component: () => (
    <RequireAuth roles={["patient"]}>
      <PatientDashboard />
    </RequireAuth>
  ),
});

function PatientDashboard() {
  const { data: appointments = [], refetch } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => (await api.get("/appointments/me")).data,
  });

  const upcoming = useMemo(() =>
    appointments.filter((a) => ["booked", "in_progress"].includes(a.status)),
    [appointments]
  );

  const [activeDoctorId, setActiveDoctorId] = useState(null);
  const [nextApptDate, setNextApptDate] = useState(null);

  useEffect(() => {
    if (upcoming.length > 0) {
      const today = new Date().toLocaleDateString("en-CA");
      const todayAppt = upcoming.find((a) =>
        new Date(a.date).toLocaleDateString("en-CA").startsWith(today)
      );
      setActiveDoctorId(todayAppt?.doctor?._id || null);
      setNextApptDate(new Date(upcoming[0].date).toLocaleDateString());
    } else {
      setActiveDoctorId(null);
      setNextApptDate(null);
    }
  }, [upcoming]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live updates · no refresh needed
          </p>
        </div>
        <Button asChild>
          <Link to="/patient/book">
            <CalendarPlus className="mr-2 h-4 w-4" /> Book appointment
          </Link>
        </Button>
      </div>

      {activeDoctorId ? (
        <LiveQueueCard doctorId={activeDoctorId} onChange={refetch} />
      ) : upcoming.length > 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No queue for today
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your next appointment is on{" "}
              <span className="font-medium text-foreground">
                {nextApptDate}
              </span>
              .
            </p>
            <p className="text-sm text-muted-foreground">
              The live queue will appear here on that day.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No active appointments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Book one to get your live token.
            </p>
            <Button asChild className="mt-4">
              <Link to="/patient/book">Book now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Upcoming</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          )}
          {upcoming.map((a) => (
            <Card key={a._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{a.doctor?.user?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.doctor?.department?.name} ·{" "}
                    {new Date(a.date).toLocaleString()}
                  </div>
                </div>
                <Badge
                  variant={a.status === "in_progress" ? "default" : "secondary"}
                >
                  {a.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveQueueCard({ doctorId, onChange }) {
  const [data, setData] = useState(null);
  const user = useAuthStore((s) => s.user);

  const fetchQueue = async () => {
    try {
      const r = await api.get(`/queue/${doctorId}`);
      setData(r.data);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const s = getSocket();
    s.emit("join:queue", { doctorId });
    const handler = () => {
      fetchQueue();
      onChange();
    };
    s.on("queue:update", handler);
    return () => {
      s.off("queue:update", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  if (!data)
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading queue…
        </CardContent>
      </Card>
    );

  const myUserId = user?._id;
  const isBeingServed = data.current?.patient?._id === myUserId;
  const myWaitingToken = data.waiting.find((w) => w.patient?._id === myUserId);
  const myToken = isBeingServed ? data.current : myWaitingToken;

  const myIndex = data.waiting.findIndex((w) => w.patient?._id === myUserId);
  const aheadOfMe = myIndex >= 0 ? myIndex : 0;
  const eta = aheadOfMe * (data.avgConsultMinutes || 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{data.doctor.user.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {data.doctor.department.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Now serving
            </div>
            <div className="mt-2 text-5xl font-bold tabular-nums text-primary">
              {data.current ? `#${data.current.number}` : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Your token
            </div>
            <div className="mt-2 text-5xl font-bold tabular-nums">
              {myToken ? `#${myToken.number}` : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-primary/5 p-6 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Estimated wait
            </div>
            <div className="mt-2 text-5xl font-bold tabular-nums text-primary">
              {isBeingServed ? (
                "Your turn!"
              ) : myWaitingToken ? (
                `${eta}m`
              ) : (
                "—"
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isBeingServed ? "In consultation" : `${aheadOfMe} ahead`}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Queue
          </div>
          <div className="flex flex-wrap gap-2">
            {data.waiting.map((w) => (
              <div
                key={w._id}
                className={`rounded-md border px-3 py-1.5 text-sm tabular-nums ${
                  w.patient?._id === myUserId
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border bg-card"
                }`}
              >
                #{w.number}
              </div>
            ))}
            {data.waiting.length === 0 && (
              <div className="text-sm text-muted-foreground">Empty</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
