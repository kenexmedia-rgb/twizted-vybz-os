import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { table, filters = {}, order, limit } = await req.json();
    let query = supabase.from(table).select('*');
    Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
    if (order) query = query.order(order.split('.')[0], { ascending: order.includes('asc') });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
