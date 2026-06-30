# Antigravity AI Customizations: AGENTS.md

This file defines project-specific rules and instructions for Antigravity AI agents working in this repository.

## Rules & Coding Guidelines
1. **Security Policy**:
   - Never commit hardcoded secrets, tokens, or API keys. Always use placeholder files like `.env.example` or read from environment variables.
   - Run the local security scanner `node secret-scan.js` before pushing changes.

2. **Cross-Platform Compatibility**:
   - Do not use platform-specific bash/shell commands (e.g. `find`, `xargs`, `sed`, `grep`, `rm -rf`, `cp -r`) inside pipelines or package tasks. Use cross-platform Node.js modules or scripts instead.
   - Always run verification checks on port `3123` to avoid port conflict blocks.

3. **Commit Convention**:
   - Commits must conform to the semantic Conventional Commits standard (e.g. `feat: ...`, `fix: ...`, `chore: ...`).

4. **Offline first constraints**:
   - Do not introduce external dependencies that require network operations during runtime, except for local integrations (e.g. localhost:11434 for Ollama).
