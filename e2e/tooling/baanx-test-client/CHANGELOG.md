# @ledgerhq/baanx-test-client

## 0.2.0-next.0

### Minor Changes

- [#21974](https://github.com/LedgerHQ/ledger-live/pull/21974) [`6b18b47`](https://github.com/LedgerHQ/ledger-live/commit/6b18b4715b367886e01bf05d7ee4f4ed54eae753) Thanks [@martijnhjk](https://github.com/martijnhjk)! - Add `@ledgerhq/baanx-test-client`: a test-only client that logs a sandbox test user in against `dev.api.baanx.com` (injectable base URL). Branches on the response body rather than the status code (Baanx answers 200 even when login has not completed), answers the OTP challenge by deriving the code from the user's TOTP setup key, and returns a cached access token plus the metadata needed to debug a failure.

  Exposes `getBaanxAuthToken()` for Playwright/Detox/Jest setup and a CLI (`pnpm --silent --filter @ledgerhq/baanx-test-client token`) for Postman, curl and CI. Tokens are cached in-process and shared between concurrent callers so a parallel run does not log in per worker; credentials come from `BAANX_TEST_*` environment variables (`BAANX_TEST_CLIENT_KEY`, `BAANX_TEST_API_URL`, user email/password/TOTP), not the app's `CARD_BAANX_*`, and nothing is logged or written to disk.
