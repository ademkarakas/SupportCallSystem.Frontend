# Detail Panel Pattern - Code Template (DE)

Diese Vorlage zeigt, wie man ein Detail-Bearbeitungspanel auf der rechten Seite öffnet, wenn auf ein Element in der Liste geklickt wird.

## 1. Parent Component (Listen-Komponente)

### artikel-liste.component.ts

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Model-Definition
export interface Artikel {
  id: number;
  name: string;
  beschreibung: string;
}

@Component({
  selector: 'app-artikel-liste',
  standalone: true,
  imports: [CommonModule, DetailPanelComponent],
  templateUrl: './artikel-liste.component.html',
  styleUrls: ['./artikel-liste.component.scss'],
})
export class ArtikelListeComponent {
  // Listendaten
  public readonly items = signal<Artikel[]>([
    { id: 1, name: 'Artikel 1', beschreibung: 'Beschreibung 1' },
    { id: 2, name: 'Artikel 2', beschreibung: 'Beschreibung 2' },
    { id: 3, name: 'Artikel 3', beschreibung: 'Beschreibung 3' },
  ]);

  // Panel offen/geschlossen Status
  public readonly isPanelOpen = signal<boolean>(false);

  // Ausgewähltes Element
  public readonly selectedItem = signal<Artikel | null>(null);

  // Wenn auf ein Element geklickt wird
  public onItemClick(item: Artikel): void {
    this.selectedItem.set(item);
    this.isPanelOpen.set(true);
  }

  // Wenn das Panel geschlossen wird
  public onPanelClose(): void {
    this.isPanelOpen.set(false);
    this.selectedItem.set(null);
  }

  // Speichern-Aktion
  public onSave(updatedItem: Artikel): void {
    const currentItems = this.items();
    const index = currentItems.findIndex((i) => i.id === updatedItem.id);

    if (index !== -1) {
      const newItems = [...currentItems];
      newItems[index] = updatedItem;
      this.items.set(newItems);
    }

    this.isPanelOpen.set(false);
    console.log('Gespeichert:', updatedItem);
  }

  // Löschen-Aktion
  public onDelete(item: Artikel): void {
    const currentItems = this.items();
    const newItems = currentItems.filter((i) => i.id !== item.id);
    this.items.set(newItems);
    this.isPanelOpen.set(false);
    console.log('Gelöscht:', item);
  }
}
```

### artikel-liste.component.html

```html
<div class="container">
  <!-- Liste -->
  <div class="list-section">
    <h2>Artikelliste</h2>

    <div class="item-list">
      @for (item of items(); track item.id) {
      <div
        class="list-item"
        [class.selected]="selectedItem()?.id === item.id"
        (click)="onItemClick(item)"
      >
        <div class="item-name">{{ item.name }}</div>
        <div class="item-description">{{ item.beschreibung }}</div>
      </div>
      }
    </div>
  </div>

  <!-- Detail Panel (rechts, wenn offen) -->
  @if (isPanelOpen()) {
  <app-detail-panel
    [isOpen]="isPanelOpen()"
    [item]="selectedItem()"
    (panelClose)="onPanelClose()"
    (save)="onSave($event)"
    (deleteItem)="onDelete($event)"
  >
  </app-detail-panel>
  }
</div>
```

### artikel-liste.component.scss

```scss
.container {
  display: flex;
  gap: 20px;
  height: 100vh;
  padding: 20px;
}

.list-section {
  flex: 1;
  overflow-y: auto;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f5f5;
    border-color: #999;
  }

  &.selected {
    background-color: #e3f2fd;
    border-color: #2196f3;
  }
}

.item-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.item-description {
  color: #666;
  font-size: 14px;
}
```

---

## 2. Detail Panel Component (Rechtes Panel)

### detail-panel.component.ts

```typescript
import { Component, computed, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

export interface Artikel {
  id: number;
  name: string;
  beschreibung: string;
}

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './detail-panel.component.html',
  styleUrls: ['./detail-panel.component.scss'],
})
export class DetailPanelComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  public readonly isOpen = input<boolean>(false);
  public readonly item = input<Artikel | null>(null);

  // Outputs
  public readonly panelClose = output<void>();
  public readonly save = output<Artikel>();
  public readonly deleteItem = output<Artikel>();

  // State
  public readonly isNew = computed(() => !this.item() || this.item()?.id === 0);

  // Formular
  public readonly form: FormGroup<{
    id: FormControl<number>;
    name: FormControl<string>;
    beschreibung: FormControl<string>;
  }> = this.fb.nonNullable.group({
    id: [0, [Validators.required]],
    name: ['', [Validators.required]],
    beschreibung: ['', [Validators.required]],
  });

  constructor() {
    // Formular aktualisieren, wenn sich das Item ändert
    effect(() => {
      this.populateForm();
    });
  }

  private populateForm(): void {
    const currentItem = this.item();

    if (currentItem) {
      this.form.patchValue({
        id: currentItem.id,
        name: currentItem.name,
        beschreibung: currentItem.beschreibung,
      });
      this.form.markAsPristine();
    } else {
      this.form.reset();
    }
  }

  public onClose(): void {
    this.panelClose.emit();
  }

  public onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const updatedItem: Artikel = {
      id: formValue.id,
      name: formValue.name,
      beschreibung: formValue.beschreibung,
    };

    this.save.emit(updatedItem);
  }

  public onReset(): void {
    this.populateForm();
  }

  public onDelete(): void {
    const currentItem = this.item();
    if (currentItem) {
      this.deleteItem.emit(currentItem);
    }
  }
}
```

### detail-panel.component.html

```html
<div class="detail-panel" [class.open]="isOpen()">
  <div class="panel-card">
    <!-- Header -->
    <div class="panel-header">
      <h3>{{ isNew() ? 'Neuer Artikel' : 'Artikel bearbeiten' }}</h3>
      <button class="close-btn" (click)="onClose()">✕</button>
    </div>

    <!-- Formular -->
    <form [formGroup]="form" class="panel-form">
      <!-- ID (nur für neue Artikel anzeigen) -->
      @if (isNew()) {
      <div class="form-field">
        <label>ID</label>
        <input type="number" formControlName="id" />
      </div>
      }

      <!-- Name -->
      <div class="form-field">
        <label>Name</label>
        <input type="text" formControlName="name" placeholder="Name eingeben" />
        @if (form.controls.name.touched && form.controls.name.invalid) {
        <div class="error">Name ist erforderlich</div>
        }
      </div>

      <!-- Beschreibung -->
      <div class="form-field">
        <label>Beschreibung</label>
        <textarea
          formControlName="beschreibung"
          rows="4"
          placeholder="Beschreibung eingeben"
        ></textarea>
        @if (form.controls.beschreibung.touched && form.controls.beschreibung.invalid) {
        <div class="error">Beschreibung ist erforderlich</div>
        }
      </div>

      <!-- Aktionsbuttons -->
      <div class="panel-actions">
        <button type="button" class="btn btn-secondary" (click)="onReset()">Zurücksetzen</button>
        @if (!isNew()) {
        <button type="button" class="btn btn-danger" (click)="onDelete()">Löschen</button>
        }
        <button
          type="button"
          class="btn btn-primary"
          (click)="onSave()"
          [disabled]="form.invalid && form.touched"
        >
          Speichern
        </button>
      </div>
    </form>
  </div>

  <!-- Overlay -->
  <div class="panel-overlay" (click)="onClose()"></div>
</div>
```

### detail-panel.component.scss

```scss
.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 450px;
  height: 100vh;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;

  &.open {
    transform: translateX(0);
  }
}

.panel-card {
  background: white;
  height: 100%;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1001;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    margin: 0;
    font-size: 20px;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
}

.panel-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-field {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }

  input,
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #2196f3;
    }
  }

  .error {
    color: #f44336;
    font-size: 12px;
    margin-top: 4px;
  }
}

.panel-actions {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background-color: #2196f3;
  color: white;

  &:hover:not(:disabled) {
    background-color: #1976d2;
  }
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;

  &:hover {
    background-color: #e0e0e0;
  }
}

.btn-danger {
  background-color: #f44336;
  color: white;

  &:hover {
    background-color: #d32f2f;
  }
}

.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;

  .open & {
    opacity: 1;
    pointer-events: all;
  }
}
```

---

## Wie funktioniert es?

### 1. **Ablauf:**

- Benutzer klickt auf ein Element in der Liste
- `onItemClick()` wird ausgelöst
- `selectedItem` wird aktualisiert
- `isPanelOpen` wird auf true gesetzt
- Detail-Panel öffnet sich von rechts

### 2. **Im Panel:**

- Formular wird automatisch mit dem ausgewählten Element gefüllt
- Benutzer nimmt Änderungen vor
- Klickt auf "Speichern"-Button
- `save` Event wird ausgelöst
- Parent-Komponente aktualisiert die Liste

### 3. **Schließen:**

- X-Button
- Klick auf Overlay
- Nach Speichern oder Löschen
- In allen Fällen wird `panelClose` Event ausgelöst

---

## Features

✅ **Signals** - Moderner Angular-Ansatz  
✅ **Reactive Forms** - Formularvalidierung und -verwaltung  
✅ **Standalone Components** - Ohne Module  
✅ **Smooth Animations** - CSS Transitions  
✅ **Responsive** - Seitliches Panel-Design  
✅ **Type-Safe** - TypeScript Interfaces

---

## Verwendung

```typescript
// app.routes.ts oder an anderer Stelle
import { ArtikelListeComponent } from './artikel-liste.component';

export const routes: Routes = [{ path: 'artikel', component: ArtikelListeComponent }];
```

---

## Wichtige Punkte für Ihren Freund

### 📋 **Struktur:**

1. **Eine Liste** auf der linken Seite
2. **Klick auf ein Element** → Rechts öffnet sich das Bearbeitungs-Panel
3. **Panel bleibt offen** bis Benutzer speichert, löscht oder schließt

### 🎯 **Kernkonzepte:**

- `isPanelOpen` Signal steuert die Sichtbarkeit
- `selectedItem` Signal speichert das ausgewählte Element
- Form wird durch `effect()` automatisch befüllt
- CSS `transform: translateX()` für die Slide-Animation

### 🔧 **Anpassungen:**

Einfach die `Artikel` Interface durch eigenes Model ersetzen und Formular-Felder anpassen!

Viel Erfolg! 🚀

## Wichtige Punkte für Ihren Freund

### 📋 **Struktur:**

1. **Eine Liste** auf der linken Seite
2. **Klick auf ein Element** → Rechts öffnet sich das Bearbeitungs-Panel
3. **Panel bleibt offen** bis Benutzer speichert, löscht oder schließt

### 🎯 **Kernkonzepte:**

- `isPanelOpen` Signal steuert die Sichtbarkeit
- `selectedItem` Signal speichert das ausgewählte Element
- Form wird durch `effect()` automatisch befüllt
- CSS `transform: translateX()` für die Slide-Animation

### 🔧 **Anpassungen:**

Einfach die `Artikel` Interface durch eigenes Model ersetzen und Formular-Felder anpassen!

Viel Erfolg! 🚀
