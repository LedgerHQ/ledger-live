# @features/platform-observability-redaction

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Removes identifiers from what an app reports to an observability or analytics tool: URLs, such as
the resources of a RUM session, and account descriptors anywhere in an event. It knows the URL
shapes of the Ledger and blockchain APIs the wallets call, and has no dependency on a vendor SDK:
each app applies it in its own SDK wiring.

## Main exports

- `scrubResourceUrl(url)` replaces each identifier with `[redacted]`:
  - the path segment after a key such as `/address/`, `/accounts/` or `/delegators/`, unless it is
    a fixed route such as `/balances/stx` or `/addresses/utxos`;
  - the value of a query parameter whose key names an identifier, such as `address`, `account.id`
    or `owner_address`. A key ending in `type` or `currency`, such as `walletType`, only describes
    one: its value is redacted only when it holds an identifier itself;
  - the value of a `token` query parameter, which holds a credential;
  - any path segment, query value or fragment segment holding an account id (`js:2:bitcoin:…`,
    encoded or not), an alphanumeric run of 25 characters or more that mixes letters and digits
    (addresses, extended public keys, transaction hashes), or a URL-safe base64 run of 40
    characters or more (TON addresses).

  The origin and the other parts are kept as they are, and scrubbing a scrubbed URL changes
  nothing.
- `containsIdentifiers(url)` tells whether `scrubResourceUrl` would change the URL.
- `scrubAccountDescriptors(text)` replaces each account descriptor string
  (`account:<1|2>:<type>:…:<key>:<path>`) with `[redacted]`. Without a valid path, the rest of
  its word goes too, since nothing tells where the key ends.
- `scrubAccountDescriptorsFromRecord(record)` returns a plain copy without descriptors, in its
  strings, its property names, or as a descriptor-shaped object (`key` + `network`, whose
  `key` is redacted), as JSON would send it: `toJSON` is honored, functions are dropped, errors keep
  their name, message and fields. `scrubAccountDescriptorsInPlace(value)` edits plain objects and
  arrays in place, swaps any other value for that scrubbed copy, and throws when a field cannot change.

## Consumers

- Ledger Wallet Desktop: `resource.url` and every event (descriptors, in place) in the renderer
  Datadog `beforeSend`, the main-process resource and error URLs in the Electron SDK
  `beforeSendRum`, and descriptors in the analytics props filter.
- Ledger Wallet Mobile: the RUM resources reported by the Datadog SDK; descriptors in the error
  and log mappers, the action contexts, and the analytics props filter. An event whose scrub
  throws is dropped.
