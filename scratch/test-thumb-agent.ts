import { runThumbAgent } from '../src/agents/thumb-agent.js';
import { supabaseAdmin } from '../src/services/supabase.js';

async function testThumb() {
  console.log('Fetching latest completed pipeline...');
  const { data: pipeline, error } = await supabaseAdmin
    .from('pipelines')
    .select('*, clients(*)')
    .eq('status', 'completed')
    .eq('content_type', 'carousel')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !pipeline) {
    console.error('No completed pipeline found directly in DB:', error);
    return;
  }

  console.log(`Running Thumb Agent directly for pipeline ${pipeline.id}...`);
  try {
    const result = await runThumbAgent({
      pipelineId: pipeline.id,
      clientId: pipeline.client_id,
      agencyId: pipeline.agency_id,
      copyOutput: pipeline.copy_output as any,
      brandContext: pipeline.clients.brand_summary,
      clientName: pipeline.clients.name,
      industry: pipeline.clients.industry,
    });
    console.log('Thumb Agent Success! Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Thumb Agent directly threw error:', err);
  }
}

testThumb().catch(console.error);
