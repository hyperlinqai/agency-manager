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
export const clientStatuses = ["ONBOARDING", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;
export const projectTypes = ["MARKETING", "AUTOMATION", "WEB_DEVELOPMENT", "CONSULTING", "MIXED"] as const;

export interface Client {
  _id?: string;
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  companyWebsite: string;
  address: string;
  industry: string;
  projectType: typeof projectTypes[number];
  status: typeof clientStatuses[number];
  notes: string;
  portalUrl: string;
  gstNumber: string; // GST Identification Number for GST compliance

  // Public onboarding
  onboardingToken: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  
  // Retention tracking
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  nextReviewDate: Date | null;
  retentionNotes: string;
  
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
  industry: z.string().optional().default(""),
  projectType: z.enum(projectTypes).default("MIXED"),
  status: z.enum(clientStatuses).default("ONBOARDING"),
  notes: z.string().optional().default(""),
  portalUrl: z.string().optional().default(""),
  gstNumber: z.string().optional().default(""), // GST Identification Number (GSTIN)
  onboardingToken: z.string().optional().default(""),
  onboardingCompleted: z.boolean().optional().default(false),
  onboardingCompletedAt: z.string().or(z.date()).optional().nullable(),
  contractStartDate: z.string().or(z.date()).optional().nullable(),
  contractEndDate: z.string().or(z.date()).optional().nullable(),
  nextReviewDate: z.string().or(z.date()).optional().nullable(),
  retentionNotes: z.string().optional().default(""),
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
  gstNumber: string; // GST Identification Number for ITC eligibility
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
  gstNumber: z.string().optional().default(""), // GSTIN for ITC eligibility
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
  onboardingToken: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  slackUserId: string | null; // Slack user ID for attendance tracking
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
  onboardingToken: z.string().optional().default(""),
  onboardingCompleted: z.boolean().optional().default(false),
  onboardingCompletedAt: z.string().or(z.date()).optional().nullable(),
  slackUserId: z.string().optional().nullable(),
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

// ============================================
// MARKETING MODULE - PROPOSAL
// ============================================
export const proposalStatuses = ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export const marketingServices = [
  "SOCIAL_MEDIA",
  "PAID_ADS",
  "WEB_DEVELOPMENT",
  "AUTOMATION",
  "CRM_SETUP",
  "EMAIL_SMS",
  "FUNNELS",
  "SEO",
  "CONTENT_MARKETING",
  "BRANDING",
  "VIDEO_PRODUCTION",
  "INFLUENCER_MARKETING"
] as const;

export interface ProposalService {
  serviceType: typeof marketingServices[number];
  name: string;
  description: string;
  deliverables: string[];
  kpis: string[];
  price: number;
  timeline: string;
}

export interface Proposal {
  _id?: string;
  id: string;
  clientId: string;
  title: string;
  proposalNumber: string;
  status: typeof proposalStatuses[number];
  validUntil: Date;
  
  // Scope & Services
  services: ProposalService[];
  
  // Timeline
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  projectDuration: string;
  
  // Pricing
  subtotal: number;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  
  // Payment Terms
  paymentTerms: string;
  paymentSchedule: Array<{
    milestone: string;
    percentage: number;
    amount: number;
    dueDate: Date | null;
  }>;
  
  // Additional
  executiveSummary: string;
  termsAndConditions: string;
  notes: string;
  
  // Branding
  showCompanyLogo: boolean;
  customHeaderText: string;
  customFooterText: string;
  
  // Tracking
  sentAt: Date | null;
  viewedAt: Date | null;
  respondedAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export const insertProposalSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  proposalNumber: z.string().optional(),
  status: z.enum(proposalStatuses).default("DRAFT"),
  validUntil: z.string().or(z.date()),
  
  services: z.array(z.object({
    serviceType: z.enum(marketingServices),
    name: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()),
    kpis: z.array(z.string()),
    price: z.number().min(0),
    timeline: z.string(),
  })).default([]),
  
  projectStartDate: z.string().or(z.date()).optional().nullable(),
  projectEndDate: z.string().or(z.date()).optional().nullable(),
  projectDuration: z.string().optional().default(""),
  
  subtotal: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("FIXED"),
  taxRate: z.number().min(0).default(18),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  currency: z.string().default("INR"),
  
  paymentTerms: z.string().optional().default(""),
  paymentSchedule: z.array(z.object({
    milestone: z.string(),
    percentage: z.number(),
    amount: z.number(),
    dueDate: z.string().or(z.date()).optional().nullable(),
  })).default([]),
  
  executiveSummary: z.string().optional().default(""),
  termsAndConditions: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  
  showCompanyLogo: z.boolean().default(true),
  customHeaderText: z.string().optional().default(""),
  customFooterText: z.string().optional().default(""),
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;

// ============================================
// MARKETING MODULE - CONTRACT
// ============================================
export const contractStatuses = ["DRAFT", "PENDING_SIGNATURE", "SIGNED", "ACTIVE", "COMPLETED", "TERMINATED"] as const;

export interface Contract {
  _id?: string;
  id: string;
  clientId: string;
  proposalId: string | null;
  
  contractNumber: string;
  title: string;
  status: typeof contractStatuses[number];
  
  // Dates
  startDate: Date;
  endDate: Date | null;
  signedDate: Date | null;
  
  // Scope
  scopeOfWork: string;
  deliverables: string[];
  
  // Financial
  contractValue: number;
  currency: string;
  paymentTerms: string;
  
  // Terms
  termsAndConditions: string;
  confidentialityClause: string;
  terminationClause: string;
  
  // Signatures
  clientSignatureName: string;
  clientSignatureDate: Date | null;
  agencySignatureName: string;
  agencySignatureDate: Date | null;
  
  // Attachments
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertContractSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  proposalId: z.string().optional().nullable(),
  contractNumber: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  status: z.enum(contractStatuses).default("DRAFT"),
  
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  signedDate: z.string().or(z.date()).optional().nullable(),
  
  scopeOfWork: z.string().min(1, "Scope of work is required"),
  deliverables: z.array(z.string()).default([]),
  
  contractValue: z.number().min(0),
  currency: z.string().default("INR"),
  paymentTerms: z.string().optional().default(""),
  
  termsAndConditions: z.string().optional().default(""),
  confidentialityClause: z.string().optional().default(""),
  terminationClause: z.string().optional().default(""),
  
  clientSignatureName: z.string().optional().default(""),
  clientSignatureDate: z.string().or(z.date()).optional().nullable(),
  agencySignatureName: z.string().optional().default(""),
  agencySignatureDate: z.string().or(z.date()).optional().nullable(),
  
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    uploadedAt: z.string().or(z.date()),
  })).default([]),
  
  notes: z.string().optional().default(""),
});

export type InsertContract = z.infer<typeof insertContractSchema>;

// ============================================
// MARKETING MODULE - CLIENT ONBOARDING DATA
// ============================================
export const onboardingStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

export interface ClientOnboardingData {
  _id?: string;
  id: string;
  clientId: string;
  
  // Overall Status
  overallStatus: typeof onboardingStatuses[number];
  submittedAt: Date | null;
  submittedBy: string;
  
  // Business Details & KYC
  businessDetails: {
    status: typeof onboardingStatuses[number];
    legalName: string;
    tradeName: string;
    businessType: string;
    registrationNumber: string;
    gstNumber: string;
    panNumber: string;
    incorporationDate: string;
    industry: string;
    employeeCount: string;
    annualRevenue: string;
    targetAudience: string;
    competitors: string;
    uniqueSellingPoint: string;
    businessGoals: string;
    notes: string;
  };
  
  // Brand Assets
  brandAssets: {
    status: typeof onboardingStatuses[number];
    logoUrl: string;
    logoVariants: string[];
    primaryColors: string[];
    secondaryColors: string[];
    fonts: string[];
    brandGuidelines: string;
    brandGuidelinesUrl: string;
    tagline: string;
    brandVoice: string;
    brandPersonality: string;
    doNotUse: string;
    notes: string;
  };
  
  // Website & Hosting Credentials
  websiteCredentials: {
    status: typeof onboardingStatuses[number];
    items: Array<{
      type: "HOSTING" | "DOMAIN" | "CMS" | "FTP" | "DATABASE" | "CDN" | "ANALYTICS" | "OTHER";
      name: string;
      url: string;
      username: string;
      password: string;
      notes: string;
    }>;
  };
  
  // Social & Ad Account Credentials
  socialCredentials: {
    status: typeof onboardingStatuses[number];
    items: Array<{
      platform: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TWITTER" | "YOUTUBE" | "TIKTOK" | "PINTEREST" | "GOOGLE_ADS" | "META_ADS" | "GOOGLE_ANALYTICS" | "OTHER";
      accountName: string;
      accountUrl: string;
      username: string;
      password: string;
      accessLevel: string;
      notes: string;
    }>;
  };
  
  // CRM & Email/Automation Credentials  
  crmCredentials: {
    status: typeof onboardingStatuses[number];
    items: Array<{
      platform: "HUBSPOT" | "SALESFORCE" | "ZOHO" | "MAILCHIMP" | "KLAVIYO" | "ACTIVECAMPAIGN" | "GOHIGHLEVEL" | "OTHER";
      accountName: string;
      accountUrl: string;
      username: string;
      password: string;
      apiKey: string;
      notes: string;
    }>;
  };
  
  // Previous Marketing Reports / Benchmarks
  marketingReports: {
    status: typeof onboardingStatuses[number];
    currentMarketingEfforts: string;
    pastCampaigns: string;
    whatWorked: string;
    whatDidntWork: string;
    items: Array<{
      name: string;
      type: string;
      period: string;
      url: string;
      uploadedAt: Date;
      notes: string;
    }>;
  };
  
  // Kickoff / Project Specifics
  projectDetails: {
    status: typeof onboardingStatuses[number];
    preferredCommunication: string;
    meetingAvailability: string;
    decisionMakers: string;
    budget: string;
    timeline: string;
    priorities: string;
    expectations: string;
    kickoffNotes: string;
  };
  
  // Additional Notes
  additionalNotes: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export const insertClientOnboardingDataSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  overallStatus: z.enum(onboardingStatuses).default("NOT_STARTED"),
  submittedAt: z.string().or(z.date()).optional().nullable(),
  submittedBy: z.string().optional().default(""),
  
  businessDetails: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    legalName: z.string().optional().default(""),
    tradeName: z.string().optional().default(""),
    businessType: z.string().optional().default(""),
    registrationNumber: z.string().optional().default(""),
    gstNumber: z.string().optional().default(""),
    panNumber: z.string().optional().default(""),
    incorporationDate: z.string().optional().default(""),
    industry: z.string().optional().default(""),
    employeeCount: z.string().optional().default(""),
    annualRevenue: z.string().optional().default(""),
    targetAudience: z.string().optional().default(""),
    competitors: z.string().optional().default(""),
    uniqueSellingPoint: z.string().optional().default(""),
    businessGoals: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  }).optional(),
  
  brandAssets: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    logoUrl: z.string().optional().default(""),
    logoVariants: z.array(z.string()).default([]),
    primaryColors: z.array(z.string()).default([]),
    secondaryColors: z.array(z.string()).default([]),
    fonts: z.array(z.string()).default([]),
    brandGuidelines: z.string().optional().default(""),
    brandGuidelinesUrl: z.string().optional().default(""),
    tagline: z.string().optional().default(""),
    brandVoice: z.string().optional().default(""),
    brandPersonality: z.string().optional().default(""),
    doNotUse: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  }).optional(),
  
  websiteCredentials: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    items: z.array(z.object({
      type: z.enum(["HOSTING", "DOMAIN", "CMS", "FTP", "DATABASE", "CDN", "ANALYTICS", "OTHER"]),
      name: z.string(),
      url: z.string(),
      username: z.string(),
      password: z.string(),
      notes: z.string().optional().default(""),
    })).default([]),
  }).optional(),
  
  socialCredentials: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    items: z.array(z.object({
      platform: z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "YOUTUBE", "TIKTOK", "PINTEREST", "GOOGLE_ADS", "META_ADS", "GOOGLE_ANALYTICS", "OTHER"]),
      accountName: z.string(),
      accountUrl: z.string(),
      username: z.string(),
      password: z.string(),
      accessLevel: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    })).default([]),
  }).optional(),
  
  crmCredentials: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    items: z.array(z.object({
      platform: z.enum(["HUBSPOT", "SALESFORCE", "ZOHO", "MAILCHIMP", "KLAVIYO", "ACTIVECAMPAIGN", "GOHIGHLEVEL", "OTHER"]),
      accountName: z.string(),
      accountUrl: z.string(),
      username: z.string(),
      password: z.string(),
      apiKey: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    })).default([]),
  }).optional(),

  marketingReports: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    currentMarketingEfforts: z.string().optional().default(""),
    pastCampaigns: z.string().optional().default(""),
    whatWorked: z.string().optional().default(""),
    whatDidntWork: z.string().optional().default(""),
    items: z.array(z.object({
      name: z.string(),
      type: z.string(),
      period: z.string(),
      url: z.string(),
      uploadedAt: z.string().or(z.date()),
      notes: z.string().optional().default(""),
    })).default([]),
  }).optional(),
  
  projectDetails: z.object({
    status: z.enum(onboardingStatuses).default("NOT_STARTED"),
    preferredCommunication: z.string().optional().default(""),
    meetingAvailability: z.string().optional().default(""),
    decisionMakers: z.string().optional().default(""),
    budget: z.string().optional().default(""),
    timeline: z.string().optional().default(""),
    priorities: z.string().optional().default(""),
    expectations: z.string().optional().default(""),
    kickoffNotes: z.string().optional().default(""),
  }).optional(),
  
  additionalNotes: z.string().optional().default(""),
});

export type InsertClientOnboardingData = z.infer<typeof insertClientOnboardingDataSchema>;

// ============================================
// MARKETING MODULE - MONTHLY REPORT
// ============================================
export const reportStatuses = ["DRAFT", "PENDING_REVIEW", "APPROVED", "SENT"] as const;

export interface MonthlyReport {
  _id?: string;
  id: string;
  clientId: string;
  projectId: string | null;
  
  reportNumber: string;
  title: string;
  status: typeof reportStatuses[number];
  
  // Period
  reportMonth: string; // Format: YYYY-MM
  periodStart: Date;
  periodEnd: Date;
  
  // Summary
  executiveSummary: string;
  highlights: string[];
  challenges: string[];
  recommendations: string[];
  
  // KPI Metrics
  metrics: Array<{
    name: string;
    value: string;
    previousValue: string;
    change: number;
    changeType: "INCREASE" | "DECREASE" | "NO_CHANGE";
    unit: string;
    notes: string;
  }>;
  
  // Attachments
  attachments: Array<{
    name: string;
    type: "PDF" | "DOC" | "PPT" | "EXCEL" | "IMAGE" | "OTHER";
    url: string;
    size: number;
    uploadedAt: Date;
  }>;
  
  // Delivery
  sentAt: Date | null;
  sentTo: string[];
  
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertMonthlyReportSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional().nullable(),
  reportNumber: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  status: z.enum(reportStatuses).default("DRAFT"),
  
  reportMonth: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  periodStart: z.string().or(z.date()),
  periodEnd: z.string().or(z.date()),
  
  executiveSummary: z.string().optional().default(""),
  highlights: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  
  metrics: z.array(z.object({
    name: z.string(),
    value: z.string(),
    previousValue: z.string(),
    change: z.number(),
    changeType: z.enum(["INCREASE", "DECREASE", "NO_CHANGE"]),
    unit: z.string(),
    notes: z.string().optional().default(""),
  })).default([]),
  
  attachments: z.array(z.object({
    name: z.string(),
    type: z.enum(["PDF", "DOC", "PPT", "EXCEL", "IMAGE", "OTHER"]),
    url: z.string(),
    size: z.number(),
    uploadedAt: z.string().or(z.date()),
  })).default([]),
  
  sentAt: z.string().or(z.date()).optional().nullable(),
  sentTo: z.array(z.string()).default([]),
  
  notes: z.string().optional().default(""),
});

export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;

// ============================================
// MARKETING MODULE - CLIENT DIGITAL ASSETS
// ============================================
export const assetCategories = [
  "LOGO",
  "BRAND_GUIDELINE",
  "IMAGE",
  "VIDEO",
  "DOCUMENT",
  "PRESENTATION",
  "SOCIAL_MEDIA_ASSET",
  "AD_CREATIVE",
  "WEBSITE_ASSET",
  "OTHER"
] as const;

export interface ClientDigitalAsset {
  _id?: string;
  id: string;
  clientId: string;
  
  name: string;
  description: string;
  category: typeof assetCategories[number];
  tags: string[];
  
  // File Info
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  
  // Metadata
  dimensions: string;
  format: string;
  version: string;
  
  // Access
  isPublic: boolean;
  
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertClientDigitalAssetSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  category: z.enum(assetCategories),
  tags: z.array(z.string()).default([]),
  
  fileUrl: z.string().min(1, "File URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(0),
  
  dimensions: z.string().optional().default(""),
  format: z.string().optional().default(""),
  version: z.string().optional().default("1.0"),
  
  isPublic: z.boolean().default(false),
  uploadedBy: z.string().optional().default(""),
});

export type InsertClientDigitalAsset = z.infer<typeof insertClientDigitalAssetSchema>;

// ============================================
// EXTENDED TYPES FOR MARKETING MODULE
// ============================================
export interface ProposalWithRelations extends Proposal {
  clientName?: string;
}

export interface ContractWithRelations extends Contract {
  clientName?: string;
  proposalTitle?: string;
}

export interface MonthlyReportWithRelations extends MonthlyReport {
  clientName?: string;
  projectName?: string;
}

// ============================================
// API SETTINGS (AI Keys)
// ============================================
export interface ApiSettings {
  _id?: string;
  id: string;
  openaiApiKey: string;
  geminiApiKey: string;
  resendApiKey: string;
  senderEmail: string;
  senderName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertApiSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  resendApiKey: z.string().optional(),
  senderEmail: z.string().email().optional().or(z.literal("")),
  senderName: z.string().optional(),
});

export type InsertApiSettings = z.infer<typeof insertApiSettingsSchema>;

// ============================================
// ATTENDANCE
// ============================================
export const attendanceStatuses = ["PRESENT", "ABSENT", "HALF_DAY", "LATE", "ON_LEAVE", "HOLIDAY", "WEEKEND"] as const;

export interface Attendance {
  _id?: string;
  id: string;
  teamMemberId: string;
  date: Date;
  checkIn: string | null; // Time in HH:mm format
  checkOut: string | null; // Time in HH:mm format
  status: typeof attendanceStatuses[number];
  workingHours: number; // In hours (decimal)
  overtimeHours: number; // In hours (decimal)
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertAttendanceSchema = z.object({
  teamMemberId: z.string().min(1, "Team member is required"),
  date: z.string().or(z.date()),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: z.enum(attendanceStatuses).default("PRESENT"),
  workingHours: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  notes: z.string().optional().default(""),
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export interface AttendanceWithMember extends Attendance {
  memberName?: string;
  memberEmail?: string;
}

// ============================================
// LEAVE TYPES
// ============================================
export const leaveTypeCategories = ["CASUAL", "SICK", "EARNED"] as const;

export interface LeaveType {
  _id?: string;
  id: string;
  name: string;
  code: string;
  category: typeof leaveTypeCategories[number];
  description: string;
  isPaid: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertLeaveTypeSchema = z.object({
  name: z.string().min(1, "Leave type name is required"),
  code: z.string().min(1, "Code is required").max(10),
  category: z.enum(leaveTypeCategories),
  description: z.string().optional().default(""),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;

// ============================================
// LEAVE POLICY (Per Job Role)
// ============================================
export interface LeavePolicy {
  _id?: string;
  id: string;
  jobRoleId: string;
  leaveTypeId: string;
  annualQuota: number; // Total leaves per year
  carryForwardLimit: number; // Max leaves that can be carried forward
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertLeavePolicySchema = z.object({
  jobRoleId: z.string().min(1, "Job role is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  annualQuota: z.number().min(0, "Annual quota must be 0 or greater"),
  carryForwardLimit: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type InsertLeavePolicy = z.infer<typeof insertLeavePolicySchema>;

export interface LeavePolicyWithDetails extends LeavePolicy {
  jobRoleTitle?: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
}

// ============================================
// LEAVE REQUEST
// ============================================
export const leaveRequestStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

export interface LeaveRequest {
  _id?: string;
  id: string;
  teamMemberId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: typeof leaveRequestStatuses[number];
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertLeaveRequestSchema = z.object({
  teamMemberId: z.string().min(1, "Team member is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  totalDays: z.number().min(0.5, "Minimum 0.5 day leave"),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(leaveRequestStatuses).default("PENDING"),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.string().or(z.date()).optional().nullable(),
  rejectionReason: z.string().optional().default(""),
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export interface LeaveRequestWithDetails extends LeaveRequest {
  memberName?: string;
  memberEmail?: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  approverName?: string;
}

// ============================================
// LEAVE BALANCE
// ============================================
export interface LeaveBalance {
  _id?: string;
  id: string;
  teamMemberId: string;
  leaveTypeId: string;
  year: number;
  totalQuota: number; // Pro-rata calculated quota for the year
  used: number;
  pending: number; // Days in pending requests
  available: number; // totalQuota - used - pending
  carryForward: number; // Carried from previous year
  createdAt: Date;
  updatedAt: Date;
}

export const insertLeaveBalanceSchema = z.object({
  teamMemberId: z.string().min(1, "Team member is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  year: z.number().min(2020).max(2100),
  totalQuota: z.number().min(0),
  used: z.number().min(0).default(0),
  pending: z.number().min(0).default(0),
  available: z.number().min(0),
  carryForward: z.number().min(0).default(0),
});

export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;

export interface LeaveBalanceWithDetails extends LeaveBalance {
  memberName?: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
}

// ============================================
// SLACK INTEGRATION SETTINGS
// ============================================
export interface SlackSettings {
  _id?: string;
  id: string;
  botToken: string; // xoxb-... token
  signingSecret: string; // Slack signing secret for verifying requests
  appId: string;
  teamId: string; // Slack workspace ID
  teamName: string; // Slack workspace name
  checkInChannelId: string; // Channel to monitor for check-ins
  checkInKeywords: string[]; // Keywords that indicate check-in (e.g., "good morning", "starting", "today's tasks")
  checkOutKeywords: string[]; // Keywords that indicate check-out (e.g., "signing off", "done for the day", "wrapping up")
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertSlackSettingsSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  signingSecret: z.string().min(1, "Signing secret is required"),
  appId: z.string().optional().default(""),
  teamId: z.string().optional().default(""),
  teamName: z.string().optional().default(""),
  checkInChannelId: z.string().optional().default(""),
  checkInKeywords: z.array(z.string()).default(["good morning", "gm", "starting work", "today's tasks", "morning update", "morning todos"]),
  checkOutKeywords: z.array(z.string()).default(["signing off", "done for the day", "wrapping up", "eod", "end of day", "logging off", "good night"]),
  isActive: z.boolean().default(true),
});

export type InsertSlackSettings = z.infer<typeof insertSlackSettingsSchema>;

// ============================================
// SLACK ATTENDANCE LOG
// ============================================
export interface SlackAttendanceLog {
  _id?: string;
  id: string;
  teamMemberId: string;
  slackUserId: string;
  slackMessageTs: string; // Slack message timestamp (unique ID)
  channelId: string;
  messageText: string;
  eventType: "CHECK_IN" | "CHECK_OUT";
  detectedKeyword: string;
  timestamp: Date;
  attendanceId: string | null; // Reference to the created/updated attendance record
  createdAt: Date;
}

export const insertSlackAttendanceLogSchema = z.object({
  teamMemberId: z.string().min(1),
  slackUserId: z.string().min(1),
  slackMessageTs: z.string().min(1),
  channelId: z.string().min(1),
  messageText: z.string(),
  eventType: z.enum(["CHECK_IN", "CHECK_OUT"]),
  detectedKeyword: z.string(),
  timestamp: z.string().or(z.date()),
  attendanceId: z.string().optional().nullable(),
});

export type InsertSlackAttendanceLog = z.infer<typeof insertSlackAttendanceLogSchema>;

export interface SlackAttendanceLogWithDetails extends SlackAttendanceLog {
  memberName?: string;
  memberEmail?: string;
}

// ============================================
// FIXED ASSETS
// ============================================

export interface FixedAsset {
  id: string;
  name: string;
  description: string;
  category: "FURNITURE" | "EQUIPMENT" | "VEHICLE" | "COMPUTER" | "SOFTWARE" | "BUILDING" | "LAND" | "OTHER";
  purchaseDate: Date;
  purchaseValue: number;
  currentValue: number;
  depreciationMethod: "STRAIGHT_LINE" | "WRITTEN_DOWN" | "NONE";
  depreciationRate: number; // Annual depreciation rate in percentage
  usefulLifeYears: number;
  salvageValue: number;
  vendor: string | null;
  invoiceNumber: string | null;
  location: string;
  status: "ACTIVE" | "DISPOSED" | "SOLD" | "WRITTEN_OFF";
  disposalDate: Date | null;
  disposalValue: number | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertFixedAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  description: z.string().default(""),
  category: z.enum(["FURNITURE", "EQUIPMENT", "VEHICLE", "COMPUTER", "SOFTWARE", "BUILDING", "LAND", "OTHER"]),
  purchaseDate: z.string().or(z.date()),
  purchaseValue: z.number().min(0),
  currentValue: z.number().min(0).optional(),
  depreciationMethod: z.enum(["STRAIGHT_LINE", "WRITTEN_DOWN", "NONE"]).default("STRAIGHT_LINE"),
  depreciationRate: z.number().min(0).max(100).default(10),
  usefulLifeYears: z.number().min(0).default(5),
  salvageValue: z.number().min(0).default(0),
  vendor: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  location: z.string().default(""),
  status: z.enum(["ACTIVE", "DISPOSED", "SOLD", "WRITTEN_OFF"]).default("ACTIVE"),
  disposalDate: z.string().or(z.date()).optional().nullable(),
  disposalValue: z.number().optional().nullable(),
  notes: z.string().default(""),
});

export type InsertFixedAsset = z.infer<typeof insertFixedAssetSchema>;
