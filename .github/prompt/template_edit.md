# Edit Page Pattern - Layout & Styling Guide (DE)

Dieses Dokument zeigt die vollständige Struktur einer Edit-Seite mit Master-Detail-Pattern, Card-Layout und Side Panel.

---

## 📐 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header Bar (Sticky)                                   │
│  ├─ Back Button + Title + Subtitle                          │
│  └─ Actions (Delete, Save, Reset)                           │
├─────────────────────────────────────────────────────────────┤
│  Form Card (Master Data)                                    │
│  └─ Input Fields (2-column grid)                            │
├─────────────────────────────────────────────────────────────┤
│  Detail Section (Split View)                                │
│  ┌──────────────────────────┬──────────────────┐            │
│  │  Grid Section (Flexible) │  Side Panel      │            │
│  │  ├─ Toolbar              │  (400px, slides) │            │
│  │  └─ Data Grid            │                  │            │
│  └──────────────────────────┴──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 1. Parent Component (Edit Component)

### artikel-edit.component.ts

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BaseEditComponent, EditConfig } from '@shared/components/base-edit';
import { FormMode } from '@shared/models/form-mode';

export interface Artikel {
  id: number;
  name: string;
  beschreibung: string;
}

export interface ArtikelDetail {
  id: number;
  artikelId: number;
  menge: number;
  preis: number;
}

@Component({
  selector: 'app-artikel-edit',
  templateUrl: './artikel-edit.component.html',
  styleUrls: ['./artikel-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArtikelFormComponent, ArtikelDetailListComponent, ArtikelDetailPanelComponent],
})
export class ArtikelEditComponent extends BaseEditComponent<Artikel, ArtikelService> {
  protected readonly config: EditConfig<Artikel> = {
    basePath: '/artikel',
    primaryKey: 'id',
    entityFactory: () => ({ id: 0, name: '', beschreibung: '' }),
    idParam: 'id',
  };

  protected readonly service = inject(ArtikelService);

  // Detail State
  public readonly details = signal<ArtikelDetail[]>([]);
  public readonly isDetailsLoading = signal(false);

  // Side Panel State
  public readonly isPanelOpen = signal(false);
  public readonly selectedDetail = signal<ArtikelDetail | null>(null);

  // Nächste verfügbare ID berechnen
  public readonly nextDetailId = computed(() => {
    const list = this.details();
    if (list.length === 0) return 1;
    return Math.max(...list.map((d) => d.id)) + 1;
  });

  // Template-kompatible Methoden
  public onFormSave(data: { entity: Artikel; isDirty: boolean }): void {
    super.onSave(data);
  }

  // Grid Row Click → Panel öffnen
  public onDetailRowClick(detail: ArtikelDetail): void {
    this.selectedDetail.set(detail);
    this.isPanelOpen.set(true);
  }

  // Neues Detail hinzufügen
  public onAddDetail(): void {
    const newDetail: ArtikelDetail = {
      id: 0,
      artikelId: this.entity().id,
      menge: 0,
      preis: 0,
    };
    this.selectedDetail.set(newDetail);
    this.isPanelOpen.set(true);
  }

  // Panel schließen
  public onPanelClose(): void {
    this.isPanelOpen.set(false);
    this.selectedDetail.set(null);
  }

  // Detail speichern
  public onPanelSave(detail: ArtikelDetail): void {
    const currentDetails = this.details();
    const index = currentDetails.findIndex((d) => d.id === detail.id);

    if (index !== -1) {
      // Update existing
      const newDetails = [...currentDetails];
      newDetails[index] = detail;
      this.details.set(newDetails);
    } else {
      // Add new
      this.details.set([...currentDetails, { ...detail, id: this.nextDetailId() }]);
    }

    this.isPanelOpen.set(false);
  }

  // Detail löschen
  public onPanelDelete(detail: ArtikelDetail): void {
    const newDetails = this.details().filter((d) => d.id !== detail.id);
    this.details.set(newDetails);
    this.isPanelOpen.set(false);
  }
}
```

### artikel-edit.component.html

```html
<!-- Master Form (Smart-Dumb Pattern) -->
<app-artikel-form
  [artikel]="entity()"
  [mode]="mode()"
  [isLoading]="isLoading()"
  (save)="onFormSave($event)"
  (delete)="onDelete()"
  (back)="onBack()"
  (resetForm)="onReset()"
/>

<!-- Detail Section mit Split-View Layout -->
@if (isEdit()) {
<div class="detail-split-view" [class.panel-open]="isPanelOpen()">
  <!-- Grid Section -->
  <div class="grid-section">
    <app-artikel-detail-list
      [details]="details()"
      [isLoading]="isDetailsLoading()"
      [showAddButton]="true"
      (rowClick)="onDetailRowClick($event)"
      (addClick)="onAddDetail()"
    />
  </div>

  <!-- Side Panel Section -->
  <div class="panel-section" [class.visible]="isPanelOpen()">
    <app-artikel-detail-panel
      [isOpen]="isPanelOpen()"
      [detail]="selectedDetail()"
      [artikelId]="entity().id"
      [nextId]="nextDetailId()"
      (panelClose)="onPanelClose()"
      (save)="onPanelSave($event)"
      (deleteDetail)="onPanelDelete($event)"
    />
  </div>
</div>
}
```

### artikel-edit.component.scss

```scss
:host {
  display: block;
}

// Split-View Layout für Grid + Side Panel
.detail-split-view {
  display: flex;
  margin-top: var(--spacing-2);
  padding: 0 var(--spacing-6);
  gap: var(--spacing-4); // Abstand zwischen Grid und Panel
  height: calc(100vh - 404px);
  min-height: 220px;
  align-items: stretch;
  overflow: hidden;
}

// Grid Section - Flexible Breite
.grid-section {
  flex: 1;
  min-width: 0;
  height: 100%;
  transition: flex var(--transition-slow);
  display: flex;
  flex-direction: column;

  // Child-Komponenten zur vollen Höhe zwingen
  ::ng-deep {
    app-artikel-detail-list {
      display: flex;
      flex-direction: column;
      height: 100%;
      flex: 1;
    }

    igx-grid {
      flex: 1;
      height: 100% !important;
    }
  }
}

// Panel Section - Feste Breite, gleitet von rechts ein
.panel-section {
  width: 0;
  height: 100%;
  overflow: hidden;
  transition: width var(--transition-slow);

  &.visible {
    width: 400px;
  }

  app-artikel-detail-panel {
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
  }
}

// Responsive Design
@media (max-width: 1200px) {
  .panel-section.visible {
    width: 360px;
  }
}

@media (max-width: 992px) {
  .detail-split-view {
    flex-direction: column;
    height: auto;
  }

  .grid-section {
    width: 100%;
    height: 350px;
  }

  .panel-section {
    width: 100%;
    height: 0;

    &.visible {
      width: 100%;
      height: 400px;
      margin-top: var(--spacing-4);
    }
  }
}
```

---

## 📝 2. Form Component (Master Data)

### artikel-form.component.ts

```typescript
import { Component, computed, effect, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DioneInputComponent } from '@dione-lib';
import { MasterdataEditLayoutComponent } from '@shared/components/masterdata-edit-layout';
import { FormMode } from '@shared/models/form-mode';

@Component({
  selector: 'app-artikel-form',
  templateUrl: './artikel-form.component.html',
  styleUrls: ['./artikel-form.component.scss'],
  imports: [ReactiveFormsModule, MasterdataEditLayoutComponent, DioneInputComponent],
})
export class ArtikelFormComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  public readonly artikel = input.required<Artikel>();
  public readonly mode = input<FormMode>('create');
  public readonly isLoading = input<boolean>(false);

  // Outputs
  public readonly save = output<{ entity: Artikel; isDirty: boolean }>();
  public readonly delete = output<void>();
  public readonly back = output<void>();
  public readonly resetForm = output<void>();

  // Computed
  public readonly isNew = computed(() => this.mode() === 'create');
  public readonly isEdit = computed(() => this.mode() === 'edit');
  public readonly showDeleteButton = computed(() => this.isEdit());
  public readonly submitButtonText = computed(() =>
    this.isNew() ? 'common.button.create' : 'common.button.save',
  );

  // Form
  public readonly form: FormGroup<{
    id: FormControl<number>;
    name: FormControl<string>;
    beschreibung: FormControl<string>;
  }> = this.fb.nonNullable.group({
    id: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    beschreibung: ['', [Validators.required]],
  });

  constructor() {
    // Form aktualisieren, wenn sich Artikel ändert
    effect(() => {
      this.populateForm();
    });
  }

  private populateForm(): void {
    const data = this.artikel();
    this.form.patchValue({
      id: data.id,
      name: data.name,
      beschreibung: data.beschreibung,
    });
    this.form.markAsPristine();
  }

  public onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const entity: Artikel = {
      id: formValue.id,
      name: formValue.name,
      beschreibung: formValue.beschreibung,
    };

    this.save.emit({ entity, isDirty: this.form.dirty });
  }

  public onReset(): void {
    this.populateForm();
    this.resetForm.emit();
  }

  public onBack(): void {
    this.back.emit();
  }

  public onDelete(): void {
    this.delete.emit();
  }
}
```

### artikel-form.component.html

```html
<dione-masterdata-edit-layout
  [newTitle]="'artikel.newTitle'"
  [editTitle]="'artikel.editTitle'"
  [subtitle]="'artikel.formSubtitle'"
  [entityId]="'' + artikel().id"
  [form]="form"
  [formInvalid]="form.invalid"
  [formPristine]="form.pristine"
  [isNew]="isNew()"
  [isEdit]="isEdit()"
  [showDeleteButton]="showDeleteButton()"
  [submitButtonText]="submitButtonText()"
  [showLastEdited]="false"
  (back)="onBack()"
  (save)="onSave()"
  (reset)="onReset()"
  (delete)="onDelete()"
>
  <form formFields [formGroup]="form" class="form-content">
    <!-- ID -->
    <div class="form-field">
      <dione-input
        id="artikelId"
        [label]="'artikel.id' | translate"
        formControlName="id"
        type="number"
        [required]="true"
        [readonly]="isEdit()"
        size="small"
        [autofocus]="true"
      />
    </div>

    <!-- Name -->
    <div class="form-field">
      <dione-input
        id="artikelName"
        [label]="'artikel.name' | translate"
        formControlName="name"
        [required]="true"
        [maxLength]="50"
        size="small"
      />
    </div>

    <!-- Beschreibung (Full Width) -->
    <div class="form-field form-field--full">
      <dione-input
        id="artikelBeschreibung"
        [label]="'artikel.beschreibung' | translate"
        formControlName="beschreibung"
        [required]="true"
        size="small"
      />
    </div>
  </form>
</dione-masterdata-edit-layout>
```

### artikel-form.component.scss

```scss
// Verwendet shared masterdata-form Styles
@use 'src/styles/components/masterdata-form' as form;

.form-content {
  @extend .masterdata-form;
}

.form-field {
  @extend .masterdata-form__field;

  &--full {
    @extend .masterdata-form__field--full;
  }
}
```

---

## 🗂️ 3. Side Panel Component

### artikel-detail-panel.component.ts

```typescript
import { Component, computed, effect, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DioneButtonComponent, DioneInputComponent } from '@dione-lib';
import { IgxCardComponent, IgxIconComponent } from '@infragistics/igniteui-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-artikel-detail-panel',
  templateUrl: './artikel-detail-panel.component.html',
  styleUrls: ['./artikel-detail-panel.component.scss'],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    IgxCardComponent,
    IgxIconComponent,
    DioneButtonComponent,
    DioneInputComponent,
  ],
})
export class ArtikelDetailPanelComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  public readonly isOpen = input<boolean>(false);
  public readonly detail = input<ArtikelDetail | null>(null);
  public readonly artikelId = input<number>(0);
  public readonly nextId = input<number>(1);

  // Outputs
  public readonly panelClose = output<void>();
  public readonly save = output<ArtikelDetail>();
  public readonly deleteDetail = output<ArtikelDetail>();

  // State
  public readonly isNew = computed(() => !this.detail() || this.detail()?.id === 0);

  // Form
  public readonly form: FormGroup<{
    id: FormControl<number>;
    menge: FormControl<number>;
    preis: FormControl<number>;
  }> = this.fb.nonNullable.group({
    id: [0],
    menge: [0, [Validators.required, Validators.min(1)]],
    preis: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      this.populateForm();
    });
  }

  private populateForm(): void {
    const d = this.detail();
    if (d) {
      this.form.patchValue({
        id: d.id || this.nextId(),
        menge: d.menge,
        preis: d.preis,
      });
      this.form.markAsPristine();
    } else {
      this.form.reset({ id: this.nextId(), menge: 0, preis: 0 });
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
    const entity: ArtikelDetail = {
      id: formValue.id,
      artikelId: this.artikelId(),
      menge: formValue.menge,
      preis: formValue.preis,
    };

    this.save.emit(entity);
  }

  public onReset(): void {
    this.populateForm();
  }

  public onDelete(): void {
    const d = this.detail();
    if (d) {
      this.deleteDetail.emit(d);
    }
  }
}
```

### artikel-detail-panel.component.html

```html
<!-- Inline Side Panel (Card Design) -->
<igx-card class="panel-card">
  <!-- Panel Header -->
  <div class="panel-header">
    <h3>
      @if (isNew()) { {{ "artikel.detail.newTitle" | translate }} } @else { {{
      "artikel.detail.editTitle" | translate }} }
    </h3>
    <button
      type="button"
      class="panel-close-btn"
      (click)="onClose()"
      [title]="'common.button.close' | translate"
    >
      <igx-icon>close</igx-icon>
    </button>
  </div>

  <!-- Panel Body -->
  <div class="panel-body">
    <form [formGroup]="form" class="panel-form">
      <!-- ID (readonly) -->
      <div class="form-field">
        <dione-input
          id="detailId"
          [label]="'artikel.detail.id' | translate"
          formControlName="id"
          type="number"
          [readonly]="true"
          size="small"
        />
      </div>

      <!-- Menge -->
      <div class="form-field">
        <dione-input
          id="menge"
          [label]="'artikel.detail.menge' | translate"
          formControlName="menge"
          type="number"
          [required]="true"
          size="small"
        />
      </div>

      <!-- Preis -->
      <div class="form-field">
        <dione-input
          id="preis"
          [label]="'artikel.detail.preis' | translate"
          formControlName="preis"
          type="number"
          [required]="true"
          size="small"
        />
      </div>
    </form>
  </div>

  <!-- Panel Footer -->
  <div class="panel-footer">
    @if (!isNew()) {
    <dione-button displayType="outlined" variant="danger" (buttonClick)="onDelete()">
      <igx-icon>delete</igx-icon>
      {{ "common.button.delete" | translate }}
    </dione-button>
    }
    <dione-button
      displayType="outlined"
      variant="secondary"
      (buttonClick)="onReset()"
      [disabled]="form.pristine"
    >
      <igx-icon>refresh</igx-icon>
      {{ "common.button.reset" | translate }}
    </dione-button>
    <dione-button
      displayType="contained"
      variant="brand"
      (buttonClick)="onSave()"
      [disabled]="form.invalid"
    >
      <igx-icon>check</igx-icon>
      {{ "common.button.save" | translate }}
    </dione-button>
  </div>
</igx-card>
```

### artikel-detail-panel.component.scss

```scss
// Verwendet shared detail-panel Styles
@use 'src/styles/components/detail-panel' as panel;

:host {
  @extend .detail-panel;
}

.panel-card {
  @extend .detail-panel__card;
}

.panel-header {
  @extend .detail-panel__header;
}

.panel-close-btn {
  @extend .detail-panel__close-btn;
}

.panel-body {
  @extend .detail-panel__body;
}

.panel-form {
  @extend .detail-panel__form;
}

.form-field {
  @extend .detail-panel__form-field;
}

.panel-footer {
  @extend .detail-panel__footer;
}
```

---

## 🎨 4. Shared SCSS Files (Global Styles)

### 4.1. `_masterdata-form.scss`

```scss
// src/styles/components/_masterdata-form.scss
// Shared Masterdata Form Styles

.masterdata-form {
  display: grid;
  gap: var(--spacing-lg);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }

  &__field {
    display: flex;
    flex-direction: column;
  }

  // Full width field (spans beide Spalten)
  &__field--full {
    @media (min-width: 768px) {
      grid-column: 1 / -1;
    }
  }

  // Three column layout variant
  &--three-col {
    @media (min-width: 992px) {
      grid-template-columns: repeat(3, 1fr);
      max-width: 1200px;
    }
  }

  // Single column layout variant
  &--single-col {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}
```

### 4.2. `_detail-panel.scss`

```scss
// src/styles/components/_detail-panel.scss
// Shared Detail Panel Styles

.detail-panel {
  display: flex;
  flex: 1;
  height: 100%;
  width: 100%;

  &__card {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: var(--color-surface);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-sm);
    height: 100%;
    min-width: 320px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--border-color);
    background-color: var(--color-surface);

    h3 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }
  }

  &__close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background-color: transparent;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    color: var(--text-secondary);
    transition:
      background-color 0.2s,
      color 0.2s;

    &:hover {
      background-color: var(--hover-overlay);
      color: var(--text-primary);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-4);

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--border-color);
      border-radius: 3px;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  &__form-field {
    display: flex;
    flex-direction: column;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    border-top: 1px solid var(--border-color);
    background-color: var(--color-surface);

    // Delete button alignment (links)
    > :first-child:is([variant='danger']) {
      margin-right: auto;
    }
  }
}
```

---

## 📦 5. MasterdataEditLayout Component (Shared)

Dies ist eine wiederverwendbare Layout-Komponente für alle Edit-Seiten.

### masterdata-edit-layout.component.ts

```typescript
import { Component, computed, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DioneButtonComponent } from '@dione-lib';
import { IgxCardComponent, IgxIconComponent } from '@infragistics/igniteui-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'dione-masterdata-edit-layout',
  templateUrl: './masterdata-edit-layout.component.html',
  styleUrls: ['./masterdata-edit-layout.component.scss'],
  imports: [TranslateModule, IgxCardComponent, IgxIconComponent, DioneButtonComponent],
})
export class MasterdataEditLayoutComponent {
  // Inputs
  public readonly newTitle = input<string>('');
  public readonly editTitle = input<string>('');
  public readonly subtitle = input<string>('');
  public readonly subtitleRaw = input<string>('');
  public readonly entityId = input<string>('');
  public readonly form = input.required<FormGroup>();
  public readonly formInvalid = input<boolean>(false);
  public readonly formPristine = input<boolean>(true);
  public readonly isNew = input<boolean>(true);
  public readonly isEdit = input<boolean>(false);
  public readonly showDeleteButton = input<boolean>(false);
  public readonly submitButtonText = input<string>('common.button.save');
  public readonly showLastEdited = input<boolean>(false);
  public readonly lastEditedLabel = input<string | null>(null);
  public readonly lastEditedDate = input<string | null>(null);

  // Outputs
  public readonly back = output<void>();
  public readonly save = output<void>();
  public readonly reset = output<void>();
  public readonly delete = output<void>();

  // Computed
  public readonly backButtonLabel = computed(() =>
    this.isNew() ? 'common.button.cancel' : 'common.button.back',
  );

  // Event Handlers
  public onBack(): void {
    this.back.emit();
  }

  public onSave(): void {
    this.save.emit();
  }

  public onReset(): void {
    this.reset.emit();
  }

  public onDelete(): void {
    this.delete.emit();
  }
}
```

---

## 🎯 6. Design Tokens & CSS Variables

```scss
// src/styles/tokens/_spacing.scss
:root {
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-lg: 16px;
}

// src/styles/tokens/_colors.scss
:root {
  --color-surface: #ffffff;
  --border-color: #e0e0e0;
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-tertiary: #9e9e9e;
  --hover-overlay: rgba(0, 0, 0, 0.04);
  --focus-ring-color: #2196f3;
}

// src/styles/tokens/_shadows.scss
:root {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.15);
}

// src/styles/tokens/_transitions.scss
:root {
  --transition-fast: 0.15s ease-in-out;
  --transition-normal: 0.3s ease-in-out;
  --transition-slow: 0.5s ease-in-out;
}

// src/styles/tokens/_border-radius.scss
:root {
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}
```

---

## ✅ 7. Best Practices & Hinweise

### 🔹 Layout-Prinzipien

1. **Master-Detail Pattern**: Form oben, Grid + Panel unten
2. **Flexbox Layout**: Grid passt sich an, Panel hat feste Breite
3. **Smooth Transitions**: Panel gleitet mit `transition: width`
4. **Responsive**: Auf Mobilgeräten stapeln sich Grid und Panel

### 🔹 Component-Struktur

1. **Smart Component** (Edit): State Management, Business Logic
2. **Presentational Component** (Form, Panel): Nur UI, empfängt Inputs
3. **Shared Styles**: Wiederverwendbare SCSS-Partials mit `@extend`

### 🔹 Styling-Strategie

1. **Design Tokens**: CSS Custom Properties für Konsistenz
2. **BEM Notation**: `__element` und `--modifier` für klare Struktur
3. **SCSS @use**: Moderne Alternative zu `@import`
4. **Shared Partials**: Vermeidet Code-Duplikation

### 🔹 Performance

1. **OnPush Change Detection**: Reduziert Change Detection Zyklen
2. **Signals**: Moderne reaktive State-Management
3. **Computed Values**: Automatische Neuberechnung bei Änderungen
4. **trackBy**: Bei `@for` für optimales Rendering

---

## 🚀 8. Verwendung

```typescript
// app.routes.ts
import { ArtikelEditComponent } from './artikel-edit.component';

export const routes: Routes = [
  {
    path: 'artikel/neu',
    component: ArtikelEditComponent,
    data: { mode: 'create' },
  },
  {
    path: 'artikel/:id',
    component: ArtikelEditComponent,
    data: { mode: 'edit' },
  },
];
```

---

## 📌 Zusammenfassung

### Was ist enthalten:

✅ **Parent Component** - Edit Component mit State Management  
✅ **Form Component** - Master Data mit Card Layout  
✅ **Side Panel Component** - Detail Bearbeitung  
✅ **Split-View Layout** - Grid + Panel nebeneinander  
✅ **Shared SCSS** - Wiederverwendbare Styles  
✅ **Design Tokens** - Konsistente Styling-Variablen  
✅ **Responsive Design** - Mobile-freundlich  
✅ **TypeScript Types** - Vollständig typisiert

Dieses Pattern können Sie für alle Edit-Seiten in Ihrer Anwendung verwenden! 🎉
