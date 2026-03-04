# Vosk Speech-to-Text Integration - Frontend Setup

## Audio Capture Service Eklendi ✅

### Kullanım

```typescript
import { AudioCaptureService } from './core/services/audio-capture.service';
import { SignalRService } from './core/services/signalr.service';

export class CallViewComponent {
  audioCapture = inject(AudioCaptureService);
  signalR = inject(SignalRService);

  // Mikrofonu başlat
  async startMicrophone(callId: string) {
    try {
      await this.audioCapture.startCapture(callId);
      console.log('Microphone started');
    } catch (error) {
      console.error('Microphone access denied:', error);
      // Kullanıcıya hata mesajı göster
    }
  }

  // Mikrofonu durdur
  stopMicrophone() {
    this.audioCapture.stopCapture();
    console.log('Microphone stopped');
  }

  // Real-time transkript dinle
  ngOnInit() {
    this.signalR.transcriptUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event && event.callId === this.currentCallId) {
          console.log('New transcript:', event.text);
          // Transkripti UI'da göster
          this.transcript += event.text + ' ';
        }
      });

    this.signalR.transcriptionError$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        console.error('Transcription error:', error);
        // Hata mesajı göster
      });
  }
}
```

## HTML Template Örneği

```html
<!-- Mikrofon Kontrol Butonu -->
<div class="microphone-controls">
  <button
    mat-fab
    color="primary"
    [disabled]="!isRecording()"
    (click)="toggleMicrophone()"
    [class.recording]="audioCapture.isCaptureActive"
  >
    <mat-icon>{{ audioCapture.isCaptureActive ? 'mic' : 'mic_off' }}</mat-icon>
  </button>
  
  <span class="mic-status" *ngIf="audioCapture.isCaptureActive">
    <span class="pulse"></span>
    Mikrofon aktiv
  </span>
</div>

<!-- Real-time Transkript Anzeige -->
<div class="transcript-panel" *ngIf="transcript">
  <h4>Live-Transkription</h4>
  <div class="transcript-text">
    {{ transcript }}
  </div>
</div>
```

## Component TypeScript

```typescript
export class CallViewComponent implements OnInit, OnDestroy {
  audioCapture = inject(AudioCaptureService);
  signalR = inject(SignalRService);
  
  transcript = signal<string>('');
  isMicrophoneActive = signal<boolean>(false);

  ngOnInit() {
    // SignalR transkript updates dinle
    this.signalR.transcriptUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event && this.call() && event.callId === this.call()!.id) {
          this.transcript.update(current => current + event.text + ' ');
        }
      });
  }

  toggleMicrophone() {
    const callId = this.call()?.id;
    if (!callId) return;

    if (this.audioCapture.isCaptureActive) {
      this.audioCapture.stopCapture();
      this.isMicrophoneActive.set(false);
    } else {
      this.audioCapture.startCapture(callId)
        .then(() => {
          this.isMicrophoneActive.set(true);
          this.notification.success('Mikrofon aktiviert');
        })
        .catch((error) => {
          this.notification.error('Mikrofonzugriff verweigert');
          console.error(error);
        });
    }
  }

  endCall() {
    // Mikrofonu durdur
    if (this.audioCapture.isCaptureActive) {
      this.audioCapture.stopCapture();
    }
    
    // Görüşmeyi sonlandır
    // ... mevcut kod
  }

  ngOnDestroy() {
    // Cleanup: Mikrofonu durdur
    this.audioCapture.stopCapture();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## CSS Stil Önerisi

```scss
.microphone-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;

  button {
    transition: all 0.3s ease;

    &.recording {
      background-color: #e53935;
      animation: pulse 1.5s infinite;
    }

    mat-icon {
      font-size: 24px;
    }
  }

  .mic-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #e53935;
    font-weight: 500;

    .pulse {
      width: 8px;
      height: 8px;
      background-color: #e53935;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.transcript-panel {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;

  h4 {
    margin-top: 0;
    color: #666;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .transcript-text {
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}
```

## Önemli Notlar

### 1. Vosk Model İndirme (Backend)
```powershell
# Küçük model (hızlı, 45MB) - Önerilen
Invoke-WebRequest -Uri "https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip" -OutFile "vosk-model.zip"
Expand-Archive -Path "vosk-model.zip" -DestinationPath "src\SupportCallSystem.API\Models\"

# Büyük model (daha doğru, 1.9GB)
Invoke-WebRequest -Uri "https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip" -OutFile "vosk-model.zip"
```

### 2. Browser İzinleri
- Kullanıcıdan mikrofon erişim izni gereklidir
- HTTPS bağlantısı zorunludur (localhost hariç)
- İzin bir kez verilir, tarayıcı ayarlarında saklanır

### 3. Audio Format
- **Sample Rate:** 16kHz (Vosk requirement)
- **Channel Count:** 1 (Mono)
- **Format:** 16-bit PCM
- **Chunk Size:** 4096 bytes

### 4. Performance
- Audio streaming real-time gerçekleşir
- Her 256ms'de bir chunk gönderilir (4096 bytes @ 16kHz)
- SignalR otomatik reconnect desteği vardır
- Transcript updates anında UI'ya yansır

### 5. GDPR Compliance
- Ses verileri sadece bellekte işlenir
- Backend'te ses kaydedilmez
- Transkript text buffer'da saklanır
- Görüşme bitince buffer temizlenir

## Test Senaryosu

1. Backend'i başlat ve Vosk modelinin yüklendiğini kontrol et
2. Frontend'i başlat ve login ol
3. Test görüşme başlat (Debug Panel)
4. Mikrofon butonuna tıkla
5. Almanca konuş: "Der Kunde hat Probleme mit dem Internet"
6. Real-time transkript göreceksin
7. Görüşme bitir
8. AI otomatik özet oluşturacak

## Troubleshooting

### Mikrofon erişimi reddedildi
- Tarayıcı ayarlarından mikrofon izinlerini kontrol et
- HTTPS bağlantısı kullandığından emin ol
- Başka bir uygulama mikrofonu kullanıyor olabilir

### Transkript gelmiyor
- SignalR bağlantısını kontrol et (console.log)
- Backend'te Vosk modelinin yüklendiğini doğrula
- Network tab'dan StreamAudio invoke'larını kontrol et

### Ses kalitesi düşük
- Mikrofon kalitesini kontrol et
- Arka plan gürültüsünü azalt
- Büyük Vosk modeli kullanmayı dene (vosk-model-de-0.21)
