# Video Player Test Plan

## Application Overview
The video player displays IPTV streams with custom controls for play/pause, volume, and time display. It shows loading states, error states, and an empty state when no channel is selected.

## Test Scenarios

### 2. Video Player

**Seed:** `tests/seed.spec.ts`

#### 2.1. shows-empty-state-initially
**File:** `tests/video-player/shows-empty-state-initially.spec.ts`

**Steps:**
  1. Navigate to the application
    - expect: Video player shows "Selecione um canal" message

#### 2.2. toggles-play-pause
**File:** `tests/video-player/toggles-play-pause.spec.ts`

**Steps:**
  1. Navigate to the application
  2. Click the first channel
  3. Click the play button
    - expect: Play button changes to pause icon
  4. Click the play button again
    - expect: Pause button changes back to play icon

#### 2.3. adjusts-volume
**File:** `tests/video-player/adjusts-volume.spec.ts`

**Steps:**
  1. Navigate to the application
  2. Click the first channel
  3. Click the volume up button
    - expect: Volume level increases
  4. Click the volume down button
    - expect: Volume level decreases