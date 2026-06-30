# Contributing to MyDocVault

Thank you for your interest in contributing to MyDocVault! This document outlines the guidelines and standards for contributing to the project.

## Code of Conduct

Please be respectful and professional in all communications and code submissions.

## Semantic Commit Messages

We follow the **Conventional Commits** specification. Commit messages must be formatted as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Common types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting changes
- `refactor`: Code restructuring without functional changes
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks, package updates, CI/CD configuration

Example:
`feat(auth): add local sqlite session token store`

## Development Process

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up pre-commit hooks:
   ```bash
   pre-commit install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
5. Implement changes, ensuring they pass formatting, linting, and type-checks.
6. Commit using semantic commit messages.
7. Open a Merge Request against the `main` branch.

## Linting, Formatting, and Type Checking

Before committing, make sure the following checks pass locally:

- **Formatting**: `npm run format:check`
- **Linting**: `npm run lint`
- **Type Checking**: `npm run type-check`
