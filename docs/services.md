# External Services used by Ledger Live

Catalog of every external network service contacted by **Ledger Live Desktop (LLD)** and **Ledger Live Mobile (LLM)** — plus services whose domain is baked into a third-party SDK we ship.

> [!IMPORTANT]
> **Keep this file up to date.** Whenever a service is added, removed, or its domain/management changes (new entry in [`libs/env/src/env.ts`](/libs/env/src/env.ts), a new hardcoded endpoint, a coin-module config change, or a new SDK dependency that phones home), add/update its row in the matching **scope** section below. See [Maintenance](#maintenance).

## How to read this doc

Sections are split by **scope** — the primary axis, because third-party endpoints fall **outside Ledger's standard monitoring**:

1. **[Internal APIs](#internal-apis-ledger-operated)** — Ledger-operated endpoints: `*.ledger.com`, `*.ledger.app` plus Ledger-owned infra (`*.ledger-test.com`, `*.ldg-tech.com`, `*.ledger-stg.com`). Covered by our usual monitoring.
2. **[Third-party APIs](#third-party-apis-external--outside-ledger-monitoring)** — external services not operated by Ledger, including domains baked into SDKs we ship. **Not covered by our usual monitoring.**
3. **[Browsable Content](#browsable-content)** — URLs handed to the OS browser (`openURL` / `Linking.openURL`), **not** fetched as APIs.

Inside the Internal and Third-party tables, rows are grouped by **owning team** (from [`CODEOWNERS`](/CODEOWNERS)), marked with a **bold separator row**. Each row is **service · domain · managed-by · env tag**. Domains are host-only; anything noteworthy is a small line under the domain. **⚠️** = unconfirmed, needs owner input.

**Owning teams** (CODEOWNERS): `Coin Integration` (`@ledgerhq/coin-integration`, `@ledgerhq/blockchain-support`) · `PTX` (`@ledgerhq/ptx`) · `Engagement` (`@ledgerhq/engagement`) · `Platform` (`@ledgerhq/platform`) · `Live Devices` (`@ledgerhq/live-devices`) · `Wallet XP` (`@ledgerhq/wallet-xp`) · `Ledger Sync` (`@ledgerhq/cloud-wallet`) · `Recover` (`@ledgerhq/recover-software`).

**Managed by**

| Keyword | Meaning |
|---|---|
| `env` | Defined in [`libs/env/src/env.ts`](/libs/env/src/env.ts), overridable at runtime. |
| `coin-config` | Default in a coin/family config, overridable via Firebase remote config. |
| `feature-flag` | Gated/configured by a Firebase feature flag. |
| `code` | Literal in our source. |
| `build` | Injected at build time, not runtime-changeable. |
| `SDK` | Domain baked into a third-party SDK; we only pass keys/region. |

**Env tag** — `prod` · `staging` · `testnet` · `dev` · `test`.

---

## Internal APIs (Ledger-operated)

`*.ledger.com` and Ledger-owned infra. Within Ledger's standard monitoring.

| Service | Domain | Managed by | Env |
|---|---|---|---|
| **Coin Integration** | | | |
| Ledger Explorer (UTXO + generic) | `explorers.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| EVM RPC node fleet | `<network>.coin.ledger.com`<br>_41 Ledger networks; see config_ | [coin-config](/libs/ledger-live-common/src/families/evm/config.ts) | prod / testnet |
| EVM explorer (Etherscan proxy) | `proxyetherscan.api.live.ledger.com` | [coin-config](/libs/ledger-live-common/src/families/evm/config.ts) | prod |
| EVM explorer (Blockscout proxy) | `proxyblockscout.api.live.ledger.com` | [coin-config](/libs/ledger-live-common/src/families/evm/config.ts) | prod |
| EVM dApp RPC | `eth-dapps.api.live.ledger.com` | [coin-config](/libs/ledger-live-common/src/families/evm/config.ts) | prod |
| Aptos node | `apt.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Aptos indexer | `apt.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Algorand explorer/indexer | `algorand.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Celo indexer / archive node | `celo.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Filecoin | `filecoin.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Stacks | `stacks.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Polkadot indexer | `polkadot.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Polkadot sidecar | `polkadot-mainnet-rest-api.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Polkadot fullnode | `polkadot-fullnodes.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Polkadot Asset Hub | `polkadot-asset-hub-fullnodes.api.live.ledger.com` | [code](/libs/ledger-live-common/src/families/polkadot/config.ts) | prod |
| Polkadot Westend | `polkadot-westend-fullnodes.api.live.ledger.com` | [code](/libs/ledger-live-common/src/families/polkadot/config.ts) | testnet |
| MultiversX API | `elrond.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| MultiversX delegation | `delegations-elrond.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Kaspa | `kaspa.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Stellar Horizon | `stellar.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Tezos baker API | `tezos-bakers.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Tezos explorer | `xtz-explorer.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Tezos TzKT | `xtz-tzkt-explorer.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Tezos node | `xtz-node.api.live.ledger.com`<br>_⚠️ `*.api.vault.ledger.com` variants also seen_ | [env](/libs/env/src/env.ts) | prod |
| Tron RPC proxy | `tron.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Solana RPC proxy | `solana.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Solana validators | `earn.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Solana validators summary | `earn-dashboard.aws.stg.ldg-tech.com`<br>_⚠️ staging host set as default_ | [env](/libs/env/src/env.ts) | staging |
| Solana testnet validators | `validators-solana.coin.ledger.com` | [env](/libs/env/src/env.ts) | testnet |
| Sui node / GraphQL | `sui.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Hedera mirror | `hedera.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Hedera tokens (Thirdweb) | `hedera-tokens.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Hedera HGraph | `hedera-indexer-mainnet.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| VeChain ThoRest | `vechain.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Aleo node | `aleo.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Aleo SDK backend | `aleo-backend.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod / testnet |
| Cardano API | `cardano.coin.ledger.com`<br>_testnet: `cardanoscan.io` (third-party)_ | [env](/libs/env/src/env.ts) | prod |
| Cardano epoch params | `ada.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| ICON node/indexer | `icon.coin.ledger.com`<br>_testnet: `solidwallet.io` (third-party)_ | [env](/libs/env/src/env.ts) | prod |
| Cronos POS (Crypto.org) | `cryptoorg-rpc-node.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Cronos POS indexer | `cryptoorg-rpc-indexer.coin.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Canton gateway | `canton-gateway.api.live.ledger.com` | [code](/libs/ledger-live-common/src/families/canton/config.ts) | prod |
| TON | `ton.coin.ledger.com` | [code](/libs/ledger-live-common/src/families/ton/config.ts) | prod |
| NEAR node / indexer | `near.coin.ledger.com`, `near-indexer.coin.ledger.com`<br>_fallback `rpc.mainnet.near.org` (third-party)_ | [code](/libs/ledger-live-common/src/families/near/config.ts) | prod |
| Mina | `mina.coin.ledger.com` | [code](/libs/ledger-live-common/src/families/mina/config.ts) | prod |
| Casper | `casper.coin.ledger.com` | [code](/libs/ledger-live-common/src/families/casper/config.ts) | prod |
| Concordium | `ccd-node-mainnet.coin.ledger.com`, `ccd-wallet-proxy-mainnet.coin.ledger.com` | [code](/libs/ledger-live-common/src/families/concordium/config.ts) | prod |
| XRP node | `xrp.coin.ledger.com` | [code](/libs/ledger-live-common/src/families/xrp/config.ts) | prod |
| Zcash (Zaino) | `zaino-zec-mainnet-zebra.nodes.stg.ledger-test.com`<br>_⚠️ only staging found; prod status unknown_ | [code](/libs/coin-modules/coin-bitcoin/src/chain-adapters/zcash/constants.ts) | staging |
| Cosmos LCDs (Ledger-hosted) | `axelar`, `cosmoshub4`, `dydx`, `osmo`, `coreum`, `injective`, `babylon` `.coin.ledger.com` | [code](/libs/coin-modules/coin-cosmos/src/config.ts) | prod |
| **PTX** | | | |
| Buy API | `buy.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Sell API | `buy.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Provider session | `buy.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Swap backend | `swap.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Ramp catalog | `cdn.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Partner signatures (CAL) | `crypto-assets-service.api.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Buy/Sell limits | `buy.api.aws.prd.ldg-tech.com`<br>_E2E only_ | [code](/libs/ledger-live-common/src/e2e/buySell.ts) | test |
| Live app — Swap | `swap-live-app.ledger.com`<br>_manifest [`swap-live-app-aws`](https://live-app-catalog.ledger.com/api/v1/apps)_ | feature-flag | prod |
| Live app — Buy / Sell | `buy-sell.live.ledger.com`<br>_manifest [`buy-sell`](https://live-app-catalog.ledger.com/api/v1/apps)_ | feature-flag | prod |
| Live app — Earn | `earn.live.ledger.com`<br>_manifest [`earn`](https://live-app-catalog.ledger.com/api/v1/apps)_ | feature-flag | prod |
| Live app — Card | `card-program.ledger.com`<br>_manifest [`card-program`](https://live-app-catalog.ledger.com/api/v1/apps)_ | feature-flag | prod |
| Live app — Borrow | `borrow.live.ledger.com`<br>_manifest [`borrow`](https://live-app-catalog.ledger.com/api/v1/apps)_ | feature-flag | prod |
| Live app — Perps | `perps.live.ledger.com`<br>_manifest [`perps-live-app`](https://live-app-catalog.ledger.com/api/v1/apps)_ | feature-flag | prod |
| **Platform** | | | |
| Countervalues / prices | `countervalues.live.ledger.com`<br>_also `countervalues.api.live`, `countervalues-service.api`_ | [env](/libs/env/src/env.ts) | prod |
| CoinMarketCap proxy | `proxycmc.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| CoinGecko proxy | `proxycg.api.live.ledger.com`<br>_`proxycgassets.api.live` also seen_ | [env](/libs/env/src/env.ts) | prod |
| Crypto Assets List (CAL) | `crypto-assets-service.api.ledger.com`<br>_`cal.api.*` also seen_ | [env](/libs/env/src/env.ts) | prod |
| CAL dynamic CDN | `cdn.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| DADA (assets data aggregator) | `dada.api.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Mapping service | `mapping-service.api.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Crypto icons CDN | `crypto-icons.ledger.com` | code | prod |
| NFT metadata | `nft.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Wallet icons / avatars CDN | `lw-icons.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Sanctioned addresses (compliance) | `compliance.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Ledger Button tracking | `ledgerb.api.ledger.com` | [code](/libs/ledger-live-common/src/wallet-api/utils/ledgerButtonTracking.ts) | prod |
| **Live Devices** | | | |
| Manager API | `manager.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Script runner | `scriptrunner.api.live.ledger.com`<br>_WebSocket (`wss`)_ | [env](/libs/env/src/env.ts) | prod |
| Device gateway | `device-gateway.api.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Device language packs | `download.languages.ledger.com`<br>_pack list via Manager API; binary from this host_ | code | prod |
| LLD auto-update feed | `resources.live.ledger.app`<br>_Electron auto-updater signature check; LLD only_ | [code](/apps/ledger-live-desktop/src/main/updater/init.ts) | prod |
| **Wallet XP** | | | |
| Live App manifest catalog | `live-app-catalog.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Platform global catalog | `cdn.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| dApp browser | `dapp-browser.apps.ledger.com`<br>_+ `platform.apps`, `debug.apps` (dev)_ | code | prod |
| **Ledger Sync** | | | |
| Cloud Sync backend | `cloud-sync.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| Trustchain backend | `trustchain.api.live.ledger.com` | [env](/libs/env/src/env.ts) | prod |
| **Recover** | | | |
| Recover / Protect live app | `protect-frontend.recover.ledger.com`<br>_manifest [`protect-prod`](https://live-app-catalog.ledger.com/api/v1/apps); staging: `protect-frontend.stg.recover.ledger-test.com`_ | feature-flag | prod / staging |

> Per-coin "view in explorer" links are browser links, not APIs — see [Browsable Content](#browsable-content).

---

## Third-party APIs (external — outside Ledger monitoring)

Services **not** operated by Ledger, including domains baked into SDKs we ship. **Not covered by Ledger's standard monitoring** — only keys/region/project IDs are ours.

| Service | Domain | Managed by | Env |
|---|---|---|---|
| **Coin Integration** | | | |
| EVM third-party RPCs | `rpc.bitlayer.org`, `bsc-dataseed.binance.org`, `polygon-mainnet.g.alchemy.com`, …<br>_⚠️ per-network non-Ledger fallbacks; config is source of truth_ | [coin-config](/libs/ledger-live-common/src/families/evm/config.ts) | prod / testnet |
| Aptos testnet | `api.testnet.aptoslabs.com` | [env](/libs/env/src/env.ts) | testnet |
| Sui testnet | `fullnode.testnet.sui.io`, `graphql.testnet.sui.io` | [env](/libs/env/src/env.ts) | testnet |
| NEAR fallback RPC | `rpc.mainnet.near.org` | [code](/libs/ledger-live-common/src/families/near/config.ts) | prod |
| ICON testnet | `solidwallet.io` | [env](/libs/env/src/env.ts) | testnet |
| Cosmos LCDs (third-party) | `api.mainnet.desmos.network`, `rest.core.persistence.one`, `lcd.quicksilver.zone`, `api.nyx.nodes.guru`, `verona-api.polkachu.com` | [code](/libs/coin-modules/coin-cosmos/src/config.ts) | prod |
| 0G validators (ExploreMe) | `api.0g.exploreme.pro` | [code](/libs/coin-modules/coin-evm/src/staking/contracts.ts) | prod |
| ICP gateway | `ic0.app` | [SDK](https://www.npmjs.com/package/@zondax/ledger-live-icp) | prod |
| **Engagement** | | | |
| Segment | `api.segment.io`, `cdn.segment.com`<br>_[@segment/analytics-next](https://www.npmjs.com/package/@segment/analytics-next) / [-react-native](https://www.npmjs.com/package/@segment/analytics-react-native)_ | [code](/apps/ledger-live-desktop/src/renderer/analytics/segment.ts) | prod |
| Braze | `sdk.fra-02.braze.eu`<br>_[@braze/web-sdk](https://www.npmjs.com/package/@braze/web-sdk) / [@braze/react-native-sdk](https://www.npmjs.com/package/@braze/react-native-sdk); SDK package only (Braze API not used)_ | [code](/apps/ledger-live-desktop/src/braze-setup.ts) | prod |
| Firebase Remote Config | `firebaseremoteconfig.googleapis.com`, `firebaseinstallations.googleapis.com`<br>_[firebase](https://www.npmjs.com/package/firebase) / [@react-native-firebase/remote-config](https://www.npmjs.com/package/@react-native-firebase/remote-config); backs feature flags_ | [code](/apps/ledger-live-desktop/src/firebase-setup.ts) | prod |
| Firebase Cloud Messaging | `fcmregistrations.googleapis.com`<br>_[@react-native-firebase/messaging](https://www.npmjs.com/package/@react-native-firebase/messaging); LLM only_ | [SDK](https://www.npmjs.com/package/@react-native-firebase/messaging) | prod |
| Typeform (ratings survey) | `form.typeform.com`<br>_in-app WebView on LLM only_ | [code](/apps/ledger-live-mobile/src/screens/RatingsModal/DisappointedForm.tsx) | prod |
| **Platform** | | | |
| Status page | `ledger.statuspage.io`<br>_Atlassian-hosted_ | [env](/libs/env/src/env.ts) | prod |
| Datadog RUM / Logs | `browser-intake-datadoghq.eu`<br>_[@datadog/browser-rum](https://www.npmjs.com/package/@datadog/browser-rum) / [mobile-react-native](https://www.npmjs.com/package/@datadog/mobile-react-native)_ | [build](/apps/ledger-live-desktop/src/datadog/config.ts) | prod |
| Sentry | `*.ingest.sentry.io`<br>_[@sentry/electron](https://www.npmjs.com/package/@sentry/electron); LLD only_ | [build](/apps/ledger-live-desktop/src/sentry/install.ts) | prod |
| LLD prerelease update feed | `lw-prerelease-sigs.s3.eu-west-1.amazonaws.com`<br>_Electron auto-updater; only when `UPDATE_CHECK_FEED` env is set (prerelease / dev builds)_ | [code](/apps/ledger-live-desktop/src/main/updater/init.ts) | dev |
| **Wallet XP** | | | |
| WalletConnect | `relay.walletconnect.org`<br>_[@walletconnect/sign-client](https://www.npmjs.com/package/@walletconnect/sign-client); also verify/echo/pulse_ | [SDK](https://www.npmjs.com/package/@walletconnect/sign-client) | prod |

---

## Browsable Content

URLs the app hands to the OS browser (`openURL` / `Linking.openURL`) — **not** API calls. Mostly hardcoded / localized. A mix of Ledger and external destinations.

| Destination | Domain | Notes |
|---|---|---|
| Support | `support.ledger.com` | Help articles, staking guides. |
| Marketing site | `www.ledger.com`, `www.ledger.fr` | Product pages. |
| Academy / Learn | `www.ledger.com/academy` | "Learn more" links & content cards. |
| Shop | `shop.ledger.com` | Hardware purchase. |
| Developers portal | `developers.ledger.com` | |
| Contact / Source / Donjon | `contact.ledger.com`, `source.ledger.com`, `donjon.ledger.com` | |
| Block explorers (per coin) | `etherscan.io`, `tronscan.org`, `mintscan.io`, `suiscan.xyz`, `tzkt.io`, `cardanoscan.io`, … | "View in explorer" links. |
| Swap / trade provider sites | `changelly.com`, `moonpay.com`, `1inch.com`, `paraswap.io`, `li.fi`, `web3.okx.com`, … | PTX provider UI links; quoting goes via `swap.ledger.com`. |
| Chatbot support | `ledgercustomersuccess.my.salesforce-sites.com` | Feature-flagged (`llmChatbotSupport` / `lldChatbotSupport`). |
| Feedback survey | `form.typeform.com` | Swap completed feedback (LLD); ratings modal (LLM). |
| Tezos baker directory | `baking-bad.org` | Delegation flow (both apps). |
| Chorus One ToS | `chorus.one` | "Ledger by Chorus One" terms of service link. |

---

## Maintenance

This catalog is **inferred from the codebase** ([`libs/env/src/env.ts`](/libs/env/src/env.ts), coin/family configs, hardcoded endpoints, SDK defaults) and must be kept current:

- **New env service** in [`libs/env/src/env.ts`](/libs/env/src/env.ts) → add a row in the matching scope section, under the owning team's separator.
- **New hardcoded endpoint** (coin module, family config, app) → add a row linking the source.
- **New SDK dependency** that contacts a fixed domain → add it under Third-party, mark `SDK`.
- **Removed/renamed service** → remove or update the row.

**Scope rule:** `*.ledger.com`, `*.ledger.app`, and Ledger-owned infra (`*.ledger-test.com`, `*.ldg-tech.com`, `*.ledger-stg.com`) go under **Internal APIs**; everything else (including SDK-baked domains) goes under **Third-party APIs**. URLs only opened in the browser go under **Browsable Content**.

Team mapping comes from [`CODEOWNERS`](/CODEOWNERS).
