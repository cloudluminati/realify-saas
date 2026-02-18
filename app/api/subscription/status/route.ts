import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan, units_remaining, created_at')
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false });

  // ❌ No subscription at all
  if (error || !data || data.length === 0) {
    return NextResponse.json({ status: 'no_plan' });
  }

  // ✅ Find the most recent usable subscription
  const valid = data.find(
    (sub) => sub.units_remaining === null || sub.units_remaining > 0
  );

  if (!valid) {
    return NextResponse.json({ status: 'limit_reached' });
  }

  // ✅ Active + expose plan
  return NextResponse.json({
    status: 'active',
    plan: valid.plan,
  });
}

