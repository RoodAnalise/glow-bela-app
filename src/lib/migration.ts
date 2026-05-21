import { supabase, uploadImage } from './supabase';
import { getAll } from './localDB';

interface MigrateResult {
  success: boolean;
  migrated: number;
  errors: string[];
}

export async function migrateProducts(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };

  try {
    // 1. Pegar produtos do navegador (IndexedDB)
    const localProducts = await getAll('products');
    
    if (localProducts.length === 0) {
      result.success = true;
      return result;
    }

    // 2. Verificar o que já existe no Supabase para não duplicar
    // Nota: A tabela no banco se chama 'products' (em inglês), mesmo que o Supabase mostre traduzido.
    const { data: existingProducts } = await supabase.from('products').select('id');
    const existingIds = new Set(existingProducts?.map((p: any) => p.id) || []);

    // 3. Migrar um por um
    for (const product of localProducts) {
      try {
        if (existingIds.has(product.id)) continue;

        let imageUrl = product.imageUrl || '';
        
        // Se a imagem for base64 (texto gigante), enviar para o Storage
        if (product.imageUrl && product.imageUrl.startsWith('data:')) {
          const blob = await fetch(product.imageUrl).then(r => r.blob());
          const file = new File([blob], `${product.id}.jpg`, { type: 'image/jpeg' });
          const uploadedUrl = await uploadImage(file, `${product.id}-${Date.now()}.jpg`);
          if (uploadedUrl) imageUrl = uploadedUrl;
        }

        // 4. Inserir no Supabase usando os nomes corretos (Inglês)
        // O Supabase traduz a interface, mas o banco espera 'name', 'cost_price', etc.
        const { error } = await supabase.from('products').insert({
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          cost_price: product.costPrice,
          markup_percent: product.markupPercent,
          sell_price: product.sellPrice,
          stock_quantity: product.stockQuantity,
          discount_percent: product.discountPercent,
          image_url: imageUrl,
          // Correção: Converter timestamp numérico para ISO String
          created_at: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
        });

        if (error) throw error;
        result.migrated++;
      } catch (err: any) {
        // Log detalhado para debug
        console.error('Migration Error Detail:', JSON.stringify(err));
        result.errors.push(`Erro em ${product.name}: ${err.message || 'Verifique o console (F12)'}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (err: any) {
    result.errors.push(`Falha na migração: ${err.message || err}`);
  }

  return result;
}

export async function migrateCustomers(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };
  try {
    const localCustomers = await getAll('customers');
    if (localCustomers.length === 0) { result.success = true; return result; }
    const { data: existing } = await supabase.from('customers').select('id');
    const existingIds = new Set(existing?.map((c: any) => c.id) || []);
    for (const customer of localCustomers) {
      if (existingIds.has(customer.id)) continue;
      const { error } = await supabase.from('customers').insert({
        id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, source: customer.source, created_at: customer.createdAt || new Date().toISOString()
      });
      if (error) throw error;
      result.migrated++;
    }
    result.success = result.errors.length === 0;
  } catch (err: any) { result.errors.push(`Erro clientes: ${err.message}`); }
  return result;
}

export async function migrateOrders(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };
  try {
    const localOrders = await getAll('orders');
    if (localOrders.length === 0) { result.success = true; return result; }
    const { data: existing } = await supabase.from('orders').select('id');
    const existingIds = new Set(existing?.map((o: any) => o.id) || []);
    for (const order of localOrders) {
      if (existingIds.has(order.id)) continue;
      const { error } = await supabase.from('orders').insert({
        id: order.id, customer_name: order.customerName, customer_phone: order.customerPhone, items: order.items, total_amount: order.totalAmount, discount_amount: order.discountAmount, payment_method: order.paymentMethod, notes: order.notes, status: order.status, created_at: order.createdAt || new Date().toISOString()
      });
      if (error) throw error;
      result.migrated++;
    }
    result.success = result.errors.length === 0;
  } catch (err: any) { result.errors.push(`Erro pedidos: ${err.message}`); }
  return result;
}

export async function migrateSettings(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };
  try {
    const localSettings = await getAll('settings');
    if (localSettings.length === 0) { result.success = true; return result; }
    const { data: existing } = await supabase.from('settings').select('id');
    const existingIds = new Set(existing?.map((s: any) => s.id) || []);
    for (const setting of localSettings) {
      if (existingIds.has(setting.id)) continue;
      const { error } = await supabase.from('settings').insert({
        id: setting.id, default_markup: setting.defaultMarkup, store_name: setting.storeName, currency: setting.currency, whatsapp_number: setting.whatsappNumber, store_description: setting.storeDescription, created_at: setting.createdAt || new Date().toISOString()
      });
      if (error) throw error;
      result.migrated++;
    }
    result.success = result.errors.length === 0;
  } catch (err: any) { result.errors.push(`Erro configs: ${err.message}`); }
  return result;
}

export async function migrateAll(): Promise<{ [key: string]: MigrateResult }> {
  const [products, customers, orders, settings] = await Promise.all([
    migrateProducts(), migrateCustomers(), migrateOrders(), migrateSettings(),
  ]);
  return { products, customers, orders, settings };
}
