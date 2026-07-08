---
"@devtools/protocols": minor
"@devtools/transport": minor
---

Add WebSocket devtools libraries for web-tools ⇄ Ledger app interaction.

  `transport` provides an isomorphic WebSocket factory with reactive connection
  state, a handshake protocol, and a `TransportProtocol` interface for custom
  behaviour. `protocols` builds on it with a `copyStore` protocol that replicates
  Redux store state across the wire.

