---
"@ledgerhq/ledger-key-ring-protocol": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Enforce the QR code pairing sequence on both sides of the handshake

The host and the candidate now run the pairing messages through an explicit single-use state
machine: each message is only accepted at the one point of the sequence where it is expected,
and the peer that initiated the handshake is bound for the whole session. Envelopes, keys and
decrypted bodies are validated before being acted upon, so a duplicate, out-of-order, foreign or
malformed message ends the session with a `QRCodeProtocolError`: Desktop then asks for a fresh
QR code, Mobile goes to its existing retry screen.
