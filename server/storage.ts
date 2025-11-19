// Using Drizzle ORM for database operations - blueprint:javascript_database
import { db } from "./db";
import {
  users,
  clients,
  projects,
  invoices,
  invoiceLineItems,
  payments,
  services,
  vendors,
  expenseCategories,
  expenses,
  teamMembers,
  salaryPayments,
  type User,
  type Client,
  type Project,
  type Invoice,
  type InvoiceLineItem,
  type Payment,
  type Service,
  type Vendor,
  type ExpenseCategory,
  type Expense,
  type TeamMember,
  type SalaryPayment,
  type InsertClient,
  type InsertProject,
  type InsertPayment,
  type InsertService,
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
import { eq, and, gte, lte, sql, desc, ilike, or, isNull} from "drizzle-orm";
import { nanoid } from "nanoid";

// Helper to convert Drizzle decimal strings to numbers
const toNumber = (value: string | null | undefined): number => {
  if (!value) return 0;
  return parseFloat(value);
};

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
  
  // Service methods
  getServices(filters?: { status?: string; category?: string }): Promise<Service[]>;
  getServiceById(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  updateServiceStatus(id: string, status: string): Promise<Service>;
  
  // Dashboard methods
  getDashboardSummary(): Promise<DashboardSummary>;
  getUpcomingInvoices(): Promise<InvoiceWithRelations[]>;
  
  // Vendor methods
  getVendors(filters?: { status?: string; search?: string; category?: string }): Promise<VendorWithStats[]>;
  getVendorById(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  updateVendorStatus(id: string, status: string): Promise<Vendor>;
  
  // Expense Category methods
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenseCategoryById(id: string): Promise<ExpenseCategory | undefined>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: string, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory>;
  
  // Expense methods
  getExpenses(filters?: { 
    fromDate?: string;
    toDate?: string;
    vendorId?: string;
    categoryId?: string;
    status?: string;
  }): Promise<ExpenseWithRelations[]>;
  getExpenseById(id: string): Promise<ExpenseWithRelations | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  markExpensePaid(id: string, data: { paymentDate: Date; paymentMethod: string; reference: string }): Promise<Expense>;
  
  // Team Member methods
  getTeamMembers(filters?: { status?: string }): Promise<TeamMember[]>;
  getTeamMemberById(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember>;
  updateTeamMemberStatus(id: string, status: string): Promise<TeamMember>;
  
  // Salary Payment methods
  getSalaryPayments(filters?: { teamMemberId?: string; month?: string; status?: string }): Promise<SalaryPayment[]>;
  getSalaryPaymentById(id: string): Promise<SalaryPayment | undefined>;
  createSalaryPayment(salary: InsertSalaryPayment): Promise<SalaryPayment>;
  updateSalaryPayment(id: string, salary: Partial<InsertSalaryPayment>): Promise<SalaryPayment>;
  markSalaryPaid(id: string, data: { paymentDate: Date; paymentMethod: string; reference: string }): Promise<SalaryPayment>;
  
  // Financial Dashboard
  getFinancialSummary(filters?: { fromDate?: string; toDate?: string }): Promise<FinancialSummary>;
}

export class DatabaseStorage implements IStorage {
  private invoiceCounter: number = 1;
  
  // User methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: { name: string; email: string; passwordHash: string; role: string }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        id: nanoid(),
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as any,
      })
      .returning();
    return newUser;
  }

  // Client methods
  async getClients(filters?: { status?: string; search?: string }): Promise<ClientWithStats[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(clients.status, filters.status as any));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(clients.name, searchPattern),
          ilike(clients.email, searchPattern),
          ilike(clients.contactName, searchPattern)
        )!
      );
    }

    const clientList = await db
      .select()
      .from(clients)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Add stats for each client
    const clientsWithStats: ClientWithStats[] = await Promise.all(
      clientList.map(async (client) => {
        const clientInvoices = await db
          .select()
          .from(invoices)
          .where(eq(invoices.clientId, client.id));

        const totalInvoiced = clientInvoices.reduce(
          (sum, inv) => sum + toNumber(inv.totalAmount),
          0
        );
        const outstandingAmount = clientInvoices.reduce(
          (sum, inv) => sum + toNumber(inv.balanceDue),
          0
        );

        const clientProjects = await db
          .select()
          .from(projects)
          .where(eq(projects.clientId, client.id));

        return {
          ...client,
          totalInvoiced,
          outstandingAmount,
          projectCount: clientProjects.length,
        };
      })
    );

    return clientsWithStats;
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values({
        id: nanoid(),
        ...client,
      })
      .returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updated] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    if (!updated) throw new Error("Client not found");
    return updated;
  }

  async updateClientStatus(id: string, status: string): Promise<Client> {
    const [updated] = await db
      .update(clients)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    if (!updated) throw new Error("Client not found");
    return updated;
  }

  // Project methods
  async getProjects(filters?: { clientId?: string }): Promise<Project[]> {
    if (filters?.clientId) {
      return await db
        .select()
        .from(projects)
        .where(eq(projects.clientId, filters.clientId));
    }
    return await db.select().from(projects);
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        id: nanoid(),
        ...project,
        startDate: new Date(project.startDate),
        endDate: project.endDate ? new Date(project.endDate) : null,
      })
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const updateData: any = { ...project, updatedAt: new Date() };
    if (project.startDate) {
      updateData.startDate = new Date(project.startDate);
    }
    if (project.endDate) {
      updateData.endDate = new Date(project.endDate);
    }
    
    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    if (!updated) throw new Error("Project not found");
    return updated;
  }

  // Invoice methods
  async getInvoices(filters?: { 
    clientId?: string; 
    status?: string; 
    search?: string 
  }): Promise<InvoiceWithRelations[]> {
    const conditions = [];
    
    if (filters?.clientId) {
      conditions.push(eq(invoices.clientId, filters.clientId));
    }
    
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status as any));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(ilike(invoices.invoiceNumber, searchPattern));
    }

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt));

    // Add relations
    const invoicesWithRelations: InvoiceWithRelations[] = await Promise.all(
      invoiceList.map(async (invoice) => {
        const [client] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, invoice.clientId));

        let project = null;
        if (invoice.projectId) {
          [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, invoice.projectId));
        }

        const lineItemsList = await db
          .select()
          .from(invoiceLineItems)
          .where(eq(invoiceLineItems.invoiceId, invoice.id));

        const paymentsList = await db
          .select()
          .from(payments)
          .where(eq(payments.invoiceId, invoice.id));

        return {
          ...invoice,
          subtotal: toNumber(invoice.subtotal),
          taxAmount: toNumber(invoice.taxAmount),
          totalAmount: toNumber(invoice.totalAmount),
          amountPaid: toNumber(invoice.amountPaid),
          balanceDue: toNumber(invoice.balanceDue),
          clientName: client?.name || "",
          projectName: project?.name || null,
          projectScope: project?.scope || null,
          lineItems: lineItemsList.map((item) => ({
            ...item,
            quantity: toNumber(item.quantity),
            unitPrice: toNumber(item.unitPrice),
            lineTotal: toNumber(item.lineTotal),
          })),
          payments: paymentsList.map((payment) => ({
            ...payment,
            amount: toNumber(payment.amount),
          })),
        };
      })
    );

    return invoicesWithRelations;
  }

  async getInvoiceById(id: string): Promise<InvoiceWithRelations | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId));

    let project = null;
    if (invoice.projectId) {
      [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, invoice.projectId));
    }

    const lineItemsList = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id));

    const paymentsList = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice.id));

    return {
      ...invoice,
      subtotal: toNumber(invoice.subtotal),
      taxAmount: toNumber(invoice.taxAmount),
      totalAmount: toNumber(invoice.totalAmount),
      amountPaid: toNumber(invoice.amountPaid),
      balanceDue: toNumber(invoice.balanceDue),
      clientName: client?.name || "",
      projectName: project?.name || null,
      projectScope: project?.scope || null,
      lineItems: lineItemsList.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
        lineTotal: toNumber(item.lineTotal),
      })),
      payments: paymentsList.map((payment) => ({
        ...payment,
        amount: toNumber(payment.amount),
      })),
    };
  }

  async createInvoice(invoice: {
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
    const invoiceNumber = invoice.invoiceNumber || `INV-${String(this.invoiceCounter++).padStart(4, "0")}`;
    const balanceDue = invoice.totalAmount;

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        id: nanoid(),
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        invoiceNumber,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        currency: invoice.currency,
        subtotal: invoice.subtotal.toString(),
        taxAmount: invoice.taxAmount.toString(),
        totalAmount: invoice.totalAmount.toString(),
        amountPaid: "0",
        balanceDue: balanceDue.toString(),
        status: invoice.status as any,
        notes: invoice.notes,
      })
      .returning();

    // Insert line items
    if (invoice.lineItems.length > 0) {
      await db.insert(invoiceLineItems).values(
        invoice.lineItems.map((item) => ({
          id: nanoid(),
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          lineTotal: item.lineTotal.toString(),
        }))
      );
    }

    return {
      ...newInvoice,
      subtotal: toNumber(newInvoice.subtotal),
      taxAmount: toNumber(newInvoice.taxAmount),
      totalAmount: toNumber(newInvoice.totalAmount),
      amountPaid: toNumber(newInvoice.amountPaid),
      balanceDue: toNumber(newInvoice.balanceDue),
    };
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const updateData: any = { ...invoice, updatedAt: new Date() };
    
    // Convert numbers to strings for decimal fields
    if (invoice.subtotal !== undefined) updateData.subtotal = invoice.subtotal.toString();
    if (invoice.taxAmount !== undefined) updateData.taxAmount = invoice.taxAmount.toString();
    if (invoice.totalAmount !== undefined) updateData.totalAmount = invoice.totalAmount.toString();
    if (invoice.amountPaid !== undefined) updateData.amountPaid = invoice.amountPaid.toString();
    if (invoice.balanceDue !== undefined) updateData.balanceDue = invoice.balanceDue.toString();
    if (invoice.issueDate) updateData.issueDate = new Date(invoice.issueDate);
    if (invoice.dueDate) updateData.dueDate = new Date(invoice.dueDate);

    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    
    if (!updated) throw new Error("Invoice not found");
    
    return {
      ...updated,
      subtotal: toNumber(updated.subtotal),
      taxAmount: toNumber(updated.taxAmount),
      totalAmount: toNumber(updated.totalAmount),
      amountPaid: toNumber(updated.amountPaid),
      balanceDue: toNumber(updated.balanceDue),
    };
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    
    if (!updated) throw new Error("Invoice not found");
    
    return {
      ...updated,
      subtotal: toNumber(updated.subtotal),
      taxAmount: toNumber(updated.taxAmount),
      totalAmount: toNumber(updated.totalAmount),
      amountPaid: toNumber(updated.amountPaid),
      balanceDue: toNumber(updated.balanceDue),
    };
  }

  // Invoice Line Item methods
  async getLineItemsByInvoiceId(invoiceId: string): Promise<InvoiceLineItem[]> {
    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));
    
    return items.map((item) => ({
      ...item,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      lineTotal: toNumber(item.lineTotal),
    }));
  }

  // Payment methods
  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const paymentsList = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
    
    return paymentsList.map((payment) => ({
      ...payment,
      amount: toNumber(payment.amount),
    }));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({
        id: nanoid(),
        invoiceId: payment.invoiceId,
        paymentDate: new Date(payment.paymentDate),
        amount: payment.amount.toString(),
        method: payment.method,
        reference: payment.reference || "",
        notes: payment.notes || "",
      })
      .returning();

    // Update invoice amount paid and balance
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, payment.invoiceId));

    if (invoice) {
      const newAmountPaid = toNumber(invoice.amountPaid) + payment.amount;
      const totalAmount = toNumber(invoice.totalAmount);
      const newBalanceDue = totalAmount - newAmountPaid;

      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = "PAID";
      } else if (newAmountPaid > 0) {
        const dueDate = new Date(invoice.dueDate);
        const now = new Date();
        if (now > dueDate) {
          newStatus = "OVERDUE";
        } else {
          newStatus = "PARTIALLY_PAID";
        }
      }

      await db
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toString(),
          balanceDue: newBalanceDue.toString(),
          status: newStatus as any,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, payment.invoiceId));
    }

    return {
      ...newPayment,
      amount: toNumber(newPayment.amount),
    };
  }

  // Service methods
  async getServices(filters?: { status?: string; category?: string }): Promise<Service[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(services.status, filters.status as any));
    }
    
    if (filters?.category) {
      conditions.push(eq(services.category, filters.category as any));
    }
    
    const serviceList = await db
      .select()
      .from(services)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(services.createdAt));
    
    return serviceList.map(service => ({
      ...service,
      defaultPrice: toNumber(service.defaultPrice),
    }));
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    
    if (!service) return undefined;
    
    return {
      ...service,
      defaultPrice: toNumber(service.defaultPrice),
    };
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values({
        id: nanoid(),
        name: service.name,
        description: service.description || "",
        category: service.category,
        defaultPrice: service.defaultPrice.toString(),
        currency: service.currency || "INR",
        unit: service.unit || "Hour",
        status: service.status || "ACTIVE",
      })
      .returning();
    
    return {
      ...newService,
      defaultPrice: toNumber(newService.defaultPrice),
    };
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (service.name !== undefined) updateData.name = service.name;
    if (service.description !== undefined) updateData.description = service.description;
    if (service.category !== undefined) updateData.category = service.category;
    if (service.defaultPrice !== undefined) updateData.defaultPrice = service.defaultPrice.toString();
    if (service.currency !== undefined) updateData.currency = service.currency;
    if (service.unit !== undefined) updateData.unit = service.unit;
    if (service.status !== undefined) updateData.status = service.status;
    
    const [updatedService] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();
    
    return {
      ...updatedService,
      defaultPrice: toNumber(updatedService.defaultPrice),
    };
  }

  async updateServiceStatus(id: string, status: string): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    
    return {
      ...updatedService,
      defaultPrice: toNumber(updatedService.defaultPrice),
    };
  }

  // Dashboard methods
  async getDashboardSummary(): Promise<DashboardSummary> {
    const allInvoices = await db.select().from(invoices);
    
    const totalInvoiced = allInvoices.reduce(
      (sum, inv) => sum + toNumber(inv.totalAmount),
      0
    );
    const totalPaid = allInvoices.reduce(
      (sum, inv) => sum + toNumber(inv.amountPaid),
      0
    );
    const totalOutstanding = allInvoices.reduce(
      (sum, inv) => sum + toNumber(inv.balanceDue),
      0
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthInvoices = allInvoices.filter(
      (inv) => new Date(inv.createdAt) >= startOfMonth && new Date(inv.createdAt) <= endOfMonth
    );

    const thisMonthInvoiced = thisMonthInvoices.reduce(
      (sum, inv) => sum + toNumber(inv.totalAmount),
      0
    );

    const thisMonthPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          gte(payments.paymentDate, startOfMonth),
          lte(payments.paymentDate, endOfMonth)
        )
      );

    const thisMonthCollected = thisMonthPayments.reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0
    );

    const activeClients = await db
      .select()
      .from(clients)
      .where(eq(clients.status, "ACTIVE"));

    const countOverdueInvoices = allInvoices.filter(
      (inv) => inv.status === "OVERDUE"
    ).length;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      thisMonthInvoiced,
      thisMonthCollected,
      countActiveClients: activeClients.length,
      countOverdueInvoices,
    };
  }

  async getUpcomingInvoices(): Promise<InvoiceWithRelations[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          gte(invoices.dueDate, now),
          lte(invoices.dueDate, thirtyDaysFromNow)
        )
      )
      .orderBy(invoices.dueDate);

    const invoicesWithRelations: InvoiceWithRelations[] = await Promise.all(
      upcomingInvoices.map(async (invoice) => {
        const [client] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, invoice.clientId));

        let project = null;
        if (invoice.projectId) {
          [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, invoice.projectId));
        }

        return {
          ...invoice,
          subtotal: toNumber(invoice.subtotal),
          taxAmount: toNumber(invoice.taxAmount),
          totalAmount: toNumber(invoice.totalAmount),
          amountPaid: toNumber(invoice.amountPaid),
          balanceDue: toNumber(invoice.balanceDue),
          clientName: client?.name || "",
          projectName: project?.name || null,
          projectScope: project?.scope || null,
        };
      })
    );

    return invoicesWithRelations;
  }

  // Vendor methods
  async getVendors(filters?: { 
    status?: string; 
    search?: string; 
    category?: string 
  }): Promise<VendorWithStats[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(vendors.status, filters.status as any));
    }
    
    if (filters?.category) {
      conditions.push(eq(vendors.category, filters.category as any));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(vendors.name, searchPattern),
          ilike(vendors.email, searchPattern),
          ilike(vendors.contactName, searchPattern)
        )!
      );
    }

    const vendorList = await db
      .select()
      .from(vendors)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Add stats
    const vendorsWithStats: VendorWithStats[] = await Promise.all(
      vendorList.map(async (vendor) => {
        const vendorExpenses = await db
          .select()
          .from(expenses)
          .where(eq(expenses.vendorId, vendor.id));

        const totalSpend = vendorExpenses
          .filter((exp) => exp.status === "PAID")
          .reduce((sum, exp) => sum + toNumber(exp.amount), 0);

        return {
          ...vendor,
          totalSpend,
        };
      })
    );

    return vendorsWithStats;
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db
      .insert(vendors)
      .values({
        id: nanoid(),
        ...vendor,
      })
      .returning();
    return newVendor;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updated] = await db
      .update(vendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    if (!updated) throw new Error("Vendor not found");
    return updated;
  }

  async updateVendorStatus(id: string, status: string): Promise<Vendor> {
    const [updated] = await db
      .update(vendors)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    if (!updated) throw new Error("Vendor not found");
    return updated;
  }

  // Expense Category methods
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return await db.select().from(expenseCategories);
  }

  async getExpenseCategoryById(id: string): Promise<ExpenseCategory | undefined> {
    const [category] = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    return category || undefined;
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [newCategory] = await db
      .insert(expenseCategories)
      .values({
        id: nanoid(),
        ...category,
      })
      .returning();
    return newCategory;
  }

  async updateExpenseCategory(id: string, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory> {
    const [updated] = await db
      .update(expenseCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(expenseCategories.id, id))
      .returning();
    if (!updated) throw new Error("Expense category not found");
    return updated;
  }

  // Expense methods
  async getExpenses(filters?: { 
    fromDate?: string;
    toDate?: string;
    vendorId?: string;
    categoryId?: string;
    status?: string;
  }): Promise<ExpenseWithRelations[]> {
    const conditions = [];
    
    if (filters?.fromDate) {
      conditions.push(gte(expenses.expenseDate, new Date(filters.fromDate)));
    }
    
    if (filters?.toDate) {
      conditions.push(lte(expenses.expenseDate, new Date(filters.toDate)));
    }
    
    if (filters?.vendorId) {
      conditions.push(eq(expenses.vendorId, filters.vendorId));
    }
    
    if (filters?.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    
    if (filters?.status) {
      conditions.push(eq(expenses.status, filters.status as any));
    }

    const expenseList = await db
      .select()
      .from(expenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expenses.expenseDate));

    // Add relations
    const expensesWithRelations: ExpenseWithRelations[] = await Promise.all(
      expenseList.map(async (expense) => {
        let vendor = null;
        if (expense.vendorId) {
          [vendor] = await db
            .select()
            .from(vendors)
            .where(eq(vendors.id, expense.vendorId));
        }

        const [category] = await db
          .select()
          .from(expenseCategories)
          .where(eq(expenseCategories.id, expense.categoryId));

        return {
          ...expense,
          amount: toNumber(expense.amount),
          vendorName: vendor?.name || null,
          categoryName: category?.name || "",
        };
      })
    );

    return expensesWithRelations;
  }

  async getExpenseById(id: string): Promise<ExpenseWithRelations | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    if (!expense) return undefined;

    let vendor = null;
    if (expense.vendorId) {
      [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, expense.vendorId));
    }

    const [category] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, expense.categoryId));

    return {
      ...expense,
      amount: toNumber(expense.amount),
      vendorName: vendor?.name || null,
      categoryName: category?.name || "",
    };
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values({
        id: nanoid(),
        ...expense,
        amount: expense.amount.toString(),
        expenseDate: new Date(expense.expenseDate),
        dueDate: expense.dueDate ? new Date(expense.dueDate) : null,
        paidDate: expense.paidDate ? new Date(expense.paidDate) : null,
      })
      .returning();
    
    return {
      ...newExpense,
      amount: toNumber(newExpense.amount),
    };
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const updateData: any = { ...expense, updatedAt: new Date() };
    
    if (expense.amount !== undefined) updateData.amount = expense.amount.toString();
    if (expense.expenseDate) updateData.expenseDate = new Date(expense.expenseDate);
    if (expense.dueDate) updateData.dueDate = new Date(expense.dueDate);
    if (expense.paidDate) updateData.paidDate = new Date(expense.paidDate);

    const [updated] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    
    if (!updated) throw new Error("Expense not found");
    
    return {
      ...updated,
      amount: toNumber(updated.amount),
    };
  }

  async markExpensePaid(id: string, data: { 
    paymentDate: Date; 
    paymentMethod: string; 
    reference: string 
  }): Promise<Expense> {
    const [updated] = await db
      .update(expenses)
      .set({
        paidDate: data.paymentDate,
        paymentMethod: data.paymentMethod as any,
        reference: data.reference,
        status: "PAID",
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning();
    
    if (!updated) throw new Error("Expense not found");
    
    return {
      ...updated,
      amount: toNumber(updated.amount),
    };
  }

  // Team Member methods
  async getTeamMembers(filters?: { status?: string }): Promise<TeamMember[]> {
    if (filters?.status) {
      const members = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.status, filters.status as any));
      
      return members.map((member) => ({
        ...member,
        baseSalary: toNumber(member.baseSalary),
      }));
    }
    
    const members = await db.select().from(teamMembers);
    return members.map((member) => ({
      ...member,
      baseSalary: toNumber(member.baseSalary),
    }));
  }

  async getTeamMemberById(id: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    if (!member) return undefined;
    
    return {
      ...member,
      baseSalary: toNumber(member.baseSalary),
    };
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        id: nanoid(),
        ...member,
        baseSalary: member.baseSalary.toString(),
        joinedDate: new Date(member.joinedDate),
        exitDate: member.exitDate ? new Date(member.exitDate) : null,
      })
      .returning();
    
    return {
      ...newMember,
      baseSalary: toNumber(newMember.baseSalary),
    };
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember> {
    const updateData: any = { ...member, updatedAt: new Date() };
    
    if (member.baseSalary !== undefined) updateData.baseSalary = member.baseSalary.toString();
    if (member.joinedDate) updateData.joinedDate = new Date(member.joinedDate);
    if (member.exitDate) updateData.exitDate = new Date(member.exitDate);

    const [updated] = await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, id))
      .returning();
    
    if (!updated) throw new Error("Team member not found");
    
    return {
      ...updated,
      baseSalary: toNumber(updated.baseSalary),
    };
  }

  async updateTeamMemberStatus(id: string, status: string): Promise<TeamMember> {
    const [updated] = await db
      .update(teamMembers)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    
    if (!updated) throw new Error("Team member not found");
    
    return {
      ...updated,
      baseSalary: toNumber(updated.baseSalary),
    };
  }

  // Salary Payment methods
  async getSalaryPayments(filters?: { 
    teamMemberId?: string; 
    month?: string; 
    status?: string 
  }): Promise<SalaryPayment[]> {
    const conditions = [];
    
    if (filters?.teamMemberId) {
      conditions.push(eq(salaryPayments.teamMemberId, filters.teamMemberId));
    }
    
    if (filters?.month) {
      conditions.push(eq(salaryPayments.month, filters.month));
    }
    
    if (filters?.status) {
      conditions.push(eq(salaryPayments.status, filters.status as any));
    }

    const payments = await db
      .select()
      .from(salaryPayments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(salaryPayments.month));

    return payments.map((payment) => ({
      ...payment,
      amount: toNumber(payment.amount),
    }));
  }

  async getSalaryPaymentById(id: string): Promise<SalaryPayment | undefined> {
    const [payment] = await db.select().from(salaryPayments).where(eq(salaryPayments.id, id));
    if (!payment) return undefined;
    
    return {
      ...payment,
      amount: toNumber(payment.amount),
    };
  }

  async createSalaryPayment(salary: InsertSalaryPayment): Promise<SalaryPayment> {
    const [newSalary] = await db
      .insert(salaryPayments)
      .values({
        id: nanoid(),
        ...salary,
        amount: salary.amount.toString(),
        paymentDate: salary.paymentDate ? new Date(salary.paymentDate) : null,
      })
      .returning();
    
    return {
      ...newSalary,
      amount: toNumber(newSalary.amount),
    };
  }

  async updateSalaryPayment(id: string, salary: Partial<InsertSalaryPayment>): Promise<SalaryPayment> {
    const updateData: any = { ...salary, updatedAt: new Date() };
    
    if (salary.amount !== undefined) updateData.amount = salary.amount.toString();
    if (salary.paymentDate) updateData.paymentDate = new Date(salary.paymentDate);

    const [updated] = await db
      .update(salaryPayments)
      .set(updateData)
      .where(eq(salaryPayments.id, id))
      .returning();
    
    if (!updated) throw new Error("Salary payment not found");
    
    return {
      ...updated,
      amount: toNumber(updated.amount),
    };
  }

  async markSalaryPaid(id: string, data: { 
    paymentDate: Date; 
    paymentMethod: string; 
    reference: string 
  }): Promise<SalaryPayment> {
    const [updated] = await db
      .update(salaryPayments)
      .set({
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod as any,
        reference: data.reference,
        status: "PAID",
        updatedAt: new Date(),
      })
      .where(eq(salaryPayments.id, id))
      .returning();
    
    if (!updated) throw new Error("Salary payment not found");
    
    return {
      ...updated,
      amount: toNumber(updated.amount),
    };
  }

  // Financial Dashboard
  async getFinancialSummary(filters?: { 
    fromDate?: string; 
    toDate?: string 
  }): Promise<FinancialSummary> {
    const now = new Date();
    const fromDate = filters?.fromDate ? new Date(filters.fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = filters?.toDate ? new Date(filters.toDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total Invoiced
    const invoicesInRange = await db
      .select()
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, fromDate),
          lte(invoices.issueDate, toDate)
        )
      );

    const totalInvoiced = invoicesInRange.reduce(
      (sum, inv) => sum + toNumber(inv.totalAmount),
      0
    );

    // Total Collected
    const paymentsInRange = await db
      .select()
      .from(payments)
      .where(
        and(
          gte(payments.paymentDate, fromDate),
          lte(payments.paymentDate, toDate)
        )
      );

    const totalCollected = paymentsInRange.reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0
    );

    // Total Expenses
    const expensesInRange = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.status, "PAID"),
          gte(expenses.expenseDate, fromDate),
          lte(expenses.expenseDate, toDate)
        )
      );

    const totalExpenses = expensesInRange.reduce(
      (sum, exp) => sum + toNumber(exp.amount),
      0
    );

    // Total Salaries
    const salariesInRange = await db
      .select()
      .from(salaryPayments)
      .where(
        and(
          eq(salaryPayments.status, "PAID"),
          sql`${salaryPayments.month} >= ${fromDate.toISOString().slice(0, 7)}`,
          sql`${salaryPayments.month} <= ${toDate.toISOString().slice(0, 7)}`
        )
      );

    const totalSalaries = salariesInRange.reduce(
      (sum, salary) => sum + toNumber(salary.amount),
      0
    );

    // Net Profit
    const netProfit = totalCollected - (totalExpenses + totalSalaries);

    // Breakdown by Category
    const categories = await db.select().from(expenseCategories);
    const breakdownByCategory = await Promise.all(
      categories.map(async (category) => {
        const categoryExpenses = expensesInRange.filter(
          (exp) => exp.categoryId === category.id
        );
        const totalAmount = categoryExpenses.reduce(
          (sum, exp) => sum + toNumber(exp.amount),
          0
        );
        return {
          categoryName: category.name,
          totalAmount,
        };
      })
    );

    // Top Vendors
    const vendorSpend = new Map<string, { name: string; total: number }>();
    
    for (const expense of expensesInRange) {
      if (expense.vendorId) {
        const current = vendorSpend.get(expense.vendorId);
        if (current) {
          current.total += toNumber(expense.amount);
        } else {
          const [vendor] = await db
            .select()
            .from(vendors)
            .where(eq(vendors.id, expense.vendorId));
          if (vendor) {
            vendorSpend.set(expense.vendorId, {
              name: vendor.name,
              total: toNumber(expense.amount),
            });
          }
        }
      }
    }

    const topVendors = Array.from(vendorSpend.entries())
      .map(([vendorId, data]) => ({
        vendorId,
        vendorName: data.name,
        totalAmount: data.total,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return {
      totalIncome: totalCollected,  // Use totalCollected as income (actual money received)
      totalExpenses: totalExpenses + totalSalaries,  // Combine expenses and salaries
      netProfit,
      totalInvoiced,  // Keep for reference
      totalSalaries,  // Keep for reference
      breakdownByCategory: breakdownByCategory.filter((cat) => cat.totalAmount > 0),
      topVendors,
    };
  }
}

export const storage = new DatabaseStorage();
