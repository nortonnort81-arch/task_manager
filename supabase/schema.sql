-- Paste ONLY from the next line down: no file paths, no "c:\...", no "$0" prefix.
-- Supabase Dashboard → SQL → New query. Copy from open file in your editor (Ctrl+A in schema.sql), not from terminal output.
-- Optional: create bucket "task-images" in Storage UI as public, or rely on the insert below.

-- Tasks ---------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text,
  due_at timestamptz,
  completed boolean not null default false,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_due_idx on public.tasks (user_id, due_at);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_tasks_updated_at();

-- Storage bucket (skip if you created the bucket manually in the UI)
insert into storage.buckets (id, name, public)
values ('task-images', 'task-images', true)
on conflict (id) do nothing;

-- Objects live under: {user_id}/{filename}
drop policy if exists "task_images_select" on storage.objects;
create policy "task_images_select" on storage.objects for select using (
  bucket_id = 'task-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "task_images_insert" on storage.objects;
create policy "task_images_insert" on storage.objects for insert with check (
  bucket_id = 'task-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "task_images_update" on storage.objects;
create policy "task_images_update" on storage.objects for update using (
  bucket_id = 'task-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "task_images_delete" on storage.objects;
create policy "task_images_delete" on storage.objects for delete using (
  bucket_id = 'task-images'
  and split_part(name, '/', 1) = auth.uid()::text
);
