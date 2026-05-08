import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: 'No jobId' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  await supabase.from('disputes').delete().eq('job_id', jobId);
  await supabase.from('messages').delete().eq('job_id', jobId);
  await supabase.from('applications').delete().eq('job_id', jobId);
  await supabase.from('jobs').delete().eq('id', jobId);

  return NextResponse.json({ success: true });
}