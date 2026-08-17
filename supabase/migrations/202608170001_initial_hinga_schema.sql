create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'PHP' check (currency in ('PHP')),
  timezone text not null default 'Asia/Manila',
  reminder_lead_days integer not null default 7 check (reminder_lead_days between 0 and 60),
  privacy_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  account_type text not null check (account_type in ('cash', 'bank', 'e_wallet')),
  opening_balance numeric(14,2) not null default 0,
  balance_as_of date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('debt', 'credit_card', 'bill', 'family_support', 'budget')),
  name text not null check (length(trim(name)) > 0),
  scheduled_amount numeric(14,2) not null check (scheduled_amount >= 0),
  start_date date not null,
  end_date date,
  due_day integer not null check (due_day between 1 and 31),
  frequency text not null default 'monthly' check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint obligations_end_after_start check (end_date is null or end_date >= start_date)
);

create table public.debt_details (
  obligation_id uuid primary key references public.obligations(id) on delete cascade,
  original_balance numeric(14,2) not null check (original_balance >= 0),
  remaining_principal numeric(14,2) not null check (remaining_principal >= 0),
  apr numeric(7,4) check (apr is null or apr >= 0),
  minimum_payment numeric(14,2) check (minimum_payment is null or minimum_payment >= 0),
  manual_payoff_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(14,2) not null check (amount >= 0),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date date not null,
  end_date date,
  next_expected_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint income_sources_end_after_start check (end_date is null or end_date >= start_date)
);

create table public.scheduled_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obligation_id uuid references public.obligations(id) on delete cascade,
  income_source_id uuid references public.income_sources(id) on delete cascade,
  occurrence_date date not null,
  status text not null default 'planned' check (status in ('planned', 'posted', 'skipped', 'cancelled')),
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_occurrences_one_parent check (
    num_nonnulls(obligation_id, income_source_id) = 1
  )
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  direction text not null check (direction in ('credit', 'debit')),
  transaction_type text not null check (length(trim(transaction_type)) > 0),
  occurred_date date not null,
  description text,
  obligation_id uuid references public.obligations(id) on delete set null,
  income_source_id uuid references public.income_sources(id) on delete set null,
  income_entry_id uuid,
  scheduled_occurrence_id uuid references public.scheduled_occurrences(id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  income_source_id uuid references public.income_sources(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  expected_date date not null,
  received_date date,
  source_note text,
  status text not null default 'expected' check (status in ('expected', 'received', 'cancelled')),
  transaction_id uuid unique references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint income_entries_received_date_required check (
    (status = 'received' and received_date is not null) or status <> 'received'
  )
);

alter table public.transactions
  add constraint transactions_income_entry_fk
  foreign key (income_entry_id) references public.income_entries(id) on delete set null
  deferrable initially deferred;

create table public.data_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  file_hash text,
  imported_counts jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create unique index transactions_user_idempotency_key_unique
  on public.transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create unique index scheduled_occurrences_user_idempotency_key_unique
  on public.scheduled_occurrences (user_id, idempotency_key)
  where idempotency_key is not null;

create index accounts_user_id_idx on public.accounts (user_id);
create index accounts_user_active_idx on public.accounts (user_id, is_active);
create index obligations_user_id_idx on public.obligations (user_id);
create index obligations_user_active_idx on public.obligations (user_id, is_active);
create index obligations_user_dates_idx on public.obligations (user_id, start_date, end_date);
create index debt_details_obligation_id_idx on public.debt_details (obligation_id);
create index income_sources_user_id_idx on public.income_sources (user_id);
create index income_sources_user_active_idx on public.income_sources (user_id, is_active);
create index income_sources_user_dates_idx on public.income_sources (user_id, start_date, end_date);
create index income_entries_user_id_idx on public.income_entries (user_id);
create index income_entries_user_expected_date_idx on public.income_entries (user_id, expected_date);
create index income_entries_income_source_id_idx on public.income_entries (income_source_id);
create index scheduled_occurrences_user_date_idx on public.scheduled_occurrences (user_id, occurrence_date);
create index scheduled_occurrences_obligation_id_idx on public.scheduled_occurrences (obligation_id);
create index scheduled_occurrences_income_source_id_idx on public.scheduled_occurrences (income_source_id);
create index transactions_user_occurred_date_idx on public.transactions (user_id, occurred_date);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_obligation_id_idx on public.transactions (obligation_id);
create index transactions_income_source_id_idx on public.transactions (income_source_id);
create index transactions_income_entry_id_idx on public.transactions (income_entry_id);
create index transactions_scheduled_occurrence_id_idx on public.transactions (scheduled_occurrence_id);
create index data_imports_user_id_idx on public.data_imports (user_id);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger finance_settings_set_updated_at before update on public.finance_settings
  for each row execute function public.set_updated_at();
create trigger accounts_set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger obligations_set_updated_at before update on public.obligations
  for each row execute function public.set_updated_at();
create trigger debt_details_set_updated_at before update on public.debt_details
  for each row execute function public.set_updated_at();
create trigger income_sources_set_updated_at before update on public.income_sources
  for each row execute function public.set_updated_at();
create trigger income_entries_set_updated_at before update on public.income_entries
  for each row execute function public.set_updated_at();
create trigger scheduled_occurrences_set_updated_at before update on public.scheduled_occurrences
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.finance_settings enable row level security;
alter table public.accounts enable row level security;
alter table public.obligations enable row level security;
alter table public.debt_details enable row level security;
alter table public.income_sources enable row level security;
alter table public.income_entries enable row level security;
alter table public.scheduled_occurrences enable row level security;
alter table public.transactions enable row level security;
alter table public.data_imports enable row level security;

create policy profiles_owner_all on public.profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy finance_settings_owner_all on public.finance_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy accounts_owner_all on public.accounts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy obligations_owner_all on public.obligations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy income_sources_owner_all on public.income_sources
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy income_entries_owner_all on public.income_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy scheduled_occurrences_owner_all on public.scheduled_occurrences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transactions_owner_all on public.transactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy data_imports_owner_all on public.data_imports
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy debt_details_owner_select on public.debt_details
  for select to authenticated using (
    exists (select 1 from public.obligations o where o.id = obligation_id and o.user_id = auth.uid())
  );
create policy debt_details_owner_insert on public.debt_details
  for insert to authenticated with check (
    exists (select 1 from public.obligations o where o.id = obligation_id and o.user_id = auth.uid())
  );
create policy debt_details_owner_update on public.debt_details
  for update to authenticated using (
    exists (select 1 from public.obligations o where o.id = obligation_id and o.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.obligations o where o.id = obligation_id and o.user_id = auth.uid())
  );
create policy debt_details_owner_delete on public.debt_details
  for delete to authenticated using (
    exists (select 1 from public.obligations o where o.id = obligation_id and o.user_id = auth.uid())
  );
