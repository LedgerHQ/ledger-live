---
"@ledgerhq/baanx-test-client": minor
---

Add `@ledgerhq/baanx-test-client`: a test-only client for the Baanx API, against the sandbox (`dev.api.baanx.com`, injectable base URL). Logs a test user in, branches on the response body rather than the status code (Baanx answers 200 even when login has not completed), answers the OTP challenge by deriving the code from the user's TOTP setup key, and returns a cached access token plus the metadata needed to debug a failure.

Exposes `getBaanxAuthToken()` for Playwright/Detox/Jest setup, `baanxRequest()` for authenticated data-creation and validation calls (endpoint-agnostic; attaches the bearer token, client key and region header, retries once on a 401, and raises the same typed errors as login), and a CLI (`pnpm --silent --filter @ledgerhq/baanx-test-client token`) for Postman, curl and CI. Tokens are cached in-process and shared between concurrent callers so a parallel run does not log in per worker; credentials, the client key and the TOTP secret come from environment variables only, and nothing is logged or written to disk.

Includes an opt-in live integration test (`test-integ`) that logs in against the sandbox and validates `GET /v1/user`; it is excluded from the hermetic unit run and skips when credentials are not configured.
