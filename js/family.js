// ============================================================
// Family — perfiles, núcleo familiar, invitaciones
// ============================================================

async function ensureProfile(user) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  // Red de seguridad: el trigger on_auth_user_created debería haberlo creado
  const name = (user.user_metadata && user.user_metadata.name) || (user.email || '').split('@')[0];
  const { data: created, error: insErr } = await supabaseClient
    .from('profiles')
    .insert([{ id: user.id, name: name }])
    .select()
    .single();
  if (insErr) throw insErr;
  return created;
}

async function fetchMyFamily(userId) {
  const { data, error } = await supabaseClient
    .from('family_members')
    .select('family_id, role, families(id, name)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.families) return null;
  return { id: data.families.id, name: data.families.name, role: data.role };
}

async function fetchFamilyMembers(familyId) {
  const { data, error } = await supabaseClient
    .from('family_members')
    .select('user_id, role, joined_at, profiles(id, name, color)')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return data.map(function(row) {
    return {
      id: row.user_id,
      role: row.role,
      name: (row.profiles && row.profiles.name) || '?',
      color: row.profiles ? row.profiles.color : null,
    };
  });
}

async function createFamily(name) {
  const { data, error } = await supabaseClient.rpc('create_family', { family_name: name });
  if (error) throw error;
  return data;
}

async function joinFamilyWithCode(code) {
  const { data, error } = await supabaseClient.rpc('join_family_with_code', { invite_code: code });
  if (error) throw error;
  return data;
}

async function createFamilyInvite() {
  const { data, error } = await supabaseClient.rpc('create_family_invite');
  if (error) throw error;
  return data; // { code, expires_at }
}

async function updateProfile(userId, { name, color }) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .update({ name: name, color: color || null })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function leaveFamily(userId) {
  const { error } = await supabaseClient
    .from('family_members')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// Color de avatar: el elegido en el perfil o uno determinista según el uid
function memberColor(profile) {
  if (profile && profile.color && colorById(profile.color).id === profile.color) return profile.color;
  var uid = (profile && profile.id) || '';
  var hash = 0;
  for (var i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return HABIT_COLORS[hash % HABIT_COLORS.length].id;
}

// Mensajes de error de los RPCs → español
function familyErrorMessage(err) {
  var msg = (err && err.message) || '';
  if (!navigator.onLine || /Failed to fetch|NetworkError|abort/i.test(msg)) {
    return 'Sin conexión. Comprueba tu red e inténtalo de nuevo.';
  }
  if (msg.indexOf('ALREADY_IN_FAMILY') !== -1) return 'Ya perteneces a una familia';
  if (msg.indexOf('INVALID_CODE') !== -1) return 'Código no válido o caducado';
  if (msg.indexOf('NOT_IN_FAMILY') !== -1) return 'No perteneces a ninguna familia';
  if (msg.indexOf('INVALID_NAME') !== -1) return 'Pon un nombre a la familia';
  return 'Algo ha fallado. Inténtalo de nuevo.';
}
