import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Party, Product, Invoice, Voucher, BusinessDetails } from "./types";

interface BilltrixStore {
  business: BusinessDetails | null;
  parties: Party[];
  products: Product[];
  invoices: Invoice[];
  vouchers: Voucher[];
  
  setBusiness: (details: BusinessDetails) => void;
  addParty: (party: Party) => void;
  updateParty: (party: Party) => void;
  deleteParty: (id: string) => void;
  
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  
  addVoucher: (voucher: Voucher) => void;
  deleteVoucher: (id: string) => void;
}

export const useStore = create<BilltrixStore>()(
  persist(
    (set) => ({
      business: null,
      parties: [],
      products: [],
      invoices: [],
      vouchers: [],

      setBusiness: (business) => set({ business }),
      
      addParty: (party) => set((state) => ({ 
        parties: [...state.parties, party] 
      })),
      
      updateParty: (updatedParty) => set((state) => ({
        parties: state.parties.map(p => p.id === updatedParty.id ? updatedParty : p)
      })),
      
      deleteParty: (id) => set((state) => ({
        parties: state.parties.filter(p => p.id !== id)
      })),

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, stock: product.stock || 0 }]
      })),

      updateProduct: (updatedProduct) => set((state) => ({
        products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      addInvoice: (invoice) => set((state) => {
        // Update Party Balance
        const updatedParties = state.parties.map(p => {
          if (p.id === invoice.partyId) {
            const change = invoice.type === 'sales' ? invoice.totalAmount : -invoice.totalAmount;
            return { ...p, balance: p.balance + (change - invoice.paidAmount) };
          }
          return p;
        });

        // Update Inventory Stock
        const updatedProducts = state.products.map(p => {
          const invoiceItem = invoice.items.find(item => item.productId === p.id || item.name === p.name);
          if (invoiceItem) {
            const stockChange = invoice.type === 'purchase' ? invoiceItem.quantity : -invoiceItem.quantity;
            return { ...p, stock: (p.stock || 0) + stockChange };
          }
          return p;
        });

        return { 
          invoices: [...state.invoices, invoice],
          parties: updatedParties,
          products: updatedProducts
        };
      }),

      updateInvoice: (updatedInvoice) => set((state) => {
        const oldInvoice = state.invoices.find(i => i.id === updatedInvoice.id);
        if (!oldInvoice) return state;

        const updatedParties = state.parties.map(p => {
          if (p.id === updatedInvoice.partyId) {
            // Reverse old invoice impact
            const oldChange = oldInvoice.type === 'sales' ? oldInvoice.totalAmount : -oldInvoice.totalAmount;
            const tempBalance = p.balance - (oldChange - oldInvoice.paidAmount);
            
            // Apply new invoice impact
            const newChange = updatedInvoice.type === 'sales' ? updatedInvoice.totalAmount : -updatedInvoice.totalAmount;
            return { ...p, balance: tempBalance + (newChange - updatedInvoice.paidAmount) };
          }
          return p;
        });

        return {
          invoices: state.invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i),
          parties: updatedParties
        };
      }),

      deleteInvoice: (id) => set((state) => {
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) return state;

        const updatedParties = state.parties.map(p => {
          if (p.id === invoice.partyId) {
            const change = invoice.type === 'sales' ? invoice.totalAmount : -invoice.totalAmount;
            return { ...p, balance: p.balance - (change - invoice.paidAmount) };
          }
          return p;
        });

        return {
          invoices: state.invoices.filter(i => i.id !== id),
          parties: updatedParties
        };
      }),

      addVoucher: (voucher) => set((state) => {
        const updatedParties = state.parties.map(p => {
          if (p.id === voucher.partyId) {
            const change = voucher.type === 'receipt' ? -voucher.amount : voucher.amount;
            return { ...p, balance: p.balance + change };
          }
          return p;
        });
        return {
          vouchers: [...state.vouchers, voucher],
          parties: updatedParties
        };
      }),

      deleteVoucher: (id) => set((state) => {
        const voucher = state.vouchers.find(v => v.id === id);
        if (!voucher) return state;

        const updatedParties = state.parties.map(p => {
          if (p.id === voucher.partyId) {
            const change = voucher.type === 'receipt' ? -voucher.amount : voucher.amount;
            return { ...p, balance: p.balance - change };
          }
          return p;
        });

        return {
          vouchers: state.vouchers.filter(v => v.id !== id),
          parties: updatedParties
        };
      }),
    }),
    {
      name: "billtrix-storage",
    }
  )
);
