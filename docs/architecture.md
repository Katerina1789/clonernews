# Architecture - ClonerNews

## System Overview

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ index.html  │ --> │   main.js    │ --> │   state.js  │
└─────────────┘     └──────┬───────┘     └──────┬──────┘
                           │                    │
                    events │              calls │
                           │                    ▼
              ┌────────────┴──────┐      ┌────────────┐
              │    feed.js        │      │   api.js   │
              │    post.js        │      └────────────┘
              │    comments.js    │
              └───────────────────┘
                                            ▲
                                     ┌──────┴──────┐
                                     │   live.js   │
                                     └─────────────┘
```

## Data Flow

```text
DOMContentLoaded
      ↓
  initFeed()          // wire tab + load-more buttons
  registerUIEvents()  // listen for CustomEvents from UI
      ↓
  loadInitialPosts()  // fetch first 20 IDs -> fetch items -> cache
      ↓
  renderPosts()       // build post cards, report visible IDs
      ↓
  startLiveUpdates()  // start 5-second live update loop
      ↓
  [user clicks post]
      ↓
  openPost()          // fetch item + comments + poll options
      ↓
  renderPostDetail()  // render detail view, hand comments to comments.js
```

## Module Responsibilities

```text
main.js       Entry point. Wires data layer to UI layer via CustomEvents.
              Owns loadAndEmitPosts(), registerUIEvents(), init().

state.js      Single source of truth. Stores active type, loaded posts,
              cursors, visible IDs, open post, live update IDs.

api.js        All HackerNews fetch logic. In-memory cache by item ID.
              Batch fetches with Promise.all. Normalizes comments.

live.js       Polls /updates.json every 5s. Compares against visible IDs.
              Calls onUpdate() callback when intersection found.

utils.js      throttle, debounce, formatTime, sortByNewest, isFeedPost.

feed.js       Renders post cards. Manages loading spinner and load-more
              button. Reports visible IDs after each render.

post.js       Renders post detail view. Shows live update notification
              banner with auto-dismiss.

comments.js   Renders flat or nested comment trees. Indents by level.
              Shows parent post title on top-level comments only.
```

## Event Contract

```text
UI → main.js (fired by feed.js / post.js)

  clonernews:change-type    { type }          tab switched
  clonernews:load-more      {}                load more clicked
  clonernews:visible-posts  { ids[] }         visible IDs after render
  clonernews:open-post      { id, nested }    post card clicked
  clonernews:clear-live-update {}             banner dismissed

main.js → UI (handled directly via imported render functions)

  renderPosts()             new batch of post cards
  renderPostDetail()        full post + comments
  showLiveNotification()    update banner
  setLoading()              spinner on/off
  setHasMore()              load-more button on/off
```

## Request Strategy

```text
Stories / Jobs   → fetch ID list endpoint → slice 20 IDs → Promise.all
Polls            → walk topstories list → filter type=poll → Promise.all
All              → walk backward from maxitem → mixed types → Promise.all
Comments         → fetch post.kids[] → Promise.all → sort newest first
                   nested: recurse into each comment.kids[]
Live updates     → setInterval 5s → throttle guard → compare to visibleIds
Cache            → Map keyed by ID → checked before every fetch
```
