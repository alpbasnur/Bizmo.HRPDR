# PotansiyelHaritası — AI Destekli Personel Değerlendirme Platformu
## Cursor Development Specification v1.1

---

## 1. Proje Genel Bakış

Talaşlı imalat sektöründe (özellikle CNC operatörleri) çalışan mavi yaka personelin;
- Gizli potansiyelini,
- Liderlik kapasitesini,
- Mantıksal / algoritmik düşünce yapısını,
- Sosyal zekasını,
- Doğru kariyer yönelimini

AI destekli soru setleri ve derin analiz ile ölçen, raporlayan ve yönlendiren tam kapsamlı bir web platformu.

---

## 2. Teknik Yığın (Tech Stack)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Grafikler:** ApexCharts (radar/spider, bar, line, heatmap — tek kütüphane; bundle boyutu için Recharts kullanılmaz)
- **State Yönetimi:** Zustand
- **Form:** React Hook Form + Zod
- **HTTP Client:** Axios + React Query (TanStack Query)
- **Tablo:** TanStack Table
- **İkonlar:** Lucide React
- **Animasyon:** Framer Motion
- **PDF Çıktı:** React-PDF / @react-pdf/renderer
- **Excel İçe/Dışa Aktarma:** SheetJS (xlsx)
- **Dil:** TypeScript (strict mode)
- **UI i18n:** next-intl (veya react-i18next) — TR birincil; `Personnel.preferredLanguage` ile portal dil eşlemesi

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Fastify (veya Express.js — Fastify tercih edilir; performans ve şema doğrulama)
- **ORM:** Prisma
- **Veritabanı:** PostgreSQL 16
- **Auth:** JWT (access + refresh token) + bcrypt
- **Queue / Background Jobs:** BullMQ + Redis
- **Dosya Yükleme:** Multer + local storage (S3-ready interface)
- **Email:** Nodemailer
- **Validation:** Zod (shared schema frontend/backend)
- **API Dokümantasyon:** Swagger (Fastify swagger plugin)

### AI Entegrasyonları
- **Anthropic Claude:** `@anthropic-ai/sdk`
- **OpenAI GPT:** `openai`
- **Google Gemini:** `@google/generative-ai`
- **Abacus.AI:** REST API (custom axios client)

### DevOps / Altyapı
- **Container:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **Process Manager:** PM2 (geliştirme), Docker (production)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana (opsiyonel)
- **Logging:** Winston + Pino

---

## 3. Monorepo Klasör Yapısı

```
potansiyel-haritasi/
├── apps/
│   ├── web/                        # Next.js — Admin + HR Paneli
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/          # Giriş ekranı
│   │   │   ├── (admin)/
│   │   │   │   ├── dashboard/      # Genel bakış
│   │   │   │   ├── personnel/      # Personel yönetimi
│   │   │   │   ├── assessments/    # Değerlendirme yönetimi
│   │   │   │   ├── question-sets/  # Soru seti yönetimi
│   │   │   │   ├── analytics/      # Analitik & raporlama
│   │   │   │   ├── reports/        # Rapor çıktıları
│   │   │   │   ├── ai-config/      # AI model ayarları
│   │   │   │   └── settings/       # Sistem ayarları
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   │
│   └── portal/                     # Next.js — Personel Test Portalı
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login/          # Personel girişi
│       │   ├── (test)/
│       │   │   ├── welcome/        # Karşılama ekranı
│       │   │   ├── assessment/     # Test akışı (soru-cevap)
│       │   │   └── complete/       # Test tamamlama ekranı
│       │   └── layout.tsx
│       └── components/
│
├── packages/
│   ├── shared/                     # Ortak tipler, şemalar, utils
│   │   ├── types/
│   │   ├── schemas/                # Zod şemaları (frontend + backend paylaşımlı)
│   │   └── constants/
│   └── ui/                         # Paylaşımlı UI bileşenleri
│
├── server/                         # Fastify Backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── personnel/
│   │   │   ├── departments/
│   │   │   ├── assessments/
│   │   │   ├── question-sets/
│   │   │   ├── questions/
│   │   │   ├── sessions/           # Test oturumları
│   │   │   ├── analytics/
│   │   │   ├── reports/
│   │   │   └── ai/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── claude.service.ts
│   │   │   │   ├── openai.service.ts
│   │   │   │   ├── gemini.service.ts
│   │   │   │   └── abacus.service.ts
│   │   │   ├── question-generator.service.ts
│   │   │   ├── analysis.service.ts
│   │   │   └── report.service.ts
│   │   ├── plugins/
│   │   ├── middleware/
│   │   ├── jobs/                   # BullMQ işleri
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── index.ts
│   └── package.json
│
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── package.json                    # Workspace root
```

---

## 4. Veritabanı Şeması (PostgreSQL / Prisma)

### 4.1 Skor sözleşmesi (kanonik)

- Tüm boyut skorları ve `aiScore` alanları **0.0–10.0** aralığında, en fazla **bir ondalık** hassasiyetle saklanır ve API’de aynı şema ile döner.
- Skala tipi sorular (`SCALE`) için `minScale` / `maxScale` (varsayılan 1–10) cevap değeri normalize edilerek 0–10 bandına dönüştürülür.
- **Toplam / bileşik skor:** `effectiveQuestionWeight = Question.weight × (QuestionSetItem.customWeight ?? 1) × (QuestionSet boyut ağırlığı / 100)` ile ağırlıklı ortalama; nihai boyut skoru = o boyuttaki soruların ağırlıklı ortalaması (formül backend `scoring.service.ts` içinde tek kaynak).

```prisma
// server/src/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// ÇOK KİRACILI (SaaS) TEMELİ — tek şirkette tek Organization seed
// ─────────────────────────────────────────

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  timezone  String   @default("Europe/Istanbul")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users         User[]
  departments   Department[]
  questionSets  QuestionSet[]
  assessments   Assessment[]
  personnel     Personnel[]
  questions     Question[]
  aiConfigs     AiConfig[]
}

// ─────────────────────────────────────────
// KULLANICI VE YETKİLENDİRME
// ─────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN
  ADMIN
  HR_MANAGER
  ANALYST
  VIEWER
}

model User {
  id           String    @id @default(cuid())
  email        String
  password     String
  name         String
  role         UserRole  @default(VIEWER)
  isActive     Boolean   @default(true)
  refreshToken String?
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime? // soft delete

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  organizationId String
  /// HR_MANAGER / ANALYST için satır düzeyi filtre (null = tüm organizasyon)
  scopedDepartmentId String?

  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String? // TOTP secret (şifreli)

  createdAssessments   Assessment[]        @relation("AssessmentCreator")
  createdQuestionSets  QuestionSet[]       @relation("QuestionSetCreator")
  generatedReports     Report[]            @relation("ReportGenerator")
  passwordResetTokens  PasswordResetToken[] @relation("AdminPasswordReset")
  notifications        Notification[]      @relation("UserNotifications")
  analysisReviews      AnalysisReview[]    @relation("AnalysisReviewer")

  @@unique([organizationId, email])
}

// ─────────────────────────────────────────
// ORGANİZASYON YAPISI
// ─────────────────────────────────────────

model Department {
  id          String    @id @default(cuid())
  name        String
  description String?
  color       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String

  teams     Team[]
  personnel Personnel[]

  @@unique([organizationId, name])
}

model Team {
  id           String     @id @default(cuid())
  name         String
  description  String?
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  departmentId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?

  personnel Personnel[]
}

// ─────────────────────────────────────────
// PERSONEL
// ─────────────────────────────────────────

enum PersonnelStatus {
  ACTIVE
  INACTIVE
  ON_LEAVE
}

enum PersonnelShift {
  NONE
  MORNING
  AFTERNOON
  NIGHT
  ROTATING
}

model Personnel {
  id             String          @id @default(cuid())
  employeeId     String
  firstName      String
  lastName       String
  email          String
  phone          String?
  position       String
  experienceYear Int             @default(0)
  status         PersonnelStatus @default(ACTIVE)
  department     Department?     @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  departmentId   String?
  team           Team?           @relation(fields: [teamId], references: [id], onDelete: SetNull)
  teamId         String?
  hireDate       DateTime?
  birthDate      DateTime?
  notes          String?
  avatarUrl      String?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  organizationId String
  shift          PersonnelShift @default(NONE)
  preferredLanguage String      @default("tr")

  portalPasswordHash String? @map("portal_password_hash")
  portalRefreshToken String?
  lastPortalLogin    DateTime?

  importSource String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  assessmentSessions AssessmentSession[]
  reports            Report[]
  consentRecords     ConsentRecord[]
  passwordResetTokens PasswordResetToken[] @relation("PersonnelPasswordReset")
  notifications      Notification[]       @relation("PersonnelNotifications")

  @@unique([organizationId, employeeId])
  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([departmentId])
}

// ─────────────────────────────────────────
// SORU YÖNETİMİ
// ─────────────────────────────────────────

enum QuestionDimension {
  LOGICAL_ALGORITHMIC
  LEADERSHIP
  SOCIAL_INTELLIGENCE
  GROWTH_POTENTIAL
  DOMAIN_ALIGNMENT
}

enum QuestionType {
  OPEN_ENDED
  SITUATIONAL
  BEHAVIORAL
  SCALE
  MULTIPLE_CHOICE
}

enum QuestionPhase {
  ICEBREAKER
  CORE
  CLOSING
}

model Question {
  id          String            @id @default(cuid())
  text        String
  subText     String?
  dimension   QuestionDimension
  type        QuestionType
  phase       QuestionPhase
  weight      Float             @default(1.0)
  followUpPrompt String?
  options     Json?
  minScale    Int?
  maxScale    Int?
  isActive    Boolean           @default(true)
  isAiGenerated Boolean         @default(false)
  aiModel     String?
  tags        String[]
  language    String            @default("tr")
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  deletedAt   DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  organizationId String

  questionSetItems QuestionSetItem[]
  answers          Answer[]

  @@index([organizationId, dimension])
}

model QuestionSet {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  version     Int      @default(1)
  createdBy   User     @relation("QuestionSetCreator", fields: [createdById], references: [id], onDelete: Restrict)
  createdById String

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  organizationId String

  aiGenerationParams Json?

  weightLogical      Float @default(20)
  weightLeadership   Float @default(20)
  weightSocial       Float @default(20)
  weightGrowth       Float @default(20)
  weightDomain       Float @default(20)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  items       QuestionSetItem[]
  assessments Assessment[]

  @@index([organizationId])
}

model QuestionSetItem {
  id            String      @id @default(cuid())
  questionSet   QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)
  questionSetId String
  question      Question    @relation(fields: [questionId], references: [id], onDelete: Restrict)
  questionId    String
  order         Int
  isRequired    Boolean     @default(true)
  customWeight  Float?

  @@unique([questionSetId, order])
}

// ─────────────────────────────────────────
// DEĞERLENDİRME VE TEST OTURUMU
// ─────────────────────────────────────────

enum AssessmentStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

model Assessment {
  id            String           @id @default(cuid())
  title         String
  description   String?
  status        AssessmentStatus @default(DRAFT)
  questionSet   QuestionSet      @relation(fields: [questionSetId], references: [id], onDelete: Restrict)
  questionSetId String
  createdBy     User             @relation("AssessmentCreator", fields: [createdById], references: [id], onDelete: Restrict)
  createdById   String

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  organizationId String

  startsAt  DateTime?
  endsAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions AssessmentSession[]

  @@index([organizationId])
}

enum SessionStatus {
  NOT_STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  EXPIRED
}

enum AnalysisPipelineStatus {
  NOT_QUEUED
  QUEUED
  RUNNING
  COMPLETED
  FAILED
}

model AssessmentSession {
  id           String        @id @default(cuid())
  assessment   Assessment    @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  assessmentId String
  personnel    Personnel     @relation(fields: [personnelId], references: [id], onDelete: Restrict)
  personnelId  String
  status       SessionStatus @default(NOT_STARTED)
  startedAt    DateTime?
  completedAt  DateTime?
  durationSec  Int?
  ipAddress    String?
  userAgent    String?

  dueAt         DateTime?
  reminderSentAt DateTime?
  invitationToken String? @unique

  /// Oturum başlarken soru setinin değişmez kopyası (soru metinleri, sıra, ağırlıklar)
  questionSetSnapshot Json?

  rawAnalysis       Json?
  dimensionScores   Json?
  swotAnalysis      Json?
  careerPaths       Json?
  keyInsights       String?
  analysisModel     String?
  analysisPipeline  AnalysisPipelineStatus @default(NOT_QUEUED)
  analysisError     String?

  /// İK onayı olmadan rapor indirilemez / personele açılmaz (iş kuralı)
  requiresHrReview Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  answers        Answer[]
  report         Report?
  sessionEvents  SessionEvent[]
  analysisReview AnalysisReview?
  consentRecords ConsentRecord[]

  @@unique([assessmentId, personnelId])
  @@index([personnelId])
}

model Answer {
  id         String            @id @default(cuid())
  session    AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId  String
  question   Question          @relation(fields: [questionId], references: [id], onDelete: Restrict)
  questionId String
  textAnswer String?
  scaleValue Int?
  choiceKey  String?
  durationSec Int?

  aiScore       Float?
  aiSignals     Json?
  followUpAsked Boolean @default(false)
  followUpAnswer String?

  /// İstemci tekrar gönderiminde çift kayıt önleme (UUID önerilir)
  clientDedupeKey String?

  answeredAt DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([sessionId, questionId])
  @@unique([sessionId, clientDedupeKey])
}

// ─────────────────────────────────────────
// RAPORLAMA
// ─────────────────────────────────────────

enum ReportStatus {
  GENERATING
  READY
  FAILED
}

model Report {
  id          String        @id @default(cuid())
  session     AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId   String        @unique
  personnel   Personnel     @relation(fields: [personnelId], references: [id], onDelete: Restrict)
  personnelId String
  generatedBy User?         @relation("ReportGenerator", fields: [generatedById], references: [id], onDelete: SetNull)
  generatedById String?

  status      ReportStatus  @default(GENERATING)
  executiveSummary String?
  fullReportJson   Json?
  pdfUrl           String?

  generatedAt DateTime?
  createdAt   DateTime  @default(now())
}

// ─────────────────────────────────────────
// KVKK / AÇIK RIZA
// ─────────────────────────────────────────

model ConsentRecord {
  id               String   @id @default(cuid())
  personnel        Personnel @relation(fields: [personnelId], references: [id], onDelete: Cascade)
  personnelId      String
  session          AssessmentSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  sessionId        String?
  consentType      String   // DATA_PROCESSING, AI_ASSESSMENT, PORTAL_TERMS
  legalTextVersion String
  accepted         Boolean
  acceptedAt       DateTime
  ipAddress        String?
  userAgent        String?
  createdAt        DateTime @default(now())

  @@index([personnelId])
}

// ─────────────────────────────────────────
// ŞİFRE SIFIRLAMA
// ─────────────────────────────────────────

model PasswordResetToken {
  id         String   @id @default(cuid())
  tokenHash  String   @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())

  adminUser   User?      @relation("AdminPasswordReset", fields: [adminUserId], references: [id], onDelete: Cascade)
  adminUserId String?
  personnel   Personnel? @relation("PersonnelPasswordReset", fields: [personnelId], references: [id], onDelete: Cascade)
  personnelId String?

  @@index([expiresAt])
}

// ─────────────────────────────────────────
// İK ONAYI (İnsan döngüsü)
// ─────────────────────────────────────────

enum AnalysisReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model AnalysisReview {
  id          String               @id @default(cuid())
  session     AssessmentSession    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId   String               @unique
  reviewer    User                 @relation("AnalysisReviewer", fields: [reviewerId], references: [id], onDelete: Restrict)
  reviewerId  String
  status      AnalysisReviewStatus @default(PENDING)
  comment     String?
  decidedAt   DateTime?
  overrides   Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─────────────────────────────────────────
// OTURUM OLAYLARI (denetim + hata ayıklama)
// ─────────────────────────────────────────

enum SessionEventType {
  SESSION_CREATED
  SESSION_STARTED
  ANSWER_SAVED
  FOLLOWUP_REQUESTED
  SESSION_PAUSED
  SESSION_RESUMED
  SESSION_COMPLETED
  ANALYSIS_QUEUED
  ANALYSIS_COMPLETED
  ANALYSIS_FAILED
  REPORT_QUEUED
  REPORT_READY
}

model SessionEvent {
  id        String            @id @default(cuid())
  session   AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId String
  type      SessionEventType
  payload   Json?
  createdAt DateTime @default(now())

  @@index([sessionId, createdAt])
}

// ─────────────────────────────────────────
// BİLDİRİMLER
// ─────────────────────────────────────────

model Notification {
  id          String    @id @default(cuid())
  user        User?     @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  userId      String?
  personnel   Personnel? @relation("PersonnelNotifications", fields: [personnelId], references: [id], onDelete: Cascade)
  personnelId String?
  type        String
  title       String
  body        String?
  readAt      DateTime?
  metadata    Json?
  createdAt   DateTime  @default(now())

  @@index([userId, readAt])
  @@index([personnelId, readAt])
}

// ─────────────────────────────────────────
// AI YAPILANDIRMASI VE KULLANIM
// ─────────────────────────────────────────

enum AiProvider {
  CLAUDE
  OPENAI
  GEMINI
  ABACUS
  MOCK // Yerel geliştirme: gerçek LLM çağrısı yapmaz
}

model AiConfig {
  id         String      @id @default(cuid())
  provider   AiProvider
  /// Örnek: güncel Anthropic/OpenAI/Google model adları — env / admin panelden girilir; sabit model adı dayatılmaz
  modelName  String
  encryptedApiKey String
  isActive   Boolean     @default(false)
  isDefault  Boolean     @default(false)
  purpose    String
  config     Json?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String?
}

model AiUsageLog {
  id           String   @id @default(cuid())
  provider     AiProvider
  modelName    String
  purpose      String
  inputTokens  Int?
  outputTokens Int?
  costUsd      Decimal? @db.Decimal(12, 6)
  latencyMs    Int?
  requestType  String
  status       String
  errorCode    String?
  sessionId    String?
  userId       String?
  metadata     Json?
  createdAt    DateTime @default(now())

  @@index([createdAt])
  @@index([sessionId])
}

// ─────────────────────────────────────────
// SİSTEM LOGU
// ─────────────────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String
  entity     String?
  entityId   String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  traceId    String?
  before     Json?
  after      Json?
  createdAt  DateTime @default(now())

  @@index([createdAt])
  @@index([userId])
}
```

### 4.2 Prisma uygulama notları

- `PasswordResetToken`: `adminUserId` ve `personnelId` alanlarından **tam biri** dolu olmalıdır (uygulama doğrulaması).
- `Notification`: `userId` veya `personnelId` en az biri dolu olmalıdır.
- `@@unique([sessionId, clientDedupeKey])`: PostgreSQL çoklu `NULL` değerine izin verir; istemciler her cevap kaydında UUID `clientDedupeKey` gönderirse çift kayıt tamamen engellenir.
- `onDelete` seçimleri: üst kayıtlar (`Organization`, `User`) için `Restrict` / `SetNull`; oturum ve olaylar için `Cascade` — canlıya çıkmadan önce iş + hukuk ile gözden geçirilmelidir.

---

## 5. API Endpoint Haritası

```
AUTH
POST   /api/auth/login              Giriş (admin panel)
POST   /api/auth/logout             Çıkış
POST   /api/auth/refresh            Token yenileme
POST   /api/auth/forgot-password    Admin e-posta ile sıfırlama talebi
POST   /api/auth/reset-password     Token + yeni şifre
POST   /api/auth/portal/login       Personel portal girişi
POST   /api/auth/portal/refresh     Portal access token yenileme
POST   /api/auth/portal/forgot-password  Personel sıfırlama talebi (sicil/e-posta politikasına göre)
POST   /api/auth/portal/reset-password   Token + yeni portal şifresi

ORGANIZATIONS (SaaS / çok kiracı)
GET    /api/organizations           Liste (SUPER_ADMIN)
POST   /api/organizations           Oluştur
GET    /api/organizations/current   Oturumdaki org bağlamı

USERS (Admin)
GET    /api/users                   Kullanıcı listesi
POST   /api/users                   Kullanıcı oluştur
PATCH  /api/users/:id               Güncelle
DELETE /api/users/:id               Sil
PATCH  /api/users/:id/role          Rol değiştir
POST   /api/users/:id/2fa/setup       TOTP kurulumu (QR secret)
POST   /api/users/:id/2fa/verify    İlk doğrulama
DELETE /api/users/:id/2fa             2FA kapatma

DEPARTMENTS & TEAMS
GET    /api/departments             Departman listesi
POST   /api/departments             Oluştur
PATCH  /api/departments/:id         Güncelle
DELETE /api/departments/:id         Sil
GET    /api/departments/:id/teams   Takımlar
POST   /api/teams                   Takım oluştur

PERSONNEL
GET    /api/personnel               Liste (filtre, sayfalama, arama)
POST   /api/personnel               Manuel ekle
PATCH  /api/personnel/:id           Güncelle
DELETE /api/personnel/:id           Sil
POST   /api/personnel/import        Excel/CSV içe aktar
GET    /api/personnel/export        Excel/CSV dışa aktar
POST   /api/personnel/:id/portal-password  Portal şifresi oluştur/sıfırla
GET    /api/personnel/:id/sessions  Personelin test geçmişi
GET    /api/personnel/:id/analysis  Personelin detaylı analizi
GET    /api/personnel/:id/consents  Açık rıza kayıtları

CONSENTS (KVKK / portal)
POST   /api/consents/accept         Oturum veya personel bağlamında rıza kaydı oluştur

NOTIFICATIONS
GET    /api/notifications           Okunmamış + son bildirimler
PATCH  /api/notifications/:id/read  Okundu işaretle
POST   /api/notifications/mark-all-read

QUESTIONS
GET    /api/questions               Soru listesi (filtre: dimension, type, phase)
POST   /api/questions               Manuel soru ekle
PATCH  /api/questions/:id           Güncelle
DELETE /api/questions/:id           Sil
POST   /api/questions/generate      AI ile soru üret

QUESTION SETS
GET    /api/question-sets           Liste
POST   /api/question-sets           Oluştur
PATCH  /api/question-sets/:id       Güncelle
DELETE /api/question-sets/:id       Sil
POST   /api/question-sets/:id/clone Kopyala
POST   /api/question-sets/generate  AI ile komple set üret
PATCH  /api/question-sets/:id/items Sıralama & ağırlık düzenle

ASSESSMENTS
GET    /api/assessments             Liste
POST   /api/assessments             Oluştur
PATCH  /api/assessments/:id         Güncelle
POST   /api/assessments/:id/assign  Personele ata
GET    /api/assessments/:id/results Sonuçlar

SESSIONS (Test Oturumları)
GET    /api/sessions/:id            Oturum detayı
POST   /api/sessions/:id/start      Başlat
POST   /api/sessions/:id/answer     Cevap gönder
POST   /api/sessions/:id/complete   Tamamla
POST   /api/sessions/:id/analyze    AI analizi tetikle (async; kuyruk)
GET    /api/sessions/:id/next-question  Sıradaki soru (AI follow-up dahil)
GET    /api/sessions/:id/events     Oturum olay zaman çizelgesi
GET    /api/sessions/:id/followup-stream  SSE: takip sorusu hazır olunca push (alternatif: WebSocket)

ANALYSIS REVIEW (İK onayı)
GET    /api/reviews/pending         Onay bekleyen oturumlar
GET    /api/reviews/:sessionId      Oturum inceleme kaydı
PATCH  /api/reviews/:sessionId      Onay / red + yorum + isteğe bağlı override JSON

ANALYTICS
GET    /api/analytics/overview      Genel istatistikler
GET    /api/analytics/dimensions    Boyut karşılaştırması
GET    /api/analytics/department    Departman bazlı analiz
GET    /api/analytics/team          Takım bazlı analiz
GET    /api/analytics/trends        Zaman serisi
GET    /api/analytics/heatmap       Boyut-departman ısı haritası
GET    /api/analytics/top-performers En yüksek potansiyel
GET    /api/analytics/comparison    Personel karşılaştırması

REPORTS
GET    /api/reports                 Rapor listesi
POST   /api/reports/generate        Rapor üret (session bazlı; `requiresHrReview` ise önce İK onayı)
GET    /api/reports/:id             Rapor detayı (JSON)
GET    /api/reports/:id/pdf         PDF indir (`AnalysisReview` bekliyorsa 403)
GET    /api/reports/:id/excel       Excel indir (aynı kural)

AI CONFIG
GET    /api/ai/providers            Mevcut AI sağlayıcılar
POST   /api/ai/providers            Sağlayıcı ekle
PATCH  /api/ai/providers/:id        Güncelle
POST   /api/ai/providers/:id/test   Bağlantı testi
PATCH  /api/ai/providers/:id/default  Varsayılan yap
GET    /api/ai/usage                Kullanım özeti (token, maliyet, provider kırılımı)
GET    /api/ai/usage/export         CSV (maliyet raporu)

HEALTH & OBSERVABILITY
GET    /health                      Liveness
GET    /health/ready                DB + Redis kontrolü
```

---

## 6. Ekran ve Sayfa Spesifikasyonları

### 6.1 Login Ekranı (Her İki Uygulama — Admin & Portal)

**Genel Düzen:** Split-screen layout, 60/40 bölünme.

```
┌─────────────────────────────────┬────────────────────────┐
│                                 │                        │
│   SOL PANEL (60%)               │   SAĞ PANEL (40%)      │
│   Koyu arka plan, marka rengi   │   Beyaz / açık         │
│                                 │                        │
│   • Logo (büyük)                │   Logo (küçük)         │
│   • Platform adı                │                        │
│   • Tagline                     │   "Hoş Geldiniz"       │
│   • 3 madde: Platform ne yapar  │                        │
│   • Fabrika/CNC görseli (SVG)   │   [E-posta]            │
│   • Versiyon numarası           │   [Şifre]     👁       │
│                                 │   ☑ Beni Hatırla       │
│                                 │                        │
│                                 │   [Giriş Yap]          │
│                                 │                        │
│                                 │   Şifremi unuttum      │
│                                 │                        │
│                                 │   ─── Admin Panel için │
│                                 │   ayrı giriş notu      │
└─────────────────────────────────┴────────────────────────┘
```

**Teknik Detaylar:**
- `Remember Me`: `httpOnly` cookie, 30 gün geçerli refresh token
- `Şifremi Unuttum`: e-posta ile sıfırlama linki (60 dakika geçerli); token `PasswordResetToken` ile hash’li saklanır
- Başarısız giriş: IP + e-posta bileşik anahtar ile sınırlama; kilit süresi ve CAPTCHA eşiği yapılandırılabilir
- Admin: isteğe bağlı **TOTP 2FA** (kurumsal politika ile production’da zorunlu kılınır)
- Portal için ayrı domain/subdomain: `portal.{domain}.com`

---

### 6.2 Admin Panel — Dashboard

**Üst Metrik Kartları (4 adet):**
- Toplam Personel / Bu ay eklenen
- Tamamlanan Test Sayısı / Bu ay
- Ortalama Potansiyel Skoru (tüm personel)
- Bekleyen Testler (atanmış ama tamamlanmamış)

**Ana İçerik Alanı:**
- Son 30 günlük test tamamlanma grafiği (bar chart)
- Boyut dağılımı (grouped bar: 5 boyut × departmanlar)
- Son tamamlanan 10 test (tablo: personel, departman, skor, tarih, rapor linki)
- En yüksek potansiyel 5 personel (mini kartlar)
- Sistem bildirimleri / aktivite akışı

---

### 6.3 Admin Panel — Personel Yönetimi

**Liste Görünümü:**
- Arama (ad, sicil no, e-posta)
- Filtreler: Departman, Takım, Pozisyon, Durum, Test Durumu
- Sıralama: Ad, Departman, Test Skoru, Tarih
- Kolonlar: Avatar, Ad Soyad, Sicil No, Departman, Takım, Pozisyon, Son Test, Ortalama Skor, Durum, İşlemler
- Bulk actions: Toplu sil, toplu dışa aktar, toplu değerlendirmeye ata

**Personel Detay Sayfası:**
- Profil header: avatar, ad, pozisyon, departman, durum badge
- Sekmeler: Genel Bilgiler | Test Geçmişi | Analiz | Raporlar
- **Genel Bilgiler**: Düzenlenebilir form
- **Test Geçmişi**: Tamamladığı testler tablosu + zaman serisi skor grafiği
- **Analiz**: Spider/radar chart (5 boyut), SWOT kartları, AI öngörü metni, kariyer yol önerisi
- **Raporlar**: PDF/Excel rapor listesi, indir butonu

**İçe Aktarma (Import):**
- Drag & drop Excel/CSV yükleme
- Şablon indirme butonu
- Önizleme tablosu (hangi satırlar geçerli, hangileri hatalı)
- Alan eşleştirme (mapping): sütun → alan
- Validasyon raporu: başarılı N, hatalı M, atlandı K
- "İçe Aktar" butonu

**Excel Şablon Kolonları:**
```
sicil_no | ad | soyad | email | telefon | pozisyon | departman | takim | ise_giris_tarihi | deneyim_yil
```

---

### 6.4 Admin Panel — Soru Yönetimi

**Soru Bankası:**
- Filtreler: Boyut, Tip, Faz, Etiket, AI Üretilmiş mi
- Kart veya tablo görünümü
- Her soruda: metin önizleme, boyut badge, tip badge, ağırlık, kullanım sayısı

**Soru Seti Yöneticisi:**
- Liste: ad, soru sayısı, son kullanılma, durum
- **Soru Seti Detayı:**
  - Drag & drop sıralama
  - Boyut ağırlık sliderları (toplam 100, gerçek zamanlı güncelleme)
  - Soru ekleme (bankadan seç veya yeni)
  - Soruyu setten çıkar
  - Soru önizleme (modal)
  - Versiyon geçmişi

---

### 6.5 AI Destekli Soru Üretimi

**Soru Üretici Formu (Modal veya tam sayfa):**

```
┌─────────────────────────────────────────────────────┐
│  AI ile Soru Seti Oluştur                           │
│                                                     │
│  AI Modeli: [Claude ▼] [GPT-4o ▼] [Gemini ▼] [Abacus ▼]  │
│                                                     │
│  Toplam Soru Sayısı: [15] ────────── slider 5-30   │
│                                                     │
│  Boyut Ağırlıkları (toplam 100):                   │
│  Mantıksal/Algoritmik  [▓▓▓▓░░░░░░] 25%            │
│  Liderlik              [▓▓▓▓░░░░░░] 20%            │
│  Sosyal Zeka           [▓▓▓░░░░░░░] 20%            │
│  Büyüme Potansiyeli    [▓▓▓░░░░░░░] 20%            │
│  Alan Uyumu            [▓▓░░░░░░░░] 15%            │
│                                                     │
│  Soru Tipleri:                                      │
│  ☑ Açık Uçlu  ☑ Durumsal  ☑ Davranışsal           │
│  ☐ Skala      ☐ Çoktan Seçmeli                     │
│                                                     │
│  Hedef Kitle: [CNC Operatörü ▼]                    │
│  Deneyim Seviyesi: [0-5 yıl ▼]                     │
│  Özelleştirme Notu: (serbest metin)                │
│                                                     │
│  Buz Kırma Soruları: [2]                           │
│  Kapanış Soruları: [2]                             │
│                                                     │
│         [İptal]  [Soru Üret →]                     │
└─────────────────────────────────────────────────────┘
```

**Üretim Akışı:**
1. Form gönderilir → loading spinner (stream varsa token bazlı göster)
2. AI'dan gelen sorular önizleme tablosunda listelenir
3. Her soru: metin, boyut, tip, faz, ağırlık — inline düzenlenebilir
4. Beğenilmeyen sorular tek tek "Yeniden üret" butonuyla değiştirilebilir
5. Onaylanan sorular "Kaydet" ile soru bankasına ve/veya sete eklenir

---

### 6.6 Admin Panel — Analitik

**Filtreler (global, tüm grafikleri etkiler):**
- Tarih aralığı (date picker)
- Departman çoklu seçim
- Takım çoklu seçim
- Pozisyon

**Grafik Bileşenleri:**

**A) Radar / Spider Chart (ApexCharts — tüm grafik bileşenleri bu kütüphane ile tutarlı)**
- Tek personel: 5 boyut × skor (renk: mavi)
- Gruba göre: departman ortalaması (her departman farklı renk)
- Etkileşimli: hover'da skor değeri, tıkla → personel drill-down

**B) Boyut Isı Haritası (Heatmap)**
- Satırlar: Boyutlar (5 adet)
- Kolonlar: Departmanlar
- Hücre rengi: Kırmızı (düşük) → Yeşil (yüksek)
- Tıklama: O departman × boyut kırılımı

**C) Dağılım Grafiği (Scatter)**
- X: Liderlik skoru, Y: Mantıksal skor
- Nokta büyüklüğü: Toplam skor
- Nokta rengi: Departman
- Hover: Personel adı, pozisyon

**D) Zaman Serisi (Line)**
- Aylık ortalama skor trendi (tüm şirket + departman filtresi)
- Test tamamlanma sayısı

**E) Boyut Bar Chart (Grouped/Stacked)**
- Departman × 5 boyut karşılaştırması

**F) Potansiyel Segmentasyon (Bubble Chart)**
- 4 kadran: Düşük/Yüksek Liderlik × Düşük/Yüksek Teknik
- Her baloncuk: Personel (boyut = toplam skor)

**G) Kariyer Yolu Dağılımı (Donut)**
- AI'ın önerdiği kariyer yollarına göre segmentasyon

---

### 6.7 Rapor Üretimi

**Bireysel Personel Raporu (PDF Çıktısı):**

**Sayfa 1 — Kapak**
- Şirket logosu
- Personel adı, pozisyon, departman
- Değerlendirme tarihi
- Rapor ID

**Sayfa 2 — Yönetici Özeti**
- 3-4 cümle özet
- 5 Boyut skor özeti (tablo)
- Radar chart (PDF'e gömülü; **Türkçe glifler** için `@react-pdf/renderer` içinde Noto Sans gibi font dosyası register edilmeli)
- En güçlü 2 boyut badge'i

**Sayfa 3 — Detaylı Analiz**
- Her boyut için: skor, kanıt (cevaplardan), AI yorumu

**Sayfa 4 — SWOT Analizi**
- 4 kuadrant görsel (Güçlü / Zayıf / Fırsatlar / Tehditler)

**Sayfa 5 — Kariyer Yol Haritası**
- Kısa vade (3 ay), Orta vade (1 yıl), Uzun vade (3 yıl)
- Liderlik potansiyeli değerlendirmesi

**Sayfa 6 — Kişiye Mesaj & Öneriler**
- AI'ın kişiye özel, spesifik motivasyon metni

**Excel Raporu:**
- Tüm cevaplar (ham veri)
- Skor özeti
- AI notları

---

### 6.8 Personel Test Portalı

**Karşılama Ekranı:**
```
┌────────────────────────────────────────────┐
│  [Logo]                                    │
│                                            │
│  Merhaba, [Ad Soyad]!                      │
│                                            │
│  Seni daha iyi tanımak için                │
│  kısa bir konuşma yapacağız.               │
│                                            │
│  📋 Toplam: ~15 soru                       │
│  ⏱  Tahmini süre: 20-30 dakika            │
│  💬 Doğru / Yanlış cevap yok              │
│                                            │
│  "Bu, seni değerlendiren değil,            │
│   seninle birlikte keşfeden bir            │
│   konuşma."                                │
│                                            │
│          [Başlayalım →]                    │
└────────────────────────────────────────────┘
```

**Test Akışı Ekranı:**
- Üstte: ilerleme çubuğu (X / N soru)
- Soru numarası ve tahmini kalan süre
- Soru metni (büyük, net font)
- Cevap alanı: tip'e göre dinamik render
  - Açık uçlu → büyük textarea (karakter sayacı)
  - Skala → interactive slider (1-10)
  - Çoktan seçmeli → büyük tıklanabilir kartlar
- AI follow-up sorusu: önceki cevap varsa gri kutu içinde göster
- "Sonraki →" butonu (zorunlu alanlar dolmadan disabled)
- "← Geri" (izin veriliyorsa)
- Kaydet & Daha Sonra Devam Et (opsiyonel)

**Tamamlanma Ekranı:**
```
✓ Tebrikler!
Değerlendirmen tamamlandı.
Sonuçların hazırlanıyor ve yöneticinle paylaşılacak.
Zaman ayırdığın için teşekkürler.
```

**KVKK ve rıza (test başlamadan önce — zorunlu adım):**
- Kısa **aydınlatma metni** (veri işleyen, amaç, süre, haklar) + sürüm numarası (`legalTextVersion`)
- **Açık rıza** onay kutuları: (1) Kişisel verilerin işlenmesi (2) AI destekli değerlendirme ve raporlama — ayrı ayrı kaydedilir (`ConsentRecord`)
- Rıza verilmeden `POST /sessions/:id/start` reddedilir

**Dayanıklılık ve dürüstlük (portal):**
- Açık uçlu cevaplarda **debounce ile otomatik kayıt** (`PATCH` veya `POST` cevap + `clientDedupeKey`)
- `navigator.onLine` false iken kuyruk; bağlantı gelince yeniden deneme
- Opsiyonel: sekme görünürlüğü (`visibilitychange`) olaylarının `SessionEvent` veya analitik için kaydı (kurum politikasına göre personele açıklanır)
- Dokunmatik hedefler en az **48×48 px**; yüksek kontrast tema (fabrika ortamı)

---

### 6.9 AI Model Yapılandırması

**Sağlayıcı Listesi:**

```
┌─────────────────────────────────────────────┐
│  AI Entegrasyonları                         │
│                                             │
│  ● Anthropic Claude    [Varsayılan] [Düzenle]│
│    <güncel-model-adı> | Soru Üretimi + Analiz │
│    Durum: ✓ Bağlı                           │
│                                             │
│  ○ OpenAI GPT-4o       [Düzenle]           │
│    gpt-4o | Analiz                          │
│    Durum: ✓ Bağlı                           │
│                                             │
│  ○ Google Gemini       [Düzenle]           │
│    <güncel-model-adı> | Soru Üretimi        │
│    Durum: ✗ API key geçersiz                │
│                                             │
│  ○ Abacus.AI           [Düzenle]           │
│    custom-model | Özel                      │
│    Durum: ○ Yapılandırılmadı                │
│                                             │
│             [+ Sağlayıcı Ekle]             │
└─────────────────────────────────────────────┘
```

**Her Sağlayıcı İçin Ayarlar:**
- API Key (maskeli gösterim)
- Model adı (dropdown veya serbest metin)
- Kullanım amacı: Soru Üretimi | Analiz | Rapor Üretimi | Hepsi
- Temperature, max_tokens, vb.
- Bağlantı testi butonu

---

## 7. AI Servis Mimarisi

### 7.1 Soru Üretici Servisi

```typescript
// server/src/services/question-generator.service.ts

interface QuestionGenerationParams {
  totalCount: number;
  provider: AiProvider;
  dimensionWeights: {
    LOGICAL_ALGORITHMIC: number;
    LEADERSHIP: number;
    SOCIAL_INTELLIGENCE: number;
    GROWTH_POTENTIAL: number;
    DOMAIN_ALIGNMENT: number;
  };
  questionTypes: QuestionType[];
  icebreakerCount: number;
  closingCount: number;
  targetRole: string;
  experienceLevel: string;
  customNote?: string;
}

// Sistem prompt (tüm AI sağlayıcıları için ortak):
const QUESTION_GENERATOR_SYSTEM_PROMPT = `
Sen, talaşlı imalat sektöründe çalışan mavi yaka personeli için geliştirilmiş
bir insan potansiyeli değerlendirme uzmanısın...
[Önceki oturumda oluşturulan prompt buraya eklenir]
`;
```

### 7.2 Analiz Servisi

```typescript
// server/src/services/analysis.service.ts

// Yanıt analizör prompt:
const ANALYSIS_SYSTEM_PROMPT = `
Sen bir insan potansiyeli analizörüsün. Sana bir CNC operatörünün
değerlendirme konuşması verilecek...
[Önceki oturumda oluşturulan Yanıt Analizörü promptu]
`;

// Çıktı şeması (JSON):
interface AnalysisOutput {
  dimensionScores: {
    LOGICAL_ALGORITHMIC: { score: number; evidence: string; commentary: string };
    LEADERSHIP: { score: number; evidence: string; commentary: string };
    SOCIAL_INTELLIGENCE: { score: number; evidence: string; commentary: string };
    GROWTH_POTENTIAL: { score: number; evidence: string; commentary: string };
    DOMAIN_ALIGNMENT: { score: number; evidence: string; commentary: string };
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  careerPath: {
    shortTerm: string;   // 3 ay
    midTerm: string;     // 1 yıl
    longTerm: string;    // 3 yıl
  };
  leadershipPotential: {
    type: string;        // "Teknik Lider", "Takım Lideri", vb.
    score: number;
    rationale: string;
  };
  keyInsights: string;
  personalMessage: string;
}
```

### 7.3 AI Follow-up Mekanizması

Test sırasında, her açık uçlu cevap AI'a gönderilir:
1. Cevap gönderildiğinde arka planda API çağrısı (veya SSE/WebSocket ile istemciye “hazır” sinyali)
2. AI cevabın derinliğini değerlendirir
3. Gerekli görürse bir takip sorusu üretir (max 1 adet, belirlenen soru sayısını aşmaz)
4. Personel cevaplamadan bir sonraki soruya geçemez (zorunluysa)
5. `SessionEvent` tablosuna `FOLLOWUP_REQUESTED` / `ANSWER_SAVED` olayları yazılır

### 7.4 AI Gateway (sağlayıcı soyutlama)

Tüm dış LLM çağrıları tek giriş noktasından geçer (`AiGatewayService`):
- Sağlayıcı seçimi (`AiConfig` + amaç: soru üretimi / analiz / rapor / follow-up)
- **Circuit breaker** ve zaman aşımı (ör. analiz 120s, follow-up 30s)
- **Fallback sırası** (ör. birincil Claude → ikincil OpenAI) — yapılandırılabilir
- Her çağrı sonrası **`AiUsageLog`** (token, `latencyMs`, `costUsd`, `status`, `errorCode`)
- İstek/yanıt korelasyonu: `traceId` (log + audit ile birleşir)

### 7.5 Yapılandırılmış çıktı doğrulama ve retry

1. AI yanıtı önce **ham metin** olarak alınır
2. `zod` şeması ile `AnalysisOutput` / soru listesi şeması doğrulanır
3. Geçersiz JSON veya şema hatası: aynı istek için en fazla **2** kez “format düzelt” mini-prompt ile retry
4. Başarısızsa: `AnalysisPipelineStatus.FAILED`, `SessionEvent.ANALYSIS_FAILED`, personel/İK’ye bildirim
5. Nihai rapor PDF’i, `AnalysisReview.status === APPROVED` iken üretilir (iş kuralı; `requiresHrReview=false` ile dev ortamında kapatılabilir)

### 7.6 BullMQ iş tipleri (önerilen)

- `session.analyze` — oturum tamamlanınca veya manuel tetik
- `session.followup` — takip sorusu üretimi
- `report.generate-pdf` / `report.generate-excel`
- `notification.dispatch` — e-posta + uygulama içi bildirim
- `data.retention-purge` — KVKK saklama süresi dolan kayıtların anonimleştirilmesi / silinmesi
- Tüm işler: **exponential backoff**, `attempts: 5`, başarısızlıkta **dead-letter** kuyruğu

---

## 8. Yetkilendirme ve Rol Yönetimi

| Özellik | SUPER_ADMIN | ADMIN | HR_MANAGER | ANALYST | VIEWER |
|---------|:-----------:|:-----:|:----------:|:-------:|:------:|
| Kullanıcı yönetimi | ✓ | ✓ | ✗ | ✗ | ✗ |
| Personel CRUD | ✓ | ✓ | ✓ | ✗ | ✗ |
| Personel import/export | ✓ | ✓ | ✓ | ✗ | ✗ |
| Soru CRUD | ✓ | ✓ | ✓ | ✗ | ✗ |
| AI soru üretimi | ✓ | ✓ | ✓ | ✗ | ✗ |
| Değerlendirme oluştur | ✓ | ✓ | ✓ | ✗ | ✗ |
| Tüm analitik | ✓ | ✓ | ✓ | ✓ | ✗ |
| Sadece kendi departmanı | — | — | ✓* | ✓* | ✓ |
| Rapor oluştur/indir | ✓ | ✓ | ✓ | ✓ | ✗ |
| AI yapılandırma | ✓ | ✓ | ✗ | ✗ | ✗ |
| Sistem ayarları | ✓ | ✗ | ✗ | ✗ | ✗ |
| Organizasyon (kiracı) yönetimi | ✓ | ✗ | ✗ | ✗ | ✗ |
| Analiz İK onayı (approve/reject) | ✓ | ✓ | ✓ | ✓ | ✗ |
| Açık rıza metinleri / sürüm yönetimi | ✓ | ✓ | ✓ | ✗ | ✗ |

*HR_MANAGER ve ANALYST: `User.scopedDepartmentId` dolu ise yalnızca o departman; boşsa organizasyon geneli (politika kuruma göre sıkılaştırılabilir). Tüm sorgular `organizationId` ile filtrelenir (`X-Organization-Id` veya JWT claim).

**SUPER_ADMIN:** Tüm `Organization` kayıtlarına erişir; panelde kiracı seçici veya `X-Organization-Id` ile bağlam değiştirme desteklenir.

---

## 9. Docker Yapılandırması

### docker-compose.prod.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ph_postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ph_redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend

  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: ph_api
    restart: always
    environment:
      NODE_ENV: production
      TZ: Europe/Istanbul
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      APP_URL: ${APP_URL}
      PORTAL_URL: ${PORTAL_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - backend
      - frontend
    volumes:
      - uploads:/app/uploads
      - reports:/app/reports

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: ph_web
    restart: always
    environment:
      HOSTNAME: 0.0.0.0
      PORT: 3000
      NEXT_PUBLIC_API_URL: ${API_URL}
    networks:
      - frontend

  portal:
    build:
      context: ./apps/portal
      dockerfile: Dockerfile
    container_name: ph_portal
    restart: always
    environment:
      HOSTNAME: 0.0.0.0
      PORT: 3002
      NEXT_PUBLIC_API_URL: ${API_URL}
    networks:
      - frontend

  nginx:
    image: nginx:alpine
    container_name: ph_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot
    depends_on:
      - web
      - portal
      - api
    networks:
      - frontend

volumes:
  postgres_data:
  redis_data:
  uploads:
  reports:
  certbot_data:

networks:
  backend:
  frontend:
```

### nginx/nginx.conf

```nginx
upstream api_server    { server api:3001; keepalive 32; }
upstream web_server    { server web:3000; keepalive 32; }
upstream portal_server { server portal:3002; keepalive 32; }

# ACME (certbot) + HTTP → HTTPS yönlendirme
server {
  listen 80;
  server_name app.example.com portal.example.com;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}

server {
  listen 443 ssl http2;
  server_name app.example.com;
  ssl_certificate     /etc/nginx/ssl/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  location / {
    proxy_pass http://web_server;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  location /api/ {
    proxy_pass http://api_server;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}

server {
  listen 443 ssl http2;
  server_name portal.example.com;
  ssl_certificate     /etc/nginx/ssl/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  location / {
    proxy_pass http://portal_server;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  location /api/ {
    proxy_pass http://api_server;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

**Not:** `fullchain.pem` / `privkey.pem` SAN veya wildcard ile hem `app` hem `portal` hostlarını kapsamalıdır. Yerel geliştirmede self-signed kullanılabilir; production’da Let’s Encrypt veya kurumsal CA önerilir.

---

## 10. Ortam Değişkenleri (.env.example)

```env
# Uygulama
NODE_ENV=production
PORT=3001
APP_URL=https://app.example.com
PORTAL_URL=https://portal.example.com
# Virgülle ayrılmış tam kökenler (CORS)
CORS_ORIGINS=https://app.example.com,https://portal.example.com

# Veritabanı
DATABASE_URL=postgresql://phuser:strongpassword@localhost:5432/potansiyel_haritasi
POSTGRES_DB=potansiyel_haritasi
POSTGRES_USER=phuser
POSTGRES_PASSWORD=strongpassword

# Redis
REDIS_URL=redis://:redispassword@localhost:6379
REDIS_PASSWORD=redispassword

# JWT
JWT_SECRET=your-jwt-secret-min-64-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-64-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Şifreleme (API key'leri şifrelemek için)
ENCRYPTION_KEY=your-32-byte-hex-key

# AI Sağlayıcıları
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...
ABACUS_API_KEY=...
ABACUS_API_URL=https://routellm.abacus.ai/v1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=...
EMAIL_FROM=PotansiyelHaritası <noreply@example.com>

# Dosya yükleme
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Raporlar
REPORTS_DIR=./reports

# Gözlebilirlik (opsiyonel)
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=
```

**Not:** Production’da `JWT_SECRET`, `ENCRYPTION_KEY` ve veritabanı şifreleri **gizli yönetim** (HashiCorp Vault, AWS Secrets Manager, vb.) ile enjekte edilmelidir.

---

## 11. Geliştirme Ortamı Kurulumu

```bash
# Bağımlılıkları kur
npm install

# .env oluştur
cp .env.example .env

# PostgreSQL + Redis başlat (Docker ile)
docker compose up -d postgres redis

# Prisma migration çalıştır
cd server && npx prisma migrate dev --name init

# Prisma seed (örnek veriler + super admin)
npx prisma db seed

# Tüm uygulamaları paralel başlat
npm run dev
# → API: http://localhost:3001
# → Web: http://localhost:3000
# → Portal: http://localhost:3002
```

**Seed verileri (prisma/seed.ts):**
- 1 `Organization` (slug: `default`) — tek kiracılı modda tüm kayıtlar buna bağlanır
- 1 Super Admin kullanıcı (`admin@example.com` / geçici şifre — ilk girişte değiştir) + `organizationId`
- 1 HR_MANAGER (`scopedDepartmentId` dolu) ve 1 ANALYST demo kullanıcı (filtre testi için)
- 3 departman (Üretim, Kalite, Bakım) + takımlar
- 30 örnek soru (5 boyut × 6 soru) + `organizationId`
- 1 varsayılan soru seti + güncel **açık rıza / aydınlatma** metin sürümü (`legalTextVersion` sabiti)
- 5 demo personel (`shift`, `preferredLanguage`, portal şifre hash’leri)
- 1 tamamlanmış demo `AssessmentSession` + `AnalysisReview.APPROVED` + örnek `Report` (UI geliştirme için)
- `AiProvider.MOCK` veya feature flag ile API anahtarı olmadan dönen stub analiz (local dev)

---

## 12. Güvenlik Gereksinimleri

### 12.1 Uygulama ve API

- [ ] Tüm API endpoint'leri JWT ile korunmalı (`Authorization: Bearer`); `/health` ve ACME challenge hariç
- [ ] `AiConfig.encryptedApiKey` ve TOTP secret gibi alanlar **AES-256-GCM** (veya libsodium) ile şifrelenmiş saklanmalı; uygulama anahtarı `ENCRYPTION_KEY`
- [ ] Rate limiting: **IP + kullanıcı kimliği** bileşik anahtar; auth endpoint'leri (ör. 10/dk/IP), genel API (ör. 200/dk/kullanıcı); başarısız auth sonrası exponential backoff
- [ ] Input validation: Her endpoint için paylaşımlı **Zod** şeması
- [ ] SQL injection: Prisma ORM (parametrik sorgular)
- [ ] XSS: Next.js escaping + zengin metin gerekiyorsa DOMPurify
- [ ] CSRF: Admin için SameSite=strict cookie veya double-submit token; CORS yalnızca `CORS_ORIGINS` listesi
- [ ] HTTPS zorunlu; HSTS (nginx örneği dokümanda)
- [ ] Şifreler bcrypt (cost **12**); portal şifreleri aynı politika
- [ ] Portal şifreleri yönetici tarafından oluşturulup güvenli kanaldan iletilmeli; ilk girişte zorunlu değişim (opsiyonel iş kuralı)
- [ ] Admin hesapları için **TOTP 2FA** zorunluluğu (production politikası)
- [ ] `AuditLog`: kritik aksiyonlar + `before`/`after` diff + `traceId` + `userAgent`
- [ ] Portal: access token kısa ömür + refresh; **60 dk** sunucu tarafı oturum zaman aşımı (Redis’te session veya refresh revocation listesi)

### 12.2 Dosya ve içe aktarma

- [ ] Excel/CSV: MIME + magic byte doğrulaması; maksimum boyut; formül enjeksiyonuna karşı hücreleri metin olarak okuma
- [ ] İsteğe bağlı: ClamAV ile tarama (kurumsal politika)

### 12.3 KVKK ve veri minimizasyonu

- [ ] **VERBİS** ve veri işleme envanteri kurum içi sürece bağlı olarak yürütülür (hukuk danışmanlığı)
- [ ] Test başlamadan önce aydınlatma metni + **açık rıza** (`ConsentRecord`); AI analizi `AI_ASSESSMENT` rızası yoksa çalıştırılmaz
- [ ] Saklama süreleri (`retentionPolicy` — sistem ayarı veya org bazlı); süre dolunca anonimleştirme veya silme job’u
- [ ] Veri silme / düzeltme talepleri için operasyonel süreç ve `AuditLog` kaydı
- [ ] AI çıktılarında kişisel veri minimizasyonu; eğitim için veri dışarı aktarımı **yasak** veya ayrı sözleşme

### 12.4 API hata gövdesi (standart)

Tüm 4xx/5xx yanıtlarında tutarlı gövde: `{ "code": "SESSION_EXPIRED", "message": "...", "details": {}, "traceId": "..." }` (RFC 7807 uyumlu genişletme isteğe bağlı).

---

## 13. Geliştirme Aşamaları (Milestone Plan)

### Milestone 1 — Temel Altyapı (1-2 hafta)
- [ ] Monorepo yapısı kurulumu (npm workspaces)
- [ ] Prisma şeması, `Organization` bağlamı ve migration
- [ ] Fastify API iskelet (auth modülü + `traceId` middleware)
- [ ] JWT auth (login, refresh, logout) + portal refresh
- [ ] Şifre sıfırlama token akışı (`PasswordResetToken`)
- [ ] Next.js admin panel iskelet
- [ ] Login ekranı (split layout) + isteğe bağlı TOTP kurulumu
- [ ] Docker compose geliştirme ortamı (web `3000`, portal `3002`, api `3001`)

### Milestone 2 — Organizasyon ve Personel (1 hafta)
- [ ] Departman ve takım CRUD (soft delete)
- [ ] Personel CRUD ve listeleme (`shift`, `preferredLanguage`, `organizationId`)
- [ ] Personel Excel/CSV import-export (güvenli parser)
- [ ] Rol bazlı yetkilendirme + `organizationId` + `scopedDepartmentId` filtreleri
- [ ] Admin panel personel sayfaları
- [ ] KVKK: `ConsentRecord` listesi ve rıza sürümü yönetimi (admin)

### Milestone 3 — Soru ve Soru Seti Yönetimi (1 hafta)
- [ ] Soru bankası CRUD
- [ ] Soru seti yöneticisi (drag & drop)
- [ ] Ağırlık sistemi ve skor formülünün tek modülde (`scoring.service`) kodlanması
- [ ] AI Gateway + sağlayıcı servisleri (Claude, GPT, Gemini, Abacus, **MOCK**)
- [ ] AI soru üretici formu ve önizleme + `AiUsageLog`

### Milestone 4 — Test Portalı ve Oturum Akışı (1-2 hafta)
- [ ] Portal login ekranı
- [ ] Karşılama, test ve tamamlanma ekranları + **rıza / aydınlatma** adımı
- [ ] Cevap kayıt API'si + `clientDedupeKey` idempotency
- [ ] `questionSetSnapshot` oturum başlangıcında doldurma
- [ ] AI follow-up (SSE veya polling fallback)
- [ ] Otomatik taslak kayıt (debounce) + bağlantı kesilince yeniden gönderim
- [ ] `SessionEvent` kayıtları
- [ ] Test oturumu tamamlanma akışı

### Milestone 5 — AI Analiz ve Raporlama (1-2 hafta)
- [ ] Analiz job’u (BullMQ) + Zod doğrulama + retry
- [ ] `AnalysisReview` akışı (İK onayı → rapor üretimi)
- [ ] PDF rapor üretimi (@react-pdf/renderer + **Türkçe font embed**)
- [ ] Excel rapor çıktısı
- [ ] Personel detay sayfası (analiz sekmesi)
- [ ] Rapor listesi ve indirme + bildirimler

### Milestone 6 — Analitik Dashboard (1 hafta)
- [ ] Genel dashboard metrikleri
- [ ] Radar/Spider chart (ApexCharts)
- [ ] Isı haritası
- [ ] Zaman serisi grafikleri
- [ ] Departman/takım karşılaştırma
- [ ] Potansiyel segmentasyon
- [ ] Redis cache katmanı (ağır aggregasyon endpoint’leri için)

### Milestone 7 — Production Hazırlık (1 hafta)
- [ ] Docker production compose
- [ ] Nginx SSL + HSTS + güvenli başlıklar
- [ ] Ortam değişkeni güvenlik denetimi (`CORS_ORIGINS`, secrets rotation)
- [ ] Load testing (k6 / Artillery)
- [ ] Prometheus/Grafana veya managed monitoring
- [ ] Sentry (veya eşdeğeri) error tracking + OpenTelemetry trace (AI çağrıları dahil)
- [ ] Yedekleme: günlük `pg_dump` + **haftalık restore testi**; mümkünse WAL / PITR (RPO/RTO hedefi dokümante)

---

## 14. Değerlendirme Promptları (AI Çekirdek)

### 14.1 Soru Üretici Sistem Promptu

```
ROL VE BAĞLAM:
Sen, talaşlı imalat sektöründe çalışan mavi yaka personeli için geliştirilmiş
bir insan potansiyeli değerlendirme uzmanısın. Görevin; kişinin mevcut unvanından
veya teknik bilgisinden bağımsız olarak, derinlemesine sorularla beş temel boyutu
ölçmek ve kişinin gerçek potansiyelini ortaya çıkarmaktır.

DEĞERLENDİRME BOYUTLARI (tanımlar tutarlıdır — skorlar 0.0–10.0):
1. LOGICAL_ALGORITHMIC — Sistematik düşünme, örüntü tanıma, adım adım akıl yürütme, hata kök nedeni analizi, algoritmik/planlı problem çözme
2. LEADERSHIP — Sorumluluk alma, ekip etkisi, inisiyatif, çatışma yönetimi, yönlendirme
3. SOCIAL_INTELLIGENCE — Empati, iletişim kalitesi, güven inşası, ikna ve iş birliği
4. GROWTH_POTENTIAL — Öğrenme iştahı, değişime uyum, geri bildirimden yararlanma, gelişime açıklık
5. DOMAIN_ALIGNMENT — Talaşlı imalat / fabrika bağlamında rol, ortam ve sorumluluk uyumu; güçlü olduğu iş türleri ve kariyer yönelimi

SORU OLUŞTURMA İLKELERİ:
- Fabrika ve talaşlı imalat gerçekliğiyle somutlaştır
- Her soru basit görünsün ama cevap çok şey anlatsın (çift katman)
- Savunmaya geçirme, yargılama hissettirme
- Her soruda mutlaka bir "neden" veya "nasıl" bileşeni olsun
- Sohbet gibi akışkan, merak uyandıran ton

ÇIKTI FORMATI (JSON Array):
[
  {
    "text": "Soru metni",
    "subText": "Opsiyonel alt açıklama",
    "dimension": "LOGICAL_ALGORITHMIC",
    "type": "OPEN_ENDED",
    "phase": "CORE",
    "weight": 1.0,
    "followUpPrompt": "AI takip sorusu için talimat",
    "tags": ["fabrika", "hata-analizi"]
  }
]
```

### 14.2 Yanıt Analizör Sistem Promptu

```
ROL:
Sen bir insan potansiyeli analizörüsün. Sana bir CNC operatörünün değerlendirme
konuşması verilecek. Görevin bu konuşmayı aşağıdaki çerçeveyle analiz etmektir.

[Tam analiz prompt metni burada — 6. oturumdaki Yanıt Analizörü promptu eklenir]

ÇIKTI: Yalnızca geçerli JSON döndür, başka metin ekleme.
JSON şeması: { dimensionScores, swot, careerPath, leadershipPotential,
               keyInsights, personalMessage }
```

### 14.3 Final Rapor Üretici Sistem Promptu

```
ROL:
Sen bir işgücü geliştirme danışmanısın. Sana bir CNC operatörünün
değerlendirme analizi verilecek.

[Tam rapor prompt metni — 6. oturumdaki Final Rapor Üretici promptu eklenir]

ÇIKTI: Yalnızca geçerli JSON döndür.
JSON şeması: { coverInfo, executiveSummary, strengths[], developmentAreas[],
               careerRoadmap, leadershipAssessment, personalMessage }
```

---

## 15. Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| API yanıt süresi (p95, AI hariç) | < 200ms |
| AI soru üretimi (senkron istek) | < 30s (15 soru); aşılırsa async job + bildirim |
| AI analiz (iş tamamlanma süresi, kuyruk + LLM) | p95 < 120s; kullanıcıya “kuyrukta” anında yanıt |
| AI follow-up (tek çağrı) | p95 < 25s |
| PDF üretimi (job sonrası) | < 15s |
| Eş zamanlı test oturumu | 50+ |
| Sayfa ilk yüklenme (LCP) | < 2.5s |
| Excel import (500 satır) | < 5s |

---

## 16. Test Stratejisi

```
server/
├── __tests__/
│   ├── unit/
│   │   ├── question-generator.test.ts
│   │   ├── analysis.test.ts
│   │   └── auth.test.ts
│   └── integration/
│       ├── personnel.test.ts
│       ├── session.test.ts
│       └── reports.test.ts

apps/web/
└── __tests__/
    ├── components/
    └── pages/
```

- Unit test: Vitest
- Integration test: Supertest + Vitest
- E2E: Playwright (kritik akışlar: login, 2FA, rıza adımı, test tamamlama, İK onayı, rapor indirme)
- **Prompt / şema regresyonu:** altın örnek cevaplarla `AnalysisOutput` Zod doğrulaması; model çıktısı fixture’ları CI’da
- **Contract test:** OpenAPI şeması ile istemci tipleri (`openapi-typescript` / orval)
- Yük testi: k6 veya Artillery (özellikle `POST /sessions/:id/answer` ve auth)
- Test coverage hedefi: %70+

---

## 17. Erişilebilirlik ve Mavi Yaka UX

- Hedef: **WCAG 2.1 AA** (portal öncelikli); klavye ile tam akış, odak halkaları görünür
- Tipografi: minimum **16px** gövde; soru metni **20–22px**; satır aralığı rahat
- Renk kontrastı **AA**; isteğe bağlı yüksek kontrast tema (fabrika aydınlatması)
- Form hataları yalnızca kırmızı renge bağlı kalmasın; ikon + metin
- Animasyonlar `prefers-reduced-motion` ile kısıtlanır
- Ekran okuyucu etiketleri: ilerleme çubuğu, skala, çoktan seçmeli kartlar

---

## 18. Gözlebilirlik ve Hata İzleme

- **Structured logging:** Pino/Winston ile JSON; her istek `traceId` (yanıt başlığında `X-Trace-Id`)
- **Sentry** (veya eşdeğeri): uncaught exception, release sürümü, kullanıcı/org bağlamı (PII maskeleme)
- **OpenTelemetry:** HTTP span + AI provider span (latency, model, token sayıları `AiUsageLog` ile korelasyon)
- **Metrikler:** istek sayısı, job süresi, kuyruk derinliği, AI hata oranı, PDF başarısızlık
- Dashboard: Grafana veya managed APM (Datadog, vb.)

---

## 19. Yedekleme ve Felaket Kurtarma (DR)

- **RPO hedefi:** 24 saat (günlük tam yedek) + mümkünse WAL ile 1 saat altı
- **RTO hedefi:** 4 saat (kurumsal SLA’ya göre güncellenir)
- Otomatik `pg_dump` (şifreli depolama — S3 uyumlu nesne depolama önerilir)
- **Aylık restore tatbikatı** (staging’e geri yükleme) ve kayıt altına alınan kontrol listesi
- Redis: kalıcılık gerekiyorsa AOF/RDB; job kuyruğu kaybı kabulü dokümante edilir veya external Redis HA

---

## 20. OpenAPI ve İstemci Sözleşmesi

- Fastify Swagger ile **OpenAPI 3** üretimi; CI’da şema kırılımı kontrolü
- Web ve portal: `openapi-typescript` veya **orval** ile tip güvenli istemci
- Sayfalama: `?cursor=` veya `?page=&pageSize=` — tüm liste endpoint’lerinde standart; maksimum `pageSize` (ör. 100)

---

*Son güncelleme: 2026 — PotansiyelHaritası v1.1 Development Specification*
