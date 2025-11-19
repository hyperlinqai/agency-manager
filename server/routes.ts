import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  insertClientSchema,
  insertProjectSchema,
  insertPaymentSchema,
  insertVendorSchema,
  insertExpenseCategorySchema,
  insertExpenseSchema,
  insertTeamMemberSchema,
  insertSalaryPaymentSchema,
} from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "development-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Authentication required");
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // AUTH ROUTES
  // ============================================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).send("Email and password are required");
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).send("Invalid credentials");
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).send("Invalid credentials");
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // CLIENT ROUTES
  // ============================================
  app.get("/api/clients", authenticateToken, async (req, res) => {
    try {
      const { status, search } = req.query;
      const clients = await storage.getClients({
        status: status as string,
        search: search as string,
      });
      res.json(clients);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      const client = await storage.getClientById(req.params.id);
      if (!client) {
        return res.status(404).send("Client not found");
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/clients", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      res.json(client);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/clients/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const client = await storage.updateClientStatus(req.params.id, status);
      res.json(client);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // PROJECT ROUTES
  // ============================================
  app.get("/api/projects", authenticateToken, async (req, res) => {
    try {
      const { clientId } = req.query;
      const projects = await storage.getProjects({
        clientId: clientId as string,
      });
      res.json(projects);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req, res) => {
    try {
      const project = await storage.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).send("Project not found");
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/projects", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/projects/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      res.json(project);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // INVOICE ROUTES
  // ============================================
  app.get("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const { clientId, status, search } = req.query;
      const invoices = await storage.getInvoices({
        clientId: clientId as string,
        status: status as string,
        search: search as string,
      });
      res.json(invoices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/invoices/upcoming", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getUpcomingInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).send("Invoice not found");
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const invoice = await storage.createInvoice(req.body);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/invoices/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const invoice = await storage.updateInvoiceStatus(req.params.id, status);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // PAYMENT ROUTES
  // ============================================
  app.get("/api/invoices/:id/payments", authenticateToken, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByInvoiceId(req.params.id);
      res.json(payments);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/invoices/:id/payments", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        invoiceId: req.params.id,
      });
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // DASHBOARD ROUTES
  // ============================================
  app.get("/api/dashboard/summary", authenticateToken, async (req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/dashboard/financial", authenticateToken, async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      const summary = await storage.getFinancialSummary({
        fromDate: fromDate as string,
        toDate: toDate as string,
      });
      res.json(summary);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // VENDOR ROUTES
  // ============================================
  app.get("/api/vendors", authenticateToken, async (req, res) => {
    try {
      const { status, search, category } = req.query;
      const vendors = await storage.getVendors({
        status: status as string,
        search: search as string,
        category: category as string,
      });
      res.json(vendors);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/vendors/:id", authenticateToken, async (req, res) => {
    try {
      const vendor = await storage.getVendorById(req.params.id);
      if (!vendor) {
        return res.status(404).send("Vendor not found");
      }
      res.json(vendor);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/vendors", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/vendors/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(req.params.id, validatedData);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/vendors/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const vendor = await storage.updateVendorStatus(req.params.id, status);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // EXPENSE CATEGORY ROUTES
  // ============================================
  app.get("/api/expense-categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/expense-categories/:id", authenticateToken, async (req, res) => {
    try {
      const category = await storage.getExpenseCategoryById(req.params.id);
      if (!category) {
        return res.status(404).send("Expense category not found");
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/expense-categories", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertExpenseCategorySchema.parse(req.body);
      const category = await storage.createExpenseCategory(validatedData);
      res.json(category);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/expense-categories/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertExpenseCategorySchema.partial().parse(req.body);
      const category = await storage.updateExpenseCategory(req.params.id, validatedData);
      res.json(category);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // EXPENSE ROUTES
  // ============================================
  app.get("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const { fromDate, toDate, vendorId, categoryId, status } = req.query;
      const expenses = await storage.getExpenses({
        fromDate: fromDate as string,
        toDate: toDate as string,
        vendorId: vendorId as string,
        categoryId: categoryId as string,
        status: status as string,
      });
      res.json(expenses);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const expense = await storage.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).send("Expense not found");
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.json(expense);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, validatedData);
      res.json(expense);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/expenses/:id/mark-paid", authenticateToken, async (req, res) => {
    try {
      const { paymentDate, paymentMethod, reference } = req.body;
      if (!paymentDate || !paymentMethod) {
        return res.status(400).send("Payment date and method are required");
      }
      const expense = await storage.markExpensePaid(req.params.id, {
        paymentDate: new Date(paymentDate),
        paymentMethod,
        reference: reference || "",
      });
      res.json(expense);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // TEAM MEMBER ROUTES
  // ============================================
  app.get("/api/team-members", authenticateToken, async (req, res) => {
    try {
      const { status } = req.query;
      const members = await storage.getTeamMembers({
        status: status as string,
      });
      res.json(members);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/team-members/:id", authenticateToken, async (req, res) => {
    try {
      const member = await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return res.status(404).send("Team member not found");
      }
      res.json(member);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/team-members", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validatedData);
      res.json(member);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/team-members/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.partial().parse(req.body);
      const member = await storage.updateTeamMember(req.params.id, validatedData);
      res.json(member);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/team-members/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const member = await storage.updateTeamMemberStatus(req.params.id, status);
      res.json(member);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // SALARY PAYMENT ROUTES
  // ============================================
  app.get("/api/salaries", authenticateToken, async (req, res) => {
    try {
      const { teamMemberId, month, status } = req.query;
      const salaries = await storage.getSalaryPayments({
        teamMemberId: teamMemberId as string,
        month: month as string,
        status: status as string,
      });
      res.json(salaries);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/salaries/:id", authenticateToken, async (req, res) => {
    try {
      const salary = await storage.getSalaryPaymentById(req.params.id);
      if (!salary) {
        return res.status(404).send("Salary payment not found");
      }
      res.json(salary);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/salaries", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSalaryPaymentSchema.parse(req.body);
      const salary = await storage.createSalaryPayment(validatedData);
      res.json(salary);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/salaries/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSalaryPaymentSchema.partial().parse(req.body);
      const salary = await storage.updateSalaryPayment(req.params.id, validatedData);
      res.json(salary);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/salaries/:id/mark-paid", authenticateToken, async (req, res) => {
    try {
      const { paymentDate, paymentMethod, reference } = req.body;
      if (!paymentDate || !paymentMethod) {
        return res.status(400).send("Payment date and method are required");
      }
      const salary = await storage.markSalaryPaid(req.params.id, {
        paymentDate: new Date(paymentDate),
        paymentMethod,
        reference: reference || "",
      });
      res.json(salary);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
