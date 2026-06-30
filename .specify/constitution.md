# Project Constitution: MyDocVault

This document outlines the core technical rules, constraints, and quality standards for MyDocVault.

## 1. Principles
- **Offline-First & Local-First**: All core document processing, SQLite storage, and local AI (Ollama) integrations must run on device. No cloud dependencies.
- **Privacy by Design**: Raw document bytes must not be persisted to disk. Only extracted metadata and summary details can be stored.
- **Cross-Platform Portability**: All build tools, scripts, and helper modules must run seamlessly on both Linux and Windows.

## 2. Technical Stack & Architecture
- **Language**: JavaScript (Node.js runtime >= 18).
- **Static Assets**: Plain HTML5, CSS3, vanilla JS.
- **AI Core**: Ollama local inference wrapper (gemma4, llama3.2-vision).
- **Database**: better-sqlite3 synchronous, file-based SQLite database.
- **PWA**: manifest.json and Service Worker (sw.js) for offline client shell access.

## 3. Quality Standards
- **Zero Errors**: Linter (ESLint) and static type checker (tsc compiler) must pass with zero errors.
- **Code Coverage**: Tests (Jest) must meet the configured coverage threshold (fail-under 80% coverage).
- **Conventional Commits**: Git commits must conform to the semantic Conventional Commits specification.
- **Secrets Management**: Absolutely no hardcoded API keys, tokens, or credentials allowed in code files.
