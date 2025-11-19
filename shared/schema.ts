import { z } from "zod";
import { pgTable, varchar, text, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

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
// SERVICE
// ============================================
export const serviceStatuses = ["ACTIVE", "INACTIVE"] as const;
export const serviceCategories = ["SEO", "SOCIAL_MEDIA", "CONTENT", "ADVERTISING", "DESIGN", "DEVELOPMENT", "CONSULTING", "OTHER"] as const;

export interface Service {
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
export const vendorCategories = ["SOFTWARE", "FREELANCER", "MEDIA_BUY", "OTHER"] as const;
export const vendorStatuses = ["ACTIVE", "INACTIVE"] as const;

export interface Vendor {
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
  categoryId: z.string().min(1, "Category is required"),
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
// TEAM MEMBER
// ============================================
export const teamMemberStatuses = ["ACTIVE", "INACTIVE"] as const;

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
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
// DRIZZLE TABLE DEFINITIONS
// ============================================

// Enums
export const userRoleEnum = pgEnum("user_role", userRoles);
export const clientStatusEnum = pgEnum("client_status", clientStatuses);
export const projectStatusEnum = pgEnum("project_status", projectStatuses);
export const invoiceStatusEnum = pgEnum("invoice_status", invoiceStatuses);
export const paymentMethodEnum = pgEnum("payment_method", paymentMethods);
export const serviceStatusEnum = pgEnum("service_status", serviceStatuses);
export const serviceCategoryEnum = pgEnum("service_category", serviceCategories);
export const vendorCategoryEnum = pgEnum("vendor_category", vendorCategories);
export const vendorStatusEnum = pgEnum("vendor_status", vendorStatuses);
export const expenseStatusEnum = pgEnum("expense_status", expenseStatuses);
export const teamMemberStatusEnum = pgEnum("team_member_status", teamMemberStatuses);
export const salaryStatusEnum = pgEnum("salary_status", salaryStatuses);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 21 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("STAFF"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id", { length: 21 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  companyWebsite: text("company_website").notNull().default(""),
  address: text("address").notNull().default(""),
  status: clientStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes").notNull().default(""),
  portalUrl: text("portal_url").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id", { length: 21 }).primaryKey(),
  clientId: varchar("client_id", { length: 21 }).notNull().references(() => clients.id),
  name: varchar("name", { length: 255 }).notNull(),
  scope: text("scope").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: projectStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 21 }).primaryKey(),
  clientId: varchar("client_id", { length: 21 }).notNull().references(() => clients.id),
  projectId: varchar("project_id", { length: 21 }).references(() => projects.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).notNull().default("0"),
  status: invoiceStatusEnum("status").notNull().default("DRAFT"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoice Line Items table
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id", { length: 21 }).primaryKey(),
  invoiceId: varchar("invoice_id", { length: 21 }).notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id", { length: 21 }).primaryKey(),
  invoiceId: varchar("invoice_id", { length: 21 }).notNull().references(() => invoices.id, { onDelete: "cascade" }),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  reference: text("reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id", { length: 21 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  category: serviceCategoryEnum("category").notNull().default("OTHER"),
  defaultPrice: decimal("default_price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  unit: varchar("unit", { length: 50 }).notNull().default("Hour"),
  status: serviceStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id", { length: 21 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  website: text("website").notNull().default(""),
  address: text("address").notNull().default(""),
  category: vendorCategoryEnum("category").notNull().default("OTHER"),
  status: vendorStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Expense Categories table
export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id", { length: 21 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 21 }).primaryKey(),
  vendorId: varchar("vendor_id", { length: 21 }).references(() => vendors.id),
  categoryId: varchar("category_id", { length: 21 }).notNull().references(() => expenseCategories.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  expenseDate: timestamp("expense_date").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: expenseStatusEnum("status").notNull().default("PLANNED"),
  paymentMethod: paymentMethodEnum("payment_method"),
  reference: text("reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Team Members table
export const teamMembers = pgTable("team_members", {
  id: varchar("id", { length: 21 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  roleTitle: varchar("role_title", { length: 255 }).notNull(),
  status: teamMemberStatusEnum("status").notNull().default("ACTIVE"),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  joinedDate: timestamp("joined_date").notNull(),
  exitDate: timestamp("exit_date"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Salary Payments table
export const salaryPayments = pgTable("salary_payments", {
  id: varchar("id", { length: 21 }).primaryKey(),
  teamMemberId: varchar("team_member_id", { length: 21 }).notNull().references(() => teamMembers.id),
  month: varchar("month", { length: 7 }).notNull(),
  paymentDate: timestamp("payment_date"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: salaryStatusEnum("status").notNull().default("PENDING"),
  paymentMethod: paymentMethodEnum("payment_method"),
  reference: text("reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// DRIZZLE RELATIONS
// ============================================

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  invoices: many(invoices),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  expenses: many(expenses),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  vendor: one(vendors, {
    fields: [expenses.vendorId],
    references: [vendors.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  salaryPayments: many(salaryPayments),
}));

export const salaryPaymentsRelations = relations(salaryPayments, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [salaryPayments.teamMemberId],
    references: [teamMembers.id],
  }),
}));
