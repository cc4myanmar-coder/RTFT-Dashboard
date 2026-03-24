import { database } from './firebase';

export const db = database;
export const supabase = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
};
