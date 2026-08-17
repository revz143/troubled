import { NextResponse } from "next/server";
import { getFinanceSnapshot } from "@/lib/data/finance";

export async function GET() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 12 });
  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      settings: snapshot.settings,
      accounts: snapshot.accounts,
      obligations: snapshot.obligations,
      incomeSources: snapshot.incomeSources,
      incomeEntries: snapshot.incomeEntries,
    },
    {
      headers: {
        "content-disposition": "attachment; filename=hinga-export.json",
      },
    },
  );
}
