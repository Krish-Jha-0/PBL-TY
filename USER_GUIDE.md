# Intelligent Train Traffic & Platform Management System (RailTraffic OS)
## Operational User Manual & Guide

**Corridor:** Daund Junction (DD) ➔ Pune Junction (PUNE) (76.0 km)  
**System URL:** [http://localhost:3000](http://localhost:3000)  
**Purpose:** Decision Support System for Real-Time Train Traffic, Platform Berthing Allocation, Conflict Detection, and Delay-Based Prioritization.

---

## 1. Quick Start: Launching the App

1. Ensure the development server is running in the project directory:
   ```powershell
   npm run dev
   # or on Windows PowerShell if execution policies apply:
   npm.cmd run dev
   ```
2. Open your web browser and navigate to:  
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 2. Top Simulation Control Bar

Located at the very top right of every screen, this control bar manages the global corridor timeline and clock:

| Control | Action | Purpose |
|---|---|---|
| **Simulated Time Clock** | Displays current operational time (e.g., `01:20 AM`) | Central time reference for all arrivals, berthings, and departures. |
| **Play / Pause (`Start` / `Pause`)** | Toggles real-time simulation clock | When running, the simulated clock advances automatically, trains move along the corridor, and status triggers fire. |
| **+5m / +15m (`Fast Forward`)** | Steps the simulation clock forward | Immediately advances time by 5 or 15 minutes to test upcoming arrivals and berthings without waiting. |
| **Inject Delay (`Shuffle`)** | Injects an artificial random delay | Adds 10–45 minutes of delay to an active train to test how the algorithm handles schedule disruptions and conflicts. |
| **Recalculate (`Refresh`)** | Triggers corridor-wide re-evaluation | Re-runs the platform constraint solver and conflict detector across all trains and platforms. |
| **Reset (`RotateCcw`)** | Resets simulation to baseline reference | Clears local storage overrides and restores the default corridor timetable and initial conditions. |

---

## 3. Screen-by-Screen User Guide

### 3.1 Overview (Central Traffic Control Dashboard) — `/`
The master command room view giving you instant situational awareness:

- **Operational KPIs:**
  - *Active Trains in Corridor*: Total count of scheduled and moving trains.
  - *Delayed Trains & Average Delay*: Immediate metric on corridor health.
  - *Platform Occupancy*: Live count of occupied platforms at Pune Junction (e.g. `2/6 PF`).
  - *Active Conflicts*: Number of safety or headway clashes requiring attention.
- **Corridor Track Schematic Map:**
  - Interactive diagram showing the 76 km corridor: **Daund Jn (0 km)** ➔ **Kedgaon (21 km)** ➔ **Uruli (47 km)** ➔ **Hadapsar (70 km)** ➔ **Pune Jn (76 km)**.
  - Live train markers animate along the tracks.
  - **Click any train bubble** on the track map to open the **Train Inspector Drawer**.
- **Departure Priority Queue Preview:** Shows top prioritized ready trains.
- **Live Platform Gantt Strip:** Snapshot of berthing windows at Pune Junction.

---

### 3.2 Train Monitor (`/trains`)
The real-time timetable and fleet status dashboard:

- **Search & Filter:**
  - Search by train number (e.g. `12116`), train name (`Siddheshwar Exp`), origin, or destination.
  - Quick filter tabs: `ALL`, `ON_TIME`, `DELAYED`, `APPROACHING`, `AWAITING_PLATFORM`, `CONFLICT`.
- **Train Cards / Table Columns:**
  - Displays Train Number, Type (SUPERFAST, EXPRESS, VANDE BHARAT, etc.), Rake Length (number of coaches), Scheduled vs. Estimated Arrival, Current Delay, Status, and Assigned Platform.
- **Interactive Inspector Drawer:**
  - Click on any train row or the **"Inspect"** button to open the right-side drawer.
  - **Adjust Delay:** Slide or type a new delay (e.g., +30 mins) and click "Apply Delay". Watch the system immediately recalculate its estimated arrival and platform suitability!
  - **Override Status:** Change train state between `SCHEDULED`, `APPROACHING`, `WAITING_PLATFORM`, `AT_PLATFORM`, `WAITING_DEPARTURE`, `DEPARTED`.
  - **Berth Platform:** Accept the AI recommended platform or manually assign a specific platform (PF 1 to 6).

---

### 3.3 Platform Allocation Engine (`/platforms`)
Manage berthing capacity and turnarounds across Pune Junction's 6 platforms:

- **6-Platform Status Grid:**
  - Visual cards for Platforms 1 through 6.
  - Shows physical coach length capacity (e.g., PF 1 handles up to 26 coaches, PF 5 handles 18 coaches).
  - Displays occupying train, occupied time interval, or next available slot.
  - **Maintenance Toggle:** Click **"Mark for Maintenance"** on any platform (e.g., PF 2). The system instantly takes it out of service, flags conflicts if a train was scheduled there, and recalculates alternative platforms!
- **Interactive Platform Gantt Timeline:**
  - Horizontal timeline displaying each train's occupancy block on its respective platform.
  - Visualizes buffer times between successive berthings to prevent collisions.
- **Pending Recommendations:**
  - Displays AI-generated platform suggestions for approaching trains.
  - Click **"Approve"** to lock in the allocation, or choose an alternative platform.

---

### 3.4 Departure Prioritization Queue (`/priorities`)
Automated dispatch queue utilizing the **Higher-Delay-First** heuristic:

- **Why this rule?**
  - In a congested terminal bottleneck, dispatching ready trains that already have higher accumulated delays prevents network-wide delay compounding.
- **How to use it:**
  - The queue automatically lists all trains that are ready for departure (`WAITING_DEPARTURE` or finished platform turnaround).
  - Shows Rank #1, #2, etc., along with the algorithm's exact explanation for that ranking.
  - **Dispatch Button:** Click **"Dispatch Rank #1"** to clear the highest priority train onto the main line (`DEPARTED`), freeing up its platform for incoming traffic.

---

### 3.5 Conflict Management Center (`/conflicts`)
Automated conflict resolution engine:

- **What gets detected?**
  - **Platform Overlaps**: Two trains assigned to the same platform at overlapping times without sufficient safety margin.
  - **Rake Capacity Exceeded**: A 24-coach train assigned to a 16-coach platform.
  - **Headway Hazards**: Approaching trains entering terminal limits without an approved platform.
  - **Maintenance Clashes**: Trains assigned to a platform currently undergoing maintenance.
- **Resolving Conflicts:**
  - Each conflict card displays severity (`CRITICAL`, `WARNING`, `ADVISORY`), affected trains, and an automated recommendation.
  - Click the green **"Apply Resolution"** button to automatically reassign platforms or re-sequence trains to clear the clash.

---

### 3.6 Controller Decisions Audit Trail (`/decisions`)
- Full audit log recording all advisory actions and operator interventions:
  - Platform approvals and manual reassignments.
  - Delay adjustments and status updates.
  - Maintenance activations.
  - Timestamps and previous vs. new values.
- Click **"Batch Approve All Recommendations"** to quickly approve all pending recommendations at once.

---

### 3.7 Settings & Simulation Configuration (`/settings`)
- **Corridor Safety Margins:**
  - Adjust *Safety Buffer Minutes* (default: 10 mins) between consecutive platform uses.
  - Adjust *Auto-Approval Threshold Minutes* (default: 10 mins).
  - Change *Tie-Breaker Rule* for departure priority: Scheduled Departure Time vs. Train Number.
- **Add Custom Train:**
  - Add extra trains into the timetable with custom rake lengths, schedules, and train types.
- **Reset to Baseline:**
  - Click **"Reset All Data to Reference Schedule"** to revert all modifications back to default.

---

## 4. Typical Demo / Evaluation Walkthrough

Follow these steps for a complete demonstration of the system:

1. **Observe the Baseline Corridor:**
   - Go to `/` (Overview) and see trains positioned along the Daund–Pune corridor.
   - Note the simulated time (e.g. `01:20 AM`) and platform occupancy at Pune Junction.

2. **Advance Time or Inject Delay:**
   - Click **`+15m`** twice on the top bar to step forward in time and observe trains transitioning from `SCHEDULED` to `APPROACHING`.
   - Click **`Inject Delay`** or go to `/trains`, click on a train (e.g., *12116 Siddheshwar Express*), and increase its delay by 35 minutes.

3. **Check Conflict Detection:**
   - Go to `/conflicts`. Notice how the delay causes a timing overlap on the platform!
   - Click **"Apply Resolution"** to watch the AI engine re-route the train to an available compatible platform.

4. **Test Platform Maintenance:**
   - Go to `/platforms`. Click **"Toggle Maintenance"** on Platform 1.
   - Observe how the system prohibits berthing on Platform 1 and recommends alternative platforms.

5. **Test Departure Prioritization:**
   - Go to `/priorities`. Review the ranked departure list.
   - Verify that the train with the highest delay is given Rank #1.
   - Click **"Dispatch Rank #1"** to depart the train and observe the platform status update.

6. **Audit the Log:**
   - Go to `/decisions` to review the audit trail of all approved allocations, overrides, and resolutions.
