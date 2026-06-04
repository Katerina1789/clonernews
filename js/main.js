import { startLiveUpdates, stopLiveUpdates } from "./live.js";
import {
  clearChangedVisiblePostIds,
  loadInitialPosts,
  loadMorePosts,
  openPost,
  setVisiblePostIds,
  state,
} from "./state.js";
import { getCacheInfo } from "./api.js";
import { debounce } from "./utils.js";
import {
  initFeed,
  renderPosts,
  setHasMore,
  setLoading,
  showFeedError,
} from "./feed.js";
import {
  hideLiveNotification,
  renderPostDetail,
  showDetailError,
  showLiveNotification,
} from "./post.js";

// Exposes the data layer for console testing — run clonernewsData.getCacheInfo() to verify caching.
window.clonernewsData = {
  state,
  loadInitialPosts,
  loadMorePosts,
  openPost,
  setVisiblePostIds,
  clearChangedVisiblePostIds,
  getCacheInfo,
};

// Returns a contextual empty-state message depending on feed type and load stage.
function getEmptyMessage(type, reset) {
  if (type === "poll") {
    return "No recent polls found. Try Load more to search older posts.";
  }

  return reset
    ? "No recent posts found. Please try again soon."
    : "No new posts found right now.";
}

// Fetches a batch and passes only the new posts to the UI layer.
async function loadAndEmitPosts(type = state.activeType, reset = false) {
  setLoading(true);

  try {
    // Record length before fetch so we can slice only the newly added posts.
    const countBefore = reset ? 0 : state.posts.length;
    const allPosts = reset
      ? await loadInitialPosts(type)
      : await loadMorePosts(type);

    // addPosts in state.js returns the full array — slice to avoid re-rendering existing posts.
    const newPosts = allPosts.slice(countBefore);

    if (state.error) {
      showFeedError(state.error);
      return;
    }

    renderPosts(newPosts, reset, getEmptyMessage(state.activeType, reset));
    setHasMore(state.hasMore[state.activeType]);
  } finally {
    setLoading(false);
  }
}

// Registers all CustomEvent listeners from the UI layer.
function registerUIEvents() {
  // Tab switch — reset feed with the new type.
  window.addEventListener("clonernews:change-type", async (event) => {
    const type = event.detail?.type || "all";
    await loadAndEmitPosts(type, true);
  });

  // Load more — debounced to prevent duplicate requests from fast clicks.
  window.addEventListener(
    "clonernews:load-more",
    debounce(async () => {
      await loadAndEmitPosts(state.activeType, false);
    }, 300),
  );

  // Visible post IDs reported by feed.js for live update intersection checks.
  window.addEventListener("clonernews:visible-posts", (event) => {
    const ids = event.detail?.ids || [];
    setVisiblePostIds(ids);
  });

  // Post card clicked — fetch full details and render the detail view.
  window.addEventListener("clonernews:open-post", async (event) => {
    const id = event.detail?.id;
    const nestedComments = Boolean(event.detail?.nestedComments);

    if (!id) return;

    const details = await openPost(id, { nestedComments });

    if (state.error || !details) {
      showDetailError(state.error);
    } else {
      renderPostDetail(details);
    }
  });

  // Live banner dismissed — clear changed IDs and hide the notification.
  window.addEventListener("clonernews:clear-live-update", () => {
    clearChangedVisiblePostIds();
    hideLiveNotification();
  });
}

// Entry point — wires UI, loads first batch, starts live polling.
async function init() {
  initFeed();
  registerUIEvents();

  await loadAndEmitPosts("all", true);

  // Callback fires whenever live.js detects changed visible posts.
  startLiveUpdates((changedIds) => {
    showLiveNotification(changedIds);
  });
}

window.addEventListener("DOMContentLoaded", init);

// Stop the polling interval cleanly when the tab is closed or refreshed.
window.addEventListener("beforeunload", stopLiveUpdates);
