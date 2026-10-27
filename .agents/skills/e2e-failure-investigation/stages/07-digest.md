# 07 Digest

Input: `investigation.json`. Output: `digest.txt`.

1. Run `node scripts/render-digest.mjs $STATE_DIR/runs/<run_id>`. It reads the canonical wrapper and writes `digest.txt`.
2. Read the digest once. If it is wrong, correct `investigation.json` and rerun the formatter.
3. Deliver by `delivery`. For `stdout`, print the digest. For `slack`, stop and report that Slack delivery is not built.

Format one block per platform and one line per final failed test. Include a flaky count separately. Never state a hypothesis as confirmed when the structured finding has `not_confirmed`.
