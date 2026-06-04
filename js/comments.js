import { formatTime } from "./utils.js";

// Creates a generic DOM element with a class and text content.
function createTextEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

// Builds a single comment element with meta, optional parent label and body.
function createCommentEl(comment) {
  const el = document.createElement("div");
  el.className = `comment ${comment.isRemoved ? "comment-removed" : ""}`;
  el.dataset.level = comment.level;

  // Cap indent at level 8 to prevent extreme nesting from breaking layout.
  el.style.setProperty("--comment-level", Math.min(comment.level || 0, 8));

  const meta = [
    comment.by ? `${comment.by}` : "unknown",
    comment.time ? formatTime(comment.time) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  el.appendChild(createTextEl("p", "comment-meta", meta));

  // Only show parent post label on top-level comments to avoid repetition in nested threads.
  if (comment.level === 0 && comment.rootPostTitle) {
    el.appendChild(
      createTextEl("p", "comment-parent", `on: ${comment.rootPostTitle}`),
    );
  }

  el.appendChild(createTextEl("div", "comment-body", comment.text || ""));

  return el;
}

// Recursively renders a comment and its children into the container.
function renderCommentTree(comment, container) {
  container.appendChild(createCommentEl(comment));

  // Recurse into children if nested comments are present (bonus feature).
  if (Array.isArray(comment.children) && comment.children.length > 0) {
    for (const child of comment.children) {
      renderCommentTree(child, container);
    }
  }
}

// Renders the full comment list for an open post.
export function renderComments(comments, container) {
  if (!container) return;

  container.replaceChildren();

  if (!comments || comments.length === 0) {
    container.appendChild(createTextEl("p", "no-comments", "No comments yet."));
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "comments-list";

  // Each top-level comment may recursively contain sub-comments.
  for (const comment of comments) {
    renderCommentTree(comment, wrapper);
  }

  container.appendChild(wrapper);
}
