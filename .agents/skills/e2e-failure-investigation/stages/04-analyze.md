# 04 Analyze

Input: `failures.json`, `environment.json`, domain pack, `causes.json`. Output: draft findings.

For each kept test:

1. Read the first error, the failing step and the spec file and line. Read the log around `log_line`.
2. Match the error against `signatures` in the domain pack. A match is a hypothesis, not a result.
3. Follow the chain in the code to the first thing that went wrong. The visible error is often a late symptom. `domains/<domain>.md` lists known chains.
4. Look for a shared cause. Search logs and the Playwright "Network failures" attachment for `429`, `5xx`, `ECONNREFUSED`, `Timeout`. Group tests with one cause under one `cause_id`.
5. If the failure is new, find the regression window:
   - Find the last green run of the same workflow and device in `runs/index.json` or with `gh run list`. Scheduled runs rotate devices, so compare like with like.
   - Run `git log <good_sha>..<bad_sha>` and read the commits that touch the failing area.
   - Read the patch of a suspect PR with `gh pr diff`. Do not guess from the title.
   - Make sure that `head_sha` does not already contain the fix.
6. Decide the verdict.
   - The test is out of date or its helper hides an error: `test_adjustment`.
   - The app or a backend behaves wrongly: `bug`, with `area` `product` or `backend`.
7. For a backend cause, call `datadog-backend-check`. Pass the run environment, the `backend` key from the domain pack, the symptom (for example HTTP 429) and the failed job time window. Set `check_prd` to `true`.
   - Datadog must show the problem in the run environment (`run` result `found`) before the cause is `confirmed`. If the result is `not_found`, look for another cause.
   - Map the `prd` result to the finding field `prd`: `found` is `confirmed`, `not_found` is `not_confirmed`, `not_checked` is `not_checked`. Add a `datadog` evidence item with the URL.
   - If the skill returns `not_checked` for the run environment, the cause cannot reach `confirmed` by this route. Try other evidence. If none exists, set `not_confirmed` and add the reason to `user_actions`.
8. Set the status.
   - A ticket for this `cause_id` already exists in `causes.json` or Jira: `known`, with the key.
   - You proved the cause with evidence: `confirmed`.
   - Otherwise try again with another source: code, PR diff, artifacts, older runs, Datadog. When no source settles it, set `not_confirmed`. Record every try in `attempts` and give `user_actions`.
9. Pick a `cause_id`: a short lowercase slug of the cause, the same across runs (for example `countervalues-429`).
