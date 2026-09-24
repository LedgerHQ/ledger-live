# @ledgerhq/baanx-test-client

> [!CAUTION]
> **Status: UNSTABLE** — New package; the API is still being designed and may change without notice.

A test-only client that **logs a Baanx sandbox user in** — answering the OTP challenge from their
TOTP setup key so suites stay headless — and returns a cached access token.

Test-only tooling: `private`, never published, not imported by the shipped apps.

**This is not the app's Card authentication.** The app mints a `PayCardSession` —
`{ accessToken, expiresIn, refreshToken }` — through the OAuth/PKCE flow in
`@features/flow-pay-card-auth`, and stores it in `@features/platform-card`. What this package does is
a different flow entirely: password + TOTP, straight against Baanx. The token is a `Bearer`
credential for the Baanx API; it is not an equivalent of `cardSession` and cannot become one, because
the password login returns no refresh token.

There is one deliberate bridge, and it is a test scaffold rather than an equivalence:
[`--session`](#starting-the-app-already-signed-in) synthesises a `PayCardSession` with a placeholder
refresh token so Desktop and Mobile can be started already signed in for local development and E2E.
Read that section before using it, in particular the one about `CARD_BAANX_API_URL` having to match
the host that minted the token.

## Assumption: our test users are authenticator-based, not SMS

Baanx's [docs](https://docs.baanx.com/guides/user/authentication) describe `POST /v1/auth/login/otp`
as an **SMS** trigger and mention TOTP nowhere. This package uses a TOTP setup key because our test
users are provisioned with an authenticator secret — confirmed by the team, not by the docs.

If a user ever turns out to be SMS-only, a derived code cannot satisfy it: Baanx compares an SMS code
against a stored random value, while TOTP is `HMAC(secret, time_counter)`. No shared state, no
workaround — the account has to be re-provisioned. `BaanxOtpError` says so when a code is rejected.

## Configuration

Environment variables only — see [`.env.sample`](./.env.sample) for the full annotated list.
Required: `BAANX_TEST_CLIENT_KEY` (sandbox needs its own; the app's `CARD_BAANX_CLIENT_KEY` will not work),
`BAANX_TEST_USER_EMAIL`, `BAANX_TEST_USER_PASSWORD`, `BAANX_TEST_USER_TOTP_SECRET`. Optional:
`BAANX_TEST_API_URL` (defaults to `https://dev.api.baanx.com`), `BAANX_TEST_USER_REGION`, and the
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

### Sharing one token across parallel workers

Tokens are cached in memory and reused until five minutes before expiry; concurrent callers in one
process share a single in-flight login. That cache cannot cross processes, and Playwright and Detox
fork a worker per shard — **logging in per worker is how you earn a `429`**.

There is no pre-authenticated-token input on `getBaanxAuthToken`: hand the token to whatever consumes
it, not back into this client. For the app, that is `CARD_SESSION_BOOTSTRAP` (see below). For a suite
calling the API directly, mint once outside the workers and read the token from the environment
yourself:

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

### Starting the app already signed in

Desktop cannot finish the OAuth login today — the hosted page opens in the user's own browser and
reports nothing back (LIVE-34740) — so a signed-in state has to be injected. Mobile uses the same
seam so E2E and local Metro can skip the hosted login. `-- --session` prints a `PayCardSession` for
exactly that.

Desktop:

```bash
export CARD_SESSION_BOOTSTRAP=$(pnpm --silent --filter @ledgerhq/baanx-test-client token -- --session)
export CARD_BAANX_API_URL=https://<the Baanx host that minted the token>
export CARD_BAANX_CLIENT_KEY=baanx-client-key-that-minted-the-token
pnpm --filter ledger-live-desktop start
```

Mobile, where the variable is read by **Metro**, not by the app process — the babel inline plugin
substitutes it while bundling, so export it in the terminal that runs the bundler and reset the
transform cache:

```bash
export CARD_SESSION_BOOTSTRAP=$(pnpm --silent --filter @ledgerhq/baanx-test-client token -- --session)
pnpm mobile start --reset-cache
# second terminal, no exports needed:
pnpm mobile ios:staging
```

`CARD_BAANX_API_URL` and `CARD_BAANX_CLIENT_KEY` do **not** travel by shell export on mobile: they
come from the `ENVFILE` compiled into the build (`apps/ledger-live-mobile/.env.<platform>.<variant>`,
where the staging files already point at `dev.api.baanx.com`). Mint the token on the host that build
targets, or override both at runtime in Settings → Debug → Configuration → Env, which takes
`NAME=value` one line at a time.

Both variables are equally required when you start the desktop app from the shell. 
Detox injects a session for specs whose path contains `/paytab/`.
Playwright opts in with `test.use({ injectCardSession: true })`. 
`resolveCardSessionBootstrap()` uses a set `CARD_SESSION_BOOTSTRAP` if present, 
otherwise it mints via `getBaanxAuthToken()`. Put `BAANX_TEST_*`
in the process environment (load this package's `.env` yourself); overlapping opted-in tests in one
worker share the in-memory login cache.

```bash
set -a && source e2e/tooling/baanx-test-client/.env && set +a
pnpm --filter ledger-live-desktop-e2e-tests test:playwright -- tests/specs/paytab.spec.ts
pnpm --filter ledger-live-mobile-e2e-tests test:ios -- e2e/mobile/specs/paytab
```

A pre-set `CARD_SESSION_BOOTSTRAP` is not expiry-checked. Unset it for long local sessions.

On desktop, `CARD_BAANX_API_URL` **must** point at the host that minted the token (Playwright spreads
`process.env` into Electron). It defaults to the production Card backend
(`https://card.api.live.ledger.com`), so a sandbox token left with the default is a bearer for the
wrong audience and every Card call answers 401. The password login returns no refresh token, so
`--session` / the helper fill that field with a placeholder: nothing can refresh with it, which is
fine for a run shorter than the 6-hour token life but is not a substitute for the OAuth flow.

Keep `CARD_SESSION_BOOTSTRAP` out of `@shared/env` so it does not appear in `getAllEnvs()`, exported
logs, or Allure's environment tab. Do not put it in a committed mobile `.env` file: those ship inside
the artifact. Desktop reads `process.env` at boot and then drops it from that Electron process.
Mobile reads Detox launch arguments at runtime, and `process.env` only in `__DEV__` (Metro). Honour
it in a development build, or in any build launched with `PLAYWRIGHT_RUN` (desktop) / `Config.DETOX`
(mobile). Treat a machine where you export it as one holding a live credential. The runtime check is
deliberate: release-mode E2E runs against the release bundle, where a build-time marker would be
absent. Mint once per run and reuse it — Baanx rate limits the OTP trigger.

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
| `BaanxInvalidClientKeyError` / `BaanxMissingClientKeyError` | 498 / 499; name `BAANX_TEST_CLIENT_KEY`. |
| `BaanxInvalidCredentialsError` | 401; `.accountLocked` set when the message indicates a lock. |
| `BaanxRateLimitError` | 429; carries `.retryAfter`. |
| `BaanxHttpError` | Other non-2xx; carries `.status` and redacted `.body`. |
| `BaanxTransportError` | Host unreachable; carries no request detail. |

## Nothing is logged

The package has no logging at all. Passwords, tokens, the client key, the setup key and generated
codes never reach a message, an error or stdout — except the CLI printing the token, which is its
purpose. Bodies attached to errors pass through `redactBody` first. Variables are named, never valued.

## Layout

```text
src/
├── index.ts        barrel: the public contract, nothing else
├── types.ts        public types and constants
├── errors.ts       the typed errors
├── config.ts       env resolution
├── cli.ts          the CLI entry point (+ cliArgs.ts)
├── auth/           login flow, TOTP, token cache, expiry
└── http/           transport and response handling
```

Only `index.ts`, `types.ts`, `errors.ts`, `config.ts` and `auth/session.ts` are public.
`auth/login.ts`, `auth/totp.ts`, `auth/expiry.ts`, `http/send.ts` and `http/body.ts` are
implementation detail and are absent from the barrel.

## Development

```bash
pnpm --filter @ledgerhq/baanx-test-client test
pnpm --filter @ledgerhq/baanx-test-client typecheck
pnpm --filter @ledgerhq/baanx-test-client lint
```

Tests inject `fetchImpl` and a fake clock: no network calls, no dependence on wall time. TOTP is
verified against an RFC 6238 vector.
