# Agency Control Center

## Overview

Agency Control Center is an internal web application for digital marketing agencies to manage clients, projects, invoices, and payments. The application follows a spreadsheet-like design philosophy inspired by Google Sheets, Airtable, and Linear, prioritizing data density and efficient workflows over visual flair.

The system is currently in Phase 1, implementing core client management and invoicing features, with placeholders for future expansion including vendor management, expense tracking, salary payments, client portals, and learning resources.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript and Vite for build tooling
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod validation for form handling

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS with custom design tokens for consistent styling
- Custom spacing system using Tailwind units (2, 4, 6, 8)
- Typography hierarchy with Inter font family and JetBrains Mono for numbers
- Status badge system with color-coded states for clients, projects, and invoices

**Layout Pattern:**
- Fixed top navigation bar (height: 16)
- Fixed left sidebar navigation (width: 64)
- Responsive design with mobile-first considerations using custom hooks
- SidebarProvider context for managing sidebar state across the application

**State Management:**
- Authentication state managed via React Context (AuthProvider)
- Server state cached and synchronized via TanStack Query
- Local storage for JWT token persistence
- Form state isolated to individual components using React Hook Form

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js for REST API server
- TypeScript with ES modules for type safety
- JWT-based authentication with bcrypt password hashing
- Nanoid for generating unique identifiers

**API Design:**
- RESTful JSON endpoints organized by resource type
- Middleware-based authentication using Bearer tokens
- Request/response logging with duration tracking
- Error handling with appropriate HTTP status codes

**Authentication Flow:**
- Simple email/password login (no public signup)
- JWT tokens issued on successful authentication
- Token validation middleware for protected routes
- 401/403 responses trigger automatic logout and redirect to login

**Data Storage:**
- In-memory storage implementation using TypeScript interfaces
- Storage abstraction layer (IStorage interface) for easy database migration
- Designed to be replaced with PostgreSQL using Drizzle ORM
- Schema definitions shared between client and server via `@shared/schema`

**Server-Side Rendering:**
- Vite integration for development with HMR
- Custom middleware for serving React application
- Production build serves static assets from dist/public

### Data Models and Business Logic

**Core Entities:**
- **Users:** Admin/Manager/Staff roles with hashed passwords
- **Clients:** Contact information, status tracking (Active/Inactive/Archived), and relationship metrics
- **Projects:** Linked to clients, with status workflow (Active/On Hold/Completed/Cancelled)
- **Invoices:** Line items, tax calculations, automatic numbering, and status management
- **Payments:** Linked to invoices with automatic status updates

**Business Rules:**
- Invoice status automatically transitions: DRAFT → SENT → PAID/OVERDUE
- Payment recording automatically updates invoice status to PAID
- Invoice numbering follows sequential pattern (INV-001, INV-002, etc.)
- Client statistics include total invoiced, paid, and outstanding amounts

**Validation:**
- Zod schemas for runtime validation on both client and server
- Shared schema definitions ensure consistency across stack
- Form-level validation with user-friendly error messages

### External Dependencies

**Database (Planned):**
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Migration system configured via `drizzle.config.ts`
- Currently using in-memory storage with identical interface
- Schema ready for migration in `shared/schema.ts`

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui components built on top of Radix UI
- Lucide React for consistent iconography
- date-fns for date formatting and manipulation

**Development Tools:**
- Vite for fast development builds and HMR
- Replit-specific plugins for runtime error overlay and dev banner
- TypeScript compiler with strict mode enabled
- Path aliases configured for clean imports (@/, @shared/, @assets/)

**Production Deployment:**
- esbuild for server bundling
- Vite for optimized client bundle
- Environment variables for configuration (DATABASE_URL, SESSION_SECRET)
- Separation of development and production modes