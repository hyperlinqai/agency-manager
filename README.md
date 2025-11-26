# Agency Control Center

A production-ready internal web application for digital marketing agencies to manage clients, projects, invoices, and payments.

## Features

### Phase 1 (Current Implementation)

- **User Authentication**: Simple email/password login with JWT tokens
- **Dashboard**: Financial overview with metrics and upcoming invoice tracking
- **Client Management**: Full CRUD operations for client data with status tracking
- **Project Management**: Create and track projects linked to clients
- **Invoice System**: Complete invoicing with line items, tax calculations, and automatic invoice numbering
- **Payment Tracking**: Record payments and automatically update invoice status
- **Status Workflows**: Automatic status management (DRAFT → SENT → PAID/OVERDUE)

### Future Phases

- Vendors & Expenses Management
- Salary Payments
- Client Portal Integration
- Team & Learning Hub
- Client Offboarding/Archiving

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query (React Query)
- **Auth**: JWT with bcrypt password hashing
- **Database**: MongoDB

## Getting Started

### Prerequisites

- Node.js 20+ installed

### Installation

To run locally, install dependencies and start the development server:

```bash
npm install
npm run dev
```

When running locally the application will start on `http://localhost:5000` (or the port set in `PORT`).

### Default Login Credentials

```
Email: admin@agency.local
Password: admin123
```

## Database Seeding

The application automatically seeds the database with sample data on startup, including:

- 1 admin user
- 5 sample clients (various statuses)
- 4 sample projects
- 6 sample invoices (demonstrating all statuses: DRAFT, SENT, PAID, OVERDUE, PARTIALLY_PAID)
- Sample payments

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/           # Utilities and configurations
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface
│   └── seed.ts            # Database seeding logic
├── shared/                # Shared types and schemas
│   └── schema.ts          # Zod schemas and TypeScript types
└── design_guidelines.md   # UI/UX design guidelines
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login

### Clients
- `GET /api/clients` - List all clients (with filtering)
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `PUT /api/clients/:id/status` - Update client status

### Projects
- `GET /api/projects` - List all projects (filterable by client)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project

### Invoices
- `GET /api/invoices` - List all invoices (with filtering)
- `GET /api/invoices/upcoming` - Get upcoming invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/status` - Update invoice status

### Payments
- `GET /api/invoices/:id/payments` - Get payments for invoice
- `POST /api/invoices/:id/payments` - Record new payment

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard metrics

## Invoice Status Logic

The system automatically manages invoice statuses based on payments and due dates:

- **DRAFT**: Invoice created but not yet sent
- **SENT**: Invoice sent to client, awaiting payment
- **PARTIALLY_PAID**: Some payment received but balance remaining
- **PAID**: Fully paid (balanceDue = 0)
- **OVERDUE**: Past due date with outstanding balance

## Development

### Running the Application

```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) on port 5000.

### Environment Variables

- `DATABASE_URL`: MongoDB connection string (default: `mongodb://localhost:27017/mycrm`)
- `SESSION_SECRET`: Secret key for JWT signing (auto-generated in development)
- `PORT`: Server port (default: 5000)

## Design Principles

The application follows a clean, spreadsheet-like design aesthetic inspired by tools like Google Sheets and Linear. Key principles:

- **Data Density**: Efficient use of space with clear information hierarchy
- **Consistent Spacing**: Unified spacing scale (4, 6, 8 units)
- **Status Visualization**: Color-coded badges for quick status recognition
- **Responsive Tables**: Sticky headers, sortable columns, and clear data presentation
- **Minimal Animations**: Functional animations only (modals, dropdowns, toasts)

## License

Proprietary - Internal Use Only
