import { formatTime } from "./utils.js";
import { renderComments } from "./comments.js";
import { closePost } from "./state.js";

// Fires a CustomEvent on window for main.js to handle.
function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// Toggles between the feed list and the post detail panel.
function setView(view) {
  const feedView = document.getElementById("feed-view");
  const detailView = document.getElementById("detail-view");

  if (view === "detail") {
    feedView.hidden = true;
    detailView.hidden = false;
  } else {
    feedView.hidden = false;
    detailView.hidden = true;
  }
}

// Creates a generic DOM element with a class and text content.
function createTextEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

// Creates the back button — clears open post state and returns to feed.
function createBackButton() {
  const button = createTextEl("button", "back-btn", "← Back");
  button.id = "back-btn";
  button.addEventListener("click", () => {
    closePost();
    setView("feed");
  });
  return button;
}

// Validates a URL and returns it only if it uses http or https.
function getSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.href
      : "";
  } catch {
    return "";
  }
}

// Renders the full detail view for a post including meta, body, poll options and comments.
export function renderPostDetail(details) {
  if (!details) return;

  const { post, pollOptions, comments } = details;
  const container = document.getElementById("detail-view");
  if (!container) return;

  const meta = [
    post.type,
    post.by ? `by ${post.by}` : null,
    post.score != null ? `${post.score} pts` : null,
    post.time ? formatTime(post.time) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const article = document.createElement("article");
  article.className = "post-detail";
  article.append(
    createTextEl("h1", "post-detail-title", post.title || "Untitled"),
    createTextEl("p", "post-detail-meta", meta),
  );

  // Show external link for story/job posts or inline text for ask/text posts.
  if (post.url) {
    const safeUrl = getSafeUrl(post.url);
    const link = createTextEl("a", "post-url", safeUrl || post.url);
    if (safeUrl) {
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener";
    }
    article.appendChild(link);
  } else if (post.text) {
    article.appendChild(createTextEl("div", "post-text", post.text));
  }

  // Render poll options with scores if this is a poll post.
  if (pollOptions && pollOptions.length > 0) {
    const list = document.createElement("ul");
    list.className = "poll-options";

    for (const opt of pollOptions) {
      const item = document.createElement("li");
      item.className = "poll-option";
      item.append(
        createTextEl("span", "", opt.text),
        createTextEl("span", "poll-score", `${opt.score} pts`),
      );
      list.appendChild(item);
    }

    article.appendChild(list);
  }

  // Build comments section and hand off rendering to comments.js.
  const commentsSection = document.createElement("section");
  commentsSection.className = "comments-section";
  commentsSection.appendChild(
    createTextEl("h3", "comments-heading", "Comments"),
  );

  const commentsContainer = document.createElement("div");
  commentsContainer.id = "comments-container";
  commentsSection.appendChild(commentsContainer);
  article.appendChild(commentsSection);

  container.replaceChildren(createBackButton(), article);
  renderComments(comments, commentsContainer);

  setView("detail");
}

// Renders a minimal error state in the detail view with a back button.
export function showDetailError(message) {
  const container = document.getElementById("detail-view");
  if (!container) return;

  container.replaceChildren(
    createBackButton(),
    createTextEl("p", "detail-error", message || "Could not load post."),
  );
  setView("detail");
}

// Shows a fixed notification banner when visible posts are updated by live polling.
export function showLiveNotification(changedIds) {
  // Remove any existing banner before showing a new one.
  const existing = document.getElementById("live-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "live-banner";
  banner.className = "live-banner";

  const count = changedIds.length;
  const closeButton = createTextEl("button", "live-banner-close", "x");
  closeButton.id = "live-banner-close";
  banner.append(
    createTextEl("span", "", `${count} post${count > 1 ? "s" : ""} updated`),
    closeButton,
  );

  // Manual dismiss — clears live update state in main.js.
  closeButton.addEventListener("click", () => {
    banner.remove();
    emit("clonernews:clear-live-update");
  });

  document.body.appendChild(banner);

  // Auto-dismiss after 5 seconds if not already closed.
  setTimeout(() => {
    if (banner.isConnected) {
      banner.remove();
      emit("clonernews:clear-live-update");
    }
  }, 5000);
}

// Removes the live banner if still present — called after state is cleared.
export function hideLiveNotification() {
  const banner = document.getElementById("live-banner");
  if (banner) banner.remove();
}
