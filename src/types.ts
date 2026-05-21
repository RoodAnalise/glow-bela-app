/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  costPrice: number;
  markupPercent: number;
  sellPrice: number;
  stockQuantity: number;
  discountPercent: number;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  source?: 'store' | 'manual';
}

export type PaymentMethod = 'cash' | 'credit_card' | 'installments' | 'store_credit' | 'pix';

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  cost: number;
  discountPercent: number;
}

export interface Sale {
  id?: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  installmentsCount: number;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: number;
}

export interface Settings {
  id?: string;
  defaultMarkup: number;
  storeName: string;
  currency: string;
  whatsappNumber?: string;
  storeDescription?: string;
}

export interface Reseller {
  id?: string;
  nomeCompleto: string;
  whatsapp: string;
  senha: string;
  endereco: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  totalVendido: number;
  comissaoPaga: number;
  comissaoAPagar: number;
  criadoEm: string;
}

export interface ResellerProduct {
  id?: string;
  revendedorId: string;
  produtoId: string;
  nomeProduto: string;
  imagemUrl: string;
  precoVenda: number;
  quantidade: number;
  criadoEm: string;
}

export interface ResellerCustomer {
  id?: string;
  revendedorId: string;
  nome: string;
  whatsapp: string;
  endereco?: string;
  criadoEm: string;
}

export interface ResellerSale {
  id?: string;
  revendedorId: string;
  clienteNome: string;
  clienteWhastapp?: string;
  itens: ResellerSaleItem[];
  totalVenda: number;
  comissaoPercentual: number;
  comissaoValor: number;
  metodoPagamento: string;
  parcelas?: number;
  status: 'concluida' | 'pendente' | 'cancelada';
  criadoEm: string;
}

export interface ResellerSaleItem {
  produtoId: string;
  nome: string;
  quantidade: number;
  preco: number;
}

export interface ResellerKit {
  id?: string;
  revendedorId: string;
  nome: string;
  itens: ResellerKitItem[];
  criadoEm: string;
}

export interface ResellerKitItem {
  produtoId: string;
  nome: string;
  quantidade: number;
}

export function getComissaoTier(totalVendido: number): { percentual: number; nivel: string; proximoNivel: number; cor: string } {
  if (totalVendido >= 2000) {
    return { percentual: 30, nivel: 'Ouro', proximoNivel: 3000, cor: '#C9A96E' };
  }
  if (totalVendido >= 1000) {
    return { percentual: 25, nivel: 'Prata', proximoNivel: 2000, cor: '#94A3B8' };
  }
  return { percentual: 20, nivel: 'Bronze', proximoNivel: 1000, cor: '#CD7F32' };
}

export function getComissaoParaValor(valor: number): number {
  if (valor >= 2000) return 30;
  if (valor >= 1000) return 25;
  return 20;
}
