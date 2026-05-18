import { supabaseAdmin } from '../src/services/supabase.js';

async function createBucket() {
  const bucketName = process.env.STORAGE_BUCKET || 'creative-brain-assets';
  console.log(`Checking/Creating bucket: ${bucketName}...`);
  
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  
  if (listError) {
    console.error('Failed to list buckets:', listError);
    return;
  }

  const exists = buckets.some(b => b.name === bucketName);

  if (exists) {
    console.log(`Bucket "${bucketName}" already exists!`);
    return;
  }

  const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  });

  if (error) {
    console.error('Failed to create bucket:', error);
  } else {
    console.log(`Bucket "${bucketName}" successfully created!`, data);
  }
}

createBucket().catch(console.error);
