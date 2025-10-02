import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // server-side only
);

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();
    if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });

    // fetch payment
    const { data: pay, error: payErr } = await supabaseAdmin
      .from("payments")
      .select("id,user_id,amount_ngn,device_slots,status,created_at")
      .eq("id", paymentId)
      .single();
    if (payErr || !pay) return new NextResponse("Payment not found", { status: 404 });
    if (pay.status !== "pending") return new NextResponse("Already processed", { status: 400 });

    // compute subscription windows: 30 days + 2-day grace
    const now = new Date();
    const startsAt = now; // start now on approval
    const endsAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const graceEnds = new Date(endsAt.getTime() + 2 * 24 * 60 * 60 * 1000);

    // mark approved
    const { error: upErr } = await supabaseAdmin
      .from("payments")
      .update({ status: "approved" })
      .eq("id", paymentId);
    if (upErr) return new NextResponse("Failed to update payment", { status: 500 });

    // create subscription row
    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: pay.user_id,
      device_slots: Math.max(1, Math.min(8, pay.device_slots)),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      grace_ends_at: graceEnds.toISOString(),
      status: "active",
    });
    if (subErr) return new NextResponse("Failed to create subscription: " + subErr.message, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse("Error: " + e.message, { status: 500 });
  }
}
