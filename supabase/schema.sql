-- Scoreboard for the Sweet 16 quiz.
-- The public web page holds only a publishable key. Both tables are closed to
-- it; everything goes through the four functions below.

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 40),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  answers jsonb not null default '{}'::jsonb   -- { "<question id>": <option index> }
);
alter table public.quiz_attempts enable row level security;
revoke all on table public.quiz_attempts from anon, authenticated;

-- One row holding the SHA-256 of the scoreboard passcode (set separately).
create table public.quiz_admin (
  id boolean primary key default true check (id),
  passcode_sha256 text not null
);
alter table public.quiz_admin enable row level security;
revoke all on table public.quiz_admin from anon, authenticated;

create function public.quiz_start(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_name, '')), 40);
  v_id uuid;
begin
  if v_name = '' then raise exception 'name required'; end if;
  if (select count(*) from public.quiz_attempts) >= 5000 then raise exception 'scoreboard full'; end if;
  insert into public.quiz_attempts (player_name) values (v_name) returning id into v_id;
  return v_id;
end $$;

-- Saves progress. An attempt is frozen once it has been marked completed.
create function public.quiz_save(p_id uuid, p_answers jsonb, p_completed boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or pg_column_size(p_answers) > 1000 then
    raise exception 'bad answers';
  end if;
  update public.quiz_attempts
     set answers = p_answers,
         updated_at = now(),
         completed_at = case when p_completed then now() end
   where id = p_id and completed_at is null;
end $$;

create function public.quiz_check_passcode(p_passcode text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.quiz_admin
     where passcode_sha256 = encode(sha256(convert_to(coalesce(p_passcode, ''), 'UTF8')), 'hex')
  ) then
    perform pg_sleep(1);
    raise exception 'wrong passcode';
  end if;
end $$;

create function public.quiz_results(p_passcode text)
returns setof public.quiz_attempts language plpgsql security definer set search_path = '' as $$
begin
  perform public.quiz_check_passcode(p_passcode);
  return query select * from public.quiz_attempts order by started_at desc;
end $$;

create function public.quiz_delete(p_passcode text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.quiz_check_passcode(p_passcode);
  delete from public.quiz_attempts where id = p_id;
end $$;

revoke execute on function public.quiz_start(text), public.quiz_save(uuid, jsonb, boolean),
  public.quiz_check_passcode(text), public.quiz_results(text), public.quiz_delete(text, uuid) from public, anon, authenticated;
grant execute on function public.quiz_start(text), public.quiz_save(uuid, jsonb, boolean),
  public.quiz_results(text), public.quiz_delete(text, uuid) to anon, authenticated;
