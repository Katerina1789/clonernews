# Product Requirements Document (PRD) - Clonernews

## 1. Project Overview

The goal of this project is to build a clean, minimal UI client for the public HackerNews API.

The application must:

- fetch all data from `https://github.com/HackerNews/API`
- display stories, jobs and polls in a unified feed
- load posts in batches, only when the user needs more
- open individual posts with their comments, ordered newest to oldest
- poll for live data updates every 5 seconds and notify the user
- throttle and optimize all API requests to avoid overloading the API
- run entirely in the browser with vanilla JavaScript
- remain fast, clean and beginner-friendly

No frameworks or libraries are allowed.

---

## 2. Technical Requirements

- **Language:** JavaScript (vanilla, ES modules)
- **Environment:** Browser only (no Node.js runtime)
- **Files:**
  ```
  index.html
  style.css
  js/api.js
  js/state.js
  js/feed.js
  js/post.js
  js/comments.js
  js/live.js
  js/utils.js
  js/main.js
  ```
- **Code Style:**
  - clean, readable, beginner-friendly
  - small focused functions
  - minimal navigation comments above functions, loops and branching logic
  - no external libraries
- **API Base URL:** `https://hacker-news.firebaseio.com/v0/`
- **Example Key Endpoints:**
  - `/topstories.json` — list of up to 500 story IDs
  - `/newstories.json` — list of newest story IDs
  - `/jobstories.json` — list of job IDs
- **Testing:** manual testing following the audit checklist, no automated tests required

---

## 3. Functional Requirements

### Feed

- Display stories, jobs and polls in a single feed
- Each post shows: title, author, score, type, time (formatted), and comment count
- Posts are sorted newest to oldest by `time` (Unix timestamp)
- Tab or filter control to switch between stories, jobs and polls
- Posts load in batches of 20 at a time
- A "Load More" trigger (scroll event or button) fetches the next batch
- No more than 20 items are fetched per batch at any time
- Already-fetched items are cached in memory and never re-fetched
- Graceful fallback for posts with missing or null fields

### Post Detail

- Clicking a post opens a detail view
- Detail view shows: title, full text or URL, author, score, time, type
- If the post is a poll, its options (`pollopts`) are displayed with their scores
- Comments are loaded and displayed below the post
- Comments are sorted newest to oldest by `time`
- Each comment clearly shows which post it belongs to
- *!Bonus!* Sub-comments are rendered as a nested tree under their parent comment

### Comments

- Fetch all `kids` IDs for a post, then fetch each comment individually
- Sort fetched comments by `time` descending before rendering
- Handle deleted or dead comments gracefully (skip or mark as `[removed]`)
- *!Bonus!* Recursively fetch and render nested sub-comments to any depth

### Live Updates

- Poll `/v0/updates.json` on a fixed 5-second interval using `setInterval`
- Compare returned changed IDs against currently displayed post IDs
- If any visible post has been updated, display a notification to the user (banner or badge)
- Do not auto-refresh or re-render the full feed on update — only notify
- The notification must be dismissable or auto-clear after a short delay
- The polling interval must be throttled to exactly 5 seconds — no faster

### Request Optimization

- Fetch item batches in parallel using `Promise.all`
- Cache every fetched item by ID in `api.js` — never fetch the same ID twice
- Throttle the live update poll to one request per 5 seconds
- Debounce the "load more" scroll trigger to prevent duplicate batch requests
- *!Bonus!* Throttle/debounce utilities live in `utils.js` and are reused across modules

---

## 4. Team Workflow and Tasks

Below is the task split across three team members, matching the project architecture and file responsibilities.

---

###  -> Data & Live Layer

**Responsible for all API communication, caching, state management and live update polling.**

**Files:** `api.js`, `state.js`, `live.js`

**Tasks:**

- **API & Cache** (`api.js`)
  - [ ] Implement `fetchIds(type)` — fetches the full ID list for a given post type (stories, jobs, polls)
  - [ ] Implement `fetchItem(id)` — fetches a single item by ID, checks cache first
  - [ ] Implement `fetchBatch(ids)` — fetches an array of IDs in parallel using `Promise.all`
  - [ ] Implement `fetchUpdates()` — fetches `/updates.json` for live data
  - [ ] In-memory cache object: before any fetch, return cached item if it exists
  - [ ] All fetch functions must handle network errors gracefully and not crash the app
  - [ ] Complete when: any module can call these functions, data is returned correctly, and the same ID is never fetched twice in a session

- **State** (`state.js`)
  - [ ] Define and export the central state object containing: `activeTab`, `allIds`, `loadedIds`, `currentOffset`, `pageSize`, `openPostId`, `lastUpdatedIds`, `notifiedIds`
  - [ ] Complete when: all modules import from one shared state object with no local copies of the same data

- **Live Updates** (`live.js`)
  - [ ] Start a `setInterval` polling loop that calls `fetchUpdates()` every 5 seconds
  - [ ] Compare returned changed IDs against `state.loadedIds`
  - [ ] If intersection found, trigger a notification in the UI
  - [ ] Store notified IDs in `state.notifiedIds` to avoid duplicate notifications
  - [ ] Complete when: a notification visibly appears within 5 seconds of a post update, and the same post is not notified twice in a row

---

###  -> Feed & Navigation Layer

**Responsible for the post list, pagination, tab switching and overall app wiring.**

**Files:** `feed.js`, `utils.js`, `main.js`

**Tasks:**

- **Feed Rendering** (`feed.js`)
  - [ ] On tab load, call `fetchIds(type)` and store result in `state.allIds`, reset `state.currentOffset` to 0
  - [ ] Slice `state.allIds` from `currentOffset` to `currentOffset + pageSize`, fetch and render that batch
  - [ ] Each rendered post shows: title, author, score, type label, formatted time, comment count
  - [ ] Handle posts with missing fields — display a dash or skip the field, never crash
  - [ ] After rendering a batch, advance `state.currentOffset` and push IDs into `state.loadedIds`
  - [ ] Complete when: 20 posts render on load, all three types display correctly, and missing fields do not cause errors

- **Load More** (`feed.js`)
  - [ ] Attach a scroll event listener or "Load More" button that triggers the next batch fetch
  - [ ] Use the debounce utility to prevent firing multiple requests from a single scroll
  - [ ] Stop triggering when `state.currentOffset >= state.allIds.length`
  - [ ] Complete when: scrolling or clicking loads exactly the next 20 posts without duplicate requests or crashes

- **Tab Switching** (`feed.js`)
  - [ ] Clicking a tab (Stories / Jobs / Polls) resets state and re-renders the feed for that type
  - [ ] *!Bonus!* Add an "Ask" and "Show" tab using `/askstories.json` and `/showstories.json`
  - [ ] Complete when: switching tabs clears the current feed and loads fresh content for the selected type

- **Utilities** (`utils.js`)
  - [ ] Implement `throttle(fn, delay)` — executes fn at most once per delay ms
  - [ ] Implement `debounce(fn, delay)` — executes fn only after delay ms of inactivity
  - [ ] Implement `formatTime(unixTimestamp)` — returns a readable relative time string (e.g. "3 hours ago")
  - [ ] Complete when: throttle is used in `live.js`, debounce is used in `feed.js`, and time displays correctly on all posts

- **App Wiring** (`main.js`)
  - [ ] Import and initialize all modules in the correct order
  - [ ] Trigger the initial feed load on page ready
  - [ ] Start the live update polling loop
  - [ ] Complete when: the app loads end-to-end with a single entry point and no circular dependencies

---

###  -> Post Detail & Comments Layer

**Responsible for rendering individual posts, comment threads and the notification UI.**

**Files:** `post.js`, `comments.js`

**Tasks:**

- **Post Detail** (`post.js`)
  - [ ] On post click, set `state.openPostId` and render the detail view
  - [ ] Detail view displays: title, URL or full text, author, score, formatted time, type label
  - [ ] If type is `poll`, fetch and display each `pollopt` with its score
  - [ ] A back/close control returns the user to the feed without a page reload
  - [ ] Complete when: clicking any story, job and poll opens its detail view with all available fields and no console errors

- **Comments** (`comments.js`)
  - [ ] Fetch all `kids` IDs from the open post using `fetchBatch()`
  - [ ] Sort fetched comments by `time` descending before rendering
  - [ ] Each comment displays: author, formatted time, comment body, and a reference to the parent post title
  - [ ] Handle deleted/dead comments — display `[removed]` or skip, never crash
  - [ ] *!Bonus!* For each comment that has its own `kids`, recursively fetch and render sub-comments indented below the parent
  - [ ] *!Bonus!* Nested comments render to any depth without hardcoding a limit
  - [ ] Complete when: all comments appear below a post in newest-to-oldest order, each showing correct parent, and removed comments do not break the thread

- **Notification UI** (`post.js` or inline in `index.html`)
  - [ ] Render a notification banner or badge when `live.js` signals an update
  - [ ] Notification identifies which post was updated (by title or ID)
  - [ ] Notification is dismissable or auto-clears after 5 seconds
  - [ ] Complete when: notification appears within one polling cycle of an update and does not stack infinitely

---

## 5. Glossary
 
Key terms used throughout this project, for quick reference.
 
| Term | Definition |
|---|---|
| **API** | Application Programming Interface — a service that exposes data for other apps to consume. HackerNews provides one at `hacker-news.firebaseio.com`. |
| **Endpoint** | A specific URL on an API that returns a particular type of data, e.g. `/topstories.json`. |
| **Item** | The universal HackerNews data object. Every story, job, poll, comment and pollopt is an "item" with an `id`, `type`, and type-specific fields. |
| **kids** | An array of child item IDs belonging to a post or comment. For posts, these are top-level comments. For comments, these are replies. |
| **pollopt** | A single selectable option inside a poll item. Has its own `id` and `score`. |
| **dead** | A boolean field on an item. If `true`, the item has been flagged and should be treated as removed. |
| **by** | The `by` field on any item — the username of the person who posted it. |
| **score** | The number of upvotes an item has received. Not present on comments. |
| **time** | A Unix timestamp — the number of seconds since January 1, 1970. Used to sort posts and comments by date. |
| **Unix timestamp** | A standard way to represent a point in time as a single integer. Convert to a readable date with `new Date(time * 1000)`. |
| **Cache** | An in-memory store (a plain JS object) that saves fetched items by ID so they are never re-fetched during the same session. |
| **Promise.all** | A JavaScript method that fires multiple async requests at the same time and waits for all of them to finish before continuing. Used for batch fetching. |
| **Throttle** | A technique that limits a function to run at most once per time window, regardless of how many times it is triggered. Used for the live polling loop. |
| **Debounce** | A technique that delays a function until a set time has passed since the last trigger. Used for scroll-based load more, to avoid firing on every pixel scrolled. |
| **setInterval** | A built-in browser function that repeatedly calls a function at a fixed time interval, e.g. every 5 seconds. |
| **ES Module** | A JavaScript file that uses `import` and `export` to share code between files. All `js/` files in this project are ES modules. |
| **State** | The current data and UI condition of the app at any given moment — which tab is active, which posts are loaded, which post is open, etc. Centralized in `state.js`. |
 