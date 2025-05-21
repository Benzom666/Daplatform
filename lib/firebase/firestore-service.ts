"use client"

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  GeoPoint,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase-config"

// Driver location service
export const driverLocationService = {
  // Update driver location
  updateDriverLocation: async (driverId: string, latitude: number, longitude: number) => {
    try {
      const driverRef = doc(db, "drivers", driverId)
      await updateDoc(driverRef, {
        lastLocation: new GeoPoint(latitude, longitude),
        lastLocationUpdatedAt: serverTimestamp(),
      })

      // Also add to location history
      await addDoc(collection(db, "driver_locations"), {
        driverId,
        location: new GeoPoint(latitude, longitude),
        timestamp: serverTimestamp(),
        accuracy: null,
      })

      return { success: true }
    } catch (error: any) {
      console.error("Error updating driver location:", error)
      return { success: false, error: error.message }
    }
  },

  // Get driver's current location
  getDriverLocation: async (driverId: string) => {
    try {
      const driverRef = doc(db, "drivers", driverId)
      const driverSnap = await getDoc(driverRef)

      if (driverSnap.exists()) {
        const data = driverSnap.data()
        return {
          success: true,
          location: data.lastLocation,
          updatedAt: data.lastLocationUpdatedAt,
        }
      } else {
        return { success: false, error: "Driver not found" }
      }
    } catch (error: any) {
      console.error("Error getting driver location:", error)
      return { success: false, error: error.message }
    }
  },
}

// Order service
export const orderService = {
  // Get all orders
  getOrders: async () => {
    try {
      const ordersRef = collection(db, "orders")
      const q = query(ordersRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return { success: true, orders }
    } catch (error: any) {
      console.error("Error getting orders:", error)
      return { success: false, error: error.message }
    }
  },

  // Get order by ID
  getOrderById: async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (orderSnap.exists()) {
        return {
          success: true,
          order: {
            id: orderSnap.id,
            ...orderSnap.data(),
          },
        }
      } else {
        return { success: false, error: "Order not found" }
      }
    } catch (error: any) {
      console.error("Error getting order:", error)
      return { success: false, error: error.message }
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        return { success: false, error: "Order not found" }
      }

      const previousStatus = orderSnap.data().status

      // Update order status
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      })

      // Add to status history
      await addDoc(collection(db, "order_status_history"), {
        orderId,
        previousStatus,
        newStatus: status,
        notes: notes || "",
        createdAt: serverTimestamp(),
      })

      return { success: true }
    } catch (error: any) {
      console.error("Error updating order status:", error)
      return { success: false, error: error.message }
    }
  },
}

// Proof of Delivery service
export const podService = {
  // Add proof of delivery
  addProofOfDelivery: async (
    orderId: string,
    driverId: string,
    podType: string,
    podData: string,
    latitude?: number,
    longitude?: number,
    notes?: string,
  ) => {
    try {
      await addDoc(collection(db, "proof_of_delivery"), {
        orderId,
        driverId,
        podType,
        podData,
        notes: notes || "",
        location: latitude && longitude ? new GeoPoint(latitude, longitude) : null,
        createdAt: serverTimestamp(),
      })

      return { success: true }
    } catch (error: any) {
      console.error("Error adding proof of delivery:", error)
      return { success: false, error: error.message }
    }
  },

  // Get proof of delivery for an order
  getProofOfDelivery: async (orderId: string) => {
    try {
      const podRef = collection(db, "proof_of_delivery")
      const q = query(podRef, where("orderId", "==", orderId))
      const querySnapshot = await getDocs(q)

      const pods = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return { success: true, pods }
    } catch (error: any) {
      console.error("Error getting proof of delivery:", error)
      return { success: false, error: error.message }
    }
  },
}
