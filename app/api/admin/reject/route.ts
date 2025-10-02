import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(req: Request) {
  const { paymentId } = await req.json();
  if (!paymentId) return new NextResponse("Missing paymentId", { status: 400 });

  const { error } = await supabaseAdmin
    .from("payments")
    .update({ status: "rejected" })
    .eq("id", paymentId);

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
