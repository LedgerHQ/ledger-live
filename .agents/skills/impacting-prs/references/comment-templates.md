# Comment templates & tone

## Tone rules

- **Start with `🤖`** and **speak on behalf** of the person who did the migration, in the summary body: `🤖 On behalf of @author: …`. The icon says "an agent wrote this" and doubles as the already-informed marker for later runs.
- **Attribute once.** The summary body carries the `on behalf of @author`; inline comments must *not* repeat it — they are already part of that review.
- **English only**, even when the conversation driving the run is in another language.
- **Hedge, always.** We read a diff, we did not run their branch: "it looks like", "you may need to", "if I read this right". Never "your PR is broken".
- **Concise**: what changed · why it touches this PR · what to do · where to look. ~10 lines max in the body, 1-3 lines per inline comment.
- **Actionable**: name their files/symbols, link the migration PR or guide.
- **Open the door**: invite a correction if we misread, offer help. No blame, no deadline pressure.
- No "generated with Claude" mention.

## Review payload (default form)

One review = a short summary body + one anchored comment per hit. `path` and `line` come
straight from `hits.tsv`; `side: "RIGHT"` because we always comment on added lines.

```bash
jq -n --rawfile body body.md --rawfile c1 comment1.md '{
  event: "REQUEST_CHANGES",                       # or "COMMENT" for a non-blocking heads-up
  body: $body,
  comments: [
    { path: "libs/foo/src/bar.ts", line: 12, side: "RIGHT", body: $c1 }
  ]
}' > payload.json

gh api repos/$GH_REPO/pulls/<n>/reviews --input payload.json --jq .html_url
```

Multi-line hunk: add `start_line` (+ `start_side`) alongside `line`, `line` being the last line.
Reading the bodies from files via `--rawfile` avoids any escaping problem with backticks and
newlines in suggestion blocks.

## Inline comment, with a committable fix

Only when you can write the exact resulting line — the suggestion replaces the anchored
line(s) verbatim, so a stray indent or a missing symbol makes it uncommittable. Keep the
hedge in the prose, not in the block.

````markdown
`<artifact>` was dropped in #<migration-pr> — for <this layer> the equivalent is `<replacement>`:

```suggestion
import { X } from "@x/new";
```

Feel free to ignore if this file is handled elsewhere.
````

When the fix is not mechanical, comment on the line without a suggestion:

```markdown
This one probably needs `<replacement>` instead, but it depends on how `<symbol>` is used below — happy to dig if useful.
```

No `🤖` and no "on behalf of" here: the review body already carries both.

## 🔴 Blocking body — the change is already in `develop`

Posted as `event: REQUEST_CHANGES`, so the PR cannot merge as-is.

````markdown
> [!IMPORTANT]
> 🤖 On behalf of @<author>: `<artifact>` was removed from `develop` in #<migration-pr>, so this PR will likely not build once rebased.

I left <n> inline note(s) on the spots that look affected. The migration for <this layer> is:

```diff
- import { X } from "@x/dropped";
+ import { X } from "@x/new";
```

Requesting changes only so this does not land by accident — happy to be told I misread the diff, and glad to help with the migration if useful. See #<migration-pr> for the reference change.
````

## 🟠 Heads-up body — deprecated, still working

Posted as `event: COMMENT` (or `gh pr comment` if nothing can be anchored) — no block.

```markdown
🤖 On behalf of @<author>: `<artifact>` is now deprecated (see #<migration-pr>) and should disappear soon, so this PR may need a small follow-up — see the inline note(s).

Nothing blocking today, mostly to avoid adding new usages that we will have to migrate again later. Let me know if this does not apply to your case.
```

## 🟠 Heads-up body — removal is still in review

Same `event: COMMENT`, for the very common case where the migration PR is open but its
replacement has been on `develop` for a while. Two things must be explicit: the removal has
**not** landed yet (so nothing is broken right now, and CI is green for a reason), and the fix
is nonetheless committable **today**. Naming the date/PR is what keeps the ping from reading
as a false alarm.

````markdown
🤖 On behalf of @<author>: #<migration-pr> deletes `<artifact>` — it is in review now, not on `develop` yet, so nothing is broken on your branch today.

I left <n> inline note(s) where this PR adds new usages. The replacement already exists on `develop`, so it is safe to apply right away and it saves you a conflict later:

```diff
- import { X } from "@x/dropped";
+ import { X } from "@x/new";
```

Not blocking — and if #<migration-pr> lands first, this becomes a build error rather than a suggestion. Tell me if I misread your diff and I will drop this.
````

If the user explicitly wants these blocked before the migration lands, keep this body but post
it as `REQUEST_CHANGES`, and say so in one added sentence — never let the event contradict a
body that claims to be non-blocking.
