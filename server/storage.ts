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
  type Proposal,
  type Contract,
  type ClientOnboardingData,
  type MonthlyReport,
  type ClientDigitalAsset,
  type ApiSettings,
  type Attendance,
  type LeaveType,
  type LeavePolicy,
  type LeaveRequest,
  type LeaveBalance,
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
  type InsertProposal,
  type InsertContract,
  type InsertClientOnboardingData,
  type InsertMonthlyReport,
  type InsertClientDigitalAsset,
  type InsertApiSettings,
  type InsertAttendance,
  type InsertLeaveType,
  type InsertLeavePolicy,
  type InsertLeaveRequest,
  type InsertLeaveBalance,
  type ClientWithStats,
  type InvoiceWithRelations,
  type VendorWithStats,
  type ExpenseWithRelations,
  type ProposalWithRelations,
  type ContractWithRelations,
  type MonthlyReportWithRelations,
  type AttendanceWithMember,
  type LeavePolicyWithDetails,
  type LeaveRequestWithDetails,
  type LeaveBalanceWithDetails,
  type DashboardSummary,
  type FinancialSummary,
  type SlackSettings,
  type SlackAttendanceLog,
  type InsertSlackSettings,
  type InsertSlackAttendanceLog,
  type SlackAttendanceLogWithDetails,
  type FixedAsset,
  type InsertFixedAsset,
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
  getTeamMemberByOnboardingToken(token: string): Promise<TeamMember | undefined>;
  regenerateTeamMemberOnboardingToken(teamMemberId: string): Promise<TeamMember>;
  
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
  
  // ============================================
  // MARKETING MODULE METHODS
  // ============================================
  
  // Proposal methods
  getProposals(filters?: { clientId?: string; status?: string }): Promise<ProposalWithRelations[]>;
  getProposalById(id: string): Promise<ProposalWithRelations | undefined>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal>;
  updateProposalStatus(id: string, status: string): Promise<Proposal>;
  deleteProposal(id: string): Promise<void>;
  
  // Contract methods
  getContracts(filters?: { clientId?: string; status?: string }): Promise<ContractWithRelations[]>;
  getContractById(id: string): Promise<ContractWithRelations | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  updateContractStatus(id: string, status: string): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  
  // Client Onboarding Data methods
  getClientOnboardingData(clientId: string): Promise<ClientOnboardingData | undefined>;
  createClientOnboardingData(data: InsertClientOnboardingData): Promise<ClientOnboardingData>;
  updateClientOnboardingData(id: string, data: Partial<InsertClientOnboardingData>): Promise<ClientOnboardingData>;
  getClientByOnboardingToken(token: string): Promise<Client | undefined>;
  regenerateOnboardingToken(clientId: string): Promise<Client>;
  
  // Monthly Report methods
  getMonthlyReports(filters?: { clientId?: string; projectId?: string; status?: string }): Promise<MonthlyReportWithRelations[]>;
  getMonthlyReportById(id: string): Promise<MonthlyReportWithRelations | undefined>;
  createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport>;
  updateMonthlyReport(id: string, report: Partial<InsertMonthlyReport>): Promise<MonthlyReport>;
  updateMonthlyReportStatus(id: string, status: string): Promise<MonthlyReport>;
  deleteMonthlyReport(id: string): Promise<void>;
  
  // Client Digital Asset methods
  getClientDigitalAssets(filters?: { clientId?: string; category?: string }): Promise<ClientDigitalAsset[]>;
  getClientDigitalAssetById(id: string): Promise<ClientDigitalAsset | undefined>;
  createClientDigitalAsset(asset: InsertClientDigitalAsset): Promise<ClientDigitalAsset>;
  updateClientDigitalAsset(id: string, asset: Partial<InsertClientDigitalAsset>): Promise<ClientDigitalAsset>;
  deleteClientDigitalAsset(id: string): Promise<void>;

  // API Settings methods
  getApiSettings(): Promise<ApiSettings | undefined>;
  upsertApiSettings(settings: Partial<InsertApiSettings>): Promise<ApiSettings>;

  // ============================================
  // HR & PAYROLL MODULE METHODS
  // ============================================

  // Attendance methods
  getAttendance(filters?: { teamMemberId?: string; fromDate?: string; toDate?: string; status?: string }): Promise<AttendanceWithMember[]>;
  getAttendanceById(id: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  createBulkAttendance(records: InsertAttendance[]): Promise<Attendance[]>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  deleteAttendance(id: string): Promise<void>;

  // Leave Type methods
  getLeaveTypes(filters?: { isActive?: boolean }): Promise<LeaveType[]>;
  getLeaveTypeById(id: string): Promise<LeaveType | undefined>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  updateLeaveType(id: string, leaveType: Partial<InsertLeaveType>): Promise<LeaveType>;
  seedDefaultLeaveTypes(): Promise<void>;

  // Leave Policy methods
  getLeavePolicies(filters?: { jobRoleId?: string; leaveTypeId?: string }): Promise<LeavePolicyWithDetails[]>;
  getLeavePolicyById(id: string): Promise<LeavePolicy | undefined>;
  createLeavePolicy(policy: InsertLeavePolicy): Promise<LeavePolicy>;
  updateLeavePolicy(id: string, policy: Partial<InsertLeavePolicy>): Promise<LeavePolicy>;
  deleteLeavePolicy(id: string): Promise<void>;
  seedDefaultLeavePolicies(): Promise<{ created: number; skipped: number }>;

  // Leave Request methods
  getLeaveRequests(filters?: { teamMemberId?: string; status?: string; fromDate?: string; toDate?: string }): Promise<LeaveRequestWithDetails[]>;
  getLeaveRequestById(id: string): Promise<LeaveRequestWithDetails | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: string, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest>;
  approveLeaveRequest(id: string, approvedBy: string): Promise<LeaveRequest>;
  rejectLeaveRequest(id: string, rejectionReason: string): Promise<LeaveRequest>;
  cancelLeaveRequest(id: string): Promise<LeaveRequest>;
  deleteLeaveRequest(id: string): Promise<void>;

  // Leave Balance methods
  getLeaveBalances(filters?: { teamMemberId?: string; year?: number }): Promise<LeaveBalanceWithDetails[]>;
  getLeaveBalanceById(id: string): Promise<LeaveBalance | undefined>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: string, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance>;
  initializeLeaveBalancesForMember(teamMemberId: string, joinedDate: Date): Promise<LeaveBalance[]>;
  reinitializeLeaveBalancesForMember(teamMemberId: string): Promise<LeaveBalance[]>;
  recalculateLeaveBalance(teamMemberId: string, leaveTypeId: string, year: number): Promise<LeaveBalance>;
  checkLeaveAvailability(teamMemberId: string, leaveTypeId: string, requestedDays: number, year?: number): Promise<{
    available: boolean;
    balance: number;
    pending: number;
    used: number;
    totalQuota: number;
    requestedDays: number;
    shortfall: number;
    leaveTypeName?: string;
    message: string;
  }>;

  // Slack Integration methods
  getSlackSettings(): Promise<SlackSettings | undefined>;
  saveSlackSettings(settings: InsertSlackSettings): Promise<SlackSettings>;
  updateSlackSettings(id: string, settings: Partial<InsertSlackSettings>): Promise<SlackSettings>;
  deleteSlackSettings(): Promise<void>;

  // Slack Attendance Log methods
  getSlackAttendanceLogs(filters?: { teamMemberId?: string; fromDate?: string; toDate?: string; eventType?: string }): Promise<SlackAttendanceLogWithDetails[]>;
  getSlackAttendanceLogByMessageTs(slackMessageTs: string): Promise<SlackAttendanceLog | undefined>;
  createSlackAttendanceLog(log: InsertSlackAttendanceLog): Promise<SlackAttendanceLog>;

  // Team member by Slack user ID
  getTeamMemberBySlackUserId(slackUserId: string): Promise<TeamMember | undefined>;

  // Fixed Asset methods
  getFixedAssets(filters?: { status?: string; category?: string; search?: string }): Promise<FixedAsset[]>;
  getFixedAssetById(id: string): Promise<FixedAsset | undefined>;
  createFixedAsset(asset: InsertFixedAsset): Promise<FixedAsset>;
  updateFixedAsset(id: string, asset: Partial<InsertFixedAsset>): Promise<FixedAsset>;
  deleteFixedAsset(id: string): Promise<void>;
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
    
    // First, fetch the client
    let client = await db.collection("clients").findOne({ id });
    if (!client) return undefined;
    
    // If client doesn't have an onboarding token, generate one using atomic operation
    // This prevents race conditions when multiple requests happen in parallel
    if (!client.onboardingToken) {
      const token = nanoid(32);
      // Use $setOnInsert-like behavior by only updating if token is still missing
      const result = await db.collection("clients").findOneAndUpdate(
        { 
          id, 
          $or: [
            { onboardingToken: { $exists: false } },
            { onboardingToken: null },
            { onboardingToken: "" }
          ]
        },
        { 
          $set: { 
            onboardingToken: token, 
            onboardingCompleted: client.onboardingCompleted ?? false, 
            updatedAt: new Date() 
          } 
        },
        { returnDocument: "after" }
      );
      
      if (result) {
        console.log(`Generated new onboarding token for client ${id}: ${token}`);
        client = result;
      } else {
        // Another request already set the token, fetch the updated client
        client = await db.collection("clients").findOne({ id });
        console.log(`Token already set for client ${id}: ${client?.onboardingToken}`);
      }
    }
    
    return client ? toSchema<Client>(client) : undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const db = await getDb();
    const newClient = {
      id: nanoid(),
      name: client.name,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      companyWebsite: client.companyWebsite || "",
      address: client.address || "",
      industry: client.industry || "",
      projectType: client.projectType || "MIXED",
      status: client.status || "ONBOARDING",
      notes: client.notes || "",
      portalUrl: client.portalUrl || "",
      onboardingToken: nanoid(32), // Generate unique token for public onboarding
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      contractStartDate: client.contractStartDate || null,
      contractEndDate: client.contractEndDate || null,
      nextReviewDate: client.nextReviewDate || null,
      retentionNotes: client.retentionNotes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("clients").insertOne(toMongo(newClient));
    return toSchema<Client>(newClient);
  }

  async getClientByOnboardingToken(token: string): Promise<Client | undefined> {
    const db = await getDb();
    console.log(`Searching for client with onboardingToken: ${token}`);
    const client = await db.collection("clients").findOne({ onboardingToken: token });
    if (client) {
      console.log(`Found client: ${client.name} (${client.id})`);
    } else {
      // Debug: list all clients and their tokens
      const allClients = await db.collection("clients").find({}).toArray();
      console.log(`No client found. All clients and their tokens:`);
      allClients.forEach(c => {
        console.log(`  - ${c.name} (${c.id}): token=${c.onboardingToken || 'NONE'}`);
      });
    }
    return client ? toSchema<Client>(client) : undefined;
  }

  async regenerateOnboardingToken(clientId: string): Promise<Client> {
    const db = await getDb();
    const result = await db.collection("clients").findOneAndUpdate(
      { id: clientId },
      { $set: { onboardingToken: nanoid(32), updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Client not found");
    return toSchema<Client>(result);
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

  async seedDefaultExpenseCategories(): Promise<{ count: number }> {
    const db = await getDb();
    const defaultCategories = [
      // Operations
      { name: "Office Rent / Co-working", code: "RENT", group: "Operations" },
      { name: "Utilities (Electricity, Internet, Water)", code: "UTIL", group: "Operations" },
      { name: "Software & Subscriptions", code: "SOFTWARE", group: "Operations" },
      { name: "Hosting / Domains", code: "HOSTING", group: "Operations" },
      { name: "Equipment & Maintenance", code: "EQUIP", group: "Operations" },
      { name: "Office Supplies", code: "SUPPLIES", group: "Operations" },
      
      // Marketing & Sales
      { name: "Advertising (Meta / Google / Others)", code: "ADS", group: "Marketing & Sales" },
      { name: "Lead Generation Tools", code: "LEADGEN", group: "Marketing & Sales" },
      { name: "CRM / Automation Tools", code: "CRM", group: "Marketing & Sales" },
      { name: "Branding & Creative Assets", code: "BRANDING", group: "Marketing & Sales" },
      { name: "Events / Webinars / Sponsorships", code: "EVENTS", group: "Marketing & Sales" },
      
      // Team & HR
      { name: "Salaries / Stipends", code: "SALARY", group: "Team & HR" },
      { name: "Freelancer / Contractor Payouts", code: "FREELANCE", group: "Team & HR" },
      { name: "Hiring & Onboarding", code: "HIRING", group: "Team & HR" },
      { name: "Training / Courses", code: "TRAINING", group: "Team & HR" },
      { name: "Employee Welfare", code: "WELFARE", group: "Team & HR" },
      
      // Client Project Costs
      { name: "Outsourced Work", code: "OUTSOURCE", group: "Client Project Costs" },
      { name: "Paid Assets (Stock images, Videos, Templates)", code: "ASSETS", group: "Client Project Costs" },
      { name: "Media Buying for Clients", code: "MEDIABUY", group: "Client Project Costs" },
      { name: "Project Tools / Integrations", code: "PROJTOOLS", group: "Client Project Costs" },
      
      // Finance & Legal
      { name: "CA / Accounting Fees", code: "ACCOUNT", group: "Finance & Legal" },
      { name: "Legal & Compliance", code: "LEGAL", group: "Finance & Legal" },
      { name: "Bank Charges / Payment Gateway Fees", code: "BANKFEES", group: "Finance & Legal" },
      { name: "Taxes & GST", code: "TAXES", group: "Finance & Legal" },
      
      // Travel & Communication
      { name: "Travel (Local & Outstation)", code: "TRAVEL", group: "Travel & Communication" },
      { name: "Fuel / Vehicle Maintenance", code: "FUEL", group: "Travel & Communication" },
      { name: "Food & Meetings", code: "FOOD", group: "Travel & Communication" },
      { name: "Phone Bills", code: "PHONE", group: "Travel & Communication" },
      
      // Miscellaneous
      { name: "Contingency", code: "CONTING", group: "Miscellaneous" },
      { name: "Refunds / Adjustments", code: "REFUNDS", group: "Miscellaneous" },
      { name: "Donations / CSR", code: "CSR", group: "Miscellaneous" },
    ];

    const existingCategories = await db.collection("expenseCategories").find({}).toArray();
    const existingCodes = new Set(existingCategories.map((c) => c.code?.toUpperCase()));

    const categoriesToInsert = defaultCategories
      .filter((cat) => !existingCodes.has(cat.code.toUpperCase()))
      .map((cat) => ({
        id: nanoid(),
        ...cat,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (categoriesToInsert.length > 0) {
      await db.collection("expenseCategories").insertMany(categoriesToInsert.map(toMongo));
      console.log(`Seeded ${categoriesToInsert.length} default expense categories`);
    } else {
      console.log("All default expense categories already exist");
    }

    const totalCount = await db.collection("expenseCategories").countDocuments();
    return { count: totalCount };
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
    
    // Ensure all team members have onboarding tokens
    const membersWithTokens = await Promise.all(
      members.map(async (m) => {
        if (!m.onboardingToken || m.onboardingToken.trim() === "") {
          console.log(`Team member ${m.name} (${m.id}) missing token, generating one...`);
          const token = nanoid(32);
          await db.collection("teamMembers").updateOne(
            { id: m.id },
            { $set: { onboardingToken: token, updatedAt: new Date() } }
          );
          m.onboardingToken = token;
        }
        return toSchema<TeamMember>(m);
      })
    );
    
    return membersWithTokens;
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
    if (!member) return undefined;
    
    // Ensure team member has an onboarding token
    if (!member.onboardingToken || member.onboardingToken.trim() === "") {
      console.log(`Team member ${member.name} (${member.id}) missing token, generating one...`);
      const token = nanoid(32);
      await db.collection("teamMembers").updateOne(
        { id },
        { $set: { onboardingToken: token, updatedAt: new Date() } }
      );
      member.onboardingToken = token;
    }
    
    return toSchema<TeamMember>(member);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const db = await getDb();
    // Always generate a token if not provided or if it's empty
    const token = member.onboardingToken && member.onboardingToken.trim() !== "" 
      ? member.onboardingToken 
      : nanoid(32);
    
    const newMember = {
      id: nanoid(),
      ...member,
      onboardingToken: token,
      onboardingCompleted: member.onboardingCompleted || false,
      onboardingCompletedAt: member.onboardingCompletedAt || null,
      joinedDate: new Date(member.joinedDate),
      exitDate: member.exitDate ? new Date(member.exitDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log(`Creating team member ${newMember.name} with token: ${token.substring(0, 20)}... (length: ${token.length})`);
    const mongoDoc = toMongo(newMember);
    console.log(`MongoDB document onboardingToken: ${mongoDoc.onboardingToken?.substring(0, 20)}... (length: ${mongoDoc.onboardingToken?.length || 0})`);
    await db.collection("teamMembers").insertOne(mongoDoc);
    
    // Verify the token was saved
    const verify = await db.collection("teamMembers").findOne({ id: newMember.id });
    if (verify?.onboardingToken !== token) {
      console.error(`❌ Token mismatch after insert! Expected: ${token.substring(0, 20)}..., Got: ${verify?.onboardingToken?.substring(0, 20)}...`);
    } else {
      console.log(`✅ Token verified after insert`);
    }
    
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

  async getTeamMemberByOnboardingToken(token: string): Promise<TeamMember | undefined> {
    const db = await getDb();
    
    if (!token || token.trim() === "") {
      console.log("❌ Empty or invalid token provided");
      return undefined;
    }
    
    // Try exact match first - simple query
    let member = await db.collection("teamMembers").findOne({ onboardingToken: token });
    
    // Also try with trimmed token in case of whitespace issues
    if (!member && token !== token.trim()) {
      member = await db.collection("teamMembers").findOne({ onboardingToken: token.trim() });
    }
    
    if (member) {
      console.log(`✅ Found team member: ${member.name} (${member.id})`);
      return toSchema<TeamMember>(member);
    }
    
    // Try case-insensitive match (in case of encoding issues)
    member = await db.collection("teamMembers").findOne({ 
      onboardingToken: { $regex: new RegExp(`^${token}$`, "i") }
    });
    
    if (member) {
      console.log(`✅ Found team member (case-insensitive): ${member.name} (${member.id})`);
      return toSchema<TeamMember>(member);
    }
    
    // Also check for null/empty tokens that might need migration
    const membersWithoutToken = await db.collection("teamMembers").find({
      $or: [
        { onboardingToken: { $exists: false } },
        { onboardingToken: null },
        { onboardingToken: "" }
      ]
    }).toArray();
    
    if (membersWithoutToken.length > 0) {
      console.log(`⚠️ Found ${membersWithoutToken.length} team members without tokens (may need migration)`);
    }
    
    // Debug: list all team members and their tokens
    const allMembers = await db.collection("teamMembers").find({}).toArray();
    console.log(`❌ No team member found with token "${token.substring(0, 20)}...". All team members and their tokens:`);
    allMembers.forEach(m => {
      const tokenValue = m.onboardingToken || 'NONE';
      const tokenLength = tokenValue !== 'NONE' ? tokenValue.length : 0;
      const tokenPreview = tokenValue !== 'NONE' ? tokenValue.substring(0, 20) + '...' : 'NONE';
      console.log(`  - ${m.name} (${m.id}): token=${tokenPreview} (length: ${tokenLength})`);
    });
    
    return undefined;
  }

  async regenerateTeamMemberOnboardingToken(teamMemberId: string): Promise<TeamMember> {
    const db = await getDb();
    const newToken = nanoid(32);
    console.log(`🔄 Regenerating token for team member ${teamMemberId}`);
    console.log(`   New token: ${newToken.substring(0, 20)}... (length: ${newToken.length})`);
    
    const result = await db.collection("teamMembers").findOneAndUpdate(
      { id: teamMemberId },
      { $set: { onboardingToken: newToken, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) {
      console.log(`❌ Team member ${teamMemberId} not found for token regeneration`);
      throw new Error("Team member not found");
    }
    
    console.log(`✅ Token regenerated for ${result.name}, new token saved: ${result.onboardingToken?.substring(0, 20)}...`);
    
    // Verify the token was actually saved
    const verify = await db.collection("teamMembers").findOne({ id: teamMemberId });
    if (verify?.onboardingToken !== newToken) {
      console.error(`❌ Token mismatch! Expected: ${newToken.substring(0, 20)}..., Got: ${verify?.onboardingToken?.substring(0, 20)}...`);
    } else {
      console.log(`✅ Token verified in database`);
    }
    
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

  // ============================================
  // MARKETING MODULE - PROPOSAL METHODS
  // ============================================
  
  private proposalCounter: number = 1;

  async getProposals(filters?: { clientId?: string; status?: string }): Promise<ProposalWithRelations[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    const proposalList = await db.collection("proposals")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    const proposalsWithRelations: ProposalWithRelations[] = await Promise.all(
      proposalList.map(async (proposal: any) => {
        const prop = toSchema<Proposal>(proposal);
        const client = await db.collection("clients").findOne({ id: prop.clientId });
        const clientData = client ? toSchema<Client>(client) : null;
        
        return {
          ...prop,
          clientName: clientData?.name || "",
        };
      })
    );
    
    return proposalsWithRelations;
  }

  async getProposalById(id: string): Promise<ProposalWithRelations | undefined> {
    const db = await getDb();
    const proposal = await db.collection("proposals").findOne({ id });
    if (!proposal) return undefined;
    
    const prop = toSchema<Proposal>(proposal);
    const client = await db.collection("clients").findOne({ id: prop.clientId });
    const clientData = client ? toSchema<Client>(client) : null;
    
    return {
      ...prop,
      clientName: clientData?.name || "",
    };
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const db = await getDb();
    const proposalNumber = proposal.proposalNumber || `PROP-${String(this.proposalCounter++).padStart(4, "0")}`;
    
    const newProposal = {
      id: nanoid(),
      ...proposal,
      proposalNumber,
      validUntil: new Date(proposal.validUntil),
      projectStartDate: proposal.projectStartDate ? new Date(proposal.projectStartDate) : null,
      projectEndDate: proposal.projectEndDate ? new Date(proposal.projectEndDate) : null,
      paymentSchedule: (proposal.paymentSchedule || []).map((ps: any) => ({
        ...ps,
        dueDate: ps.dueDate ? new Date(ps.dueDate) : null,
      })),
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection("proposals").insertOne(toMongo(newProposal));
    return toSchema<Proposal>(newProposal);
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal> {
    const db = await getDb();
    const updateData: any = { ...proposal, updatedAt: new Date() };
    
    if (proposal.validUntil) updateData.validUntil = new Date(proposal.validUntil);
    if (proposal.projectStartDate !== undefined) {
      updateData.projectStartDate = proposal.projectStartDate ? new Date(proposal.projectStartDate) : null;
    }
    if (proposal.projectEndDate !== undefined) {
      updateData.projectEndDate = proposal.projectEndDate ? new Date(proposal.projectEndDate) : null;
    }
    if (proposal.paymentSchedule) {
      updateData.paymentSchedule = proposal.paymentSchedule.map((ps: any) => ({
        ...ps,
        dueDate: ps.dueDate ? new Date(ps.dueDate) : null,
      }));
    }
    
    const result = await db.collection("proposals").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Proposal not found");
    return toSchema<Proposal>(result);
  }

  async updateProposalStatus(id: string, status: string): Promise<Proposal> {
    const db = await getDb();
    const updateData: any = { status, updatedAt: new Date() };
    
    // Track status changes
    if (status === "SENT") updateData.sentAt = new Date();
    if (status === "VIEWED") updateData.viewedAt = new Date();
    if (["ACCEPTED", "REJECTED"].includes(status)) updateData.respondedAt = new Date();
    
    const result = await db.collection("proposals").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Proposal not found");
    return toSchema<Proposal>(result);
  }

  async deleteProposal(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const result = await db.collection("proposals").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Proposal not found");
  }

  // ============================================
  // MARKETING MODULE - CONTRACT METHODS
  // ============================================
  
  private contractCounter: number = 1;

  async getContracts(filters?: { clientId?: string; status?: string }): Promise<ContractWithRelations[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    const contractList = await db.collection("contracts")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    const contractsWithRelations: ContractWithRelations[] = await Promise.all(
      contractList.map(async (contract: any) => {
        const cont = toSchema<Contract>(contract);
        const client = await db.collection("clients").findOne({ id: cont.clientId });
        const clientData = client ? toSchema<Client>(client) : null;
        
        let proposalTitle: string | undefined;
        if (cont.proposalId) {
          const proposal = await db.collection("proposals").findOne({ id: cont.proposalId });
          proposalTitle = proposal ? proposal.title : undefined;
        }
        
        return {
          ...cont,
          clientName: clientData?.name || "",
          proposalTitle,
        };
      })
    );
    
    return contractsWithRelations;
  }

  async getContractById(id: string): Promise<ContractWithRelations | undefined> {
    const db = await getDb();
    const contract = await db.collection("contracts").findOne({ id });
    if (!contract) return undefined;
    
    const cont = toSchema<Contract>(contract);
    const client = await db.collection("clients").findOne({ id: cont.clientId });
    const clientData = client ? toSchema<Client>(client) : null;
    
    let proposalTitle: string | undefined;
    if (cont.proposalId) {
      const proposal = await db.collection("proposals").findOne({ id: cont.proposalId });
      proposalTitle = proposal ? proposal.title : undefined;
    }
    
    return {
      ...cont,
      clientName: clientData?.name || "",
      proposalTitle,
    };
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const db = await getDb();
    const contractNumber = contract.contractNumber || `CONTRACT-${String(this.contractCounter++).padStart(4, "0")}`;
    
    const newContract = {
      id: nanoid(),
      ...contract,
      contractNumber,
      startDate: new Date(contract.startDate),
      endDate: contract.endDate ? new Date(contract.endDate) : null,
      signedDate: contract.signedDate ? new Date(contract.signedDate) : null,
      clientSignatureDate: contract.clientSignatureDate ? new Date(contract.clientSignatureDate) : null,
      agencySignatureDate: contract.agencySignatureDate ? new Date(contract.agencySignatureDate) : null,
      attachments: (contract.attachments || []).map((att: any) => ({
        ...att,
        uploadedAt: new Date(att.uploadedAt),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection("contracts").insertOne(toMongo(newContract));
    return toSchema<Contract>(newContract);
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract> {
    const db = await getDb();
    const updateData: any = { ...contract, updatedAt: new Date() };
    
    if (contract.startDate) updateData.startDate = new Date(contract.startDate);
    if (contract.endDate !== undefined) {
      updateData.endDate = contract.endDate ? new Date(contract.endDate) : null;
    }
    if (contract.signedDate !== undefined) {
      updateData.signedDate = contract.signedDate ? new Date(contract.signedDate) : null;
    }
    if (contract.clientSignatureDate !== undefined) {
      updateData.clientSignatureDate = contract.clientSignatureDate ? new Date(contract.clientSignatureDate) : null;
    }
    if (contract.agencySignatureDate !== undefined) {
      updateData.agencySignatureDate = contract.agencySignatureDate ? new Date(contract.agencySignatureDate) : null;
    }
    if (contract.attachments) {
      updateData.attachments = contract.attachments.map((att: any) => ({
        ...att,
        uploadedAt: new Date(att.uploadedAt),
      }));
    }
    
    const result = await db.collection("contracts").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Contract not found");
    return toSchema<Contract>(result);
  }

  async updateContractStatus(id: string, status: string): Promise<Contract> {
    const db = await getDb();
    const updateData: any = { status, updatedAt: new Date() };
    
    // Auto-set signed date when status becomes SIGNED
    if (status === "SIGNED") {
      updateData.signedDate = new Date();
    }
    
    const result = await db.collection("contracts").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Contract not found");
    return toSchema<Contract>(result);
  }

  async deleteContract(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const result = await db.collection("contracts").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Contract not found");
  }

  // ============================================
  // MARKETING MODULE - CLIENT ONBOARDING DATA METHODS
  // ============================================

  async getClientOnboardingData(clientId: string): Promise<ClientOnboardingData | undefined> {
    const db = await getDb();
    const data = await db.collection("clientOnboardingData").findOne({ clientId });
    return data ? toSchema<ClientOnboardingData>(data) : undefined;
  }

  async createClientOnboardingData(data: InsertClientOnboardingData): Promise<ClientOnboardingData> {
    const db = await getDb();
    
    // Initialize with default structure
    const defaultBusinessDetails = {
      status: "NOT_STARTED" as const,
      legalName: "",
      tradeName: "",
      businessType: "",
      registrationNumber: "",
      gstNumber: "",
      panNumber: "",
      incorporationDate: "",
      industry: "",
      employeeCount: "",
      annualRevenue: "",
      targetAudience: "",
      competitors: "",
      uniqueSellingPoint: "",
      businessGoals: "",
      notes: "",
    };
    
    const defaultBrandAssets = {
      status: "NOT_STARTED" as const,
      logoUrl: "",
      logoVariants: [],
      primaryColors: [],
      secondaryColors: [],
      fonts: [],
      brandGuidelines: "",
      brandGuidelinesUrl: "",
      tagline: "",
      brandVoice: "",
      brandPersonality: "",
      doNotUse: "",
      notes: "",
    };
    
    const defaultWebsiteCredentials = {
      status: "NOT_STARTED" as const,
      items: [],
    };
    
    const defaultSocialCredentials = {
      status: "NOT_STARTED" as const,
      items: [],
    };
    
    const defaultCrmCredentials = {
      status: "NOT_STARTED" as const,
      items: [],
    };
    
    const defaultMarketingReports = {
      status: "NOT_STARTED" as const,
      currentMarketingEfforts: "",
      pastCampaigns: "",
      whatWorked: "",
      whatDidntWork: "",
      items: [],
    };
    
    const defaultProjectDetails = {
      status: "NOT_STARTED" as const,
      preferredCommunication: "",
      meetingAvailability: "",
      decisionMakers: "",
      budget: "",
      timeline: "",
      priorities: "",
      expectations: "",
      kickoffNotes: "",
    };
    
    const newData = {
      id: nanoid(),
      clientId: data.clientId,
      overallStatus: data.overallStatus || "NOT_STARTED",
      submittedAt: data.submittedAt || null,
      submittedBy: data.submittedBy || "",
      businessDetails: { ...defaultBusinessDetails, ...(data.businessDetails || {}) },
      brandAssets: { ...defaultBrandAssets, ...(data.brandAssets || {}) },
      websiteCredentials: { ...defaultWebsiteCredentials, ...(data.websiteCredentials || {}) },
      socialCredentials: { ...defaultSocialCredentials, ...(data.socialCredentials || {}) },
      crmCredentials: { ...defaultCrmCredentials, ...(data.crmCredentials || {}) },
      marketingReports: { ...defaultMarketingReports, ...(data.marketingReports || {}) },
      projectDetails: { ...defaultProjectDetails, ...(data.projectDetails || {}) },
      additionalNotes: data.additionalNotes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection("clientOnboardingData").insertOne(toMongo(newData));
    return toSchema<ClientOnboardingData>(newData);
  }

  async updateClientOnboardingData(id: string, data: Partial<InsertClientOnboardingData>): Promise<ClientOnboardingData> {
    const db = await getDb();
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Calculate overall status based on section statuses
    if (data.businessDetails || data.brandAssets || data.websiteCredentials || 
        data.socialCredentials || data.marketingReports) {
      const current = await db.collection("clientOnboardingData").findOne({ id });
      if (current) {
        const sections = [
          data.businessDetails?.status || current.businessDetails?.status,
          data.brandAssets?.status || current.brandAssets?.status,
          data.websiteCredentials?.status || current.websiteCredentials?.status,
          data.socialCredentials?.status || current.socialCredentials?.status,
          data.marketingReports?.status || current.marketingReports?.status,
        ];
        
        if (sections.every(s => s === "COMPLETED")) {
          updateData.overallStatus = "COMPLETED";
        } else if (sections.some(s => s === "IN_PROGRESS" || s === "COMPLETED")) {
          updateData.overallStatus = "IN_PROGRESS";
        }
      }
    }
    
    const result = await db.collection("clientOnboardingData").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Client onboarding data not found");
    return toSchema<ClientOnboardingData>(result);
  }

  // ============================================
  // MARKETING MODULE - MONTHLY REPORT METHODS
  // ============================================
  
  private reportCounter: number = 1;

  async getMonthlyReports(filters?: { clientId?: string; projectId?: string; status?: string }): Promise<MonthlyReportWithRelations[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    
    if (filters?.projectId) {
      query.projectId = filters.projectId;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    const reportList = await db.collection("monthlyReports")
      .find(query)
      .sort({ reportMonth: -1, createdAt: -1 })
      .toArray();
    
    const reportsWithRelations: MonthlyReportWithRelations[] = await Promise.all(
      reportList.map(async (report: any) => {
        const rep = toSchema<MonthlyReport>(report);
        const client = await db.collection("clients").findOne({ id: rep.clientId });
        const clientData = client ? toSchema<Client>(client) : null;
        
        let projectName: string | undefined;
        if (rep.projectId) {
          const project = await db.collection("projects").findOne({ id: rep.projectId });
          projectName = project ? project.name : undefined;
        }
        
        return {
          ...rep,
          clientName: clientData?.name || "",
          projectName,
        };
      })
    );
    
    return reportsWithRelations;
  }

  async getMonthlyReportById(id: string): Promise<MonthlyReportWithRelations | undefined> {
    const db = await getDb();
    const report = await db.collection("monthlyReports").findOne({ id });
    if (!report) return undefined;
    
    const rep = toSchema<MonthlyReport>(report);
    const client = await db.collection("clients").findOne({ id: rep.clientId });
    const clientData = client ? toSchema<Client>(client) : null;
    
    let projectName: string | undefined;
    if (rep.projectId) {
      const project = await db.collection("projects").findOne({ id: rep.projectId });
      projectName = project ? project.name : undefined;
    }
    
    return {
      ...rep,
      clientName: clientData?.name || "",
      projectName,
    };
  }

  async createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport> {
    const db = await getDb();
    const reportNumber = report.reportNumber || `RPT-${String(this.reportCounter++).padStart(4, "0")}`;
    
    const newReport = {
      id: nanoid(),
      ...report,
      reportNumber,
      periodStart: new Date(report.periodStart),
      periodEnd: new Date(report.periodEnd),
      attachments: (report.attachments || []).map((att: any) => ({
        ...att,
        uploadedAt: new Date(att.uploadedAt),
      })),
      sentAt: report.sentAt ? new Date(report.sentAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection("monthlyReports").insertOne(toMongo(newReport));
    return toSchema<MonthlyReport>(newReport);
  }

  async updateMonthlyReport(id: string, report: Partial<InsertMonthlyReport>): Promise<MonthlyReport> {
    const db = await getDb();
    const updateData: any = { ...report, updatedAt: new Date() };
    
    if (report.periodStart) updateData.periodStart = new Date(report.periodStart);
    if (report.periodEnd) updateData.periodEnd = new Date(report.periodEnd);
    if (report.sentAt !== undefined) {
      updateData.sentAt = report.sentAt ? new Date(report.sentAt) : null;
    }
    if (report.attachments) {
      updateData.attachments = report.attachments.map((att: any) => ({
        ...att,
        uploadedAt: new Date(att.uploadedAt),
      }));
    }
    
    const result = await db.collection("monthlyReports").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Monthly report not found");
    return toSchema<MonthlyReport>(result);
  }

  async updateMonthlyReportStatus(id: string, status: string): Promise<MonthlyReport> {
    const db = await getDb();
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === "SENT") {
      updateData.sentAt = new Date();
    }
    
    const result = await db.collection("monthlyReports").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Monthly report not found");
    return toSchema<MonthlyReport>(result);
  }

  async deleteMonthlyReport(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const result = await db.collection("monthlyReports").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Monthly report not found");
  }

  // ============================================
  // MARKETING MODULE - CLIENT DIGITAL ASSET METHODS
  // ============================================

  async getClientDigitalAssets(filters?: { clientId?: string; category?: string }): Promise<ClientDigitalAsset[]> {
    const db = await getDb();
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    
    if (filters?.category) {
      query.category = filters.category;
    }
    
    const assets = await db.collection("clientDigitalAssets")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return assets.map(toSchema<ClientDigitalAsset>);
  }

  async getClientDigitalAssetById(id: string): Promise<ClientDigitalAsset | undefined> {
    const db = await getDb();
    const asset = await db.collection("clientDigitalAssets").findOne({ id });
    return asset ? toSchema<ClientDigitalAsset>(asset) : undefined;
  }

  async createClientDigitalAsset(asset: InsertClientDigitalAsset): Promise<ClientDigitalAsset> {
    const db = await getDb();
    
    const newAsset = {
      id: nanoid(),
      ...asset,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection("clientDigitalAssets").insertOne(toMongo(newAsset));
    return toSchema<ClientDigitalAsset>(newAsset);
  }

  async updateClientDigitalAsset(id: string, asset: Partial<InsertClientDigitalAsset>): Promise<ClientDigitalAsset> {
    const db = await getDb();
    
    const result = await db.collection("clientDigitalAssets").findOneAndUpdate(
      { id },
      { $set: { ...asset, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) throw new Error("Digital asset not found");
    return toSchema<ClientDigitalAsset>(result);
  }

  async deleteClientDigitalAsset(id: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const result = await db.collection("clientDigitalAssets").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Digital asset not found");
  }

  // ============================================
  // API SETTINGS METHODS
  // ============================================
  async getApiSettings(): Promise<ApiSettings | undefined> {
    const db = await getDb();
    const settings = await db.collection("apiSettings").findOne({});
    return settings ? toSchema<ApiSettings>(settings) : undefined;
  }

  async upsertApiSettings(settings: Partial<InsertApiSettings>): Promise<ApiSettings> {
    const db = await getDb();

    // Check if settings already exist
    const existing = await db.collection("apiSettings").findOne({});

    if (existing) {
      // Update existing settings
      const result = await db.collection("apiSettings").findOneAndUpdate(
        { id: existing.id },
        { $set: { ...settings, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      if (!result) throw new Error("Failed to update API settings");
      return toSchema<ApiSettings>(result);
    } else {
      // Create new settings
      const newSettings = {
        id: nanoid(),
        openaiApiKey: settings.openaiApiKey || "",
        geminiApiKey: settings.geminiApiKey || "",
        resendApiKey: settings.resendApiKey || "",
        senderEmail: settings.senderEmail || "",
        senderName: settings.senderName || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection("apiSettings").insertOne(toMongo(newSettings));
      return toSchema<ApiSettings>(newSettings);
    }
  }

  // ============================================
  // ATTENDANCE METHODS
  // ============================================
  async getAttendance(filters?: { teamMemberId?: string; fromDate?: string; toDate?: string; status?: string }): Promise<AttendanceWithMember[]> {
    const db = await getDb();
    const query: any = {};

    if (filters?.teamMemberId) query.teamMemberId = filters.teamMemberId;
    if (filters?.status) query.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      query.date = {};
      if (filters.fromDate) query.date.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.date.$lte = new Date(filters.toDate);
    }

    const records = await db.collection("attendance").find(query).sort({ date: -1 }).toArray();

    // Get team member details
    const memberIds = Array.from(new Set(records.map(r => r.teamMemberId)));
    const members = await db.collection("teamMembers").find({ id: { $in: memberIds } }).toArray();
    const memberMap = new Map(members.map(m => [m.id, m]));

    return records.map(record => {
      const member = memberMap.get(record.teamMemberId);
      return {
        ...toSchema<Attendance>(record),
        memberName: member?.name,
        memberEmail: member?.email,
      };
    });
  }

  async getAttendanceById(id: string): Promise<Attendance | undefined> {
    const db = await getDb();
    const record = await db.collection("attendance").findOne({ id });
    return record ? toSchema<Attendance>(record) : undefined;
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const db = await getDb();
    const newRecord = {
      id: nanoid(),
      ...attendance,
      date: new Date(attendance.date),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("attendance").insertOne(toMongo(newRecord));
    return toSchema<Attendance>(newRecord);
  }

  async createBulkAttendance(records: InsertAttendance[]): Promise<Attendance[]> {
    const db = await getDb();
    const newRecords = records.map(record => ({
      id: nanoid(),
      ...record,
      date: new Date(record.date),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await db.collection("attendance").insertMany(newRecords.map(toMongo));
    return newRecords.map(r => toSchema<Attendance>(r));
  }

  async updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance> {
    const db = await getDb();
    const updateData: any = { ...attendance, updatedAt: new Date() };
    if (attendance.date) updateData.date = new Date(attendance.date);

    const result = await db.collection("attendance").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Attendance record not found");
    return toSchema<Attendance>(result);
  }

  async deleteAttendance(id: string): Promise<void> {
    const db = await getDb();
    const result = await db.collection("attendance").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Attendance record not found");
  }

  // ============================================
  // LEAVE TYPE METHODS
  // ============================================
  async getLeaveTypes(filters?: { isActive?: boolean }): Promise<LeaveType[]> {
    const db = await getDb();
    const query: any = {};
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    const types = await db.collection("leaveTypes").find(query).sort({ name: 1 }).toArray();
    return types.map(t => toSchema<LeaveType>(t));
  }

  async getLeaveTypeById(id: string): Promise<LeaveType | undefined> {
    const db = await getDb();
    const type = await db.collection("leaveTypes").findOne({ id });
    return type ? toSchema<LeaveType>(type) : undefined;
  }

  async createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType> {
    const db = await getDb();
    const newType = {
      id: nanoid(),
      ...leaveType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("leaveTypes").insertOne(toMongo(newType));
    return toSchema<LeaveType>(newType);
  }

  async updateLeaveType(id: string, leaveType: Partial<InsertLeaveType>): Promise<LeaveType> {
    const db = await getDb();
    const result = await db.collection("leaveTypes").findOneAndUpdate(
      { id },
      { $set: { ...leaveType, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Leave type not found");
    return toSchema<LeaveType>(result);
  }

  async seedDefaultLeaveTypes(): Promise<void> {
    const db = await getDb();
    const existingCount = await db.collection("leaveTypes").countDocuments();
    if (existingCount > 0) return;

    const defaultTypes = [
      { name: "Casual Leave", code: "CL", category: "CASUAL", description: "For personal or casual reasons", isPaid: true, isActive: true },
      { name: "Sick Leave", code: "SL", category: "SICK", description: "For health-related absences", isPaid: true, isActive: true },
      { name: "Earned Leave", code: "EL", category: "EARNED", description: "Accrued leave based on service", isPaid: true, isActive: true },
    ];

    for (const type of defaultTypes) {
      await this.createLeaveType(type as InsertLeaveType);
    }
  }

  // ============================================
  // LEAVE POLICY METHODS
  // ============================================
  async getLeavePolicies(filters?: { jobRoleId?: string; leaveTypeId?: string }): Promise<LeavePolicyWithDetails[]> {
    const db = await getDb();
    const query: any = {};
    if (filters?.jobRoleId) query.jobRoleId = filters.jobRoleId;
    if (filters?.leaveTypeId) query.leaveTypeId = filters.leaveTypeId;

    const policies = await db.collection("leavePolicies").find(query).toArray();

    // Get job roles and leave types
    const jobRoleIds = Array.from(new Set(policies.map(p => p.jobRoleId)));
    const leaveTypeIds = Array.from(new Set(policies.map(p => p.leaveTypeId)));

    const jobRoles = await db.collection("jobRoles").find({ id: { $in: jobRoleIds } }).toArray();
    const leaveTypes = await db.collection("leaveTypes").find({ id: { $in: leaveTypeIds } }).toArray();

    const roleMap = new Map(jobRoles.map(r => [r.id, r]));
    const typeMap = new Map(leaveTypes.map(t => [t.id, t]));

    return policies.map(policy => {
      const role = roleMap.get(policy.jobRoleId);
      const type = typeMap.get(policy.leaveTypeId);
      return {
        ...toSchema<LeavePolicy>(policy),
        jobRoleTitle: role?.title,
        leaveTypeName: type?.name,
        leaveTypeCode: type?.code,
      };
    });
  }

  async getLeavePolicyById(id: string): Promise<LeavePolicy | undefined> {
    const db = await getDb();
    const policy = await db.collection("leavePolicies").findOne({ id });
    return policy ? toSchema<LeavePolicy>(policy) : undefined;
  }

  async createLeavePolicy(policy: InsertLeavePolicy): Promise<LeavePolicy> {
    const db = await getDb();
    const newPolicy = {
      id: nanoid(),
      ...policy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("leavePolicies").insertOne(toMongo(newPolicy));
    return toSchema<LeavePolicy>(newPolicy);
  }

  async updateLeavePolicy(id: string, policy: Partial<InsertLeavePolicy>): Promise<LeavePolicy> {
    const db = await getDb();
    const result = await db.collection("leavePolicies").findOneAndUpdate(
      { id },
      { $set: { ...policy, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Leave policy not found");
    return toSchema<LeavePolicy>(result);
  }

  async deleteLeavePolicy(id: string): Promise<void> {
    const db = await getDb();
    const result = await db.collection("leavePolicies").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Leave policy not found");
  }

  async seedDefaultLeavePolicies(): Promise<{ created: number; skipped: number }> {
    const db = await getDb();

    // Get all active job roles (job roles use status: "ACTIVE")
    const jobRoles = await db.collection("jobRoles").find({ status: "ACTIVE" }).toArray();

    // Get all active leave types (leave types use isActive: true)
    const leaveTypes = await db.collection("leaveTypes").find({ isActive: true }).toArray();

    console.log(`Found ${jobRoles.length} job roles and ${leaveTypes.length} leave types for policy generation`);

    if (jobRoles.length === 0 || leaveTypes.length === 0) {
      return { created: 0, skipped: 0 };
    }

    // Default quotas per leave type category
    const defaultQuotas: Record<string, { annual: number; carryForward: number }> = {
      "CASUAL": { annual: 12, carryForward: 3 },
      "SICK": { annual: 10, carryForward: 0 },
      "EARNED": { annual: 15, carryForward: 5 },
      "MATERNITY": { annual: 180, carryForward: 0 },
      "PATERNITY": { annual: 15, carryForward: 0 },
      "UNPAID": { annual: 30, carryForward: 0 },
      "COMPENSATORY": { annual: 10, carryForward: 5 },
      "OTHER": { annual: 5, carryForward: 0 },
    };

    let created = 0;
    let skipped = 0;

    // Create policies for each combination of job role and leave type
    for (const role of jobRoles) {
      for (const leaveType of leaveTypes) {
        // Check if policy already exists
        const existing = await db.collection("leavePolicies").findOne({
          jobRoleId: role.id,
          leaveTypeId: leaveType.id,
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Get default quota based on category
        const quota = defaultQuotas[leaveType.category] || defaultQuotas["OTHER"];

        const newPolicy = {
          id: nanoid(),
          jobRoleId: role.id,
          leaveTypeId: leaveType.id,
          annualQuota: quota.annual,
          carryForwardLimit: quota.carryForward,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection("leavePolicies").insertOne(toMongo(newPolicy));
        created++;
      }
    }

    return { created, skipped };
  }

  // ============================================
  // LEAVE REQUEST METHODS
  // ============================================
  async getLeaveRequests(filters?: { teamMemberId?: string; status?: string; fromDate?: string; toDate?: string }): Promise<LeaveRequestWithDetails[]> {
    const db = await getDb();
    const query: any = {};

    if (filters?.teamMemberId) query.teamMemberId = filters.teamMemberId;
    if (filters?.status) query.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      query.startDate = {};
      if (filters.fromDate) query.startDate.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.startDate.$lte = new Date(filters.toDate);
    }

    const requests = await db.collection("leaveRequests").find(query).sort({ createdAt: -1 }).toArray();

    // Get related data
    const memberIds = Array.from(new Set(requests.map(r => r.teamMemberId)));
    const leaveTypeIds = Array.from(new Set(requests.map(r => r.leaveTypeId)));
    const approverIds = requests.filter(r => r.approvedBy).map(r => r.approvedBy);

    const members = await db.collection("teamMembers").find({ id: { $in: memberIds } }).toArray();
    const leaveTypes = await db.collection("leaveTypes").find({ id: { $in: leaveTypeIds } }).toArray();
    const approvers = approverIds.length > 0 ? await db.collection("users").find({ id: { $in: approverIds } }).toArray() : [];

    const memberMap = new Map(members.map(m => [m.id, m]));
    const typeMap = new Map(leaveTypes.map(t => [t.id, t]));
    const approverMap = new Map(approvers.map(a => [a.id, a]));

    return requests.map(request => {
      const member = memberMap.get(request.teamMemberId);
      const type = typeMap.get(request.leaveTypeId);
      const approver = request.approvedBy ? approverMap.get(request.approvedBy) : null;
      return {
        ...toSchema<LeaveRequest>(request),
        memberName: member?.name,
        memberEmail: member?.email,
        leaveTypeName: type?.name,
        leaveTypeCode: type?.code,
        approverName: approver?.name,
      };
    });
  }

  async getLeaveRequestById(id: string): Promise<LeaveRequestWithDetails | undefined> {
    const db = await getDb();
    const request = await db.collection("leaveRequests").findOne({ id });
    if (!request) return undefined;

    const member = await db.collection("teamMembers").findOne({ id: request.teamMemberId });
    const type = await db.collection("leaveTypes").findOne({ id: request.leaveTypeId });
    const approver = request.approvedBy ? await db.collection("users").findOne({ id: request.approvedBy }) : null;

    return {
      ...toSchema<LeaveRequest>(request),
      memberName: member?.name,
      memberEmail: member?.email,
      leaveTypeName: type?.name,
      leaveTypeCode: type?.code,
      approverName: approver?.name,
    };
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const db = await getDb();
    const newRequest = {
      id: nanoid(),
      ...request,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("leaveRequests").insertOne(toMongo(newRequest));

    // Update leave balance pending count
    const year = new Date(request.startDate).getFullYear();
    await this.recalculateLeaveBalance(request.teamMemberId, request.leaveTypeId, year);

    return toSchema<LeaveRequest>(newRequest);
  }

  async updateLeaveRequest(id: string, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest> {
    const db = await getDb();
    const updateData: any = { ...request, updatedAt: new Date() };
    if (request.startDate) updateData.startDate = new Date(request.startDate);
    if (request.endDate) updateData.endDate = new Date(request.endDate);
    if (request.approvedAt) updateData.approvedAt = new Date(request.approvedAt);

    const result = await db.collection("leaveRequests").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Leave request not found");
    return toSchema<LeaveRequest>(result);
  }

  async approveLeaveRequest(id: string, approvedBy: string): Promise<LeaveRequest> {
    const db = await getDb();
    const request = await db.collection("leaveRequests").findOne({ id });
    if (!request) throw new Error("Leave request not found");

    const result = await db.collection("leaveRequests").findOneAndUpdate(
      { id },
      {
        $set: {
          status: "APPROVED",
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    // Update leave balance
    const year = new Date(request.startDate).getFullYear();
    await this.recalculateLeaveBalance(request.teamMemberId, request.leaveTypeId, year);

    return toSchema<LeaveRequest>(result!);
  }

  async rejectLeaveRequest(id: string, rejectionReason: string): Promise<LeaveRequest> {
    const db = await getDb();
    const request = await db.collection("leaveRequests").findOne({ id });
    if (!request) throw new Error("Leave request not found");

    const result = await db.collection("leaveRequests").findOneAndUpdate(
      { id },
      {
        $set: {
          status: "REJECTED",
          rejectionReason,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    // Update leave balance
    const year = new Date(request.startDate).getFullYear();
    await this.recalculateLeaveBalance(request.teamMemberId, request.leaveTypeId, year);

    return toSchema<LeaveRequest>(result!);
  }

  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    const db = await getDb();
    const request = await db.collection("leaveRequests").findOne({ id });
    if (!request) throw new Error("Leave request not found");

    const result = await db.collection("leaveRequests").findOneAndUpdate(
      { id },
      { $set: { status: "CANCELLED", updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    // Update leave balance
    const year = new Date(request.startDate).getFullYear();
    await this.recalculateLeaveBalance(request.teamMemberId, request.leaveTypeId, year);

    return toSchema<LeaveRequest>(result!);
  }

  async deleteLeaveRequest(id: string): Promise<void> {
    const db = await getDb();
    const request = await db.collection("leaveRequests").findOne({ id });
    if (!request) throw new Error("Leave request not found");

    // Delete the request
    const result = await db.collection("leaveRequests").deleteOne({ id });
    if (result.deletedCount === 0) throw new Error("Failed to delete leave request");

    // Recalculate leave balance after deletion
    const year = new Date(request.startDate).getFullYear();
    await this.recalculateLeaveBalance(request.teamMemberId, request.leaveTypeId, year);
  }

  // ============================================
  // LEAVE BALANCE METHODS
  // ============================================
  async getLeaveBalances(filters?: { teamMemberId?: string; year?: number }): Promise<LeaveBalanceWithDetails[]> {
    const db = await getDb();
    const query: any = {};
    if (filters?.teamMemberId) query.teamMemberId = filters.teamMemberId;
    if (filters?.year) query.year = filters.year;

    const balances = await db.collection("leaveBalances").find(query).toArray();

    // Get related data
    const memberIds = Array.from(new Set(balances.map(b => b.teamMemberId)));
    const leaveTypeIds = Array.from(new Set(balances.map(b => b.leaveTypeId)));

    const members = await db.collection("teamMembers").find({ id: { $in: memberIds } }).toArray();
    const leaveTypes = await db.collection("leaveTypes").find({ id: { $in: leaveTypeIds } }).toArray();

    const memberMap = new Map(members.map(m => [m.id, m]));
    const typeMap = new Map(leaveTypes.map(t => [t.id, t]));

    return balances.map(balance => {
      const member = memberMap.get(balance.teamMemberId);
      const type = typeMap.get(balance.leaveTypeId);
      return {
        ...toSchema<LeaveBalance>(balance),
        memberName: member?.name,
        leaveTypeName: type?.name,
        leaveTypeCode: type?.code,
      };
    });
  }

  async getLeaveBalanceById(id: string): Promise<LeaveBalance | undefined> {
    const db = await getDb();
    const balance = await db.collection("leaveBalances").findOne({ id });
    return balance ? toSchema<LeaveBalance>(balance) : undefined;
  }

  async createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance> {
    const db = await getDb();
    const newBalance = {
      id: nanoid(),
      ...balance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("leaveBalances").insertOne(toMongo(newBalance));
    return toSchema<LeaveBalance>(newBalance);
  }

  async updateLeaveBalance(id: string, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance> {
    const db = await getDb();
    const result = await db.collection("leaveBalances").findOneAndUpdate(
      { id },
      { $set: { ...balance, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Leave balance not found");
    return toSchema<LeaveBalance>(result);
  }

  async reinitializeLeaveBalancesForMember(teamMemberId: string): Promise<LeaveBalance[]> {
    const db = await getDb();
    const currentYear = new Date().getFullYear();

    // Delete existing balances for current year
    await db.collection("leaveBalances").deleteMany({
      teamMemberId,
      year: currentYear,
    });

    // Get member's joined date
    const member = await db.collection("teamMembers").findOne({ id: teamMemberId });
    if (!member) throw new Error("Team member not found");

    const joinedDate = member.joinedDate ? new Date(member.joinedDate) : new Date();
    return this.initializeLeaveBalancesForMember(teamMemberId, joinedDate);
  }

  async initializeLeaveBalancesForMember(teamMemberId: string, joinedDate: Date): Promise<LeaveBalance[]> {
    const db = await getDb();
    const currentYear = new Date().getFullYear();
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth();

    // Get team member's job role to find applicable policies
    const member = await db.collection("teamMembers").findOne({ id: teamMemberId });
    if (!member) throw new Error("Team member not found");

    // Find the job role by title to get its ID
    const jobRole = await db.collection("jobRoles").findOne({ title: member.roleTitle });
    const jobRoleId = jobRole?.id;

    // Get leave policies for this role
    let policies: any[] = [];
    if (jobRoleId) {
      policies = await db.collection("leavePolicies").find({
        jobRoleId: jobRoleId,
        isActive: true
      }).toArray();
    }

    // If no policies found for this role, try to use any default policy
    const leaveTypes = await db.collection("leaveTypes").find({ isActive: true }).toArray();

    // Default quotas per leave type category (used when no policy exists)
    const defaultQuotas: Record<string, number> = {
      "CASUAL": 12,
      "SICK": 10,
      "EARNED": 15,
      "MATERNITY": 180,
      "PATERNITY": 15,
      "UNPAID": 30,
      "COMPENSATORY": 10,
      "OTHER": 5,
    };

    const balances: LeaveBalance[] = [];

    for (const type of leaveTypes) {
      const policy = policies.find(p => p.leaveTypeId === type.id);
      // Use policy quota if exists, otherwise use default based on category
      const annualQuota = policy?.annualQuota ?? defaultQuotas[type.category] ?? 10;

      // Calculate pro-rata quota if joined mid-year
      let proRataQuota = annualQuota;
      if (joinedYear === currentYear) {
        const remainingMonths = 12 - joinedMonth;
        proRataQuota = Math.round((annualQuota * remainingMonths / 12) * 100) / 100;
      }

      // Check if balance already exists
      const existing = await db.collection("leaveBalances").findOne({
        teamMemberId,
        leaveTypeId: type.id,
        year: currentYear,
      });

      if (!existing) {
        const balance = await this.createLeaveBalance({
          teamMemberId,
          leaveTypeId: type.id,
          year: currentYear,
          totalQuota: proRataQuota,
          used: 0,
          pending: 0,
          available: proRataQuota,
          carryForward: 0,
        });
        balances.push(balance);
      }
    }

    return balances;
  }

  async recalculateLeaveBalance(teamMemberId: string, leaveTypeId: string, year: number): Promise<LeaveBalance> {
    const db = await getDb();

    // Get all leave requests for this member, type, and year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const requests = await db.collection("leaveRequests").find({
      teamMemberId,
      leaveTypeId,
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }).toArray();

    // Calculate used (approved) and pending days
    let used = 0;
    let pending = 0;

    for (const req of requests) {
      if (req.status === "APPROVED") {
        used += req.totalDays;
      } else if (req.status === "PENDING") {
        pending += req.totalDays;
      }
    }

    // Get or create leave balance
    let balance = await db.collection("leaveBalances").findOne({
      teamMemberId,
      leaveTypeId,
      year,
    });

    if (!balance) {
      // Initialize balance if doesn't exist
      const member = await db.collection("teamMembers").findOne({ id: teamMemberId });
      const joinedDate = member?.joinedDate ? new Date(member.joinedDate) : new Date();
      await this.initializeLeaveBalancesForMember(teamMemberId, joinedDate);
      balance = await db.collection("leaveBalances").findOne({
        teamMemberId,
        leaveTypeId,
        year,
      });
    }

    if (balance) {
      const available = Math.max(0, (balance.totalQuota || 0) + (balance.carryForward || 0) - used - pending);

      const result = await db.collection("leaveBalances").findOneAndUpdate(
        { id: balance.id },
        {
          $set: {
            used,
            pending,
            available,
            updatedAt: new Date()
          }
        },
        { returnDocument: "after" }
      );
      return toSchema<LeaveBalance>(result!);
    }

    throw new Error("Could not create or find leave balance");
  }

  async checkLeaveAvailability(
    teamMemberId: string,
    leaveTypeId: string,
    requestedDays: number,
    year?: number
  ): Promise<{
    available: boolean;
    balance: number;
    pending: number;
    used: number;
    totalQuota: number;
    requestedDays: number;
    shortfall: number;
    leaveTypeName?: string;
    message: string;
  }> {
    const db = await getDb();
    const currentYear = year || new Date().getFullYear();

    // Get leave type details
    const leaveType = await db.collection("leaveTypes").findOne({ id: leaveTypeId });
    const leaveTypeName = leaveType?.name || "Unknown";

    // Get or initialize leave balance
    let balance = await db.collection("leaveBalances").findOne({
      teamMemberId,
      leaveTypeId,
      year: currentYear,
    });

    // If balance doesn't exist, initialize it
    if (!balance) {
      const member = await db.collection("teamMembers").findOne({ id: teamMemberId });
      if (!member) {
        return {
          available: false,
          balance: 0,
          pending: 0,
          used: 0,
          totalQuota: 0,
          requestedDays,
          shortfall: requestedDays,
          leaveTypeName,
          message: "Team member not found",
        };
      }
      const joinedDate = member.joinedDate ? new Date(member.joinedDate) : new Date();
      await this.initializeLeaveBalancesForMember(teamMemberId, joinedDate);
      balance = await db.collection("leaveBalances").findOne({
        teamMemberId,
        leaveTypeId,
        year: currentYear,
      });
    }

    if (!balance) {
      return {
        available: false,
        balance: 0,
        pending: 0,
        used: 0,
        totalQuota: 0,
        requestedDays,
        shortfall: requestedDays,
        leaveTypeName,
        message: `No leave balance found for ${leaveTypeName}. Please contact HR to set up your leave policy.`,
      };
    }

    const totalQuota = (balance.totalQuota || 0) + (balance.carryForward || 0);
    const used = balance.used || 0;
    const pending = balance.pending || 0;
    const availableBalance = Math.max(0, totalQuota - used - pending);
    const shortfall = Math.max(0, requestedDays - availableBalance);
    const isAvailable = requestedDays <= availableBalance;

    let message = "";
    if (isAvailable) {
      message = `You have ${availableBalance} ${leaveTypeName} days available. After this request, you will have ${availableBalance - requestedDays} days remaining.`;
    } else {
      message = `Insufficient ${leaveTypeName} balance. You have ${availableBalance} days available but requested ${requestedDays} days. You are short by ${shortfall} days.`;
    }

    return {
      available: isAvailable,
      balance: availableBalance,
      pending,
      used,
      totalQuota,
      requestedDays,
      shortfall,
      leaveTypeName,
      message,
    };
  }

  // ============================================
  // SLACK INTEGRATION METHODS
  // ============================================

  async getSlackSettings(): Promise<SlackSettings | undefined> {
    const db = await getDb();
    const settings = await db.collection("slackSettings").findOne({});
    return settings ? toSchema<SlackSettings>(settings) : undefined;
  }

  async saveSlackSettings(settings: InsertSlackSettings): Promise<SlackSettings> {
    const db = await getDb();

    // Remove existing settings first (only one Slack configuration allowed)
    await db.collection("slackSettings").deleteMany({});

    const newSettings = {
      id: nanoid(),
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("slackSettings").insertOne(toMongo(newSettings));
    return toSchema<SlackSettings>(newSettings);
  }

  async updateSlackSettings(id: string, settings: Partial<InsertSlackSettings>): Promise<SlackSettings> {
    const db = await getDb();
    await db.collection("slackSettings").updateOne(
      { id },
      { $set: { ...settings, updatedAt: new Date() } }
    );
    const updated = await db.collection("slackSettings").findOne({ id });
    return toSchema<SlackSettings>(updated);
  }

  async deleteSlackSettings(): Promise<void> {
    const db = await getDb();
    await db.collection("slackSettings").deleteMany({});
  }

  // Slack Attendance Log methods
  async getSlackAttendanceLogs(filters?: { teamMemberId?: string; fromDate?: string; toDate?: string; eventType?: string }): Promise<SlackAttendanceLogWithDetails[]> {
    const db = await getDb();
    const query: any = {};

    if (filters?.teamMemberId) {
      query.teamMemberId = filters.teamMemberId;
    }
    if (filters?.eventType) {
      query.eventType = filters.eventType;
    }
    if (filters?.fromDate || filters?.toDate) {
      query.timestamp = {};
      if (filters.fromDate) {
        query.timestamp.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        query.timestamp.$lte = new Date(filters.toDate);
      }
    }

    const logs = await db.collection("slackAttendanceLogs")
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    // Join with team members
    const teamMembers = await db.collection("teamMembers").find({}).toArray();
    const memberMap = new Map(teamMembers.map(m => [m.id, m]));

    return logs.map(log => {
      const member = memberMap.get(log.teamMemberId);
      return {
        ...toSchema<SlackAttendanceLog>(log),
        memberName: member?.name,
        memberEmail: member?.email,
      };
    });
  }

  async getSlackAttendanceLogByMessageTs(slackMessageTs: string): Promise<SlackAttendanceLog | undefined> {
    const db = await getDb();
    const log = await db.collection("slackAttendanceLogs").findOne({ slackMessageTs });
    return log ? toSchema<SlackAttendanceLog>(log) : undefined;
  }

  async createSlackAttendanceLog(log: InsertSlackAttendanceLog): Promise<SlackAttendanceLog> {
    const db = await getDb();
    const newLog = {
      id: nanoid(),
      ...log,
      timestamp: new Date(log.timestamp),
      createdAt: new Date(),
    };
    await db.collection("slackAttendanceLogs").insertOne(toMongo(newLog));
    return toSchema<SlackAttendanceLog>(newLog);
  }

  // Get team member by Slack user ID
  async getTeamMemberBySlackUserId(slackUserId: string): Promise<TeamMember | undefined> {
    const db = await getDb();
    const member = await db.collection("teamMembers").findOne({ slackUserId });
    return member ? toSchema<TeamMember>(member) : undefined;
  }

  // Fixed Asset methods
  async getFixedAssets(filters?: { status?: string; category?: string; search?: string }): Promise<FixedAsset[]> {
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
        { description: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } },
      ];
    }

    const assets = await db.collection("fixedAssets").find(query).sort({ purchaseDate: -1 }).toArray();
    return assets.map((a) => toSchema<FixedAsset>(a));
  }

  async getFixedAssetById(id: string): Promise<FixedAsset | undefined> {
    const db = await getDb();
    const asset = await db.collection("fixedAssets").findOne({ id });
    return asset ? toSchema<FixedAsset>(asset) : undefined;
  }

  async createFixedAsset(asset: InsertFixedAsset): Promise<FixedAsset> {
    const db = await getDb();
    const newAsset = {
      id: nanoid(),
      ...asset,
      purchaseDate: new Date(asset.purchaseDate),
      currentValue: asset.currentValue ?? asset.purchaseValue,
      disposalDate: asset.disposalDate ? new Date(asset.disposalDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("fixedAssets").insertOne(toMongo(newAsset));
    return toSchema<FixedAsset>(newAsset);
  }

  async updateFixedAsset(id: string, asset: Partial<InsertFixedAsset>): Promise<FixedAsset> {
    const db = await getDb();
    const updateData: any = {
      ...asset,
      updatedAt: new Date(),
    };
    if (asset.purchaseDate) {
      updateData.purchaseDate = new Date(asset.purchaseDate);
    }
    if (asset.disposalDate) {
      updateData.disposalDate = new Date(asset.disposalDate);
    }
    await db.collection("fixedAssets").updateOne({ id }, { $set: updateData });
    const updated = await db.collection("fixedAssets").findOne({ id });
    return toSchema<FixedAsset>(updated);
  }

  async deleteFixedAsset(id: string): Promise<void> {
    const db = await getDb();
    await db.collection("fixedAssets").deleteOne({ id });
  }
}

export const storage = new DatabaseStorage();
