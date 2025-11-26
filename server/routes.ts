import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ToWords } from "to-words";
import QRCode from "qrcode";
import {
  insertClientSchema,
  insertProjectSchema,
  insertPaymentSchema,
  insertServiceSchema,
  insertVendorSchema,
  insertExpenseCategorySchema,
  insertExpenseSchema,
  insertTeamMemberSchema,
  insertSalaryPaymentSchema,
  insertCompanyProfileSchema,
  insertJobRoleSchema,
} from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "development-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required", message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error("JWT verification error:", err.message);
      return res.status(403).json({ 
        error: "Invalid token", 
        message: err.message === "jwt expired" ? "Token has expired. Please login again." : "Invalid or malformed token" 
      });
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

  app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.json({ success: true });
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

  app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
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

  app.delete("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // INVOICE VIEW (Server-Side Rendered HTML)
  // ============================================
  app.get("/invoice/:id/view", async (req, res) => {
    try {
      // Fetch invoice with line items
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).send("Invoice not found");
      }

      // Fetch client
      const client = await storage.getClientById(invoice.clientId);
      
      // Fetch company profile
      const companyProfile = await storage.getCompanyProfile();

      // Format currency for INR with proper Indian formatting
      const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: invoice.currency || "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      };

      // Format date
      const formatDate = (date: Date | string): string => {
        const d = new Date(date);
        return d.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      // Convert amount to words
      const toWords = new ToWords({
        localeCode: "en-IN",
        converterOptions: {
          currency: true,
          ignoreDecimal: false,
          ignoreZeroCurrency: false,
          doNotAddOnly: false,
          currencyOptions: {
            name: "Rupee",
            plural: "Rupees",
            symbol: "₹",
            fractionalUnit: {
              name: "Paisa",
              plural: "Paise",
              symbol: "",
            },
          },
        },
      });

      // Calculate tax rate
      const taxRate = invoice.subtotal > 0 
        ? ((invoice.taxAmount / invoice.subtotal) * 100).toFixed(0)
        : "0";

      // Generate UPI QR code if UPI ID is available
      let qrCodeDataUrl: string | null = null;
      if (companyProfile?.upiId) {
        try {
          const upiParams = new URLSearchParams();
          upiParams.set("pa", companyProfile.upiId);
          upiParams.set("pn", companyProfile.companyName || "Company");
          upiParams.set("am", invoice.balanceDue > 0 ? invoice.balanceDue.toFixed(2) : invoice.totalAmount.toFixed(2));
          upiParams.set("tn", `Payment for Invoice ${invoice.invoiceNumber}`);
          upiParams.set("cu", "INR");
          const upiUrl = `upi://pay?${upiParams.toString()}`;
          
          qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: "M",
          });
        } catch (qrError) {
          console.error("Error generating QR code:", qrError);
        }
      }

      // Build the data object for EJS template
      const templateData = {
        company: {
          name: companyProfile?.companyName || "Hyperlinq Technology",
          tagline: "Invoice Service",
          phone: companyProfile?.phone || "+91 98765 43210",
          email: companyProfile?.email || "contact@hyperlinq.tech",
          logoUrl: companyProfile?.logoUrl || null,
        },
        invoice: {
          number: invoice.invoiceNumber,
          date: formatDate(invoice.issueDate),
          dueDate: formatDate(invoice.dueDate),
          status: invoice.status,
        },
        client: {
          name: client?.name || invoice.clientName || "Client",
          email: client?.email || "",
          address: client 
            ? [client.address, client.city, client.state, client.pincode].filter(Boolean).join(", ")
            : "",
          website: client?.companyWebsite || "",
        },
        payment: {
          method: "Bank Transfer / UPI",
          beneficiaryName: companyProfile?.bankAccountHolderName || companyProfile?.companyName || "Hyperlinq Technology",
          accountNumber: companyProfile?.bankAccountNumber || "",
          ifscCode: companyProfile?.bankIfscCode || "",
          bankName: companyProfile?.bankName || "",
          upiId: companyProfile?.upiId || "",
          paymentLink: companyProfile?.paymentLink || "",
        },
        items: (invoice.lineItems || []).map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: formatCurrency(item.unitPrice),
          amount: formatCurrency(item.lineTotal),
        })),
        totals: {
          subtotal: formatCurrency(invoice.subtotal),
          tax: formatCurrency(invoice.taxAmount),
          taxRate: taxRate,
          grandTotal: formatCurrency(invoice.totalAmount),
          amountPaid: formatCurrency(invoice.amountPaid || 0),
          amountPaidValue: invoice.amountPaid || 0,
          balanceDue: formatCurrency(invoice.balanceDue),
          amountInWords: toWords.convert(invoice.totalAmount),
          balanceInWords: invoice.balanceDue > 0 ? toWords.convert(invoice.balanceDue) : null,
        },
        notes: invoice.notes || "",
        terms: companyProfile?.invoiceTerms || "",
        footer: {
          showQr: !!companyProfile?.upiId,
          qrCodeUrl: qrCodeDataUrl,
          upiId: companyProfile?.upiId || "",
          paymentLink: companyProfile?.paymentLink || "",
          signatoryName: companyProfile?.authorizedSignatoryName || "Authorized Signatory",
          signatoryTitle: companyProfile?.authorizedSignatoryTitle || "Director",
          signDate: formatDate(invoice.issueDate),
        },
      };

      res.render("invoice", templateData);
    } catch (error: any) {
      console.error("Error rendering invoice:", error);
      res.status(500).send("Error rendering invoice: " + error.message);
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
  // SERVICE ROUTES
  // ============================================
  app.get("/api/services", authenticateToken, async (req, res) => {
    try {
      const { status, category } = req.query;
      const services = await storage.getServices({
        status: status as string,
        category: category as string,
      });
      res.json(services);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/services/:id", authenticateToken, async (req, res) => {
    try {
      const service = await storage.getServiceById(req.params.id);
      if (!service) {
        return res.status(404).send("Service not found");
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/services", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.json(service);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/services/:id", authenticateToken, async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      res.json(service);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/services/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const service = await storage.updateServiceStatus(req.params.id, status);
      res.json(service);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/services/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ success: true });
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

  app.delete("/api/vendors/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.json({ success: true });
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

  app.delete("/api/expense-categories/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteExpenseCategory(req.params.id);
      res.json({ success: true });
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

  app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteExpense(req.params.id);
      res.json({ success: true });
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

  app.delete("/api/team-members/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteTeamMember(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // JOB ROLE ROUTES
  // ============================================
  app.get("/api/job-roles", authenticateToken, async (req, res) => {
    try {
      const { status } = req.query;
      const roles = await storage.getJobRoles({
        status: status as string,
      });
      res.json(roles);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/job-roles/:id", authenticateToken, async (req, res) => {
    try {
      const role = await storage.getJobRoleById(req.params.id);
      if (!role) {
        return res.status(404).send("Job role not found");
      }
      res.json(role);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/job-roles", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertJobRoleSchema.parse(req.body);
      const role = await storage.createJobRole(validatedData);
      res.json(role);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/job-roles/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertJobRoleSchema.partial().parse(req.body);
      const role = await storage.updateJobRole(req.params.id, validatedData);
      res.json(role);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/job-roles/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteJobRole(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Seed default job roles endpoint
  app.post("/api/job-roles/seed-defaults", authenticateToken, async (req, res) => {
    try {
      await storage.seedDefaultJobRoles();
      const roles = await storage.getJobRoles({});
      res.json({ message: "Default job roles seeded successfully", count: roles.length });
    } catch (error: any) {
      res.status(500).send(error.message);
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

  app.delete("/api/salaries/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteSalaryPayment(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // COMPANY PROFILE ROUTES
  // ============================================
  app.get("/api/settings/company", authenticateToken, async (req, res) => {
    try {
      const profile = await storage.getCompanyProfile();
      // Return null/empty object if no profile exists yet (not an error condition)
      res.json(profile || null);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/settings/company", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCompanyProfileSchema.parse(req.body);
      const profile = await storage.createCompanyProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/settings/company/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Seed default job roles on startup
  storage.seedDefaultJobRoles().catch(err => {
    console.error("Error seeding default job roles:", err);
  });

  const httpServer = createServer(app);
  return httpServer;
}
