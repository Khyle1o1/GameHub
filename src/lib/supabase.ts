import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: Set up real-time subscriptions for tables
export const subscribeToTables = (callback: (payload: any) => void) => {
  return supabase
    .channel('tables')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tables' }, 
      callback
    )
    .subscribe();
};

// Optional: Set up real-time subscriptions for orders
export const subscribeToOrders = (callback: (payload: any) => void) => {
  return supabase
    .channel('orders')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, 
      callback
    )
    .subscribe();
};

// Optional: Set up real-time subscriptions for time sessions
export const subscribeToTimeSessions = (callback: (payload: any) => void) => {
  return supabase
    .channel('time_sessions')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'time_sessions' }, 
      callback
    )
    .subscribe();
};
