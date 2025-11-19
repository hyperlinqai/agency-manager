import {
  type User,
  type Client,
  type Project,
  type Invoice,
  type InvoiceLineItem,
  type Payment,
  type Vendor,
  type ExpenseCategory,
  type Expense,
  type TeamMember,
  type SalaryPayment,
  type InsertClient,
  type InsertProject,
  type InsertPayment,
  type InsertVendor,
  type InsertExpenseCategory,
  type InsertExpense,
  type InsertTeamMember,
  type InsertSalaryPayment,
  type ClientWithStats,
  type InvoiceWithRelations,
  type VendorWithStats,
  type ExpenseWithRelations,
  type DashboardSummary,
  type FinancialSummary,
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User methods
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { name: string; email: string; passwordHash: string; role: string }): Promise<User>;
  
  // Client methods
  getClients(filters?: { status?: string; search?: string }): Promise<ClientWithStats[]>;
  getClientById(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  updateClientStatus(id: string, status: string): Promise<Client>;
  
  // Project methods
  getProjects(filters?: { clientId?: string }): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  
  // Invoice methods
  getInvoices(filters?: { clientId?: string; status?: string; search?: string }): Promise<InvoiceWithRelations[]>;
  getInvoiceById(id: string): Promise<InvoiceWithRelations | undefined>;
  createInvoice(invoice: {
    clientId: string;
    projectId: string | null;
    invoiceNumber?: string;
    issueDate: string | Date;
    dueDate: string | Date;
    currency: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    notes: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice>;
  
  // Invoice Line Item methods
  getLineItemsByInvoiceId(invoiceId: string): Promise<InvoiceLineItem[]>;
  
  // Payment methods
  getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Dashboard methods
  getDashboardSummary(): Promise<DashboardSummary>;
  getUpcomingInvoices(): Promise<InvoiceWithRelations[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private projects: Map<string, Project>;
  private invoices: Map<string, Invoice>;
  private lineItems: Map<string, InvoiceLineItem>;
  private payments: Map<string, Payment>;
  private invoiceCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.payments = new Map();
    this.invoiceCounter = 1;
  }

  // User methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(user: { name: string; email: string; passwordHash: string; role: string }): Promise<User> {
    const id = nanoid();
    const now = new Date();
    const newUser: User = {
      id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as any,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  // Client methods
  async getClients(filters?: { status?: string; search?: string }): Promise<ClientWithStats[]> {
    let clients = Array.from(this.clients.values());

    if (filters?.status) {
      clients = clients.filter((c) => c.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.contactName.toLowerCase().includes(search)
      );
    }

    // Add stats
    return clients.map((client) => {
      const clientInvoices = Array.from(this.invoices.values()).filter(
        (inv) => inv.clientId === client.id
      );
      const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const outstandingAmount = clientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const projectCount = Array.from(this.projects.values()).filter(
        (p) => p.clientId === client.id
      ).length;

      return {
        ...client,
        totalInvoiced,
        outstandingAmount,
        projectCount,
      };
    });
  }

  async getClientById(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = nanoid();
    const now = new Date();
    const newClient: Client = {
      id,
      ...client,
      portalUrl: client.portalUrl || "",
      createdAt: now,
      updatedAt: now,
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const existing = this.clients.get(id);
    if (!existing) throw new Error("Client not found");

    const updated: Client = {
      ...existing,
      ...client,
      updatedAt: new Date(),
    };
    this.clients.set(id, updated);
    return updated;
  }

  async updateClientStatus(id: string, status: string): Promise<Client> {
    const existing = this.clients.get(id);
    if (!existing) throw new Error("Client not found");

    const updated: Client = {
      ...existing,
      status: status as any,
      updatedAt: new Date(),
    };
    this.clients.set(id, updated);
    return updated;
  }

  // Project methods
  async getProjects(filters?: { clientId?: string }): Promise<Project[]> {
    let projects = Array.from(this.projects.values());

    if (filters?.clientId) {
      projects = projects.filter((p) => p.clientId === filters.clientId);
    }

    return projects;
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = nanoid();
    const now = new Date();
    const newProject: Project = {
      id,
      ...project,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : null,
      notes: project.notes || "",
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error("Project not found");

    const updated: Project = {
      ...existing,
      ...project,
      startDate: project.startDate ? new Date(project.startDate) : existing.startDate,
      endDate: project.endDate ? new Date(project.endDate) : existing.endDate,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  // Invoice methods
  private enrichInvoice(invoice: Invoice): InvoiceWithRelations {
    const client = this.clients.get(invoice.clientId);
    const project = invoice.projectId ? this.projects.get(invoice.projectId) : undefined;
    const lineItems = Array.from(this.lineItems.values()).filter(
      (item) => item.invoiceId === invoice.id
    );
    const payments = Array.from(this.payments.values()).filter(
      (payment) => payment.invoiceId === invoice.id
    );

    return {
      ...invoice,
      clientName: client?.name,
      projectName: project?.name,
      projectScope: project?.scope,
      lineItems,
      payments,
    };
  }

  async getInvoices(filters?: { clientId?: string; status?: string; search?: string }): Promise<InvoiceWithRelations[]> {
    let invoices = Array.from(this.invoices.values());

    if (filters?.clientId) {
      invoices = invoices.filter((inv) => inv.clientId === filters.clientId);
    }

    if (filters?.status) {
      invoices = invoices.filter((inv) => inv.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      invoices = invoices.filter((inv) => {
        const client = this.clients.get(inv.clientId);
        return (
          inv.invoiceNumber.toLowerCase().includes(search) ||
          client?.name.toLowerCase().includes(search)
        );
      });
    }

    return invoices.map((inv) => this.enrichInvoice(inv));
  }

  async getInvoiceById(id: string): Promise<InvoiceWithRelations | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    return this.enrichInvoice(invoice);
  }

  async createInvoice(data: {
    clientId: string;
    projectId: string | null;
    invoiceNumber?: string;
    issueDate: string | Date;
    dueDate: string | Date;
    currency: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    notes: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }): Promise<Invoice> {
    const id = nanoid();
    const now = new Date();
    
    const invoiceNumber = data.invoiceNumber || `INV-${String(this.invoiceCounter++).padStart(4, "0")}`;

    const newInvoice: Invoice = {
      id,
      clientId: data.clientId,
      projectId: data.projectId,
      invoiceNumber,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      currency: data.currency,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      amountPaid: 0,
      balanceDue: data.totalAmount,
      status: data.status as any,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.invoices.set(id, newInvoice);

    // Create line items
    for (const item of data.lineItems) {
      const lineItemId = nanoid();
      const lineItem: InvoiceLineItem = {
        id: lineItemId,
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      };
      this.lineItems.set(lineItemId, lineItem);
    }

    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const existing = this.invoices.get(id);
    if (!existing) throw new Error("Invoice not found");

    const updated: Invoice = {
      ...existing,
      ...invoice,
      updatedAt: new Date(),
    };
    this.invoices.set(id, updated);
    return updated;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const existing = this.invoices.get(id);
    if (!existing) throw new Error("Invoice not found");

    const updated: Invoice = {
      ...existing,
      status: status as any,
      updatedAt: new Date(),
    };
    this.invoices.set(id, updated);
    return updated;
  }

  // Invoice Line Item methods
  async getLineItemsByInvoiceId(invoiceId: string): Promise<InvoiceLineItem[]> {
    return Array.from(this.lineItems.values()).filter((item) => item.invoiceId === invoiceId);
  }

  // Payment methods
  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((payment) => payment.invoiceId === invoiceId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = nanoid();
    const now = new Date();
    
    const newPayment: Payment = {
      id,
      invoiceId: payment.invoiceId,
      paymentDate: new Date(payment.paymentDate),
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference || "",
      notes: payment.notes || "",
      createdAt: now,
    };

    this.payments.set(id, newPayment);

    // Update invoice amounts
    const invoice = this.invoices.get(payment.invoiceId);
    if (invoice) {
      const newAmountPaid = invoice.amountPaid + payment.amount;
      const newBalanceDue = invoice.totalAmount - newAmountPaid;
      
      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = "PAID";
      } else if (newAmountPaid > 0) {
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        if (today > dueDate) {
          newStatus = "OVERDUE";
        } else {
          newStatus = "PARTIALLY_PAID";
        }
      }

      const updatedInvoice: Invoice = {
        ...invoice,
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus as any,
        updatedAt: now,
      };
      this.invoices.set(payment.invoiceId, updatedInvoice);
    }

    return newPayment;
  }

  // Dashboard methods
  async getDashboardSummary(): Promise<DashboardSummary> {
    const invoices = Array.from(this.invoices.values());
    const clients = Array.from(this.clients.values());
    
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const thisMonthInvoices = invoices.filter((inv) => {
      const issueDate = new Date(inv.issueDate);
      return issueDate >= thisMonthStart && issueDate <= thisMonthEnd;
    });
    
    const thisMonthInvoiced = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const thisMonthPayments = Array.from(this.payments.values()).filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= thisMonthStart && paymentDate <= thisMonthEnd;
    });
    
    const thisMonthCollected = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const countActiveClients = clients.filter((c) => c.status === "ACTIVE").length;
    
    const countOverdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE").length;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      thisMonthInvoiced,
      thisMonthCollected,
      countActiveClients,
      countOverdueInvoices,
    };
  }

  async getUpcomingInvoices(): Promise<InvoiceWithRelations[]> {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcoming = Array.from(this.invoices.values())
      .filter((inv) => {
        const dueDate = new Date(inv.dueDate);
        return (
          inv.balanceDue > 0 &&
          dueDate >= today &&
          dueDate <= thirtyDaysFromNow
        );
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);

    return upcoming.map((inv) => this.enrichInvoice(inv));
  }
}

export const storage = new MemStorage();
