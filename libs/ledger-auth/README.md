# ledger-auth

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/ledger-auth` provides authentication helpers for Ledger Live apps to authenticate users against Ledger's Keycloak-based OAuth2/OIDC service. It handles the full PKCE authorization code flow, token storage, and silent token refresh through the concrete `AuthSDK` implementation.

## What it does

- Implements the OAuth2 PKCE flow (code verifier / challenge generation)
- Communicates with Ledger's Keycloak identity service via typed HTTP helpers
- Manages access and refresh tokens (storage, expiry detection, refresh)
- Exposes error types for auth failures (token expired, network error, etc.)

## Key exports / concepts

- `AuthSDK` — main class; call `.withToken()` to run and retry an authenticated operation
- `pkce` — PKCE code verifier/challenge utilities
- `keycloakService` — low-level Keycloak endpoint wrappers
- Error classes: `AuthError` and subtypes from `errors.ts`

## Usage context

Ledger Live Desktop and Mobile expose a stable `AuthProvider` through their Redux thunk extra argument. That facade lazily creates and caches `AuthSDK` when authentication is enabled and its environment is known.
