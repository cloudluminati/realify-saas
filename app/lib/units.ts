/**
 * ==========================
 * REALIFY UNIT SYSTEM (DB-BACKED)
 * ==========================
 * Source of truth: Supabase
 * Table: subscriptions
 * Units deducted ONLY after success
 */

import { createClient } from '@supabase/supabase-js';

export type Plan = 'starter' | 'creator' | 'pro';

/**
 * 🔑 SUPABASE CLIENT (SERVER ONLY)
 * Uses service role (never exposed)
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 💰 UNIT COSTS PER GENERATION
 */
export const UNIT_COSTS = {
  nano: 10,
  gpt: {
    low: 2,
    medium: 6,
    auto: 10,
    high: 10,
  },
};

/**
 * 📦 GET ACTIVE SUBSCRIPTION
 * (Temporary: first active row)
 */
async function getActiveSubscription() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('❌ No active subscription found:', error);
    return null;
  }

  return data;
}

/**
 * ✅ CHECK IF USER CAN CONSUME UNITS
 */
export async function canConsume(units: number): Promise<boolean> {
  const sub = await getActiveSubscription();
  if (!sub) return false;

  return sub.units_remaining >= units;
}

/**
 * 💸 CONSUME UNITS (CALL ONLY AFTER SUCCESS)
 */
export async function consume(units: number) {
  const sub = await getActiveSubscription();
  if (!sub) return;

  const newRemaining = Math.max(sub.units_remaining - units, 0);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      units_remaining: newRemaining,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  if (error) {
    console.error('❌ Failed to deduct units:', error);
  } else {
    console.log('🔻 Units deducted:', units, '→ remaining:', newRemaining);
  }
}

/**
 * 📊 GET REMAINING UNITS
 */
export async function getRemaining(): Promise<number> {
  const sub = await getActiveSubscription();
  return sub ? sub.units_remaining : 0;
}

