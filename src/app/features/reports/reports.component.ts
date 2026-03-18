import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import jsPDF from 'jspdf';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ReportsService, ReportsData, AgentInfo } from './reports.service';
import { fadeIn } from '../../core/animations/animations';

type Preset = '7d' | '30d' | '90d';

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    BaseChartDirective,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  animations: [fadeIn],
})
export class ReportsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly reportsService = inject(ReportsService);
  private readonly notification = inject(NotificationService);

  readonly isAdmin = this.auth.isAdmin();

  isLoading = signal(false);
  reportData = signal<ReportsData | null>(null);
  agents = signal<AgentInfo[]>([]);
  selectedAgentId = signal<string | null>(null);
  activePreset = signal<Preset>('30d');

  dateFrom = signal<Date>(this.defaultFrom(30));
  dateTo = signal<Date>(new Date());

  // Expose formatted dates for input binding
  dateFromStr = computed(() => this.toInputDate(this.dateFrom()));
  dateToStr = computed(() => this.toInputDate(this.dateTo()));

  // ---- Chart: Line — daily call trend ----
  lineChartData = computed<ChartData<'line'>>(() => {
    const data = this.reportData();
    if (!data) return { datasets: [] };
    return {
      labels: data.dailyCallCounts.map((d) => d.date),
      datasets: [
        {
          data: data.dailyCallCounts.map((d) => d.count),
          label: 'Anrufe',
          fill: true,
          tension: 0.4,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.12)',
          pointBackgroundColor: '#3b82f6',
        },
      ],
    };
  });

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  // ---- Chart: Doughnut — category distribution ----
  doughnutChartData = computed<ChartData<'doughnut'>>(() => {
    const data = this.reportData();
    if (!data) return { datasets: [] };
    return {
      labels: data.categoryStats.map((c) => this.translateCategory(c.category)),
      datasets: [
        {
          data: data.categoryStats.map((c) => c.count),
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
            '#f97316',
          ],
        },
      ],
    };
  });

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  // ---- Chart: Bar — summary status ----
  barChartData = computed<ChartData<'bar'>>(() => {
    const data = this.reportData();
    if (!data) return { datasets: [] };
    const b = data.summaryStatusBreakdown;
    return {
      labels: ['Kein Entwurf', 'Entwurf', 'Genehmigt'],
      datasets: [
        {
          data: [b.none, b.draft, b.approved],
          backgroundColor: ['#94a3b8', '#f59e0b', '#10b981'],
          borderRadius: 4,
        },
      ],
    };
  });

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit(): void {
    if (this.isAdmin) {
      this.reportsService.getAgents().subscribe({
        next: (agents) => this.agents.set(agents),
        error: () => this.notification.showError('Agent-Liste konnte nicht geladen werden.'),
      });
    }
    this.loadData();
  }

  onPreset(preset: Preset): void {
    this.activePreset.set(preset);
    const presetDays: Record<Preset, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = presetDays[preset];
    this.dateFrom.set(this.defaultFrom(days));
    this.dateTo.set(new Date());
    this.loadData();
  }

  onDateFromChange(value: string): void {
    if (value) {
      this.dateFrom.set(new Date(value));
      this.activePreset.set('30d'); // reset preset label
    }
  }

  onDateToChange(value: string): void {
    if (value) {
      this.dateTo.set(new Date(value));
      this.activePreset.set('30d');
    }
  }

  onAgentChange(id: string): void {
    this.selectedAgentId.set(id || null);
    this.loadData();
  }

  onRefresh(): void {
    this.loadData();
  }

  onExport(): void {
    this.reportsService
      .exportReports(this.dateFrom(), this.dateTo(), this.selectedAgentId())
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `berichte_${this.toInputDate(this.dateFrom())}_${this.toInputDate(this.dateTo())}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.notification.showError('Export fehlgeschlagen.'),
      });
  }

  onExportPdf(): void {
    const data = this.reportData();
    if (!data) {
      this.notification.showError('Keine Daten zum Exportieren.');
      return;
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Berichte & Analyse', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(
      `Zeitraum: ${this.toInputDate(this.dateFrom())} – ${this.toInputDate(this.dateTo())}`,
      margin,
      y,
    );
    doc.setTextColor(0);
    y += 12;

    // KPI Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Kennzahlen', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const kpis = [
      ['Anrufe gesamt', String(data.totalCalls)],
      ['Ø Gesprächsdauer', this.formatDuration(data.averageDurationSeconds)],
      ['Lösungsrate', `${data.resolutionRate}%`],
      ['Einwilligungsrate', `${data.consentGrantedRate}%`],
    ];
    kpis.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, y);
      doc.text(value, margin + 60, y);
      y += 6;
    });
    y += 6;

    // Category Stats
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Kategorieverteilung', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Kategorie', margin, y);
    doc.text('Anzahl', margin + 80, y);
    doc.text('Anteil (%)', margin + 110, y);
    doc.setTextColor(0);
    y += 5;
    doc.line(margin, y, pageW - margin, y);
    y += 4;
    data.categoryStats.forEach((c) => {
      doc.text(this.translateCategory(c.category), margin, y);
      doc.text(String(c.count), margin + 80, y);
      doc.text(`${c.percentage}%`, margin + 110, y);
      y += 6;
    });
    y += 6;

    // Summary status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Zusammenfassungsstatus', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const b = data.summaryStatusBreakdown;
    [
      ['Kein Entwurf', b.none],
      ['Entwurf', b.draft],
      ['Genehmigt', b.approved],
    ].forEach(([label, count]) => {
      doc.text(`${label}:`, margin, y);
      doc.text(String(count), margin + 60, y);
      y += 6;
    });
    y += 8;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Erstellt: ${new Date().toLocaleString('de-DE')} – SupportCallSystem`, margin, 290);

    const fileName = `berichte_${this.toInputDate(this.dateFrom())}_${this.toInputDate(this.dateTo())}.pdf`;
    doc.save(fileName);
  }

  private translateCategory(cat: string): string {
    const map: Record<string, string> = {
      Unknown: 'Unbekannt',
      TechnicalIssue: 'Technisches Problem',
      BillingQuestion: 'Rechnungsfrage',
      AccessCredentials: 'Zugangsdaten',
      GeneralInquiry: 'Allgemeine Anfrage',
      Complaint: 'Beschwerde',
      FeatureRequest: 'Feature-Wunsch',
    };
    return map[cat] ?? cat;
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ---- helpers ----
  private loadData(): void {
    this.isLoading.set(true);
    this.reportsService
      .getReportsData(this.dateFrom(), this.dateTo(), this.selectedAgentId())
      .subscribe({
        next: (data) => {
          this.reportData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.notification.showError('Berichtsdaten konnten nicht geladen werden.');
          this.isLoading.set(false);
        },
      });
  }

  private defaultFrom(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  private toInputDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
