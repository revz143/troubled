import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { normalizeHingaBackup } from "@/lib/import/hingaBackup";
import type { Database } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("backup");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Attach a JSON backup file." }, { status: 400 });
  }

  const text = await file.text();
  const hash = createHash("sha256").update(text).digest("hex");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, message: "The backup file is not valid JSON." }, { status: 400 });
  }

  const normalized = normalizeHingaBackup(parsed);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, ...normalized });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ ok: false, message: "Sign in before importing." }, { status: 401 });

  const userId = data.user.id;
  const importedCounts = {
    obligations: normalized.obligations.length,
    incomeEntries: normalized.incomeEntries.length,
  };

  if (normalized.obligations.length) {
    const rows: Database["public"]["Tables"]["obligations"]["Insert"][] = normalized.obligations.map((item) => {
      const obligation = { ...item };
      delete obligation.remaining_principal;
      return {
        ...obligation,
        user_id: userId,
        is_active: true,
      } as Database["public"]["Tables"]["obligations"]["Insert"];
    });
    await supabase.from("obligations").insert(
      rows,
    );
  }

  if (normalized.incomeEntries.length) {
    const rows: Database["public"]["Tables"]["income_entries"]["Insert"][] = normalized.incomeEntries.map((item) => ({
      ...item,
      user_id: userId,
    } as Database["public"]["Tables"]["income_entries"]["Insert"]));
    await supabase.from("income_entries").insert(
      rows,
    );
  }

  await supabase.from("data_imports").insert({
    user_id: userId,
    source: "hinga-localstorage-json",
    file_hash: hash,
    imported_counts: importedCounts,
    warnings: normalized.warnings,
  });

  return NextResponse.json({ ok: true, importedCounts, warnings: normalized.warnings });
}
