---
name: impacting-prs
description: Find which open PRs are impacted by a migration/sunset/refactor and notify their authors — blocking review when the old path is already gone from develop, heads-up comment when it is only deprecated or its removal is still in review, silent study report only when the replacement does not exist yet. Use when asked to check/flag/notify/block open PRs about a breaking change, deprecation or migration they need to follow.
---

# Notify open PRs impacted by an ongoing migration

**When:** a change is landing (or has landed) that every in-flight PR must follow — a package sunset, an API deprecation, a moved module, a new architectural rule.

**Three modes.** What gates the ping is **whether the replacement is already on `develop`**, not where the removal lives — an author can only act on advice they can commit today. Whether the old path is *already gone* only sets the severity:

| Replacement on `develop`? | Old path on `develop`? | Mode | What we do |
| --- | --- | --- | --- |
| ✅ yes | gone | 🔴 **Blocking** | review requesting changes on each impacted PR |
| ✅ yes | still there (deprecated, or removed only in a pending PR) | 🟠 **Heads-up** | comment on each impacted PR |
| ❌ not yet | anything | 🔍 **Study** | **no ping.** Report the blast radius to the user, or as one comment on their own migration PR |

The middle row is the common case and the one easy to get wrong: a sunset PR usually only deletes the *last legacy alias* of something whose successor landed weeks ago. The impacted authors can migrate right now, so ping them — the migration PR being unmerged is a reason to say "landing soon", not a reason to stay silent. Reserve 🔍 study for when the successor genuinely does not exist yet.

**Hard rules:**

- 🚫 Never post anything before the user has read and approved the drafts.
- 🚫 Never guess the migration pattern. Derive it from the merged work, then have the user confirm it (step 1).
- 🚫 **In study mode, never comment on an impacted PR.** There is nothing they can do yet: the target API does not exist on `develop`, so a ping is noise that ages badly.
- ⚖️ **Never pick 🔍 study just because the migration PR is open.** Check the replacement on `develop` first (step 1); if it resolves there, this is 🟠, and offer the user the choice of pinging now.
- 🇬🇧 **Everything we post is in English**, whatever language the conversation happens in. Being prompted in French is not a reason to write French comments — the PR authors are an international audience.
- 🤖 Every posted message starts with the `🤖` icon, so authors can tell at a glance it came from an agent, and so a later run can detect the PR was already informed.

## 1. Pin down the change and the migration pattern

Ask the user for what only they know (use `AskUserQuestion`, batched):

- **On whose behalf** we speak (the person who did the migration) — the comments are written for them.
- **The merged/prepared PRs** implementing the migration, and a migration guide/ADR if one exists.
- **The mode**, once you have established both axes yourself (below) — confirm it rather than let the user guess, and when the answer is 🟠 on an unmerged migration, explicitly offer to ping now.

Establish the two axes with `git`, not by asking. Mixed cases are normal — one artifact dropped, another only deprecated — so the mode is **per artifact**:

```bash
gh pr view <migration-pr> --json state,mergedAt      # is the removal on develop yet?
git fetch origin <base> -q                           # your worktree is probably stale
git grep -l '<dropped-import>' origin/<base>         # old path: still resolvable?
git grep -l '<replacement-symbol>' origin/<base>     # replacement: does it exist TODAY?
```

That last line is the one that decides 🔍 vs 🟠. Counting *how* the rest of the repo already imports the symbol on `origin/<base>` also hands you the per-layer replacement for free, and proves it rather than assuming it:

```bash
git grep -hE '\b<Symbol>\b' origin/<base> -- '<layer-path>' \
  | grep -oE 'from "[^"]+"' | sort | uniq -c | sort -rn
```

Then do the homework yourself, don't ask for it:

```bash
gh pr diff <migration-pr>                       # the actual before → after
gh pr list --state merged --author <login> --limit 30 --json number,title,mergedAt
gh api repos/$GH_REPO/commits?path=<dropped-path> --jq '.[].commit.message'
```

Read enough of the merged diffs to answer: **how do I detect the problem in a diff**, and **what exactly replaces it, per layer**. The replacement is rarely uniform — e.g. a public lib may not import an app-internal domain module, while `libs/coin-modules/*` reach the same data through the coin framework. Build a matrix:

| Layer / path | Detection signal (added lines) | Replacement | Severity |
| --- | --- | --- | --- |
| `apps/**` | `from "@x/dropped"` | `useFoo()` from `@x/new` | 🔴 blocking |
| `libs/coin-modules/**` | same import | `coinConfig.getStore()` | 🔴 blocking |
| any | `from "@x/deprecated-types"` | `@x/new-types` | 🟠 heads-up |

Severity is a property of the row, not of the campaign: the same scan routinely yields one 🔴 artifact already deleted from `develop` and one 🟠 artifact whose deletion is still in review.

**Show the matrix and the severity policy to the user and get an explicit OK before scanning.** Also agree on the detection regex — a too-broad one produces noise, and noise on 20 PRs is expensive.

## 2. Select eligible PRs

Three exclusions, all handled by `scan-prs.sh` — don't re-implement them by hand:

- PRs that do **not target `develop`**.
- PRs **already conflicting** with `develop` — they have to rebase anyway, and will pick the change up then.
- PRs **somebody already informed** (a comment/review body matching `-m`, default `[Oo]n behalf of @`) — commenting twice is pure noise, and the most common way this skill becomes annoying. The default is deliberately broad, so it also excludes PRs informed about *another* migration: when two campaigns overlap, narrow it to something specific to yours (`-m '#20040'`, `-m '@ledgerhq/errors'`) — our bodies always name the migration PR, so that always has something to match.

```bash
.agents/skills/impacting-prs/scan-prs.sh -p 'cryptoassets' -o "$TMPDIR/scan"
# -p regex (required, matched on added lines only)  -b base (develop)  -l list limit
# -j parallel jobs  -x excluded-paths regex  -m already-informed marker  -o output dir
```

It writes `prs.json` (eligible PRs), `diffs/<n>.diff`, `hits.tsv` (`pr ⇥ path ⇥ line ⇥ content`), `already-informed.txt`, and prints the skip counts. `line` is the **RIGHT-side line number**, ready to use as the `line` of a review comment — anchor on it rather than recomputing. Notes:

- Matching **added lines only** matters: a PR that *removes* the old import is doing the migration, not breaking it.
- GitHub computes mergeability lazily — the first `gh pr list` returns `UNKNOWN` for most PRs and warms the cache; the script queries twice for that reason. Re-run if some stay `UNKNOWN`.
- Run `gh` **outside the sandbox** (`dangerouslyDisableSandbox: true`).

## 3. Analyse each hit

For every PR with hits, read the surrounding diff (`$OUT/diffs/<n>.diff`) and decide:

- **False positive?** Drop it: moved/renamed lines, comments, changesets, fixtures, generated files, code that was already there, or a usage the matrix explicitly allows.
- **Which layer** the file belongs to → which row of the matrix applies → severity.
- **What the author must do**, in one sentence, referring to their own file paths and symbols.
- **The exact line to comment on**, from `hits.tsv` — every surviving hit becomes an inline comment, not a paragraph in a wall of text.
- **Is the replacement mechanical?** Then attach a ` ```suggestion ` block the author can commit in one click. Only when you can write the *exact* resulting line(s) — a wrong suggestion is worse than none, and a suggestion is a claim we are sure, so keep the hedging in the prose around it.

The strongest suggestion you can write is one copied from the PR's own neighbours: if sibling files in the same directory already import the symbol the new way on `origin/<base>`, quote that and the fix becomes indisputable.

**Then look past `hits.tsv`.** It only sees added lines *containing the pattern*, so it structurally misses a PR that **edits a file the migration deletes** — the added line (`+  newField?: string;`) never names the package. Those are the expensive cases: guaranteed rebase conflicts, and often the author already made the same change in the right place and just left a stale duplicate. Check every PR with hits, and cheaply check the others:

```bash
grep -lE '^\+\+\+ b/(<deleted-path-1>|<deleted-path-2>)' "$OUT"/diffs/*.diff
```

Keep a table: PR · author · what it is about · files · severity · required action. Verify a couple of the target APIs really exist before recommending them — `git grep` on `origin/<base>` in 🟠/🔴 mode, on the migration PR's branch in 🔍 study mode (`gh pr diff <migration-pr>`), since on `develop` they do not exist yet. Recommending a symbol that does not exist destroys the credibility of the whole batch.

## 4. 🔍 Study mode: one report, zero pings

Only when the replacement is **not on `develop`** — re-read the mode table before landing here, since an unmerged migration PR is usually still 🟠. The impacted authors cannot act yet, so nothing is posted on their PRs. Deliver the blast radius to the person doing the migration instead — steps 5 to 7 do not apply:

- **They have a PR for the migration** → one comment on *their own* PR, updated in place on later runs (`gh pr comment <migration-pr> --body-file report.md --edit-last`).
- **They don't** → just answer in the conversation. Nothing is posted anywhere.

The report is for sizing the work, not for shaming anyone — group by required action, not by PR, since that is what tells the author whether they need a codemod, a migration guide, or a compat shim:

```markdown
🔍 Impact study for `<artifact>` (this PR, not on `develop` yet) — 6 open PRs affected

**Mechanical import swap (4)** — #20204 (57 files, wallet-api refactor) · #19581 · #19191 · #20045
**Needs the coin-framework accessor (1)** — #20018 (coin-vechain, no access to the new store)
**Unclear, worth a chat (1)** — #20221 (adds a new dependency on the dropped path)

Scanned N open PRs targeting `develop`; skipped M conflicting + K other-base.
Rerun once this lands to notify them, or say the word and I'll draft the heads-up now.
```

Two things this makes visible early, which is the point of the mode: PRs so large the migration should wait for them to land, and layers with no replacement yet.

## 5. Draft and get approval

One comment per PR, from the templates in [references/comment-templates.md](references/comment-templates.md). Tone: `🤖 On behalf of @<author>` in the summary body only — **never repeat the attribution in each inline comment**, it reads like a robot signing every line. Hedged ("it looks like", "you may need to") — we are never 100% sure, the PR author knows their code better. In English, nice, short, actionable, open to being wrong.

Show all drafts to the user in one message, grouped by severity, and wait. Expect the user to correct the expected code change — fold their corrections back into the matrix and re-check the other drafts against it.

## 6. Post (🟠 / 🔴 only)

**Default form: one review carrying a short summary body + one inline comment per hit** (with a `suggestion` block where relevant). Anchored comments land next to the offending line, so the author sees the impact in their own code instead of in a wall of text — see [references/comment-templates.md](references/comment-templates.md) for the payload.

```bash
# event: REQUEST_CHANGES for 🔴 blocking, COMMENT for 🟠 heads-up (does not block)
gh api repos/$GH_REPO/pulls/<n>/reviews --input payload.json --jq .html_url
```

Sequentially, out of the sandbox, capturing each returned URL. Fallbacks:

- `422 line must be part of the diff` → the hit is outside the PR's own hunks; drop that inline comment (keep it in the body) rather than retrying on another line.
- `REQUEST_CHANGES` on your own PR is rejected by GitHub → post with `event: COMMENT` and say in the body that it would otherwise be blocking.
- No inline anchor at all (nothing mechanical, or all 422s) → `gh pr comment <n> --body-file draft.md`.

State drifts between the scan and the posting, so right before each post re-check that the PR is still open, still `MERGEABLE` and still free of the marker — the scan's exclusions are only as fresh as the scan:

```bash
gh pr view <n> --json state,mergeable --jq '"\(.state) \(.mergeable)"'   # expect: OPEN MERGEABLE
```

## 7. Recap

Report back a copy-pasteable summary, grouped by severity, each line linking the **posted comment** (the URL returned above, e.g. `#issuecomment-…` / `#pullrequestreview-…`) plus a 2-4 word label of what the PR is about:

```
:red_circle: Blocking (@x/dropped removed from develop)
- #19806 (<comment url>) — Kaspa coin tester
- #19645 (<comment url>) — Readiness + Tezos

:large_orange_circle: Deprecated (@x/deprecated-types)
- #20034 (<comment url>) — Polkadot
```

List separately what was skipped and why (conflicting, other base, false positive) so the user can double-check the blind spots.
