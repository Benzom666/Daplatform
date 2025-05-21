import { createClient } from "@supabase/supabase-js"
import { config } from "./config"

// Initialize Supabase client
const supabase = createClient(config.database.supabase.url, config.database.supabase.anonKey)

export const storage = {
  /**
   * Upload a file to Supabase Storage
   * @param bucket The storage bucket
   * @param path The file path
   * @param file The file to upload
   * @returns The file URL
   */
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    })

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`)
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data?.path || "")

    return publicUrl
  },

  /**
   * Delete a file from Supabase Storage
   * @param bucket The storage bucket
   * @param path The file path
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw new Error(`Error deleting file: ${error.message}`)
    }
  },
}
