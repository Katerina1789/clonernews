import { BATCH_SIZE, isFeedPost, sortByNewest, uniqueIds } from "./utils.js";

export const API_BASE_URL = "https://hacker-news.firebaseio.com/v0";

const idListCache = new Map();
const itemCache = new Map();

const LIST_ENDPOINTS = {
  story: "newstories",
  job: "jobstories",
};

const MAX_DISCOVERY_ROUNDS = 5;

// Fetches JSON and throws a readable error when the request fails.
async function fetchJSON(endpoint) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}.json`);

  if (!response.ok) {
    throw new Error(`HackerNews request failed: ${response.status} ${endpoint}`);
  }

  return response.json();
}

// Gets the newest known HackerNews item ID.
export async function getMaxItemId() {
  return fetchJSON("maxitem");
}

// Gets changed item IDs for live updates.
export async function getUpdates() {
  const updates = await fetchJSON("updates");

  return {
    items: Array.isArray(updates.items) ? updates.items : [],
    profiles: Array.isArray(updates.profiles) ? updates.profiles : [],
  };
}

// Gets ID lists that HackerNews exposes directly.
export async function getIdList(type) {
  const endpoint = LIST_ENDPOINTS[type];

  if (!endpoint) {
    throw new Error(`No direct ID list exists for type: ${type}`);
  }

  if (idListCache.has(type)) {
    return idListCache.get(type);
  }

  const ids = await fetchJSON(endpoint);
  const cleanIds = Array.isArray(ids) ? uniqueIds(ids) : [];

  idListCache.set(type, cleanIds);
  return cleanIds;
}

// Fetches one item and caches the request immediately to avoid duplicate fetches.
export async function getItem(id) {
  if (!id) return null;

  if (itemCache.has(id)) {
    return itemCache.get(id);
  }

  const request = fetchJSON(`item/${id}`).catch((error) => {
    itemCache.delete(id);
    console.error(error);
    return null;
  });

  itemCache.set(id, request);

  const item = await request;
  itemCache.set(id, item);

  return item;
}

// Fetches several items in parallel while reusing the item cache.
export async function getItems(ids) {
  const cleanIds = uniqueIds(ids).filter(Boolean);
  const items = await Promise.all(cleanIds.map((id) => getItem(id)));

  return items.filter(Boolean);
}

// Loads a story/job batch from the official ID list endpoints.
async function getListPostBatch(type, cursor = 0, batchSize = BATCH_SIZE) {
  const ids = await getIdList(type);
  const batchIds = ids.slice(cursor, cursor + batchSize);
  const items = await getItems(batchIds);

  return {
    posts: sortByNewest(items.filter((item) => isFeedPost(item) && item.type === type)),
    nextCursor: cursor + batchSize,
    hasMore: cursor + batchSize < ids.length,
  };
}

// Discovers polls and mixed feed posts by walking backward from maxitem.
async function getDiscoveredPostBatch(type, cursor = null, batchSize = BATCH_SIZE) {
  let currentId = cursor || (await getMaxItemId());
  const posts = [];
  let rounds = 0;

  while (posts.length < batchSize && currentId > 0 && rounds < MAX_DISCOVERY_ROUNDS) {
    const ids = [];

    for (let i = 0; i < batchSize && currentId > 0; i++) {
      ids.push(currentId);
      currentId--;
    }

    const items = await getItems(ids);
    const matchingPosts = items.filter((item) => {
      if (!isFeedPost(item)) return false;
      if (type === "all") return true;

      return item.type === type;
    });

    posts.push(...matchingPosts);
    rounds++;
  }

  return {
    posts: sortByNewest(posts).slice(0, batchSize),
    nextCursor: currentId,
    hasMore: currentId > 0,
  };
}

// Public batch loader used by state.js.
export async function getPostBatch(type = "all", cursor = null, batchSize = BATCH_SIZE) {
  if (type === "story" || type === "job") {
    return getListPostBatch(type, cursor || 0, batchSize);
  }

  if (type === "poll" || type === "all") {
    return getDiscoveredPostBatch(type, cursor, batchSize);
  }

  throw new Error(`Unsupported feed type: ${type}`);
}

// Gets poll options for a poll item.
export async function getPollOptions(pollOrId) {
  const poll = typeof pollOrId === "object" ? pollOrId : await getItem(pollOrId);

  if (!poll || poll.type !== "poll" || !Array.isArray(poll.parts)) {
    return [];
  }

  const options = await getItems(poll.parts);

  return options
    .filter((option) => option && option.type === "pollopt")
    .map((option) => ({
      id: option.id,
      type: option.type,
      text: option.text || "Untitled option",
      score: option.score || 0,
      pollId: poll.id,
    }));
}

// Gets the root post for a comment, even when the parent is another comment.
export async function getRootPostForComment(commentOrId) {
  let current = typeof commentOrId === "object" ? commentOrId : await getItem(commentOrId);

  while (current && current.parent) {
    const parent = await getItem(current.parent);

    if (!parent) return null;
    if (isFeedPost(parent)) return parent;

    current = parent;
  }

  return null;
}

// Creates a safe comment object for the UI layer.
function normalizeComment(comment, rootPost, level = 0) {
  const isRemoved = !comment || comment.deleted || comment.dead;

  return {
    id: comment?.id || null,
    type: "comment",
    by: isRemoved ? "unknown" : comment.by || "unknown",
    time: comment?.time || 0,
    text: isRemoved ? "[removed]" : comment.text || "",
    parent: comment?.parent || null,
    kids: Array.isArray(comment?.kids) ? comment.kids : [],
    level,
    isRemoved,
    rootPostId: rootPost?.id || null,
    rootPostTitle: rootPost?.title || "Unknown parent post",
  };
}

// Fetches comments for a post. Nested mode is available for the bonus task.
export async function getCommentsForPost(postOrId, options = {}) {
  const { nested = false, level = 0, rootPost = null } = options;
  const post = typeof postOrId === "object" ? postOrId : await getItem(postOrId);
  const commentRootPost = rootPost || post;

  if (!post || !Array.isArray(post.kids) || post.kids.length === 0) {
    return [];
  }

  const comments = await getItems(post.kids);
  const normalizedComments = sortByNewest(comments).map((comment) =>
    normalizeComment(comment, commentRootPost, level)
  );

  if (!nested) {
    return normalizedComments;
  }

  return Promise.all(
    normalizedComments.map(async (comment) => ({
      ...comment,
      children: await getCommentsForPost(comment, {
        nested: true,
        level: level + 1,
        rootPost: commentRootPost,
      }),
    }))
  );
}

// Gets everything needed for a post detail screen.
export async function getPostDetails(id, options = {}) {
  const { includeComments = true, nestedComments = false } = options;
  const post = await getItem(id);

  if (!post) {
    throw new Error(`Post not found: ${id}`);
  }

  const [pollOptions, comments] = await Promise.all([
    post.type === "poll" ? getPollOptions(post) : Promise.resolve([]),
    includeComments ? getCommentsForPost(post, { nested: nestedComments }) : Promise.resolve([]),
  ]);

  return {
    post,
    pollOptions,
    comments,
  };
}

// Helps during manual testing to prove cached items are not re-fetched.
export function getCacheInfo() {
  return {
    cachedItems: itemCache.size,
    cachedLists: [...idListCache.keys()],
  };
}
