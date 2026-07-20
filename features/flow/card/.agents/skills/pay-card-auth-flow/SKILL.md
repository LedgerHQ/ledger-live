---
name: pay-card-auth-flow
description: Guides implementation and review of Pay Card authentication across @features/flow-card, @domain/api-pay-card, @domain/entity-pay-card, and Shell integrations. Use when changing pre-auth, hosted login, callback exchange, session validation, secure persistence, logout, or related UI states.
---

# Pay Card authentication flow

## Architecture boundaries

- `features/flow/card` owns UI and orchestration. Follow MVVM: RTK Query hooks and handlers belong in ViewModels; Views receive props and never call APIs or platform services.
- `domain/entity/pay-card` owns canonical camelCase entities, schemas, and reusable auth/session state contracts.
- `domain/api/pay-card` owns all `/card/v1/*` RTK Query endpoints, snake_case wire schemas, request/error contracts, transforms, authenticated endpoint configuration, mocks, and endpoint tests.
- The Shell owns navigation, Web3Hub presentation, callback route params, secure persistence, token custody, and auth cleanup. Use Shell handoffs instead of importing browser/WebView platform services in feature code.
- The FE talks only to the Ledger Backend. Baanx access/refresh tokens, PKCE `code_verifier`, and client secrets must never reach the FE.
- Do not redefine domain models, endpoint contracts, or API transforms in `@features/flow-card`.

## API contract

- `POST /card/v1/pre-auth`, unauthenticated: `{ provider: "baanx" }` → `{ login_url }`.
- `POST /card/v1/auth`, unauthenticated and state-validated: `{ state, code }` → `{ app_session_token, expires_at }`.
- `GET /card/v1/me`, bearer session: → `{ provider_user_id, verification_state, phase }`.
- `POST /card/v1/logout`, bearer session: → `{ success: true }`.
- Errors always use the HTTP status plus `{ code, message }`.
- Keep snake_case inside `@domain/api-pay-card`; transform responses to camelCase domain entities before feature code sees them.
- Balance, transactions, and card details are out of scope for v1. Do not invent fields from `/me`; `cardOverview` is only an auth/account routing state until those contracts exist.

## Flow

1. `resolvingSession`: callback `code` + `state` takes priority; otherwise a stored session enters `checkingAccount`; otherwise enter `loggedOut`.
2. `TAP_I_HAVE_A_CARD`: enter `startingLogin`, call `preAuth`, and dispatch the API-provided `loginUrl` through the Pay Card slice.
3. On mobile, the Pay tab Shell reads the slice, pushes the Web3Hub app route, and passes the `loginUrl` as `queryParams.goToURL`. Web3Hub still loads through a manifest ID so the player keeps its manifest origin allowlist.
4. Use the dedicated Pay Card manifest JSON for the flow: one manifest ID/JSON for login URLs and one manifest ID/JSON for signup/register URLs. Do not route both flows through the same manifest.
5. On callback, Shell-hosted surfaces pass callback params through the injected intent/callback API. Remove any stale local session, acknowledge and clear the route params, enter `generatingAuthToken`, then call `authenticate`.
6. Persist the returned session in SecureStorage through the Shell. After persistence succeeds, enter `checkingAccount` and call `/me`.
7. A verified account enters `cardOverview`; incomplete onboarding enters `noCardIssued`. Keep the mapping from `verificationState`/`phase` explicit and tested because the backend classification is still tentative.
8. A `401` performs local auth cleanup and enters `loggedOut`. A temporary `5xx`/provider error keeps the session and enters `meError`, where `RETRY` repeats `/me`.
9. User-initiated `LOGOUT` on a valid session calls `/logout` before local cleanup. Expired or invalid sessions skip the server call.
10. Persistence failure enters `persistenceError`; `RESET_AND_SIGN_IN_AGAIN` performs local cleanup and returns to `loggedOut`.

Local auth cleanup clears Shell-owned in-memory auth state and removes `app_session_token` from SecureStorage. The caller chooses `loggedOut` or `loggedOutWithError`.

## Security requirements

- Open hosted login through the Shell-owned Pay Card Web3Hub handoff: feature code dispatches the API-provided `loginUrl` to the Pay Card slice, and Shell forwards it to the WebView as `queryParams.goToURL` with the correct login or signup/register manifest ID. Wrong-password and provider login errors stay inside the Baanx Hosted UI.
- Keep `app_session_token` in SecureStorage plus Shell-owned memory. Inject token access into `@domain/api-pay-card` and attach the bearer there; do not expose the raw token to the MFE or shared Redux.
- If temporary Redux storage is unavoidable, use a Shell-only slice and exclude it from persistence, serialization, DevTools, telemetry, and crash reports.
- Never log or emit analytics containing `login_url`, callback `code`/`state`, session tokens, or authorization headers. `login_url` contains short-lived OAuth material.
- Use `expiresAt` to avoid requests with a known-expired session, but treat backend `401` as authoritative.
- The backend must rate-limit and preferably attest `/pre-auth` and `/auth`, strictly allowlist `redirect_uri`, and own session rotation/reuse detection. Do not recreate these controls in the feature.

## Required coverage

- Callback precedence over an existing token.
- Login URL failure, hosted-login cancellation, invalid state, provider rejection, and provider failure.
- SecureStorage success and failure.
- `/me` verified, incomplete, `401`, and retryable error branches.
- Server logout followed by cleanup, plus local-only cleanup for expired sessions.
- Wire-to-domain transforms, bearer attachment only on authenticated endpoints, mocks, and sensitive-data redaction.

Run the focused tests, typecheck, lint, and formatting checks for every changed package before finishing.
