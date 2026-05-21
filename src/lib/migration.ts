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
    const { data: existingProducts } = await supabase.from('produtos').select('id');
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

        // 4. Inserir no Supabase usando os nomes em PORTUGUÊS
        const { error } = await supabase.from('produtos').insert({
          id: product.id,
          nome: product.name,
          descricao: product.description,
          categoria: product.category,
          preco_de_custo: product.costPrice,
          porcentagem_de_margem: product.markupPercent,
          preco_de_venda: product.sellPrice,
          quantidade_em_estoque: product.stockQuantity,
          porcentagem_de_desconto: product.discountPercent,
          url_da_imagem: imageUrl,
          criado_em: product.createdAt || new Date().toISOString(),
        });

        if (error) throw error;
        result.migrated++;
      } catch (err: any) {
        // Agora o erro vai aparecer legível
        result.errors.push(`Erro em ${product.name}: ${err.message || err}`);
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
    if (localCustomers.length === 0) {
      result.success = true;
      return result;
    }

    const { data: existing } = await supabase.from('clientes').select('id');
    const existingIds = new Set(existing?.map((c: any) => c.id) || []);

    for (const customer of localCustomers) {
      if (existingIds.has(customer.id)) continue;

      const { error } = await supabase.from('clientes').insert({
        id: customer.id,
        nome: customer.name,
        telefone: customer.phone,
        email: customer.email,
        endereco: customer.address,
        origem: customer.source,
        criado_em: customer.createdAt || new Date().toISOString(),
      });

      if (error) throw error;
      result.migrated++;
    }

    result.success = result.errors.length === 0;
  } catch (err: any) {
    result.errors.push(`Erro na migração de clientes: ${err.message || err}`);
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

    const { data: existing } = await supabase.from('pedidos').select('id');
    const existingIds = new Set(existing?.map((o: any) => o.id) || []);

    for (const order of localOrders) {
      if (existingIds.has(order.id)) continue;

      const { error } = await supabase.from('pedidos').insert({
        id: order.id,
        nome_do_cliente: order.customerName,
        telefone_do_cliente: order.customerPhone,
        itens: order.items,
        valor_total: order.totalAmount,
        valor_do_desconto: order.discountAmount,
        metodo_de_pagamento: order.paymentMethod,
        observacoes: order.notes,
        status: order.status,
        criado_em: order.createdAt || new Date().toISOString(),
      });

      if (error) throw error;
      result.migrated++;
    }

    result.success = result.errors.length === 0;
  } catch (err: any) {
    result.errors.push(`Erro na migração de pedidos: ${err.message || err}`);
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

    const { data: existing } = await supabase.from('configuracoes').select('id');
    const existingIds = new Set(existing?.map((s: any) => s.id) || []);

    for (const setting of localSettings) {
      if (existingIds.has(setting.id)) continue;

      const { error } = await supabase.from('configuracoes').insert({
        id: setting.id,
        margem_padrao: setting.defaultMarkup,
        nome_da_loja: setting.storeName,
        moeda: setting.currency,
        numero_do_whatsapp: setting.whatsappNumber,
        descricao_da_loja: setting.storeDescription,
        criado_em: setting.createdAt || new Date().toISOString(),
      });

      if (error) throw error;
      result.migrated++;
    }

    result.success = result.errors.length === 0;
  } catch (err: any) {
    result.errors.push(`Erro na migração de configurações: ${err.message || err}`);
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
