# `@features/platform-lkrp-qr`

> [!CAUTION]
> **Status: UNSTABLE** — The QR pairing contracts are a migration shell without an implementation.

Wallet-owned LKRP QR pairing protocol.

The package defines host and candidate entry points compatible with the current pairing flow. It
will own the encrypted WebSocket handshake after that concern leaves the LKRP SDK. It depends on
`@shared/lkrp` only for Trustchain membership contracts and receives its relay transport by
injection.

QR rendering, camera access, PIN screens, routing and analytics stay in Wallet flows and apps.
Generic address QR rendering remains in `@shared/ui-qr-code`.
