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
}

export type PaymentMethod = 'cash' | 'credit_card' | 'installments' | 'store_credit';

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

export interface Settings {
  id?: string;
  defaultMarkup: number;
  storeName: string;
  currency: string;
}
