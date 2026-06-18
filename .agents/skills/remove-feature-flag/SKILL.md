---
name: remove-feature-flag
description: >-
  Removes always-enabled feature flags in Ledger Wallet, applies code changes,
  and creates a pull request using the create-pr schema. Use when the user
  invokes /remove-feature-flag, wants to delete or clean up a permanently
  enabled feature flag, or eliminate flag-gated code paths.
disable-model-invocation: true
---

# Remove Always-Enabled Feature Flag

Use this skill when a feature flag is permanently enabled in production and no
longer needs remote or local control.

**Default behavior: implement the removal in code.** Do not stop at drafting a
proposal unless the user explicitly asks for a proposal only (e.g. "proposal
only", "draft only", "no code changes").

When the user asks to open a PR (or does not say otherwise after
implementation), **create the pull request** following section 6.

## Invocation

```text
/remove-feature-flag <FEATURE_ID> <FLAG_VALUE_JSON>
```

Optional trailing context on the same line or in a follow-up:

- `ENABLED_BEHAVIOR` — what stays on after removal
- `SCOPE` — impacted apps/packages
- `$TICKET_URL` — JIRA or GitHub issue link
- `proposal only` — skip implementation, output the PR body only
- `no pr` — implement and validate but do not create a pull request

Parse `<FLAG_VALUE_JSON>` as JSON (add quotes if the user omits them).

## Prompt variables

$FEATURE_ID — Canonical camelCase flag id from the invocation.

$FIREBASE_KEY — Remote Config key. Default: `feature_${snakeCase(FEATURE_ID)}`.

$FLAG_VALUE — Current resolved value in all environments (JSON).

$ENABLED_BEHAVIOR — What stays enabled after removal. Infer from code when omitted.

$DISABLED_BEHAVIOR — What the `enabled: false` branch did. Use "N/A" when unknown.

$SCOPE — Impacted apps/packages. Infer from `rg` results when omitted.

$TICKET_URL — Optional JIRA or GitHub issue URL.

## Workflow

### 1. Validate removal is safe

1. Confirm the flag is **always enabled** in prod/staging.
2. Search usages:
   ```bash
   rg -n "$FEATURE_ID" apps libs shared features e2e
   rg -n "$FIREBASE_KEY" apps libs shared features e2e
   ```
3. Map branches: `enabled: true` → keep inline; `enabled: false` → delete.
4. Check for typed `params` — inline only production values.

### 2. Apply code changes

| Area | Action |
|------|--------|
| `@shared/feature-flags` | Delete `src/flags/**/$FEATURE_ID.ts` and barrel export |
| Flag consumers | Remove `useFeature` / `selectFeature` checks; keep enabled path |
| Legacy `types-live` / `defaultFeatures` | Remove if still referenced (grep first) |
| Tests | Delete flag mocks/overrides; update snapshots and integration tests |
| E2E | Remove hardcoded flag overrides in Detox/Playwright setup |
| Dev tools | Remove from debug feature-flag UI if listed explicitly |
| A/B or multi-variant experiment | Apply section 2b after inlining enabled path |

Add a changeset when published packages change (`.agents/skills/create-changeset/SKILL.md`).

### 2b. Post-removal cleanup (mandatory when flag gated experiments or variants)

After inlining the **enabled** path, remove leftover experiment structure.
Do not stop at deleting the flag — dead branches and A/B naming are part of the removal.

#### A. Delete dead branches first

| Pattern | Action |
|---------|--------|
| `enabled: false` UI / flows | Delete files and imports |
| Alternate `params.variant` paths (e.g. variant B) | Delete screens, hooks, components, tests |
| Legacy fallback when flag was off (e.g. old settings row) | Delete; keep only the enabled-path UI |
| Flag mocks / overrides in tests | Remove; assert production behavior directly |
| Unused i18n keys for removed variants | Delete (e.g. `variantB` translation blocks) |

Search for leftovers:

```bash
rg -n "VariantB|variantB|useVariant|getVariant|isVariant" apps libs shared
rg -n "$FEATURE_ID" apps libs shared
```

#### B. Remove experiment naming (no more "variantA")

If the flag controlled an A/B test and only one path remains, **do not rename
`VariantA` to `VariantX`**. Flatten to domain language:

| Before (experiment) | After (production) |
|---------------------|-------------------|
| `screens/VariantA/` | `screens/Main/` + `screens/ManagePreferences/` (or equivalent step folders) |
| `VariantA` component | `<Feature>Steps` (e.g. `AnalyticsOptInPromptSteps`) |
| `useVariantA` | `use<Feature>Steps` (e.g. `useAnalyticsOptInPromptSteps`) |
| `steps.variantA.*` | `steps.main` / `steps.preferences` (match real step names) |
| i18n `feature.variantA.*` | `feature.main.*` / `feature.preferences.*` (+ keep existing `*.common.*`) |

**Keep** a step router (`step === 0 ? … : …`) when the flow is a multi-step wizard —
that is not A/B branching.

#### C. Simplify hooks and props

- Do **not** call the same feature hook twice (e.g. parent + drawer both calling
  `useFeatureLogic` only for one field). Pass shared values (`shouldWeTrack`, etc.)
  via props.
- Remove props that only existed for variant selection (`variant`, `isVariantB`).
- Inline tiny single-purpose files (`variants.ts`, `steps.ts`) when they only hold
  constants left over from the experiment.

#### D. Analytics dimensions vs code names (do not conflate)

- **Code/i18n/folders:** remove `variantA` / `variantB` naming.
- **Segment/event properties** (e.g. `variant: "A"`): keep unchanged unless
  analytics/PM explicitly requests a breaking change — dashboards may depend on
  historical values.

#### E. Follow-up commit (recommended)

Split large renames from the flag deletion when it keeps review readable:

1. `chore(<scope>): remove $FEATURE_ID feature flag (default to true)`
2. `refactor(<scope>): drop experiment naming after $FEATURE_ID removal`

Run the same validation as step 3 after each commit.

### 3. Validate

```bash
pnpm <app> typecheck
pnpm <app> test -- <relevant test paths>
```

See `docs/validate-before-finishing.md`.

### 4. Commit

Read `.agents/skills/git-workflow/SKILL.md` before committing.

- **Branch:** `support/remove-<feature-id>-flag` (kebab-case)
- **Message:** `chore(<scope>): remove $FEATURE_ID feature flag (default to true)`

Commit when the user asks, or when creating a PR (required before push).

### 5. QA focus

Document in the PR what was run:

- `@shared/feature-flags` typecheck + tests when the registry changes
- App tests for screens that used the flag
- Manual smoke only when the flag gated visible UX

`$HAS_UI_CHANGES` is usually **no** — no screenshots section.

### 6. Create pull request (must follow `/create-pr`)

**Mandatory:** Read and follow `.agents/skills/create-pr/SKILL.md` end-to-end for
PR creation. Do **not** use a custom PR format — the PR title, body, checklist,
reviewer section, and git steps must match the `create-pr` schema exactly.

Map flag-removal context into the `create-pr` prompt variables:

| create-pr variable | Value for flag removal |
|--------------------|------------------------|
| `$CHANGE_TYPE` | `chore` |
| `$CHANGE_SCOPE` | Primary impacted scope (e.g. `feature-flags`, `desktop`) |
| `$TEST_COVERAGE` | `yes` if tests were run; `partial` if manual smoke pending |
| `$QA_FOCUS_AREAS` | Bullets: registry, impacted apps/flows, Firebase key cleanup |
| `$HAS_UI_CHANGES` | `no` (unless removal changes visible UX) |
| `$TICKET_URL` | From invocation, or omit Context section if unknown |
| `$TICKET_DESCRIPTION` | Use the flag-removal description below |

**`$TICKET_DESCRIPTION` content** (goes inside the create-pr Description section):

```markdown
**Problem:** The `$FEATURE_ID` feature flag (`$FIREBASE_KEY`) is permanently set to
the value below in all environments and no longer requires remote configuration.
{{PROBLEM_DETAIL}}

**Solution:** Remove the feature flag and any remaining conditional logic,
leaving $ENABLED_BEHAVIOR enabled by default.

**Changes included:**
- Remove `$FEATURE_ID` from the feature flag registry
- Remove conditional checks tied to this flag
- Simplify code to assume the behavior equivalent to `$FLAG_VALUE`
- Clean up related configuration, documentation, and tests

**Resulting behavior:**
- $ENABLED_BEHAVIOR
- No functional change compared to current production behavior

**Current flag value:**

```json
$FLAG_VALUE
```

**Post-release ops:** Delete `$FIREBASE_KEY` from Firebase Remote Config after release.

**Validation run:** {{VALIDATION_COMMANDS}}
```

`{{PROBLEM_DETAIL}}`: note if consumer code was already removed in a prior PR.
`{{VALIDATION_COMMANDS}}`: bullet list of commands actually executed.

**PR title** (create-pr rule): `chore(<scope>): remove $FEATURE_ID feature flag (always enabled)`

Then execute create-pr **Step 4** (`git push`, `gh pr create`) and return the PR URL.

Optionally run create-pr **Step 5** (Slack message via `slack-pr-message`).

## Example

```text
/remove-feature-flag myFeature {"enabled": true}
```

Implement → validate → commit → create PR with `create-pr` schema → return PR URL.
