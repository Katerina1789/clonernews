import { getPostBatch, getPostDetails } from "./api.js";
import { BATCH_SIZE, isValidFeedType, sortByNewest } from "./utils.js";

export const state = {
  activeType: "all",
  posts: [],
  postsById: new Map(),
  visiblePostIds: new Set(),
  changedVisiblePostIds: new Set(),
  openedPost: null,
  openedPostDetails: null,
  cursors: {
    all: null,
    story: 0,
    job: 0,
    poll: null,
  },
  hasMore: {
    all: true,
    story: true,
    job: true,
    poll: true,
  },
  isLoading: false,
  error: null,
};

// Saves an error without crashing the whole app.
export function setError(error) {
  state.error = error instanceof Error ? error.message : String(error);
}

// Changes the selected feed tab/filter.
export function setActiveType(type) {
  if (!isValidFeedType(type)) {
    throw new Error(`Invalid feed type: ${type}`);
  }

  state.activeType = type;
}

// Clears the loaded posts for the selected type.
export function resetFeed(type = state.activeType) {
  if (!isValidFeedType(type)) {
    throw new Error(`Invalid feed type: ${type}`);
  }

  state.posts = [];
  state.postsById.clear();
  state.visiblePostIds.clear();
  state.changedVisiblePostIds.clear();
  state.cursors[type] = type === "story" || type === "job" ? 0 : null;
  state.hasMore[type] = true;
}

// Adds new posts without duplicating already-loaded posts.
export function addPosts(posts) {
  for (const post of posts) {
    if (!post || state.postsById.has(post.id)) continue;

    state.postsById.set(post.id, post);
    state.posts.push(post);
  }

  state.posts = sortByNewest(state.posts);
  return state.posts;
}

// Loads the next batch for the active feed type.
export async function loadMorePosts(type = state.activeType, batchSize = BATCH_SIZE) {
  if (state.isLoading || !state.hasMore[type]) {
    return [];
  }

  state.isLoading = true;
  state.error = null;

  try {
    const result = await getPostBatch(type, state.cursors[type], batchSize);

    state.cursors[type] = result.nextCursor;
    state.hasMore[type] = result.hasMore;

    return addPosts(result.posts);
  } catch (error) {
    setError(error);
    return [];
  } finally {
    state.isLoading = false;
  }
}

// Starts a fresh feed load after changing tabs/filters.
export async function loadInitialPosts(type = "all") {
  setActiveType(type);
  resetFeed(type);

  return loadMorePosts(type);
}

// Tracks which posts are currently visible in the UI.
export function setVisiblePostIds(ids) {
  state.visiblePostIds = new Set(ids.map(Number).filter(Boolean));
}

// Returns visible IDs as an array for easier comparison/debugging.
export function getVisiblePostIds() {
  return [...state.visiblePostIds];
}

// Marks visible posts that appeared in /updates.json.
export function setChangedVisiblePostIds(ids) {
  state.changedVisiblePostIds = new Set(ids.map(Number).filter(Boolean));

  return [...state.changedVisiblePostIds];
}

// Clears the live update notification state.
export function clearChangedVisiblePostIds() {
  state.changedVisiblePostIds.clear();
}

// Loads the selected post with comments and poll options.
export async function openPost(id, options = {}) {
  state.error = null;

  try {
    state.openedPostDetails = await getPostDetails(id, options);
    state.openedPost = state.openedPostDetails.post;

    return state.openedPostDetails;
  } catch (error) {
    setError(error);
    return null;
  }
}

// Closes the post detail view in central state.
export function closePost() {
  state.openedPost = null;
  state.openedPostDetails = null;
}
