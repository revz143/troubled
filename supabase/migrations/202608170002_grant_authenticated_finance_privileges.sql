grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.finance_settings,
  public.accounts,
  public.obligations,
  public.debt_details,
  public.income_sources,
  public.income_entries,
  public.scheduled_occurrences,
  public.transactions,
  public.data_imports
to authenticated;
