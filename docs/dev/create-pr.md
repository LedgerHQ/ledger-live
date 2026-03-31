# Create PR Workflow

Steps for creating a pull request with proper description, changeset, and Slack announcement.

---

## Step 1: Analyze the changes

1. Run `git status` and `git diff` to understand current changes
2. Run `git log develop..HEAD --oneline` to see commits on this branch
3. Identify all modified packages for the changeset

---

## Step 2: Create the changeset

Use the `create-changeset` skill to add a changeset for the modified packages.

See [/docs/dev/changesets.md](/docs/dev/changesets.md) for package names and impact levels.

---

## Step 3: Commit the changeset

Stage and commit only the changeset file:

```bash
git add .changeset/
git commit -m "chore: add changeset"
```

---

## Step 4: Push and create the PR

Push the branch:

```bash
git push -u origin HEAD
```

Generate the PR body from [/docs/dev/pr-template.md](/docs/dev/pr-template.md) using the provided inputs.

Create the PR as a draft and capture the URL:

```bash
PR_URL=$(gh pr create --draft --title "{{PR_TITLE}}" --body "$(cat <<'EOF'
{{GENERATED_PR_BODY}}
EOF
)")
open "$PR_URL"
```

**Always run `open "$PR_URL"` to open the PR in the browser. Do NOT skip this step.**

**If there are UI changes:**
1. Click the **"..."** menu → **"Edit"** on the PR description
2. Scroll to the Before/After table, drag & drop screenshots into the cells
3. Click **"Update comment"**, then **"Ready for review"**

---

## Step 5: Generate Slack message

Use the `slack-pr-message` skill to generate the Slack announcement message for the PR.

See [/docs/dev/slack-pr-message.md](/docs/dev/slack-pr-message.md) for format and prefix rules.
