"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Payment = {
  id: string;
  user_id: string;
  amount_ngn: number;
  device_slots: number;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: { name: string | null; phone: string | null } | null;
};

export default function AdminPage() {
  const [meIsAdmin, setMeIsAdmin] = useState(false);
  const [pending, setPending] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setMsg("Sign in first.");
        setLoading(false);
        return;
      }
      const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", u.user.id).single();
      const isAdmin = !!me?.is_admin;
      setMeIsAdmin(isAdmin);
      if (!isAdmin) {
        setMsg("Not authorized.");
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("payments")
        .select("id,user_id,amount_ngn,device_slots,screenshot_url,status,created_at,profiles(name,phone)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      setPending((data as any) || []);
      setLoading(false);
    })();
  }, []);

  async function approve(p: Payment) {
    setMsg("");
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: p.id }),
    });
    if (!res.ok) {
      const t = await res.text();
      setMsg("Approve failed: " + t);
      return;
    }
    setPending((list) => list.filter((x) => x.id !== p.id));
    setMsg("Approved.");
  }

  async function reject(p: Payment) {
    await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: p.id }),
    });
    setPending((list) => list.filter((x) => x.id !== p.id));
  }

  if (loading) return <main className="p-6">Loading…</main>;
  if (!meIsAdmin) return <main className="p-6">{msg || "Not authorized."}</main>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin · Pending Payments</h1>
      {pending.length === 0 && <p>No pending payments.</p>}
      <div className="space-y-4">
        {pending.map((p) => (
          <div key={p.id} className="bg-white shadow p-4 rounded-xl">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{p.profiles?.name || p.user_id}</p>
                <p className="text-sm text-gray-500">{p.profiles?.phone}</p>
                <p className="text-sm mt-1">
                  ₦{p.amount_ngn.toLocaleString()} · {p.device_slots} device(s)
                </p>
                <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</p>
              </div>
              {p.screenshot_url && (
                <a className="underline text-blue-600" href={p.screenshot_url} target="_blank">
                  View proof
                </a>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => approve(p)} className="bg-green-600 text-white px-3 py-2 rounded">
                Approve
              </button>
              <button onClick={() => reject(p)} className="bg-red-600 text-white px-3 py-2 rounded">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </main>
  );
}
