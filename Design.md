# Finco Design System — Birebir Uygulama Referans Dokümanı

> Bu doküman, Finco projesinin tüm görsel tasarım kurallarını, bileşen yapılarını, layout mimarisini ve tema tokenlarını eksiksiz içerir.
> Farklı bir projeye birebir aynı tasarımı aktarmak için bu dokümanı takip edin.

---

## 1. Marka Kimliği

| Özellik | Değer |
|---------|-------|
| **Marka Adı** | Finco |
| **Logo** | Zümrüt yeşili (#2DAA6E) dairesel zemin üzerinde beyaz geometrik "F" monogramı |
| **Logo Boyutları** | Sidebar açık: 48×48px, Sidebar kapalı: 40×40px, Mobil sidebar: 28×28px, Login: 44×44px, PWA: 192×192 / 512×512 |
| **Marka Tonu** | Profesyonel, modern fintech — minimalist ve güven veren |
| **Marka Fontu** | Logo yanında `text-sm font-bold text-foreground` ile "Finco" yazısı |

---

## 2. Renk Sistemi (HSL Token'lar)

**KRİTİK KURAL:** Bileşenlerde asla doğrudan renk kodu (`text-white`, `bg-black`, `#2BB87E`) kullanılmaz. Tüm renkler `hsl(var(--token))` üzerinden semantic token olarak kullanılır.

### 2.1 Light Mode (`:root`)

```css
:root {
  /* Ana yüzey */
  --background: 240 7% 97%;        /* #F5F5F7 */
  --foreground: 0 0% 7%;           /* #121212 */

  /* Kartlar & Popover */
  --card: 0 0% 100%;               /* #FFFFFF */
  --card-foreground: 0 0% 7%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 7%;

  /* Birincil (Marka) */
  --primary: 153 60% 43%;          /* #2BB87E — Zümrüt yeşili */
  --primary-foreground: 0 0% 100%; /* Beyaz */

  /* İkincil & Muted */
  --secondary: 240 5% 96%;         /* #F4F4F5 */
  --secondary-foreground: 0 0% 7%;
  --muted: 240 5% 96%;
  --muted-foreground: 0 0% 44%;    /* #707070 */

  /* Accent */
  --accent: 240 5% 96%;
  --accent-foreground: 0 0% 7%;

  /* Tehlike */
  --destructive: 4 84% 60%;        /* #E74C3C */
  --destructive-foreground: 0 0% 100%;

  /* Kenarlık & Input */
  --border: 0 0% 91%;              /* #E8E8E8 */
  --input: 0 0% 91%;
  --ring: 153 60% 43%;

  /* Genel radius */
  --radius: 1rem;                  /* 16px */
}
```

### 2.2 Dark Mode (`.dark`)

```css
.dark {
  --background: 200 13% 5%;        /* #0B1117 — Derin koyu mavi-siyah */
  --foreground: 160 10% 93%;       /* #EAF0ED */

  --card: 200 10% 9%;              /* #141C23 */
  --card-foreground: 160 10% 93%;
  --popover: 200 10% 9%;
  --popover-foreground: 160 10% 93%;

  --primary: 153 60% 53%;          /* #3ECF8E — Parlak zümrüt */
  --primary-foreground: 200 13% 5%;

  --secondary: 200 8% 14%;         /* #1F272E */
  --secondary-foreground: 160 10% 88%;
  --muted: 200 8% 14%;
  --muted-foreground: 200 5% 55%;  /* #828A90 */

  --accent: 200 8% 14%;
  --accent-foreground: 160 10% 93%;

  --destructive: 4 62% 45%;
  --destructive-foreground: 0 0% 95%;

  --border: 200 6% 16%;            /* #252D34 */
  --input: 200 6% 16%;
  --ring: 153 60% 53%;
}
```

### 2.3 Vurgu (Accent) Renkleri

| Token | Light HSL | Dark HSL | Kullanım |
|-------|-----------|----------|----------|
| `--accent-blue` | `153 60% 43%` | `211 100% 50%` | Linkler, bilgi göstergeleri |
| `--accent-green` | `142 71% 49%` | `153 60% 53%` | Başarı, pozitif değişim |
| `--accent-red` | `4 84% 60%` | `4 84% 60%` | Hata, negatif değişim |
| `--accent-orange` | `36 100% 50%` | `36 100% 50%` | Uyarı, dikkat |
| `--accent-purple` | `280 59% 60%` | `263 70% 58%` | Analiz, AI göstergeleri |
| `--accent-teal` | `199 89% 68%` | `172 66% 50%` | Tamamlayıcı vurgu |

### 2.4 Durum Renkleri & Badge Kullanımı

| Durum | Arka Plan | Metin |
|-------|-----------|-------|
| Başarı/Aktif | `bg-accent-green/10` | `text-accent-green` |
| Tehlike/Hata | `bg-accent-red/10` | `text-accent-red` |
| Uyarı | `bg-accent-orange/10` | `text-accent-orange` |
| Bilgi | `bg-accent-blue/10` | `text-accent-blue` |
| Analiz/AI | `bg-accent-purple/10` | `text-accent-purple` |
| Nötr | `bg-muted` | `text-muted-foreground` |

---

## 3. Glassmorphism (Liquid Glass) Sistemi

Finco'nun temel görsel kimliğidir. Tüm ana yüzeyler (kartlar, sidebar, topbar, popover) bu efekti kullanır.

### 3.1 Glass Token'ları

```css
/* ── Light Mode ── */
--glass-bg: 0 0% 100% / 0.72;
--glass-border: 0 0% 100% / 0.48;
--glass-blur: 24px;
--glass-saturate: 1.8;
--glass-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.04);
--glass-shadow-hover: 0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06);
--glass-inset: 0 0 0 0.5px rgba(255,255,255,0.06) inset;
--glass-inset-hover: 0 0 0 0.5px rgba(255,255,255,0.1) inset;

/* ── Dark Mode ── */
--glass-bg: 200 10% 9% / 0.75;
--glass-border: 153 30% 40% / 0.10;
--glass-blur: 24px;
--glass-saturate: 1.6;
--glass-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 12px 40px rgba(0,0,0,0.18);
--glass-shadow-hover: 0 4px 16px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.22);
--glass-inset: 0 0 0 0.5px rgba(62,207,142,0.04) inset;
--glass-inset-hover: 0 0 0 0.5px rgba(62,207,142,0.08) inset;
```

### 3.2 Glass CSS Sınıfları

```css
/* Hover efektli yüzey — kartlar, etkileşimli bileşenler */
.glass-surface {
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 0.5px solid hsl(var(--glass-border));
  box-shadow: var(--glass-inset), var(--glass-shadow);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.glass-surface:hover {
  box-shadow: var(--glass-inset-hover), var(--glass-shadow-hover);
}

/* Statik yüzey — topbar, sidebar, sabit bileşenler */
.glass-surface-static {
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 0.5px solid hsl(var(--glass-border));
  box-shadow: var(--glass-inset), var(--glass-shadow);
}
```

**Kural:** İnteraktif kartlar → `glass-surface`, Sabit yüzeyler (topbar, sidebar) → `glass-surface-static`

### 3.3 GlassCard React Bileşeni

```tsx
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  children: React.ReactNode;
}

export const GlassCard = ({ className, hover = true, children, ...props }: GlassCardProps) => (
  <motion.div
    className={cn(
      hover ? "glass-surface" : "glass-surface-static",
      "rounded-xl p-5 md:p-6",
      className
    )}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    {...props}
  >
    {children}
  </motion.div>
);
```

---

## 4. Tipografi

| Özellik | Değer |
|---------|-------|
| **Font Ailesi** | `Inter`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, `sans-serif` |
| **Import** | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap` |
| **Feature Settings** | `"cv11", "ss01"` |
| **Antialiasing** | `antialiased` (Tailwind `@apply`) |
| **Finansal Sayılar** | `tabular-nums` (font-variant-numeric: tabular-nums) |

### Tipografi Ölçekleri

| Kullanım | Boyut | Ağırlık | Tailwind Sınıfı |
|----------|-------|---------|-----------------|
| Sayfa başlığı | 24-30px | 700 | `text-2xl font-bold` / `text-3xl font-bold` |
| Kart başlığı | 16-18px | 600 | `text-base font-semibold` |
| Gövde metni | 14px | 400 | `text-sm` |
| Küçük/yardımcı | 11-12px | 500 | `text-[11px] font-medium` |
| Badge/etiket | 10-11px | 600 | `text-[10px] font-semibold` |
| Navigasyon grubu | 10px | 600 | `text-[10px] font-semibold uppercase tracking-wider` |

---

## 5. Layout Mimarisi

### 5.1 Genel Yapı

```
┌──────────────────────────────────────────────────┐
│       GlassTopbar (sticky top-0 z-50)            │
│       glass-surface-static, h-14 sm:h-16         │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│  Glass   │      <Outlet /> — Ana İçerik          │
│  Sidebar │      padding: p-4 md:p-6              │
│          │      overflow-y: auto                 │
│          │      pb-24 lg:pb-6 (mobil nav için)   │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│   MobileBottomNav (lg:hidden, fixed bottom, z-40)│
└──────────────────────────────────────────────────┘
```

### 5.2 Root Container

```tsx
<div className="flex h-screen overflow-hidden">
  <GlassSidebar />
  <div className="flex flex-col flex-1 min-w-0">
    <GlassTopbar />
    <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
      <Outlet />
    </main>
  </div>
  <MobileBottomNav />
</div>
```

---

## 6. Sol Menü (GlassSidebar) — Detaylı Tasarım

### 6.1 Boyutlar & Genel Yapı

| Özellik | Değer |
|---------|-------|
| **Açık genişlik** | `w-[260px]` |
| **Kapalı (collapsed) genişlik** | `w-[68px]` |
| **Mobil overlay genişlik** | `w-[280px]` |
| **Yüzey sınıfı** | `glass-surface-static` |
| **Ek sınıflar** | `flex-shrink-0 flex-col h-screen sticky top-0 border-r border-border/50 rounded-none` |
| **Geçiş animasyonu** | `transition-all duration-300` |
| **Collapse durumu** | `localStorage("sidebarCollapsed")` ile kalıcı |

### 6.2 Sidebar Header (Logo Bölgesi)

```
┌─────────────────────────────┐
│  [Logo 48×48]  Finco   [◁]  │  ← Açık mod: h-16, flex items-center px-3 gap-2.5
│  [Logo 40×40]               │  ← Kapalı mod: justify-center, logo tıklanarak genişletilir
└─────────────────────────────┘
```

- **Açık:** Logo (48×48) + "Finco" (`text-sm font-bold text-foreground`) + Daraltma butonu (ChevronsLeft ikonu, `p-1.5 rounded-lg hover:bg-accent text-muted-foreground`)
- **Kapalı:** Sadece logo (40×40), `Tooltip` ile "Menüyü Genişlet" mesajı gösterilir
- **Mobil:** Logo (28×28) + "Finco" (`font-bold text-sm`) + Kapatma butonu (X ikonu)

### 6.3 Organizasyon Seçici (OrgSelector)

Logo bölgesinin hemen altında, `px-3 mb-2` ile konumlandırılır. Altında `h-px bg-border/50 mx-3 mb-3` ayırıcı çizgi.

```
┌─────────────────────────────┐
│  [■]  Şirket Adı            │  ← w-full rounded-xl px-2.5 py-2.5 hover:bg-accent/60
│       3 şirket          ▾   │  ← text-[10px] text-muted-foreground
└─────────────────────────────┘
```

- Şirket ikonu: `h-8 w-8 rounded-lg bg-primary` içinde `Building2` ikonu (`h-4 w-4 text-primary-foreground`)
- Şirket adı: `text-sm font-bold leading-tight truncate`
- Alt bilgi: `text-[10px] text-muted-foreground`
- Açılır menü: `rounded-xl border border-border/50 shadow-lg bg-popover text-popover-foreground`
- Collapsed modda: Tooltip ile gösterilir

### 6.4 Navigasyon Grupları

Sidebar gövdesi `py-4`, navigasyon `px-3 space-y-3`, grup başlıkları:

```
GENEL                        ← text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70, px-3 mb-1
  ├── Pano                   ← NavLink, rounded-xl px-3 py-2.5
PORTFÖY
  ├── Projeler
  ├── Varlıklar
  ├── Pipeline
  ├── NAV Değerleme
FİNANS
  ├── Gelir / Gider          ← Genişletilebilir alt menü (children)
  │   ├── Gelirler
  │   ├── Giderler
  │   ├── Transferler
  │   ├── Sermaye Girişi
  │   └── Dağıtımlar
  ├── Yatırımlar
  ├── Tahsilat
  ├── E-Fatura
ORTAKLIK
  ├── Ortaklar
  ├── Oylamalar
  ├── Toplantılar
İLETİŞİM & BELGELER
  ├── Mesajlar
  ├── Belgeler
YÖNETİM
  ├── Faz İlerleme
  ├── Raporlama
─────────────────── (border-t border-border/50, pt-4)
  ├── Aktivite
  ├── Arşiv
  ├── Ayarlar (sadece admin)
  ├── Admin Panel (sadece super_admin)
```

### 6.5 Nav Item Stilleri

#### Standart Nav Item (children yok)

```tsx
// Açık mod
<NavLink className={cn(
  "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 px-3 py-2.5",
  isActive
    ? "bg-primary/10 text-primary"
    : "text-muted-foreground hover:bg-accent hover:text-foreground"
)}>
  <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "fill-primary/20")} />
  <span>{label}</span>
  {/* Aktif gösterge — sol kenarda */}
  {isActive && (
    <motion.div
      layoutId="sidebar-active"
      className="absolute left-0 w-[3px] h-6 bg-primary rounded-r-full"
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
    />
  )}
</NavLink>

// Kapalı (collapsed) mod
// → justify-center px-0 py-2.5
// → Tooltip ile etiket gösterilir (side="right" sideOffset={8})
```

#### Genişletilebilir Nav Item (children var — örn. "Gelir/Gider")

**Açık modda:**
- Üst eleman: `button` ile chevron (ChevronRight, rotate-90 açıkken)
- Alt menü: `AnimatePresence` + `motion.div` (height: 0→auto animasyonu, duration: 0.2)
- Alt menü container: `ml-5 pl-3 border-l border-border/50 space-y-0.5 py-1`
- Alt item: `rounded-lg text-[13px] font-medium px-2.5 py-2`, aktifse `text-primary bg-primary/5`

**Kapalı (collapsed) modda:**
- Tooltip hover menüsü olarak açılır (side="right")
- Tooltip içinde item listesi: `min-w-[160px]`, her item `px-3 py-1.5`

### 6.6 Mobil Sidebar (Overlay)

- Tetikleme: Topbar'daki hamburger menü (Menu ikonu)
- Overlay: `fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40`
- Sidebar: `fixed left-0 top-0 bottom-0 w-[280px] glass-surface-static z-50 rounded-none`
- Giriş animasyonu: `motion.aside initial={{ x: -280 }} animate={{ x: 0 }}` spring stiffness: 350, damping: 35
- Header: Logo (28×28) + "Finco" + X kapatma butonu

---

## 7. Üst Bar (GlassTopbar) — Detaylı Tasarım

### 7.1 Genel Yapı

```
┌──────────────────────────────────────────────────────────────────────┐
│ [☰] [Döviz Ticker]     [🔍 Ara...  ⌘K]     [Hisse] [🔍] [◐] [📅] [🔔] [AK] │
└──────────────────────────────────────────────────────────────────────┘
```

| Özellik | Değer |
|---------|-------|
| **Yüzey** | `glass-surface-static` |
| **Konum** | `sticky top-0 z-50` |
| **Yükseklik** | `h-14 sm:h-16` |
| **Padding** | `px-2 sm:px-4 md:px-6` |
| **Border** | `border-b border-border/50 rounded-none` |

### 7.2 Sol Bölge

- **Hamburger menü:** `lg:hidden p-1.5 sm:p-2 rounded-xl hover:bg-accent`
  - İkon: Menu, `h-5 w-5 text-muted-foreground`
- **Döviz Ticker:** `CurrencyTicker` bileşeni, gerçek zamanlı kur bilgisi

### 7.3 Orta Bölge — Spotlight Arama

```tsx
<button className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-8 h-9 px-3.5 rounded-xl bg-muted/50 border border-border/40 hover:border-border hover:bg-muted/80 transition-all cursor-pointer group">
  <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
  <span className="text-sm text-muted-foreground/60 flex-1 text-left">Ara...</span>
  <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
    ⌘K
  </kbd>
</button>
```

- Kısayol: `⌘K` / `Ctrl+K` ile açılır
- Mobilde: Sadece ikon buton gösterilir (`md:hidden`)

### 7.4 Sağ Bölge Butonları

Tüm butonlar: `p-2 sm:p-2.5 rounded-xl hover:bg-accent transition-colors`
İkon boyutu: `h-4 sm:h-[18px] w-4 sm:w-[18px] text-muted-foreground`

| Bileşen | Detay |
|---------|-------|
| **Hisse Bilgisi** | `h-7 sm:h-8 px-1.5 sm:px-2.5 rounded-xl bg-muted/50 border border-border/40` + PieChart ikonu (`text-primary`) + oran (`text-[10px] sm:text-[11px] font-semibold tabular-nums`) |
| **Tema Değiştirici** | Sun/Moon ikonu, `active:scale-95` |
| **Takvim Widget** | `HeaderCalendarWidget` bileşeni |
| **Bildirimler** | Bell ikonu + unread badge: `h-3.5 sm:h-4 rounded-full bg-destructive ring-2 ring-background`, sayı: `text-[8px] sm:text-[9px] font-bold text-destructive-foreground tabular-nums` |
| **Kullanıcı Avatarı** | `h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 ring-1 ring-border/30`, initials: `text-[10px] sm:text-xs font-semibold text-primary` |

### 7.5 Kullanıcı Menüsü (Dropdown)

```
┌──────────────────────┐
│  Ad Soyad             │  ← text-sm font-semibold truncate
│  Şirket Adı           │  ← text-[11px] text-muted-foreground
├──────────────────────┤
│  🚪 Çıkış Yap         │  ← text-destructive hover:bg-destructive/10
└──────────────────────┘
```

- Container: `w-56 rounded-xl border border-border/50 shadow-lg bg-popover text-popover-foreground`

---

## 8. Mobil Alt Navigasyon (MobileBottomNav)

### 8.1 Ana Bar

```
┌──────────────────────────────────────┐
│  Pano   Projeler   Varlıklar   Finans   ⋯  │  ← h-16, lg:hidden fixed bottom-0 z-40
└──────────────────────────────────────┘
```

- Yüzey: `glass-surface-static border-t border-border/50 rounded-none`
- Düzen: `flex items-center justify-around h-16 px-2`
- Tab: `flex flex-col items-center gap-1 py-1 px-3 rounded-xl`
- Aktif: `text-primary` + ikon `fill-primary/20`
- Pasif: `text-muted-foreground`
- Etiket: `text-[10px] font-medium`

### 8.2 "Daha Fazla" Drawer

- Overlay: `bg-foreground/20 backdrop-blur-sm z-50`
- Drawer: `glass-surface-static border-t border-border/50 rounded-t-2xl max-h-[70vh]`
- Animasyon: `motion.div initial={{ y: "100%" }} animate={{ y: 0 }}` spring stiffness: 350, damping: 35
- Grid: `grid grid-cols-4 gap-1 p-3`
- Her item: `flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl`

---

## 9. Surface & Separator Token'ları

```css
/* Light */
--surface-primary: 240 7% 97%;
--surface-elevated: 0 0% 100%;
--separator: 0 0% 0% / 0.08;

/* Dark */
--surface-primary: 200 10% 9%;
--surface-elevated: 200 8% 14%;
--separator: 153 30% 40% / 0.08;
```

---

## 10. Sidebar Token'ları

```css
/* ── Light ── */
--sidebar-background: 0 0% 98%;
--sidebar-foreground: 240 5% 26%;
--sidebar-primary: 153 60% 43%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 240 5% 96%;
--sidebar-accent-foreground: 240 6% 10%;
--sidebar-border: 220 13% 91%;
--sidebar-ring: 153 60% 43%;

/* ── Dark ── */
--sidebar-background: 200 13% 7%;
--sidebar-foreground: 160 10% 88%;
--sidebar-primary: 153 60% 53%;
--sidebar-primary-foreground: 200 13% 5%;
--sidebar-accent: 200 8% 14%;
--sidebar-accent-foreground: 160 10% 88%;
--sidebar-border: 200 6% 14%;
--sidebar-ring: 153 60% 53%;
```

---

## 11. Aralık & Boyutlandırma

| Özellik | Değer |
|---------|-------|
| **Border Radius (Genel)** | `--radius: 1rem` → `rounded-xl` |
| **Kart Padding** | `p-5 md:p-6` |
| **Sayfa Padding** | `p-4 md:p-6` |
| **Topbar Yüksekliği** | `h-14 sm:h-16` |
| **Sidebar Açık** | `w-[260px]` |
| **Sidebar Kapalı** | `w-[68px]` |
| **Gap (kart arası)** | `gap-4` veya `gap-6` |
| **Form Input Yüksekliği** | `h-11` |

### Tailwind Config — Border Radius

```js
borderRadius: {
  xl: "1.25rem",    // 20px
  "2xl": "1.75rem", // 28px
  lg: "var(--radius)",          // 16px
  md: "calc(var(--radius) - 2px)", // 14px
  sm: "calc(var(--radius) - 4px)", // 12px
}
```

---

## 12. Animasyonlar

### 12.1 Tailwind Keyframes

```js
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  "shimmer": {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
  "fade-in": {
    from: { opacity: "0", transform: "translateY(8px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "shimmer": "shimmer 1.5s ease-in-out infinite",
  "fade-in": "fade-in 0.4s ease-out forwards",
}
```

### 12.2 Framer Motion Standartları

| Kullanım | Ayar |
|----------|------|
| **Kart giriş** | `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` |
| **Easing** | `[0.25, 0.46, 0.45, 0.94]` (özel cubic-bezier) |
| **Süre** | 0.35s (kartlar), 0.2s (mikro etkileşimler) |
| **Stagger** | Listeler için `staggerChildren: 0.05` |
| **Sidebar aktif gösterge** | `layoutId="sidebar-active"` + spring stiffness: 350, damping: 30 |
| **Mobil overlay** | spring stiffness: 350, damping: 35 |

---

## 13. Form Elemanları

### Standart Input

```css
.form-input-base {
  @apply w-full h-11 rounded-xl bg-muted/50 text-sm
    placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-primary/30
    border border-border/50 transition-colors;
}
```

### Buton Varyantları

| Varyant | Stil |
|---------|------|
| **default** | `bg-primary text-primary-foreground hover:bg-primary/90` |
| **destructive** | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| **outline** | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| **secondary** | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| **ghost** | `hover:bg-accent hover:text-accent-foreground` |
| **link** | `text-primary underline-offset-4 hover:underline` |

### Buton Boyutları

| Boyut | Stil |
|-------|------|
| default | `h-10 px-4 py-2` |
| sm | `h-9 rounded-md px-3` |
| lg | `h-11 rounded-md px-8` |
| icon | `h-10 w-10` |

---

## 14. Kart Sistemi

### Standart Kart (shadcn)
```
rounded-lg border bg-card text-card-foreground shadow-sm
```

### Glass Kart
```
glass-surface rounded-xl p-5 md:p-6
```

---

## 15. İkon Sistemi

| Kütüphane | Lucide React (`lucide-react`) |
|-----------|------|
| **Sidebar ikonu** | `h-[18px] w-[18px]`, aktifse `fill-primary/20` |
| **Topbar ikonu** | `h-4 sm:h-[18px] w-4 sm:w-[18px]` |
| **Kart içi** | `h-4 w-4` veya `h-5 w-5` |
| **Mobil nav** | `h-5 w-5` |

---

## 16. Responsive Breakpoint'ler

| Breakpoint | Genişlik | Kullanım |
|------------|----------|----------|
| sm | 640px | Küçük tablet, topbar boyut geçişi |
| md | 768px | Tablet, spotlight arama gösterilir |
| lg | 1024px | Desktop, sidebar daima görünür, mobil nav gizlenir |
| xl | 1280px | Geniş desktop |
| 2xl | 1400px | Container max-width |

---

## 17. Yardımcı CSS Sınıfları

```css
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar { display: none; }

.text-balance { text-wrap: balance; }

.tabular-nums { font-variant-numeric: tabular-nums; }
```

---

## 18. Tema Geçişi

```js
// Toggle
document.documentElement.classList.toggle("dark", isDark);
localStorage.setItem("theme", isDark ? "dark" : "light");

// CSS: :root (light) ve .dark altında tüm tokenlar ayrı tanımlanır
// darkMode config: ["class"]
```

---

## 19. Z-Index Hiyerarşisi

| Katman | Z-Index | Kullanım |
|--------|---------|----------|
| Mobil alt nav | `z-40` | MobileBottomNav |
| Mobil sidebar overlay | `z-40` | Arka plan karartma |
| Mobil sidebar | `z-50` | Açılan sidebar paneli |
| Topbar | `z-50` | GlassTopbar |
| Mobil "daha fazla" overlay | `z-50` | Arka plan |
| Portal Modal | `z-[60]` - `z-[80]` | Dialog, popup'lar |

---

## 20. Tailwind Config Tam Yapısı

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "accent-blue": "hsl(var(--accent-blue))",
        "accent-green": "hsl(var(--accent-green))",
        "accent-red": "hsl(var(--accent-red))",
        "accent-orange": "hsl(var(--accent-orange))",
        "accent-purple": "hsl(var(--accent-purple))",
        "accent-teal": "hsl(var(--accent-teal))",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 21. StatCard Bileşeni

Dashboard'daki özet kartları için kullanılan standart bileşen. GlassCard üzerine kuruludur.

```tsx
<GlassCard className="flex flex-col gap-3">
  {/* Üst satır: Başlık + İkon */}
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground font-medium">{title}</span>
    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="h-4.5 w-4.5 text-primary" />
    </div>
  </div>
  {/* Alt satır: Değer + Değişim */}
  <div>
    <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
    <div className="flex items-center gap-2 mt-1">
      {/* Değişim badge'i */}
      <span className={cn(
        "text-xs font-semibold px-1.5 py-0.5 rounded-md",
        changeType === "positive" && "text-accent-green bg-accent-green/10",
        changeType === "negative" && "text-accent-red bg-accent-red/10",
        changeType === "neutral" && "text-muted-foreground bg-muted"
      )}>{change}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  </div>
</GlassCard>
```

---

## 22. ScoreGauge Bileşeni (AI Skor Göstergesi)

AI analiz sonuçları için dairesel skor göstergesi. 270° SVG arc kullanır.

```tsx
interface ScoreGaugeProps {
  score: number;
  max?: number;      // varsayılan: 10
  size?: "sm" | "md" | "lg";
}
```

| Boyut | Genişlik | Radius | Stroke |
|-------|----------|--------|--------|
| sm | 56px | 22 | 5 |
| md | 72px | 28 | 6 |
| lg | 96px | 38 | 7 |

**Renk Kuralları:**
| Oran (score/max) | Arc Rengi | Glow |
|-------------------|-----------|------|
| ≥ 70% | `stroke-emerald-500` | `drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]` |
| ≥ 40% | `stroke-amber-500` | `drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]` |
| < 40% | `stroke-destructive` | `drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]` |

- Arka plan arc: `stroke-muted/40`
- Sayı: `font-bold tabular-nums leading-none` + ilgili renk
- Etiket: `text-muted-foreground font-medium`
- Animasyon: `transition-all duration-700 ease-out`

---

## 23. PortalModal Bileşeni

Layout kısıtlamalarını (overflow, z-index) aşmak için React Portal kullanır. Tüm modal ve popup'lar bu bileşen üzerinden render edilir.

```tsx
import { createPortal } from "react-dom";

export const PortalModal = ({ children }: { children: ReactNode }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
```

**Kullanım kuralı:** Topbar üzerinde kalan popup'lar `z-[60]` - `z-[80]` arası z-index kullanır.

---

## 24. Spotlight Search (Detaylı)

Global arama modal'ı. `⌘K` / `Ctrl+K` ile açılır.

### Overlay
```
fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100]
```

### Modal Container
```
fixed inset-0 z-[101] flex items-start justify-center pt-[15vh]
w-full max-w-lg rounded-2xl border border-border/50 bg-popover shadow-2xl overflow-hidden
```

### Giriş Animasyonu
```tsx
initial={{ opacity: 0, scale: 0.95, y: -10 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: -10 }}
transition={{ duration: 0.15 }}
```

### Arama Input
```
flex items-center gap-3 px-4 py-3.5 border-b border-border/50
input: bg-transparent text-sm outline-none placeholder:text-muted-foreground/60
```

### Sonuç Listesi
- Container: `max-h-80 overflow-y-auto py-2`
- Her sonuç: `w-full flex items-center gap-3 px-4 py-2.5`
- Seçili: `bg-accent`, Hover: `hover:bg-accent/50`
- İkon: `h-4 w-4` + tip rengine göre (`text-primary`, `text-accent-purple`, `text-accent-green`, `text-accent-orange`)
- Başlık: `text-sm font-medium truncate`
- Alt bilgi: `text-[11px] text-muted-foreground truncate`
- Tip etiketi: `text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md`

### Footer
```
border-t border-border/50 px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground
```
Kısayollar: `↑↓` gezin, `↵` aç, `esc` kapat (mono font ile `<kbd>`)

### Klavye Navigasyonu
- `ArrowDown/ArrowUp`: Sonuçlar arasında gezinme
- `Enter`: Seçili sonuca git
- `Escape`: Modal'ı kapat
- Debounce: 250ms

---

## 25. Bildirim Paneli (NotificationPanel)

Topbar'daki çan ikonuna tıklayınca açılan dropdown panel.

### Panel Container
```tsx
// Mobil: tam genişlik
className="fixed inset-x-3 top-16 z-50"
// Desktop: sağ hizalı dropdown
className="sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[360px]"
// Ortak
className="max-h-[70vh] sm:max-h-[480px] rounded-2xl border border-border/50 shadow-xl bg-popover overflow-hidden flex flex-col"
```

### Giriş Animasyonu
```tsx
initial={{ opacity: 0, y: -8, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
```

### Header
- Başlık: `text-sm font-bold` + Okunmamış sayı badge'i: `text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary tabular-nums`
- "Tümünü oku" butonu: `text-[11px] text-primary hover:bg-primary/10 px-2 py-1 rounded-lg`

### Bildirim Item'ı
- Container: `flex items-start gap-3 px-4 py-3 border-b border-border/20`
- Okunmamış arka plan: `bg-primary/[0.03]`
- İkon container: `h-8 w-8 rounded-lg` + event tipine göre renk
- Okunmamış nokta: `h-2 w-2 rounded-full bg-primary`
- Başlık: okunmamış → `font-semibold`, okunmuş → `text-muted-foreground`, her ikisi `text-xs`
- Mesaj: `text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2`
- Zaman: `text-[10px] text-muted-foreground/50 mt-1`
- Sil butonu: `opacity-0 group-hover:opacity-100` (desktop'ta), mobilde daima görünür

### Event Tip Renkleri
| Event | Renk Sınıfı |
|-------|-------------|
| vote_started | `text-accent-blue bg-accent-blue/10` |
| vote_completed | `text-accent-green bg-accent-green/10` |
| asset_added | `text-accent-purple bg-accent-purple/10` |
| pipeline_changed | `text-accent-orange bg-accent-orange/10` |
| payment_reminder | `text-accent-blue bg-accent-blue/10` |
| payment_overdue | `text-destructive bg-destructive/10` |
| general | `text-muted-foreground bg-muted` |

### Boş Durum
```
h-10 w-10 rounded-xl bg-muted — Bell ikonu (h-5 w-5 text-muted-foreground)
"Bildirim yok" — text-sm font-medium text-muted-foreground
"Yeni gelişmeler burada görünür" — text-[11px] text-muted-foreground/60
```

---

## 26. Döviz Ticker (CurrencyTicker)

Topbar sol bölgede yer alan canlı kur göstergesi.

### Inline Görünüm (Topbar)
```
button: flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-muted/60 transition-colors
```
- Desktop: İlk 2 kur gösterilir, mobilde ilk 1
- Her kur: `text-[11px] tabular-nums`
  - Bayrak: emoji
  - Kod: `font-semibold text-foreground`
  - Değer: `text-muted-foreground`
  - Değişim (sm+): `text-accent-green` (↑) veya `text-accent-red` (↓) + yüzde

### Popover Detayları
- Genişlik: `w-80 p-0`
- Başlık: `text-[11px] font-semibold text-muted-foreground uppercase tracking-wider`
- Her kur satırı: `py-1.5 px-2 rounded-lg hover:bg-muted/50`
  - Bayrak: `text-base`
  - Kod: `text-xs font-semibold`
  - İsim: `text-[10px] text-muted-foreground`
  - Alış: `text-xs font-bold tabular-nums`
  - Satış: `text-[10px] text-muted-foreground tabular-nums`
  - Değişim: `text-[10px] font-semibold` + TrendingUp/TrendingDown ikonu

### Döviz Seçici
- Her buton: `px-2.5 py-1.5 rounded-lg text-[11px] font-medium`
- Aktif: `bg-primary text-primary-foreground shadow-sm`
- Pasif: `bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground`

---

## 27. Takvim Widget (HeaderCalendarWidget)

Topbar'daki mini takvim popup'ı.

### Trigger
- Topbar ikon butonu stili: `p-2 sm:p-2.5 rounded-xl hover:bg-accent active:scale-95`
- Bugün toplantı varsa: `bg-primary ring-2 ring-background` badge (bildirim badge'i ile aynı stil)

### Popover
- Genişlik: `w-80 p-0`, align: `end`
- Üst bölge: shadcn Calendar, toplantı günleri: `bg-primary/20 font-bold text-primary rounded-full`
- Alt bölge: `max-h-48 overflow-y-auto`
- Her toplantı: `flex items-center gap-2.5 py-1.5 hover:bg-accent/30 rounded-lg px-2`
  - Tarih kutusu: `h-8 w-8 rounded-lg bg-primary/10`, gün: `text-[9px] font-bold text-primary`, ay: `text-[7px] text-primary/70 uppercase`
  - Başlık: `text-xs font-medium truncate`
  - Saat/Konum: `text-[10px] text-muted-foreground` + Clock/MapPin ikonları (`h-2.5 w-2.5`)

---

## 28. Dialog & Modal Kalıpları

### Standart Dialog (shadcn)
- Overlay: varsayılan shadcn dialog overlay
- Content: `rounded-2xl` veya `rounded-xl`
- Header: `border-b border-border/30`
- Footer: `bg-muted/50 border-t border-border/30`

### Geniş Form Dialog (3/4 ekran)
- Genişlik: `max-w-[75vw]` veya `sm:max-w-4xl`
- 4 segmentli tab yapısı (Tabs bileşeni)
- Her tab içeriği scroll edilebilir

### Portal Modal
- Z-index: `z-[60]` - `z-[80]`
- `createPortal(children, document.body)` ile render

---

## 29. Tablo Kalıpları

### Genel Tablo Stili (shadcn Table)
```
rounded-lg border bg-card text-card-foreground shadow-sm
```

### Tablo Satırları
- Hover: `hover:bg-muted/50`
- Aktif/seçili: `bg-primary/5`
- Border: `border-b border-border/30`
- Metin: `text-sm`, başlık: `text-xs font-medium text-muted-foreground uppercase`

### Finansal Tablo Özellikleri
- Sayılar: `tabular-nums text-right font-medium`
- Pozitif: `text-accent-green`
- Negatif: `text-accent-red`
- Para birimi: sağa hizalı

---

## 30. Toast / Bildirim (Sonner)

Uygulama genelinde `sonner` kütüphanesi kullanılır.

```tsx
import { toast } from "sonner";

toast.success("İşlem başarılı");
toast.error("Bir hata oluştu");
toast.info("Bilgi mesajı");
```

- Konum: sağ üst (`top-right`)
- Tema: otomatik (light/dark uyumlu)

---

## 31. Bağımlılıklar

| Paket | Kullanım |
|-------|----------|
| `tailwindcss` + `tailwindcss-animate` | Utility-first CSS + animasyonlar |
| `framer-motion` | Gelişmiş animasyonlar, layoutId |
| `lucide-react` | İkon seti |
| `class-variance-authority` | Bileşen varyantları (cva) |
| `clsx` + `tailwind-merge` | Dinamik className birleştirme |
| `@radix-ui/*` | Erişilebilir UI primitifleri (shadcn/ui) |
| `sonner` | Toast bildirimleri |
| `recharts` | Grafik/chart bileşenleri |
| `react-day-picker` | Takvim/tarih seçici |
| `date-fns` + `date-fns/locale/tr` | Tarih formatlaması (Türkçe) |
| `react-router-dom` | Routing |
| `@tanstack/react-query` | Sunucu state yönetimi |
| `@tiptap/*` | Zengin metin editörü |
| `exceljs` | Excel export |
| `leaflet` + `react-leaflet` | Harita bileşenleri |

---

## 32. Hızlı Başlangıç Checklist'i

Yeni bir projeye bu tasarımı birebir uygulamak için:

1. ☐ `Inter` fontunu Google Fonts'tan import et
2. ☐ `index.css`'teki tüm CSS değişkenlerini kopyala (light + dark + glass tokenlar)
3. ☐ `glass-surface` ve `glass-surface-static` CSS sınıflarını ekle
4. ☐ `.form-input-base`, `.tabular-nums`, `.scrollbar-none` yardımcı sınıflarını ekle
5. ☐ `tailwind.config.ts` renk, radius ve animasyon ayarlarını birebir uygula
6. ☐ `tailwindcss-animate` eklentisini kur
7. ☐ `framer-motion` ile GlassCard bileşenini oluştur
8. ☐ StatCard bileşenini oluştur (GlassCard üzerine)
9. ☐ ScoreGauge bileşenini oluştur (AI analizleri için)
10. ☐ PortalModal bileşenini oluştur
11. ☐ Lucide React ikon setini kur
12. ☐ shadcn/ui bileşenlerini kur (button, card, dialog, tooltip, popover, tabs, vb.)
13. ☐ Logo asset'lerini yerleştir (192px, 512px)
14. ☐ Dark mode toggle mekanizmasını implemente et (`classList.toggle("dark")`)
15. ☐ Layout yapısını kur: Sidebar (260px/68px) + Topbar (glass-surface-static) + MobileBottomNav
16. ☐ Sidebar navigasyon gruplarını tanımla (Genel, Portföy, Finans, Ortaklık, İletişim, Yönetim)
17. ☐ Aktif link göstergesini ekle (`layoutId="sidebar-active"` + `w-[3px] bg-primary`)
18. ☐ Tooltip'leri collapsed sidebar modunda aktifle et
19. ☐ Spotlight Search (⌘K) bileşenini oluştur
20. ☐ CurrencyTicker bileşenini oluştur
21. ☐ HeaderCalendarWidget bileşenini oluştur
22. ☐ NotificationPanel bileşenini oluştur
23. ☐ MobileBottomNav "Daha Fazla" drawer'ını oluştur
24. ☐ Sonner toast sistemini kur
25. ☐ `date-fns` Türkçe locale ayarını yap
