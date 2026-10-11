import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTczNjgsImV4cCI6MjEwNjA5MzM2OH0.poqkou0F9t5ZhZDRYmu_Zi1tneFTNStUHnSmtM1MCIE'
);

async function check() {
  console.log('--- Checking marketplace_items ---');
  const { data: items, error: itemsError } = await supabase.from('marketplace_items').select('*');
  console.log("Items Error:", itemsError);
  console.log("Items Count:", items ? items.length : 0);
  console.log("Items:", items);

  console.log('--- Checking marketplace_listings ---');
  const { data: listings, error: listingsError } = await supabase.from('marketplace_listings').select('*');
  console.log("Listings Error:", listingsError);
  console.log("Listings Count:", listings ? listings.length : 0);
  console.log("Listings:", listings);
}

check();
