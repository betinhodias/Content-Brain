import { runVisualAgent } from '../src/agents/visual-agent.js';
import { supabaseAdmin } from '../src/services/supabase.js';

async function testDirect() {
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

  console.log(`Running Visual Agent directly for pipeline ${pipeline.id}...`);
  try {
    const result = await runVisualAgent({
      pipelineId: pipeline.id,
      clientId: pipeline.client_id,
      agencyId: pipeline.agency_id,
      contentType: pipeline.content_type,
      copyOutput: pipeline.copy_output as any,
      brandContext: pipeline.clients.brand_summary,
      clientName: pipeline.clients.name,
      industry: pipeline.clients.industry,
      imageCount: 1,
    });
    console.log('Visual Agent Success! Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Visual Agent directly threw error:', err);
  }
}

testDirect().catch(console.error);
