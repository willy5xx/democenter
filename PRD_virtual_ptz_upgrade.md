# Product Requirements Document (PRD) — Virtual PTZ Architecture Upgrade

## 1. Overview

### 1.1 Executive Summary

The internal demo dashboard for vending machines currently relies on server-side video stream switching, where a fisheye ceiling camera is dewarped and cropped into multiple FFmpeg-generated streams. Each vending machine demo view is a separate WebRTC stream. This design introduces noticeable latency when switching machines and requires restarting the Docker container (and thus all streams) when configuration changes are made.

The proposed upgrade consolidates video handling into a single, high-quality dewarped 1920x1080 stream from the server and implements **client-side “virtual PTZ”** using CSS transforms to zoom and pan to machine regions. Machine configurations will be stored and updated in JSON without restarting infrastructure. This change should deliver **instant machine switching**, **no demo interruption during configuration changes**, and **reduced backend CPU load**, while simplifying ongoing maintenance.

### 1.2 Problem Statement

- **Switching Latency During Demos**
  - **Current behavior**: When a salesperson switches between machines, the frontend disconnects from one WebRTC stream and connects to another, incurring a 2–4 second WebRTC handshake.
  - **Impact**: Demo flow feels sluggish and unpolished, forcing salespeople to verbally “cover” the delay and risking loss of prospect attention.

- **Operational Downtime on Configuration Changes**
  - **Current behavior**: Adding or updating a machine region modifies `go2rtc.yaml` and requires restarting the Docker container that hosts the streaming stack.
  - **Impact**: Active demos momentarily lose the video feed, undermining trust and making configuration changes risky during important sales windows.

- **Server Resource Inefficiency**
  - **Current behavior**: The server creates and manages a dedicated FFmpeg process for each machine region (crop + upscale), leading to N encoding processes per deployment.
  - **Impact**: Increased CPU usage, higher risk of instability under load, and more complex operational debugging.

- **Configuration Complexity & Maintainability**
  - **Current behavior**: Machine layout and cropping logic are tightly coupled to streaming configuration (`go2rtc.yaml` + FFmpeg processes).
  - **Impact**: Harder for admins/engineers to safely evolve machine layouts, onboard new sites, or experiment with new demo flows.

### 1.3 Goals & Success Metrics

- **Primary Goals**
  - **Eliminate perceptible latency** when switching between machines during demos.
  - **Remove the need to restart containers** when changing machine configurations.
  - **Reduce backend CPU utilization** by moving from N per-machine encoding processes to a single dewarped stream.
  - **Simplify configuration** into a JSON-based, app-level concept decoupled from low-level streaming configuration.

- **Key Success Metrics**
  - **Switch latency**: Machine switch perceived latency \< 100ms in the UI (no visible “loading” spinner).
  - **Uptime during config changes**: 0 stream restarts required for CRUD operations on machine regions in normal operation.
  - **CPU usage**: ≥ 30–50% reduction in CPU utilization on the streaming host under typical demo load (relative to current architecture).
  - **Configuration agility**: Time to add/update a machine region reduced by ≥ 50% (from ticket → config merged → demo-ready).

## 2. Scope

### 2.1 In Scope

- **Backend**
  - Serve a **single 1920x1080 dewarped stream** per site (WebRTC or equivalent).
  - Remove dynamic per-machine FFmpeg stream generation and management.
  - Provide a JSON-based configuration mechanism (file or API) for machine regions.

- **Frontend**
  - Implement **client-side virtual PTZ** in the camera view using CSS transforms.
  - Support smooth transitions when switching machine views (CSS `transition`).
  - Load machine region definitions from JSON configuration.

- **Configuration & Tooling**
  - Define a JSON schema for machine layout and region definitions.
  - Define a workflow for updating configurations without container restarts.

### 2.2 Out of Scope (Phase 1)

- A full visual admin UI for editing machine regions (drag-and-drop editor).
- Multi-site orchestration or advanced cross-region streaming optimizations.
- Overhaul of the auth model beyond what is required to protect configuration APIs.
- Wholesale UI redesign of the entire dashboard beyond what is needed for virtual PTZ.

## 3. User Stories

### 3.1 Salesperson — Instant Switching

- **Story**: As a salesperson, I want to switch between machines instantly so my demo flows smoothly and feels high-end.
- **Acceptance Criteria**:
  - Switching from machine A to B does not show a loading spinner or frozen frame longer than 100ms.
  - No WebRTC reconnect indicator is visible on machine switch.
  - Switching between at least N (e.g., 6–8) machines repeatedly for 60 seconds shows no visible lag or glitching.

### 3.2 Salesperson — Stable Demos During Config Changes

- **Story**: As a salesperson, I want active demos to remain uninterrupted even if someone updates machine configurations in the background.
- **Acceptance Criteria**:
  - Updating the machine configuration (via JSON or API) does not drop or restart the main stream.
  - If a currently-selected machine region is modified, the view updates gracefully (either seamlessly repositions or waits until the next selection) without a stream reconnect.

### 3.3 Admin — Safer Machine Region Management

- **Story**: As an admin, I want to add or adjust machine regions without restarting services so I don’t risk breaking ongoing demos.
- **Acceptance Criteria**:
  - Configuration changes are applied via editing a JSON config file or using an API endpoint.
  - No Docker container or streaming process restart is required for changes to take effect.
  - Validation errors (e.g., malformed coordinates) are surfaced clearly (logs and/or UI) without breaking existing working configurations.

### 3.4 Admin — Predictable Layout Configuration

- **Story**: As an admin, I want machine coordinates to be defined relative to a known, fixed 1920x1080 frame so layout is predictable and portable across environments.
- **Acceptance Criteria**:
  - All machine region definitions use `{ x, y, width, height }` in pixels (or a well-defined normalized coordinate system) anchored to a 1920x1080 base.
  - Documentation (or in-code comments) clearly specifies how coordinates map to on-screen behavior.

### 3.5 Engineer / SRE — Operational Simplicity

- **Story**: As an engineer, I want a simpler streaming pipeline so it’s easier to debug issues and scale the system.
- **Acceptance Criteria**:
  - Only one encoding pipeline per site is required for the main dewarped stream.
  - FFmpeg/go2rtc configuration no longer contains per-machine crops or per-machine stream definitions.
  - Observability (logs/metrics) shows stable behavior under typical demo usage with fewer moving parts.

## 4. Functional Requirements

### 4.1 Single Dewarped Stream Delivery

- The backend must expose a **single, continuous, dewarped 1920x1080 stream** per camera/site.
- The frontend must connect once per session to that main stream and never reconnect purely for machine switching.

### 4.2 Client-Side Virtual PTZ

- The camera view component must:
  - Accept machine region definitions as `{ id, name, x, y, width, height, ... }` aligned to 1920x1080 base coordinates.
  - Compute and apply CSS transforms (`transform: translate(...) scale(...)`) to virtually zoom and pan to the active machine.
  - Support at least:
    - A default “overview” mode (e.g., zoomed-out full frame).
    - Zoomed-in machine modes for each configured machine.
- The implementation must support smooth, animated transitions (e.g., 150–300ms, `ease-out`) between regions.

### 4.3 Machine Selection & Navigation

- The dashboard must display a clear list or map of available machines.
- Selecting a machine must:
  - Update the virtual PTZ view to that machine.
  - Update any contextual UI (title, metrics, etc.) associated with the machine.
- Switching back to “overview” must reset the transform to a full-frame view.

### 4.4 JSON-Based Configuration

- Machine regions must be defined in a JSON configuration file (or served via a simple API that returns JSON).
- JSON schema should minimally include:
  - `id` (string)
  - `name` (string)
  - `x`, `y`, `width`, `height` (numbers)
  - Any extra metadata required by the dashboard.
- The application must load and interpret this configuration on startup and, if feasible, support hot-reload or periodic polling for changes without restarting the main stream.

### 4.5 Backward Compatibility & Migration

- Existing deployments using per-machine streams must have a documented path to migrate machine definitions into the new JSON schema.
- During migration, there should be a clear way to test the new architecture (e.g., staging environment or feature flag) without disrupting production demos.

## 5. Non-Functional Requirements

### 5.1 Performance

- **Switching latency** between machine views should be effectively instant:
  - Animations complete within **\< 300ms**.
  - No added network roundtrips to the server for switching.
- The main video stream must maintain stable frame rate and resolution under continuous virtual PTZ usage.
- The additional CPU/GPU load on the client for transforms should be minimal and must not degrade overall dashboard responsiveness on typical salesperson hardware.

### 5.2 Reliability & Availability

- The system must not require stream or container restarts for configuration changes.
- The video stream should remain connected and stable for the duration of typical demos (e.g., 30–60 minutes).
- In case of invalid configuration, the system should:
  - Fail gracefully by ignoring invalid regions.
  - Continue to display valid machine regions and the overview.

### 5.3 Maintainability

- Streaming configuration should be simplified to a single-stream definition per site in `go2rtc.yaml` (or equivalent), clearly documented.
- Machine layout logic should be isolated to JSON config + frontend logic, not intermingled with streaming configuration.
- Code should be structured so that:
  - Adding new machine types or layouts mainly involves editing JSON.
  - Switching to alternative streaming backends (if needed) minimally impacts the virtual PTZ logic.

### 5.4 Security

- Configuration APIs or JSON files that define machine regions must be protected according to existing auth and RBAC patterns.
- No sensitive information (credentials, internal IPs, etc.) should be exposed through the machine configuration JSON.

### 5.5 UX & Demo Quality

- Transitions between machines must feel “cinematic” and fluid, with no jarring jumps or visible artifacts.
- UI controls for machine selection should be intuitive and consistent with the rest of the dashboard.
- If a machine region is temporarily unavailable or misconfigured, the UI should show a clear, non-technical message and fallback to a safe view (e.g., overview or last-known-good machine).

## 6. Notes for LLMs Consuming This PRD

- **Primary Objective**: Implement a **single-stream, client-side virtual PTZ** architecture for the vending machine demo dashboard.
- **Key Constraints**:
  - One dewarped 1920x1080 stream from the backend; no per-machine streams.
  - Machine regions defined in JSON with `{ x, y, width, height }` relative to 1920x1080.
  - Frontend uses CSS transforms (`translate`, `scale`) for zoom/pan between regions.
- **Follow-On Work**:
  - A separate **Technical Requirements Document (TRD)** should specify:
    - Backend changes in `server.js` and `go2rtc.yaml`.
    - Frontend `CameraView` virtual PTZ logic and formulas.
    - Detailed migration plan from the old architecture to this one.


