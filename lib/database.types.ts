export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone: string
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      driver_locations: {
        Row: {
          id: number
          driver_id: number
          latitude: number
          longitude: number
          accuracy: number | null
          created_at: string
        }
        Insert: {
          id?: number
          driver_id: number
          latitude: number
          longitude: number
          accuracy?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          driver_id?: number
          latitude?: number
          longitude?: number
          accuracy?: number | null
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string | null
          password_hash: string | null
          vehicle: string | null
          license_plate: string | null
          rating: number | null
          status: "available" | "busy" | "offline"
          created_at: string
          updated_at: string
          last_location_lat: number | null
          last_location_lng: number | null
          last_location_updated_at: string | null
          fcm_token: string | null
          active_order_id: number | null
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone?: string | null
          password_hash?: string | null
          vehicle?: string | null
          license_plate?: string | null
          rating?: number | null
          status?: "available" | "busy" | "offline"
          created_at?: string
          updated_at?: string
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_updated_at?: string | null
          fcm_token?: string | null
          active_order_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string | null
          password_hash?: string | null
          vehicle?: string | null
          license_plate?: string | null
          rating?: number | null
          status?: "available" | "busy" | "offline"
          created_at?: string
          updated_at?: string
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_updated_at?: string | null
          fcm_token?: string | null
          active_order_id?: number | null
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          item_name: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          item_name: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          item_name?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: number
          order_id: number
          previous_status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled" | null
          new_status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
          changed_by: number
          is_driver: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          previous_status?: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled" | null
          new_status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
          changed_by: number
          is_driver: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          previous_status?: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled" | null
          new_status?: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
          changed_by?: number
          is_driver?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          customer_id: number
          driver_id: number | null
          status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
          total: number
          delivery_address: string
          delivery_instructions: string | null
          estimated_delivery_time: string | null
          actual_delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          customer_id: number
          driver_id?: number | null
          status?: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
          total: number
          delivery_address: string
          delivery_instructions?: string | null
          estimated_delivery_time?: string | null
          actual_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          customer_id?: number
          driver_id?: number | null
          status?: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
          total?: number
          delivery_address?: string
          delivery_instructions?: string | null
          estimated_delivery_time?: string | null
          actual_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      proof_of_delivery: {
        Row: {
          id: number
          order_id: number
          driver_id: number
          pod_type: "signature" | "photo" | "code"
          pod_data: string
          notes: string | null
          location_lat: number | null
          location_lng: number | null
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          driver_id: number
          pod_type: "signature" | "photo" | "code"
          pod_data: string
          notes?: string | null
          location_lat?: number | null
          location_lng?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          driver_id?: number
          pod_type?: "signature" | "photo" | "code"
          pod_data?: string
          notes?: string | null
          location_lat?: number | null
          location_lng?: number | null
          created_at?: string
        }
      }
      refresh_tokens: {
        Row: {
          id: number
          user_id: number | null
          driver_id: number | null
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: number | null
          driver_id?: number | null
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number | null
          driver_id?: number | null
          token?: string
          expires_at?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: number
          email: string
          password_hash: string
          name: string
          role: string
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: number
          email: string
          password_hash: string
          name: string
          role: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: number
          email?: string
          password_hash?: string
          name?: string
          role?: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
    }
    Enums: {
      driver_status: "available" | "busy" | "offline"
      order_status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
      pod_type: "signature" | "photo" | "code"
    }
  }
}
