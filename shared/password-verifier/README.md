# @shared/password-verifier

> [!CAUTION]
> **Status: UNSTABLE** — Created in [LIVE-35917](https://ledgerhq.atlassian.net/browse/LIVE-35917) as part of the User App Authentication epic.

Store a password so it can be checked later without keeping the password itself: the **verifier
record** and the **constant-time comparison** that checks it.

Pure functions over `Uint8Array`. No dependencies, no ports, no platform access.

Deliberately named for what it does, not for who asked for it. The app lock is its first caller, but
nothing here knows that — anything needing to verify a password can use it.

## Scope, and why it is this small

Everything else a password screen needs — scrypt, a CSPRNG, the Keychain, the biometric prompt — is a
thin call into a React Native module. Callers do that directly; wrapping each behind a port bought
indirection without buying anything, since mocking `react-native-keychain` in a test is one line.

What genuinely benefits from living in one reviewed, exhaustively tested place is the comparison. It
is three lines, it is easy to write wrongly, and writing it wrongly is silent. So that is what this
package is, and nothing more.

## Why it is its own package

Small enough to look like it should be folded into its caller, so: it should not be.

The rule is to use the lowest layer that can own the concern. This code needs nothing from
`domain/` or `features/` — no state, no React, no platform — so `shared/` is the lowest layer that
can hold it, and putting it a layer up would misplace it. `feature-flags` is split the same way:
`@shared/feature-flags` owns the primitive, `@features/platform-feature-flags` owns the app-aware
glue on top.

Its only consumer today is `@features/platform-app-lock`, which depends on `react-native-keychain`.
Keeping the verifier separate is what makes the security-critical comparison testable in plain Node
with zero dependencies and no React Native context — and it carries its own CODEOWNERS line, so the
one file where a casual edit is silently dangerous is reviewed by the people who own it.

The config-to-code ratio is normal for this layer, not a smell: `shared/qr-code` is 12 lines of
source and `shared/schema-primitives` is 50, against 48 here.

The app lock's own state (`hasPassword`, `biometricsEnabled`, `isLocked`), its biometrics status
unions and its errors live in
[`@features/platform-app-lock`](../../features/platform/app-lock/README.md). Its screens live in
[`@features/flow-app-lock`](../../features/flow/app-lock/README.md).

## What this protects

The verifier stores `scrypt(password, salt)`, never the password. **No field of it is secret** — an
attacker who reads the device reads the salt, the parameters and the digest. What protects the
password is the *cost* of scrypt, nothing else, which is why it must stay slow and why a 6-character
password remains weak however it is stored.

Note what the digest is **not**: it is never used as a key. Nothing is derived from the password to
encrypt with — the digest exists only to be compared against the stored one. scrypt is used here as
a password hash, not as a key derivation function, which is why the field is `digest` and the
parameter is `digestLength` rather than `keyLength`.

Even so, scrypt rather than a fast hash matters for a reason beyond this app: people reuse
passwords. A fast hash on a readable device would hand an attacker the *user's password*, which may
open their mail, not merely access to this wallet.

The lock as a whole is an **opportunistic-access control**: it defends against someone picking up the
phone. It is not data protection and must not be described as "encrypted at rest" — nothing is
encrypted. Anyone who can read the app's files reads the stored data without going through the
prompt, and can overwrite the verifier outright.

## API

```ts
createPasswordVerifier({ digest, salt, scrypt }): PasswordVerifier
matchesPasswordVerifier(verifier, digest): boolean
```

The caller derives `digest` with the platform's scrypt and generates `salt` with its CSPRNG.
`createPasswordVerifier` copies both, so mutating the caller's arrays afterwards cannot alter a
stored verifier. The `scrypt` parameters travel with the verifier, so an existing one still opens
after the defaults are raised — hard-coding them would lock out every user the day the cost changes.

`version` is a **policy** version, not an algorithm version: the migration off short passwords needs
to know which rules a verifier was created under.

`matchesPasswordVerifier` folds every byte into one accumulator and never returns early on a
mismatch. Replacing it with `===` (which compares references on a `Uint8Array` and is always false),
`every`, or any early-exit loop would leak how many leading bytes were correct and turn an offline
brute force into a byte-by-byte one. The length check is safe to short-circuit: `scrypt.digestLength`
sits in plaintext next to the verifier, so the length is not secret — Node's `timingSafeEqual`
likewise refuses unequal lengths outright.

## Left to the implementing ticket

No default `ScryptParams` is exported on purpose. Choosing scrypt's `N` (`cost`), `r` (`blockSize`)
and `p` (`parallelization`) is a real decision that needs measuring on low-end Android — shipping a
default here would invite adopting it unmeasured.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm unimported
```
