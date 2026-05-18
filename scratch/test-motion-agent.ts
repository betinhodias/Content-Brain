import { runMotionAgent } from '../src/agents/motion-agent.js';
import { supabaseAdmin } from '../src/services/supabase.js';

async function testMotion() {
  console.log('Fetching latest completed pipeline...');
  const { data: pipeline, error } = await supabaseAdmin
    .from('pipelines')
    .select('*, clients(*)')
    .eq('status', 'completed')
    .eq('content_type', 'carousel') // Or reel, but we can test on carousel copy
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !pipeline) {
    console.error('No completed pipeline found directly in DB:', error);
    return;
  }

  // A small public test video
  const rawVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  const videoStart = 2.0;
  const videoEnd = 7.0;

  console.log(`Running Motion Agent with video curation for pipeline ${pipeline.id}...`);
  try {
    const result = await runMotionAgent({
      pipelineId: pipeline.id,
      clientId: pipeline.client_id,
      agencyId: pipeline.agency_id,
      contentType: 'reel', // Force reel to trigger vertical video rendering
      copyOutput: pipeline.copy_output as any,
      brandTone: pipeline.clients.brand_summary,
      brandColors: '#000037,#FFFFFF',
      rawVideoUrl,
      videoStart,
      videoEnd,
    });
    console.log('Motion Agent Success! Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Motion Agent threw error:', err);
  }
}

testMotion().catch(console.error);
