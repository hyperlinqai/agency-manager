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
  // FINANCIAL REPORTS ROUTES
  // ============================================

  // Helper function to get date range based on period
  const getDateRange = (period: string): { fromDate: Date; toDate: Date } => {
    const now = new Date();
    const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let fromDate: Date;

    switch (period) {
      case "this-month":
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last-month":
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        toDate.setDate(0); // Last day of previous month
        break;
      case "this-quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        fromDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case "last-quarter":
        const lastQuarterStart = Math.floor(now.getMonth() / 3) * 3 - 3;
        fromDate = new Date(now.getFullYear(), lastQuarterStart, 1);
        toDate.setMonth(lastQuarterStart + 3);
        toDate.setDate(0);
        break;
      case "this-year":
        fromDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last-year":
        fromDate = new Date(now.getFullYear() - 1, 0, 1);
        toDate.setFullYear(now.getFullYear() - 1, 11, 31);
        break;
      case "all-time":
      default:
        fromDate = new Date(2000, 0, 1); // Far past date
        break;
    }

    return { fromDate, toDate };
  };

  // Helper function to calculate percentage change
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  // Helper function to determine trend
  const getTrend = (change: number): 'up' | 'down' | 'neutral' => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };

  // Helper function to get comparison date ranges
  const getComparisonRanges = (basePeriod: string) => {
    const now = new Date();
    const current = getDateRange(basePeriod);

    // Previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Same month last year
    const sameMonthLastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const sameMonthLastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0, 23, 59, 59);

    // Previous quarter
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const prevQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    const prevQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59);

    return {
      current,
      previousMonth: { fromDate: prevMonthStart, toDate: prevMonthEnd },
      sameMonthLastYear: { fromDate: sameMonthLastYearStart, toDate: sameMonthLastYearEnd },
      previousQuarter: { fromDate: prevQuarterStart, toDate: prevQuarterEnd }
    };
  };

  // Helper to calculate revenue for a date range
  const calculateRevenueForRange = (
    invoices: any[],
    fromDate: Date,
    toDate: Date
  ): number => {
    return invoices
      .filter(inv => {
        const issueDate = new Date(inv.issueDate);
        return issueDate >= fromDate && issueDate <= toDate;
      })
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  };

  // Helper to calculate expenses for a date range
  const calculateExpensesForRange = (
    expenses: any[],
    fromDate: Date,
    toDate: Date
  ): number => {
    return expenses
      .filter(exp => {
        const expenseDate = new Date(exp.expenseDate);
        return expenseDate >= fromDate && expenseDate <= toDate;
      })
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  };

  // Revenue by Client Report
  app.get("/api/reports/revenue-by-client", authenticateToken, async (req, res) => {
    try {
      const { period = "all-time" } = req.query;
      const { fromDate, toDate } = getDateRange(period as string);

      const clients = await storage.getClients({});
      const invoices = await storage.getInvoices({});

      const revenueByClient = clients.map((client) => {
        const clientInvoices = invoices.filter(
          (inv) =>
            inv.clientId === client.id &&
            new Date(inv.issueDate) >= fromDate &&
            new Date(inv.issueDate) <= toDate
        );

        const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const totalPaid = clientInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        return {
          clientId: client.id,
          clientName: client.name,
          totalInvoiced,
          totalPaid,
          totalOutstanding: totalInvoiced - totalPaid,
          invoiceCount: clientInvoices.length,
        };
      });

      // Sort by total invoiced descending and filter out clients with no invoices
      const sortedRevenue = revenueByClient
        .filter((c) => c.invoiceCount > 0)
        .sort((a, b) => b.totalInvoiced - a.totalInvoiced);

      res.json(sortedRevenue);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Invoice Aging Report
  app.get("/api/reports/invoice-aging", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoices({});
      const clients = await storage.getClients({});
      const today = new Date();

      // Filter unpaid invoices
      const unpaidInvoices = invoices.filter(
        (inv) => inv.status !== "PAID" && (inv.balanceDue || 0) > 0
      );

      // Create aging buckets
      const buckets = [
        { range: "Current (Not Due)", min: -Infinity, max: 0, invoices: [] as any[] },
        { range: "1-30 Days", min: 1, max: 30, invoices: [] as any[] },
        { range: "31-60 Days", min: 31, max: 60, invoices: [] as any[] },
        { range: "61-90 Days", min: 61, max: 90, invoices: [] as any[] },
        { range: "90+ Days", min: 91, max: Infinity, invoices: [] as any[] },
      ];

      unpaidInvoices.forEach((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const client = clients.find((c) => c.id === invoice.clientId);

        const invoiceData = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client?.name || "Unknown",
          amount: invoice.balanceDue || 0,
          dueDate: invoice.dueDate,
          daysOverdue: Math.max(0, daysOverdue),
        };

        for (const bucket of buckets) {
          if (daysOverdue >= bucket.min && daysOverdue <= bucket.max) {
            bucket.invoices.push(invoiceData);
            break;
          }
        }
      });

      const result = buckets.map((bucket) => ({
        range: bucket.range,
        count: bucket.invoices.length,
        amount: bucket.invoices.reduce((sum, inv) => sum + inv.amount, 0),
        invoices: bucket.invoices.sort((a, b) => b.daysOverdue - a.daysOverdue),
      }));

      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Expenses by Category Report
  app.get("/api/reports/expenses-by-category", authenticateToken, async (req, res) => {
    try {
      const { period = "all-time" } = req.query;
      const { fromDate, toDate } = getDateRange(period as string);

      const expenses = await storage.getExpenses({});
      const categories = await storage.getExpenseCategories();

      // Filter expenses by date
      const filteredExpenses = expenses.filter(
        (exp) =>
          new Date(exp.expenseDate) >= fromDate && new Date(exp.expenseDate) <= toDate
      );

      const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

      const expensesByCategory = categories.map((category) => {
        const categoryExpenses = filteredExpenses.filter((exp) => exp.categoryId === category.id);
        const totalAmount = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        return {
          categoryId: category.id,
          categoryName: category.name,
          totalAmount,
          count: categoryExpenses.length,
          percentage: totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0,
        };
      });

      // Sort by total amount descending and filter out empty categories
      const sortedExpenses = expensesByCategory
        .filter((c) => c.count > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount);

      res.json(sortedExpenses);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Profit by Client Report
  app.get("/api/reports/profit-by-client", authenticateToken, async (req, res) => {
    try {
      const { period = "all-time" } = req.query;
      const { fromDate, toDate } = getDateRange(period as string);

      const clients = await storage.getClients({});
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});

      const profitByClient = clients.map((client) => {
        // Get client revenue (paid invoices)
        const clientInvoices = invoices.filter(
          (inv) =>
            inv.clientId === client.id &&
            new Date(inv.issueDate) >= fromDate &&
            new Date(inv.issueDate) <= toDate
        );
        const revenue = clientInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        // Get client-related expenses (if linked via notes or any client field)
        // For now, we'll distribute expenses proportionally based on revenue
        const totalRevenue = invoices
          .filter((inv) => new Date(inv.issueDate) >= fromDate && new Date(inv.issueDate) <= toDate)
          .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        const totalExpenses = expenses
          .filter((exp) => new Date(exp.expenseDate) >= fromDate && new Date(exp.expenseDate) <= toDate)
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const clientExpenses = totalRevenue > 0 ? (revenue / totalRevenue) * totalExpenses : 0;
        const profit = revenue - clientExpenses;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          clientId: client.id,
          clientName: client.name,
          revenue,
          expenses: clientExpenses,
          profit,
          margin,
        };
      });

      // Sort by profit descending and filter out clients with no revenue
      const sortedProfit = profitByClient
        .filter((c) => c.revenue > 0)
        .sort((a, b) => b.profit - a.profit);

      res.json(sortedProfit);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Profit & Loss Statement
  app.get("/api/reports/profit-loss", authenticateToken, async (req, res) => {
    try {
      const { period = "this-month" } = req.query;
      const { fromDate, toDate } = getDateRange(period as string);

      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      // Filter by date range
      const periodInvoices = invoices.filter(
        (inv) => new Date(inv.issueDate) >= fromDate && new Date(inv.issueDate) <= toDate
      );
      const periodExpenses = expenses.filter(
        (exp) => new Date(exp.expenseDate) >= fromDate && new Date(exp.expenseDate) <= toDate
      );
      const periodSalaries = salaries.filter(
        (sal) => sal.paymentDate && new Date(sal.paymentDate) >= fromDate && new Date(sal.paymentDate) <= toDate
      );

      // Calculate revenue
      const totalInvoiced = periodInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const totalCollected = periodInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

      // Calculate expenses
      const operationalExpenses = periodExpenses
        .filter((exp) => exp.status === "PAID")
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      const salaryExpenses = periodSalaries
        .filter((sal) => sal.status === "PAID")
        .reduce((sum, sal) => sum + (sal.amount || 0), 0);

      const vendorExpenses = periodExpenses
        .filter((exp) => exp.vendorId && exp.status === "PAID")
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      const otherExpenses = 0; // Can be expanded

      const totalExpenses = operationalExpenses + salaryExpenses;
      const grossProfit = totalInvoiced - operationalExpenses;
      const netProfit = totalCollected - totalExpenses;
      const margin = totalCollected > 0 ? (netProfit / totalCollected) * 100 : 0;

      res.json({
        period: period as string,
        revenue: {
          invoiced: totalInvoiced,
          collected: totalCollected,
        },
        expenses: {
          operational: operationalExpenses - vendorExpenses - salaryExpenses,
          salaries: salaryExpenses,
          vendors: vendorExpenses,
          other: otherExpenses,
          total: totalExpenses,
        },
        grossProfit,
        netProfit,
        margin,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Balance Sheet
  app.get("/api/reports/balance-sheet", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      // Assets
      const accountsReceivable = invoices
        .filter((inv) => inv.status !== "PAID")
        .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

      const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const totalExpensesPaid = expenses
        .filter((exp) => exp.status === "PAID")
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalSalariesPaid = salaries
        .filter((sal) => sal.status === "PAID")
        .reduce((sum, sal) => sum + (sal.amount || 0), 0);

      const cashOnHand = totalCollected - totalExpensesPaid - totalSalariesPaid;

      // Liabilities
      const accountsPayable = expenses
        .filter((exp) => exp.status !== "PAID" && exp.status !== "CANCELLED")
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      const pendingSalaries = salaries
        .filter((sal) => sal.status === "PENDING")
        .reduce((sum, sal) => sum + (sal.amount || 0), 0);

      const totalCurrentAssets = cashOnHand + accountsReceivable;
      const totalCurrentLiabilities = accountsPayable + pendingSalaries;
      const retainedEarnings = totalCurrentAssets - totalCurrentLiabilities;

      res.json({
        assets: {
          current: {
            cash: Math.max(0, cashOnHand),
            accountsReceivable,
            total: totalCurrentAssets,
          },
          total: totalCurrentAssets,
        },
        liabilities: {
          current: {
            accountsPayable,
            pendingSalaries,
            total: totalCurrentLiabilities,
          },
          total: totalCurrentLiabilities,
        },
        equity: {
          retainedEarnings: Math.max(0, retainedEarnings),
          total: Math.max(0, retainedEarnings),
        },
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Cash Flow Statement
  app.get("/api/reports/cash-flow", authenticateToken, async (req, res) => {
    try {
      const { period = "this-year" } = req.query;

      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      // Get all payments from invoices
      const payments: { date: Date; amount: number; type: "inflow" | "outflow" }[] = [];

      // Get payments from invoices (simplified - using amountPaid as proxy)
      invoices.forEach((inv) => {
        if (inv.amountPaid && inv.amountPaid > 0) {
          payments.push({
            date: new Date(inv.issueDate),
            amount: inv.amountPaid,
            type: "inflow",
          });
        }
      });

      // Get expense payments
      expenses
        .filter((exp) => exp.status === "PAID" && exp.paidDate)
        .forEach((exp) => {
          payments.push({
            date: new Date(exp.paidDate!),
            amount: exp.amount || 0,
            type: "outflow",
          });
        });

      // Get salary payments
      salaries
        .filter((sal) => sal.status === "PAID" && sal.paymentDate)
        .forEach((sal) => {
          payments.push({
            date: new Date(sal.paymentDate!),
            amount: sal.amount || 0,
            type: "outflow",
          });
        });

      // Group by month
      const monthlyData: Map<string, { inflows: number; outflows: number }> = new Map();

      payments.forEach((payment) => {
        const monthKey = `${payment.date.getFullYear()}-${String(payment.date.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthlyData.get(monthKey) || { inflows: 0, outflows: 0 };

        if (payment.type === "inflow") {
          existing.inflows += payment.amount;
        } else {
          existing.outflows += payment.amount;
        }

        monthlyData.set(monthKey, existing);
      });

      // Sort by date and calculate running balance
      const sortedMonths = Array.from(monthlyData.keys()).sort();
      let runningBalance = 0;

      const cashFlowData = sortedMonths.slice(-12).map((month) => {
        const data = monthlyData.get(month)!;
        const openingBalance = runningBalance;
        const netCashFlow = data.inflows - data.outflows;
        runningBalance += netCashFlow;

        return {
          period: month,
          inflows: {
            collections: data.inflows,
            total: data.inflows,
          },
          outflows: {
            expenses: data.outflows * 0.6, // Approximate split
            salaries: data.outflows * 0.3,
            vendors: data.outflows * 0.1,
            total: data.outflows,
          },
          netCashFlow,
          openingBalance,
          closingBalance: runningBalance,
        };
      });

      res.json(cashFlowData);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // General Ledger Report
  app.get("/api/reports/general-ledger", authenticateToken, async (req, res) => {
    try {
      const { period = "this-month" } = req.query;

      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});
      const clients = await storage.getClients({});
      const vendors = await storage.getVendors({});

      // Create client and vendor lookup maps
      const clientMap = new Map(clients.map((c) => [c.id, c.name]));
      const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

      // Build ledger entries
      const ledgerEntries: Array<{
        date: string;
        voucherNo: string;
        particulars: string;
        accountHead: string;
        debit: number;
        credit: number;
        balance: number;
        type: string;
      }> = [];

      // Add invoice entries (Revenue - Credit)
      invoices.forEach((inv) => {
        const clientName = clientMap.get(inv.clientId) || "Unknown Client";
        ledgerEntries.push({
          date: new Date(inv.issueDate).toISOString().split("T")[0],
          voucherNo: inv.invoiceNumber,
          particulars: `Invoice to ${clientName}`,
          accountHead: "Sales Revenue",
          debit: 0,
          credit: inv.totalAmount || 0,
          balance: 0,
          type: "INVOICE",
        });

        // Add receivable entry (Debit)
        ledgerEntries.push({
          date: new Date(inv.issueDate).toISOString().split("T")[0],
          voucherNo: inv.invoiceNumber,
          particulars: `Receivable from ${clientName}`,
          accountHead: "Accounts Receivable",
          debit: inv.totalAmount || 0,
          credit: 0,
          balance: 0,
          type: "RECEIVABLE",
        });

        // Add payment received entry if any amount paid
        if (inv.amountPaid && inv.amountPaid > 0) {
          ledgerEntries.push({
            date: new Date(inv.issueDate).toISOString().split("T")[0],
            voucherNo: `PMT-${inv.invoiceNumber}`,
            particulars: `Payment received from ${clientName}`,
            accountHead: "Cash/Bank",
            debit: inv.amountPaid,
            credit: 0,
            balance: 0,
            type: "PAYMENT_RECEIVED",
          });
        }
      });

      // Add expense entries (Expense - Debit)
      expenses.forEach((exp, index) => {
        const vendorName = exp.vendorId ? vendorMap.get(exp.vendorId) || "Unknown Vendor" : "General";
        ledgerEntries.push({
          date: new Date(exp.expenseDate).toISOString().split("T")[0],
          voucherNo: `EXP-${String(index + 1).padStart(4, "0")}`,
          particulars: `${exp.description} - ${vendorName}`,
          accountHead: exp.category || "Operating Expenses",
          debit: exp.amount || 0,
          credit: 0,
          balance: 0,
          type: "EXPENSE",
        });

        // Add cash/bank credit entry for paid expenses
        if (exp.status === "PAID") {
          ledgerEntries.push({
            date: new Date(exp.paidDate || exp.expenseDate).toISOString().split("T")[0],
            voucherNo: `EXP-${String(index + 1).padStart(4, "0")}`,
            particulars: `Payment for ${exp.description}`,
            accountHead: "Cash/Bank",
            debit: 0,
            credit: exp.amount || 0,
            balance: 0,
            type: "PAYMENT_MADE",
          });
        }
      });

      // Add salary entries
      salaries.forEach((sal, index) => {
        ledgerEntries.push({
          date: new Date(sal.month + "-01").toISOString().split("T")[0],
          voucherNo: `SAL-${String(index + 1).padStart(4, "0")}`,
          particulars: `Salary - ${sal.month}`,
          accountHead: "Salary Expense",
          debit: sal.amount || 0,
          credit: 0,
          balance: 0,
          type: "SALARY",
        });

        if (sal.status === "PAID" && sal.paymentDate) {
          ledgerEntries.push({
            date: new Date(sal.paymentDate).toISOString().split("T")[0],
            voucherNo: `SAL-${String(index + 1).padStart(4, "0")}`,
            particulars: `Salary Payment - ${sal.month}`,
            accountHead: "Cash/Bank",
            debit: 0,
            credit: sal.amount || 0,
            balance: 0,
            type: "SALARY_PAID",
          });
        }
      });

      // Sort by date
      ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      ledgerEntries.forEach((entry) => {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
      });

      res.json(ledgerEntries);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Trial Balance Report
  app.get("/api/reports/trial-balance", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});
      const fixedAssets = await storage.getFixedAssets({});

      // Define account heads with their normal balances
      const accounts: Map<string, { debit: number; credit: number; type: string }> = new Map();

      // Helper to add to account
      const addToAccount = (name: string, debit: number, credit: number, type: string) => {
        const existing = accounts.get(name) || { debit: 0, credit: 0, type };
        existing.debit += debit;
        existing.credit += credit;
        accounts.set(name, existing);
      };

      // Assets
      // Cash/Bank - total payments received
      const totalCashReceived = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const totalCashPaid = expenses.filter((e) => e.status === "PAID").reduce((sum, e) => sum + (e.amount || 0), 0)
        + salaries.filter((s) => s.status === "PAID").reduce((sum, s) => sum + (s.amount || 0), 0);
      addToAccount("Cash & Bank", totalCashReceived, totalCashPaid, "ASSET");

      // Accounts Receivable
      const totalReceivable = invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.amountPaid || 0)), 0);
      if (totalReceivable > 0) {
        addToAccount("Accounts Receivable", totalReceivable, 0, "ASSET");
      }

      // Fixed Assets
      const totalFixedAssets = fixedAssets
        .filter((a) => a.status === "ACTIVE")
        .reduce((sum, a) => sum + (a.currentValue || a.purchaseValue || 0), 0);
      if (totalFixedAssets > 0) {
        addToAccount("Fixed Assets", totalFixedAssets, 0, "ASSET");
      }

      // Accumulated Depreciation
      const totalDepreciation = fixedAssets
        .filter((a) => a.status === "ACTIVE")
        .reduce((sum, a) => sum + ((a.purchaseValue || 0) - (a.currentValue || a.purchaseValue || 0)), 0);
      if (totalDepreciation > 0) {
        addToAccount("Accumulated Depreciation", 0, totalDepreciation, "CONTRA_ASSET");
      }

      // Liabilities
      // Accounts Payable (unpaid expenses)
      const totalPayable = expenses
        .filter((e) => e.status !== "PAID" && e.status !== "CANCELLED")
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      if (totalPayable > 0) {
        addToAccount("Accounts Payable", 0, totalPayable, "LIABILITY");
      }

      // Salary Payable
      const totalSalaryPayable = salaries
        .filter((s) => s.status !== "PAID")
        .reduce((sum, s) => sum + (s.amount || 0), 0);
      if (totalSalaryPayable > 0) {
        addToAccount("Salary Payable", 0, totalSalaryPayable, "LIABILITY");
      }

      // Revenue
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      addToAccount("Sales Revenue", 0, totalRevenue, "REVENUE");

      // Expenses by category
      const expenseByCategory = new Map<string, number>();
      expenses.forEach((exp) => {
        const cat = exp.category || "Operating Expenses";
        expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + (exp.amount || 0));
      });
      expenseByCategory.forEach((amount, category) => {
        addToAccount(category, amount, 0, "EXPENSE");
      });

      // Salary Expense
      const totalSalaryExpense = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (totalSalaryExpense > 0) {
        addToAccount("Salary Expense", totalSalaryExpense, 0, "EXPENSE");
      }

      // Convert to array and calculate totals
      const trialBalanceData = Array.from(accounts.entries()).map(([name, data]) => ({
        accountName: name,
        accountType: data.type,
        debit: data.debit > data.credit ? data.debit - data.credit : 0,
        credit: data.credit > data.debit ? data.credit - data.debit : 0,
      }));

      // Sort by account type order
      const typeOrder = ["ASSET", "CONTRA_ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
      trialBalanceData.sort((a, b) => typeOrder.indexOf(a.accountType) - typeOrder.indexOf(b.accountType));

      const totalDebit = trialBalanceData.reduce((sum, acc) => sum + acc.debit, 0);
      const totalCredit = trialBalanceData.reduce((sum, acc) => sum + acc.credit, 0);

      res.json({
        accounts: trialBalanceData,
        totals: {
          debit: totalDebit,
          credit: totalCredit,
          isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        },
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Fixed Asset Register Report
  app.get("/api/reports/fixed-asset-register", authenticateToken, async (req, res) => {
    try {
      const assets = await storage.getFixedAssets({});

      // Calculate depreciation for each asset
      const assetRegister = assets.map((asset) => {
        const purchaseDate = new Date(asset.purchaseDate);
        const today = new Date();
        const yearsOwned = (today.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

        let accumulatedDepreciation = 0;
        let currentValue = asset.purchaseValue;

        if (asset.depreciationMethod === "STRAIGHT_LINE") {
          // Straight line: (Cost - Salvage) / Useful Life * Years
          const annualDepreciation = (asset.purchaseValue - asset.salvageValue) / asset.usefulLifeYears;
          accumulatedDepreciation = Math.min(
            annualDepreciation * yearsOwned,
            asset.purchaseValue - asset.salvageValue
          );
          currentValue = Math.max(asset.purchaseValue - accumulatedDepreciation, asset.salvageValue);
        } else if (asset.depreciationMethod === "WRITTEN_DOWN") {
          // Written Down Value: Purchase * (1 - rate)^years
          currentValue = asset.purchaseValue * Math.pow(1 - asset.depreciationRate / 100, yearsOwned);
          currentValue = Math.max(currentValue, asset.salvageValue);
          accumulatedDepreciation = asset.purchaseValue - currentValue;
        }

        return {
          id: asset.id,
          name: asset.name,
          description: asset.description,
          category: asset.category,
          purchaseDate: asset.purchaseDate,
          purchaseValue: asset.purchaseValue,
          depreciationMethod: asset.depreciationMethod,
          depreciationRate: asset.depreciationRate,
          usefulLifeYears: asset.usefulLifeYears,
          salvageValue: asset.salvageValue,
          accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
          currentValue: Math.round(currentValue * 100) / 100,
          yearsOwned: Math.round(yearsOwned * 10) / 10,
          location: asset.location,
          status: asset.status,
          vendor: asset.vendor,
          invoiceNumber: asset.invoiceNumber,
        };
      });

      // Summary by category
      const categoryWise = assetRegister.reduce((acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = { count: 0, purchaseValue: 0, currentValue: 0, depreciation: 0 };
        }
        acc[asset.category].count++;
        acc[asset.category].purchaseValue += asset.purchaseValue;
        acc[asset.category].currentValue += asset.currentValue;
        acc[asset.category].depreciation += asset.accumulatedDepreciation;
        return acc;
      }, {} as Record<string, { count: number; purchaseValue: number; currentValue: number; depreciation: number }>);

      res.json({
        assets: assetRegister,
        summary: {
          totalAssets: assetRegister.length,
          activeAssets: assetRegister.filter((a) => a.status === "ACTIVE").length,
          totalPurchaseValue: assetRegister.reduce((sum, a) => sum + a.purchaseValue, 0),
          totalCurrentValue: assetRegister.reduce((sum, a) => sum + a.currentValue, 0),
          totalDepreciation: assetRegister.reduce((sum, a) => sum + a.accumulatedDepreciation, 0),
          categoryWise: Object.entries(categoryWise).map(([category, data]) => ({
            category,
            ...data,
          })),
        },
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // GST COMPLIANCE REPORTS
  // ============================================

  // GSTR-1 Sales Register - Outward Supplies
  app.get("/api/reports/gst/sales-register", authenticateToken, async (req, res) => {
    try {
      const { period = "this-month" } = req.query;
      const invoices = await storage.getInvoices({});
      const clients = await storage.getClients({});

      const clientMap = new Map(clients.map((c) => [c.id, c]));

      // Build sales register entries
      const salesRegister = invoices.map((inv) => {
        const client = clientMap.get(inv.clientId);
        const taxableAmount = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gstAmount = (inv.totalAmount || 0) - taxableAmount;
        const isInterState = false; // Simplified - would check state codes

        return {
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.issueDate,
          clientName: client?.name || "Unknown",
          gstin: client?.gstNumber || "Unregistered",
          placeOfSupply: client?.address?.split(",").pop()?.trim() || "Local",
          invoiceType: client?.gstNumber ? "B2B" : "B2C",
          taxableValue: Math.round(taxableAmount * 100) / 100,
          cgst: isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100,
          sgst: isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100,
          igst: isInterState ? Math.round(gstAmount * 100) / 100 : 0,
          totalGst: Math.round(gstAmount * 100) / 100,
          invoiceValue: inv.totalAmount || 0,
          status: inv.status,
        };
      });

      // Summary totals
      const summary = {
        totalInvoices: salesRegister.length,
        b2bInvoices: salesRegister.filter((s) => s.invoiceType === "B2B").length,
        b2cInvoices: salesRegister.filter((s) => s.invoiceType === "B2C").length,
        totalTaxableValue: salesRegister.reduce((sum, s) => sum + s.taxableValue, 0),
        totalCgst: salesRegister.reduce((sum, s) => sum + s.cgst, 0),
        totalSgst: salesRegister.reduce((sum, s) => sum + s.sgst, 0),
        totalIgst: salesRegister.reduce((sum, s) => sum + s.igst, 0),
        totalGst: salesRegister.reduce((sum, s) => sum + s.totalGst, 0),
        totalInvoiceValue: salesRegister.reduce((sum, s) => sum + s.invoiceValue, 0),
      };

      res.json({ entries: salesRegister, summary });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GST Purchase Register - Input Tax Credit
  app.get("/api/reports/gst/purchase-register", authenticateToken, async (req, res) => {
    try {
      const { period = "this-month" } = req.query;
      const expenses = await storage.getExpenses({});
      const vendors = await storage.getVendors({});

      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      // Build purchase register - only GST applicable expenses
      const purchaseRegister = expenses
        .filter((exp) => exp.amount && exp.amount > 0)
        .map((exp, index) => {
          const vendor = exp.vendorId ? vendorMap.get(exp.vendorId) : null;
          // Assume 18% GST on expenses (simplified)
          const totalAmount = exp.amount || 0;
          const taxableAmount = totalAmount / 1.18;
          const gstAmount = totalAmount - taxableAmount;
          const isInterState = false;

          return {
            voucherNumber: exp.reference || `EXP-${String(index + 1).padStart(4, "0")}`,
            voucherDate: exp.expenseDate,
            vendorName: vendor?.name || "General Expense",
            gstin: vendor?.gstNumber || "Unregistered",
            description: exp.description,
            category: exp.category || "General",
            taxableValue: Math.round(taxableAmount * 100) / 100,
            cgst: isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100,
            sgst: isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100,
            igst: isInterState ? Math.round(gstAmount * 100) / 100 : 0,
            totalGst: Math.round(gstAmount * 100) / 100,
            totalValue: totalAmount,
            itcEligible: vendor?.gstNumber ? true : false,
            status: exp.status,
          };
        });

      // Summary
      const eligibleEntries = purchaseRegister.filter((p) => p.itcEligible);
      const summary = {
        totalEntries: purchaseRegister.length,
        eligibleForItc: eligibleEntries.length,
        notEligibleForItc: purchaseRegister.length - eligibleEntries.length,
        totalTaxableValue: purchaseRegister.reduce((sum, p) => sum + p.taxableValue, 0),
        totalCgst: purchaseRegister.reduce((sum, p) => sum + p.cgst, 0),
        totalSgst: purchaseRegister.reduce((sum, p) => sum + p.sgst, 0),
        totalIgst: purchaseRegister.reduce((sum, p) => sum + p.igst, 0),
        totalGst: purchaseRegister.reduce((sum, p) => sum + p.totalGst, 0),
        eligibleItc: eligibleEntries.reduce((sum, p) => sum + p.totalGst, 0),
        totalPurchaseValue: purchaseRegister.reduce((sum, p) => sum + p.totalValue, 0),
      };

      res.json({ entries: purchaseRegister, summary });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GSTR-3B Summary - Monthly Return Summary
  app.get("/api/reports/gst/gstr3b-summary", authenticateToken, async (req, res) => {
    try {
      const { period = "this-month" } = req.query;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const vendors = await storage.getVendors({});

      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      // Calculate Output Tax (from sales)
      let outputTaxable = 0;
      let outputCgst = 0;
      let outputSgst = 0;
      let outputIgst = 0;

      invoices.forEach((inv) => {
        const taxableAmount = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gstAmount = (inv.totalAmount || 0) - taxableAmount;
        outputTaxable += taxableAmount;
        outputCgst += gstAmount / 2;
        outputSgst += gstAmount / 2;
      });

      // Calculate Input Tax Credit (from purchases with GST vendors)
      let inputTaxable = 0;
      let inputCgst = 0;
      let inputSgst = 0;
      let inputIgst = 0;

      expenses.forEach((exp) => {
        const vendor = exp.vendorId ? vendorMap.get(exp.vendorId) : null;
        if (vendor?.gstNumber) {
          const totalAmount = exp.amount || 0;
          const taxableAmount = totalAmount / 1.18;
          const gstAmount = totalAmount - taxableAmount;
          inputTaxable += taxableAmount;
          inputCgst += gstAmount / 2;
          inputSgst += gstAmount / 2;
        }
      });

      // Calculate Net Tax Payable
      const netCgst = Math.max(0, outputCgst - inputCgst);
      const netSgst = Math.max(0, outputSgst - inputSgst);
      const netIgst = Math.max(0, outputIgst - inputIgst);
      const totalNetTax = netCgst + netSgst + netIgst;

      // ITC utilization
      const cgstCredit = Math.min(outputCgst, inputCgst);
      const sgstCredit = Math.min(outputSgst, inputSgst);
      const igstCredit = Math.min(outputIgst, inputIgst);

      res.json({
        outwardSupplies: {
          taxableValue: Math.round(outputTaxable * 100) / 100,
          cgst: Math.round(outputCgst * 100) / 100,
          sgst: Math.round(outputSgst * 100) / 100,
          igst: Math.round(outputIgst * 100) / 100,
          totalTax: Math.round((outputCgst + outputSgst + outputIgst) * 100) / 100,
        },
        inputTaxCredit: {
          taxableValue: Math.round(inputTaxable * 100) / 100,
          cgst: Math.round(inputCgst * 100) / 100,
          sgst: Math.round(inputSgst * 100) / 100,
          igst: Math.round(inputIgst * 100) / 100,
          totalItc: Math.round((inputCgst + inputSgst + inputIgst) * 100) / 100,
        },
        itcUtilization: {
          cgst: Math.round(cgstCredit * 100) / 100,
          sgst: Math.round(sgstCredit * 100) / 100,
          igst: Math.round(igstCredit * 100) / 100,
          total: Math.round((cgstCredit + sgstCredit + igstCredit) * 100) / 100,
        },
        netTaxPayable: {
          cgst: Math.round(netCgst * 100) / 100,
          sgst: Math.round(netSgst * 100) / 100,
          igst: Math.round(netIgst * 100) / 100,
          total: Math.round(totalNetTax * 100) / 100,
        },
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // HSN/SAC Summary Report
  app.get("/api/reports/gst/hsn-summary", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoices({});

      // For services, common SAC codes:
      // 998311 - Management consulting
      // 998312 - Business consulting
      // 998313 - Advertising services
      // 998314 - Market research
      // 998361 - IT consulting
      // 998399 - Other professional services

      // Group by assumed SAC code (simplified - in real app would be per line item)
      const hsnSummary: Record<string, {
        hsnCode: string;
        description: string;
        quantity: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
      }> = {};

      // Default SAC for marketing agency
      const defaultSac = "998313";
      const sacDescriptions: Record<string, string> = {
        "998311": "Management Consulting Services",
        "998312": "Business Consulting Services",
        "998313": "Advertising Services",
        "998314": "Market Research Services",
        "998361": "IT Consulting Services",
        "998399": "Other Professional Services",
      };

      invoices.forEach((inv) => {
        const sacCode = defaultSac;
        const taxableAmount = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gstAmount = (inv.totalAmount || 0) - taxableAmount;

        if (!hsnSummary[sacCode]) {
          hsnSummary[sacCode] = {
            hsnCode: sacCode,
            description: sacDescriptions[sacCode] || "Professional Services",
            quantity: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
          };
        }

        hsnSummary[sacCode].quantity += 1;
        hsnSummary[sacCode].taxableValue += taxableAmount;
        hsnSummary[sacCode].cgst += gstAmount / 2;
        hsnSummary[sacCode].sgst += gstAmount / 2;
        hsnSummary[sacCode].totalTax += gstAmount;
      });

      const entries = Object.values(hsnSummary).map((entry) => ({
        ...entry,
        taxableValue: Math.round(entry.taxableValue * 100) / 100,
        cgst: Math.round(entry.cgst * 100) / 100,
        sgst: Math.round(entry.sgst * 100) / 100,
        igst: Math.round(entry.igst * 100) / 100,
        totalTax: Math.round(entry.totalTax * 100) / 100,
      }));

      const totals = {
        totalQuantity: entries.reduce((sum, e) => sum + e.quantity, 0),
        totalTaxableValue: entries.reduce((sum, e) => sum + e.taxableValue, 0),
        totalCgst: entries.reduce((sum, e) => sum + e.cgst, 0),
        totalSgst: entries.reduce((sum, e) => sum + e.sgst, 0),
        totalIgst: entries.reduce((sum, e) => sum + e.igst, 0),
        totalTax: entries.reduce((sum, e) => sum + e.totalTax, 0),
      };

      res.json({ entries, totals });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GST Rate-wise Summary
  app.get("/api/reports/gst/rate-summary", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoices({});

      // GST rates in India: 0%, 5%, 12%, 18%, 28%
      // Most services are at 18%
      const rateSummary: Record<number, {
        rate: number;
        invoiceCount: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
        invoiceValue: number;
      }> = {};

      invoices.forEach((inv) => {
        const rate = 18; // Default GST rate for services
        const taxableAmount = inv.subtotal || (inv.totalAmount || 0) / (1 + rate / 100);
        const gstAmount = (inv.totalAmount || 0) - taxableAmount;

        if (!rateSummary[rate]) {
          rateSummary[rate] = {
            rate,
            invoiceCount: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
            invoiceValue: 0,
          };
        }

        rateSummary[rate].invoiceCount += 1;
        rateSummary[rate].taxableValue += taxableAmount;
        rateSummary[rate].cgst += gstAmount / 2;
        rateSummary[rate].sgst += gstAmount / 2;
        rateSummary[rate].totalTax += gstAmount;
        rateSummary[rate].invoiceValue += inv.totalAmount || 0;
      });

      const entries = Object.values(rateSummary)
        .map((entry) => ({
          ...entry,
          taxableValue: Math.round(entry.taxableValue * 100) / 100,
          cgst: Math.round(entry.cgst * 100) / 100,
          sgst: Math.round(entry.sgst * 100) / 100,
          igst: Math.round(entry.igst * 100) / 100,
          totalTax: Math.round(entry.totalTax * 100) / 100,
          invoiceValue: Math.round(entry.invoiceValue * 100) / 100,
        }))
        .sort((a, b) => a.rate - b.rate);

      res.json(entries);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // COMPARISON REPORTS ENDPOINT
  // ============================================

  // Comprehensive comparison report endpoint
  app.get("/api/reports/comparison", authenticateToken, async (req, res) => {
    try {
      const { period = "this-month" } = req.query;
      const ranges = getComparisonRanges(period as string);

      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});

      // Calculate metrics for each period
      const currentRevenue = calculateRevenueForRange(invoices, ranges.current.fromDate, ranges.current.toDate);
      const currentExpenses = calculateExpensesForRange(expenses, ranges.current.fromDate, ranges.current.toDate);
      const currentProfit = currentRevenue - currentExpenses;

      const prevMonthRevenue = calculateRevenueForRange(invoices, ranges.previousMonth.fromDate, ranges.previousMonth.toDate);
      const prevMonthExpenses = calculateExpensesForRange(expenses, ranges.previousMonth.fromDate, ranges.previousMonth.toDate);
      const prevMonthProfit = prevMonthRevenue - prevMonthExpenses;

      const lastYearRevenue = calculateRevenueForRange(invoices, ranges.sameMonthLastYear.fromDate, ranges.sameMonthLastYear.toDate);
      const lastYearExpenses = calculateExpensesForRange(expenses, ranges.sameMonthLastYear.fromDate, ranges.sameMonthLastYear.toDate);
      const lastYearProfit = lastYearRevenue - lastYearExpenses;

      const prevQuarterRevenue = calculateRevenueForRange(invoices, ranges.previousQuarter.fromDate, ranges.previousQuarter.toDate);
      const prevQuarterExpenses = calculateExpensesForRange(expenses, ranges.previousQuarter.fromDate, ranges.previousQuarter.toDate);
      const prevQuarterProfit = prevQuarterRevenue - prevQuarterExpenses;

      // Build comparison response
      const comparison = {
        current: {
          period: period,
          revenue: currentRevenue,
          expenses: currentExpenses,
          profit: currentProfit,
          margin: currentRevenue > 0 ? Number(((currentProfit / currentRevenue) * 100).toFixed(1)) : 0
        },
        mom: {
          label: "vs Last Month",
          revenue: {
            previous: prevMonthRevenue,
            change: calculateChange(currentRevenue, prevMonthRevenue),
            trend: getTrend(calculateChange(currentRevenue, prevMonthRevenue))
          },
          expenses: {
            previous: prevMonthExpenses,
            change: calculateChange(currentExpenses, prevMonthExpenses),
            trend: getTrend(calculateChange(currentExpenses, prevMonthExpenses))
          },
          profit: {
            previous: prevMonthProfit,
            change: calculateChange(currentProfit, prevMonthProfit),
            trend: getTrend(calculateChange(currentProfit, prevMonthProfit))
          }
        },
        yoy: {
          label: "vs Same Month Last Year",
          revenue: {
            previous: lastYearRevenue,
            change: calculateChange(currentRevenue, lastYearRevenue),
            trend: getTrend(calculateChange(currentRevenue, lastYearRevenue))
          },
          expenses: {
            previous: lastYearExpenses,
            change: calculateChange(currentExpenses, lastYearExpenses),
            trend: getTrend(calculateChange(currentExpenses, lastYearExpenses))
          },
          profit: {
            previous: lastYearProfit,
            change: calculateChange(currentProfit, lastYearProfit),
            trend: getTrend(calculateChange(currentProfit, lastYearProfit))
          }
        },
        qoq: {
          label: "vs Last Quarter",
          revenue: {
            previous: prevQuarterRevenue,
            change: calculateChange(currentRevenue, prevQuarterRevenue),
            trend: getTrend(calculateChange(currentRevenue, prevQuarterRevenue))
          },
          expenses: {
            previous: prevQuarterExpenses,
            change: calculateChange(currentExpenses, prevQuarterExpenses),
            trend: getTrend(calculateChange(currentExpenses, prevQuarterExpenses))
          },
          profit: {
            previous: prevQuarterProfit,
            change: calculateChange(currentProfit, prevQuarterProfit),
            trend: getTrend(calculateChange(currentProfit, prevQuarterProfit))
          }
        }
      };

      res.json(comparison);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Monthly trend data for charts (last 12 months)
  app.get("/api/reports/trends", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});

      const now = new Date();
      const trends = [];

      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const monthRevenue = calculateRevenueForRange(invoices, monthStart, monthEnd);
        const monthExpenses = calculateExpensesForRange(expenses, monthStart, monthEnd);

        trends.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses
        });
      }

      res.json(trends);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // REPORT EXPORT ENDPOINTS (PDF & Excel)
  // ============================================
  const { generateExcel, generatePDF, reportConfigs } = await import("./report-export");

  // Get company profile for reports
  const getCompanyInfo = async () => {
    const profile = await storage.getCompanyProfile();
    return profile?.companyName || "HQ CRM";
  };

  // Revenue by Client Export
  app.get("/api/reports/revenue-by-client/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const { period = "all-time" } = req.query;
      const { fromDate, toDate } = getDateRange(period as string);

      const clients = await storage.getClients({});
      const invoices = await storage.getInvoices({});

      // Use same logic as the UI endpoint
      const revenueByClient = clients.map((client) => {
        const clientInvoices = invoices.filter(
          (inv) =>
            inv.clientId === client.id &&
            new Date(inv.issueDate) >= fromDate &&
            new Date(inv.issueDate) <= toDate
        );

        const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

        return {
          clientName: client.name,
          totalRevenue: totalInvoiced,
          invoiceCount: clientInvoices.length,
        };
      });

      // Filter and sort like UI endpoint
      const exportData = revenueByClient
        .filter((c) => c.invoiceCount > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map(({ clientName, totalRevenue }) => ({ clientName, totalRevenue }));

      const companyName = await getCompanyInfo();
      const config = reportConfigs.revenueByClient;
      const periodLabel = period === "all-time" ? "All Time" : period;

      if (format === "excel") {
        await generateExcel(res, {
          ...config,
          data: exportData,
          companyName,
          dateRange: `Period: ${periodLabel} (${fromDate.toLocaleDateString("en-IN")} - ${toDate.toLocaleDateString("en-IN")})`,
          summary: [{ label: "Total Revenue", value: exportData.reduce((sum, r) => sum + r.totalRevenue, 0) }],
        });
      } else if (format === "pdf") {
        generatePDF(res, {
          ...config,
          data: exportData,
          companyName,
          dateRange: `Period: ${periodLabel} (${fromDate.toLocaleDateString("en-IN")} - ${toDate.toLocaleDateString("en-IN")})`,
          summary: [{ label: "Total Revenue", value: exportData.reduce((sum, r) => sum + r.totalRevenue, 0) }],
        });
      } else {
        res.status(400).json({ error: "Invalid format. Use 'excel' or 'pdf'" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Invoice Aging Export
  app.get("/api/reports/invoice-aging/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const clients = await storage.getClients({});
      const clientMap = new Map(clients.map((c) => [c.id, c.name]));

      const today = new Date();
      const exportData = invoices
        .filter((inv) => inv.status !== "PAID" && inv.dueDate)
        .map((inv) => {
          const dueDate = new Date(inv.dueDate!);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          let agingBucket = "Current";
          if (daysOverdue > 90) agingBucket = "90+ Days";
          else if (daysOverdue > 60) agingBucket = "61-90 Days";
          else if (daysOverdue > 30) agingBucket = "31-60 Days";
          else if (daysOverdue > 0) agingBucket = "1-30 Days";

          return {
            clientName: clientMap.get(inv.clientId) || "Unknown",
            invoiceNumber: inv.invoiceNumber,
            amount: (inv.totalAmount || 0) - (inv.amountPaid || 0),
            dueDate: new Date(inv.dueDate!).toLocaleDateString("en-IN"),
            daysOverdue: Math.max(0, daysOverdue),
            agingBucket,
          };
        });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.invoiceAging;

      if (format === "excel") {
        await generateExcel(res, {
          ...config,
          data: exportData,
          companyName,
          dateRange: `As of ${new Date().toLocaleDateString("en-IN")}`,
          summary: [{ label: "Total Outstanding", value: exportData.reduce((sum, r) => sum + r.amount, 0) }],
        });
      } else if (format === "pdf") {
        generatePDF(res, {
          ...config,
          data: exportData,
          companyName,
          dateRange: `As of ${new Date().toLocaleDateString("en-IN")}`,
          summary: [{ label: "Total Outstanding", value: exportData.reduce((sum, r) => sum + r.amount, 0) }],
          orientation: "landscape",
        });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Expenses by Category Export
  app.get("/api/reports/expenses-by-category/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const expenses = await storage.getExpenses({});

      const byCategory = expenses.reduce((acc, exp) => {
        const cat = exp.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = { amount: 0, count: 0 };
        acc[cat].amount += exp.amount || 0;
        acc[cat].count++;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

      const total = Object.values(byCategory).reduce((sum, v) => sum + v.amount, 0);
      const exportData = Object.entries(byCategory).map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: `${((data.amount / total) * 100).toFixed(1)}%`,
        count: data.count,
      }));

      const companyName = await getCompanyInfo();
      const config = reportConfigs.expensesByCategory;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Expenses", value: total }] });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Expenses", value: total }] });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Profit by Client Export
  app.get("/api/reports/profit-by-client/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const clients = await storage.getClients({});
      const clientMap = new Map(clients.map((c) => [c.id, c.name]));

      const revenueByClient = invoices.reduce((acc, inv) => {
        acc[inv.clientId] = (acc[inv.clientId] || 0) + (inv.amountPaid || 0);
        return acc;
      }, {} as Record<string, number>);

      const expensesByClient = expenses.reduce((acc, exp) => {
        if (exp.clientId) acc[exp.clientId] = (acc[exp.clientId] || 0) + (exp.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const exportData = clients.map((client) => {
        const revenue = revenueByClient[client.id] || 0;
        const clientExpenses = expensesByClient[client.id] || 0;
        const profit = revenue - clientExpenses;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + "%" : "0%";
        return { clientName: client.name, revenue, expenses: clientExpenses, profit, margin };
      });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.profitByClient;
      const totalProfit = exportData.reduce((sum, r) => sum + r.profit, 0);

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Profit", value: totalProfit }] });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Profit", value: totalProfit }] });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // P&L Statement Export
  app.get("/api/reports/profit-loss/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalSalaries = salaries.reduce((sum, sal) => sum + (sal.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses - totalSalaries;

      const exportData = [
        { particulars: "REVENUE", amount: "" },
        { particulars: "  Sales Revenue", amount: totalRevenue },
        { particulars: "  Total Revenue", amount: totalRevenue },
        { particulars: "", amount: "" },
        { particulars: "EXPENSES", amount: "" },
        { particulars: "  Operating Expenses", amount: totalExpenses },
        { particulars: "  Salary Expenses", amount: totalSalaries },
        { particulars: "  Total Expenses", amount: totalExpenses + totalSalaries },
        { particulars: "", amount: "" },
        { particulars: "NET PROFIT / (LOSS)", amount: netProfit },
      ];

      const companyName = await getCompanyInfo();
      const config = reportConfigs.profitLoss;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, dateRange: `For the period ending ${new Date().toLocaleDateString("en-IN")}` });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, dateRange: `For the period ending ${new Date().toLocaleDateString("en-IN")}` });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Balance Sheet Export
  app.get("/api/reports/balance-sheet/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      const cashReceived = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const cashPaid = expenses.filter((e) => e.status === "PAID").reduce((sum, e) => sum + (e.amount || 0), 0)
        + salaries.filter((s) => s.status === "PAID").reduce((sum, s) => sum + (s.amount || 0), 0);
      const receivables = invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.amountPaid || 0)), 0);
      const payables = expenses.filter((e) => e.status !== "PAID").reduce((sum, e) => sum + (e.amount || 0), 0);
      const salaryPayable = salaries.filter((s) => s.status !== "PAID").reduce((sum, s) => sum + (s.amount || 0), 0);

      const totalAssets = cashReceived - cashPaid + receivables;
      const totalLiabilities = payables + salaryPayable;
      const equity = totalAssets - totalLiabilities;

      const exportData = [
        { particulars: "ASSETS", amount: "" },
        { particulars: "  Cash & Bank", amount: cashReceived - cashPaid },
        { particulars: "  Accounts Receivable", amount: receivables },
        { particulars: "  Total Assets", amount: totalAssets },
        { particulars: "", amount: "" },
        { particulars: "LIABILITIES", amount: "" },
        { particulars: "  Accounts Payable", amount: payables },
        { particulars: "  Salary Payable", amount: salaryPayable },
        { particulars: "  Total Liabilities", amount: totalLiabilities },
        { particulars: "", amount: "" },
        { particulars: "EQUITY", amount: "" },
        { particulars: "  Retained Earnings", amount: equity },
        { particulars: "  Total Equity", amount: equity },
      ];

      const companyName = await getCompanyInfo();
      const config = reportConfigs.balanceSheet;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, dateRange: `As at ${new Date().toLocaleDateString("en-IN")}` });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, dateRange: `As at ${new Date().toLocaleDateString("en-IN")}` });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Cash Flow Export
  app.get("/api/reports/cash-flow/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      const payments: { date: Date; amount: number; type: "inflow" | "outflow" }[] = [];
      invoices.forEach((inv) => {
        if (inv.amountPaid && inv.amountPaid > 0) {
          payments.push({ date: new Date(inv.issueDate), amount: inv.amountPaid, type: "inflow" });
        }
      });
      expenses.filter((e) => e.status === "PAID" && e.paidDate).forEach((e) => {
        payments.push({ date: new Date(e.paidDate!), amount: e.amount || 0, type: "outflow" });
      });
      salaries.filter((s) => s.status === "PAID" && s.paymentDate).forEach((s) => {
        payments.push({ date: new Date(s.paymentDate!), amount: s.amount || 0, type: "outflow" });
      });

      const monthlyData: Map<string, { inflows: number; outflows: number }> = new Map();
      payments.forEach((p) => {
        const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthlyData.get(key) || { inflows: 0, outflows: 0 };
        if (p.type === "inflow") existing.inflows += p.amount;
        else existing.outflows += p.amount;
        monthlyData.set(key, existing);
      });

      let runningBalance = 0;
      const exportData = Array.from(monthlyData.keys()).sort().slice(-12).map((month) => {
        const data = monthlyData.get(month)!;
        const openingBalance = runningBalance;
        const netCashFlow = data.inflows - data.outflows;
        runningBalance += netCashFlow;
        return { period: month, openingBalance, inflows: data.inflows, outflows: data.outflows, netCashFlow, closingBalance: runningBalance };
      });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.cashFlow;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, orientation: "landscape" });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, orientation: "landscape" });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // General Ledger Export
  app.get("/api/reports/general-ledger/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      // Reuse the general ledger logic
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});
      const clients = await storage.getClients({});
      const vendors = await storage.getVendors({});

      const clientMap = new Map(clients.map((c) => [c.id, c.name]));
      const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

      const entries: any[] = [];
      invoices.forEach((inv) => {
        const clientName = clientMap.get(inv.clientId) || "Unknown";
        entries.push({ date: new Date(inv.issueDate).toISOString().split("T")[0], voucherNo: inv.invoiceNumber, particulars: `Invoice - ${clientName}`, accountHead: "Sales Revenue", debit: 0, credit: inv.totalAmount || 0, balance: 0 });
        if (inv.amountPaid && inv.amountPaid > 0) {
          entries.push({ date: new Date(inv.issueDate).toISOString().split("T")[0], voucherNo: `PMT-${inv.invoiceNumber}`, particulars: `Payment - ${clientName}`, accountHead: "Cash/Bank", debit: inv.amountPaid, credit: 0, balance: 0 });
        }
      });
      expenses.forEach((exp, i) => {
        entries.push({ date: new Date(exp.expenseDate).toISOString().split("T")[0], voucherNo: `EXP-${String(i + 1).padStart(4, "0")}`, particulars: exp.description, accountHead: exp.category || "Expenses", debit: exp.amount || 0, credit: 0, balance: 0 });
      });
      salaries.forEach((sal, i) => {
        entries.push({ date: sal.month + "-01", voucherNo: `SAL-${String(i + 1).padStart(4, "0")}`, particulars: `Salary - ${sal.month}`, accountHead: "Salary Expense", debit: sal.amount || 0, credit: 0, balance: 0 });
      });

      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let balance = 0;
      entries.forEach((e) => { balance += e.debit - e.credit; e.balance = balance; });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.generalLedger;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: entries, companyName, orientation: "landscape" });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: entries, companyName, orientation: "landscape" });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Trial Balance Export
  app.get("/api/reports/trial-balance/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const salaries = await storage.getSalaryPayments({});

      const accounts: Map<string, { debit: number; credit: number; type: string }> = new Map();
      const addToAccount = (name: string, debit: number, credit: number, type: string) => {
        const existing = accounts.get(name) || { debit: 0, credit: 0, type };
        existing.debit += debit;
        existing.credit += credit;
        accounts.set(name, existing);
      };

      const cashReceived = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const cashPaid = expenses.filter((e) => e.status === "PAID").reduce((sum, e) => sum + (e.amount || 0), 0)
        + salaries.filter((s) => s.status === "PAID").reduce((sum, s) => sum + (s.amount || 0), 0);
      addToAccount("Cash & Bank", cashReceived, cashPaid, "ASSET");

      const receivable = invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.amountPaid || 0)), 0);
      if (receivable > 0) addToAccount("Accounts Receivable", receivable, 0, "ASSET");

      const payable = expenses.filter((e) => e.status !== "PAID").reduce((sum, e) => sum + (e.amount || 0), 0);
      if (payable > 0) addToAccount("Accounts Payable", 0, payable, "LIABILITY");

      const revenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      addToAccount("Sales Revenue", 0, revenue, "REVENUE");

      const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      addToAccount("Operating Expenses", expenseTotal, 0, "EXPENSE");

      const salaryTotal = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (salaryTotal > 0) addToAccount("Salary Expense", salaryTotal, 0, "EXPENSE");

      const exportData = Array.from(accounts.entries()).map(([name, data]) => ({
        accountName: name,
        accountType: data.type,
        debit: data.debit > data.credit ? data.debit - data.credit : 0,
        credit: data.credit > data.debit ? data.credit - data.debit : 0,
      }));

      const totalDebit = exportData.reduce((sum, a) => sum + a.debit, 0);
      const totalCredit = exportData.reduce((sum, a) => sum + a.credit, 0);

      const companyName = await getCompanyInfo();
      const config = reportConfigs.trialBalance;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Debit", value: totalDebit }, { label: "Total Credit", value: totalCredit }] });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Debit", value: totalDebit }, { label: "Total Credit", value: totalCredit }] });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Fixed Asset Register Export
  app.get("/api/reports/fixed-asset-register/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const assets = await storage.getFixedAssets({});

      const exportData = assets.map((asset) => {
        const purchaseDate = new Date(asset.purchaseDate);
        const yearsOwned = (new Date().getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        let depreciation = 0;
        let currentValue = asset.purchaseValue;

        if (asset.depreciationMethod === "STRAIGHT_LINE") {
          const annual = (asset.purchaseValue - asset.salvageValue) / asset.usefulLifeYears;
          depreciation = Math.min(annual * yearsOwned, asset.purchaseValue - asset.salvageValue);
          currentValue = Math.max(asset.purchaseValue - depreciation, asset.salvageValue);
        } else if (asset.depreciationMethod === "WRITTEN_DOWN") {
          currentValue = asset.purchaseValue * Math.pow(1 - asset.depreciationRate / 100, yearsOwned);
          currentValue = Math.max(currentValue, asset.salvageValue);
          depreciation = asset.purchaseValue - currentValue;
        }

        return {
          name: asset.name,
          category: asset.category,
          purchaseDate: new Date(asset.purchaseDate).toLocaleDateString("en-IN"),
          purchaseValue: asset.purchaseValue,
          depreciationMethod: asset.depreciationMethod === "STRAIGHT_LINE" ? "SLM" : asset.depreciationMethod === "WRITTEN_DOWN" ? "WDV" : "None",
          accumulatedDepreciation: Math.round(depreciation * 100) / 100,
          currentValue: Math.round(currentValue * 100) / 100,
          status: asset.status,
        };
      });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.fixedAssets;
      const totalValue = exportData.reduce((sum, a) => sum + a.currentValue, 0);

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Current Value", value: totalValue }], orientation: "landscape" });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, summary: [{ label: "Total Current Value", value: totalValue }], orientation: "landscape" });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GST Sales Register Export
  app.get("/api/reports/gst/sales-register/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const clients = await storage.getClients({});
      const clientMap = new Map(clients.map((c) => [c.id, c]));

      const exportData = invoices.map((inv) => {
        const client = clientMap.get(inv.clientId);
        const taxableAmount = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gstAmount = (inv.totalAmount || 0) - taxableAmount;

        return {
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: new Date(inv.issueDate).toLocaleDateString("en-IN"),
          clientName: client?.name || "Unknown",
          gstin: client?.gstNumber || "Unregistered",
          invoiceType: client?.gstNumber ? "B2B" : "B2C",
          taxableValue: Math.round(taxableAmount * 100) / 100,
          cgst: Math.round((gstAmount / 2) * 100) / 100,
          sgst: Math.round((gstAmount / 2) * 100) / 100,
          igst: 0,
          invoiceValue: inv.totalAmount || 0,
        };
      });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.gstSalesRegister;
      const totalGst = exportData.reduce((sum, e) => sum + e.cgst + e.sgst, 0);

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, summary: [{ label: "Total GST Collected", value: totalGst }], orientation: "landscape" });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, summary: [{ label: "Total GST Collected", value: totalGst }], orientation: "landscape" });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GST Purchase Register Export
  app.get("/api/reports/gst/purchase-register/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const expenses = await storage.getExpenses({});
      const vendors = await storage.getVendors({});
      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      const exportData = expenses.filter((e) => e.amount && e.amount > 0).map((exp, i) => {
        const vendor = exp.vendorId ? vendorMap.get(exp.vendorId) : null;
        const total = exp.amount || 0;
        const taxable = total / 1.18;
        const gst = total - taxable;

        return {
          voucherNumber: exp.reference || `EXP-${String(i + 1).padStart(4, "0")}`,
          voucherDate: new Date(exp.expenseDate).toLocaleDateString("en-IN"),
          vendorName: vendor?.name || "General",
          gstin: vendor?.gstNumber || "Unregistered",
          description: exp.description,
          taxableValue: Math.round(taxable * 100) / 100,
          totalGst: Math.round(gst * 100) / 100,
          totalValue: total,
          itcEligible: vendor?.gstNumber ? "Yes" : "No",
        };
      });

      const companyName = await getCompanyInfo();
      const config = reportConfigs.gstPurchaseRegister;
      const eligibleItc = exportData.filter((e) => e.itcEligible === "Yes").reduce((sum, e) => sum + e.totalGst, 0);

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, summary: [{ label: "Eligible ITC", value: eligibleItc }], orientation: "landscape" });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, summary: [{ label: "Eligible ITC", value: eligibleItc }], orientation: "landscape" });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GSTR-3B Summary Export
  app.get("/api/reports/gst/gstr3b-summary/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});
      const expenses = await storage.getExpenses({});
      const vendors = await storage.getVendors({});
      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      let outputTaxable = 0, outputCgst = 0, outputSgst = 0;
      invoices.forEach((inv) => {
        const taxable = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gst = (inv.totalAmount || 0) - taxable;
        outputTaxable += taxable;
        outputCgst += gst / 2;
        outputSgst += gst / 2;
      });

      let inputTaxable = 0, inputCgst = 0, inputSgst = 0;
      expenses.forEach((exp) => {
        const vendor = exp.vendorId ? vendorMap.get(exp.vendorId) : null;
        if (vendor?.gstNumber) {
          const total = exp.amount || 0;
          const taxable = total / 1.18;
          const gst = total - taxable;
          inputTaxable += taxable;
          inputCgst += gst / 2;
          inputSgst += gst / 2;
        }
      });

      const netCgst = Math.max(0, outputCgst - inputCgst);
      const netSgst = Math.max(0, outputSgst - inputSgst);

      const exportData = [
        { particulars: "3.1 Outward Supplies", taxableValue: Math.round(outputTaxable * 100) / 100, cgst: Math.round(outputCgst * 100) / 100, sgst: Math.round(outputSgst * 100) / 100, igst: 0, total: Math.round((outputCgst + outputSgst) * 100) / 100 },
        { particulars: "4. Input Tax Credit", taxableValue: Math.round(inputTaxable * 100) / 100, cgst: Math.round(inputCgst * 100) / 100, sgst: Math.round(inputSgst * 100) / 100, igst: 0, total: Math.round((inputCgst + inputSgst) * 100) / 100 },
        { particulars: "6.1 Net Tax Payable", taxableValue: "", cgst: Math.round(netCgst * 100) / 100, sgst: Math.round(netSgst * 100) / 100, igst: 0, total: Math.round((netCgst + netSgst) * 100) / 100 },
      ];

      const companyName = await getCompanyInfo();
      const config = reportConfigs.gstr3bSummary;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, dateRange: `For ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}` });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, dateRange: `For ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}` });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // HSN Summary Export
  app.get("/api/reports/gst/hsn-summary/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});

      const sacCode = "998313";
      const desc = "Advertising Services";
      let quantity = 0, taxableValue = 0, cgst = 0, sgst = 0;

      invoices.forEach((inv) => {
        const taxable = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gst = (inv.totalAmount || 0) - taxable;
        quantity++;
        taxableValue += taxable;
        cgst += gst / 2;
        sgst += gst / 2;
      });

      const exportData = [{
        hsnCode: sacCode,
        description: desc,
        quantity,
        taxableValue: Math.round(taxableValue * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        totalTax: Math.round((cgst + sgst) * 100) / 100,
      }];

      const companyName = await getCompanyInfo();
      const config = reportConfigs.hsnSummary;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GST Rate Summary Export
  app.get("/api/reports/gst/rate-summary/export/:format", authenticateToken, async (req, res) => {
    try {
      const { format } = req.params;
      const invoices = await storage.getInvoices({});

      const rate = 18;
      let invoiceCount = 0, taxableValue = 0, cgst = 0, sgst = 0, invoiceValue = 0;

      invoices.forEach((inv) => {
        const taxable = inv.subtotal || (inv.totalAmount || 0) / 1.18;
        const gst = (inv.totalAmount || 0) - taxable;
        invoiceCount++;
        taxableValue += taxable;
        cgst += gst / 2;
        sgst += gst / 2;
        invoiceValue += inv.totalAmount || 0;
      });

      const exportData = [{
        rate: `${rate}%`,
        invoiceCount,
        taxableValue: Math.round(taxableValue * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: 0,
        totalTax: Math.round((cgst + sgst) * 100) / 100,
        invoiceValue: Math.round(invoiceValue * 100) / 100,
      }];

      const companyName = await getCompanyInfo();
      const config = reportConfigs.gstRateSummary;

      if (format === "excel") {
        await generateExcel(res, { ...config, data: exportData, companyName, orientation: "landscape" });
      } else if (format === "pdf") {
        generatePDF(res, { ...config, data: exportData, companyName, orientation: "landscape" });
      } else {
        res.status(400).json({ error: "Invalid format" });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================
  // FIXED ASSET CRUD ROUTES
  // ============================================
  app.get("/api/fixed-assets", authenticateToken, async (req, res) => {
    try {
      const { status, category, search } = req.query;
      const assets = await storage.getFixedAssets({
        status: status as string,
        category: category as string,
        search: search as string,
      });
      res.json(assets);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/fixed-assets/:id", authenticateToken, async (req, res) => {
    try {
      const asset = await storage.getFixedAssetById(req.params.id);
      if (!asset) {
        return res.status(404).send("Fixed asset not found");
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/fixed-assets", authenticateToken, async (req, res) => {
    try {
      const { insertFixedAssetSchema } = await import("@shared/schema");
      const validatedData = insertFixedAssetSchema.parse(req.body);
      const asset = await storage.createFixedAsset(validatedData);
      res.json(asset);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.put("/api/fixed-assets/:id", authenticateToken, async (req, res) => {
    try {
      const { insertFixedAssetSchema } = await import("@shared/schema");
      const validatedData = insertFixedAssetSchema.partial().parse(req.body);
      const asset = await storage.updateFixedAsset(req.params.id, validatedData);
      res.json(asset);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/fixed-assets/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteFixedAsset(req.params.id);
      res.json({ success: true });
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

  // ============================================
  // PAYMENT GATEWAY SETTINGS
  // ============================================

  // Get payment gateway settings
  app.get("/api/settings/payment-gateway", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getPaymentGatewaySettings();
      if (!settings) {
        // Return default settings if none exist
        res.json({
          activeGateway: "NONE",
          stripe: { publicKey: "", secretKey: "", webhookSecret: "", isTestMode: true },
          razorpay: { keyId: "", keySecret: "", webhookSecret: "", isTestMode: true },
          enabledMethods: ["card"],
          currency: "INR",
          isActive: false,
        });
        return;
      }
      // Mask sensitive keys for display
      res.json({
        ...settings,
        stripe: {
          ...settings.stripe,
          secretKey: settings.stripe.secretKey ? "••••••••" + settings.stripe.secretKey.slice(-4) : "",
          webhookSecret: settings.stripe.webhookSecret ? "••••••••" + settings.stripe.webhookSecret.slice(-4) : "",
        },
        razorpay: {
          ...settings.razorpay,
          keySecret: settings.razorpay.keySecret ? "••••••••" + settings.razorpay.keySecret.slice(-4) : "",
          webhookSecret: settings.razorpay.webhookSecret ? "••••••••" + settings.razorpay.webhookSecret.slice(-4) : "",
        },
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get full payment gateway settings (for internal use - not masked)
  app.get("/api/settings/payment-gateway/full", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getPaymentGatewaySettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create/update payment gateway settings
  app.post("/api/settings/payment-gateway", authenticateToken, async (req, res) => {
    try {
      const existingSettings = await storage.getPaymentGatewaySettings();

      // If updating, merge with existing (to preserve masked fields)
      let dataToSave = req.body;
      if (existingSettings) {
        // Preserve existing secrets if new ones are masked
        if (dataToSave.stripe?.secretKey?.startsWith("••••")) {
          dataToSave.stripe.secretKey = existingSettings.stripe.secretKey;
        }
        if (dataToSave.stripe?.webhookSecret?.startsWith("••••")) {
          dataToSave.stripe.webhookSecret = existingSettings.stripe.webhookSecret;
        }
        if (dataToSave.razorpay?.keySecret?.startsWith("••••")) {
          dataToSave.razorpay.keySecret = existingSettings.razorpay.keySecret;
        }
        if (dataToSave.razorpay?.webhookSecret?.startsWith("••••")) {
          dataToSave.razorpay.webhookSecret = existingSettings.razorpay.webhookSecret;
        }
      }

      const settings = await storage.savePaymentGatewaySettings(dataToSave);
      res.json(settings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Test payment gateway connection
  app.post("/api/settings/payment-gateway/test", authenticateToken, async (req, res) => {
    try {
      const { gateway } = req.body;
      const settings = await storage.getPaymentGatewaySettings();

      if (!settings) {
        res.status(400).json({ success: false, error: "No payment gateway settings configured" });
        return;
      }

      if (gateway === "STRIPE") {
        // Test Stripe connection
        if (!settings.stripe.secretKey) {
          res.status(400).json({ success: false, error: "Stripe secret key not configured" });
          return;
        }
        try {
          const stripe = await import("stripe");
          const stripeClient = new stripe.default(settings.stripe.secretKey);
          await stripeClient.balance.retrieve();
          res.json({ success: true, message: "Stripe connection successful" });
        } catch (stripeError: any) {
          res.status(400).json({ success: false, error: `Stripe error: ${stripeError.message}` });
        }
      } else if (gateway === "RAZORPAY") {
        // Test Razorpay connection
        if (!settings.razorpay.keyId || !settings.razorpay.keySecret) {
          res.status(400).json({ success: false, error: "Razorpay credentials not configured" });
          return;
        }
        try {
          const Razorpay = await import("razorpay");
          const razorpayClient = new Razorpay.default({
            key_id: settings.razorpay.keyId,
            key_secret: settings.razorpay.keySecret,
          });
          // Try fetching payments to verify connection
          await razorpayClient.payments.all({ count: 1 });
          res.json({ success: true, message: "Razorpay connection successful" });
        } catch (razorpayError: any) {
          res.status(400).json({ success: false, error: `Razorpay error: ${razorpayError.message}` });
        }
      } else {
        res.status(400).json({ success: false, error: "Invalid gateway specified" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
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
