import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { todayInTimeZone } from "@/lib/dates";
import { parseMoneyToCentavos } from "@/lib/money";
import { buildForecast } from "@/lib/forecast/engine";
import type { ForecastInput } from "@/lib/forecast/types";
import { getDemoSnapshot } from "@/lib/data/mock";

export async function getFinanceSnapshot(options: { horizonMonths?: 3 | 6 | 12; scenarioMonthlyIncome?: number } = {}) {
  const horizonMonths = options.horizonMonths ?? 6;
  const scenarioMonthlyIncome = options.scenarioMonthlyIncome ?? 0;

  if (!isSupabaseConfigured()) {
    return getDemoSnapshot(horizonMonths, scenarioMonthlyIncome);
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect("/login");

  const [
    profileResult,
    settingsResult,
    accountsResult,
    obligationsResult,
    debtDetailsResult,
    incomeSourcesResult,
    incomeEntriesResult,
    transactionsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("finance_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("obligations").select("*").eq("user_id", user.id).order("due_day"),
    supabase.from("debt_details").select("*"),
    supabase.from("income_sources").select("*").eq("user_id", user.id).order("next_expected_date"),
    supabase.from("income_entries").select("*").eq("user_id", user.id).order("expected_date"),
    supabase.from("transactions").select("*").eq("user_id", user.id).order("occurred_date"),
  ]);

  const settings = settingsResult.data ?? {
    currency: "PHP",
    timezone: "Asia/Manila",
    reminder_lead_days: 7,
    privacy_mode: false,
  };
  const today = todayInTimeZone(settings.timezone);
  const debtByObligation = new Map((debtDetailsResult.data ?? []).map((debt) => [debt.obligation_id, debt]));
  const accounts = accountsResult.data ?? [];
  const transactions = transactionsResult.data ?? [];
  const availableCash = accounts.reduce((sum, account) => sum + parseMoneyToCentavos(account.opening_balance), 0) +
    transactions.reduce((sum, transaction) => {
      const amount = parseMoneyToCentavos(transaction.amount);
      return sum + (transaction.direction === "credit" ? amount : -amount);
    }, 0);

  const forecastInput: ForecastInput = {
    today,
    timezone: settings.timezone,
    horizonMonths,
    scenarioMonthlyIncome,
    availableCash,
    obligations: (obligationsResult.data ?? []).filter((item) => item.is_active).map((item) => {
      const debt = debtByObligation.get(item.id);
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        amount: parseMoneyToCentavos(item.scheduled_amount),
        startDate: item.start_date,
        endDate: item.end_date,
        dueDay: item.due_day,
        frequency: item.frequency,
        remainingPrincipal: debt ? parseMoneyToCentavos(debt.remaining_principal) : undefined,
        manualPayoffDate: debt?.manual_payoff_date ?? null,
      };
    }),
    incomeSources: (incomeSourcesResult.data ?? []).filter((item) => item.is_active).map((item) => ({
      id: item.id,
      name: item.name,
      amount: parseMoneyToCentavos(item.amount),
      startDate: item.start_date,
      endDate: item.end_date,
      nextExpectedDate: item.next_expected_date,
      frequency: item.frequency,
    })),
    incomeEntries: (incomeEntriesResult.data ?? []).map((item) => ({
      id: item.id,
      amount: parseMoneyToCentavos(item.amount),
      expectedDate: item.expected_date,
      receivedDate: item.received_date,
      status: item.status,
      note: item.source_note ?? "",
    })),
    postedTransactions: transactions.map((item) => ({
      id: item.id,
      amount: parseMoneyToCentavos(item.amount),
      direction: item.direction,
      occurredDate: item.occurred_date,
      transactionType: item.transaction_type,
      obligationId: item.obligation_id,
      incomeEntryId: item.income_entry_id,
    })),
  };

  return {
    profile: { displayName: profileResult.data?.display_name ?? user.email ?? "Hinga" },
    settings: {
      currency: settings.currency,
      timezone: settings.timezone,
      reminderLeadDays: settings.reminder_lead_days,
      privacyMode: settings.privacy_mode,
    },
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      accountType: account.account_type,
      balance: parseMoneyToCentavos(account.opening_balance),
    })),
    obligations: forecastInput.obligations,
    incomeSources: forecastInput.incomeSources,
    incomeEntries: forecastInput.incomeEntries,
    availableCash,
    totalDebt: forecastInput.obligations.reduce((sum, item) => sum + (item.remainingPrincipal ?? 0), 0),
    forecast: buildForecast(forecastInput),
    isDemo: false,
  };
}
