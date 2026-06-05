# Audit Guide - ClonerNews

Manual testing checklist for the ClonerNews project.

## Functional Tests

### Post Types

- [ ] Open a story post — does it open without any errors?
- [ ] Open a job post — does it open without any errors?
- [ ] Open a poll post — does it open without any errors?

### Feed

- [ ] Click Load More — do new posts load without errors and without spamming the API?
- [ ] Are all posts displayed newest to oldest?
- [ ] Does the UI show at least stories, jobs and polls?

### Comments

- [ ] Open a post with comments — are they displayed newest to oldest?
- [ ] Does each comment show the correct parent post?

### Live Updates

- [ ] Does the UI notify the user when a visible post is updated?
- [ ] Is throttling used to regulate requests to every 5 seconds?

## Bonus

- [ ] Does the UI have more post types than stories, jobs and polls?
- [ ] Are nested sub-comments implemented?

## Console Verification

```js
// Verify caching — cachedItems should grow, never reset on same session
clonernewsData.getCacheInfo()

// Verify live update state
clonernewsData.state.visiblePostIds
clonernewsData.state.changedVisiblePostIds

// Manually trigger a live update notification
window.dispatchEvent(new CustomEvent("clonernews:live-update", {
  detail: { changedIds: [1, 2, 3], count: 3 }
}))

// Verify polling in DevTools -> Network -> filter by "updates"
// One request every 5 seconds exactly
```
