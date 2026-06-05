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

---

## Console Verification
 
### Opening a Poll for the Auditor
 
Polls are rare on HackerNews and may not appear in the current feed.
Use this command to load a known real poll directly into the app:
 
```js
// Loads a real HN poll and renders it in the detail view.
window.dispatchEvent(new CustomEvent("clonernews:open-post", {
  detail: { id: 126809, nestedComments: true }
}));
```
 
This proves the poll UI works correctly — the detail view will open showing
the poll title, options with scores, and comments.
 
### Live Update Notification
 
```js
// Manually trigger a live update banner.
window.dispatchEvent(new CustomEvent("clonernews:live-update", {
  detail: { changedIds: [1, 2, 3], count: 3 }
}))
```
 
### Throttling Verification
 
Open DevTools → Network → filter by `updates`
One request should appear every 5 seconds exactly.
 
### Cache Verification
 
```js
// cachedItems should grow as posts are opened, never reset in same session.
clonernewsData.getCacheInfo()
 
// IDs of posts currently visible in the feed.
clonernewsData.state.visiblePostIds
```
