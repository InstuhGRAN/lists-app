import { supabase } from '@/lib/supabase';

const BUCKET = 'list-backgrounds';

export async function uploadListBackgroundImage(
  userId: string,
  listId: string,
  localUri: string,
): Promise<string> {
  const path = `${userId}/${listId}-${Date.now()}.jpg`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  return path;
}

export function getListBackgroundImageUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
