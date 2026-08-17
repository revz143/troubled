import { AppShell } from "@/components/AppShell";
import { getFinanceSnapshot } from "@/lib/data/finance";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getFinanceSnapshot();
  return (
    <AppShell displayName={snapshot.profile.displayName} isDemo={snapshot.isDemo}>
      {children}
    </AppShell>
  );
}
