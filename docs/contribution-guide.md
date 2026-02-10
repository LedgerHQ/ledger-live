# Ledger Live - Contribution Guide

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive

## Overview

Thank you for contributing to Ledger Live! This guide covers the conventions and requirements for submitting code to the repository.

---

## Important Notice

Regarding Ledger Applications (Desktop & Mobile):
- **Bugfixes** are welcome
- **Feature PRs** may be rejected if they don't align with our roadmap or long-term goals

---

## Architecture Requirements

### MVVM Pattern for Apps

**All new features in desktop and mobile apps must follow the MVVM (Model-View-ViewModel) pattern.**

New code should be placed in the `mvvm/` directory:

```
src/mvvm/
├── features/
│   └── FeatureName/
│       ├── __integrations__/       # Integration tests (required)
│       ├── components/             # Feature-specific components
│       ├── screens/                # Screen implementations
│       │   └── ScreenName/
│       │       ├── index.tsx                    # Container
│       │       ├── useScreenNameViewModel.ts   # ViewModel hook
│       │       └── types.ts                     # Type definitions
│       ├── hooks/                  # Feature-specific hooks
│       └── utils/                  # Feature utilities
├── components/                      # Shared MVVM components
├── hooks/                           # Shared hooks
└── utils/                           # Shared utilities
```

### MVVM Component Structure

```typescript
// Container (index.tsx)
export const FeatureContainer = () => {
  const viewModel = useFeatureViewModel();
  return <FeatureView {...viewModel} />;
};

// ViewModel (useFeatureViewModel.ts)
export const useFeatureViewModel = () => {
  const data = useSelector(selectFeatureData);
  const dispatch = useDispatch();
  
  return {
    data,
    onAction: () => dispatch(featureAction()),
  };
};

// View (FeatureView.tsx) - receives all data via props
export const FeatureView = ({ data, onAction }: ViewProps) => {
  return <Button onClick={onAction}>{data.label}</Button>;
};
```

### Key MVVM Principles

| Principle | Description |
|-----------|-------------|
| **Container** | Connects ViewModel to View |
| **ViewModel** | Produces data and handlers, no JSX |
| **View** | Pure presentation, all data via props |
| **No external hooks in View** | View must not call hooks that connect to external systems |

---

## Submission Checklist

Before submitting a pull request:

1. ✅ Fork repository and create branch from `develop`
2. ✅ Follow branch naming conventions (see below)
3. ✅ Complete installation steps
4. ✅ Make your changes following MVVM pattern (for apps)
5. ✅ Add tests (see [Testing Guide](./testing-guide.md))
6. ✅ Wait for translations if needed
7. ✅ Add changelog entry: `pnpm changeset`
8. ✅ Pass linting: `pnpm lint:fix`
9. ✅ Pass type checks: `pnpm typecheck`
10. ✅ Pass tests: `pnpm test`
11. ✅ Clean up branch (atomic commits, squash tiny commits)

---

## Git Conventions

### Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New feature |
| `bugfix/` | Bug fix |
| `support/` | Refactor, tests, CI, improvements |
| `chore/` | Maintenance, tooling |

**Examples:**
```
feat/add-ethereum-staking
bugfix/fix-transaction-signing
support/update-dependencies
```

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Restructure without behavior change
- `test` - Add/update tests
- `chore` - Maintenance, tooling
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Examples:**
```
feat(desktop): add dark mode toggle
fix(mobile): resolve transaction signing issue
docs(common): update API documentation
refactor(account): simplify account syncing logic
test(coin): add bitcoin integration tests
```

**Validation:**
```bash
# Interactive commit prompt
pnpm commit

# Validate commits on branch
pnpm commitlint --from develop
```

### Changelogs

We use [changesets](https://github.com/changesets/changesets) for versioning.

```bash
# Add a changeset
pnpm changeset

# Follow prompts to select:
# - Affected packages
# - Bump type (patch/minor/major)
# - Description
```

### Rebase vs Merge

| Scenario | Strategy |
|----------|----------|
| Small bugfix branches | **Rebase** on develop |
| Feature branches with merge commits | **Merge** develop into branch |
| Branches waiting for translations | **Do not rebase** |

---

## Pull Request Guidelines

### Description

- Fill in the PR template completely
- Explain what the PR does and why
- Add screenshots/videos if relevant
- _(Ledger employees)_ Link JIRA issue

### Requirements

- ✅ Pass all required CI checks
- ✅ Include changelog (`pnpm changeset`)
- ✅ Include tests for new code
- ✅ Follow MVVM pattern for app features
- ✅ Follow coding standards

---

## Code Style

### TypeScript

- Use **function components** with typed props
- Prefer **named exports** over default exports
- Use **interfaces** for object types
- Avoid `any`, use `unknown` when necessary
- Use **Zod** for runtime validation

### Imports

Order:
1. External libraries
2. Internal modules
3. Types

```typescript
import React from "react";
import { useDispatch } from "react-redux";

import { MyComponent } from "~/components";
import { useFeature } from "~/hooks";

import type { FeatureProps } from "./types";
```

### Testing

Follow the [Testing Guide](./testing-guide.md):

- **Coin modules:** 100% unit coverage + integration tests
- **Apps:** Component unit tests + feature integration tests
- **Libraries:** 100% unit coverage

---

## Translations

We use **Smartling** for translation management.

**Only edit English translation files:**

| App | File |
|-----|------|
| Desktop | `apps/ledger-live-desktop/static/i18n/en/app.json` |
| Mobile | `apps/ledger-live-mobile/src/locales/en/common.json` |

---

## Resources

- [Developer Portal](https://developers.ledger.com/)
- [Wiki](https://github.com/LedgerHQ/ledger-live/wiki)
- [Changesets Guide](https://github.com/LedgerHQ/ledger-live/wiki/Changesets)
- [Testing Guide](./testing-guide.md)
- [Architecture - Desktop](./architecture-desktop.md)
- [Architecture - Mobile](./architecture-mobile.md)
- [Architecture - Libraries](./architecture-libraries.md)
