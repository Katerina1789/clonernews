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

### Panagiotis → Data Layer
 
**Files:** `api.js`, `state.js`, `live.js`, `utils.js`, `main.js`
 
- [ ] Fetch ID lists per post type (e.g. `fetch('/topstories.json')`, `/jobstories.json`, `/askstories.json`)
- [ ] Fetch individual items by ID (e.g. `fetch('/item/{id}.json')`)
- [ ] Fetch items in parallel batches of 20 (e.g. `Promise.all(ids.map(fetchItem))`)
- [ ] Cache every fetched item by ID to avoid re-fetching (e.g. `const cache = {}; if (cache[id]) return cache[id]`)
- [ ] Fetch live updates on a 5-second interval (e.g. `setInterval(() => fetch('/updates.json'), 5000)`)
- [ ] Regulate requests to prevent API overload (e.g. `throttle`, `debounce` utilities in `utils.js`)
- [ ] Store and export all UI state in one object (e.g. `{ activeTab, allIds, loadedIds, currentOffset, openPostId, notifiedIds }`)
- [ ] Wire all modules together and trigger initial load (e.g. `main.js` imports and calls init functions in order)
- [ ] Complete when: all data flows correctly to Katerina's render functions, nothing is fetched twice, live polling fires every 5 seconds

---
 
### Katerina → UI Layer
 
**Files:** `feed.js`, `post.js`, `comments.js`, `index.html`, `style.css`, `main.js`
 
- [ ] Render feed with stories, jobs and polls (e.g. a card or row per post showing title, author, score, time, type)
- [ ] Display posts ordered newest to oldest (e.g. sort by `item.time` descending before rendering)
- [ ] Load posts in batches, not all at once (e.g. scroll event or "Load More" button that fetches the next 20)
- [ ] Open a post detail view on click without a page reload (e.g. hide feed, show detail panel, back button restores feed)
- [ ] Render poll options with scores inside the post detail view (e.g. list each `pollopt` with its `score`)
- [ ] Render comments under their parent post, ordered newest to oldest (e.g. sort `kids` by `time` descending)
- [ ] Show which post each comment belongs to (e.g. display parent post title above or within the comment)
- [ ] Handle deleted or missing comments gracefully (e.g. show `[removed]` or skip silently)
- [ ] Show a notification when a visible post is updated (e.g. banner or badge that auto-clears after 5 seconds)
- [ ] *!Bonus!* Render nested sub-comments indented under their parent (e.g. recursive render function with `paddingLeft` per depth level)
- [ ] Complete when: all three post types open without errors, comments are in order with correct parent, load more works without spam, notification appears on update

---
 
### Kyriakos → QA & Audit
 
**No files owned - responsible for testing, flagging bugs and verifying audit compliance.**
 
- [ ] Open a story post — verify it opens without errors
- [ ] Open a job post — verify it opens without errors
- [ ] Open a poll post — verify it opens without errors
- [ ] Trigger load more — verify new posts load without errors and without spamming the user
- [ ] Open a post with comments — verify comments display newest to oldest
- [ ] Verify the UI has at least stories, jobs and polls
- [ ] Verify all posts in the feed are ordered newest to oldest
- [ ] Verify each comment shows the correct parent post
- [ ] Verify the user is notified when a post is updated
- [ ] Verify throttling limits live data requests to every 5 seconds
- [ ] *!Bonus!* Verify sub-comments are nested correctly
- [ ] *!Bonus!* Verify additional post types beyond stories, jobs and polls are present
- [ ] Complete when: every item above passes and all found bugs have been flagged and fixed

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
 