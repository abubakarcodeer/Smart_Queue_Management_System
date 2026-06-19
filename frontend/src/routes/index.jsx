import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Activity, Clock, Users, BellRing, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartQueue — Real-time hospital queue management" },
      { name: "description", content: "Cut wait times. Tokens, live queues, and instant updates for clinics, doctors, and patients." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role) {
      const path = user.role === "doctor" ? "/doctor" : user.role === "admin" ? "/admin" : "/patient";
      router.navigate({ to: path });
    }
  }, [user, router]);

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Real-time queue updates
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              No more waiting rooms.<br />
              <span className="text-primary">Just smart queues.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Book appointments, get a live token, and know exactly when it's your turn. Doctors call patients with one click. Admins see everything.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/register">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
            </div>
          </div>

          <div className="relative">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Now serving</div>
                <div className="mt-2 text-7xl font-bold tabular-nums text-primary">#12</div>
                <div className="mt-1 text-sm text-muted-foreground">Dr. Sarah Lee · General Medicine</div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[13, 14, 15].map((n) => (
                    <div key={n} className="rounded-lg border border-border bg-muted/40 py-3">
                      <div className="text-2xl font-semibold">#{n}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">waiting</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-sm">
                  <span className="font-medium text-primary">Your token #15</span>
                  <span className="text-muted-foreground">≈ 24 min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-3">
          {[
            { icon: Clock, title: "Live waiting times", body: "Estimated wait recalculates every time the queue moves." },
            { icon: BellRing, title: "Turn-near alerts", body: "Patients get notified before their token is called." },
            { icon: Users, title: "Doctor & admin tools", body: "Call next, skip, complete — and full analytics for admins." },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> SmartQueue</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
