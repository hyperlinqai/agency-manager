import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getDb } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ToWords } from "to-words";
import QRCode from "qrcode";
import { upload, uploadToCloudinary, deleteFromCloudinary, getFileType } from "./cloudinary";
import {
  generateProposalContent,
  generateContractContent,
  getAvailableProviders,
  PROPOSAL_TEMPLATES,
  type AIProvider,
  type ProposalGenerationRequest,
  type ContractGenerationRequest,
} from "./ai-service";
import {
  sendEmail,
  isEmailConfigured,
  getEmailServiceStatus,
  initializeResend,
  generateProposalEmailTemplate,
  generateInvoiceEmailTemplate,
  generateContractEmailTemplate,
} from "./email-service";
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
  insertProposalSchema,
  insertContractSchema,
  insertClientOnboardingDataSchema,
  insertMonthlyReportSchema,
  insertClientDigitalAssetSchema,
  insertApiSettingsSchema,
  insertAttendanceSchema,
  insertLeaveTypeSchema,
  insertLeavePolicySchema,
  insertLeaveRequestSchema,
  insertSlackSettingsSchema,
} from "@shared/schema";
import { slackService } from "./slack-service";

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
  // PUBLIC CLIENT ONBOARDING ROUTES (No Auth Required)
  // ============================================
  
  // Get client info by onboarding token (public)
  app.get("/api/public/onboarding/:token", async (req, res) => {
    try {
      const token = req.params.token;
      console.log("Looking up client with onboarding token:", token);
      
      const client = await storage.getClientByOnboardingToken(token);
      if (!client) {
        console.log("No client found with token:", token);
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      console.log("Found client:", client.name);
      
      // Return limited client info for public view
      res.json({
        clientId: client.id,
        companyName: client.name,
        contactName: client.contactName,
        email: client.email,
        onboardingCompleted: (client as any).onboardingCompleted || false,
      });
    } catch (error: any) {
      console.error("Error in GET /api/public/onboarding/:token:", error);
      res.status(500).send(error.message);
    }
  });
  
  // Get onboarding data by token (public)
  app.get("/api/public/onboarding/:token/data", async (req, res) => {
    try {
      const client = await storage.getClientByOnboardingToken(req.params.token);
      if (!client) {
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      let data = await storage.getClientOnboardingData(client.id);
      
      if (!data) {
        // Create initial onboarding data
        data = await storage.createClientOnboardingData({
          clientId: client.id,
          overallStatus: "NOT_STARTED",
        });
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Error in GET /api/public/onboarding/:token/data:", error);
      res.status(500).send(error.message);
    }
  });
  
  // Submit onboarding data (public)
  app.put("/api/public/onboarding/:token", async (req, res) => {
    try {
      const client = await storage.getClientByOnboardingToken(req.params.token);
      if (!client) {
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      if (client.onboardingCompleted) {
        return res.status(400).json({ error: "Onboarding has already been completed" });
      }
      
      let data = await storage.getClientOnboardingData(client.id);
      
      const onboardingPayload = {
        ...req.body,
        clientId: client.id,
        submittedAt: new Date(),
        submittedBy: client.contactName,
      };
      
      if (!data) {
        data = await storage.createClientOnboardingData(onboardingPayload);
      } else {
        data = await storage.updateClientOnboardingData(data.id, onboardingPayload);
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Error in PUT /api/public/onboarding/:token:", error);
      res.status(400).send(error.message);
    }
  });
  
  // Complete onboarding submission (public)
  app.post("/api/public/onboarding/:token/submit", async (req, res) => {
    try {
      const client = await storage.getClientByOnboardingToken(req.params.token);
      if (!client) {
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      // Update client as onboarding completed
      const updatedClient = await storage.updateClient(client.id, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        status: "ACTIVE",
      });
      
      // Update onboarding data status
      let data = await storage.getClientOnboardingData(client.id);
      if (data) {
        data = await storage.updateClientOnboardingData(data.id, {
          overallStatus: "COMPLETED",
          submittedAt: new Date().toISOString(),
          submittedBy: client.contactName,
        });
      }
      
      res.json({ success: true, message: "Onboarding completed successfully" });
    } catch (error: any) {
      console.error("Error in POST /api/public/onboarding/:token/submit:", error);
      res.status(500).send(error.message);
    }
  });

  // PUBLIC TEAM ONBOARDING ROUTES (No Auth Required)
  // ============================================
  
  // Debug endpoint to check all team member tokens (remove in production)
  app.get("/api/debug/team-tokens", async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      const tokens = members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        hasToken: !!m.onboardingToken,
        tokenLength: m.onboardingToken?.length || 0,
        tokenPreview: m.onboardingToken ? m.onboardingToken.substring(0, 20) + '...' : 'NONE',
        onboardingUrl: m.onboardingToken ? `/team-onboarding/${m.onboardingToken}` : 'NO TOKEN'
      }));
      res.json({ count: tokens.length, members: tokens });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get team member info by onboarding token (public)
  app.get("/api/public/team-onboarding/:token", async (req, res) => {
    try {
      // Route is being hit - log it
      console.log("🔍 ===== TEAM ONBOARDING ENDPOINT HIT =====");
      console.log("Request received at:", new Date().toISOString());
      console.log("URL params:", req.params);
      
      const rawToken = req.params.token;
      const token = decodeURIComponent(rawToken);
      
      console.log("Raw token from URL:", rawToken);
      console.log("Decoded token:", token);
      console.log("Token length:", token.length);
      console.log("Token type:", typeof token);
      
      // Direct database query to verify
      const db = await getDb();
      const directQuery = await db.collection("teamMembers").findOne({ onboardingToken: token });
      console.log("Direct DB query result:", directQuery ? `Found: ${directQuery.name}` : "Not found");
      if (directQuery) {
        console.log("Direct query token:", directQuery.onboardingToken?.substring(0, 20) + "...");
      }
      
      const member = await storage.getTeamMemberByOnboardingToken(token);
      if (!member) {
        console.log("❌ No team member found with token:", token);
        // Try to find any team members to help debug
        const allMembers = await storage.getTeamMembers();
        console.log(`Total team members in database: ${allMembers.length}`);
        if (allMembers.length > 0) {
          console.log("Sample team member tokens:");
          allMembers.slice(0, 5).forEach(m => {
            const tokenPreview = m.onboardingToken ? `${m.onboardingToken.substring(0, 20)}...` : 'NONE';
            console.log(`  - ${m.name} (${m.id}): token=${tokenPreview}, length=${m.onboardingToken?.length || 0}`);
            // Check if tokens match
            if (m.onboardingToken === token) {
              console.log(`    ⚠️  TOKEN MATCHES! But query didn't find it.`);
            }
          });
        }
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      console.log("✅ Found team member:", member.name, "ID:", member.id);
      console.log("Member token:", member.onboardingToken?.substring(0, 20) + "...");
      
      res.json({
        teamMemberId: member.id,
        name: member.name,
        email: member.email,
        roleTitle: member.roleTitle,
        onboardingCompleted: member.onboardingCompleted || false,
      });
    } catch (error: any) {
      console.error("❌ Error in GET /api/public/team-onboarding/:token:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get saved team onboarding data (public)
  app.get("/api/public/team-onboarding/:token/data", async (req, res) => {
    try {
      const member = await storage.getTeamMemberByOnboardingToken(req.params.token);
      if (!member) {
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      // Parse onboarding data from notes field
      // The notes field contains onboarding data in a structured format
      const notes = member.notes || "";
      const onboardingData: any = {};
      
      // Try to extract data from notes (basic parsing)
      // Format: "--- Onboarding Data ---\nPhone: ...\n..."
      const onboardingSection = notes.split("--- Onboarding Data ---")[1];
      if (onboardingSection) {
        const lines = onboardingSection.split("\n").filter(Boolean);
        lines.forEach(line => {
          if (line.includes("Phone:")) onboardingData.phone = line.replace("Phone:", "").trim();
          if (line.includes("Date of Birth:")) onboardingData.dateOfBirth = line.replace("Date of Birth:", "").trim();
          if (line.includes("Personal Email:")) onboardingData.personalEmail = line.replace("Personal Email:", "").trim();
          if (line.includes("Department:")) onboardingData.department = line.replace("Department:", "").trim();
          if (line.includes("Reporting To:")) onboardingData.reportingTo = line.replace("Reporting To:", "").trim();
          if (line.includes("Address:")) {
            const addressParts = line.replace("Address:", "").trim().split(", ");
            onboardingData.address = addressParts[0] || "";
            onboardingData.city = addressParts[1] || "";
            onboardingData.state = addressParts[2] || "";
            onboardingData.pincode = addressParts[3] || "";
          }
          if (line.includes("PAN:")) onboardingData.panNumber = line.replace("PAN:", "").trim();
          if (line.includes("Bank:")) onboardingData.bankName = line.replace("Bank:", "").trim();
          if (line.includes("Account:")) onboardingData.bankAccountNumber = line.replace("Account:", "").trim();
          if (line.includes("IFSC:")) onboardingData.ifscCode = line.replace("IFSC:", "").trim();
          if (line.includes("Emergency Contact:")) {
            const emergencyMatch = line.match(/Emergency Contact: (.+) \((.+)\)/);
            if (emergencyMatch) {
              onboardingData.emergencyContact = emergencyMatch[1];
              onboardingData.emergencyPhone = emergencyMatch[2];
            }
          }
        });
      }
      
      res.json(onboardingData);
    } catch (error: any) {
      console.error("Error in GET /api/public/team-onboarding/:token/data:", error);
      res.status(500).send(error.message);
    }
  });
  
  // Submit team onboarding data (public)
  app.put("/api/public/team-onboarding/:token", async (req, res) => {
    try {
      const member = await storage.getTeamMemberByOnboardingToken(req.params.token);
      if (!member) {
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      if (member.onboardingCompleted) {
        return res.status(400).json({ error: "Onboarding has already been completed" });
      }
      
      // Update team member with onboarding data
      // Store additional onboarding data in notes or a separate field
      const onboardingData = req.body;
      const updatedNotes = [
        member.notes || "",
        "\n--- Onboarding Data ---",
        onboardingData.phone ? `Phone: ${onboardingData.phone}` : "",
        onboardingData.dateOfBirth ? `Date of Birth: ${onboardingData.dateOfBirth}` : "",
        onboardingData.personalEmail ? `Personal Email: ${onboardingData.personalEmail}` : "",
        onboardingData.department ? `Department: ${onboardingData.department}` : "",
        onboardingData.reportingTo ? `Reporting To: ${onboardingData.reportingTo}` : "",
        onboardingData.address ? `Address: ${onboardingData.address}, ${onboardingData.city}, ${onboardingData.state} ${onboardingData.pincode}` : "",
        onboardingData.panNumber ? `PAN: ${onboardingData.panNumber}` : "",
        onboardingData.bankName ? `Bank: ${onboardingData.bankName}` : "",
        onboardingData.bankAccountNumber ? `Account: ${onboardingData.bankAccountNumber}` : "",
        onboardingData.ifscCode ? `IFSC: ${onboardingData.ifscCode}` : "",
        onboardingData.emergencyContact ? `Emergency Contact: ${onboardingData.emergencyContact} (${onboardingData.emergencyPhone})` : "",
        onboardingData.notes || "",
      ].filter(Boolean).join("\n");
      
      const updatedMember = await storage.updateTeamMember(member.id, {
        notes: updatedNotes,
      });
      
      res.json(updatedMember);
    } catch (error: any) {
      console.error("Error in PUT /api/public/team-onboarding/:token:", error);
      res.status(400).send(error.message);
    }
  });
  
  // Complete team onboarding submission (public)
  app.post("/api/public/team-onboarding/:token/submit", async (req, res) => {
    try {
      const member = await storage.getTeamMemberByOnboardingToken(req.params.token);
      if (!member) {
        return res.status(404).json({ error: "Invalid or expired onboarding link" });
      }
      
      // Update team member as onboarding completed
      const updatedMember = await storage.updateTeamMember(member.id, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        status: "ACTIVE",
      });
      
      res.json({ success: true, message: "Onboarding completed successfully" });
    } catch (error: any) {
      console.error("Error in POST /api/public/team-onboarding/:token/submit:", error);
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // CLIENT ROUTES
  // ============================================
  
  // Regenerate onboarding token
  app.post("/api/clients/:clientId/regenerate-token", authenticateToken, async (req, res) => {
    try {
      const client = await storage.regenerateOnboardingToken(req.params.clientId);
      res.json({ 
        onboardingToken: client.onboardingToken,
        onboardingUrl: `/onboarding/${client.onboardingToken}`
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
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

  app.post("/api/expense-categories/seed-defaults", authenticateToken, async (req, res) => {
    try {
      const result = await storage.seedDefaultExpenseCategories();
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
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

  // Regenerate team member onboarding token
  app.post("/api/team-members/:teamMemberId/regenerate-token", authenticateToken, async (req, res) => {
    try {
      console.log(`🔄 Regenerate token request for team member: ${req.params.teamMemberId}`);
      const member = await storage.regenerateTeamMemberOnboardingToken(req.params.teamMemberId);
      console.log(`✅ Token regenerated, returning: ${member.onboardingToken?.substring(0, 20)}...`);
      res.json({ 
        onboardingToken: member.onboardingToken,
        onboardingUrl: `/team-onboarding/${member.onboardingToken}`
      });
    } catch (error: any) {
      console.error(`❌ Error regenerating token:`, error);
      res.status(500).json({ error: error.message });
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

  // ============================================
  // API SETTINGS ROUTES (AI Keys)
  // ============================================
  app.get("/api/settings/api-keys", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getApiSettings();
      // Mask the keys for security - only show last 4 characters
      if (settings) {
        res.json({
          ...settings,
          openaiApiKey: settings.openaiApiKey ? `${"*".repeat(Math.max(0, settings.openaiApiKey.length - 4))}${settings.openaiApiKey.slice(-4)}` : "",
          geminiApiKey: settings.geminiApiKey ? `${"*".repeat(Math.max(0, settings.geminiApiKey.length - 4))}${settings.geminiApiKey.slice(-4)}` : "",
          resendApiKey: settings.resendApiKey ? `${"*".repeat(Math.max(0, settings.resendApiKey.length - 4))}${settings.resendApiKey.slice(-4)}` : "",
          senderEmail: settings.senderEmail || "",
          senderName: settings.senderName || "",
          hasOpenaiKey: !!settings.openaiApiKey,
          hasGeminiKey: !!settings.geminiApiKey,
          hasResendKey: !!settings.resendApiKey,
        });
      } else {
        res.json({ hasOpenaiKey: false, hasGeminiKey: false, hasResendKey: false, senderEmail: "", senderName: "" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.put("/api/settings/api-keys", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertApiSettingsSchema.parse(req.body);

      // Get existing settings to preserve keys that aren't being updated
      const existing = await storage.getApiSettings();

      const updateData: any = {};

      // Only update openaiApiKey if provided and not masked
      if (validatedData.openaiApiKey !== undefined) {
        if (validatedData.openaiApiKey === "" || !validatedData.openaiApiKey.startsWith("*")) {
          updateData.openaiApiKey = validatedData.openaiApiKey;
        } else if (existing) {
          updateData.openaiApiKey = existing.openaiApiKey;
        }
      }

      // Only update geminiApiKey if provided and not masked
      if (validatedData.geminiApiKey !== undefined) {
        if (validatedData.geminiApiKey === "" || !validatedData.geminiApiKey.startsWith("*")) {
          updateData.geminiApiKey = validatedData.geminiApiKey;
        } else if (existing) {
          updateData.geminiApiKey = existing.geminiApiKey;
        }
      }

      // Only update resendApiKey if provided and not masked
      if (validatedData.resendApiKey !== undefined) {
        if (validatedData.resendApiKey === "" || !validatedData.resendApiKey.startsWith("*")) {
          updateData.resendApiKey = validatedData.resendApiKey;
          // Also initialize Resend with the new key
          if (validatedData.resendApiKey) {
            initializeResend(validatedData.resendApiKey);
          }
        } else if (existing) {
          updateData.resendApiKey = existing.resendApiKey;
        }
      }

      // Update sender email if provided
      if (validatedData.senderEmail !== undefined) {
        updateData.senderEmail = validatedData.senderEmail;
      }

      // Update sender name if provided
      if (validatedData.senderName !== undefined) {
        updateData.senderName = validatedData.senderName;
      }

      const settings = await storage.upsertApiSettings(updateData);

      // Return masked keys
      res.json({
        ...settings,
        openaiApiKey: settings.openaiApiKey ? `${"*".repeat(Math.max(0, settings.openaiApiKey.length - 4))}${settings.openaiApiKey.slice(-4)}` : "",
        geminiApiKey: settings.geminiApiKey ? `${"*".repeat(Math.max(0, settings.geminiApiKey.length - 4))}${settings.geminiApiKey.slice(-4)}` : "",
        resendApiKey: settings.resendApiKey ? `${"*".repeat(Math.max(0, settings.resendApiKey.length - 4))}${settings.resendApiKey.slice(-4)}` : "",
        hasOpenaiKey: !!settings.openaiApiKey,
        hasGeminiKey: !!settings.geminiApiKey,
        hasResendKey: !!settings.resendApiKey,
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Get raw API keys for server-side AI operations (internal use only)
  app.get("/api/settings/api-keys/raw", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getApiSettings();
      res.json(settings || { openaiApiKey: "", geminiApiKey: "" });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Seed default job roles on startup
  storage.seedDefaultJobRoles().catch(err => {
    console.error("Error seeding default job roles:", err);
  });

  // ============================================
  // MARKETING MODULE - PROPOSAL ROUTES
  // ============================================
  app.get("/api/proposals", authenticateToken, async (req, res) => {
    try {
      const { clientId, status } = req.query;
      const proposals = await storage.getProposals({
        clientId: clientId as string,
        status: status as string,
      });
      res.json(proposals);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/proposals/:id", authenticateToken, async (req, res) => {
    try {
      const proposal = await storage.getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).send("Proposal not found");
      }
      res.json(proposal);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/proposals", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(validatedData);
      res.json(proposal);
    } catch (error: any) {
      if (error.errors) {
        // Zod validation error - provide detailed info
        const issues = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error("Proposal validation error:", issues);
        return res.status(400).send(`Validation failed: ${issues}`);
      }
      console.error("Proposal creation error:", error.message);
      res.status(400).send(error.message);
    }
  });

  app.put("/api/proposals/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProposalSchema.partial().parse(req.body);
      const proposal = await storage.updateProposal(req.params.id, validatedData);
      res.json(proposal);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/proposals/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const proposal = await storage.updateProposalStatus(req.params.id, status);
      res.json(proposal);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/proposals/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteProposal(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // AI GENERATION ROUTES
  // ============================================

  // Get available AI providers
  app.get("/api/ai/providers", authenticateToken, async (req, res) => {
    try {
      const providers = getAvailableProviders();
      res.json(providers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get proposal templates
  app.get("/api/ai/proposal-templates", authenticateToken, async (req, res) => {
    try {
      const templates = Object.values(PROPOSAL_TEMPLATES).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
        services: t.services,
      }));
      res.json(templates);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get full template details
  app.get("/api/ai/proposal-templates/:id", authenticateToken, async (req, res) => {
    try {
      const templateId = req.params.id.toUpperCase().replace(/-/g, "_");
      const template = PROPOSAL_TEMPLATES[templateId as keyof typeof PROPOSAL_TEMPLATES];
      if (!template) {
        return res.status(404).send("Template not found");
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Generate proposal content with AI
  app.post("/api/ai/generate-proposal", authenticateToken, async (req, res) => {
    try {
      const { provider, ...request } = req.body as ProposalGenerationRequest & { provider: AIProvider };

      if (!provider || !["openai", "gemini"].includes(provider)) {
        return res.status(400).send("Invalid AI provider. Use 'openai' or 'gemini'");
      }

      const result = await generateProposalContent(request, provider);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Generate contract content with AI
  app.post("/api/ai/generate-contract", authenticateToken, async (req, res) => {
    try {
      const { provider, ...request } = req.body as ContractGenerationRequest & { provider: AIProvider };

      if (!provider || !["openai", "gemini"].includes(provider)) {
        return res.status(400).send("Invalid AI provider. Use 'openai' or 'gemini'");
      }

      const result = await generateContractContent(request, provider);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // MARKETING MODULE - CONTRACT ROUTES
  // ============================================
  app.get("/api/contracts", authenticateToken, async (req, res) => {
    try {
      const { clientId, status } = req.query;
      const contracts = await storage.getContracts({
        clientId: clientId as string,
        status: status as string,
      });
      res.json(contracts);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const contract = await storage.getContractById(req.params.id);
      if (!contract) {
        return res.status(404).send("Contract not found");
      }
      res.json(contract);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/contracts", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      res.json(contract);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(req.params.id, validatedData);
      res.json(contract);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/contracts/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const contract = await storage.updateContractStatus(req.params.id, status);
      res.json(contract);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteContract(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // MARKETING MODULE - CLIENT ONBOARDING DATA ROUTES
  // ============================================
  app.get("/api/clients/:clientId/onboarding", authenticateToken, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      // Check if client exists first
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).send("Client not found");
      }
      
      let data = await storage.getClientOnboardingData(clientId);
      
      // If no onboarding data exists, create initial structure
      if (!data) {
        try {
          data = await storage.createClientOnboardingData({
            clientId: clientId,
            overallStatus: "NOT_STARTED",
          });
        } catch (createError: any) {
          console.error("Error creating onboarding data:", createError);
          // Return a default structure if creation fails
          return res.json({
            id: "",
            clientId: clientId,
            overallStatus: "NOT_STARTED",
            businessDetails: { status: "NOT_STARTED" },
            brandAssets: { status: "NOT_STARTED" },
            websiteCredentials: { status: "NOT_STARTED", items: [] },
            socialCredentials: { status: "NOT_STARTED", items: [] },
            marketingReports: { status: "NOT_STARTED", items: [] },
            additionalNotes: "",
          });
        }
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Error in GET /api/clients/:clientId/onboarding:", error);
      res.status(500).send(error.message);
    }
  });

  app.put("/api/clients/:clientId/onboarding", authenticateToken, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      let data = await storage.getClientOnboardingData(clientId);
      
      if (!data) {
        // Create new if doesn't exist
        data = await storage.createClientOnboardingData({
          clientId: clientId,
          overallStatus: req.body.overallStatus || "NOT_STARTED",
          businessDetails: req.body.businessDetails,
          brandAssets: req.body.brandAssets,
          websiteCredentials: req.body.websiteCredentials,
          socialCredentials: req.body.socialCredentials,
          marketingReports: req.body.marketingReports,
          additionalNotes: req.body.additionalNotes || "",
        });
      } else {
        // Update existing
        data = await storage.updateClientOnboardingData(data.id, req.body);
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Error in PUT /api/clients/:clientId/onboarding:", error);
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // FILE UPLOAD ROUTES (Cloudinary)
  // ============================================
  
  // Upload marketing report file
  app.post("/api/upload/report", authenticateToken, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const result = await uploadToCloudinary(req.file, "hq-crm/reports");
      
      res.json({
        success: true,
        file: {
          name: result.original_filename,
          type: getFileType(req.file.mimetype),
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes,
          format: result.format,
        },
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });
  
  // Upload digital asset file
  app.post("/api/upload/asset", authenticateToken, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const result = await uploadToCloudinary(req.file, "hq-crm/assets");
      
      res.json({
        success: true,
        file: {
          name: result.original_filename,
          type: getFileType(req.file.mimetype),
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes,
          format: result.format,
        },
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });
  
  // Delete uploaded file
  app.delete("/api/upload/:publicId", authenticateToken, async (req, res) => {
    try {
      await deleteFromCloudinary(req.params.publicId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("File delete error:", error);
      res.status(500).json({ error: error.message || "Failed to delete file" });
    }
  });

  // ============================================
  // MARKETING MODULE - MONTHLY REPORT ROUTES
  // ============================================
  app.get("/api/monthly-reports", authenticateToken, async (req, res) => {
    try {
      const { clientId, projectId, status } = req.query;
      const reports = await storage.getMonthlyReports({
        clientId: clientId as string,
        projectId: projectId as string,
        status: status as string,
      });
      res.json(reports);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/monthly-reports/:id", authenticateToken, async (req, res) => {
    try {
      const report = await storage.getMonthlyReportById(req.params.id);
      if (!report) {
        return res.status(404).send("Monthly report not found");
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/monthly-reports", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertMonthlyReportSchema.parse(req.body);
      const report = await storage.createMonthlyReport(validatedData);
      res.json(report);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/monthly-reports/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertMonthlyReportSchema.partial().parse(req.body);
      const report = await storage.updateMonthlyReport(req.params.id, validatedData);
      res.json(report);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/monthly-reports/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Status is required");
      }
      const report = await storage.updateMonthlyReportStatus(req.params.id, status);
      res.json(report);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/monthly-reports/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteMonthlyReport(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // MARKETING MODULE - CLIENT DIGITAL ASSET ROUTES
  // ============================================
  app.get("/api/client-assets", authenticateToken, async (req, res) => {
    try {
      const { clientId, category } = req.query;
      const assets = await storage.getClientDigitalAssets({
        clientId: clientId as string,
        category: category as string,
      });
      res.json(assets);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/client-assets/:id", authenticateToken, async (req, res) => {
    try {
      const asset = await storage.getClientDigitalAssetById(req.params.id);
      if (!asset) {
        return res.status(404).send("Digital asset not found");
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/client-assets", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertClientDigitalAssetSchema.parse(req.body);
      const asset = await storage.createClientDigitalAsset(validatedData);
      res.json(asset);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/client-assets/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertClientDigitalAssetSchema.partial().parse(req.body);
      const asset = await storage.updateClientDigitalAsset(req.params.id, validatedData);
      res.json(asset);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/client-assets/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteClientDigitalAsset(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // HR & PAYROLL MODULE - ATTENDANCE ROUTES
  // ============================================
  app.get("/api/attendance", authenticateToken, async (req, res) => {
    try {
      const { teamMemberId, fromDate, toDate, status } = req.query;
      const records = await storage.getAttendance({
        teamMemberId: teamMemberId as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
        status: status as string,
      });
      res.json(records);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/attendance/:id", authenticateToken, async (req, res) => {
    try {
      const record = await storage.getAttendanceById(req.params.id);
      if (!record) {
        return res.status(404).send("Attendance record not found");
      }
      res.json(record);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/attendance", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const record = await storage.createAttendance(validatedData);
      res.json(record);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/attendance/bulk", authenticateToken, async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).send("Records array is required");
      }

      // Validate each record
      const validatedRecords = records.map(record => insertAttendanceSchema.parse(record));
      const createdRecords = await storage.createBulkAttendance(validatedRecords);
      res.json(createdRecords);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/attendance/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.partial().parse(req.body);
      const record = await storage.updateAttendance(req.params.id, validatedData);
      res.json(record);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/attendance/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteAttendance(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // HR & PAYROLL MODULE - LEAVE TYPE ROUTES
  // ============================================
  app.get("/api/leave-types", authenticateToken, async (req, res) => {
    try {
      const { isActive } = req.query;
      const types = await storage.getLeaveTypes({
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      });
      res.json(types);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/leave-types/:id", authenticateToken, async (req, res) => {
    try {
      const type = await storage.getLeaveTypeById(req.params.id);
      if (!type) {
        return res.status(404).send("Leave type not found");
      }
      res.json(type);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/leave-types", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertLeaveTypeSchema.parse(req.body);
      const type = await storage.createLeaveType(validatedData);
      res.json(type);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/leave-types/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertLeaveTypeSchema.partial().parse(req.body);
      const type = await storage.updateLeaveType(req.params.id, validatedData);
      res.json(type);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Seed default leave types
  app.post("/api/leave-types/seed", authenticateToken, async (req, res) => {
    try {
      await storage.seedDefaultLeaveTypes();
      res.json({ success: true, message: "Default leave types created" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // HR & PAYROLL MODULE - LEAVE POLICY ROUTES
  // ============================================

  // Seed default leave policies for all job roles
  app.post("/api/leave-policies/seed", authenticateToken, async (req, res) => {
    try {
      const result = await storage.seedDefaultLeavePolicies();
      res.json({
        success: true,
        message: `Created ${result.created} policies, ${result.skipped} already existed`,
        ...result,
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.get("/api/leave-policies", authenticateToken, async (req, res) => {
    try {
      const { jobRoleId, leaveTypeId } = req.query;
      const policies = await storage.getLeavePolicies({
        jobRoleId: jobRoleId as string,
        leaveTypeId: leaveTypeId as string,
      });
      res.json(policies);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/leave-policies/:id", authenticateToken, async (req, res) => {
    try {
      const policy = await storage.getLeavePolicyById(req.params.id);
      if (!policy) {
        return res.status(404).send("Leave policy not found");
      }
      res.json(policy);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/leave-policies", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertLeavePolicySchema.parse(req.body);
      const policy = await storage.createLeavePolicy(validatedData);
      res.json(policy);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/leave-policies/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertLeavePolicySchema.partial().parse(req.body);
      const policy = await storage.updateLeavePolicy(req.params.id, validatedData);
      res.json(policy);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/leave-policies/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteLeavePolicy(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // HR & PAYROLL MODULE - LEAVE REQUEST ROUTES
  // ============================================
  app.get("/api/leave-requests", authenticateToken, async (req, res) => {
    try {
      const { teamMemberId, status, fromDate, toDate } = req.query;
      const requests = await storage.getLeaveRequests({
        teamMemberId: teamMemberId as string,
        status: status as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      });
      res.json(requests);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/leave-requests/:id", authenticateToken, async (req, res) => {
    try {
      const request = await storage.getLeaveRequestById(req.params.id);
      if (!request) {
        return res.status(404).send("Leave request not found");
      }
      res.json(request);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Check leave availability before requesting
  app.post("/api/leave-requests/check-availability", authenticateToken, async (req, res) => {
    try {
      const { teamMemberId, leaveTypeId, totalDays, startDate } = req.body;
      if (!teamMemberId || !leaveTypeId || !totalDays) {
        return res.status(400).send("Missing required fields: teamMemberId, leaveTypeId, totalDays");
      }
      const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
      const availability = await storage.checkLeaveAvailability(teamMemberId, leaveTypeId, totalDays, year);
      res.json(availability);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/leave-requests", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);

      // Check leave availability before creating request
      const year = new Date(validatedData.startDate).getFullYear();
      const availability = await storage.checkLeaveAvailability(
        validatedData.teamMemberId,
        validatedData.leaveTypeId,
        validatedData.totalDays,
        year
      );

      if (!availability.available) {
        return res.status(400).json({
          error: "Insufficient leave balance",
          message: availability.message,
          details: {
            available: availability.balance,
            requested: availability.requestedDays,
            shortfall: availability.shortfall,
            leaveType: availability.leaveTypeName,
          }
        });
      }

      const request = await storage.createLeaveRequest(validatedData);
      res.json({
        ...request,
        balanceInfo: {
          remainingAfterApproval: availability.balance - validatedData.totalDays,
          message: availability.message,
        }
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/leave-requests/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.partial().parse(req.body);
      const request = await storage.updateLeaveRequest(req.params.id, validatedData);
      res.json(request);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/leave-requests/:id/approve", authenticateToken, async (req, res) => {
    try {
      const request = await storage.approveLeaveRequest(req.params.id, (req as any).user.id);
      res.json(request);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/leave-requests/:id/reject", authenticateToken, async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).send("Rejection reason is required");
      }
      const request = await storage.rejectLeaveRequest(req.params.id, reason);
      res.json(request);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/leave-requests/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const request = await storage.cancelLeaveRequest(req.params.id);
      res.json(request);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/leave-requests/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteLeaveRequest(req.params.id);
      res.json({ success: true, message: "Leave request deleted successfully" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // HR & PAYROLL MODULE - LEAVE BALANCE ROUTES
  // ============================================
  app.get("/api/leave-balances", authenticateToken, async (req, res) => {
    try {
      const { teamMemberId, year } = req.query;
      const balances = await storage.getLeaveBalances({
        teamMemberId: teamMemberId as string,
        year: year ? parseInt(year as string) : undefined,
      });
      res.json(balances);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/leave-balances/:id", authenticateToken, async (req, res) => {
    try {
      const balance = await storage.getLeaveBalanceById(req.params.id);
      if (!balance) {
        return res.status(404).send("Leave balance not found");
      }
      res.json(balance);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/leave-balances/initialize/:teamMemberId", authenticateToken, async (req, res) => {
    try {
      const { joinedDate } = req.body;
      const balances = await storage.initializeLeaveBalancesForMember(
        req.params.teamMemberId,
        joinedDate ? new Date(joinedDate) : new Date()
      );
      res.json(balances);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reinitialize leave balances for a team member (resets and recalculates)
  app.post("/api/leave-balances/reinitialize/:teamMemberId", authenticateToken, async (req, res) => {
    try {
      const balances = await storage.reinitializeLeaveBalancesForMember(req.params.teamMemberId);
      res.json({
        success: true,
        message: `Reinitialized ${balances.length} leave balances`,
        balances
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reinitialize leave balances for ALL team members
  app.post("/api/leave-balances/reinitialize-all", authenticateToken, async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers({ status: "ACTIVE" });
      let totalBalances = 0;

      for (const member of teamMembers) {
        const balances = await storage.reinitializeLeaveBalancesForMember(member.id);
        totalBalances += balances.length;
      }

      res.json({
        success: true,
        message: `Reinitialized leave balances for ${teamMembers.length} employees (${totalBalances} total balance records)`
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================
  // EMAIL SERVICE ROUTES
  // ============================================

  // Get email service status
  app.get("/api/email/status", authenticateToken, async (req, res) => {
    try {
      const status = getEmailServiceStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Configure Resend API key
  app.post("/api/email/configure", authenticateToken, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).send("API key is required");
      }
      const success = initializeResend(apiKey);
      if (success) {
        // Optionally save to database
        await storage.upsertApiSettings({ resendApiKey: apiKey });
        res.json({ success: true, message: "Resend API configured successfully" });
      } else {
        res.status(400).send("Failed to configure Resend API");
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Send proposal email
  app.post("/api/proposals/:id/send-email", authenticateToken, async (req, res) => {
    try {
      const proposal = await storage.getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).send("Proposal not found");
      }

      const client = await storage.getClientById(proposal.clientId);
      if (!client) {
        return res.status(404).send("Client not found");
      }

      const companyProfile = await storage.getCompanyProfile();
      const apiSettings = await storage.getApiSettings();
      const { customMessage, pdfBase64 } = req.body;

      // Format currency for email
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(amount);
      };

      // Format date for email
      const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      };

      const emailHtml = generateProposalEmailTemplate(
        companyProfile?.companyName || "Hyperlinq Technology",
        client.contactName || client.name,
        proposal.title,
        proposal.proposalNumber,
        formatCurrency(proposal.totalAmount),
        formatDate(proposal.validUntil),
        customMessage
      );

      const attachments = pdfBase64
        ? [
            {
              filename: `${proposal.proposalNumber}.pdf`,
              content: pdfBase64,
              contentType: "application/pdf",
            },
          ]
        : [];

      // Use sender email from settings, or fall back to Resend's test domain
      const senderEmail = apiSettings?.senderEmail || "onboarding@resend.dev";
      const senderName = apiSettings?.senderName || companyProfile?.companyName || "Agency Manager";
      const fromAddress = `${senderName} <${senderEmail}>`;

      const result = await sendEmail({
        to: client.email,
        subject: `Proposal: ${proposal.title} - ${proposal.proposalNumber}`,
        html: emailHtml,
        from: fromAddress,
        replyTo: companyProfile?.email,
        attachments,
      });

      if (result.success) {
        // Update proposal status to SENT (this also sets sentAt via updateProposalStatus)
        await storage.updateProposalStatus(req.params.id, "SENT");
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Send invoice email
  app.post("/api/invoices/:id/send-email", authenticateToken, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).send("Invoice not found");
      }

      const client = await storage.getClientById(invoice.clientId);
      if (!client) {
        return res.status(404).send("Client not found");
      }

      const companyProfile = await storage.getCompanyProfile();
      const apiSettings = await storage.getApiSettings();
      const { customMessage, pdfBase64 } = req.body;

      // Format currency for email
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(amount);
      };

      // Format date for email
      const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      };

      const emailHtml = generateInvoiceEmailTemplate(
        companyProfile?.companyName || "Hyperlinq Technology",
        client.contactName || client.name,
        invoice.invoiceNumber,
        formatCurrency(invoice.totalAmount),
        formatDate(invoice.dueDate),
        formatCurrency(invoice.balanceDue),
        customMessage
      );

      const attachments = pdfBase64
        ? [
            {
              filename: `${invoice.invoiceNumber}.pdf`,
              content: pdfBase64,
              contentType: "application/pdf",
            },
          ]
        : [];

      // Use sender email from settings, or fall back to Resend's test domain
      const senderEmail = apiSettings?.senderEmail || "onboarding@resend.dev";
      const senderName = apiSettings?.senderName || companyProfile?.companyName || "Agency Manager";
      const fromAddress = `${senderName} <${senderEmail}>`;

      const result = await sendEmail({
        to: client.email,
        subject: `Invoice: ${invoice.invoiceNumber} - ${formatCurrency(invoice.totalAmount)}`,
        html: emailHtml,
        from: fromAddress,
        replyTo: companyProfile?.email,
        attachments,
      });

      if (result.success) {
        // Update invoice status if it's a draft
        if (invoice.status === "DRAFT") {
          await storage.updateInvoice(req.params.id, { status: "SENT" });
        }
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Send contract email
  app.post("/api/contracts/:id/send-email", authenticateToken, async (req, res) => {
    try {
      const contract = await storage.getContractById(req.params.id);
      if (!contract) {
        return res.status(404).send("Contract not found");
      }

      const client = await storage.getClientById(contract.clientId);
      if (!client) {
        return res.status(404).send("Client not found");
      }

      const companyProfile = await storage.getCompanyProfile();
      const apiSettings = await storage.getApiSettings();
      const { customMessage, pdfBase64 } = req.body;

      // Format currency for email
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(amount);
      };

      // Format date for email
      const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      };

      const emailHtml = generateContractEmailTemplate(
        companyProfile?.companyName || "Hyperlinq Technology",
        client.contactName || client.name,
        contract.title,
        contract.contractNumber,
        formatCurrency(contract.contractValue),
        formatDate(contract.startDate),
        customMessage
      );

      const attachments = pdfBase64
        ? [
            {
              filename: `${contract.contractNumber}.pdf`,
              content: pdfBase64,
              contentType: "application/pdf",
            },
          ]
        : [];

      // Use sender email from settings, or fall back to Resend's test domain
      const senderEmail = apiSettings?.senderEmail || "onboarding@resend.dev";
      const senderName = apiSettings?.senderName || companyProfile?.companyName || "Agency Manager";
      const fromAddress = `${senderName} <${senderEmail}>`;

      const result = await sendEmail({
        to: client.email,
        subject: `Contract: ${contract.title} - ${contract.contractNumber}`,
        html: emailHtml,
        from: fromAddress,
        replyTo: companyProfile?.email,
        attachments,
      });

      if (result.success) {
        // Update contract status to PENDING_SIGNATURE
        if (contract.status === "DRAFT") {
          await storage.updateContract(req.params.id, { status: "PENDING_SIGNATURE" });
        }
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // SLACK INTEGRATION ROUTES
  // ============================================

  // Slack Webhook Endpoint - receives events from Slack
  // This endpoint does NOT use authenticateToken because it needs to verify Slack's signature instead
  app.post("/api/slack/webhook", async (req: any, res) => {
    try {
      // Handle URL verification challenge from Slack
      if (req.body.type === "url_verification") {
        return res.json({ challenge: req.body.challenge });
      }

      // Get Slack settings
      const settings = await storage.getSlackSettings();
      if (!settings || !settings.isActive) {
        console.log("Slack integration is not configured or inactive");
        return res.status(200).send("OK"); // Always return 200 to Slack
      }

      // Verify Slack request signature
      const signature = req.headers["x-slack-signature"] as string;
      const timestamp = req.headers["x-slack-request-timestamp"] as string;
      const rawBody = req.rawBody?.toString("utf8") || JSON.stringify(req.body);

      if (!signature || !timestamp) {
        console.log("Missing Slack signature headers");
        return res.status(200).send("OK");
      }

      const isValid = slackService.verifySlackRequest(
        settings.signingSecret,
        signature,
        timestamp,
        rawBody
      );

      if (!isValid) {
        console.log("Invalid Slack signature");
        return res.status(200).send("OK");
      }

      // Handle message events
      if (req.body.type === "event_callback" && req.body.event?.type === "message") {
        const event = req.body.event;

        // Skip bot messages and message edits/deletes
        if (event.bot_id || event.subtype) {
          return res.status(200).send("OK");
        }

        // Check if message is from the configured channel
        if (settings.checkInChannelId && event.channel !== settings.checkInChannelId) {
          return res.status(200).send("OK");
        }

        // Check if we've already processed this message
        const existingLog = await storage.getSlackAttendanceLogByMessageTs(event.ts);
        if (existingLog) {
          return res.status(200).send("OK");
        }

        // Find team member by Slack user ID
        const teamMember = await storage.getTeamMemberBySlackUserId(event.user);
        if (!teamMember) {
          console.log(`No team member found for Slack user ${event.user}`);
          return res.status(200).send("OK");
        }

        // Parse message for check-in/check-out keywords
        const { eventType, keyword } = slackService.parseMessage(
          event.text,
          settings.checkInKeywords,
          settings.checkOutKeywords
        );

        if (!eventType || !keyword) {
          return res.status(200).send("OK");
        }

        const now = new Date();
        const today = slackService.getTodayDate();
        const currentTime = slackService.getCurrentTime();

        // Get or create today's attendance record
        const existingAttendance = await storage.getAttendance({
          teamMemberId: teamMember.id,
          fromDate: today.toISOString().split("T")[0],
          toDate: today.toISOString().split("T")[0],
        });

        let attendanceId: string | null = null;

        if (eventType === "CHECK_IN") {
          if (existingAttendance.length === 0) {
            // Create new attendance record
            const newAttendance = await storage.createAttendance({
              teamMemberId: teamMember.id,
              date: today.toISOString(),
              checkIn: currentTime,
              checkOut: null,
              status: "PRESENT",
              workingHours: 0,
              overtimeHours: 0,
              notes: `Checked in via Slack: "${event.text.substring(0, 100)}"`,
            });
            attendanceId = newAttendance.id;
          } else {
            // Already checked in today
            attendanceId = existingAttendance[0].id;
          }
        } else if (eventType === "CHECK_OUT") {
          if (existingAttendance.length > 0 && existingAttendance[0].checkIn) {
            // Update existing attendance with check-out time
            const checkIn = existingAttendance[0].checkIn;
            const { workingHours, overtimeHours } = slackService.calculateWorkingHours(checkIn, currentTime);

            await storage.updateAttendance(existingAttendance[0].id, {
              checkOut: currentTime,
              workingHours,
              overtimeHours,
              notes: existingAttendance[0].notes + ` | Checked out via Slack: "${event.text.substring(0, 100)}"`,
            });
            attendanceId = existingAttendance[0].id;
          }
        }

        // Log the Slack attendance event
        await storage.createSlackAttendanceLog({
          teamMemberId: teamMember.id,
          slackUserId: event.user,
          slackMessageTs: event.ts,
          channelId: event.channel,
          messageText: event.text.substring(0, 500),
          eventType,
          detectedKeyword: keyword,
          timestamp: new Date(parseFloat(event.ts) * 1000).toISOString(),
          attendanceId,
        });

        // Add a reaction to acknowledge the attendance was logged
        const reaction = eventType === "CHECK_IN" ? "white_check_mark" : "wave";
        await slackService.addReaction(settings.botToken, event.channel, event.ts, reaction);
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Slack webhook error:", error);
      res.status(200).send("OK"); // Always return 200 to Slack
    }
  });

  // Get Slack settings
  app.get("/api/slack/settings", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getSlackSettings();
      if (settings) {
        // Mask the bot token and signing secret for security
        res.json({
          ...settings,
          botToken: settings.botToken ? "xoxb-****" : "",
          signingSecret: settings.signingSecret ? "****" : "",
        });
      } else {
        res.json(null);
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get Slack settings (full, for internal use)
  app.get("/api/slack/settings/full", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getSlackSettings();
      res.json(settings || null);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Save/Update Slack settings
  app.post("/api/slack/settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSlackSettingsSchema.parse(req.body);

      // Test connection first
      const connectionTest = await slackService.testConnection(validatedData.botToken);
      if (!connectionTest.ok) {
        return res.status(400).json({ error: `Failed to connect to Slack: ${connectionTest.error}` });
      }

      // Save settings with team info
      const settings = await storage.saveSlackSettings({
        ...validatedData,
        teamId: connectionTest.teamId || "",
        teamName: connectionTest.teamName || "",
      });

      // Initialize the slack service with new settings
      slackService.setSettings(settings);

      res.json(settings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update Slack settings
  app.put("/api/slack/settings/:id", authenticateToken, async (req, res) => {
    try {
      const existingSettings = await storage.getSlackSettings();
      if (!existingSettings) {
        return res.status(404).json({ error: "Slack settings not found" });
      }

      const validatedData = insertSlackSettingsSchema.partial().parse(req.body);

      // If bot token is being updated, test connection
      if (validatedData.botToken && validatedData.botToken !== existingSettings.botToken) {
        const connectionTest = await slackService.testConnection(validatedData.botToken);
        if (!connectionTest.ok) {
          return res.status(400).json({ error: `Failed to connect to Slack: ${connectionTest.error}` });
        }
        validatedData.teamId = connectionTest.teamId || "";
        validatedData.teamName = connectionTest.teamName || "";
      }

      const settings = await storage.updateSlackSettings(req.params.id, validatedData);
      slackService.setSettings(settings);
      res.json(settings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Delete Slack settings
  app.delete("/api/slack/settings", authenticateToken, async (req, res) => {
    try {
      await storage.deleteSlackSettings();
      slackService.setSettings(null as any);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Test Slack connection
  app.post("/api/slack/test-connection", authenticateToken, async (req, res) => {
    try {
      const { botToken } = req.body;
      if (!botToken) {
        return res.status(400).json({ error: "Bot token is required" });
      }

      const result = await slackService.testConnection(botToken);
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get Slack channels
  app.get("/api/slack/channels", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getSlackSettings();
      if (!settings?.botToken) {
        return res.status(400).json({ error: "Slack is not configured" });
      }

      const channels = await slackService.fetchSlackChannels(settings.botToken);
      res.json(channels);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get Slack users
  app.get("/api/slack/users", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getSlackSettings();
      if (!settings?.botToken) {
        return res.status(400).json({ error: "Slack is not configured" });
      }

      const users = await slackService.fetchSlackUsers(settings.botToken);
      res.json(users);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get Slack attendance logs
  app.get("/api/slack/attendance-logs", authenticateToken, async (req, res) => {
    try {
      const { teamMemberId, fromDate, toDate, eventType } = req.query;
      const logs = await storage.getSlackAttendanceLogs({
        teamMemberId: teamMemberId as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
        eventType: eventType as string,
      });
      res.json(logs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Initialize Slack settings on server start
  (async () => {
    try {
      const settings = await storage.getSlackSettings();
      if (settings) {
        slackService.setSettings(settings);
        console.log("Slack integration initialized for workspace:", settings.teamName);
      }
    } catch (error) {
      console.error("Failed to initialize Slack settings:", error);
    }
  })();

  // Initialize Email service (Resend) from database on server start
  (async () => {
    try {
      const apiSettings = await storage.getApiSettings();
      if (apiSettings?.resendApiKey) {
        initializeResend(apiSettings.resendApiKey);
        console.log("Email service (Resend) initialized from database");
      } else if (process.env.RESEND_API_KEY) {
        console.log("Email service (Resend) initialized from environment");
      } else {
        console.log("Email service (Resend) not configured - add API key in Settings");
      }
    } catch (error) {
      console.error("Failed to initialize email service:", error);
    }
  })();

  const httpServer = createServer(app);
  return httpServer;
}
