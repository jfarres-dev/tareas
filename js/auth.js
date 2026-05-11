// ============================================================
// Auth: login, register, logout, session
// ============================================================

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function register(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

function onAuthStateChange(callback) {
  supabaseClient.auth.onAuthStateChange((_event, session) => callback(session));
}
