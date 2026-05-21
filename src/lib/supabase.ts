import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgvqgffuombvaxtkjixg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndnFnZmZ1b21idmF4dGtqaXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg3NTAsImV4cCI6MjA5NDg5NDc1MH0.o0910HaQuI52xH9BzJmkLgt-vp7UTeRev8qIBGic1c0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadImage(file: File, fileName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Image upload failed:', err);
    return null;
  }
}

export async function deleteImage(fileName: string): Promise<void> {
  try {
    await supabase.storage.from('products').remove([fileName]);
  } catch (err) {
    console.error('Image delete failed:', err);
  }
}
