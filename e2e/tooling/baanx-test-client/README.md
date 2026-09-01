# @ledgerhq/baanx-test-client

> [!CAUTION]
> **Status: UNSTABLE** — New package; the API is still being designed and may change without notice.

A test-only client for the **Baanx API**. It logs a test user in — answering the OTP challenge
automatically from their TOTP setup key, so suites stay headless — and then lets you make
authenticated calls for the data creation and validation a Paytab↔Baanx integration test needs.

Test-only tooling: `private`, never published, not imported by the shipped apps.

**It is not the app's Card authentication, and does not plug into it.** The app's
`@features/platform-card` session stores a `PayCardSession` — `{ accessToken, expiresIn,
refreshToken }` — minted by the OAuth/PKCE flow in
`@features/flow-pay-card-auth`. The Baanx password login used here returns **no refresh token at
all**, so its session cannot satisfy that shape. Use the token directly as a `Bearer` credential
against the Baanx API; it is not a drop-in for `cardSession`.

## Assumption: our test users are authenticator-based, not SMS

Baanx's [docs](https://docs.baanx.com/guides/user/authentication) describe `POST /v1/auth/login/otp`
as an **SMS** trigger and mention TOTP nowhere. This package uses a TOTP setup key because our test
users are provisioned with an authenticator secret — confirmed by the team, not by the docs.

If a user ever turns out to be SMS-only, a derived code cannot satisfy it: Baanx compares an SMS code
against a stored random value, while TOTP is `HMAC(secret, time_counter)`. No shared state, no
workaround — the account has to be re-provisioned. `BaanxOtpError` says so when a code is rejected.

## Configuration

Environment variables only — see [`.env.sample`](./.env.sample) for the full annotated list.
Required: `BAANX_CLIENT_KEY` (sandbox needs its own; the app's `CARD_BAANX_CLIENT_KEY` will not work),
`BAANX_TEST_USER_EMAIL`, `BAANX_TEST_USER_PASSWORD`, `BAANX_TEST_USER_TOTP_SECRET`. Optional:
`BAANX_API_BASE_URL` (defaults to `https://dev.api.baanx.com`), `BAANX_TEST_USER_REGION`, and the
`BAANX_TOTP_*` parameters.

There are deliberately no CLI flags for secrets — flags leak into process lists and shell history.
Nothing is read from a committed fixture or written to disk.

These are **not** wired into `shared/env`: those definitions get bundled into the apps, and the
password and setup key must never enter an app bundle. Any field can also be passed explicitly, which
is how the tests stay hermetic.

## Programmatic use

```ts
import { getBaanxAuthToken } from "@ledgerhq/baanx-test-client";

const session = await getBaanxAuthToken();
// accessToken, userId, expiresAt, expirySource, otpUsed, verificationState, isLinked, baseUrl, region
```

Overrides are accepted for a one-off against another user or host:
`getBaanxAuthToken({ baseUrl: "…", region: "us" })`.

### Authenticated API calls

`baanxRequest` is the seam for data setup and validation. It attaches the bearer token, the client key
and the region header, reuses the cached token, and raises the same typed errors as the login flow, so
a `429` during fixture setup reads exactly like one during login.

```ts
import { baanxRequest } from "@ledgerhq/baanx-test-client";

const { data } = await baanxRequest<UserProfile>({ path: "/v1/user" });

await baanxRequest({ path: "/v1/some-resource", method: "POST", body: { … } });
await baanxRequest({ path: "/v1/things", query: { page: 2, cursor: undefined } });
```

It is deliberately **endpoint-agnostic** — it owns authentication and error handling and leaves the
endpoints to the caller. Non-2xx throws (catch the typed error and read `.status`); a `401` is retried
once against a freshly minted token, since a long suite can outlive a 6-hour token. That mirrors what
the app's own Card base query does after a 401.

### Sharing one token across parallel workers

Tokens are cached in memory and reused until five minutes before expiry; concurrent callers in one
process share a single in-flight login. That cache cannot cross processes, and Playwright and Detox
fork a worker per shard — **logging in per worker is how you earn a `429`**.

There is no pre-authenticated-token input on `getBaanxAuthToken` or `baanxRequest`: hand the token to
whatever consumes it, not back into this client. For the app, that is `CARD_SESSION_BOOTSTRAP` (see
below). For a suite calling the API directly, mint once outside the workers and read the token from
the environment yourself:

```bash
# once, before the workers start
export CARD_API_TOKEN=$(pnpm --silent --filter @ledgerhq/baanx-test-client token)
```

```ts
// in a worker — no login, no OTP, no 429
const token = process.env.CARD_API_TOKEN;
```

Calling `getBaanxAuthToken()` inside each worker logs in per worker; that is the case to avoid.

Tokens last 6 hours and there is **no refresh token** on this endpoint (they exist only in Baanx's
OAuth flow, and rotate), so nothing tries to renew. Re-authenticate per CI run.

## CLI

stdout carries the bare token and nothing else; failures go to stderr with a non-zero exit.

```bash
TOKEN=$(pnpm --silent --filter @ledgerhq/baanx-test-client token)
```

`-- --json` prints the full session, `-- --help` lists the variables.

### Starting Ledger Wallet Desktop already signed in

Desktop cannot finish the OAuth login today — the hosted page opens in the user's own browser and
reports nothing back (LIVE-34740) — so a signed-in state has to be injected. `-- --session` prints a
`PayCardSession` for exactly that:

```bash
export CARD_SESSION_BOOTSTRAP=$(pnpm --silent --filter @ledgerhq/baanx-test-client token -- --session)
export CARD_API_URL=https://<the Baanx host that minted the token>
pnpm --filter ledger-live-desktop start
```

The same variable works for Playwright, which already spreads `process.env` into `electron.launch`:

```bash
export CARD_SESSION_BOOTSTRAP=$(pnpm --silent --filter @ledgerhq/baanx-test-client token -- --session)
pnpm --filter ledger-live-desktop-e2e-tests test:playwright
```

Two things to know. `CARD_API_URL` **must** point at the host that minted the token, or the bearer is
for the wrong audience and every Card call answers 401. And the password login returns no refresh
token, so `--session` fills that field with a placeholder: nothing can refresh with it, which is fine
for a run shorter than the 6-hour token life but is not a substitute for the OAuth flow.

The app honours the variable only in a development build or under `PLAYWRIGHT_RUN`; a packaged build
ignores it. Mint once per run and reuse it — Baanx rate limits the OTP trigger.

## The login flow

Baanx returns **HTTP 200 even when login has not completed**, so every decision branches on the
response body; the status code is only used to map hard failures.

1. `POST /v1/auth/login` with `{ email, password }`.
2. **`phase` non-null** → onboarding never finished. `BaanxOnboardingIncompleteError`; no token exists.
3. **`isOtpRequired: true`** → trigger via `/v1/auth/login/otp` with `{ userId }`, derive the code,
   re-post the login with `{ email, password, otpCode }` (no `phoneNumber`). A second challenge means
   the code was rejected — it stops rather than burning attempts and risking a lock.
4. **`accessToken` present** → success.
5. **Otherwise** → `BaanxNoTokenError` with the redacted body. Blank, `null` and whitespace tokens
   count as absent, so this never yields `Bearer null`.

A code with under 2 seconds left is not sent; the flow waits for the next window. A code expiring in
flight reads as a credentials failure and is a real source of flaky auth.

## Errors

All extend `BaanxAuthError` and carry Baanx's own message where there is one.

| Error | Cause |
| --- | --- |
| `BaanxConfigError` | Required variables missing; lists their **names**. |
| `BaanxInvalidConfigError` | A value is malformed (region, digits, period, algorithm). |
| `BaanxTotpSecretError` | The setup key is not valid base32. |
| `BaanxOnboardingIncompleteError` | 200 with a `phase`; carries `.phase`, `.userId`. |
| `BaanxOtpError` | Challenge could not be completed, or the code was rejected. |
| `BaanxNoTokenError` | 200, no token, no explanation; carries redacted `.body`. |
| `BaanxInvalidClientKeyError` / `BaanxMissingClientKeyError` | 498 / 499; name `BAANX_CLIENT_KEY`. |
| `BaanxInvalidCredentialsError` | 401; `.accountLocked` set when the message indicates a lock. |
| `BaanxRateLimitError` | 429; carries `.retryAfter`. |
| `BaanxHttpError` | Other non-2xx; carries `.status` and redacted `.body`. |
| `BaanxTransportError` | Host unreachable; carries no request detail. |

## Nothing is logged

The package has no logging at all. Passwords, tokens, the client key, the setup key and generated
codes never reach a message, an error or stdout — except the CLI printing the token, which is its
purpose. Bodies attached to errors pass through `redactBody` first. Variables are named, never valued.

## Layout

Layered so dependencies run one way — `http/` knows nothing about auth, `auth/` knows nothing about
`request.ts`:

```text
src/
├── index.ts        barrel: the public contract, nothing else
├── types.ts        public types and constants
├── errors.ts       the typed errors
├── config.ts       env resolution
├── request.ts      baanxRequest — authenticated calls
├── cli.ts          the CLI entry point (+ cliArgs.ts)
├── auth/           login flow, TOTP, token cache, expiry
└── http/           transport and response handling
```

Only `index.ts`, `types.ts`, `errors.ts`, `config.ts`, `request.ts` and `auth/session.ts` are
public. `auth/login.ts`, `auth/totp.ts`, `auth/expiry.ts`, `http/send.ts` and `http/body.ts` are
implementation detail and are deliberately absent from the barrel — the same discipline
`libs/ledger-auth` uses, where `http.ts` and `pkce.ts` are not exported either.

`src/index.test.ts` pins the exported names, so the surface only grows on purpose.

## Development

```bash
pnpm --filter @ledgerhq/baanx-test-client test
pnpm --filter @ledgerhq/baanx-test-client typecheck
pnpm --filter @ledgerhq/baanx-test-client lint
```

Tests inject `fetchImpl` and a fake clock: no network calls, no dependence on wall time. TOTP is
verified against the RFC 6238 vectors.

### Live integration test

One opt-in test logs in for real and calls `GET /v1/user` through `baanxRequest` — the single
authenticated endpoint Baanx documents — to prove the token actually authenticates:

```bash
set -a; source .env; set +a      # or export the variables yourself
pnpm --filter @ledgerhq/baanx-test-client test-integ
```

It is excluded from `pnpm test`, which stays hermetic, and **skips** (exit 0) when the variables are
absent, so it is harmless in CI without secrets. It asserts the profile's `id` matches the session
`userId`, and includes a negative control — the same request with a bogus token must not return 200,
otherwise a 200 would prove nothing about the token.

One run costs a login (3 calls) plus 2 requests. Baanx rate limits the OTP trigger, so don't loop it;
a `429` surfaces as `BaanxRateLimitError`.
