// ============================================================
// Shopping — lista de la compra compartida
// ============================================================

const SHOP_CATEGORIES = [
  { id: 'frutas',    label: 'Frutas y verduras', icon: 'apple' },
  { id: 'lacteos',   label: 'Lácteos',           icon: 'milk'  },
  { id: 'panaderia', label: 'Panadería',         icon: 'bread' },
  { id: 'limpieza',  label: 'Limpieza',          icon: 'spray' },
  { id: 'otros',     label: 'Otros',             icon: 'box'   },
];

function shopCategoryById(id) {
  return SHOP_CATEGORIES.find(function(c) { return c.id === id; }) || SHOP_CATEGORIES[SHOP_CATEGORIES.length - 1];
}

async function fetchShoppingItems(familyId) {
  const { data, error } = await supabaseClient
    .from('shopping_items')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function addShoppingItem({ familyId, name, qty, category, addedBy }) {
  const { data, error } = await supabaseClient
    .from('shopping_items')
    .insert([{
      family_id: familyId,
      name: name,
      qty: qty || null,
      category: category || 'otros',
      added_by: addedBy,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function toggleShoppingItem(id, checked) {
  const { data, error } = await supabaseClient
    .from('shopping_items')
    .update({ checked: checked })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function clearCheckedItems(familyId) {
  const { error } = await supabaseClient
    .from('shopping_items')
    .delete()
    .eq('family_id', familyId)
    .eq('checked', true);
  if (error) throw error;
}
