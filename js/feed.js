import { formatTime } from "./utils.js";

// Fires a CustomEvent on window for main.js to handle.
function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// Creates a generic DOM element with a class and text content.
function createTextEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

// Builds a clickable post card element for the feed list.
function createPostCard(post) {
  const card = document.createElement("article");
  card.className = `post-card post-type-${post.type}`;
  card.dataset.id = post.id;
  card.tabIndex = 0;

  const meta = [
    post.by ? `by ${post.by}` : null,
    post.score != null ? `${post.score} pts` : null,
    post.time ? formatTime(post.time) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  card.append(
    createTextEl("span", "post-type-badge", post.type),
    createTextEl("h2", "post-title", post.title || "Untitled"),
    createTextEl("p", "post-meta", meta),
  );

  // Jobs have no descendants field on the HN API — only show when present.
  if (post.descendants != null) {
    card.appendChild(
      createTextEl("span", "post-comments", `${post.descendants} comments`),
    );
  }

  // Open post detail on click or keyboard activation.
  card.addEventListener("click", () => {
    emit("clonernews:open-post", { id: post.id, nestedComments: true });
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      emit("clonernews:open-post", { id: post.id, nestedComments: true });
    }
  });

  return card;
}

// Shows a placeholder message when a batch returns no posts.
function showEmptyFeed(feed, message = "No posts found for this filter.") {
  const existing = feed.querySelector(".feed-empty");
  if (existing) existing.remove();

  feed.appendChild(createTextEl("p", "feed-empty", message));
}

// Renders a batch of posts — clears the feed first if reset is true.
export function renderPosts(posts, reset = false, emptyMessage) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  // Clear existing posts on tab switch, append on load more.
  if (reset) feed.innerHTML = "";

  if (posts.length === 0) {
    showEmptyFeed(feed, emptyMessage);
    if (reset) emit("clonernews:visible-posts", { ids: [] });
    return;
  }

  // Remove empty placeholder if new posts are arriving.
  const empty = feed.querySelector(".feed-empty");
  if (empty) empty.remove();

  const fragment = document.createDocumentFragment();
  for (const post of posts) {
    fragment.appendChild(createPostCard(post));
  }

  feed.appendChild(fragment);

  // Report all visible post IDs to main.js for live update tracking.
  const visibleIds = [...feed.querySelectorAll(".post-card")].map((el) =>
    Number(el.dataset.id),
  );
  emit("clonernews:visible-posts", { ids: visibleIds });
}

// Shows or hides the loading spinner.
export function setLoading(isLoading) {
  const spinner = document.getElementById("spinner");
  if (spinner) spinner.hidden = !isLoading;
}

// Shows or hides the load-more button based on remaining posts.
export function setHasMore(hasMore) {
  const btn = document.getElementById("load-more-btn");
  if (btn) btn.hidden = !hasMore;
}

// Appends an error message to the feed container.
export function showFeedError(message) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.appendChild(
    createTextEl(
      "p",
      "feed-error",
      message || "Something went wrong. Please try again.",
    ),
  );
}

// Wires tab buttons and load-more button to their CustomEvents.
export function initFeed() {
  // Tab click — mark active and emit type change to main.js.
  document.querySelectorAll("[data-feed-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-feed-type]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const type = btn.dataset.feedType;
      emit("clonernews:change-type", { type });
    });
  });

  // Load more button — debounced in main.js to prevent duplicate requests.
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      emit("clonernews:load-more");
    });
  }
}
