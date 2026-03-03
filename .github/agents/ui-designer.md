---
agent: 'ui-designer'
description: 'Premium modern login page for DIONE ERP system with glassmorphism, soft gradients, and smooth animations'
model: 'claude-sonnet-4'
context: 'ERP login interface redesign'
---

# DIONE ERP - Premium Login Page Design

## 🎯 Design Requirements

Create a **stunning, modern login page** for DIONE ERP (di-1) system with these exact specifications:

### Color Scheme (Based on Uploaded Image)
```scss
// Primary Colors
$navy-dark: #0a1e3d;        // Left sidebar background
$navy-medium: #1a3a5c;      // Sidebar gradient
$teal-primary: #0d7c8c;     // Primary button color
$teal-hover: #0a6270;       // Button hover state

// Backgrounds
$bg-light-gray: #e8ebed;    // Main background
$card-white: #ffffff;       // Login card background

// Text
$text-dark: #1f2937;
$text-muted: #6b7280;
$text-link: #0d7c8c;
```

## 📐 Layout Structure

### Two-Column Layout
```
┌─────────────────────────────────────────┐
│ LEFT (40%)      │  RIGHT (60%)          │
│ Navy Sidebar    │  Light Gray BG        │
│                 │                       │
│ - Logo          │  ┌─────────────────┐  │
│ - Tagline       │  │  Login Card     │  │
│ - Feature List  │  │  (Glass/White)  │  │
│ - Footer        │  └─────────────────┘  │
└─────────────────────────────────────────┘
```

## 🎨 Component Specifications

### 1. Left Sidebar (Dark Navy)
```html
<div class="sidebar-left">
  <!-- Logo Section -->
  <div class="logo-section">
    <div class="logo-icon">
      <!-- Chevron icon in white -->
      <span class="chevron">‹</span>
    </div>
    <h1 class="logo-text">
      <span class="brand-white">dicom</span>
      <span class="separator">|</span>
      <span class="brand-accent">di-1</span>
    </h1>
  </div>

  <!-- Headline -->
  <h2 class="erp-title">DIONE ERP</h2>
  <p class="erp-subtitle">Ihr intelligentes Unternehmensmanagement</p>

  <!-- Features List -->
  <div class="features-list">
    <div class="feature-item">
      <mat-icon>assessment</mat-icon>
      <span>Echtzeit-Analysen & Dashboards</span>
    </div>
    <div class="feature-item">
      <mat-icon>inventory_2</mat-icon>
      <span>Intelligente Lagerverwaltung</span>
    </div>
    <div class="feature-item">
      <mat-icon>account_balance</mat-icon>
      <span>Integrierte Finanzbuchhaltung</span>
    </div>
    <div class="feature-item">
      <mat-icon>security</mat-icon>
      <span>Enterprise-Grade Sicherheit</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="sidebar-footer">
    <p>© 2025 dicom GmbH</p>
    <p>Made in Germany</p>
  </div>
</div>
```

**Styling:**
```scss
.sidebar-left {
  background: linear-gradient(180deg, #0a1e3d 0%, #1a3a5c 100%);
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
  
  .logo-icon {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .chevron {
      color: white;
      font-size: 32px;
      font-weight: 300;
    }
  }
  
  .logo-text {
    font-size: 24px;
    font-weight: 400;
    margin: 0;
    
    .brand-white {
      color: white;
    }
    
    .separator {
      color: rgba(255, 255, 255, 0.3);
      margin: 0 8px;
    }
    
    .brand-accent {
      color: #ff4757;
    }
  }
}

.erp-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.erp-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-bottom: 48px;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: auto;
  
  .feature-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
    }
    
    mat-icon {
      color: #0d7c8c;
      font-size: 24px;
    }
  }
}

.sidebar-footer {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
}
```

### 2. Login Card (Right Side)
```html
<div class="login-container">
  <div class="login-card">
    <!-- Welcome Header -->
    <div class="login-header">
      <h2>Willkommen zurück</h2>
      <p>Melden Sie sich mit Ihrem Unternehmenskonto an</p>
    </div>

    <!-- Login Form -->
    <form class="login-form">
      <!-- Email Input -->
      <div class="form-group">
        <label for="email">E-Mail-Adresse</label>
        <div class="input-wrapper">
          <mat-icon>email</mat-icon>
          <input 
            type="email" 
            id="email"
            placeholder="ihre.email@unternehmen.de"
            class="premium-input"
          />
        </div>
      </div>

      <!-- Password Input -->
      <div class="form-group">
        <label for="password">Passwort</label>
        <div class="input-wrapper">
          <mat-icon>lock</mat-icon>
          <input 
            type="password" 
            id="password"
            placeholder="••••••••"
            class="premium-input"
          />
          <button type="button" class="toggle-password">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>
      </div>

      <!-- Remember & Forgot -->
      <div class="form-options">
        <label class="checkbox-wrapper">
          <input type="checkbox" />
          <span>Angemeldet bleiben</span>
        </label>
        <a href="#" class="forgot-link">Passwort vergessen?</a>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn-login">
        <span class="btn-content">
          <mat-icon>arrow_forward</mat-icon>
          Anmelden
        </span>
      </button>
    </form>

    <!-- Footer Text -->
    <div class="login-footer">
      <p>
        Mit der Anmeldung stimmen Sie unseren 
        <a href="#">Nutzungsbedingungen</a> und 
        <a href="#">Datenschutzrichtlinien</a> zu.
      </p>
    </div>

    <!-- Support Section -->
    <details class="support-section">
      <summary>
        <mat-icon>help_outline</mat-icon>
        Kontakt & Support
      </summary>
      <div class="support-content">
        <p><strong>Technischer Support:</strong></p>
        <p>📧 support@dicom.de</p>
        <p>📞 +49 (0) 123 456 789</p>
        <p><strong>Öffnungszeiten:</strong> Mo-Fr, 8:00-18:00 Uhr</p>
      </div>
    </details>
  </div>
</div>
```

**Styling:**
```scss
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px;
  background: #e8ebed;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px;
  max-width: 480px;
  width: 100%;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    font-size: 15px;
  }
}

.form-group {
  margin-bottom: 24px;
  
  label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    font-size: 14px;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  
  mat-icon {
    position: absolute;
    left: 16px;
    color: #9ca3af;
    font-size: 20px;
  }
  
  .premium-input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
    
    &::placeholder {
      color: #9ca3af;
    }
    
    &:focus {
      outline: none;
      border-color: #0d7c8c;
      box-shadow: 
        0 0 0 4px rgba(13, 124, 140, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.05);
    }
  }
  
  .toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #9ca3af;
    
    &:hover {
      color: #6b7280;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  font-size: 14px;
  
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #6b7280;
  }
  
  .forgot-link {
    color: #0d7c8c;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.btn-login {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #0d7c8c 0%, #0a6270 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(13, 124, 140, 0.25);
  
  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(13, 124, 140, 0.35);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
  
  a {
    color: #0d7c8c;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.support-section {
  margin-top: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  
  summary {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 500;
    color: #6b7280;
    font-size: 14px;
    list-style: none;
    
    mat-icon {
      font-size: 18px;
    }
  }
  
  .support-content {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.8;
  }
}
```

## ✨ Animations & Interactions
```scss
// Page entrance animation
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

// Loading state for button
.btn-login.loading {
  position: relative;
  color: transparent;
  
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## 📱 Responsive Behavior
```scss
@media (max-width: 968px) {
  .sidebar-left {
    display: none; // Hide sidebar on mobile
  }
  
  .login-container {
    width: 100%;
  }
}
```

---

**Implement this exact design to match the uploaded image with modern premium touches!** 🎨✨