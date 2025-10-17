'use server'

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function deletePost(formData: FormData) {
  const postId = formData.get("postId") as string
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Debes iniciar sesión para eliminar posts")
  }
  
  // Verificar ownership
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("creator_id")
    .eq("id", postId)
    .single()
  
  if (fetchError || !post || post.creator_id !== user.id) {
    throw new Error("No autorizado o post no encontrado")
  }
  
  // Eliminar post
  const { error } = await supabase.from("posts").delete().eq("id", postId)
  
  if (error) {
    throw new Error(error.message)
  }
  
  revalidatePath("/dashboard/gallery")
}