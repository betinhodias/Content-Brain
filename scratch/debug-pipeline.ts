import { supabaseAdmin } from '../src/services/supabase.js';

async function debugPipeline() {
  const { data: pipeline, error } = await supabaseAdmin
    .from('pipelines')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching pipeline:', error);
    return;
  }

  console.log('Pipeline Details:');
  console.log('ID:', pipeline.id);
  console.log('Status:', pipeline.status);
  console.log('Topic:', pipeline.topic);
  console.log('Visual Output:', JSON.stringify(pipeline.visual_output, null, 2));
  console.log('Motion Output:', JSON.stringify(pipeline.motion_output, null, 2));
  console.log('Error field:', pipeline.error);
}

debugPipeline().catch(console.error);
