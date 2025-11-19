import bcrypt from "bcrypt";
import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail("admin@agency.local");
    if (existingAdmin) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await storage.createUser({
      name: "Admin User",
      email: "admin@agency.local",
      passwordHash: hashedPassword,
      role: "ADMIN",
    });
    console.log("Created admin user:", admin.email);

    // Create sample clients
    const client1 = await storage.createClient({
      name: "TechStart Solutions",
      contactName: "Rajesh Kumar",
      email: "rajesh@techstart.com",
      phone: "+91 98765 43210",
      companyWebsite: "https://techstart.com",
      address: "123 MG Road, Bangalore, Karnataka 560001",
      status: "ACTIVE",
      notes: "Key client - Monthly SEO retainer",
      portalUrl: "",
    });

    const client2 = await storage.createClient({
      name: "Fashion Hub India",
      contactName: "Priya Sharma",
      email: "priya@fashionhub.in",
      phone: "+91 98765 43211",
      companyWebsite: "https://fashionhub.in",
      address: "45 Commercial Street, Mumbai, Maharashtra 400001",
      status: "ACTIVE",
      notes: "E-commerce client - Digital marketing campaign",
      portalUrl: "",
    });

    const client3 = await storage.createClient({
      name: "Green Energy Co",
      contactName: "Amit Patel",
      email: "amit@greenenergy.co.in",
      phone: "+91 98765 43212",
      companyWebsite: "https://greenenergy.co.in",
      address: "78 Park Avenue, Delhi, 110001",
      status: "ACTIVE",
      notes: "Solar panel company - Website redesign project",
      portalUrl: "",
    });

    const client4 = await storage.createClient({
      name: "FoodDelight Express",
      contactName: "Sarah Johnson",
      email: "sarah@fooddelight.com",
      phone: "+91 98765 43213",
      companyWebsite: "https://fooddelight.com",
      address: "90 Brigade Road, Bangalore, Karnataka 560025",
      status: "INACTIVE",
      notes: "Paused campaign - seasonal business",
      portalUrl: "",
    });

    const client5 = await storage.createClient({
      name: "HealthPlus Clinics",
      contactName: "Dr. Vikram Singh",
      email: "vikram@healthplus.in",
      phone: "+91 98765 43214",
      companyWebsite: "https://healthplus.in",
      address: "12 Medical Complex, Chennai, Tamil Nadu 600001",
      status: "ACTIVE",
      notes: "Healthcare client - Local SEO focus",
      portalUrl: "",
    });

    console.log("Created 5 sample clients");

    // Create sample projects
    const project1 = await storage.createProject({
      clientId: client1.id,
      name: "Monthly SEO Optimization",
      scope: "Local SEO",
      startDate: new Date("2024-01-01"),
      endDate: null,
      status: "ACTIVE",
      notes: "Ongoing monthly SEO services including keyword optimization and content creation",
    });

    const project2 = await storage.createProject({
      clientId: client2.id,
      name: "Meta Ads Campaign Q1",
      scope: "Digital Marketing",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-03-31"),
      status: "ACTIVE",
      notes: "Quarterly Facebook and Instagram advertising campaign",
    });

    const project3 = await storage.createProject({
      clientId: client3.id,
      name: "Corporate Website Redesign",
      scope: "Website Design",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-04-30"),
      status: "ACTIVE",
      notes: "Complete website overhaul with modern design and responsive layout",
    });

    const project4 = await storage.createProject({
      clientId: client5.id,
      name: "Local SEO Package",
      scope: "Local SEO",
      startDate: new Date("2024-03-01"),
      endDate: null,
      status: "ACTIVE",
      notes: "Google My Business optimization and local directory listings",
    });

    console.log("Created 4 sample projects");

    // Create sample invoices
    const invoice1 = await storage.createInvoice({
      clientId: client1.id,
      projectId: project1.id,
      invoiceNumber: "INV-0001",
      issueDate: new Date("2024-01-01"),
      dueDate: new Date("2024-01-31"),
      currency: "INR",
      subtotal: 42372.88,
      taxAmount: 7627.12,
      totalAmount: 50000,
      status: "PAID",
      notes: "January 2024 SEO Services",
      lineItems: [
        {
          description: "Monthly SEO Package - January 2024",
          quantity: 1,
          unitPrice: 42372.88,
          lineTotal: 42372.88,
        },
      ],
    });

    // Add payment to invoice 1
    await storage.createPayment({
      invoiceId: invoice1.id,
      paymentDate: new Date("2024-01-28"),
      amount: 50000,
      method: "BANK_TRANSFER",
      reference: "TXN123456789",
      notes: "Payment received via NEFT",
    });

    const invoice2 = await storage.createInvoice({
      clientId: client2.id,
      projectId: project2.id,
      invoiceNumber: "INV-0002",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      currency: "INR",
      subtotal: 84745.76,
      taxAmount: 15254.24,
      totalAmount: 100000,
      status: "PARTIALLY_PAID",
      notes: "Meta Ads Campaign - Q1 2024",
      lineItems: [
        {
          description: "Facebook Ads Management - January",
          quantity: 1,
          unitPrice: 33898.31,
          lineTotal: 33898.31,
        },
        {
          description: "Instagram Ads Management - January",
          quantity: 1,
          unitPrice: 33898.31,
          lineTotal: 33898.31,
        },
        {
          description: "Creative Design Services",
          quantity: 1,
          unitPrice: 16949.14,
          lineTotal: 16949.14,
        },
      ],
    });

    await storage.createPayment({
      invoiceId: invoice2.id,
      paymentDate: new Date("2024-02-10"),
      amount: 50000,
      method: "UPI",
      reference: "UPI-987654321",
      notes: "Partial payment received",
    });

    const invoice3 = await storage.createInvoice({
      clientId: client3.id,
      projectId: project3.id,
      invoiceNumber: "INV-0003",
      issueDate: new Date("2024-02-01"),
      dueDate: new Date("2024-02-20"),
      currency: "INR",
      subtotal: 127118.64,
      taxAmount: 22881.36,
      totalAmount: 150000,
      status: "SENT",
      notes: "Website Redesign - Phase 1 Advance",
      lineItems: [
        {
          description: "Website Redesign - Phase 1 (50% Advance)",
          quantity: 1,
          unitPrice: 127118.64,
          lineTotal: 127118.64,
        },
      ],
    });

    const invoice4 = await storage.createInvoice({
      clientId: client5.id,
      projectId: project4.id,
      invoiceNumber: "INV-0004",
      issueDate: new Date("2024-03-01"),
      dueDate: new Date("2024-03-10"),
      currency: "INR",
      subtotal: 25423.73,
      taxAmount: 4576.27,
      totalAmount: 30000,
      status: "OVERDUE",
      notes: "Local SEO Services - March 2024",
      lineItems: [
        {
          description: "Google My Business Optimization",
          quantity: 1,
          unitPrice: 12711.86,
          lineTotal: 12711.86,
        },
        {
          description: "Local Directory Listings (20 directories)",
          quantity: 20,
          unitPrice: 635.59,
          lineTotal: 12711.86,
        },
      ],
    });

    const invoice5 = await storage.createInvoice({
      clientId: client1.id,
      projectId: project1.id,
      invoiceNumber: "INV-0005",
      issueDate: new Date("2024-02-01"),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      currency: "INR",
      subtotal: 42372.88,
      taxAmount: 7627.12,
      totalAmount: 50000,
      status: "SENT",
      notes: "February 2024 SEO Services",
      lineItems: [
        {
          description: "Monthly SEO Package - February 2024",
          quantity: 1,
          unitPrice: 42372.88,
          lineTotal: 42372.88,
        },
      ],
    });

    const invoice6 = await storage.createInvoice({
      clientId: client2.id,
      projectId: project2.id,
      invoiceNumber: "INV-0006",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      currency: "INR",
      subtotal: 84745.76,
      taxAmount: 15254.24,
      totalAmount: 100000,
      status: "DRAFT",
      notes: "Meta Ads Campaign - February 2024",
      lineItems: [
        {
          description: "Facebook Ads Management - February",
          quantity: 1,
          unitPrice: 42372.88,
          lineTotal: 42372.88,
        },
        {
          description: "Instagram Ads Management - February",
          quantity: 1,
          unitPrice: 42372.88,
          lineTotal: 42372.88,
        },
      ],
    });

    console.log("Created 6 sample invoices with various statuses");

    // ==== PHASE 2: Expense Categories ====
    const catSoftware = await storage.createExpenseCategory({
      name: "Software & Tools",
      code: "SOFT",
    });

    const catAdvertising = await storage.createExpenseCategory({
      name: "Advertising",
      code: "ADV",
    });

    const catOffice = await storage.createExpenseCategory({
      name: "Office & Admin",
      code: "OFFICE",
    });

    const catSalaries = await storage.createExpenseCategory({
      name: "Salaries",
      code: "SAL",
    });

    console.log("Created 4 expense categories");

    // ==== PHASE 2: Vendors ====
    const vendorMeta = await storage.createVendor({
      name: "Meta Ads",
      contactName: "Support Team",
      email: "support@meta.com",
      phone: "+1-650-543-4800",
      website: "https://business.facebook.com",
      address: "1 Meta Way, Menlo Park, CA 94025",
      category: "MEDIA_BUY",
      status: "ACTIVE",
      notes: "Facebook and Instagram advertising platform",
    });

    const vendorGoogle = await storage.createVendor({
      name: "Google Ads",
      contactName: "Support Team",
      email: "support@google.com",
      phone: "+1-866-246-6453",
      website: "https://ads.google.com",
      address: "1600 Amphitheatre Parkway, Mountain View, CA 94043",
      category: "MEDIA_BUY",
      status: "ACTIVE",
      notes: "Google advertising platform",
    });

    const vendorFreelancer = await storage.createVendor({
      name: "Freelance Designer - Arjun Patel",
      contactName: "Arjun Patel",
      email: "arjun.design@gmail.com",
      phone: "+91 98765 99999",
      website: "",
      address: "Pune, Maharashtra",
      category: "FREELANCER",
      status: "ACTIVE",
      notes: "Graphic designer for social media content",
    });

    console.log("Created 3 vendors");

    // ==== PHASE 2: Team Members ====
    const teamMember1 = await storage.createTeamMember({
      name: "Sneha Reddy",
      email: "sneha@agency.local",
      roleTitle: "SEO Specialist",
      status: "ACTIVE",
      baseSalary: 45000,
      joinedDate: new Date("2023-06-01"),
      exitDate: null,
      notes: "Senior SEO specialist, handles all client SEO campaigns",
    });

    const teamMember2 = await storage.createTeamMember({
      name: "Rahul Verma",
      email: "rahul@agency.local",
      roleTitle: "Media Buyer",
      status: "ACTIVE",
      baseSalary: 50000,
      joinedDate: new Date("2023-08-15"),
      exitDate: null,
      notes: "Manages all Meta and Google Ads campaigns",
    });

    const teamMember3 = await storage.createTeamMember({
      name: "Kavita Menon",
      email: "kavita@agency.local",
      roleTitle: "Content Writer",
      status: "ACTIVE",
      baseSalary: 35000,
      joinedDate: new Date("2024-01-10"),
      exitDate: null,
      notes: "Content creation for SEO and social media",
    });

    console.log("Created 3 team members");

    // ==== PHASE 2: Expenses ====
    await storage.createExpense({
      vendorId: vendorMeta.id,
      categoryId: catAdvertising.id,
      description: "Meta Ads spend for Fashion Hub India campaign - January 2024",
      amount: 75000,
      currency: "INR",
      expenseDate: new Date("2024-01-25"),
      dueDate: null,
      paidDate: new Date("2024-01-26"),
      status: "PAID",
      paymentMethod: "CARD",
      reference: "META-JAN-2024",
      notes: "Facebook and Instagram ads for client Fashion Hub India",
    });

    await storage.createExpense({
      vendorId: vendorGoogle.id,
      categoryId: catAdvertising.id,
      description: "Google Ads spend for TechStart Solutions - January 2024",
      amount: 50000,
      currency: "INR",
      expenseDate: new Date("2024-01-28"),
      dueDate: null,
      paidDate: new Date("2024-01-30"),
      status: "PAID",
      paymentMethod: "CARD",
      reference: "GADS-JAN-2024",
      notes: "Search and Display ads for client TechStart",
    });

    await storage.createExpense({
      vendorId: vendorFreelancer.id,
      categoryId: catAdvertising.id,
      description: "Social media graphics design - 10 posts",
      amount: 15000,
      currency: "INR",
      expenseDate: new Date("2024-02-05"),
      dueDate: new Date("2024-02-15"),
      paidDate: new Date("2024-02-10"),
      status: "PAID",
      paymentMethod: "UPI",
      reference: "UPI-ARJUN-001",
      notes: "Instagram and Facebook post designs for February campaigns",
    });

    await storage.createExpense({
      vendorId: null,
      categoryId: catOffice.id,
      description: "Office supplies and stationery",
      amount: 8000,
      currency: "INR",
      expenseDate: new Date("2024-02-01"),
      dueDate: null,
      paidDate: new Date("2024-02-02"),
      status: "PAID",
      paymentMethod: "CASH",
      reference: "",
      notes: "Monthly office supplies purchase",
    });

    await storage.createExpense({
      vendorId: vendorMeta.id,
      categoryId: catAdvertising.id,
      description: "Meta Ads spend for Fashion Hub India campaign - February 2024",
      amount: 80000,
      currency: "INR",
      expenseDate: new Date("2024-02-25"),
      dueDate: new Date("2024-03-05"),
      paidDate: null,
      status: "DUE",
      paymentMethod: null,
      reference: "",
      notes: "Pending payment for February ads",
    });

    console.log("Created 5 sample expenses");

    // ==== PHASE 2: Salary Payments ====
    await storage.createSalaryPayment({
      teamMemberId: teamMember1.id,
      month: "2024-01",
      paymentDate: new Date("2024-02-01"),
      amount: 45000,
      currency: "INR",
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      reference: "SAL-JAN-2024-SNEHA",
      notes: "January 2024 salary",
    });

    await storage.createSalaryPayment({
      teamMemberId: teamMember2.id,
      month: "2024-01",
      paymentDate: new Date("2024-02-01"),
      amount: 50000,
      currency: "INR",
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      reference: "SAL-JAN-2024-RAHUL",
      notes: "January 2024 salary",
    });

    await storage.createSalaryPayment({
      teamMemberId: teamMember3.id,
      month: "2024-01",
      paymentDate: new Date("2024-02-01"),
      amount: 35000,
      currency: "INR",
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      reference: "SAL-JAN-2024-KAVITA",
      notes: "January 2024 salary",
    });

    await storage.createSalaryPayment({
      teamMemberId: teamMember1.id,
      month: "2024-02",
      paymentDate: new Date("2024-03-01"),
      amount: 45000,
      currency: "INR",
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      reference: "SAL-FEB-2024-SNEHA",
      notes: "February 2024 salary",
    });

    await storage.createSalaryPayment({
      teamMemberId: teamMember2.id,
      month: "2024-02",
      paymentDate: new Date("2024-03-01"),
      amount: 50000,
      currency: "INR",
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      reference: "SAL-FEB-2024-RAHUL",
      notes: "February 2024 salary",
    });

    await storage.createSalaryPayment({
      teamMemberId: teamMember3.id,
      month: "2024-02",
      paymentDate: null,
      amount: 35000,
      currency: "INR",
      status: "PENDING",
      paymentMethod: null,
      reference: "",
      notes: "February 2024 salary - pending",
    });

    console.log("Created 6 salary payment records");

    console.log("\n✅ Database seeded successfully with Phase 1 & Phase 2 data!");
    console.log("\nLogin credentials:");
    console.log("Email: admin@agency.local");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
