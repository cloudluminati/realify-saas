/**
 * ==========================
 * REALIFY UNIT SYSTEM (DB-BACKED)
 * ==========================
 * Source of truth: Supabase
 * Table: subscriptions
 * Units deducted ONLY after success
 */

import { createClient } from '@supabase/supabase-js';

/**
 * 🔑 SUPABASE CLIENT (SERVER ONLY)
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
 * 📦 GET USER SUBSCRIPTION
 */
async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error('❌ No active subscription found:', error);
    return null;
  }

  return data;
}

/**
 * ✅ CHECK IF USER CAN CONSUME UNITS
 */
export async function canConsume(
  userId: string,
  units: number
): Promise<boolean> {

  const sub = await getUserSubscription(userId);
  if (!sub) return false;

  return sub.units_remaining >= units;
}

/**
 * 💸 CONSUME UNITS (CALL ONLY AFTER SUCCESS)
 */
export async function consume(
  userId: string,
  units: number
) {

  const sub = await getUserSubscription(userId);
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
    console.log(
      '🔻 Units deducted:',
      units,
      '→ remaining:',
      newRemaining
    );
  }
}
