# ledger-auth

`@ledgerhq/ledger-auth` provides authentication helpers for Ledger Live apps to authenticate users against Ledger's Keycloak-based OAuth2/OIDC service. It handles the full PKCE authorization code flow, token storage, and silent token refresh, exposing a simple `AuthSDK` facade.

## What it does

- Implements the OAuth2 PKCE flow (code verifier / challenge generation)
- Communicates with Ledger's Keycloak identity service via typed HTTP helpers
- Manages access and refresh tokens (storage, expiry detection, refresh)
- Exposes error types for auth failures (token expired, network error, etc.)

## Key exports / concepts

- `AuthSDK` — main class; call `.login()`, `.logout()`, `.getAccessToken()`, `.refreshToken()`
- `pkce` — PKCE code verifier/challenge utilities
- `keycloakService` — low-level Keycloak endpoint wrappers
- Error classes: `AuthError` and subtypes from `errors.ts`

## Usage context

Used by Ledger Live Desktop and Mobile wherever a Ledger account login is required (e.g. accessing Ledger services that require authentication). Consumed via the `AuthSDK` singleton initialized at app boot.
