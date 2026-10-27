# 04 Analyze

Input: `failures.json`, `environment.json`, domain pack and prior cause history. Output: structured finding drafts.

1. Preserve facts separately: test/file/line, job/platform/device, final retry-aware outcome, failing step, first observable error and log/artifact references.
2. Match the error to a domain signature. A match creates a hypothesis only; record `cause_id`, cause, verdict and area separately from facts.
3. Follow the code and log chain to the first failure. Search logs and network artifacts for shared `429`, `5xx`, `ECONNREFUSED` or timeout symptoms before grouping tests.
4. For a backend hypothesis, use `datadog-backend-check` when its backend is configured and read-only credentials are available. Record its result/URL as evidence. Missing configuration, credentials, artifacts or history is a gap, not negative evidence.
5. Set confidence/status: `known` only with an existing ticket, `confirmed` only with evidence, otherwise `not_confirmed` with `attempts` and `user_actions`.
6. Find regression history with read-only `gh run list`, `git log`, and PR diffs where available. Do not infer a cause from a title.
