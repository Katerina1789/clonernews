import { startLiveUpdates } from "./live.js";
import {
  clearChangedVisiblePostIds,
  loadInitialPosts,
  loadMorePosts,
  openPost,
  setVisiblePostIds,
  state,
} from "./state.js";
import { debounce } from "./utils.js";

// Exposes the data layer for teammates who prefer direct function calls.
window.clonernewsData = {
  state,
  loadInitialPosts,
  loadMorePosts,
  openPost,
  setVisiblePostIds,
  clearChangedVisiblePostIds,
};

// Sends data to the UI layer without forcing specific renderer names.
function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// Loads posts and tells the UI layer to render them.
async function loadAndEmitPosts(type = state.activeType, reset = false) {
  emit("clonernews:loading", { isLoading: true });

  const posts = reset ? await loadInitialPosts(type) : await loadMorePosts(type);

  emit("clonernews:posts-loaded", {
    posts,
    activeType: state.activeType,
    hasMore: state.hasMore[state.activeType],
    error: state.error,
  });

  emit("clonernews:loading", { isLoading: false });
}

// Handles UI events sent by Katerina's files.
function registerUIEvents() {
  window.addEventListener("clonernews:change-type", async (event) => {
    const type = event.detail?.type || "all";
    await loadAndEmitPosts(type, true);
  });

  window.addEventListener(
    "clonernews:load-more",
    debounce(async () => {
      await loadAndEmitPosts(state.activeType, false);
    }, 300)
  );

  window.addEventListener("clonernews:visible-posts", (event) => {
    const ids = event.detail?.ids || [];
    setVisiblePostIds(ids);
  });

  window.addEventListener("clonernews:open-post", async (event) => {
    const id = event.detail?.id;
    const nestedComments = Boolean(event.detail?.nestedComments);

    if (!id) return;

    const details = await openPost(id, { nestedComments });

    emit("clonernews:post-loaded", {
      details,
      error: state.error,
    });
  });

  window.addEventListener("clonernews:clear-live-update", () => {
    clearChangedVisiblePostIds();
    emit("clonernews:live-cleared");
  });
}

// Starts the app data flow.
async function init() {
  registerUIEvents();

  await loadAndEmitPosts("all", true);

  startLiveUpdates((changedIds) => {
    emit("clonernews:live-update", {
      changedIds,
      count: changedIds.length,
    });
  });
}

window.addEventListener("DOMContentLoaded", init);
