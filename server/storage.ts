// Using MongoDB for database operations
import { getDb } from "./db";
import {
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
  type CompanyProfile,
  type JobRole,
  type InsertClient,
  type InsertProject,
  type InsertPayment,
  type InsertService,
  type InsertVendor,
  type InsertExpenseCategory,
  type InsertExpense,
  type InsertTeamMember,
  type InsertSalaryPayment,
  type InsertCompanyProfile,
  type InsertJobRole,
  type ClientWithStats,
  type InvoiceWithRelations,
  type VendorWithStats,
  type ExpenseWithRelations,
  type DashboardSummary,
  type FinancialSummary,
} from "@shared/schema";
import { nanoid } from "nanoid";

// Helper to convert MongoDB document to schema format (removes _id, keeps id)
const toSchema = <T extends { _id?: any; id?: string }>(doc: any): T => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  // Keep the id field if it exists, otherwise use _id as id
  return {
    ...rest,
    id: doc.id || (_id ? _id.toString() : nanoid()),
  } as T;
};

// Helper to convert schema format to MongoDB document (keeps id field, MongoDB will add _id)
const toMongo = (doc: any): any => {
  if (!doc) return doc;
  // Keep id field as-is, MongoDB will add _id automatically
  return doc;
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
  
  // Job Role methods
  getJobRoles(filters?: { status?: string }): Promise<JobRole[]>;
  getJobRoleById(id: string): Promise<JobRole | undefined>;
  createJobRole(role: InsertJobRole): Promise<JobRole>;
  updateJobRole(id: string, role: Partial<InsertJobRole>): Promise<JobRole>;
  seedDefaultJobRoles(): Promise<void>;
  
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
  
  // Company Profile methods
  getCompanyProfile(): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: string, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile>;
}

export class DatabaseStorage implements IStorage {
  private invoiceCounter: number = 1;
  
  // User methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    return user ? toSchema<User>(user) : undefined;
  }

  async createUser(user: { name: string; email: string; passwordHash: string; role: string }): Promise<User> {
    const db = await getDb();
    const newUser = {
      id: nanoid(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("users").insertOne(toMongo(newUser));
    return toSchema<User>(newUser);
  }

  // Client methods
  async getClients(filters?: { status?: string; search?: string }): Promise<ClientWithStats[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { contactName: { $regex: filters.search, $options: "i" } },
      ];
    }

    const clientList = await db.collection("clients").find(query).toArray();
    const clients = clientList.map(toSchema<Client>);

    // Add stats for each client
    const clientsWithStats: ClientWithStats[] = await Promise.all(
      clients.map(async (client: Client) => {
        const clientInvoices = await db.collection("invoices")
          .find({ clientId: client.id })
          .toArray();

        const totalInvoiced = clientInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.totalAmount || 0),
          0
        );
        const outstandingAmount = clientInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.balanceDue || 0),
          0
        );

        const clientProjects = await db.collection("projects")
          .find({ clientId: client.id })
          .toArray();

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
    const db = await getDb();
    const client = await db.collection("clients").findOne({ id });
    return client ? toSchema<Client>(client) : undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const db = await getDb();
    const newClient = {
      id: nanoid(),
      ...client,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("clients").insertOne(toMongo(newClient));
    return toSchema<Client>(newClient);
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const db = await getDb();
    const result = await db.collection("clients").findOneAndUpdate(
      { id },
      { $set: { ...client, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Client not found");
    return toSchema<Client>(result);
  }

  async updateClientStatus(id: string, status: string): Promise<Client> {
    const db = await getDb();
    const result = await db.collection("clients").findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Client not found");
    return toSchema<Client>(result);
  }

  // Project methods
  async getProjects(filters?: { clientId?: string }): Promise<Project[]> {
    const db = await getDb();
    const query: any = {};
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    const projects = await db.collection("projects").find(query).toArray();
    return projects.map(toSchema<Project>);
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const db = await getDb();
    const project = await db.collection("projects").findOne({ id });
    return project ? toSchema<Project>(project) : undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const db = await getDb();
    const newProject = {
      id: nanoid(),
      ...project,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("projects").insertOne(toMongo(newProject));
    return toSchema<Project>(newProject);
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const db = await getDb();
    const updateData: any = { ...project, updatedAt: new Date() };
    if (project.startDate) {
      updateData.startDate = new Date(project.startDate);
    }
    if (project.endDate !== undefined) {
      updateData.endDate = project.endDate ? new Date(project.endDate) : null;
    }
    
    const result = await db.collection("projects").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Project not found");
    return toSchema<Project>(result);
  }

  // Invoice methods
  async getInvoices(filters?: { 
    clientId?: string; 
    status?: string; 
    search?: string 
  }): Promise<InvoiceWithRelations[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.search) {
      query.invoiceNumber = { $regex: filters.search, $options: "i" };
    }

    const invoiceList = await db.collection("invoices")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Add relations
    const invoicesWithRelations: InvoiceWithRelations[] = await Promise.all(
      invoiceList.map(async (invoice: any) => {
        const inv = toSchema<Invoice>(invoice);
        const client = await db.collection("clients").findOne({ id: inv.clientId });
        const clientData = client ? toSchema<Client>(client) : null;

        let project = null;
        if (inv.projectId) {
          const projectDoc = await db.collection("projects").findOne({ id: inv.projectId });
          project = projectDoc ? toSchema<Project>(projectDoc) : null;
        }

        const lineItemsList = await db.collection("invoiceLineItems")
          .find({ invoiceId: inv.id })
          .toArray();

        const paymentsList = await db.collection("payments")
          .find({ invoiceId: inv.id })
          .toArray();

        return {
          ...inv,
          clientName: clientData?.name || "",
          projectName: project?.name || undefined,
          projectScope: project?.scope || undefined,
          lineItems: lineItemsList.map((item: any) => toSchema<InvoiceLineItem>(item)),
          payments: paymentsList.map((payment: any) => toSchema<Payment>(payment)),
        };
      })
    );

    return invoicesWithRelations;
  }

  async getInvoiceById(id: string): Promise<InvoiceWithRelations | undefined> {
    const db = await getDb();
    const invoice = await db.collection("invoices").findOne({ id });
    if (!invoice) return undefined;

    const inv = toSchema<Invoice>(invoice);
    const client = await db.collection("clients").findOne({ id: inv.clientId });
    const clientData = client ? toSchema<Client>(client) : null;

    let project = null;
    if (inv.projectId) {
      const projectDoc = await db.collection("projects").findOne({ id: inv.projectId });
      project = projectDoc ? toSchema<Project>(projectDoc) : null;
    }

    const lineItemsList = await db.collection("invoiceLineItems")
      .find({ invoiceId: inv.id })
      .toArray();

    const paymentsList = await db.collection("payments")
      .find({ invoiceId: inv.id })
      .toArray();

    return {
      ...inv,
      clientName: clientData?.name || "",
      projectName: project?.name || undefined,
      projectScope: project?.scope || undefined,
          lineItems: lineItemsList.map((item: any) => toSchema<InvoiceLineItem>(item)),
          payments: paymentsList.map((payment: any) => toSchema<Payment>(payment)),
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
    const db = await getDb();
    const invoiceNumber = invoice.invoiceNumber || `INV-${String(this.invoiceCounter++).padStart(4, "0")}`;
    const balanceDue = invoice.totalAmount;

    const newInvoice = {
      id: nanoid(),
      clientId: invoice.clientId,
      projectId: invoice.projectId,
      invoiceNumber,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: 0,
      balanceDue: balanceDue,
      status: invoice.status,
      notes: invoice.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("invoices").insertOne(toMongo(newInvoice));

    // Insert line items
    if (invoice.lineItems.length > 0) {
      const lineItems = invoice.lineItems.map((item) => ({
        id: nanoid(),
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }));
      await db.collection("invoiceLineItems").insertMany(lineItems.map(toMongo));
    }

    return toSchema<Invoice>(newInvoice);
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const db = await getDb();
    const updateData: any = { ...invoice, updatedAt: new Date() };
    if (invoice.issueDate) updateData.issueDate = new Date(invoice.issueDate);
    if (invoice.dueDate) updateData.dueDate = new Date(invoice.dueDate);

    const result = await db.collection("invoices").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Invoice not found");
    return toSchema<Invoice>(result);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const db = await getDb();
    const result = await db.collection("invoices").findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Invoice not found");
    return toSchema<Invoice>(result);
  }

  // Invoice Line Item methods
  async getLineItemsByInvoiceId(invoiceId: string): Promise<InvoiceLineItem[]> {
    const db = await getDb();
    const items = await db.collection("invoiceLineItems")
      .find({ invoiceId })
      .toArray();
    
    return items.map(toSchema<InvoiceLineItem>);
  }

  // Payment methods
  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const db = await getDb();
    const paymentsList = await db.collection("payments")
      .find({ invoiceId })
      .toArray();
    
    return paymentsList.map(toSchema<Payment>);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const db = await getDb();
    const newPayment = {
      id: nanoid(),
      invoiceId: payment.invoiceId,
      paymentDate: new Date(payment.paymentDate),
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference || "",
      notes: payment.notes || "",
      createdAt: new Date(),
    };
    await db.collection("payments").insertOne(toMongo(newPayment));

    // Update invoice amount paid and balance
    const invoice = await db.collection("invoices").findOne({ id: payment.invoiceId });

    if (invoice) {
      const newAmountPaid = (invoice.amountPaid || 0) + payment.amount;
      const totalAmount = invoice.totalAmount || 0;
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

      await db.collection("invoices").updateOne(
        { id: payment.invoiceId },
        {
          $set: {
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus,
            updatedAt: new Date(),
          },
        }
      );
    }

    return toSchema<Payment>(newPayment);
  }

  // Service methods
  async getServices(filters?: { status?: string; category?: string }): Promise<Service[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.category) {
      query.category = filters.category;
    }
    
    const serviceList = await db.collection("services")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return serviceList.map(toSchema<Service>);
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const db = await getDb();
    const service = await db.collection("services").findOne({ id });
    return service ? toSchema<Service>(service) : undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const db = await getDb();
    const newService = {
      id: nanoid(),
      name: service.name,
      description: service.description || "",
      category: service.category,
      defaultPrice: service.defaultPrice,
      currency: service.currency || "INR",
      unit: service.unit || "Hour",
      status: service.status || "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("services").insertOne(toMongo(newService));
    return toSchema<Service>(newService);
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const db = await getDb();
    const updateData: any = { updatedAt: new Date() };
    
    if (service.name !== undefined) updateData.name = service.name;
    if (service.description !== undefined) updateData.description = service.description;
    if (service.category !== undefined) updateData.category = service.category;
    if (service.defaultPrice !== undefined) updateData.defaultPrice = service.defaultPrice;
    if (service.currency !== undefined) updateData.currency = service.currency;
    if (service.unit !== undefined) updateData.unit = service.unit;
    if (service.status !== undefined) updateData.status = service.status;
    
    const result = await db.collection("services").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Service not found");
    return toSchema<Service>(result);
  }

  async updateServiceStatus(id: string, status: string): Promise<Service> {
    const db = await getDb();
    const result = await db.collection("services").findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Service not found");
    return toSchema<Service>(result);
  }

  // Dashboard methods
  async getDashboardSummary(): Promise<DashboardSummary> {
    const db = await getDb();
    const allInvoices = await db.collection("invoices").find({}).toArray();
    
    const totalInvoiced = allInvoices.reduce(
      (sum: number, inv: any) => sum + (inv.totalAmount || 0),
      0
    );
    const totalPaid = allInvoices.reduce(
      (sum: number, inv: any) => sum + (inv.amountPaid || 0),
      0
    );
    const totalOutstanding = allInvoices.reduce(
      (sum: number, inv: any) => sum + (inv.balanceDue || 0),
      0
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthInvoices = allInvoices.filter(
      (inv: any) => new Date(inv.createdAt) >= startOfMonth && new Date(inv.createdAt) <= endOfMonth
    );

    const thisMonthInvoiced = thisMonthInvoices.reduce(
      (sum: number, inv: any) => sum + (inv.totalAmount || 0),
      0
    );

    const thisMonthPayments = await db.collection("payments")
      .find({
        paymentDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      })
      .toArray();

    const thisMonthCollected = thisMonthPayments.reduce(
      (sum: number, payment: any) => sum + (payment.amount || 0),
      0
    );

    const activeClients = await db.collection("clients")
      .find({ status: "ACTIVE" })
      .toArray();

    const countOverdueInvoices = allInvoices.filter(
      (inv: any) => inv.status === "OVERDUE"
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
    const db = await getDb();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingInvoices = await db.collection("invoices")
      .find({
        dueDate: {
          $gte: now,
          $lte: thirtyDaysFromNow,
        },
      })
      .sort({ dueDate: 1 })
      .toArray();

    const invoicesWithRelations: InvoiceWithRelations[] = await Promise.all(
      upcomingInvoices.map(async (invoice: any) => {
        const inv = toSchema<Invoice>(invoice);
        const client = await db.collection("clients").findOne({ id: inv.clientId });
        const clientData = client ? toSchema<Client>(client) : null;

        let project = null;
        if (inv.projectId) {
          const projectDoc = await db.collection("projects").findOne({ id: inv.projectId });
          project = projectDoc ? toSchema<Project>(projectDoc) : null;
        }

        return {
          ...inv,
          clientName: clientData?.name || "",
          projectName: project?.name || undefined,
          projectScope: project?.scope || undefined,
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
    const db = await getDb();
    const query: any = {};
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.category) {
      query.category = filters.category;
    }
    
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { contactName: { $regex: filters.search, $options: "i" } },
      ];
    }

    const vendorList = await db.collection("vendors")
      .find(query)
      .toArray();

    // Add stats
    const vendorsWithStats: VendorWithStats[] = await Promise.all(
      vendorList.map(async (vendor: any) => {
        const vendorDoc = toSchema<Vendor>(vendor);
        const vendorExpenses = await db.collection("expenses")
          .find({ vendorId: vendorDoc.id })
          .toArray();

        const totalSpend = vendorExpenses
          .filter((exp: any) => exp.status === "PAID")
          .reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

        return {
          ...vendorDoc,
          totalSpend,
        };
      })
    );

    return vendorsWithStats;
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    const db = await getDb();
    const vendor = await db.collection("vendors").findOne({ id });
    return vendor ? toSchema<Vendor>(vendor) : undefined;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const db = await getDb();
    const newVendor = {
      id: nanoid(),
      ...vendor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("vendors").insertOne(toMongo(newVendor));
    return toSchema<Vendor>(newVendor);
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const db = await getDb();
    const result = await db.collection("vendors").findOneAndUpdate(
      { id },
      { $set: { ...vendor, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Vendor not found");
    return toSchema<Vendor>(result);
  }

  async updateVendorStatus(id: string, status: string): Promise<Vendor> {
    const db = await getDb();
    const result = await db.collection("vendors").findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Vendor not found");
    return toSchema<Vendor>(result);
  }

  // Expense Category methods
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const db = await getDb();
    const categories = await db.collection("expenseCategories").find({}).toArray();
    return categories.map(toSchema<ExpenseCategory>);
  }

  async getExpenseCategoryById(id: string): Promise<ExpenseCategory | undefined> {
    const db = await getDb();
    const category = await db.collection("expenseCategories").findOne({ id });
    return category ? toSchema<ExpenseCategory>(category) : undefined;
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const db = await getDb();
    const newCategory = {
      id: nanoid(),
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("expenseCategories").insertOne(toMongo(newCategory));
    return toSchema<ExpenseCategory>(newCategory);
  }

  async updateExpenseCategory(id: string, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory> {
    const db = await getDb();
    const result = await db.collection("expenseCategories").findOneAndUpdate(
      { id },
      { $set: { ...category, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Expense category not found");
    return toSchema<ExpenseCategory>(result);
  }

  // Expense methods
  async getExpenses(filters?: { 
    fromDate?: string;
    toDate?: string;
    vendorId?: string;
    categoryId?: string;
    status?: string;
  }): Promise<ExpenseWithRelations[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.fromDate) {
      query.expenseDate = { ...query.expenseDate, $gte: new Date(filters.fromDate) };
    }
    
    if (filters?.toDate) {
      query.expenseDate = { ...query.expenseDate, $lte: new Date(filters.toDate) };
    }
    
    if (filters?.vendorId) {
      query.vendorId = filters.vendorId;
    }
    
    if (filters?.categoryId) {
      query.categoryId = filters.categoryId;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const expenseList = await db.collection("expenses")
      .find(query)
      .sort({ expenseDate: -1 })
      .toArray();

    // Add relations
    const expensesWithRelations: ExpenseWithRelations[] = await Promise.all(
      expenseList.map(async (expense: any) => {
        const exp = toSchema<Expense>(expense);
        let vendor = null;
        if (exp.vendorId) {
          const vendorDoc = await db.collection("vendors").findOne({ id: exp.vendorId });
          vendor = vendorDoc ? toSchema<Vendor>(vendorDoc) : null;
        }

        const categoryDoc = await db.collection("expenseCategories").findOne({ id: exp.categoryId });
        const category = categoryDoc ? toSchema<ExpenseCategory>(categoryDoc) : null;

        return {
          ...exp,
          vendorName: vendor?.name || undefined,
          categoryName: category?.name || "",
        };
      })
    );

    return expensesWithRelations;
  }

  async getExpenseById(id: string): Promise<ExpenseWithRelations | undefined> {
    const db = await getDb();
    const expense = await db.collection("expenses").findOne({ id });
    if (!expense) return undefined;

    const exp = toSchema<Expense>(expense);
    let vendor = null;
    if (exp.vendorId) {
      const vendorDoc = await db.collection("vendors").findOne({ id: exp.vendorId });
      vendor = vendorDoc ? toSchema<Vendor>(vendorDoc) : null;
    }

    const categoryDoc = await db.collection("expenseCategories").findOne({ id: exp.categoryId });
    const category = categoryDoc ? toSchema<ExpenseCategory>(categoryDoc) : null;

    return {
      ...exp,
      vendorName: vendor?.name || undefined,
      categoryName: category?.name || "",
    };
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const db = await getDb();
    const newExpense = {
      id: nanoid(),
      ...expense,
      expenseDate: new Date(expense.expenseDate),
      dueDate: expense.dueDate ? new Date(expense.dueDate) : null,
      paidDate: expense.paidDate ? new Date(expense.paidDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("expenses").insertOne(toMongo(newExpense));
    return toSchema<Expense>(newExpense);
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const db = await getDb();
    const updateData: any = { ...expense, updatedAt: new Date() };
    
    if (expense.expenseDate) updateData.expenseDate = new Date(expense.expenseDate);
    if (expense.dueDate !== undefined) updateData.dueDate = expense.dueDate ? new Date(expense.dueDate) : null;
    if (expense.paidDate !== undefined) updateData.paidDate = expense.paidDate ? new Date(expense.paidDate) : null;

    const result = await db.collection("expenses").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Expense not found");
    return toSchema<Expense>(result);
  }

  async markExpensePaid(id: string, data: { 
    paymentDate: Date; 
    paymentMethod: string; 
    reference: string 
  }): Promise<Expense> {
    const db = await getDb();
    const result = await db.collection("expenses").findOneAndUpdate(
      { id },
      {
        $set: {
          paidDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          status: "PAID",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Expense not found");
    return toSchema<Expense>(result);
  }

  // Team Member methods
  async getTeamMembers(filters?: { status?: string }): Promise<TeamMember[]> {
    const db = await getDb();
    const query: any = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    
    const members = await db.collection("teamMembers").find(query).toArray();
    return members.map(toSchema<TeamMember>);
  }

  // Job Role methods
  async getJobRoles(filters?: { status?: string }): Promise<JobRole[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.status && filters.status !== "all") {
      query.status = filters.status;
    }

    const roles = await db.collection("jobRoles")
      .find(query)
      .sort({ title: 1 })
      .toArray();

    return roles.map(toSchema<JobRole>);
  }

  async getJobRoleById(id: string): Promise<JobRole | undefined> {
    const db = await getDb();
    const role = await db.collection("jobRoles").findOne({ id });
    return role ? toSchema<JobRole>(role) : undefined;
  }

  async createJobRole(role: InsertJobRole): Promise<JobRole> {
    const db = await getDb();
    const newRole = {
      id: nanoid(),
      ...role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("jobRoles").insertOne(toMongo(newRole));
    return toSchema<JobRole>(newRole);
  }

  async updateJobRole(id: string, role: Partial<InsertJobRole>): Promise<JobRole> {
    const db = await getDb();
    const result = await db.collection("jobRoles").findOneAndUpdate(
      { id },
      { $set: { ...role, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Job role not found");
    return toSchema<JobRole>(result);
  }

  async seedDefaultJobRoles(): Promise<void> {
    const db = await getDb();
    
    // Default job roles for a marketing agency - comprehensive list
    const defaultRoles = [
      // Leadership & Management
      { title: "CEO / Managing Director", description: "Chief Executive Officer, leads the agency", status: "ACTIVE" as const },
      { title: "COO", description: "Chief Operating Officer, manages operations", status: "ACTIVE" as const },
      { title: "CFO", description: "Chief Financial Officer, manages finances", status: "ACTIVE" as const },
      { title: "CMO", description: "Chief Marketing Officer, leads marketing strategy", status: "ACTIVE" as const },
      { title: "Creative Director", description: "Leads creative vision and oversees all creative output", status: "ACTIVE" as const },
      { title: "Art Director", description: "Manages visual aspects of campaigns and designs", status: "ACTIVE" as const },
      { title: "Associate Creative Director", description: "Supports creative director in leading creative teams", status: "ACTIVE" as const },
      
      // Account Management
      { title: "Account Director", description: "Senior client relationship manager", status: "ACTIVE" as const },
      { title: "Account Manager", description: "Manages client relationships and projects", status: "ACTIVE" as const },
      { title: "Senior Account Manager", description: "Experienced account manager handling key clients", status: "ACTIVE" as const },
      { title: "Account Executive", description: "Supports account management and client communication", status: "ACTIVE" as const },
      { title: "Account Coordinator", description: "Assists with account administration and coordination", status: "ACTIVE" as const },
      
      // Project Management
      { title: "Project Director", description: "Oversees multiple projects and project managers", status: "ACTIVE" as const },
      { title: "Project Manager", description: "Oversees project timelines and deliverables", status: "ACTIVE" as const },
      { title: "Senior Project Manager", description: "Manages complex, high-value projects", status: "ACTIVE" as const },
      { title: "Project Coordinator", description: "Assists with project scheduling and coordination", status: "ACTIVE" as const },
      
      // Strategy
      { title: "Strategy Director", description: "Leads strategic planning and brand strategy", status: "ACTIVE" as const },
      { title: "Brand Strategist", description: "Develops brand positioning and strategy", status: "ACTIVE" as const },
      { title: "Senior Strategist", description: "Develops comprehensive marketing strategies", status: "ACTIVE" as const },
      { title: "Content Strategist", description: "Develops content strategies and editorial calendars", status: "ACTIVE" as const },
      { title: "Digital Strategist", description: "Plans digital marketing and online presence strategies", status: "ACTIVE" as const },
      
      // Creative - Copy
      { title: "Head of Copy", description: "Leads copywriting team and content direction", status: "ACTIVE" as const },
      { title: "Senior Copywriter", description: "Experienced copywriter leading content strategy", status: "ACTIVE" as const },
      { title: "Copywriter", description: "Creates compelling written content for campaigns", status: "ACTIVE" as const },
      { title: "Junior Copywriter", description: "Entry-level copywriter developing skills", status: "ACTIVE" as const },
      { title: "Content Writer", description: "Writes blog posts, articles, and web content", status: "ACTIVE" as const },
      { title: "Script Writer", description: "Writes scripts for video and audio content", status: "ACTIVE" as const },
      
      // Creative - Design
      { title: "Design Director", description: "Leads design team and visual direction", status: "ACTIVE" as const },
      { title: "Senior Graphic Designer", description: "Experienced designer handling complex projects", status: "ACTIVE" as const },
      { title: "Graphic Designer", description: "Creates visual designs for digital and print media", status: "ACTIVE" as const },
      { title: "Junior Graphic Designer", description: "Entry-level designer developing skills", status: "ACTIVE" as const },
      { title: "UI/UX Designer", description: "Designs user interfaces and experiences", status: "ACTIVE" as const },
      { title: "Senior UI/UX Designer", description: "Leads UI/UX design for complex projects", status: "ACTIVE" as const },
      { title: "Motion Graphics Designer", description: "Creates animated and video content", status: "ACTIVE" as const },
      { title: "3D Designer", description: "Creates 3D graphics and visualizations", status: "ACTIVE" as const },
      { title: "Illustrator", description: "Creates custom illustrations and artwork", status: "ACTIVE" as const },
      
      // Video & Production
      { title: "Head of Production", description: "Leads video and content production", status: "ACTIVE" as const },
      { title: "Video Producer", description: "Produces video content from concept to delivery", status: "ACTIVE" as const },
      { title: "Senior Video Editor", description: "Leads video editing and post-production", status: "ACTIVE" as const },
      { title: "Video Editor", description: "Edits and post-produces video content", status: "ACTIVE" as const },
      { title: "Videographer", description: "Shoots video content for campaigns", status: "ACTIVE" as const },
      { title: "Photographer", description: "Captures professional photography for campaigns", status: "ACTIVE" as const },
      { title: "Audio Engineer", description: "Manages audio production and sound design", status: "ACTIVE" as const },
      
      // Digital Marketing
      { title: "Head of Digital", description: "Leads all digital marketing initiatives", status: "ACTIVE" as const },
      { title: "Digital Marketing Manager", description: "Manages digital marketing strategies and campaigns", status: "ACTIVE" as const },
      { title: "Digital Marketing Executive", description: "Executes digital marketing campaigns", status: "ACTIVE" as const },
      { title: "Performance Marketing Manager", description: "Manages performance-based marketing campaigns", status: "ACTIVE" as const },
      
      // Social Media
      { title: "Head of Social Media", description: "Leads social media strategy and team", status: "ACTIVE" as const },
      { title: "Social Media Manager", description: "Manages social media presence and content", status: "ACTIVE" as const },
      { title: "Senior Social Media Manager", description: "Leads social media strategy for key accounts", status: "ACTIVE" as const },
      { title: "Social Media Executive", description: "Executes social media campaigns and engagement", status: "ACTIVE" as const },
      { title: "Social Media Coordinator", description: "Coordinates social media content and scheduling", status: "ACTIVE" as const },
      { title: "Community Manager", description: "Manages online community engagement", status: "ACTIVE" as const },
      
      // SEO & SEM
      { title: "Head of SEO", description: "Leads search engine optimization strategy", status: "ACTIVE" as const },
      { title: "SEO Manager", description: "Manages SEO strategy and implementation", status: "ACTIVE" as const },
      { title: "SEO Specialist", description: "Optimizes content for search engines", status: "ACTIVE" as const },
      { title: "SEO Executive", description: "Executes SEO tasks and reporting", status: "ACTIVE" as const },
      { title: "SEM Manager", description: "Manages search engine marketing campaigns", status: "ACTIVE" as const },
      { title: "PPC Manager", description: "Manages pay-per-click campaigns", status: "ACTIVE" as const },
      { title: "PPC Specialist", description: "Manages pay-per-click advertising campaigns", status: "ACTIVE" as const },
      
      // Media
      { title: "Head of Media", description: "Leads media planning and buying", status: "ACTIVE" as const },
      { title: "Media Director", description: "Directs media strategy and planning", status: "ACTIVE" as const },
      { title: "Media Planner", description: "Plans media buying and advertising placements", status: "ACTIVE" as const },
      { title: "Senior Media Planner", description: "Leads media planning for major campaigns", status: "ACTIVE" as const },
      { title: "Media Buyer", description: "Executes media purchases and negotiations", status: "ACTIVE" as const },
      { title: "Programmatic Specialist", description: "Manages programmatic advertising", status: "ACTIVE" as const },
      
      // Analytics & Data
      { title: "Head of Analytics", description: "Leads data analytics and insights", status: "ACTIVE" as const },
      { title: "Marketing Analyst", description: "Analyzes marketing data and provides insights", status: "ACTIVE" as const },
      { title: "Senior Analyst", description: "Leads data analysis for complex projects", status: "ACTIVE" as const },
      { title: "Data Analyst", description: "Analyzes campaign performance data", status: "ACTIVE" as const },
      { title: "Business Intelligence Analyst", description: "Provides business insights from data", status: "ACTIVE" as const },
      
      // PR & Communications
      { title: "Head of PR", description: "Leads public relations strategy", status: "ACTIVE" as const },
      { title: "PR Manager", description: "Manages public relations campaigns", status: "ACTIVE" as const },
      { title: "PR Specialist", description: "Manages public relations and media outreach", status: "ACTIVE" as const },
      { title: "PR Executive", description: "Executes PR activities and media relations", status: "ACTIVE" as const },
      { title: "Communications Manager", description: "Manages corporate communications", status: "ACTIVE" as const },
      
      // Influencer Marketing
      { title: "Head of Influencer Marketing", description: "Leads influencer marketing strategy", status: "ACTIVE" as const },
      { title: "Influencer Marketing Manager", description: "Manages influencer partnerships and campaigns", status: "ACTIVE" as const },
      { title: "Influencer Coordinator", description: "Coordinates influencer outreach and relationships", status: "ACTIVE" as const },
      
      // Development & Technology
      { title: "Head of Technology", description: "Leads technology and development team", status: "ACTIVE" as const },
      { title: "Technical Director", description: "Directs technical implementation", status: "ACTIVE" as const },
      { title: "Senior Web Developer", description: "Leads web development projects", status: "ACTIVE" as const },
      { title: "Web Developer", description: "Develops and maintains websites", status: "ACTIVE" as const },
      { title: "Frontend Developer", description: "Builds user-facing web interfaces", status: "ACTIVE" as const },
      { title: "Backend Developer", description: "Develops server-side applications", status: "ACTIVE" as const },
      { title: "Full Stack Developer", description: "Develops both frontend and backend", status: "ACTIVE" as const },
      { title: "WordPress Developer", description: "Specializes in WordPress development", status: "ACTIVE" as const },
      { title: "Mobile App Developer", description: "Develops mobile applications", status: "ACTIVE" as const },
      
      // Operations & Administration
      { title: "Operations Director", description: "Directs agency operations", status: "ACTIVE" as const },
      { title: "Operations Manager", description: "Manages day-to-day agency operations", status: "ACTIVE" as const },
      { title: "Office Manager", description: "Manages office operations and facilities", status: "ACTIVE" as const },
      { title: "Office Administrator", description: "Handles administrative tasks and office management", status: "ACTIVE" as const },
      { title: "Executive Assistant", description: "Provides executive-level administrative support", status: "ACTIVE" as const },
      { title: "Receptionist", description: "Manages front desk and visitor coordination", status: "ACTIVE" as const },
      
      // HR & People
      { title: "HR Director", description: "Leads human resources strategy", status: "ACTIVE" as const },
      { title: "HR Manager", description: "Manages human resources and recruitment", status: "ACTIVE" as const },
      { title: "HR Executive", description: "Handles HR operations and employee relations", status: "ACTIVE" as const },
      { title: "Talent Acquisition Specialist", description: "Manages recruitment and hiring", status: "ACTIVE" as const },
      
      // Finance
      { title: "Finance Director", description: "Directs financial operations", status: "ACTIVE" as const },
      { title: "Finance Manager", description: "Manages financial operations and budgets", status: "ACTIVE" as const },
      { title: "Accountant", description: "Manages accounting and financial records", status: "ACTIVE" as const },
      { title: "Accounts Executive", description: "Handles accounts payable and receivable", status: "ACTIVE" as const },
      
      // Business Development
      { title: "Business Development Director", description: "Leads new business acquisition", status: "ACTIVE" as const },
      { title: "Business Development Manager", description: "Manages new business opportunities", status: "ACTIVE" as const },
      { title: "Sales Manager", description: "Manages sales and client acquisition", status: "ACTIVE" as const },
      
      // Interns & Trainees
      { title: "Creative Intern", description: "Creative department intern", status: "ACTIVE" as const },
      { title: "Design Intern", description: "Design department intern", status: "ACTIVE" as const },
      { title: "Marketing Intern", description: "Marketing department intern", status: "ACTIVE" as const },
      { title: "Social Media Intern", description: "Social media department intern", status: "ACTIVE" as const },
      { title: "Content Intern", description: "Content department intern", status: "ACTIVE" as const },
      { title: "Development Intern", description: "Development department intern", status: "ACTIVE" as const },
      { title: "HR Intern", description: "HR department intern", status: "ACTIVE" as const },
      { title: "Operations Intern", description: "Operations department intern", status: "ACTIVE" as const },
    ];

    // Get existing role titles
    const existingRoles = await db.collection("jobRoles").find({}).toArray();
    const existingTitles = new Set(existingRoles.map((r: any) => r.title.toLowerCase()));

    // Filter out roles that already exist
    const rolesToInsert = defaultRoles
      .filter(role => !existingTitles.has(role.title.toLowerCase()))
      .map(role => ({
        id: nanoid(),
        ...role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (rolesToInsert.length > 0) {
      await db.collection("jobRoles").insertMany(rolesToInsert.map(toMongo));
      console.log(`Seeded ${rolesToInsert.length} default job roles`);
    } else {
      console.log("All default job roles already exist");
    }
  }

  async getTeamMemberById(id: string): Promise<TeamMember | undefined> {
    const db = await getDb();
    const member = await db.collection("teamMembers").findOne({ id });
    return member ? toSchema<TeamMember>(member) : undefined;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const db = await getDb();
    const newMember = {
      id: nanoid(),
      ...member,
      joinedDate: new Date(member.joinedDate),
      exitDate: member.exitDate ? new Date(member.exitDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("teamMembers").insertOne(toMongo(newMember));
    return toSchema<TeamMember>(newMember);
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember> {
    const db = await getDb();
    const updateData: any = { ...member, updatedAt: new Date() };
    
    if (member.joinedDate) updateData.joinedDate = new Date(member.joinedDate);
    if (member.exitDate !== undefined) updateData.exitDate = member.exitDate ? new Date(member.exitDate) : null;

    const result = await db.collection("teamMembers").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Team member not found");
    return toSchema<TeamMember>(result);
  }

  async updateTeamMemberStatus(id: string, status: string): Promise<TeamMember> {
    const db = await getDb();
    const result = await db.collection("teamMembers").findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Team member not found");
    return toSchema<TeamMember>(result);
  }

  // Salary Payment methods
  async getSalaryPayments(filters?: { 
    teamMemberId?: string; 
    month?: string; 
    status?: string 
  }): Promise<SalaryPayment[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.teamMemberId) {
      query.teamMemberId = filters.teamMemberId;
    }
    
    if (filters?.month) {
      query.month = filters.month;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const payments = await db.collection("salaryPayments")
      .find(query)
      .sort({ month: -1 })
      .toArray();

    return payments.map(toSchema<SalaryPayment>);
  }

  async getSalaryPaymentById(id: string): Promise<SalaryPayment | undefined> {
    const db = await getDb();
    const payment = await db.collection("salaryPayments").findOne({ id });
    return payment ? toSchema<SalaryPayment>(payment) : undefined;
  }

  async createSalaryPayment(salary: InsertSalaryPayment): Promise<SalaryPayment> {
    const db = await getDb();
    const newSalary = {
      id: nanoid(),
      ...salary,
      paymentDate: salary.paymentDate ? new Date(salary.paymentDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("salaryPayments").insertOne(toMongo(newSalary));
    return toSchema<SalaryPayment>(newSalary);
  }

  async updateSalaryPayment(id: string, salary: Partial<InsertSalaryPayment>): Promise<SalaryPayment> {
    const db = await getDb();
    const updateData: any = { ...salary, updatedAt: new Date() };
    
    if (salary.paymentDate !== undefined) {
      updateData.paymentDate = salary.paymentDate ? new Date(salary.paymentDate) : null;
    }

    const result = await db.collection("salaryPayments").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Salary payment not found");
    return toSchema<SalaryPayment>(result);
  }

  async markSalaryPaid(id: string, data: { 
    paymentDate: Date; 
    paymentMethod: string; 
    reference: string 
  }): Promise<SalaryPayment> {
    const db = await getDb();
    const result = await db.collection("salaryPayments").findOneAndUpdate(
      { id },
      {
        $set: {
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          status: "PAID",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Salary payment not found");
    return toSchema<SalaryPayment>(result);
  }

  // Financial Dashboard
  async getFinancialSummary(filters?: { 
    fromDate?: string; 
    toDate?: string 
  }): Promise<FinancialSummary> {
    const db = await getDb();
    const now = new Date();
    const fromDate = filters?.fromDate ? new Date(filters.fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = filters?.toDate ? new Date(filters.toDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total Invoiced
    const invoicesInRange = await db.collection("invoices")
      .find({
        issueDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .toArray();

    const totalInvoiced = invoicesInRange.reduce(
      (sum: number, inv: any) => sum + (inv.totalAmount || 0),
      0
    );

    // Total Collected
    const paymentsInRange = await db.collection("payments")
      .find({
        paymentDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .toArray();

    const totalCollected = paymentsInRange.reduce(
      (sum: number, payment: any) => sum + (payment.amount || 0),
      0
    );

    // Total Expenses
    const expensesInRange = await db.collection("expenses")
      .find({
        status: "PAID",
        expenseDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .toArray();

    const totalExpenses = expensesInRange.reduce(
      (sum: number, exp: any) => sum + (exp.amount || 0),
      0
    );

    // Total Salaries
    const fromMonth = fromDate.toISOString().slice(0, 7);
    const toMonth = toDate.toISOString().slice(0, 7);
    const salariesInRange = await db.collection("salaryPayments")
      .find({
        status: "PAID",
        month: {
          $gte: fromMonth,
          $lte: toMonth,
        },
      })
      .toArray();

    const totalSalaries = salariesInRange.reduce(
      (sum: number, salary: any) => sum + (salary.amount || 0),
      0
    );

    // Net Profit
    const netProfit = totalCollected - (totalExpenses + totalSalaries);

    // Breakdown by Category
    const categories = await db.collection("expenseCategories").find({}).toArray();
    const breakdownByCategory = await Promise.all(
      categories.map(async (category: any) => {
        const categoryDoc = toSchema<ExpenseCategory>(category);
        const categoryExpenses = expensesInRange.filter(
          (exp: any) => exp.categoryId === categoryDoc.id
        );
        const totalAmount = categoryExpenses.reduce(
          (sum: number, exp: any) => sum + (exp.amount || 0),
          0
        );
        return {
          categoryName: categoryDoc.name,
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
          current.total += expense.amount || 0;
        } else {
          const vendor = await db.collection("vendors").findOne({ id: expense.vendorId });
          if (vendor) {
            const vendorDoc = toSchema<Vendor>(vendor);
            vendorSpend.set(expense.vendorId, {
              name: vendorDoc.name,
              total: expense.amount || 0,
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
      breakdownByCategory: breakdownByCategory.filter((cat: any) => cat.totalAmount > 0),
      topVendors,
    };
  }

  // Company Profile methods
  async getCompanyProfile(): Promise<CompanyProfile | undefined> {
    const db = await getDb();
    const profile = await db.collection("companyProfiles").findOne({});
    return profile ? toSchema<CompanyProfile>(profile) : undefined;
  }

  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const db = await getDb();
    const newProfile = {
      id: nanoid(),
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("companyProfiles").insertOne(toMongo(newProfile));
    return toSchema<CompanyProfile>(newProfile);
  }

  async updateCompanyProfile(id: string, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile> {
    const db = await getDb();
    const result = await db.collection("companyProfiles").findOneAndUpdate(
      { id },
      {
        $set: {
          ...profile,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Company profile not found");
    return toSchema<CompanyProfile>(result);
  }

  // ============================================
  // DELETE METHODS
  // ============================================

  async deleteClient(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Check for related projects
    const projectCount = await db.collection("projects").countDocuments({ clientId: id });
    if (projectCount > 0) {
      throw new Error("Cannot delete client with existing projects. Delete projects first.");
    }
    // Check for related invoices
    const invoiceCount = await db.collection("invoices").countDocuments({ clientId: id });
    if (invoiceCount > 0) {
      throw new Error("Cannot delete client with existing invoices. Delete invoices first.");
    }
    console.log(`Deleting client with id: ${id}`);
    const result = await db.collection("clients").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Client not found");
  }

  async deleteProject(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Check for related invoices
    const invoiceCount = await db.collection("invoices").countDocuments({ projectId: id });
    if (invoiceCount > 0) {
      throw new Error("Cannot delete project with existing invoices. Delete invoices first.");
    }
    console.log(`Deleting project with id: ${id}`);
    const result = await db.collection("projects").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Project not found");
  }

  async deleteInvoice(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Delete related line items
    await db.collection("invoiceLineItems").deleteMany({ invoiceId: id });
    // Delete related payments
    await db.collection("payments").deleteMany({ invoiceId: id });
    // Delete the invoice
    console.log(`Deleting invoice with id: ${id}`);
    const result = await db.collection("invoices").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Invoice not found");
  }

  async deleteService(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    console.log(`Deleting service with id: ${id}`);
    const result = await db.collection("services").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Service not found");
  }

  async deleteVendor(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Check for related expenses
    const expenseCount = await db.collection("expenses").countDocuments({ vendorId: id });
    if (expenseCount > 0) {
      throw new Error("Cannot delete vendor with existing expenses. Delete expenses first or remove vendor from expenses.");
    }
    console.log(`Deleting vendor with id: ${id}`);
    const result = await db.collection("vendors").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Vendor not found");
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Check for related expenses
    const expenseCount = await db.collection("expenses").countDocuments({ categoryId: id });
    if (expenseCount > 0) {
      throw new Error("Cannot delete category with existing expenses. Delete expenses first or change category.");
    }
    console.log(`Deleting expense category with id: ${id}`);
    const result = await db.collection("expenseCategories").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Expense category not found");
  }

  async deleteExpense(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    console.log(`Deleting expense with id: ${id}`);
    const result = await db.collection("expenses").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Expense not found");
  }

  async deleteTeamMember(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Check for related salary payments
    const salaryCount = await db.collection("salaryPayments").countDocuments({ teamMemberId: id });
    if (salaryCount > 0) {
      throw new Error("Cannot delete team member with existing salary records. Delete salary records first.");
    }
    console.log(`Deleting team member with id: ${id}`);
    const result = await db.collection("teamMembers").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Team member not found");
  }

  async deleteJobRole(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    console.log(`Deleting job role with id: ${id}`);
    const result = await db.collection("jobRoles").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Job role not found");
  }

  async deleteSalaryPayment(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    console.log(`Deleting salary payment with id: ${id}`);
    const result = await db.collection("salaryPayments").deleteOne({ id });
    console.log(`Delete result:`, result);
    if (result.deletedCount === 0) throw new Error("Salary payment not found");
  }
}

export const storage = new DatabaseStorage();
