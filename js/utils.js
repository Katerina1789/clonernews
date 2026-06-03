// Shared constants used by the data layer and UI layer.
export const BATCH_SIZE = 20;
export const LIVE_UPDATE_INTERVAL = 5000;
export const VALID_FEED_TYPES = ["all", "story", "job", "poll"];

// Runs a function at most once during the given delay.
export function throttle(callback, delay = LIVE_UPDATE_INTERVAL) {
  let lastRun = 0;
  let timeoutId = null;

  return function throttledFunction(...args) {
    const now = Date.now();
    const remainingTime = delay - (now - lastRun);

    if (remainingTime <= 0) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastRun = now;
      callback.apply(this, args);
      return;
    }

    if (timeoutId) return;

    timeoutId = setTimeout(() => {
      lastRun = Date.now();
      timeoutId = null;
      callback.apply(this, args);
    }, remainingTime);
  };
}

// Runs a function only after the user stops triggering it.
export function debounce(callback, delay = 300) {
  let timeoutId = null;

  return function debouncedFunction(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

// Converts HackerNews Unix time into readable local time.
export function formatTime(unixTime) {
  if (!unixTime) return "Unknown time";

  const date = new Date(unixTime * 1000);

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Sorts HackerNews items from newest to oldest.
export function sortByNewest(items) {
  return [...items].sort((a, b) => getTime(b) - getTime(a));
}

// Keeps only unique IDs while preserving order.
export function uniqueIds(ids) {
  const seen = new Set();

  return ids.filter((id) => {
    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

// Normalizes unknown/missing item time values.
function getTime(item) {
  return Number(item?.time) || 0;
}

// Checks whether an item can appear as a feed post.
export function isFeedPost(item) {
  if (!item || item.deleted || item.dead) return false;

  return item.type === "story" || item.type === "job" || item.type === "poll";
}

// Checks whether a feed filter name is supported.
export function isValidFeedType(type) {
  return VALID_FEED_TYPES.includes(type);
}
