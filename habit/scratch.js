import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = 'test.technique1234@gmail.com';
  const password = 'password123';
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: 'Test' } }
  });
  if (authErr) {
    if (authErr.message.includes('already registered')) {
        await supabase.auth.signInWithPassword({ email, password });
    } else {
        console.error('Auth error:', authErr); return;
    }
  }
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    console.log('No user'); return;
  }
  
  console.log('User id:', user.user.id);
  
  const { data, error } = await supabase
    .from('breathing_techniques')
    .insert({
      user_id: user.user.id,
      form_name: 'Test Form',
      description: 'Desc',
      breathing_element: 'Water',
      frequency: 'daily',
    })
    .select()
    .single();
    
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
  }
}

test();
