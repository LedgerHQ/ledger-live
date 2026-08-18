// Retry a failing test once in CI so that genuinely flaky tests are observable.
//
// This is what makes @ledgerhq/test-quarantine/jest produce data: with no
// retries there is never a second attempt, so a flake is indistinguishable from
// a hard failure. A test that fails both attempts still fails the build.
//
// Safe to key off CI alone here because this config runs unit tests only — the
// integration tests have their own config (jest.integ.config.js) and are
// excluded from this one, so nothing that touches the network is retried.
//
// Deliberately CI-only: locally a failure should surface immediately rather than
// being retried behind the engineer's back.
//
// logErrorsBeforeRetry is not optional in spirit: without it jest discards the
// failed attempt entirely and prints nothing, so a flaky test is reported as a
// plain pass and the run looks clean. With it, jest logs the failure and a code
// frame before retrying, which is the only place the actual cause is visible.
if (process.env.CI) {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
}
