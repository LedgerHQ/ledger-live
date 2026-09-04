---
"ledger-live-mobile-e2e-tests": patch
---

Stop the Allure test description from repeating the `SPECULOS App: <name> (<version>)` block once
per Speculos (re)launch. `jest-allure2-reporter`'s `allure.description()` appends rather than
replaces — each call pushes a paragraph that the reporter joins with a blank line — and
`launchSpeculos()` emits one on every invocation, so a test whose setup retried three times printed
the same block four times. The mobile reporter config now drops verbatim-duplicate paragraphs before
joining, keeping the first of each; blocks for genuinely different apps (a swap lists one per
currency plus Exchange and its dependencies) all differ, so they are untouched. `descriptionHtml` is
deduplicated the same way, since it appends identically.

Also stops `executeCliCommands` from tearing down and relaunching Speculos after its *final* failed
attempt. Its two siblings, `executeCliCommandsOnApp` and `setupMainSpeculosApp`, already guard that
re-setup with `attempt < maxRetries`; without the guard the loop pays for one more
acquire/release cycle it will never use, and a failure inside that re-setup escapes the retry loop
and replaces the real `lastError` in the reported message.
