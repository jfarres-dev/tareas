// ============================================================
// Supabase client initialization
// Replace these values with your own from supabase.com
// ============================================================
const SUPABASE_URL  = 'https://oyikexslcjovxzlbepgj.supabase.co';
const SUPABASE_ANON = 'sb_publishable_tFgykVe1wHYO6r-zMGmLCQ_rP2QC4vI';

// fetch con timeout: sin red o con red inestable las peticiones colgaban
// para siempre y la app se quedaba congelada. A los 15 s se abortan y el
// error llega a los catch de la app (que muestran un toast).
function fetchWithTimeout(input, init) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 15000);
  var opts = Object.assign({}, init || {}, { signal: controller.signal });
  if (init && init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', function() { controller.abort(); });
  }
  return fetch(input, opts).finally(function() { clearTimeout(timer); });
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  global: { fetch: fetchWithTimeout },
});
