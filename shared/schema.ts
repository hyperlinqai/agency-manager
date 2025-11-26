import { z } from "zod";

// ============================================
// USER
// ============================================
export const userRoles = ["ADMIN", "MANAGER", "STAFF"] as const;

export interface User {
  _id?: string;
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
  _id?: string;
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
  _id?: string;
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
  _id?: string;
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
  _id?: string;
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
  _id?: string;
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
// SERVICE
// ============================================
export const serviceStatuses = ["ACTIVE", "INACTIVE"] as const;
export const serviceCategories = ["SEO", "SOCIAL_MEDIA", "CONTENT", "ADVERTISING", "DESIGN", "DEVELOPMENT", "CONSULTING", "OTHER"] as const;

export interface Service {
  _id?: string;
  id: string;
  name: string;
  description: string;
  category: typeof serviceCategories[number];
  defaultPrice: number;
  currency: string;
  unit: string;
  status: typeof serviceStatuses[number];
  createdAt: Date;
  updatedAt: Date;
}

export const insertServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional().default(""),
  category: z.enum(serviceCategories).default("OTHER"),
  defaultPrice: z.number().min(0, "Price must be 0 or greater"),
  currency: z.string().default("INR"),
  unit: z.string().default("Hour"),
  status: z.enum(serviceStatuses).default("ACTIVE"),
});

export type InsertService = z.infer<typeof insertServiceSchema>;

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

// ============================================
// VENDOR
// ============================================
export const vendorCategories = ["SOFTWARE", "FREELANCER", "MEDIA_BUY", "AGENCY", "SUPPLIER", "OTHER"] as const;
export const vendorStatuses = ["ACTIVE", "INACTIVE"] as const;

export interface Vendor {
  _id?: string;
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  category: typeof vendorCategories[number];
  status: typeof vendorStatuses[number];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().optional().default(""),
  address: z.string().optional().default(""),
  category: z.enum(vendorCategories).default("OTHER"),
  status: z.enum(vendorStatuses).default("ACTIVE"),
  notes: z.string().optional().default(""),
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;

// ============================================
// EXPENSE CATEGORY
// ============================================
export interface ExpenseCategory {
  _id?: string;
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertExpenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  code: z.string().min(1, "Category code is required").max(10),
});

export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

// ============================================
// EXPENSE
// ============================================
export const expenseStatuses = ["PLANNED", "DUE", "PAID", "CANCELLED"] as const;

export interface Expense {
  _id?: string;
  id: string;
  vendorId: string | null;
  categoryId: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: Date;
  dueDate: Date | null;
  paidDate: Date | null;
  status: typeof expenseStatuses[number];
  paymentMethod: typeof paymentMethods[number] | null;
  reference: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertExpenseSchema = z.object({
  vendorId: z.string().optional().nullable(),
  categoryId: z.string().optional().default(""),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("INR"),
  expenseDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  paidDate: z.string().or(z.date()).optional().nullable(),
  status: z.enum(expenseStatuses).default("PLANNED"),
  paymentMethod: z.enum(paymentMethods).optional().nullable(),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// ============================================
// JOB ROLE
// ============================================
export const jobRoleStatuses = ["ACTIVE", "INACTIVE"] as const;

export interface JobRole {
  _id?: string;
  id: string;
  title: string;
  description: string;
  status: typeof jobRoleStatuses[number];
  createdAt: Date;
  updatedAt: Date;
}

export const insertJobRoleSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().optional().default(""),
  status: z.enum(jobRoleStatuses).default("ACTIVE"),
});

export type InsertJobRole = z.infer<typeof insertJobRoleSchema>;

// ============================================
// TEAM MEMBER
// ============================================
export const teamMemberStatuses = ["ACTIVE", "INACTIVE"] as const;
export const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERN"] as const;

export interface TeamMember {
  _id?: string;
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  employmentType: typeof employmentTypes[number];
  status: typeof teamMemberStatuses[number];
  baseSalary: number;
  joinedDate: Date;
  exitDate: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  roleTitle: z.string().min(1, "Role title is required"),
  employmentType: z.enum(employmentTypes).default("FULL_TIME"),
  status: z.enum(teamMemberStatuses).default("ACTIVE"),
  baseSalary: z.number().min(0, "Base salary must be non-negative"),
  joinedDate: z.string().or(z.date()),
  exitDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional().default(""),
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// ============================================
// SALARY PAYMENT
// ============================================
export const salaryStatuses = ["PAID", "PENDING"] as const;

export interface SalaryPayment {
  _id?: string;
  id: string;
  teamMemberId: string;
  month: string;
  paymentDate: Date | null;
  amount: number;
  currency: string;
  status: typeof salaryStatuses[number];
  paymentMethod: typeof paymentMethods[number] | null;
  reference: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertSalaryPaymentSchema = z.object({
  teamMemberId: z.string().min(1, "Team member is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  paymentDate: z.string().or(z.date()).optional().nullable(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("INR"),
  status: z.enum(salaryStatuses).default("PENDING"),
  paymentMethod: z.enum(paymentMethods).optional().nullable(),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;

// ============================================
// FINANCIAL DASHBOARD
// ============================================
export interface FinancialSummary {
  totalIncome: number;  // Total payments collected
  totalExpenses: number;  // Total expenses + salaries combined
  netProfit: number;  // Income - Expenses
  totalInvoiced: number;  // For reference
  totalSalaries: number;  // For reference
  breakdownByCategory: Array<{
    categoryName: string;
    totalAmount: number;
  }>;
  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    totalAmount: number;
  }>;
}

// ============================================
// EXTENDED TYPES FOR NEW ENTITIES
// ============================================
export interface VendorWithStats extends Vendor {
  totalSpend?: number;
}

export interface ExpenseWithRelations extends Expense {
  vendorName?: string;
  categoryName?: string;
}

// ============================================
// COMPANY PROFILE
// ============================================
export interface CompanyProfile {
  _id?: string;
  id: string;
  companyName: string;
  logoUrl: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  taxId: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolderName: string;
  upiId: string;
  paymentLink: string;
  paymentGatewayDetails: string;
  invoiceTerms: string;
  paymentNotes: string;
  authorizedSignatoryName: string;
  authorizedSignatoryTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertCompanyProfileSchema = z.object({
  companyName: z.string().min(1),
  logoUrl: z.string().optional().default(""),
  addressLine1: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  country: z.string().optional().default("India"),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  taxId: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  bankAccountNumber: z.string().optional().default(""),
  bankIfscCode: z.string().optional().default(""),
  bankAccountHolderName: z.string().optional().default(""),
  upiId: z.string().optional().default(""),
  paymentLink: z.string().optional().default(""),
  paymentGatewayDetails: z.string().optional().default(""),
  invoiceTerms: z.string().optional().default(""),
  paymentNotes: z.string().optional().default(""),
  authorizedSignatoryName: z.string().optional().default(""),
  authorizedSignatoryTitle: z.string().optional().default(""),
});

export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
