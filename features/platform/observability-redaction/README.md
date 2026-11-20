# @features/platform-observability-redaction

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Removes identifiers from URLs before an app reports them to an observability tool, such as the
resources of a RUM session. It knows the URL shapes of the Ledger and blockchain APIs the wallets
call, and has no dependency on a vendor SDK: each app applies it in its own SDK wiring.

## Main exports

- `scrubResourceUrl(url)` replaces each identifier with `[redacted]`:
  - the path segment after a key such as `/address/`, `/accounts/` or `/delegators/`;
  - the value of a query parameter such as `address=` or `account=`;
  - any path segment, query value or fragment segment holding an account id (`js:2:bitcoin:…`,
    encoded or not) or an alphanumeric run of 25 characters or more that mixes letters and digits:
    addresses, extended public keys, transaction hashes.

  The origin and the other parts are kept as they are, and scrubbing a scrubbed URL changes
  nothing.
- `containsIdentifiers(url)` tells whether `scrubResourceUrl` would change the URL.

## Consumers

- Ledger Wallet Desktop: `resource.url` in the Datadog `beforeSend`.
- Ledger Wallet Mobile: the RUM resources reported by the Datadog SDK.
