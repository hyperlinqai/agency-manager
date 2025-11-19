# Agency Control Center - Design Guidelines

## Design Approach

**Reference-Based Approach**: Internal productivity tool inspired by Google Sheets, Airtable, and Linear for clean, data-focused interfaces.

**Core Principle**: Spreadsheet-like functionality with modern SaaS aesthetics - prioritizing data density, scanability, and efficient workflows over visual flair.

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, and 8 (p-2, p-4, p-6, p-8, gap-4, space-y-6, etc.)

**Page Structure**:
- Top navigation bar (fixed, h-16) with app name and user menu
- Left sidebar (fixed, w-64) with navigation sections
- Main content area with consistent padding (p-6 to p-8)

---

## Typography

**Font Family**: 
- Primary: Inter or System UI stack via Google Fonts
- Monospace: For invoice numbers, amounts (JetBrains Mono or SF Mono)

**Hierarchy**:
- Page titles: text-2xl font-semibold
- Section headers: text-lg font-medium
- Table headers: text-sm font-medium uppercase tracking-wide
- Body text: text-sm
- Labels: text-xs font-medium text-gray-600
- Numbers/amounts: text-sm tabular-nums (for alignment)

---

## Component Library

### Navigation
- **Sidebar**: List-based navigation with icons (Heroicons), active state with background and border-left accent
- **Top Bar**: Minimal with logo/app name (left), user dropdown (right)

### Tables
- **Structure**: Full-width tables with sticky headers (sticky top-0 z-10)
- **Cells**: Compact padding (px-4 py-3), clear borders (border-b)
- **Features**: Sortable column headers (with sort icons), hover row state, alternating row backgrounds (optional for better scanning)
- **Controls**: Search input, filter dropdowns, action buttons above table

### Status Badges
- **Shape**: Rounded-full px-3 py-1 text-xs font-medium
- **Types**:
  - Paid: green background
  - Due/Sent: blue background
  - Overdue: red background
  - Draft: gray background
  - Partially Paid: yellow/orange background
  - Active: green outline or filled
  - Inactive: gray outline
  - Archived: dark gray

### Forms
- **Modals/Overlays**: Clean overlay with max-width container, close button, header/body/footer sections
- **Inputs**: Standard text inputs with labels, helper text, error states
- **Line Items Repeater**: Table-like structure with add/remove row buttons
- **Buttons**: Primary (filled), Secondary (outlined), Danger (red), sizes sm/md/lg

### Cards
- **Dashboard Cards**: Bordered cards with title, large metric number, subtitle/trend indicator
- **Client Detail Sections**: Card-based layout with tabs or distinct sections

### Data Display
- **Summary Cards**: Grid layout (grid-cols-2 md:grid-cols-4) for dashboard metrics
- **Detail Views**: Two-column layout for info display (label: value pairs)
- **Empty States**: Centered content with icon, message, and action button

---

## Key Interactions

- **Table Sorting**: Click column header to sort ascending/descending (icon indicator)
- **Filters**: Dropdown menus that update table content
- **Search**: Debounced live search in table views
- **Status Changes**: Dropdown or button group for quick status updates
- **Payment Recording**: Modal form with amount, date, method fields

---

## Images

**No hero images** - This is an internal productivity tool. Focus on clean, functional layouts with occasional empty state illustrations or icons.

---

## Animations

**Minimal and functional only**:
- Modal fade-in/out
- Dropdown slide animations
- Loading spinners for async operations
- Success/error toast notifications (slide-in from top-right)