# Smart Gitmoji Commit

Analyze staged changes and create a commit with the appropriate gitmoji, type, scope, and message.

## Instructions

### Step 1: Gather context

Run these commands in parallel:

```bash
git diff --cached --stat
```

```bash
git diff --cached
```

```bash
git status --short
```

If nothing is staged (`git diff --cached` is empty), tell the user:
> "No staged changes detected. Run `git add` first, then re-run this command."
and stop.

### Step 2: Analyze the diff

From the staged diff, analyze **every changed file** and determine:

1. **What categories of files changed** (count each):
   - Source code (features, logic, components)
   - Test files (`*.test.*`, `*.spec.*`, `__tests__/`)
   - Documentation (`*.md`, `docs/`, comments-only changes)
   - Configuration (`.config.*`, `.*rc`, `package.json` scripts/deps, CI workflows)
   - Styles / UI (`*.css`, `*.scss`, style files, UI component styling)
   - Type definitions (`*.d.ts`, types-only changes, interfaces)
   - Dependencies (`package.json` deps, `pnpm-lock.yaml`)
   - Assets (images, fonts, icons)
   - Translations / i18n (`locales/`, `i18n/`)

2. **What is the nature of the change** (look at the actual diff content):
   - New code added (new functions, components, modules, exports)
   - Code deleted/removed
   - Code modified/restructured without behavior change
   - Bug fix patterns (error handling, null checks, condition fixes, edge cases)
   - Performance patterns (memoization, caching, lazy loading, optimization)
   - Security patterns (auth, sanitization, encryption, permissions)

3. **What scope is impacted** (based on file paths):
   - `apps/ledger-live-desktop/` → `desktop`
   - `apps/ledger-live-mobile/` → `mobile`
   - `libs/ledger-live-common/` → `common`
   - `libs/coin-modules/` or `libs/coin-*` → `coin`
   - `libs/ledgerjs/` → `ledgerjs`
   - `libs/ui/` → `ui`
   - `tools/` or `.github/` → `tooling`
   - Multiple scopes → pick the dominant one, or combine as `desktop, mobile`

### Step 3: Select the best gitmoji

1. **Fetch the full gitmoji list** by running:

```bash
curl -s https://raw.githubusercontent.com/carloscuesta/gitmoji/master/packages/gitmojis/src/gitmojis.json
```

   Each entry has: `emoji`, `code`, `description`, `semver`. Use this as the reference for all available gitmojis.

2. **Match the diff analysis to the most semantically appropriate gitmoji** from the fetched list.

3. **Use these priority rules** when multiple gitmojis could apply (check in order):

| Priority | Condition | Gitmoji | Type |
|----------|-----------|---------|------|
| 1 | Breaking public API / behavior change | `:boom:` | `feat` |
| 2 | Security / auth / privacy fix | `:lock:` | `fix` |
| 3 | Critical hotfix | `:ambulance:` | `fix` |
| 4 | New feature (>60% of diff is new code) | `:sparkles:` | `feat` |
| 5 | Bug fix | `:bug:` | `fix` |
| 6 | Tests >60% of diff | `:white_check_mark:` | `test` |
| 7 | Performance optimization | `:zap:` | `perf` |
| 8 | Documentation only | `:memo:` | `docs` |
| 9 | Refactor (no behavior change) | `:recycle:` | `refactor` |
| 10 | Everything else | Look up best match from fetched gitmoji list | `chore` |

4. **Map the gitmoji to a conventional type** using its `description` and `semver`:
   - `semver: "major"` → `feat` (breaking)
   - `semver: "minor"` → `feat`
   - `semver: "patch"` → `fix` or `chore` depending on description
   - `semver: null` → `chore`, `refactor`, `style`, `docs`, `test`, or `ci` depending on description

### Step 4: Generate the commit message

Format:
```
:gitmoji: type(scope): description
```

Rules for the description:
- Imperative mood, lowercase, no period at the end
- Be specific about **what** changed, not just **where**
- Max 72 characters for the full message
- Examples of good descriptions:
  - `add portfolio analytics dashboard`
  - `fix transaction signing race condition`
  - `extract account sync into dedicated hook`

### Step 5: Present and confirm

Present the analysis to the user in this format:

```
## Analysis

**Files changed**: X files (Y insertions, Z deletions)
**Dominant change**: <category> (XX% of diff)
**Scope**: <detected scope>

## Suggested commit

   :gitmoji: type(scope): description

**Gitmoji**: <emoji> <code> — <reason for selection>
```

Then ask the user using a structured prompt with these options:
- **Commit** — run the commit as suggested
- **Adjust message** — let me change the description
- **Change gitmoji** — pick a different emoji
- **Cancel** — abort

### Step 6: Execute the commit

When the user selects **Commit**, run:

```bash
git commit -m ":gitmoji: type(scope): description"
```

Then verify with:

```bash
git log -1 --oneline
```

Then run commitlint to validate:

```bash
pnpm commitlint --from HEAD~1
```

## Important Rules

- ALWAYS analyze the actual diff content, never guess from file names alone
- If the diff is ambiguous (e.g., 40% feature + 40% test), prefer the **feature** gitmoji and mention tests in the description
- If changes span multiple scopes equally, use the most specific scope or omit scope
- Never use `:tada:` (begin project), `:beers:` (drunk code), or `:poop:` (bad code) — these are not appropriate for this project
- The gitmoji MUST use the shortcode format (`:sparkles:`, not the unicode emoji)
- Always run `git diff --cached` (staged changes), not `git diff` (unstaged)
