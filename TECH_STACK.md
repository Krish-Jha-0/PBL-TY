# Technology Stack & System Architecture

**Project:** Intelligent Train Traffic & Platform Management System  
**Corridor Focus:** Daund – Pune Junction Railway Corridor (76 km)  
**Academic Context:** MIT Project-Based Learning (TY PBL)  
**Document Version:** 1.0.0  

---

## 1. Executive Summary

This application is an intelligent, real-time railway operations decision-support system and digital control center for managing train traffic, platform berthing allocations, conflict detections, and departure prioritizations along the high-density Daund–Pune Junction section.

The application is built on modern web standards featuring **Next.js 16 (Turbopack)**, **React 19**, **TypeScript 5**, **Tailwind CSS v4**, and **Recharts**, combined with custom algorithmic engines for constraint satisfaction, scheduling, and simulation.

---

## 2. Core Technology Stack Matrix

### 2.1 Framework & Core Runtimes

| Technology | Version | Purpose & Implementation |
|---|---|---|
| **Next.js** | `16.4.0` | Full-stack web framework utilizing App Router architecture, Turbopack incremental bundler, Client Components for dynamic control panels, and server-side route conventions. |
| **React** | `19.3.0` | UI component library providing declarative stateful rendering, reactive context, and fast virtual DOM diffing. |
| **React DOM** | `19.3.0` | DOM bindings and hydration engine for React 19. |
| **Node.js** | `>= 20.x` | JavaScript runtime environment executing development and build workflows. |
| **TypeScript** | `^5.x` | Static typing layer defining rigorous domain models (Train records, platforms, conflicts, decision audits, and temporal windows). |

---

### 2.2 Styling, Design System & Iconography

| Technology | Version | Purpose & Implementation |
|---|---|---|
| **Tailwind CSS** | `^4.0.0` | Utility-first CSS engine using the new `@import "tailwindcss"` engine for rapid UI development. Configured with a dedicated dark-themed Railway Operational Control Center (ROCC) palette (`#080e1a` background, `#0d1629` panels, railway signal colors for track status). |
| **@tailwindcss/turbopack** | `^4.0.0` | Dedicated Turbopack integration loader for Tailwind CSS v4 in Next.js. |
| **clsx** | `^2.1.1` | Lightweight utility for conditionally joining CSS class names. |
| **tailwind-merge** | `^3.0.2` | Utility to safely merge Tailwind CSS classes without conflict or style overriding bugs. |
| **Lucide React** | `^1.16.0` | Comprehensive iconography set representing railway signals, trains, warning alerts, tracks, clock controls, and platform indicators. |

---

### 2.3 Visualization & Analytics

| Technology | Version | Purpose & Implementation |
|---|---|---|
| **Recharts** | `^2.15.1` | SVG-based charting library used for data analytics: Corridor Speed Profiles, Platform Turnaround Timelines, Delay Escalation Curves, and Train Type Distribution. |

---

### 2.4 Code Quality, Linting & Build Tools

| Technology | Version | Purpose & Implementation |
|---|---|---|
| **Turbopack** | Built-in | Next.js high-performance Rust-based bundler and development server. |
| **ESLint** | `^9.x` | Pluggable linting utility for maintaining code health and syntax standards. |
| **eslint-config-next**| `16.4.0` | Next.js-specific lint rules enforcing App Router and React best practices. |

---

## 3. Architecture & Engineering Layers

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                    │
│   Next.js App Router Pages (/trains, /platforms, etc.)      │
│   Dashboard Widgets, Track Map, Gantt Timeline, Drawers    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    State & Context Layer                    │
│              RailwayContext (Global Telemetry Store)         │
│         Simulated Clock, Real-time Dispatches, Overrides    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 Algorithmic Engines & Domain                │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Simulation Engine   │       │  Conflict Engine      │  │
│  │   (Kinematics & Time) │       │  (Headway & Berthing) │  │
│  └───────────────────────┘       └───────────────────────┘  │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Platform Allocation   │       │ Departure Priority    │  │
│  │ (Constraint Solver)   │       │ (Higher-Delay-First)  │  │
│  └───────────────────────┘       └───────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 Persistence & Data Services                 │
│    StorageAdapter (localStorage with versioned keys)        │
│    Static Ground Truth (Platforms & Timetable Datasets)     │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Domain & Algorithmic Engines (`src/engine/`)

1. **Simulation Engine (`simulation.ts`)**
   - Coordinates the simulated corridor clock (with pause, resume, and variable step rates: 1x, 2x, 5x, 10x).
   - Simulates train kinematics and spatial progress across the 76 km corridor (Daund -> Kedgaon -> Uruli -> Hadapsar -> Pune Junction).
   - Generates dynamic delay variations and status transitions (`SCHEDULED` -> `APPROACHING` -> `WAITING_PLATFORM` -> `AT_PLATFORM` -> `WAITING_DEPARTURE` -> `DEPARTED`).

2. **Platform Allocation Engine (`platformAllocation.ts`)**
   - Implements a multi-factor constraint satisfaction algorithm:
     - **Rake Length Compatibility**: Matches train coach count (e.g., 24 coaches) against physical platform length capacity.
     - **Train Type Suitability**: Ensures specialized train types (Vande Bharat, Duronto, Mail/Express) berth at designated platforms.
     - **Temporal Window Feasibility**: Evaluates overlapping berthing windows with safety buffer thresholds (default: 10 minutes).
     - **Scoring & Alternatives**: Scores all available platforms and suggests ranked alternatives when conflicts occur.

3. **Conflict Detection Engine (`conflictEngine.ts`)**
   - Continuously scans active train schedules and platform bookings for:
     - Platform double-booking overlaps.
     - Headway/approach hazards (trains approaching without an approved platform).
     - Insufficient turnaround time buffers.
   - Produces structured conflict records with automated resolution recommendations (e.g., reassign platform, adjust departure slot).

4. **Departure Prioritization Engine (`prioritization.ts`)**
   - Implements the **Higher-Delay-First** heuristic to mitigate cumulative delay compounding at bottleneck terminal tracks.
   - Features configurable tie-breaking rules (scheduled departure time vs. train number).

### 3.2 State Management (`src/context/RailwayContext.tsx`)
- Centralized React Context providing unified access to:
  - Trains state array & real-time telemetry.
  - Platform statuses and occupancy records.
  - Detected active conflicts and audit log of controller decisions.
  - Corridor master settings (safety buffer, auto-approval thresholds).
  - Play / Pause / Fast-forward simulation controls.

### 3.3 Persistence Layer (`src/persistence/storageAdapter.ts`)
- Client-side storage abstraction leveraging browser `localStorage`.
- Employs namespaced keys with schema versioning (`railway_corridor_*_v1`).
- Provides fallback to ground-truth timetable datasets on cold boot or reset.

### 3.4 Temporal Calculations Engine (`src/utils/timeUtils.ts`)
- Robust time arithmetic module handling 12-hour AM/PM formats, minutes conversions, and **midnight-crossing operational scenarios** (e.g., runs beginning 11:50 PM and arriving 01:20 AM).
- Window intersection detection with configurable buffer tolerances.

### 3.5 Automated Verification Suite (`src/tests/engineTests.ts`)
- Standalone self-contained test suite validating:
  - Midnight-crossing arithmetic and time utilities.
  - Berthing overlap detection.
  - Higher-delay priority sorting assertions.
  - Constraint satisfaction heuristics for platform assignment.

---

## 4. Application Routes & UI Views

| Route | View Name | Primary Functionality |
|---|---|---|
| `/` | **Operations Dashboard** | Live master view with operational KPIs, SVG-based Corridor Track Map (Daund to Pune), Platform Status Grid, and Urgent Alert Feed. |
| `/trains` | **Train Operations & Timetable** | Complete timetable table with real-time delay injector, rake length indicators, type filters, and detail drawer. |
| `/platforms` | **Platform Management & Timeline** | Interactive Gantt timeline visualization across Platforms 1–6 showing occupancy slots and maintenance toggles. |
| `/conflicts` | **Conflict Resolution Center** | Active conflict cards with severity levels, affected trains, and single-click automated resolution application. |
| `/priorities` | **Departure Prioritization Board** | Live ranking queue of ready trains with algorithm transparency reasons and manual priority adjustment. |
| `/decisions` | **Controller Audit Log** | Immutable log tracking all platform assignments, controller approvals, overrides, and timestamps. |
| `/settings` | **System Configuration** | Configurable dispatch safety margins, auto-approval thresholds, and reset-to-defaults controls. |

---

## 5. Development & Execution Scripts

All commands can be executed using `npm` (or `npm.cmd` on Windows PowerShell):

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack at `http://localhost:3000`. |
| `npm run build` | Compiles the production application bundle and performs type-checking. |
| `npm run start` | Boots the compiled production server. |
| `npm run lint` | Runs ESLint across all TypeScript and React source files. |

---

## 6. Directory Structure Overview

```
execution/
├── public/                 # Static assets and icons
├── src/
│   ├── app/                # Next.js App Router (pages, layout, styling)
│   │   ├── conflicts/      # Conflict resolution route
│   │   ├── decisions/      # Decision log audit trail route
│   │   ├── platforms/      # Platform timeline & allocation route
│   │   ├── priorities/     # Departure priority queue route
│   │   ├── settings/       # System configuration route
│   │   ├── trains/         # Live timetable and train tracker route
│   │   ├── globals.css     # Global styles & Tailwind CSS v4 tokens
│   │   ├── layout.tsx      # Root application layout
│   │   └── page.tsx        # Command Center Dashboard
│   ├── components/         # Reusable React components
│   │   ├── dashboard/      # Track map, KPI cards, Recharts panels
│   │   ├── layout/         # Railway navigation shell, headers, status bars
│   │   ├── platforms/      # Platform Gantt timeline component
│   │   └── trains/         # Train inspector drawer & detail cards
│   ├── context/            # React Context (RailwayContext.tsx)
│   ├── data/               # Ground truth timetable & platform seed data
│   ├── engine/             # Core algorithmic scheduling & simulation engines
│   ├── persistence/        # LocalStorage persistence adapter
│   ├── tests/              # Verification & heuristic test suite
│   ├── types/              # TypeScript railway domain interfaces
│   └── utils/              # Time manipulation and midnight-crossing utils
├── next.config.ts          # Next.js & Turbopack configuration
├── package.json            # Project manifest & dependency specifications
├── tsconfig.json           # TypeScript configuration
└── TECH_STACK.md           # This documentation document
```
