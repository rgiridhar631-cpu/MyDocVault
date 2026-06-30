# Changelog

All notable changes to MyDocVault will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-30

### Added

- Full PWA (Progressive Web App) offline caching support (`manifest.json` & `sw.js`).
- PWA icons (`icon-192.png`, `icon-512.png`).
- Render hosting deployment blueprint configuration (`render.yaml`).
- Automated GitLab environment registration variables in CI config.
- Project `CONTRIBUTING.md` and `CHANGELOG.md` files.
- ESLint and Prettier rules configuration for code standards.
- Type-checking for JavaScript files using `jsconfig.json` and TypeScript engine (`tsc`).
- Pre-commit hook configuration (`.pre-commit-config.yaml`).
- Semantic commit verification script (`check-commits.js`).
- Secrets and hardcoded API key scanner script (`secret-scan.js`).

### Fixed

- Stabilized GitLab CI/CD pipeline using cross-platform Node.js utility tasks.
- Resolved server zombie processes and socket port blocks (`EADDRINUSE`) in test stages using clean process SIGTERM/SIGKILL termination.

## [1.0.0] - 2026-06-28

### Added

- Initial project release with offline document ingestion.
- Local SQLite database layer to store metadata.
- Chatbot page referencing local Ollama instances.
- Gov services checklists.
