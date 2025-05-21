
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docRef = db.collection("orders").doc(params.id);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const orderData = doc.data();
  if (user.role === "driver" && orderData.driver_id !== user.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const itemsSnapshot = await docRef.collection("items").get();
  const items = itemsSnapshot.docs.map(doc => doc.data());

  const statusSnapshot = await docRef.collection("status_history").get();
  const status_history = statusSnapshot.docs.map(doc => doc.data());

  const podSnapshot = await docRef.collection("proof_of_delivery").get();
  const pod = podSnapshot.empty ? null : podSnapshot.docs[0].data();

  return NextResponse.json({
    ...orderData,
    id: doc.id,
    items,
    status_history,
    proof_of_delivery: pod,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const docRef = db.collection("orders").doc(params.id);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const currentData = doc.data();
  if (user.role === "driver" && currentData.driver_id !== user.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: any = {};
  if (body.status && body.status !== currentData.status) updates.status = body.status;
  if (body.driver_id !== undefined && body.driver_id !== currentData.driver_id) {
    if (user.role !== "admin" && user.role !== "dispatcher") {
      return NextResponse.json({ error: "Unauthorized to assign drivers" }, { status: 401 });
    }
    updates.driver_id = body.driver_id;
  }
  if (body.delivery_instructions !== undefined) updates.delivery_instructions = body.delivery_instructions;
  if (body.estimated_delivery_time !== undefined) updates.estimated_delivery_time = body.estimated_delivery_time;
  if (updates.status === "delivered") updates.actual_delivery_time = new Date().toISOString();

  await docRef.update(updates);

  if (updates.status) {
    await docRef.collection("status_history").add({
      previous_status: currentData.status,
      new_status: updates.status,
      changed_by: user.uid,
      is_driver: user.role === "driver",
      notes: body.status_notes || null,
      changed_at: new Date().toISOString()
    });
  }

  const updatedDoc = await docRef.get();
  return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
}
