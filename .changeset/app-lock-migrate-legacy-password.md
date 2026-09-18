---
"@features/platform-app-lock": minor
"live-mobile": minor
---

Move existing passwords off the plaintext scheme onto a verifier, without asking the user anything.

Every user with a password today is on a scheme that stores it in plaintext and verifies it by string comparison — not only the short ones. The migration derives a digest from the password they already have, so it needs the plaintext: it runs right after a successful **legacy** unlock, the one moment the password has been proven and is in hand, and not at boot.

Write, prove, only then delete. A crash between the write and the delete leaves the user a way in through the legacy entry; after the delete, through the verifier. Never through neither. That also makes it resumable: a verifier already present means an earlier run got that far, so the next one proves it and finishes rather than deriving a second time. A verifier that will not open with that password leaves the legacy entry alone and reports `deferred` — an unproven verifier must not cost the user their only way in.

A completed migration retires the legacy lock, clearing `privacy.hasPassword`. Without it the app carries two independent guards: the old `AuthPass` screen renders over the new unlock screen, and the revamped Settings row hides the legacy toggle that could remove the old credential.

Whether the password is under the six-character minimum is recorded as it migrates, because nothing can tell afterwards — a verifier says nothing about the length of the password behind it. The prompt that acts on it is LIVE-35981.

The derivation queue is held for exactly one turn across the whole sequence. This shipped broken once: the migration took a turn and then called a password check that asked for another, so the inner call waited on the outer, the outer on the inner, and every later check waited on both — the app could not be unlocked at all. The check is now the unserialised primitive the public checks are built on, and a test fails if anything asks for a second turn.
