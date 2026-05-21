import { supabase, uploadImage } from './supabase';
import { getAll } from './localDB';

interface MigrateResult {
  success: boolean;
  migrated: number;
  errors: string[];
}

// Função para garantir data válida e no formato ISO
const safeDate = (val: any) => {
  if (!val) return new Date().toISOString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

export async function migrateProducts(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };

  try {
    // 1. Pegar produtos do navegador (IndexedDB)
    const localProducts = await getAll('products');
    
    if (localProducts.length === 0) {
      result.success = true;
      return result;
    }

    // 2. Verificar o que já existe no Supabase (Tabela 'produtos')
    const { data: existing } = await supabase.from('produtos').select('id');
    const existingIds = new Set(existing?.map((p: any) => p.id) || []);

    // 3. Migrar um por um
    for (const product of localProducts) {
      const p = product as any;
      try {
        if (existingIds.has(p.id)) continue;

        let imageUrl = p.imageUrl || '';
        
        // Se a imagem for base64, enviar para o Storage
        if (p.imageUrl && p.imageUrl.startsWith('data:')) {
          const blob = await fetch(p.imageUrl).then(r => r.blob());
          const file = new File([blob], `${p.id}.jpg`, { type: 'image/jpeg' });
          const uploadedUrl = await uploadImage(file, `${p.id}-${Date.now()}.jpg`);
          if (uploadedUrl) imageUrl = uploadedUrl;
        }

        // 4. Inserir na tabela 'produtos' com colunas em Português
        const { error } = await supabase.from('produtos').insert({
          id: p.id,
          nome: p.name,
          descricao: p.description,
          categoria: p.category,
          preco_de_custo: p.costPrice,
          porcentagem_de_margem: p.markupPercent,
          preco_de_venda: p.sellPrice,
          quantidade_em_estoque: p.stockQuantity,
          porcentagem_de_desconto: p.discountPercent,
          url_da_imagem: imageUrl,
          criado_em: safeDate(p.createdAt), // Data corrigida
        });

        if (error) throw error;
        result.migrated++;
      } catch (err: any) {
        result.errors.push(`Erro em ${p.name}: ${err.message}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (err: any) {
    result.errors.push(`Falha na migração: ${err.message}`);
  }

  return result;
}

export async function migrateCustomers(): Promise<MigrateResult> {
  const result: MigrateResult = { success: false, migrated: 0, errors: [] };
  try {
    const localCustomers = await getAll('customers');
    if (localCustomers.length === 0) { result.success = true; return result; }
    
    const { data: existing } = await supabase.from('clientes').select('id');
    const existingIds = new Set(existing?.map((c: any) => c.id) || []);

    for (const customer of localCustomers) {
      const c = customer as any;
      if (existingIds.has(c.id)) continue;
      const { error } = await supabase.from('clientes').insert({
        id: c.id,
        nome: c.name,
        telefone: c.phone,
        email: c.email,
        endereco: c.address,
        origem: c.source,
        criado_em: safeDate(c.createdAt)
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

    const { data: existing } = await supabase.from('pedidos').select('id');
    const existingIds = new Set(existing?.map((o: any) => o.id) || []);

    for (const order of localOrders) {
      const o = order as any;
      if (existingIds.has(o.id)) continue;
      const { error } = await supabase.from('pedidos').insert({
        id: o.id,
        nome_do_cliente: o.customerName,
        telefone_do_cliente: o.customerPhone,
        itens: o.items,
        valor_total: o.totalAmount,
        valor_do_desconto: o.discountAmount,
        metodo_de_pagamento: o.paymentMethod,
        observacoes: o.notes,
        status: o.status,
        criado_em: safeDate(o.createdAt)
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

    const { data: existing } = await supabase.from('configuracoes').select('id');
    const existingIds = new Set(existing?.map((s: any) => s.id) || []);

    for (const setting of localSettings) {
      const s = setting as any;
      if (existingIds.has(s.id)) continue;
      const { error } = await supabase.from('configuracoes').insert({
        id: s.id,
        margem_padrao: s.defaultMarkup,
        nome_da_loja: s.storeName,
        moeda: s.currency,
        numero_do_whatsapp: s.whatsappNumber,
        descricao_da_loja: s.storeDescription,
        criado_em: safeDate(s.createdAt)
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
