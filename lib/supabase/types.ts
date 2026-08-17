export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { user_id: string; display_name: string | null; created_at: string; updated_at: string };
        Insert: { user_id: string; display_name?: string | null };
        Update: { display_name?: string | null; updated_at?: string };
        Relationships: [];
      };
      finance_settings: {
        Row: {
          user_id: string;
          currency: string;
          timezone: string;
          reminder_lead_days: number;
          privacy_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          currency?: string;
          timezone?: string;
          reminder_lead_days?: number;
          privacy_mode?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["finance_settings"]["Insert"]>;
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: "cash" | "bank" | "e_wallet";
          opening_balance: string;
          balance_as_of: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["accounts"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      obligations: {
        Row: {
          id: string;
          user_id: string;
          type: "debt" | "credit_card" | "bill" | "family_support" | "budget";
          name: string;
          scheduled_amount: string;
          start_date: string;
          end_date: string | null;
          due_day: number;
          frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["obligations"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["obligations"]["Insert"]>;
        Relationships: [];
      };
      debt_details: {
        Row: {
          obligation_id: string;
          original_balance: string;
          remaining_principal: string;
          apr: string | null;
          minimum_payment: string | null;
          manual_payoff_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          obligation_id: string;
          original_balance: string;
          remaining_principal: string;
          apr?: string | null;
          minimum_payment?: string | null;
          manual_payoff_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["debt_details"]["Insert"]>;
        Relationships: [];
      };
      income_sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: string;
          frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
          start_date: string;
          end_date: string | null;
          next_expected_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["income_sources"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["income_sources"]["Insert"]>;
        Relationships: [];
      };
      income_entries: {
        Row: {
          id: string;
          user_id: string;
          income_source_id: string | null;
          amount: string;
          expected_date: string;
          received_date: string | null;
          source_note: string | null;
          status: "expected" | "received" | "cancelled";
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          income_source_id?: string | null;
          amount: string;
          expected_date: string;
          received_date?: string | null;
          source_note?: string | null;
          status?: "expected" | "received" | "cancelled";
          transaction_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["income_entries"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          amount: string;
          direction: "credit" | "debit";
          transaction_type: string;
          occurred_date: string;
          description: string | null;
          obligation_id: string | null;
          income_source_id: string | null;
          income_entry_id: string | null;
          scheduled_occurrence_id: string | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          amount: string;
          direction: "credit" | "debit";
          transaction_type: string;
          occurred_date: string;
          description?: string | null;
          obligation_id?: string | null;
          income_source_id?: string | null;
          income_entry_id?: string | null;
          scheduled_occurrence_id?: string | null;
          idempotency_key?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      data_imports: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          file_hash: string | null;
          imported_counts: Json;
          warnings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          file_hash?: string | null;
          imported_counts?: Json;
          warnings?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["data_imports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
