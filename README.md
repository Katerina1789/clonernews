# ClonerNews

[![JavaScript](https://img.shields.io/badge/JavaScript-Code-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-FF0000?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Zone01](https://img.shields.io/badge/Zone01-Athens-1E00FF?style=for-the-badge&logo=codeforces&logoColor=white)](https://zone01.gr)

A minimal vanilla JavaScript client for the [HackerNews API](https://github.com/HackerNews/API) built as part of the Zone01 Athens curriculum.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Repository Structure](#repository-structure)
- [How to Run](#how-to-run)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

## Description

`ClonerNews` fetches stories, jobs and polls from the HackerNews public API and presents them in a clean, responsive feed with live update notifications, lazy batch loading and nested comment threads.

## Features

- Stories, jobs and polls feed with tab filtering
- Batch loading of 20 posts at a time - no all-at-once fetching
- Post detail view with comments ordered newest to oldest
- Nested sub-comments to any depth
- Live update notifications every 5 seconds
- In-memory item cache - no duplicate API requests
- Throttle and debounce on all request triggers
- No frameworks, no dependencies, no build step

## Repository Structure

```text
clonernews/
├── audit/
│   └── audit_guide.md
├── docs/
│   ├── PRD.md
│   └── architecture.md
├── js/
│   ├── api.js        // fetch logic + cache
│   ├── state.js      // central app state
│   ├── live.js       // 5-second update polling
│   ├── utils.js      // throttle, debounce, helpers
│   ├── main.js       // entry point + event wiring
│   ├── feed.js       // post list rendering
│   ├── post.js       // post detail + notifications
│   └── comments.js   // comment tree rendering
├── .gitignore
├── package.json
├── CONTRIBUTING.md
├── index.html
├── LICENSE
├── README.md
└── style.css
```

## How to Run

No install needed. Serve with a static server to support ES modules:

```bash
npx http-server . -c-1
# open http://localhost:8080
```

> Use `npx http-server` instead of Live Server - the `-c-1` flag disables caching so ES module changes are always picked up fresh.

## Testing

No automated tests — manual testing follows the audit checklist.

Full checklist in [`audit/audit_guide.md`](audit/audit_guide.md).

## Documentation

- [`PRD`](docs/PRD.md) - project requirements and task split
- [`Architecture`](docs/architecture.md) - system overview and data flow
- [`Audit Guide`](audit/audit_guide.md) - manual test checklist

## Team

- Katerina Kasdanastasi
- Panagiotis Valadakis
- Kyriakos Lamprianidis

## License

[MIT License](./LICENSE)
