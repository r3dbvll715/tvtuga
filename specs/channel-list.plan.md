# Channel List Test Plan

## Application Overview
The channel list displays IPTV channels with search, category filtering, and featured channels. Clicking a channel plays it in the video player.

## Test Scenarios

### 1. Channel List

**Seed:** `tests/seed.spec.ts`

#### 1.1. loads-and-displays-channels
**File:** `tests/channel-list/loads-and-displays-channels.spec.ts`

**Steps:**
  1. Navigate to the application
    - expect: Page title shows "Portugal IPTV"
    - expect: Header shows "Portugal IPTV"
  2. Wait for channels to load
    - expect: Channel list shows at least one channel
    - expect: Status bar shows "canais disponíveis"

#### 1.2. filters-by-search
**File:** `tests/channel-list/filters-by-search.spec.ts`

**Steps:**
  1. Navigate to the application
  2. Type "RTP" in the search input
    - expect: Channel list updates to show only matching channels
  3. Clear the search
    - expect: All channels are shown again

#### 1.3. filters-by-category
**File:** `tests/channel-list/filters-by-category.spec.ts`

**Steps:**
  1. Navigate to the application
  2. Click on a category filter tab
    - expect: Only channels in that category are shown

#### 1.4. selects-channel-on-click
**File:** `tests/channel-list/selects-channel-on-click.spec.ts`

**Steps:**
  1. Navigate to the application
  2. Click on the first channel
    - expect: Channel becomes active (highlighted)
    - expect: Video player starts loading