# @features/platform-wallet-api-server

> [!CAUTION]
> **Status: UNSTABLE.** Exploratory: moves the Wallet API server out of `libs/ledger-live-common`.

`useWalletAPIServerCore` creates the Wallet API server of one live app session and owns what needs no legacy `Account`:

| Concern | Owner |
| --- | --- |
| server per session, config, permissions, custom handlers, session activation | this package |
| `storage.get`, `storage.set` and their manifest rule | this package |
| `account.list` when an accounts provider is given | this package, through `@features/platform-wallet-api-accounts` |
| the other handlers | the host (`useWalletAPIServer` of live-common), on the returned server |

```ts
const server = useWalletAPIServerCore({ session, manifest, config, customHandlers, storage, accountsProvider });
useEffect(() => server.setHandler("transaction.sign", sign), [server, sign]);
```

A handler leaves the host for this package once it can be served without `Account`.
