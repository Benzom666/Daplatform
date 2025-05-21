
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

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const driverId = searchParams.get("driver_id");
  const customerId = searchParams.get("customer_id");

  let ordersRef = db.collection("orders");
  let query = ordersRef;

  if (status) query = query.where("status", "==", status);
  if (driverId) query = query.where("driver_id", "==", driverId);
  if (customerId) query = query.where("customer_id", "==", customerId);

  const snapshot = await query.get();
  const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ data: orders });
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user || (user.role !== "admin" && user.role !== "dispatcher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.customer_id || !body.total || !body.delivery_address || !body.items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderRef = await db.collection("orders").add({
      customer_id: body.customer_id,
      driver_id: body.driver_id || null,
      status: body.status || "pending",
      total: body.total,
      delivery_address: body.delivery_address,
      delivery_instructions: body.delivery_instructions || null,
      estimated_delivery_time: body.estimated_delivery_time || null,
      created_at: new Date().toISOString()
    });

    const itemsBatch = db.batch();
    body.items.forEach(item => {
      const itemRef = db.collection("orders").doc(orderRef.id).collection("items").doc();
      itemsBatch.set(itemRef, {
        item_name: item.name,
        quantity: item.quantity,
        price: item.price
      });
    });
    await itemsBatch.commit();

    await db.collection("orders").doc(orderRef.id).collection("status_history").add({
      previous_status: null,
      new_status: body.status || "pending",
      changed_by: user.uid,
      is_driver: user.role === "driver",
      changed_at: new Date().toISOString()
    });

    return NextResponse.json({ id: orderRef.id, ...body }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
