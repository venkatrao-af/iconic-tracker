# 🎯 Iconic Project Tracker - Production Deployment Guide

**Enterprise construction project intelligence platform for Acres Foundation**

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Vercel Deployment](#vercel-deployment)
- [Google Apps Script Setup](#google-apps-script-setup)
- [Environment Variables](#environment-variables)
- [Features](#features)

---

## 🏗️ Overview

**3-Layer Intelligence Platform:**
- **Layer 1:** Data Visualization (Pure SVG charts, mobile-first UI)
- **Layer 2:** Predictive Analytics (Pre-computed risk scoring)
- **Layer 3:** Conversational AI (Gemini 2.0 Flash with tool calling)

**Tech Stack:**
- **Frontend:** Next.js 16.2.6, React 19, Tailwind CSS
- **AI:** Vercel AI SDK + Google Gemini 2.0 Flash
- **Backend:** Google Sheets + Apps Script (data source)
- **Hosting:** Vercel (Edge Network)

**Cost:** $0/month (Vercel Hobby + Gemini free tier)

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  GOOGLE SHEETS (Source of Truth)                         │
│  • 13 tabs, ~700 rows, updated weekly/monthly            │
│  • Apps Script: Bootstrap JSON generator                 │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS GET request
               ▼
┌─────────────────────────────────────────────────────────┐
│  VERCEL EDGE NETWORK (20ms cache)                        │
│  • /api/bootstrap: Cached data endpoint (10min TTL)      │
│  • /api/chat: Gemini AI streaming                        │
└──────────────┬──────────────────────────────────────────┘
               │ Server Components
               ▼
┌─────────────────────────────────────────────────────────┐
│  NEXT.JS DASHBOARD (Client)                              │
│  • 4 views: Executive, Projects, Schedule, Resources     │
│  • AI chat panel with tool calling                       │
│  • Mobile-responsive (320px → 2560px)                    │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

1. **Google Account** with access to Sheets
2. **Vercel Account** (free tier)
3. **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)
4. **Node.js 18+** installed locally

---

## 💻 Local Development

### 1. Clone/Extract Project

```bash
cd iconic-vercel-production
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ICONIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
ICONIC_API_TOKEN=your_token_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Iconic Tracker"
git remote add origin https://github.com/YOUR_USERNAME/iconic-tracker.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework Preset: **Next.js**
4. Click **Deploy**

### 3. Add Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

```
ICONIC_APPS_SCRIPT_URL = https://script.google.com/...
ICONIC_API_TOKEN = your_token
GOOGLE_GENERATIVE_AI_API_KEY = your_gemini_key
NEXT_PUBLIC_APP_URL = https://iconic-tracker.vercel.app
```

### 4. Redeploy

After adding env vars, go to **Deployments** → Click ⋯ on latest deployment → **Redeploy**

---

## 📊 Google Apps Script Setup

### Apps Script Code (doGet function)

```javascript
function doGet(e) {
  const token = e.parameter.token;
  const expectedToken = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  
  if (token !== expectedToken) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = SpreadsheetApp.openById('1-OJbL15wuDtzYeq9wObrZU5Le6JEusSVK46BM80UNpo');
  
  const bootstrap = {
    phases: getSheetData(ss, 'Phase_Summary'),
    resources: getSheetData(ss, 'Resource_Utilization'),
    heatmap: getSheetData(ss, 'Schedule_Heatmap'),
    tasks: getSheetData(ss, 'Tasks'),
    projects: getSheetData(ss, 'Projects'),
    critical_path: getSheetData(ss, 'Critical_Path'),
    milestones: getSheetData(ss, 'Milestones'),
    metadata: {
      last_sync: new Date().toISOString(),
    },
  };
  
  return ContentService.createTextOutput(JSON.stringify(bootstrap))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}
```

### Deploy Apps Script

1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy the deployment URL
7. Go to **Project Settings → Script properties**
8. Add property: `API_TOKEN = random_secure_token_here`

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ICONIC_APPS_SCRIPT_URL` | Apps Script web app URL | `https://script.google.com/macros/s/.../exec` |
| `ICONIC_API_TOKEN` | Secure token for authentication | `random_token_123` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key | `AIza...` |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | `https://iconic-tracker.vercel.app` |

---

## ✨ Features

### 📊 Executive Dashboard (30,000 ft view)
- Portfolio health ring (62% complete)
- 5 project cards with progress visualization
- Resource utilization heatmap (10 team members)
- KPI summary cards

### 🏗️ Projects View (10,000 ft)
- Phase-by-phase breakdown
- Health indicators (On Track / At Risk / Critical)
- Task counts (total, critical, at-risk)
- Progress bars

### 📈 Schedule Intelligence (1,000 ft)
- 12-week schedule heatmap
- Visual pressure indicators
- Critical path task list
- Milestone tracking

### 👥 Resource Command Center (100 ft)
- Team utilization percentages
- Burnout risk indicators (High/Medium/Low)
- Active task counts
- Peak load analysis

### 🤖 AI Intelligence Hub (30 ft)
- Natural language queries
- Dashboard filtering via tool calling
- Risk analysis
- Actionable recommendations

---

## 📱 Mobile Responsiveness

**Breakpoints:**
- Mobile: 320px - 768px (single column, swipeable)
- Tablet: 768px - 1024px (2-column grid)
- Desktop: 1024px+ (full multi-column layout)

**Touch Targets:** Minimum 44px (Apple HIG compliance)

---

## 🎨 Design System

### Mathematical Precision

```css
--phi: 1.618 (Golden ratio)
--scale-base: 16px
--scale-1: 25.888px (base × φ)
--scale-2: 41.888px (scale-1 × φ)
```

### Color Semantics

- **Teal (#14A085):** Acres Foundation brand, progress indicators
- **Red (#EF4444):** Critical health status, high urgency
- **Amber (#F59E0B):** At-risk status, warnings
- **Green (#10B981):** On-track status, success states

### Glassmorphism

```css
background: rgba(15, 23, 42, 0.5);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## 🔄 Data Refresh

**Automatic (Recommended):**
- Data cached at edge for 10 minutes
- Automatically revalidates on expiry

**Manual:**
- Just update Google Sheets
- Dashboard reflects changes within 10 minutes

---

## 🎯 Success Metrics

**Target Outcomes:**
- ✅ Portfolio visibility in <5 seconds
- ✅ Mobile-first access for 8 stakeholders
- ✅ AI-powered insights on demand
- ✅ Zero ongoing maintenance cost
- ✅ Sub-second UI interactions

---

## 📞 Support

**Project Lead:** Venkat Rao (IT Lead, Acres Foundation)  
**Team:** Ajay, Suyesh, Vipin, Nikhil, Supriya

---

## 📄 License

Internal use only - Acres Foundation

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

---

**Built with ❤️ for Acres Foundation | May 2026**
