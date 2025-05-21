
import { NextRequest, NextResponse } from "next/server";
import { db, auth } from "@/lib/firebase";

async function authenticate(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!token) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user || user.role !== "driver") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.pod_type || !body.pod_data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderRef = db.collection("orders").doc(params.id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const order = orderSnap.data();
    if (order.driver_id !== user.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const podRef = await orderRef.collection("proof_of_delivery").add({
      driver_id: user.uid,
      pod_type: body.pod_type,
      pod_data: body.pod_data,
      notes: body.notes || null,
      location_lat: body.location_lat || null,
      location_lng: body.location_lng || null,
      created_at: new Date().toISOString()
    });

    // Update order if status is not already delivered
    if (order.status !== "delivered") {
      await orderRef.update({
        status: "delivered",
        actual_delivery_time: new Date().toISOString()
      });

      await orderRef.collection("status_history").add({
        previous_status: order.status,
        new_status: "delivered",
        changed_by: user.uid,
        is_driver: true,
        notes: "Proof of delivery submitted",
        changed_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ id: podRef.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to submit proof of delivery" }, { status: 500 });
  }
}
