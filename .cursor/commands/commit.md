# Smart Gitmoji Commit

Analyze staged changes and create a commit with the appropriate gitmoji, type, scope, and message.

## Instructions

### Step 1: Read conventions

Read the commit conventions from `.cursor/rules/git-workflow.mdc` and follow them for all decisions below.

### Step 2: Gather context

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

### Step 3: Analyze and select gitmoji

Using the diff analysis and gitmoji selection rules from the git-workflow rule, determine the best gitmoji, type, scope, and description.

Fetch the full gitmoji list for reference:

```bash
curl -s https://raw.githubusercontent.com/carloscuesta/gitmoji/master/packages/gitmojis/src/gitmojis.json
```

### Step 4: Present and confirm

Present the analysis to the user:

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

### Step 5: Execute the commit

When the user selects **Commit**, run:

```bash
git commit -m ":gitmoji: type(scope): description"
```

Then verify with:

```bash
git log -1 --oneline
```

Then validate with commitlint:

```bash
pnpm commitlint --from HEAD~1
```
