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
    // 1. Get products from IndexedDB
    const localProducts = await getAll('products');
    
    if (localProducts.length === 0) {
      result.success = true;
      return result;
    }

    // 2. Check if products already exist in Supabase
    const { data: existingProducts } = await supabase.from('products').select('id');
    const existingIds = new Set(existingProducts?.map(p => p.id) || []);

    // 3. Migrate each product
    for (const product of localProducts) {
      try {
        // Skip if already migrated
        if (existingIds.has(product.id)) continue;

        let imageUrl = product.imageUrl || '';
        
        // If image is base64, upload to Supabase Storage
        if (product.imageUrl && product.imageUrl.startsWith('data:')) {
          const blob = await fetch(product.imageUrl).then(r => r.blob());
          const file = new File([blob], `${product.id}.jpg`, { type: 'image/jpeg' });
          const uploadedUrl = await uploadImage(file, `${product.id}-${Date.now()}.jpg`);
          if (uploadedUrl) imageUrl = uploadedUrl;
        }

        // Insert into Supabase
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
          created_at: product.createdAt || new Date().toISOString(),
        });

        if (error) throw error;
        result.migrated++;
      } catch (err) {
        result.errors.push(`Failed to migrate product ${product.name}: ${err}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(`Migration failed: ${err}`);
  }

  return result;
}

export async function migrateCustomers(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };

  try {
    const localCustomers = await getAll('customers');
    if (localCustomers.length === 0) {
      result.success = true;
      return result;
    }

    const { data: existing } = await supabase.from('customers').select('id');
    const existingIds = new Set(existing?.map(c => c.id) || []);

    for (const customer of localCustomers) {
      if (existingIds.has(customer.id)) continue;

      const { error } = await supabase.from('customers').insert({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        source: customer.source,
        created_at: customer.createdAt || new Date().toISOString(),
      });

      if (error) throw error;
      result.migrated++;
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(`Customer migration failed: ${err}`);
  }

  return result;
}

export async function migrateOrders(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };

  try {
    const localOrders = await getAll('orders');
    if (localOrders.length === 0) {
      result.success = true;
      return result;
    }

    const { data: existing } = await supabase.from('orders').select('id');
    const existingIds = new Set(existing?.map(o => o.id) || []);

    for (const order of localOrders) {
      if (existingIds.has(order.id)) continue;

      const { error } = await supabase.from('orders').insert({
        id: order.id,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        items: order.items,
        total_amount: order.totalAmount,
        discount_amount: order.discountAmount,
        payment_method: order.paymentMethod,
        notes: order.notes,
        status: order.status,
        created_at: order.createdAt || new Date().toISOString(),
      });

      if (error) throw error;
      result.migrated++;
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(`Order migration failed: ${err}`);
  }

  return result;
}

export async function migrateSettings(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };

  try {
    const localSettings = await getAll('settings');
    if (localSettings.length === 0) {
      result.success = true;
      return result;
    }

    const { data: existing } = await supabase.from('settings').select('id');
    const existingIds = new Set(existing?.map(s => s.id) || []);

    for (const setting of localSettings) {
      if (existingIds.has(setting.id)) continue;

      const { error } = await supabase.from('settings').insert({
        id: setting.id,
        default_markup: setting.defaultMarkup,
        store_name: setting.storeName,
        currency: setting.currency,
        whatsapp_number: setting.whatsappNumber,
        store_description: setting.storeDescription,
        created_at: setting.createdAt || new Date().toISOString(),
      });

      if (error) throw error;
      result.migrated++;
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(`Settings migration failed: ${err}`);
  }

  return result;
}

export async function migrateAll(): Promise<{ [key: string]: MigrateResult }> {
  const [products, customers, orders, settings] = await Promise.all([
    migrateProducts(),
    migrateCustomers(),
    migrateOrders(),
    migrateSettings(),
  ]);

  return { products, customers, orders, settings };
}
