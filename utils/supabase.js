import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client with environment credentials
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY in .env
 */

let supabaseClient = null;

// Lazy initialization function
const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    // Create and initialize Supabase client with timeout and retry configuration
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Disable session persistence in server
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          Connection: 'keep-alive',
        },
      },
    });

    // Add timeout wrapper for Supabase operations
    const withTimeout = (promise, timeoutMs = 10000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        ),
      ]);
    };

    // Enhanced Supabase client with error handling
    supabaseClient = {
      from: (table) => ({
        select: (columns) => ({
          then: (onFulfilled, onRejected) => {
            const query = supabase.from(table).select(columns);
            return withTimeout(query).then(onFulfilled, onRejected);
          },
          eq: (column, value) =>
            supabaseClient.wrapQuery(supabase.from(table).select(columns).eq(column, value)),
          gt: (column, value) =>
            supabaseClient.wrapQuery(supabase.from(table).select(columns).gt(column, value)),
          order: (column, options) =>
            supabaseClient.wrapQuery(supabase.from(table).select(columns).order(column, options)),
          limit: (count) =>
            supabaseClient.wrapQuery(supabase.from(table).select(columns).limit(count)),
        }),
        insert: (data) => ({
          then: (onFulfilled, onRejected) => {
            const query = supabase.from(table).insert(data);
            return withTimeout(query).then(onFulfilled, onRejected);
          },
          select: (columns) =>
            supabaseClient.wrapQuery(supabase.from(table).insert(data).select(columns)),
          eq: (column, value) =>
            supabaseClient.wrapQuery(supabase.from(table).insert(data).eq(column, value)),
          order: (column, options) =>
            supabaseClient.wrapQuery(supabase.from(table).insert(data).order(column, options)),
          limit: (count) =>
            supabaseClient.wrapQuery(supabase.from(table).insert(data).limit(count)),
          single: () => supabaseClient.wrapQuery(supabase.from(table).insert(data).single()),
        }),
        update: (data) => supabaseClient.wrapQuery(supabase.from(table).update(data)),
        delete: () => supabaseClient.wrapQuery(supabase.from(table).delete()),
      }),
      wrapQuery: (query) => ({
        then: (onFulfilled, onRejected) => {
          return withTimeout(query).then(onFulfilled, (error) => {
            console.error('Supabase query error:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            if (onRejected) return onRejected(error);
            throw error;
          });
        },
        eq: (column, value) => supabaseClient.wrapQuery(query.eq(column, value)),
        gt: (column, value) => supabaseClient.wrapQuery(query.gt(column, value)),
        order: (column, options) => supabaseClient.wrapQuery(query.order(column, options)),
        limit: (count) => supabaseClient.wrapQuery(query.limit(count)),
        single: () => supabaseClient.wrapQuery(query.single()),
        maybeSingle: () => supabaseClient.wrapQuery(query.maybeSingle()),
      }),
      auth: supabase.auth,
      storage: supabase.storage, // Add storage property
    };

    console.log('✅ Supabase client initialized successfully');
  }

  return supabaseClient;
};

// Export a proxy that lazily initializes the client
const supabaseWithTimeout = new Proxy(
  {},
  {
    get(target, prop) {
      const client = getSupabaseClient();
      return client[prop];
    },
  }
);

export default supabaseWithTimeout;
