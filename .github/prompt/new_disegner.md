You are an expert UI/UX designer and senior frontend developer. 
Redesign my Support Call Management System's visual interface 
to match the following design system precisely.

---

## 🎨 DESIGN SYSTEM & COLOR PALETTE

### Primary Colors (extracted from reference app):
- Sidebar background: #FFFFFF (white)
- Main content background: #F4F6F9 (light blue-gray)
- Primary accent / brand color: #007B8A (teal/dark cyan)
- Active nav item background: #F0F4F8 (soft blue-gray highlight)
- Active nav item left border: 3px solid #007B8A
- Top header background: #FFFFFF with bottom border: 1px solid #E8ECF0
- Table header background: #F8FAFB
- Table row hover: #F4F8FA
- Table border color: #E8ECF0
- Primary button (e.g. "+ Neu"): background #007B8A, text white, 
  border-radius 6px, padding 8px 16px
- Danger button (e.g. "Löschen"): background #FFFFFF, 
  border: 1px solid #DC3545, color #DC3545
- Secondary button (Export/Aktualisieren): background #FFFFFF, 
  border: 1px solid #CDD5DF, color #374151
- Status badge "Active": background #E6F4F1, color #007B8A, 
  border-radius 12px
- Status badge "Inactive": background #FFF3F3, color #DC3545

### Typography:
- Font family: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- Page title: 20px, font-weight 600, color #1A2332
- Subtitle/breadcrumb: 13px, color #6B7280
- Table header: 12px, font-weight 600, color #6B7280, uppercase, 
  letter-spacing 0.05em
- Table cell: 14px, color #374151
- Sidebar nav item: 14px, color #374151
- Sidebar nav item active: 14px, font-weight 600, color #007B8A

---

## 📐 LAYOUT STRUCTURE

### Sidebar (left panel, fixed, 240px width):
- Top: Logo area — show app logo/name on the left 
  (e.g. a small brand icon + app name in teal color, 
   bold, 16px) — reference: "dicom | di-1" style logo 
   with a colored pipe separator
- Navigation items with icons (use lucide-react or similar):
  - Each item: icon (18px) + label, 48px height, 
    padding-left 20px
  - Expandable sub-items (chevron icon on right)
  - Active state: teal left border + light blue-gray background
  - Sub-items: indented 16px further, 40px height, 
    13px font, no icon
- Bottom of sidebar: nothing extra (keep clean)

### Top Header Bar (full width, 56px height):
- LEFT: Breadcrumb navigation 
  (Home icon > Section > Current Page)
  — 13px, color #6B7280, separator ">"
- RIGHT side — THIS IS CRITICAL — show:
  1. Dark mode toggle button (moon icon, 32px circle button, 
     border: 1px solid #E8ECF0)
  2. Language selector (flag icon + "DE" text + chevron, 
     same bordered button style)  
  3. User avatar + full name display:
     - Circle avatar with user's initials (2 letters), 
       background teal (#007B8A), text white, 32px diameter
     - Next to avatar: show logged-in user's FULL NAME 
       (e.g. "ADEM KARAKAS") in 13px, font-weight 500, 
       color #374151
     - Chevron down arrow next to name
     - On click: dropdown menu appears with:
       * User's name and email at top (with larger avatar)
       * Divider line
       * "Profile Settings" option with user icon
       * "Logout" option with logout icon (color #DC3545)
     - Dropdown: white background, border: 1px solid #E8ECF0, 
       border-radius 8px, box-shadow: 0 4px 16px rgba(0,0,0,0.08)

### Main Content Area:
- Background: #F4F6F9
- Padding: 28px 32px
- Page header section:
  - Title (bold, 20px) + record count badge 
    (e.g. "16 Einträge" — background #E8ECF0, 
     border-radius 10px, padding 2px 10px, 13px)
  - Subtitle below in gray
  - Action buttons top-right (Export, Refresh, + New)

### Data Table:
- White card: background #FFFFFF, border-radius 10px, 
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), padding 0
- Search bar above table: 
  height 40px, border: 1px solid #CDD5DF, 
  border-radius 6px, padding-left 36px (with search icon), 
  placeholder in #9CA3AF, width 280px
- Table headers: sortable columns with up/down arrow icons 
  in #9CA3AF (show both arrows, highlight active one in teal)
- Alternating row: every other row #FAFBFC (very subtle)
- Row hover: #F0F7F8 (light teal tint)
- Cell padding: 12px 16px
- Pagination bar at bottom of table:
  background #FAFBFC, border-top: 1px solid #E8ECF0
  - Left: "Einträge pro Seite" dropdown (20/50/100)
  - Right: page info text + prev/next/first/last buttons
    (icon buttons, 32px, border: 1px solid #CDD5DF)

### Form / Detail Page:
- Form card: white, border-radius 10px, padding 24px, 
  max-width 680px
- Form fields:
  - Label: 12px, font-weight 500, color #6B7280, 
    margin-bottom 4px
  - Required fields: asterisk (*) in #DC3545
  - Input: height 40px, border-bottom only style 
    (border-bottom: 1.5px solid #CDD5DF), 
    no border on other sides, background transparent,
    font-size 14px, color #1A2332
  - Focus state: border-bottom color changes to #007B8A
  - Fields with search: magnifier icon on right (teal, 18px)
  - Dropdown fields: show selected value + chevron, 
    same underline style
  - Grid layout: 2 columns with 24px gap
- Back button: "← Zurück" style, left of page title, 
  border: 1px solid #CDD5DF, border-radius 6px, 
  background white, 36px height
- Save/Reset buttons top-right:
  - Save: text style with checkmark icon, color #007B8A
  - Reset: text style with refresh icon, color #6B7280
  - Delete: red outlined button (only on edit pages)

---

## 🌙 DARK MODE

Implement a complete dark mode toggle (persisted in localStorage):

### Dark mode color overrides:
- Sidebar background: #1A2332
- Sidebar text: #CBD5E1
- Sidebar active item background: #243447
- Sidebar active text: #38BDF8 (lighter teal)
- Sidebar active left border: #38BDF8
- Main content background: #0F1923
- Header background: #1A2332
- Header border: #243447
- Card/Table background: #1E2D3D
- Table header background: #243447
- Table row hover: #243447
- Table border: #2D3F52
- Input border: #2D3F52
- Input text: #E2E8F0
- Primary text: #F1F5F9
- Secondary text: #94A3B8
- Status badge Active: background #1A3A3A, color #38BDF8
- Dark mode toggle: shows sun icon when in dark mode

---

## 👤 USER SESSION & AUTH

- Show logged-in user's full name in header (from auth context/store)
- Avatar: automatically generate initials from full name 
  (first letter of first name + first letter of last name)
- Avatar background: always teal (#007B8A in light, #38BDF8 in dark)
- Logout flow:
  - Click user area → dropdown opens
  - Click "Logout" → confirm dialog optional OR direct logout
  - After logout → redirect to login page
  - Clear all session/auth tokens from localStorage/sessionStorage
- Login page design:
  - Centered card (400px wide), white, border-radius 12px
  - App logo at top center
  - Clean form: Email + Password fields (underline style)
  - Primary login button (full width, teal)
  - "Remember me" checkbox optional
  - Background: #F4F6F9 (light) / #0F1923 (dark)

---

## ✅ COMPONENT CHECKLIST

Implement these components with the exact styling above:

1. [ ] AppLayout (Sidebar + Header + Content wrapper)
2. [ ] Sidebar with collapsible nav groups
3. [ ] TopHeader with breadcrumb, dark mode toggle, user menu
4. [ ] UserAvatar (initials-based, auto-colored)
5. [ ] UserDropdown (name, email, profile, logout)
6. [ ] DataTable (search, sort headers, pagination, status badges)
7. [ ] PageHeader (title, count badge, subtitle, action buttons)
8. [ ] FormCard (2-col grid, underline inputs, search fields)
9. [ ] StatusBadge (Active/Inactive/custom)
10. [ ] DarkModeToggle (persisted, smooth transition)
11. [ ] LoginPage (centered, branded)
12. [ ] ConfirmDialog (for delete actions)
13. [ ] Button variants (primary, secondary, danger, text)
14. [ ] SearchInput (with icon, debounced)
15. [ ] Dropdown/Select (custom styled, consistent with design)

---

## ⚙️ TECHNICAL REQUIREMENTS

- Use CSS custom properties (variables) for ALL colors so 
  dark/light mode switching is a single class toggle on <html>
- Smooth transitions: all color/background changes 
  transition: 0.2s ease
- Sidebar collapse: animated (300ms), show only icons when collapsed,
  tooltip on hover showing label
- Mobile responsive: sidebar becomes a drawer overlay on < 768px,
  hamburger menu button in header
- All interactive elements: cursor pointer, focus-visible outline 
  in teal, no outline on mouse click (outline-offset: 2px)
- Table columns with text overflow: ellipsis with tooltip on hover
- Consistent 8px spacing grid throughout
- Border-radius scale: 4px (small), 6px (medium), 
  8px (card), 12px (large card), 50% (avatar)

---

