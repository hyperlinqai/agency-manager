# HQ CRM - Project Features & Functionalities

**Agency Control Center** - A comprehensive internal web application for digital marketing agencies to manage clients, projects, invoices, payments, vendors, expenses, team members, and more.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & User Management](#authentication--user-management)
3. [Dashboard](#dashboard)
4. [Client Management](#client-management)
5. [Project Management](#project-management)
6. [Invoice & Payment System](#invoice--payment-system)
7. [Vendor Management](#vendor-management)
8. [Expense Management](#expense-management)
9. [Team & Payroll Management](#team--payroll-management)
10. [Attendance Management](#attendance-management)
11. [Leave Management](#leave-management)
12. [Slack Integration](#slack-integration)
13. [Client Onboarding](#client-onboarding)
14. [Team Member Onboarding](#team-member-onboarding)
15. [Proposals Management](#proposals-management)
16. [Contracts Management](#contracts-management)
17. [Monthly Reports](#monthly-reports)
18. [Financial Reports](#financial-reports)
19. [AI-Powered Features](#ai-powered-features)
20. [Settings & Configuration](#settings--configuration)
21. [Public Features](#public-features)
22. [Technical Stack](#technical-stack)

---

## Overview

HQ CRM is a full-featured agency management system designed to handle all aspects of running a digital marketing agency. The system is built with a modern tech stack and provides a clean, intuitive interface for managing clients, projects, finances, team members, and marketing activities.

### Key Capabilities

- **Complete Client Lifecycle Management**: From onboarding to project delivery
- **Financial Tracking**: Invoices, payments, expenses, and profit analysis
- **Team Management**: Employee onboarding, salary tracking, and payroll
- **Vendor & Expense Management**: Track all outgoing expenses
- **Marketing Tools**: Proposals, contracts, and monthly reporting
- **Public Onboarding**: Shareable links for client and team member onboarding

---

## Authentication & User Management

### Features

- **Secure Login System**
  - Email and password authentication
  - JWT token-based session management
  - Password hashing with bcrypt
  - Protected routes requiring authentication

- **User Roles** (Prepared for future implementation)
  - ADMIN
  - MANAGER
  - STAFF

- **Session Management**
  - Token stored securely
  - Automatic logout on token expiration
  - Protected API endpoints

### Default Credentials

```
Email: admin@agency.local
Password: admin123
```

---

## Dashboard

### Overview Metrics

The dashboard provides a comprehensive financial overview with key metrics:

- **Total Invoiced**: Sum of all invoice amounts
- **Total Collected**: Sum of all payments received
- **Total Outstanding**: Unpaid invoice balances
- **Total Expenses**: All recorded expenses
- **Total Salaries**: All salary payments
- **Net Profit**: Collected revenue minus expenses and salaries

### Financial Overview

- **Period Selection**: View metrics for different time periods
  - This Month
  - Last Month
  - Last 3 Months
  - Custom date range

- **Breakdown by Category**: Expense breakdown by category
- **Top Vendors**: Vendors with highest spending
- **Top Expense Categories**: Categories with highest expenses

### Upcoming Items

- **Upcoming Invoices**: Invoices due in the next 7-30 days
- **Recent Activity**: Latest invoices and payments
- **Overdue Invoices**: Invoices past due date with outstanding balance

### Visualizations

- Charts showing income vs expenses vs salaries
- Trend analysis for financial metrics
- Category-wise expense distribution

---

## Client Management

### Client List View

- **Table Display** with columns:
  - Client Name
  - Contact Person
  - Email
  - Phone
  - Status (Active/Inactive/Archived)
  - Total Invoiced
  - Outstanding Amount
  - Total Projects

- **Filtering & Search**
  - Search by name or email
  - Filter by status (Active, Inactive, Archived)
  - Sort by various columns

- **Actions**
  - Create new client
  - Edit client details
  - View client detail page
  - Change client status

### Client Detail Page

- **Client Information Card**
  - Basic contact details
  - Company information
  - Status badge with toggle
  - GST number and address

- **Tabs/Sections**:
  1. **Overview**
     - Complete client information
     - Notes and additional details
     - Onboarding status and link
     
  2. **Projects**
     - List of all projects for the client
     - Project status, dates, and scope
     - Create new project button
     
  3. **Invoices**
     - All invoices for the client
     - Invoice number, dates, amounts
     - Payment status
     - Create invoice button
     
  4. **Proposals** (if applicable)
  5. **Contracts** (if applicable)
  6. **Monthly Reports** (if applicable)

- **Client Onboarding Link**
  - Shareable public URL for client onboarding
  - Copy to clipboard functionality
  - Open in new tab
  - Regenerate token option
  - Onboarding completion status

### Client Creation/Editing

- **Required Fields**:
  - Client Name
  - Contact Name
  - Email

- **Optional Fields**:
  - Phone
  - Company Website
  - Address
  - GST Number
  - Notes

- **Status Management**:
  - ACTIVE: Currently working with
  - INACTIVE: Not currently active
  - ARCHIVED: Historical clients

---

## Project Management

### Project Features

- **Project Creation**
  - Link to client (required)
  - Project name and scope
  - Start date and optional end date
  - Status tracking
  - Notes field

- **Project Status**
  - ACTIVE: Currently in progress
  - ON_HOLD: Temporarily paused
  - COMPLETED: Finished
  - CANCELLED: Terminated

- **Project List View**
  - Filter by client
  - Filter by status
  - View all projects or client-specific

- **Project Details**
  - Full project information
  - Linked invoices
  - Timeline and dates
  - Status management

---

## Invoice & Payment System

### Invoice Management

#### Invoice List View

- **Table Columns**:
  - Invoice Number (auto-generated)
  - Client Name
  - Project (if linked)
  - Issue Date
  - Due Date
  - Total Amount
  - Amount Paid
  - Balance Due
  - Status Badge

- **Filtering Options**:
  - By client
  - By status (DRAFT, SENT, PAID, OVERDUE, PARTIALLY_PAID)
  - By date range
  - Search functionality

- **Actions**:
  - Create new invoice
  - Edit invoice (if not paid)
  - View invoice details
  - Download/Print invoice
  - Mark as sent
  - Record payments

#### Invoice Creation/Editing

**Multi-step Process**:

1. **Select Client**: Choose from active clients
2. **Select Project** (Optional): Choose from client's projects
3. **Invoice Details**:
   - Invoice number (auto-generated, editable)
   - Issue date
   - Due date
   - Payment terms
4. **Line Items**:
   - Description
   - Quantity
   - Unit price
   - Line total (auto-calculated)
   - Add/remove line items
5. **Totals**:
   - Subtotal
   - Tax rate (configurable, default 18%)
   - Tax amount
   - Total amount

**Invoice Status Logic**:
- **DRAFT**: Created but not sent
- **SENT**: Sent to client, awaiting payment
- **PAID**: Fully paid (balanceDue = 0)
- **PARTIALLY_PAID**: Some payment received but not full
- **OVERDUE**: Due date passed with outstanding balance

#### Invoice Detail Page

- **Invoice Information**:
  - Complete invoice details
  - Client and project information
  - Line items breakdown
  - Tax calculations
  - Totals

- **Payment Section**:
  - Payment history table
  - Add new payment
  - Payment details (amount, date, method, reference)
  - Running balance

- **Actions**:
  - Edit invoice (if not paid)
  - Mark as sent
  - Record payment
  - Download PDF
  - Print invoice
  - Change status

### Payment Tracking

- **Payment Recording**:
  - Payment amount
  - Payment date
  - Payment method (Bank Transfer, UPI, Cash, Card, Other)
  - Reference number (UTR, transaction ID, etc.)
  - Notes

- **Automatic Updates**:
  - Updates invoice `amountPaid`
  - Recalculates `balanceDue`
  - Updates invoice status automatically
  - Handles partial payments

- **Payment History**:
  - Chronological list of all payments
  - Payment details and references
  - Running balance tracking

---

## Vendor Management

### Vendor List View

- **Table Columns**:
  - Vendor Name
  - Category (Software, Freelancer, Media Buy, Other)
  - Contact Name
  - Email
  - Phone
  - Status (Active/Inactive)
  - Total Spend (sum of expenses)

- **Filtering**:
  - Search by name or email
  - Filter by status
  - Filter by category

- **Actions**:
  - Create new vendor
  - Edit vendor
  - View vendor details
  - Toggle status

### Vendor Detail Page

- **Vendor Information**:
  - Complete contact details
  - Category and status
  - Website and address
  - Notes

- **Tabs**:
  1. **Overview**: Basic information
  2. **Expenses**: All expenses for this vendor
     - Expense list with amounts, dates, status
     - Quick add expense button

### Vendor Creation/Editing

- **Fields**:
  - Vendor Name (required)
  - Contact Name
  - Email
  - Phone
  - Website
  - Address
  - Category (dropdown)
  - Status
  - Notes

---

## Expense Management

### Expense List View

- **Table Columns**:
  - Date
  - Description
  - Vendor (or "General" if none)
  - Category
  - Amount
  - Status (Planned, Due, Paid, Cancelled)
  - Payment Method
  - Reference

- **Filtering Options**:
  - Date range
  - Vendor
  - Category
  - Status
  - Search by description

- **Actions**:
  - Create new expense
  - Edit expense
  - Mark as paid
  - Delete expense

### Expense Creation/Editing

- **Fields**:
  - Vendor (optional dropdown)
  - Category (required)
  - Description (required)
  - Amount (required, must be > 0)
  - Expense Date (required)
  - Due Date (optional, for bills to be paid later)
  - Payment Method
  - Reference (invoice number, UTR, etc.)
  - Status (Planned, Due, Paid, Cancelled)
  - Notes

### Expense Categories

- Pre-defined categories:
  - Software
  - Advertising
  - Office
  - Salaries
  - Travel
  - Other

- **Category Management**:
  - Create custom categories
  - Edit category names
  - Category codes for reporting

### Expense Status Workflow

- **PLANNED**: Future expense
- **DUE**: Bill received, payment pending
- **PAID**: Payment completed
- **CANCELLED**: Expense cancelled

### Mark as Paid Feature

- Quick action to mark expenses as paid
- Records payment date, method, and reference
- Updates status automatically

---

## Team & Payroll Management

### Team Members Management

#### Team Members List

- **Table Columns**:
  - Name
  - Role/Title
  - Employment Type (Full Time, Part Time, Contract, Freelance, Intern)
  - Email
  - Base Salary (monthly)
  - Joined Date
  - Status (Active/Inactive)

- **Filtering**:
  - Filter by status
  - Search functionality

- **Actions**:
  - Add new team member
  - Edit team member
  - View onboarding link
  - Delete team member

#### Team Member Detail/Dialog

- **Personal Information**:
  - Full name
  - Email
  - Phone
  - Date of birth
  - Personal email
  - Emergency contact

- **Employment Details**:
  - Role/Title (from job roles)
  - Employment type
  - Department
  - Reporting manager
  - Joined date
  - Exit date (if applicable)
  - Base salary
  - Status

- **Documents & Banking**:
  - Address
  - PAN number
  - Bank name
  - Bank account number
  - IFSC code

- **Onboarding Link**:
  - Public URL for team member onboarding
  - Copy to clipboard
  - Open in new tab
  - Regenerate token
  - Onboarding completion status

### Salary Payments

#### Salary Payments List

- **Table Columns**:
  - Month (YYYY-MM format)
  - Team Member Name
  - Amount
  - Payment Date
  - Status (Paid/Pending)
  - Payment Method
  - Reference

- **Filtering**:
  - By month (date picker)
  - By team member
  - By status (Paid/Pending)

- **Actions**:
  - Create salary record
  - Mark as paid
  - Edit salary payment
  - Delete salary payment

#### Create Salary Record

- **Fields**:
  - Team Member (dropdown)
  - Month (YYYY-MM format)
  - Amount (pre-filled with base salary, editable)
  - Payment Date (if paying immediately)
  - Payment Method
  - Reference
  - Notes

#### Mark Salary as Paid

- Quick action for pending salaries
- Records payment date, method, and reference
- Updates status to PAID

---

## Attendance Management

### Attendance Overview

The attendance system provides comprehensive tracking of team member work hours, with both manual entry and automated Slack-based tracking capabilities.

### Attendance List View

- **Table Columns**:
  - Employee Name
  - Date
  - Check-In Time
  - Check-Out Time
  - Working Hours
  - Overtime Hours
  - Status
  - Actions

- **Summary Statistics**:
  - Total Records
  - Present Days
  - Absent Days
  - Total Hours Worked

### Filtering Options

- **Date Range**: Filter attendance by start and end date
- **Employee Filter**: Filter by specific team member or view all
- **Status Filter**: Filter by attendance status
  - PRESENT
  - ABSENT
  - HALF_DAY
  - LATE
  - ON_LEAVE
  - HOLIDAY
  - WEEKEND

### Attendance Entry

- **Manual Entry**:
  - Select employee
  - Pick date
  - Enter check-in and check-out times (HH:MM format)
  - Auto-calculates working hours (standard 8 hours, rest as overtime)
  - Manual override for hours
  - Select status
  - Add notes

- **Bulk Upload**:
  - CSV/Excel file upload support
  - Expected format: Employee Email, Date, Check In, Check Out, Status
  - Download template option

### Working Hours Calculation

- **Standard Hours**: 8 hours per day
- **Overtime**: Hours beyond 8 hours automatically calculated
- **Auto-calculation**: Based on check-in and check-out times

### Attendance Status Types

| Status | Description |
|--------|-------------|
| PRESENT | Full day attendance |
| ABSENT | No attendance recorded |
| HALF_DAY | Partial day attendance |
| LATE | Arrived after expected time |
| ON_LEAVE | Approved leave day |
| HOLIDAY | Company holiday |
| WEEKEND | Weekend/non-working day |

---

## Leave Management

### Leave Types

Pre-defined leave types available in the system:

- **CL** - Casual Leave
- **SL** - Sick Leave
- **PL** - Privilege/Earned Leave
- **ML** - Maternity Leave
- **PAL** - Paternity Leave
- **LWP** - Leave Without Pay
- **COMP** - Compensatory Off

### Leave Request Management

#### Leave Request List

- **Table Columns**:
  - Employee Name
  - Leave Type
  - Start Date
  - End Date
  - Duration (days)
  - Reason
  - Status
  - Applied On
  - Actions

- **Filtering Options**:
  - By employee
  - By leave type
  - By status
  - By date range

#### Leave Request Status

- **PENDING**: Awaiting approval
- **APPROVED**: Leave approved
- **REJECTED**: Leave denied
- **CANCELLED**: Request withdrawn

### Leave Balance Tracking

- **Per Employee**:
  - Total quota per leave type
  - Used leaves
  - Pending requests
  - Available balance

- **Balance Calculation**:
  - Quota from leave policy
  - Minus approved leaves
  - Minus pending requests
  - Carry forward from previous year

### Leave Request Workflow

1. **Employee Submits Request**:
   - Select leave type
   - Choose start and end dates
   - Provide reason
   - Submit for approval

2. **Manager Review**:
   - View request details
   - Check leave balance
   - Approve or reject with comments

3. **Notification**:
   - Status update notification
   - Calendar integration (if applicable)

### Leave Policies

- **Configuration in Settings**:
  - Define annual quota per job role
  - Set carry forward limits
  - Configure accrual rules
  - Activate/deactivate policies

- **Policy Assignment**:
  - Linked to job roles
  - Automatic quota assignment on joining
  - Pro-rata calculation for mid-year joins

---

## Slack Integration

### Overview

The Slack integration enables automatic attendance tracking by monitoring team members' messages in designated Slack channels. When team members share their morning updates or end-of-day messages, the system automatically records their check-in and check-out times.

### Features

#### Automatic Attendance Tracking

- **Check-In Detection**: Monitors for morning messages containing keywords like:
  - "good morning", "gm"
  - "starting work"
  - "today's tasks"
  - "morning update"
  - "morning todos"

- **Check-Out Detection**: Monitors for end-of-day messages containing keywords like:
  - "signing off"
  - "done for the day"
  - "wrapping up"
  - "eod", "end of day"
  - "logging off"
  - "good night"

#### How It Works

1. **Team member posts** in the configured Slack channel
2. **System detects keywords** in the message
3. **Attendance record created/updated** automatically
4. **Bot adds reaction** to acknowledge:
   - ✓ (white_check_mark) for check-in
   - 👋 (wave) for check-out

### Configuration

#### Slack App Setup

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable Event Subscriptions
3. Set Request URL: `{your-domain}/api/slack/webhook`
4. Subscribe to bot events:
   - `message.channels`
   - `message.groups`
5. Add OAuth scopes:
   - `channels:history`
   - `chat:write`
   - `reactions:write`
   - `users:read`
   - `channels:read`
6. Install app to workspace

#### Settings in Application

- **Bot Token**: OAuth token from Slack app
- **Signing Secret**: For request verification
- **Attendance Channel**: Select specific channel or monitor all
- **Check-In Keywords**: Configurable keyword list
- **Check-Out Keywords**: Configurable keyword list
- **Active/Pause Toggle**: Enable or disable monitoring

### Team Member Mapping

- Each team member must be linked to their Slack account
- Mapping done in Team Member dialog
- Select from list of workspace users
- Enables automatic attendance attribution

### Slack Attendance Logs

- **Logged Information**:
  - Team member ID
  - Slack user ID
  - Message timestamp
  - Channel ID
  - Message text (truncated)
  - Event type (CHECK_IN/CHECK_OUT)
  - Detected keyword
  - Timestamp
  - Linked attendance record ID

### Security

- **Request Verification**: Slack signature verification for all webhook requests
- **Replay Attack Prevention**: Requests older than 5 minutes rejected
- **Token Security**: Tokens stored securely, masked in UI

---

## Client Onboarding

### Internal Onboarding Form

- **Multi-step Process**:
  1. Client Basic Information
  2. Business Details & KYC
  3. Brand Assets
  4. Website Access
  5. Social Accounts
  6. CRM & Tools
  7. Marketing History
  8. Project Details
  9. Review & Submit

- **Features**:
  - Step-by-step wizard
  - Progress tracking
  - Save and continue later
  - Form validation

### Public Client Onboarding

- **Shareable Link**: Unique URL per client
- **Public Access**: No login required
- **Features**:
  - Client can fill information themselves
  - Save progress functionality
  - Multi-step form
  - Completion tracking
  - Status indicators

- **Onboarding Data Collected**:
  - Business details and KYC
  - Brand assets (logo, colors, fonts)
  - Website credentials
  - Social media accounts
  - CRM and marketing tools access
  - Marketing history
  - Project preferences
  - Communication preferences

---

## Team Member Onboarding

### Internal Employee Onboarding

- **Multi-step Form**:
  1. Personal Information
  2. Employment Details
  3. Documents & Banking
  4. Review & Confirm

- **Features**:
  - Job role selection
  - Employment type selection
  - Department assignment
  - Salary configuration
  - Document collection
  - Bank details for payroll

### Public Team Member Onboarding

- **Shareable Link**: Unique URL per team member
- **Public Access**: No login required
- **Features**:
  - Team member can fill their own information
  - Save progress
  - Multi-step form
  - Completion tracking

- **Data Collected**:
  - Personal contact details
  - Emergency contact
  - Department and reporting structure
  - Address information
  - PAN number
  - Bank account details
  - Additional notes

---

## Proposals Management

### Proposal List View

- **Table Display**:
  - Proposal number/title
  - Client name
  - Project (if linked)
  - Status
  - Created date
  - Amount/value

- **Filtering**:
  - By client
  - By status
  - By date range

- **Actions**:
  - Create new proposal
  - Edit proposal
  - View proposal details
  - Send to client
  - Convert to contract

### Proposal Creation/Editing

- **Proposal Details**:
  - Client selection
  - Project linking
  - Proposal title/number
  - Services/items
  - Pricing
  - Terms and conditions
  - Validity period

- **Status Tracking**:
  - DRAFT
  - SENT
  - ACCEPTED
  - REJECTED
  - EXPIRED

---

## Contracts Management

### Contract List View

- **Table Display**:
  - Contract number/title
  - Client name
  - Project (if linked)
  - Status
  - Start date
  - End date
  - Value

- **Filtering**:
  - By client
  - By status
  - By date range

- **Actions**:
  - Create new contract
  - Edit contract
  - View contract details
  - Download contract
  - Renew contract

### Contract Creation/Editing

- **Contract Details**:
  - Client selection
  - Project linking
  - Contract type
  - Start and end dates
  - Terms and conditions
  - Payment terms
  - Renewal options

- **Status Tracking**:
  - DRAFT
  - ACTIVE
  - EXPIRED
  - TERMINATED
  - RENEWED

---

## Monthly Reports

### Monthly Report List

- **Table Display**:
  - Report month
  - Client name
  - Project (if linked)
  - Status
  - Created date
  - Metrics summary

- **Filtering**:
  - By client
  - By project
  - By status
  - By month

- **Actions**:
  - Create new report
  - Edit report
  - View report details
  - Send to client
  - Download PDF

### Monthly Report Creation

- **Report Sections**:
  - Executive summary
  - Key metrics and KPIs
  - Campaign performance
  - Traffic and engagement
  - Conversions and ROI
  - Recommendations
  - Next month goals

- **Status Tracking**:
  - DRAFT
  - IN_REVIEW
  - SENT
  - APPROVED

---

## Financial Reports

### Overview

Comprehensive financial reporting module providing insights into agency finances with visual charts, detailed data tables, and export functionality.

### Report Types

#### 1. Revenue by Client

- **Purpose**: Track income distribution across clients
- **Features**:
  - Bar chart visualization of revenue per client
  - Total revenue summary card
  - Average revenue per client
  - Active clients count
  - Detailed table with client name and total revenue
  - Export to CSV

#### 2. Invoice Aging Report

- **Purpose**: Monitor outstanding invoices by age buckets
- **Features**:
  - Aging buckets: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days
  - Pie chart visualization of aging distribution
  - Summary cards for total outstanding and overdue amounts
  - Detailed table showing client, invoice number, amount, due date, and age
  - Color-coded status badges
  - Export to CSV

#### 3. Expense Tracking

- **Purpose**: Analyze expenses by category
- **Features**:
  - Pie chart showing expense distribution by category
  - Total expenses summary
  - Category breakdown with amounts and percentages
  - Expense count per category
  - Top expense categories analysis
  - Export to CSV

#### 4. Profit by Client/Project

- **Purpose**: Analyze profitability per client
- **Features**:
  - Revenue vs Expenses vs Profit bar chart
  - Total profit summary
  - Average profit margin percentage
  - Detailed breakdown per client:
    - Revenue collected
    - Expenses attributed
    - Net profit
    - Profit margin percentage
  - Color-coded profit margins (green for positive, red for negative)
  - Export to CSV

#### 5. Profit & Loss (P&L) Statement

- **Purpose**: Standard income statement showing financial performance
- **Structure**:
  - **Revenue Section**:
    - Invoice Revenue (collected payments)
    - Total Revenue
  - **Expenses Section**:
    - Operating Expenses
    - Salary Expenses
    - Total Expenses
  - **Summary**:
    - Gross Profit
    - Net Profit
    - Profit Margin percentage
- **Features**:
  - Professional P&L format
  - Clear revenue and expense breakdown
  - Profit margin indicators
  - Export to CSV

#### 6. Balance Sheet

- **Purpose**: Snapshot of financial position (assets vs liabilities)
- **Structure**:
  - **Assets**:
    - Cash (payments received)
    - Accounts Receivable (outstanding invoices)
    - Total Assets
  - **Liabilities**:
    - Accounts Payable (pending expenses)
    - Accrued Salaries (pending salary payments)
    - Total Liabilities
  - **Equity**:
    - Retained Earnings (Assets - Liabilities)
    - Total Equity
- **Features**:
  - Standard accounting format
  - Asset-Liability balance verification
  - Export to CSV

#### 7. Cash Flow Statement

- **Purpose**: Track cash movements in and out of the business
- **Structure**:
  - **Operating Activities**:
    - Cash from Clients (payments received)
    - Payments to Vendors (paid expenses)
    - Salary Payments
    - Net Cash from Operations
  - **Summary**:
    - Beginning Cash Balance
    - Net Change in Cash
    - Ending Cash Balance
- **Features**:
  - Clear cash inflows and outflows
  - Net cash position tracking
  - Export to CSV

#### 8. General Ledger

- **Purpose**: Master book of all financial transactions for audits & CA requirements
- **Features**:
  - Complete transaction record with debit/credit entries
  - Voucher numbers and references
  - Account head categorization
  - Running balance calculation
  - Sorted chronologically by date
  - Includes invoices, payments, expenses, and salaries
- **Columns**:
  - Date, Voucher No, Particulars, Account Head
  - Debit, Credit, Running Balance

#### 9. Trial Balance

- **Purpose**: Pre-check verification before tax filings - CA requirement
- **Features**:
  - Summary of all account balances
  - Automatic balance verification (Debit = Credit)
  - Balance status indicator (Balanced/Unbalanced)
  - Account type categorization (Asset, Liability, Revenue, Expense)
  - Difference calculation for troubleshooting
- **Account Categories**:
  - Assets (Cash & Bank, Accounts Receivable, Fixed Assets)
  - Contra Assets (Accumulated Depreciation)
  - Liabilities (Accounts Payable, Salary Payable)
  - Revenue (Sales Revenue)
  - Expenses (by category + Salary Expense)

#### 10. Fixed Asset Register

- **Purpose**: Track fixed assets with depreciation for Income Tax Act compliance
- **Features**:
  - Complete asset inventory with purchase details
  - Automatic depreciation calculation
  - Supports Straight Line Method (SLM) and Written Down Value (WDV)
  - Category-wise asset summary with pie chart
  - Current book value tracking
  - Asset status tracking (Active, Disposed, Sold, Written Off)
- **Asset Categories**:
  - Furniture, Equipment, Vehicle, Computer
  - Software, Building, Land, Other
- **Depreciation Methods**:
  - **Straight Line**: (Cost - Salvage) / Useful Life
  - **Written Down Value**: Cost × (1 - Rate)^Years
- **Columns**:
  - Asset Name, Category, Purchase Date, Purchase Value
  - Depreciation Method, Rate/Life, Accumulated Depreciation
  - Current Value, Status

### Common Features

- **Date Range Filtering**:
  - This Month
  - Last Month
  - This Quarter
  - This Year
  - Custom date range picker

- **Data Visualization**:
  - Interactive charts using Recharts
  - Bar charts, pie charts
  - Tooltips with detailed information
  - Responsive design

- **Export Functionality**:
  - Export any report to CSV
  - Formatted data for spreadsheet analysis

- **Summary Cards**:
  - Key metrics at a glance
  - Visual indicators for positive/negative values

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/reports/revenue-by-client` | Revenue breakdown by client |
| `/api/reports/invoice-aging` | Invoice aging buckets |
| `/api/reports/expenses-by-category` | Expense distribution |
| `/api/reports/profit-by-client` | Profit analysis per client |
| `/api/reports/profit-loss` | P&L statement data |
| `/api/reports/balance-sheet` | Balance sheet data |
| `/api/reports/cash-flow` | Cash flow statement data |
| `/api/reports/general-ledger` | General ledger entries |
| `/api/reports/trial-balance` | Trial balance summary |
| `/api/reports/fixed-asset-register` | Fixed asset register with depreciation |

### Fixed Asset Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fixed-assets` | GET | List all fixed assets |
| `/api/fixed-assets/:id` | GET | Get single asset |
| `/api/fixed-assets` | POST | Create new asset |
| `/api/fixed-assets/:id` | PUT | Update asset |
| `/api/fixed-assets/:id` | DELETE | Delete asset |

### GST Compliance Reports

Comprehensive GST reporting module for Indian tax compliance.

#### 1. GSTR-3B Summary

- **Purpose**: Monthly GST return summary for filing
- **Sections**:
  - **3.1 Outward Supplies**: Taxable value, CGST, SGST, IGST
  - **4. Input Tax Credit**: ITC from registered vendors
  - **ITC Utilization**: Credit adjustment
  - **6.1 Net Tax Payable**: Final tax liability
- **Features**:
  - Automatic calculation of Output Tax vs Input Tax Credit
  - Net payable breakdown by tax type (CGST/SGST/IGST)
  - Visual summary cards for quick overview

#### 2. Sales Register (GSTR-1)

- **Purpose**: Invoice-wise outward supplies for GSTR-1 filing
- **Data Points**:
  - Invoice Number, Date
  - Client Name, GSTIN
  - Place of Supply
  - Invoice Type (B2B/B2C)
  - Taxable Value, CGST, SGST, IGST
  - Total Invoice Value
- **Features**:
  - B2B vs B2C breakdown
  - GSTIN tracking for registered clients
  - Total tax summary

#### 3. Purchase Register (ITC)

- **Purpose**: Track inward supplies for Input Tax Credit
- **Data Points**:
  - Voucher Number, Date
  - Vendor Name, GSTIN
  - Description, Category
  - Taxable Value, GST amounts
  - ITC Eligibility status
- **Features**:
  - Automatic ITC eligibility check (based on vendor GSTIN)
  - Eligible vs Non-eligible ITC breakdown
  - Total GST paid tracking

#### 4. HSN/SAC Summary

- **Purpose**: Summary by service codes for GSTR-1 Annexure
- **SAC Codes for Marketing Agency**:
  - 998313 - Advertising Services
  - 998311 - Management Consulting
  - 998312 - Business Consulting
  - 998314 - Market Research
  - 998361 - IT Consulting
  - 998399 - Other Professional Services
- **Features**:
  - Quantity (invoice count) per SAC
  - Taxable value and tax breakdown
  - Ready for GSTR-1 HSN summary upload

#### 5. Rate-wise Summary

- **Purpose**: Tax breakdown by GST rate slab
- **GST Rates**: 0%, 5%, 12%, 18%, 28%
- **Features**:
  - Invoice count per rate
  - Taxable value breakdown
  - CGST/SGST/IGST split
  - Visual charts (bar and pie)

### GST API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/reports/gst/sales-register` | GSTR-1 sales register |
| `/api/reports/gst/purchase-register` | Purchase register with ITC |
| `/api/reports/gst/gstr3b-summary` | GSTR-3B monthly summary |
| `/api/reports/gst/hsn-summary` | HSN/SAC code summary |
| `/api/reports/gst/rate-summary` | Rate-wise tax summary |

---

## AI-Powered Features

### Overview

The application integrates with AI services (OpenAI GPT-4 and Google Gemini) to provide intelligent content generation for proposals and contracts.

### AI Proposal Assistant

- **Smart Content Generation**:
  - Generates professional proposal content
  - Based on client requirements and project scope
  - Customizable tone and style
  - Multiple revision options

- **Features**:
  - Auto-fill proposal sections
  - Service descriptions
  - Pricing recommendations
  - Terms and conditions
  - Timeline suggestions

### AI Contract Assistant

- **Contract Generation**:
  - Creates comprehensive contract documents
  - Legal language and clauses
  - Project scope definition
  - Payment terms
  - Deliverables and milestones

- **Customization**:
  - Industry-specific templates
  - Adjustable terms
  - Compliance requirements
  - Intellectual property clauses

### API Integration

#### Supported AI Providers

| Provider | Model | Use Case |
|----------|-------|----------|
| OpenAI | GPT-4 | Proposal and contract generation |
| Google Gemini | Gemini Pro | Alternative AI generation |

#### Configuration

- **Settings → API Keys**:
  - Enter API keys for each provider
  - Test connection before saving
  - Connection status indicators
  - Secure storage with masking

### Email Integration

#### Resend API

- **Email Sending Capabilities**:
  - Send proposals to clients
  - Send contracts for signing
  - Automated notifications
  - Custom email templates

- **Configuration**:
  - Resend API key setup
  - Domain verification
  - Email template management

---

## Settings & Configuration

The Settings page provides comprehensive configuration options organized into tabs:

### Settings Tabs Overview

| Tab | Purpose |
|-----|---------|
| Services | Manage service catalog |
| Categories | Expense categories |
| Job Roles | Team job roles |
| Leave Policies | Leave quotas and rules |
| Slack | Slack integration settings |
| API Keys | AI and email API configuration |
| Company | Company profile and branding |

### Services Management

- **Service Catalog**:
  - Create and manage agency services
  - Service name and description
  - Default pricing
  - Service categories (SEO, Social Media, Content, Advertising, Design, Development, Consulting, Other)
  - Unit types (Monthly, Project, Hourly)
  - Active/Inactive status

### Expense Categories

- **Category Management**:
  - Create custom categories
  - Edit category names and codes
  - Group categories for organization
  - Load default categories button
  - Category codes for reporting

- **Default Categories**:
  - Business Operations
  - Marketing & Advertising
  - Technology & Software
  - Travel & Entertainment
  - And more...

### Job Roles Management

- **Job Role Features**:
  - Create job roles
  - Edit job roles
  - Activate/deactivate roles
  - Role descriptions

- **Pre-defined Roles**:
  - Design roles (Graphic Designer, UI/UX Designer, etc.)
  - Development roles (Frontend, Backend, Full Stack, etc.)
  - Video & Production roles
  - Digital Marketing roles
  - Management roles
  - And many more...

- **Load Defaults**: One-click import of common agency roles

### Leave Policies

- **Policy Configuration**:
  - Link leave types to job roles
  - Define annual quotas
  - Set carry forward limits
  - Activate/deactivate policies

- **Leave Types**:
  - View available leave types
  - Create default leave types
  - Leave type codes and names

- **Default Policies Generator**:
  - Auto-create policies for all job roles
  - Based on standard leave entitlements
  - Bulk policy creation

### Slack Integration Settings

- **Connection Setup**:
  - Bot token configuration
  - Signing secret entry
  - Connection testing
  - Workspace name display

- **Attendance Configuration**:
  - Select attendance channel
  - Configure check-in keywords
  - Configure check-out keywords
  - Active/pause toggle

- **Management**:
  - Update credentials
  - Disconnect integration
  - View connection status

### API Keys Settings

- **AI Integration**:
  - OpenAI API key (GPT-4)
  - Google Gemini API key
  - Connection testing
  - Status indicators

- **Email Integration**:
  - Resend API key
  - Email service configuration
  - Connection verification

- **Security Features**:
  - Masked key display
  - Change key functionality
  - Secure storage

### Company Profile

- **Company Information**:
  - Company name
  - Brand logo upload
  - Address (multi-line)
  - City, State, Postal Code, Country
  - Email and phone
  - Tax ID / GST Number

- **Banking Details**:
  - Bank name
  - Account number
  - IFSC / Swift code
  - Account holder name

- **UPI & Online Payment**:
  - UPI ID (auto QR generation)
  - Payment link
  - Payment gateway details

- **Invoice Settings**:
  - Terms and conditions
  - Payment notes
  - Authorized signatory name
  - Authorized signatory title

---

## Public Features

### Public Client Onboarding

- **URL Format**: `/onboarding/:token`
- **Access**: Public (no authentication)
- **Features**:
  - Client information display
  - Multi-step onboarding form
  - Save progress
  - Submit onboarding
  - Completion status

### Public Team Member Onboarding

- **URL Format**: `/team-onboarding/:token`
- **Access**: Public (no authentication)
- **Features**:
  - Team member information display
  - Multi-step onboarding form
  - Save progress
  - Submit onboarding
  - Completion status

---

## Technical Stack

### Frontend

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt
- **File Upload**: Cloudinary integration
- **QR Code Generation**: qrcode library
- **Number to Words**: to-words library

### Database Schema

- **Collections**:
  - Users
  - Clients
  - Projects
  - Invoices
  - Payments
  - Vendors
  - Expenses
  - Expense Categories
  - Team Members
  - Salary Payments
  - Job Roles
  - Proposals
  - Contracts
  - Monthly Reports
  - Client Onboarding Data
  - Client Digital Assets
  - Company Profile
  - Attendance
  - Leave Types
  - Leave Policies
  - Leave Requests
  - Leave Balances
  - Slack Settings
  - Slack Attendance Logs
  - API Settings
  - Services

### API Architecture

- **RESTful API** design
- **Protected Routes**: JWT authentication middleware
- **Public Routes**: Client and team onboarding endpoints
- **Error Handling**: Comprehensive error responses
- **Validation**: Zod schema validation

---

## Key Features Summary

### Financial Management
✅ Invoice creation and management
✅ Payment tracking and recording
✅ Expense tracking and categorization
✅ Vendor management
✅ Salary payment tracking
✅ Financial dashboard with profit analysis
✅ Tax calculations
✅ Multiple payment methods support
✅ Revenue by Client reports
✅ Invoice Aging reports
✅ Expense Tracking reports
✅ Profit by Client analysis
✅ Profit & Loss (P&L) Statement
✅ Balance Sheet
✅ Cash Flow Statement
✅ General Ledger (for audits & CA)
✅ Trial Balance (pre-tax filing verification)
✅ Fixed Asset Register with depreciation
✅ GST Compliance Reports (GSTR-1, GSTR-3B)
✅ Sales Register for GST filing
✅ Purchase Register with ITC tracking
✅ HSN/SAC Summary
✅ Rate-wise GST Summary
✅ Export reports to CSV

### Client Management
✅ Complete client lifecycle management
✅ Client onboarding (internal and public)
✅ Project linking
✅ Invoice history
✅ Proposal and contract management
✅ Monthly reporting

### Team Management
✅ Team member management
✅ Employee onboarding (internal and public)
✅ Salary payment tracking
✅ Job role management
✅ Employment type tracking

### Attendance & Leave Management
✅ Attendance tracking (manual and automated)
✅ Working hours and overtime calculation
✅ Slack integration for automatic attendance
✅ Leave types and policies
✅ Leave request management
✅ Leave balance tracking
✅ Approval workflow

### Slack Integration
✅ Automatic check-in/check-out detection
✅ Keyword-based monitoring
✅ Channel-specific tracking
✅ Bot reactions for acknowledgment
✅ Secure webhook verification
✅ Team member mapping

### AI-Powered Features
✅ AI proposal generation (OpenAI/Gemini)
✅ AI contract generation
✅ Smart content suggestions
✅ Multiple AI provider support

### Marketing Tools
✅ Proposal creation and management
✅ Contract management
✅ Monthly report generation
✅ Client communication tracking
✅ Email integration (Resend)

### User Experience
✅ Clean, modern UI
✅ Responsive design
✅ Multi-step forms
✅ Progress tracking
✅ Save and continue functionality
✅ Search and filtering
✅ Status badges and indicators
✅ Toast notifications  

---

## Future Enhancements (Planned)

- **Learning Hub**: Knowledge base and training resources
- **Client Portal**: Client-facing portal for reports and assets
- **Advanced Reporting**: Custom report builder with data visualization
- **Document Management**: Enhanced file storage and organization
- **Role-Based Access Control**: Granular permissions
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Business intelligence and insights
- **Biometric Integration**: Fingerprint/face recognition attendance
- **Geolocation Tracking**: Location-based attendance verification
- **Slack Notifications**: Automated reminders and alerts via Slack
- **Calendar Integration**: Google/Outlook calendar sync
- **Time Tracking**: Project-based time logging

---

## Getting Started

### Installation

```bash
npm install
npm run dev
```

### Default Login

```
Email: admin@agency.local
Password: admin123
```

### Database

The application automatically seeds sample data on startup including:
- Admin user
- Sample clients
- Sample projects
- Sample invoices
- Sample payments
- Sample vendors
- Sample expenses
- Sample team members
- Sample job roles

---

**Last Updated**: November 2025
**Version**: 3.1
**Status**: Production Ready

---

## Changelog

### Version 3.1 (December 2025)
- Added Financial Reports module with 15 report types:
  - Revenue by Client
  - Invoice Aging Report
  - Expense Tracking
  - Profit by Client/Project
  - Profit & Loss (P&L) Statement
  - Balance Sheet
  - Cash Flow Statement
  - General Ledger (master book for audits)
  - Trial Balance (CA verification)
  - Fixed Asset Register (depreciation tracking)
- Added GST Compliance Reports for Indian tax filing:
  - GSTR-3B Summary (monthly return)
  - Sales Register (GSTR-1 outward supplies)
  - Purchase Register (Input Tax Credit)
  - HSN/SAC Summary
  - Rate-wise Summary
- Added Fixed Asset management with CRUD operations
- Added automatic depreciation calculation (SLM & WDV methods)
- Added GST calculation with CGST/SGST/IGST breakdown
- Added ITC eligibility tracking based on vendor GSTIN
- Added date range filtering for all financial reports
- Added CSV export functionality for reports
- Added interactive charts with Recharts visualization

### Version 3.0 (November 2025)
- Added Slack integration for automatic attendance tracking
- Added Attendance Management module
- Added Leave Management with policies and balances
- Added AI-powered proposal and contract generation
- Added API Keys settings for OpenAI, Gemini, and Resend
- Added Services management in Settings
- Enhanced Settings page with new tabs
- Improved Team Member dialog with Slack user mapping

### Version 2.0 (2024)
- Initial release with core CRM features
- Client, Project, Invoice, and Payment management
- Team and Payroll management
- Vendor and Expense tracking
- Proposals, Contracts, and Monthly Reports
- Public onboarding for clients and team members

