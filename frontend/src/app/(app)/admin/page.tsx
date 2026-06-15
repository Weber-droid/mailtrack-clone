"use client";

import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export default function AdminPage() {
  const [stats, setStats] = useState<{ total_users: number; total_emails: number; total_events: number } | null>(
    null,
  );
  const [users, setUsers] = useState<Array<{ id: string; email: string; plan: string }>>([]);

  useEffect(() => {
    void apiFetch<typeof stats>("/api/admin/stats").then(setStats);
    void apiFetch<typeof users>("/api/admin/users").then(setUsers);
  }, []);

  return (
    <RequireAuth>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Admin</h1>
        {stats && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.total_users}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Emails</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.total_emails}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.total_events}</CardContent>
            </Card>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Recent users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="text-sm">
                {u.email} · {u.plan}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
