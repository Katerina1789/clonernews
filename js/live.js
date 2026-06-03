import { getUpdates } from "./api.js";
import {
  clearChangedVisiblePostIds,
  getVisiblePostIds,
  setChangedVisiblePostIds,
  state,
} from "./state.js";
import { LIVE_UPDATE_INTERVAL, throttle } from "./utils.js";

let intervalId = null;
let isPolling = false;

// Checks /updates.json and returns visible posts that changed.
export async function checkLiveUpdates() {
  if (isPolling) return [];

  isPolling = true;

  try {
    const updates = await getUpdates();
    const visibleIds = new Set(getVisiblePostIds());

    const changedVisibleIds = updates.items.filter((id) => visibleIds.has(id));

    if (changedVisibleIds.length > 0) {
      return setChangedVisiblePostIds(changedVisibleIds);
    }

    clearChangedVisiblePostIds();
    return [];
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    return [];
  } finally {
    isPolling = false;
  }
}

// Starts the required 5-second live update loop.
export function startLiveUpdates(onUpdate, interval = LIVE_UPDATE_INTERVAL) {
  stopLiveUpdates();

  const throttledPoll = throttle(async () => {
    const changedIds = await checkLiveUpdates();

    if (changedIds.length > 0 && typeof onUpdate === "function") {
      onUpdate(changedIds);
    }
  }, interval);

  intervalId = setInterval(throttledPoll, interval);

  return stopLiveUpdates;
}

// Stops live polling when the app is closed or reset.
export function stopLiveUpdates() {
  if (!intervalId) return;

  clearInterval(intervalId);
  intervalId = null;
}
