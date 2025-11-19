import { z } from "zod";

// ============================================
// USER
// ============================================
export const userRoles = ["ADMIN", "MANAGER", "STAFF"] as const;

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: typeof userRoles[number];
  createdAt: Date;
  updatedAt: Date;
}

export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(userRoles),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// ============================================
// CLIENT
// ============================================
export const clientStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  companyWebsite: string;
  address: string;
  status: typeof clientStatuses[number];
  notes: string;
  portalUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  companyWebsite: z.string().optional().default(""),
  address: z.string().optional().default(""),
  status: z.enum(clientStatuses).default("ACTIVE"),
  notes: z.string().optional().default(""),
  portalUrl: z.string().optional().default(""),
});

export type InsertClient = z.infer<typeof insertClientSchema>;

// ============================================
// PROJECT
// ============================================
export const projectStatuses = ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export interface Project {
  id: string;
  clientId: string;
  name: string;
  scope: string;
  startDate: Date;
  endDate: Date | null;
  status: typeof projectStatuses[number];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertProjectSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Project name is required"),
  scope: z.string().min(1, "Scope is required"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  status: z.enum(projectStatuses).default("ACTIVE"),
  notes: z.string().optional().default(""),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;

// ============================================
// INVOICE
// ============================================
export const invoiceStatuses = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"] as const;

export interface Invoice {
  id: string;
  clientId: string;
  projectId: string | null;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: typeof invoiceStatuses[number];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional().nullable(),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  currency: z.string().default("INR"),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  status: z.enum(invoiceStatuses).default("DRAFT"),
  notes: z.string().optional().default(""),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// ============================================
// INVOICE LINE ITEM
// ============================================
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export const insertInvoiceLineItemSchema = z.object({
  invoiceId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  lineTotal: z.number().min(0),
});

export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;

// ============================================
// PAYMENT
// ============================================
export const paymentMethods = ["BANK_TRANSFER", "UPI", "CASH", "CARD", "OTHER"] as const;

export interface Payment {
  id: string;
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  method: typeof paymentMethods[number];
  reference: string;
  notes: string;
  createdAt: Date;
}

export const insertPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  paymentDate: z.string().or(z.date()),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(paymentMethods),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// ============================================
// DASHBOARD SUMMARY
// ============================================
export interface DashboardSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  thisMonthInvoiced: number;
  thisMonthCollected: number;
  countActiveClients: number;
  countOverdueInvoices: number;
}

// ============================================
// EXTENDED TYPES FOR API RESPONSES
// ============================================
export interface ClientWithStats extends Client {
  totalInvoiced?: number;
  outstandingAmount?: number;
  projectCount?: number;
}

export interface InvoiceWithRelations extends Invoice {
  clientName?: string;
  projectName?: string;
  projectScope?: string;
  lineItems?: InvoiceLineItem[];
  payments?: Payment[];
}
