import { supabase } from '@/lib/supabase';
import type { TaskRow } from '@/types/database';

const BUCKET = 'task-images';

export function getTaskImagePublicUrl(path: string | null) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadTaskImage(userId: string, taskId: string, localUri: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const extMatch = localUri.match(/\.(\w+)(?:\?|$)/);
  const ext = extMatch?.[1]?.toLowerCase() || 'jpg';
  const path = `${userId}/${taskId}.${ext}`;
  const contentType = blob.type || (ext === 'png' ? 'image/png' : 'image/jpeg');

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType,
  });
  if (error) throw error;
  return path;
}

export async function removeTaskImage(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function fetchTasks(): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('completed', { ascending: true })
    .order('due_at', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTaskById(id: string): Promise<TaskRow | null> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTask(input: {
  userId: string;
  title: string;
  notes?: string | null;
  dueAt?: Date | null;
  completed?: boolean;
}) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: input.userId,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      due_at: input.dueAt ? input.dueAt.toISOString() : null,
      completed: input.completed ?? false,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    notes: string | null;
    due_at: string | null;
    completed: boolean;
    image_path: string | null;
  }>
) {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
