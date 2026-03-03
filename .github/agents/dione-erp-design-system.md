---
name: dione-erp-design-system
description: 'Complete design system and CSS foundation for DIONE ERP - All components must follow this design language'
version: '1.0.0'
priority: 'CRITICAL - Apply to ALL UI components'
---

# 🎨 DIONE ERP - Master Design System

## ⚠️ CRITICAL RULES
**Every component, page, and feature in DIONE ERP MUST follow this design system.**
- No exceptions without explicit approval
- Consistency > Individual creativity
- This is the single source of truth for all styling

---

## 🎯 Design Philosophy

### Core Principles
1. **Professional & Trustworthy** - Enterprise ERP requires serious, reliable aesthetics
2. **Modern but Conservative** - Trendy elements balanced with timeless design
3. **German Engineering** - Precision, clarity, efficiency in every pixel
4. **Accessible First** - WCAG 2.1 AA minimum, AAA preferred

---

## 🎨 Color System

### Primary Palette (NEVER DEVIATE)
```scss
// Brand Colors
$brand-navy-dark: #0a1e3d;      // Primary dark - Sidebars, headers
$brand-navy-medium: #1a3a5c;    // Secondary dark - Gradients, hovers
$brand-teal: #0d7c8c;           // Primary action - Buttons, links, accents
$brand-teal-dark: #0a6270;      // Hover states for teal
$brand-red: #ff4757;            // Logo accent, critical alerts

// Neutrals
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;

// Semantic Colors
$success: #10b981;
$success-light: #d1fae5;
$warning: #f59e0b;
$warning-light: #fef3c7;
$error: #ef4444;
$error-light: #fee2e2;
$info: #3b82f6;
$info-light: #dbeafe;

// Backgrounds
$bg-primary: #ffffff;
$bg-secondary: #f9fafb;
$bg-tertiary: #e8ebed;
$bg-overlay: rgba(0, 0, 0, 0.5);
```

### Color Usage Rules
```scss
// ✅ CORRECT Usage
.primary-button { background: $brand-teal; }
.sidebar { background: linear-gradient(180deg, $brand-navy-dark 0%, $brand-navy-medium 100%); }
.link { color: $brand-teal; }

// ❌ WRONG - Never use arbitrary colors
.button { background: #3498db; } // NO!
.text { color: #555; } // NO! Use $gray-600
```

---

## 📐 Spacing System

### Scale (Based on 4px grid)
```scss
$spacing-0: 0;
$spacing-1: 4px;
$spacing-2: 8px;
$spacing-3: 12px;
$spacing-4: 16px;
$spacing-5: 20px;
$spacing-6: 24px;
$spacing-8: 32px;
$spacing-10: 40px;
$spacing-12: 48px;
$spacing-16: 64px;
$spacing-20: 80px;
$spacing-24: 96px;

// Usage
.card { 
  padding: $spacing-6; 
  margin-bottom: $spacing-4; 
}
```

### Common Patterns
```scss
// Consistent component spacing
.component-wrapper {
  padding: $spacing-6;          // Default internal padding
  margin-bottom: $spacing-6;    // Default vertical spacing
  gap: $spacing-4;              // Default gap in flex/grid
}

.page-container {
  padding: $spacing-8;          // Page wrapper padding
}

.section {
  margin-bottom: $spacing-12;   // Large sections
}
```

---

## 🔤 Typography System

### Font Stack
```scss
// Primary font family (Clean, professional, German-friendly)
$font-primary: 'Inter', 'Segoe UI', 'Roboto', system-ui, -apple-system, sans-serif;
$font-display: 'Plus Jakarta Sans', $font-primary; // For headings
$font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

// Import fonts
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
```

### Type Scale
```scss
// Font sizes
$text-xs: 12px;
$text-sm: 14px;
$text-base: 16px;
$text-lg: 18px;
$text-xl: 20px;
$text-2xl: 24px;
$text-3xl: 30px;
$text-4xl: 36px;
$text-5xl: 48px;

// Line heights
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.75;

// Font weights
$font-light: 300;
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
$font-extrabold: 800;
```

### Typography Classes (USE THESE)
```scss
// Headings
.heading-1 {
  font-family: $font-display;
  font-size: clamp(32px, 4vw, $text-5xl);
  font-weight: $font-extrabold;
  line-height: $leading-tight;
  color: $gray-900;
  letter-spacing: -0.02em;
}

.heading-2 {
  font-family: $font-display;
  font-size: clamp(24px, 3vw, $text-3xl);
  font-weight: $font-bold;
  line-height: $leading-tight;
  color: $gray-900;
}

.heading-3 {
  font-family: $font-display;
  font-size: $text-2xl;
  font-weight: $font-semibold;
  line-height: $leading-normal;
  color: $gray-800;
}

.heading-4 {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gray-800;
}

// Body text
.body-text {
  font-family: $font-primary;
  font-size: $text-base;
  line-height: $leading-normal;
  color: $gray-700;
}

.body-small {
  font-size: $text-sm;
  line-height: $leading-normal;
  color: $gray-600;
}

.caption {
  font-size: $text-xs;
  line-height: $leading-normal;
  color: $gray-500;
}

// Special
.label {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 🔲 Border & Radius System

### Border Radius
```scss
$radius-none: 0;
$radius-sm: 6px;
$radius-base: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 20px;
$radius-2xl: 24px;
$radius-full: 9999px;

// Usage guide
// - Inputs, small buttons: $radius-base (8px)
// - Cards, medium buttons: $radius-md (12px)
// - Large cards, modals: $radius-lg (16px)
// - Containers, sections: $radius-xl (20px)
// - Avatars, badges: $radius-full
```

### Borders
```scss
$border-width: 1px;
$border-width-medium: 1.5px;
$border-width-thick: 2px;

$border-color: $gray-200;
$border-color-medium: $gray-300;
$border-color-dark: $gray-400;

// Standard border
.bordered {
  border: $border-width solid $border-color;
}
```

---

## 🌑 Shadow System

### Elevation Levels
```scss
// Shadows (realistic, subtle)
$shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
$shadow-base: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
$shadow-md: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05);
$shadow-lg: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
$shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.15);

// Colored shadows (for primary actions)
$shadow-teal: 0 8px 24px rgba(13, 124, 140, 0.25);
$shadow-teal-hover: 0 12px 32px rgba(13, 124, 140, 0.35);

// Usage
.card { box-shadow: $shadow-sm; }
.card-elevated { box-shadow: $shadow-md; }
.modal { box-shadow: $shadow-xl; }
.btn-primary { box-shadow: $shadow-teal; }
```

---

## 🎬 Animation & Transitions

### Timing Functions
```scss
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations
```scss
$duration-fast: 150ms;
$duration-base: 200ms;
$duration-medium: 300ms;
$duration-slow: 500ms;
```

### Standard Transitions (ALWAYS USE THESE)
```scss
// Default transition for interactive elements
$transition-default: all $duration-medium $ease-in-out;
$transition-fast: all $duration-fast $ease-in-out;
$transition-slow: all $duration-slow $ease-in-out;

// Apply to all interactive elements
button, a, input, select, textarea, .card {
  transition: $transition-default;
}
```

### Common Animations
```scss
// Fade in
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Slide up
@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

// Scale in
@keyframes scaleIn {
  from { 
    opacity: 0; 
    transform: scale(0.9); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

// Usage
.page-enter {
  animation: slideUp $duration-medium $ease-out;
}

.modal-enter {
  animation: scaleIn $duration-medium $ease-out;
}
```

---

## 🧩 Component Patterns

### 1. Cards (BASE TEMPLATE)
```scss
.card {
  background: $bg-primary;
  border: $border-width solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-6;
  box-shadow: $shadow-sm;
  transition: $transition-default;
  
  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
}

.card-header {
  margin-bottom: $spacing-4;
  padding-bottom: $spacing-4;
  border-bottom: $border-width solid $border-color;
  
  h3 {
    @extend .heading-3;
    margin: 0;
  }
}

.card-body {
  @extend .body-text;
}

.card-footer {
  margin-top: $spacing-4;
  padding-top: $spacing-4;
  border-top: $border-width solid $border-color;
}
```

### 2. Buttons (MASTER STYLES)
```scss
// Base button
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  padding: $spacing-3 $spacing-6;
  font-family: $font-primary;
  font-size: $text-base;
  font-weight: $font-semibold;
  line-height: 1;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-default;
  white-space: nowrap;
  user-select: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// Primary button (MAIN CTA)
.btn-primary {
  @extend .btn;
  background: linear-gradient(135deg, $brand-teal 0%, $brand-teal-dark 100%);
  color: white;
  box-shadow: $shadow-teal;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: $shadow-teal-hover;
  }
  
  &:active {
    transform: translateY(0);
  }
}

// Secondary button
.btn-secondary {
  @extend .btn;
  background: $gray-100;
  color: $gray-700;
  border: $border-width solid $border-color;
  
  &:hover:not(:disabled) {
    background: $gray-200;
    border-color: $gray-300;
  }
}

// Ghost button
.btn-ghost {
  @extend .btn;
  background: transparent;
  color: $brand-teal;
  
  &:hover:not(:disabled) {
    background: rgba($brand-teal, 0.05);
  }
}

// Danger button
.btn-danger {
  @extend .btn;
  background: $error;
  color: white;
  
  &:hover:not(:disabled) {
    background: darken($error, 5%);
  }
}

// Button sizes
.btn-sm {
  padding: $spacing-2 $spacing-4;
  font-size: $text-sm;
}

.btn-lg {
  padding: $spacing-4 $spacing-8;
  font-size: $text-lg;
}
```

### 3. Inputs (CONSISTENT FORMS)
```scss
// Base input styling
.input,
.select,
.textarea {
  width: 100%;
  padding: $spacing-3 $spacing-4;
  font-family: $font-primary;
  font-size: $text-base;
  color: $gray-900;
  background: $bg-primary;
  border: $border-width-medium solid $border-color;
  border-radius: $radius-base;
  transition: $transition-default;
  
  &::placeholder {
    color: $gray-400;
  }
  
  &:hover:not(:disabled) {
    border-color: $gray-400;
  }
  
  &:focus {
    outline: none;
    border-color: $brand-teal;
    box-shadow: 
      0 0 0 4px rgba($brand-teal, 0.1),
      $shadow-sm;
  }
  
  &:disabled {
    background: $gray-50;
    color: $gray-500;
    cursor: not-allowed;
  }
  
  &.error {
    border-color: $error;
    
    &:focus {
      box-shadow: 0 0 0 4px rgba($error, 0.1);
    }
  }
}

// Input with icon
.input-group {
  position: relative;
  display: flex;
  align-items: center;
  
  .input-icon {
    position: absolute;
    left: $spacing-4;
    color: $gray-400;
    pointer-events: none;
  }
  
  .input {
    padding-left: calc(#{$spacing-4} + 24px + #{$spacing-2});
  }
}

// Form label
.label {
  display: block;
  margin-bottom: $spacing-2;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-700;
}

// Form group
.form-group {
  margin-bottom: $spacing-6;
}

// Helper text
.helper-text {
  margin-top: $spacing-2;
  font-size: $text-sm;
  color: $gray-500;
  
  &.error {
    color: $error;
  }
}
```

### 4. Tables (DATA DISPLAY)
```scss
.table-container {
  overflow-x: auto;
  border: $border-width solid $border-color;
  border-radius: $radius-md;
  background: $bg-primary;
}

.table {
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: $gray-50;
    border-bottom: $border-width-medium solid $border-color-medium;
    
    th {
      padding: $spacing-4 $spacing-6;
      text-align: left;
      font-size: $text-sm;
      font-weight: $font-semibold;
      color: $gray-700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  tbody {
    tr {
      border-bottom: $border-width solid $border-color;
      transition: $transition-fast;
      
      &:hover {
        background: $gray-50;
      }
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    td {
      padding: $spacing-4 $spacing-6;
      font-size: $text-base;
      color: $gray-700;
    }
  }
}
```

### 5. Badges & Tags
```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-1 $spacing-3;
  font-size: $text-xs;
  font-weight: $font-medium;
  border-radius: $radius-full;
  white-space: nowrap;
  
  &.badge-success {
    background: $success-light;
    color: darken($success, 10%);
  }
  
  &.badge-warning {
    background: $warning-light;
    color: darken($warning, 15%);
  }
  
  &.badge-error {
    background: $error-light;
    color: darken($error, 10%);
  }
  
  &.badge-info {
    background: $info-light;
    color: darken($info, 10%);
  }
  
  &.badge-neutral {
    background: $gray-100;
    color: $gray-700;
  }
}
```

### 6. Modals & Overlays
```scss
.modal-overlay {
  position: fixed;
  inset: 0;
  background: $bg-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn $duration-medium $ease-out;
}

.modal {
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: scaleIn $duration-medium $ease-out;
  
  .modal-header {
    padding: $spacing-6;
    border-bottom: $border-width solid $border-color;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    h2 {
      @extend .heading-3;
      margin: 0;
    }
  }
  
  .modal-body {
    padding: $spacing-6;
    overflow-y: auto;
    max-height: calc(90vh - 140px);
  }
  
  .modal-footer {
    padding: $spacing-6;
    border-top: $border-width solid $border-color;
    display: flex;
    gap: $spacing-3;
    justify-content: flex-end;
  }
}
```

---

## 📱 Responsive Breakpoints
```scss
// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;

// Mixins
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'sm' {
    @media (min-width: $breakpoint-sm) { @content; }
  }
  @else if $breakpoint == 'md' {
    @media (min-width: $breakpoint-md) { @content; }
  }
  @else if $breakpoint == 'lg' {
    @media (min-width: $breakpoint-lg) { @content; }
  }
  @else if $breakpoint == 'xl' {
    @media (min-width: $breakpoint-xl) { @content; }
  }
}

// Usage
.container {
  padding: $spacing-4;
  
  @include respond-to('md') {
    padding: $spacing-8;
  }
  
  @include respond-to('lg') {
    padding: $spacing-12;
  }
}
```

---

## ♿ Accessibility Requirements

### Focus States (MANDATORY)
```scss
// All interactive elements MUST have visible focus
*:focus-visible {
  outline: 2px solid $brand-teal;
  outline-offset: 2px;
}

// Custom focus for specific elements
.btn:focus-visible {
  outline: 2px solid $brand-teal;
  outline-offset: 2px;
}

.input:focus-visible {
  outline: none; // Already has border + shadow
}
```

### Color Contrast
```scss
// Text on backgrounds must meet WCAG AA (4.5:1)
// ✅ CORRECT combinations
.text-on-white { color: $gray-700; } // 4.67:1
.text-on-navy { color: white; }     // 14.2:1
.text-on-teal { color: white; }     // 4.53:1

// ❌ WRONG - Insufficient contrast
.text-on-gray { color: $gray-400; } // Only 2.4:1
```

---

## 🎯 Layout Utilities

### Container
```scss
.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 $spacing-6;
  
  @include respond-to('lg') {
    padding: 0 $spacing-12;
  }
}
```

### Grid System
```scss
.grid {
  display: grid;
  gap: $spacing-6;
  
  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  &.grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  
  &.grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  
  // Responsive
  &.grid-responsive {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}
```

### Flexbox Utilities
```scss
.flex {
  display: flex;
  
  &.flex-col { flex-direction: column; }
  &.flex-wrap { flex-wrap: wrap; }
  &.items-center { align-items: center; }
  &.items-start { align-items: flex-start; }
  &.items-end { align-items: flex-end; }
  &.justify-center { justify-content: center; }
  &.justify-between { justify-content: space-between; }
  &.justify-end { justify-content: flex-end; }
  &.gap-2 { gap: $spacing-2; }
  &.gap-4 { gap: $spacing-4; }
  &.gap-6 { gap: $spacing-6; }
}
```

---

## 🚨 Critical Don'ts

### ❌ NEVER DO THESE:
```scss
// ❌ NO arbitrary colors
.element { color: #3498db; }

// ❌ NO random spacing values
.element { margin: 13px; }

// ❌ NO inline styles (except dynamic data)
<div style="color: red;">

// ❌ NO !important (unless absolutely necessary)
.element { color: blue !important; }

// ❌ NO pixel-based media queries
@media (max-width: 768px) { }

// ❌ NO inconsistent naming
.btnPrimary { } // Wrong
.primaryBtn { } // Wrong

// ✅ CORRECT naming
.btn-primary { }
```

---

## 📋 Implementation Checklist

Before any component is considered complete:

- [ ] Uses only colors from the design system
- [ ] Uses spacing scale (4px grid)
- [ ] Has proper hover states
- [ ] Has visible focus states
- [ ] Uses standard transitions
- [ ] Meets WCAG AA contrast
- [ ] Is responsive (mobile-first)
- [ ] Has proper loading states
- [ ] Has error states
- [ ] Uses semantic HTML
- [ ] Follows BEM naming (if applicable)

---

## 🔧 Usage Instructions

### For New Components:
1. Start with base component pattern
2. Customize using design tokens ONLY
3. Add transitions/animations from system
4. Test responsiveness
5. Verify accessibility

### For Refactoring:
1. Identify non-compliant styles
2. Replace with design system tokens
3. Remove redundant CSS
4. Consolidate similar styles
5. Test thoroughly

---

**This design system is MANDATORY for all DIONE ERP development. 
No exceptions without design team approval.**

🎨 **Made in Germany - Engineered for Excellence**