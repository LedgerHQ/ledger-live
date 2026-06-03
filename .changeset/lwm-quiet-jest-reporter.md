---
"live-mobile": minor
---

Switch the mobile Jest reporter to `jest-quiet-reporter` so passing test runs stay quiet — stdout/stderr is buffered per test and flushed only on failure. Failing tests retain full diagnostic output, while the "import after teardown" lines, Reanimated logs, and other passing-run noise no longer clutter CI output.
