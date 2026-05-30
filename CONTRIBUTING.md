# Contributing Guide

This project is developed by three contributors working in parallel.
The goal of this guide is to keep the workflow clean, simple and easy to audit.

---

## Branching

- Create a branch `dev` where everyone uploads their changes.
- On branch `main` we will have the final merge once all tasks regarding the code are completed.

---

## Keeping Commits Up to Date
 
Before starting work each session and before opening a pull request, sync your branch with the latest `dev`:
 
```bash
git checkout dev
git pull origin dev
```

---

## Commits

- Use **conventional commits** to keep commit history readable and consistent.
- Each commit message must start with a type, followed by a short description.
- Commit messages should be:
  - short,
  - self-explanatory and
  - focused.
- Conventional Commits Basic Dictionary:
  - `feat: a new feature`  
    feat(<filename>): add live update polling

  - `fix: a bug fix`  
    fix(<filename>): correct comment sort order

  - `refactor: code restructuring without changing behavior`  
    refactor(<filename>): simplify batch fetch logic

  - `docs: documentation changes`  
    docs(<filename>): update README with setup steps

  - `test: adding or updating tests`  
    test(<filename>): add edge case for empty comments

  - `style: formatting only (no logic changes)`  
    style(<filename>): format indentation in feed.js

  - `chore: maintenance tasks`  
    chore(<filename>): update .gitignore

---

## Code Style

- Keep functions minimal, beginner friendly and focused.
- Prefer clear, readable code over complex one.
- Use comments for logic flow or/and navigation.
- Allowed language is JavaScript.
- No external libraries required.

---

## Testing

- This project is a browser‑based UI, so no automated unit tests are required.
- Manual testing must follow the audit requirements:
  - story, job and poll posts open without errors
  - posts are ordered newest to oldest
  - load more works without spamming the API
  - comments display in correct order with correct parent
  - live update notification fires correctly
  - throttling limits requests to every 5 seconds

---

## Project Structure

Keep the project simple, organized and easy to navigate:

```
clonernews/
├── audit/
├── docs/
├── index.html
├── style.css
├── js/
│   ├── api.js          # All fetch logic, caching, request management
│   ├── state.js        # Single source of truth for UI state
│   ├── feed.js         # Renders the post list, handles pagination
│   ├── post.js         # Renders a single open post + its comments
│   ├── comments.js     # Recursive comment tree rendering
│   ├── live.js         # The 5-second polling and notification logic
│   ├── utils.js        # Throttle, debounce, time formatting helpers
│   └── main.js         # Entry point, wires everything together
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## Communication

Use direct messages on Discord/schedule calls or campus meetings for any questions, discussions or updates related to the project.

---

**_Let's learn new things and improve as a team!_**
