# 07 Digest

Input: `findings.json`, `environment.json`. Output: `digest.txt`.

1. Run `node scripts/render-digest.mjs $STATE_DIR/runs/<run_id>`. It prints the digest and writes `digest.txt`.
2. Read the digest once. The script only formats. If a line is wrong, fix `findings.json` and run the script again.
3. Deliver by `delivery`. For `stdout`, print the digest as the final answer. For `slack`, stop and report that Slack delivery is not built.

Format: one block per platform, one line per failed test.

```
Platform iOS
- <failure> | <root cause> | <known or not known> | <ticket or none> | PRD: <confirmed or not confirmed>
```

- `PRD: confirmed` means Datadog PRD shows the problem. `not confirmed` means the check ran and found nothing. `not checked` means no check ran or it does not apply.
- Flaky tests appear as one count line at the end.
