# ledger-live-desktop

## 4.17.0-next.2

### Minor Changes

- [#20906](https://github.com/LedgerHQ/ledger-live/pull/20906) [`dbb2ee0`](https://github.com/LedgerHQ/ledger-live/commit/dbb2ee0539d4ff713231530efbc2d5814f039dae) Thanks [@LL782](https://github.com/LL782)! - Fix Ledger Sync being wiped on every launch when Password Lock is enabled. `app.trustchain` is an encrypted db path, so before unlock it reads back as a ciphertext string; importing it regenerated member credentials, nulled the trustchain, and persisted that fresh state over the encrypted blob in plaintext. The import is now skipped while the value is still a string, and trustchain writes are suppressed while the app is locked.

## 4.17.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/live-common@37.3.0-next.1
  - @shared/feature-flags@0.19.0-next.1
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/asset-detail@0.11.1-next.1
  - @ledgerhq/live-dmk-desktop@0.20.7-next.1
  - @devtools/bindings@0.4.0-next.1
  - @features/flow-contacts@0.7.0-next.1
  - @features/flow-large-screen-upsell@1.0.0-next.1
  - @features/platform-currencies@0.6.1-next.1
  - @features/platform-feature-flags@0.6.6-next.1
  - @ledgerhq/asset-aggregation@0.13.1-next.1
  - @ledgerhq/coin-bitcoin@0.51.1-next.1
  - @ledgerhq/coin-canton@1.0.0-next.1
  - @ledgerhq/coin-cardano@1.0.0-next.1
  - @ledgerhq/coin-casper@3.0.0-next.1
  - @ledgerhq/coin-concordium@1.0.0-next.1
  - @ledgerhq/coin-cosmos@1.0.0-next.1
  - @ledgerhq/coin-evm@5.0.0-next.1
  - @ledgerhq/coin-filecoin@2.0.0-next.1
  - @ledgerhq/coin-zcash@0.4.0-next.1
  - @ledgerhq/domain-service@1.8.15-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-countervalues@0.24.3-next.1
  - @ledgerhq/live-countervalues-react@0.16.7-next.1
  - @ledgerhq/live-wallet@1.0.1-next.1
  - @ledgerhq/wallet-analytics@0.3.4-next.1
  - @ledgerhq/wallet-pnl@0.7.7-next.1
  - @features/flow-analytics-consent@0.2.2-next.1
  - @devtools/shell@0.8.1-next.1
  - @ledgerhq/wallet-btc@0.3.0

## 4.17.0-next.0

### Minor Changes

- [#20611](https://github.com/LedgerHQ/ledger-live/pull/20611) [`5a87153`](https://github.com/LedgerHQ/ledger-live/commit/5a8715341159ffe80f0e380cff2affb9299406cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount the first-time Pay tab FeatureTour on the PayTab screen in both apps. Visibility is self-gated by the payCard slice (shown on first visit, hidden after dismissal), copy is injected from app-owned i18n keys (payTab.featureTour.\*), and analytics are wired through the view-model. Adds unit and integration coverage for the conditional rendering.

- [#20655](https://github.com/LedgerHQ/ledger-live/pull/20655) [`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay hero for the aggregated stablecoin balance. Introduces the `@features/flow-pay-card-balance` package with props-only empty and funded states, wired into the desktop Pay tab and tracking `Page Pay` with the active `balance_filter` (LIVE-34896).

- [#20713](https://github.com/LedgerHQ/ledger-live/pull/20713) [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay hero for the aggregated stablecoin balance. The `@features/flow-pay-card-balance` package gains props-only native empty and funded states, and both apps now share the portfolio aggregation through `aggregatePayCardBalance` (LIVE-34898). The hero is mounted at the top of the mobile Pay tab, which tracks `Page Pay` with the active `balance_filter` on view.

- [#20844](https://github.com/LedgerHQ/ledger-live/pull/20844) [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab "Add stablecoin" tile to the shared Deposit options dialog: pressing it opens the dialog and each option routes to its desktop flow (bank transfer, swap, buy) or the receive asset flow filtered to stablecoins.

  Render the deposit options as Lumen `ListItem` rows.

- [#20644](https://github.com/LedgerHQ/ledger-live/pull/20644) [`936abf0`](https://github.com/LedgerHQ/ledger-live/commit/936abf0cf6c579171aca42ac54e282f7a4c719a4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - chore(deps): bump Lumen design system to latest and migrate CSS to tailwind v4 style

- [#20815](https://github.com/LedgerHQ/ledger-live/pull/20815) [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

- [#20735](https://github.com/LedgerHQ/ledger-live/pull/20735) [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a stablecoin balance filter picker to the Pay card hero.

- [#20833](https://github.com/LedgerHQ/ledger-live/pull/20833) [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Require `utmContent` on `buildLargeScreenUpsellCtaLink` (breaking) and personalise the Backup Hub Recovery Key row for Nano S / SP / X with a warning and large-screen upsell CTA (LIVE-35484).

- [#20683](https://github.com/LedgerHQ/ledger-live/pull/20683) [`74de0e5`](https://github.com/LedgerHQ/ledger-live/commit/74de0e516d60d3aeb77951e3bed3b016ed9bc8b6) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Show only one portfolio Braze banner when the placement area is too narrow for two readable columns, using CSS container queries instead of JS width measurement.

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20684](https://github.com/LedgerHQ/ledger-live/pull/20684) [`ead65e0`](https://github.com/LedgerHQ/ledger-live/commit/ead65e03f9de9081e6b348b1ec89339fbf2a97fc) Thanks [@sarneijim](https://github.com/sarneijim)! - Update LNS upsell banner opt-in/opt-out copy and per-placement images to match mobile.

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20759](https://github.com/LedgerHQ/ledger-live/pull/20759) [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Contacts tracking hooks and move currency analytics resolution to platform-contacts.

- [#20420](https://github.com/LedgerHQ/ledger-live/pull/20420) [`494963b`](https://github.com/LedgerHQ/ledger-live/commit/494963b221aab3c71ad7d0d6564f94b870c51abb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix apps not being restored after a firmware update during Early Security Checks (ESC) in sync onboarding

- [#20856](https://github.com/LedgerHQ/ledger-live/pull/20856) [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "Add stablecoin" tile to the shared Deposit options overlay on both platforms: pressing it opens the dialog (desktop) or bottom sheet (mobile), and each option routes to its platform flow (bank transfer, swap, buy) or the receive flow filtered to stablecoins.

  Extract a shared `useDepositOptionsAdapter` hook in `@features/flow-pay-card-deposit` so desktop and mobile no longer duplicate the deposit options open/close state and props shape.

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20670](https://github.com/LedgerHQ/ledger-live/pull/20670) [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): show recipient action only when no bridge error

- [#20662](https://github.com/LedgerHQ/ledger-live/pull/20662) [`a736d28`](https://github.com/LedgerHQ/ledger-live/commit/a736d281098100088c757a6e422214705d972ec5) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Braze category content cards data layer on desktop, with single and bulk dismiss

- [#20703](https://github.com/LedgerHQ/ledger-live/pull/20703) [`c8d9b15`](https://github.com/LedgerHQ/ledger-live/commit/c8d9b15fe030d31725c72bd2e34a548005be00c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Surface ICP neuron staking on the account page: a stake banner for accounts that can afford a neuron
  but hold none, a balance summary footer showing total staked and total maturity, and Stake / Manage
  Neurons actions in the account header. The send flow now explains that the memo is protocol-derived
  for `create_neuron` and `increase_stake` instead of offering an editable field. The two neuron flow
  modals are registered but their bodies land separately.

- [#20789](https://github.com/LedgerHQ/ledger-live/pull/20789) [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.

- [#20803](https://github.com/LedgerHQ/ledger-live/pull/20803) [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1) Thanks [@sarneijim](https://github.com/sarneijim)! - Extend desktop always-on upsell banners to Nano SP and Nano X using the shared largeScreenUpsell audience and cooldown (LIVE-35397).

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20794](https://github.com/LedgerHQ/ledger-live/pull/20794) [`29347c9`](https://github.com/LedgerHQ/ledger-live/commit/29347c96e0d59fb015846bcf8e4eebe4e6676764) Thanks [@LL782](https://github.com/LL782)! - Replace the useTrack hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Every event keeps the properties it emits today: desktop reads the `drawer` name from the drawer context (or passes the custom-lock-screen constant directly) at each call site, and mobile's swap entry point rebuilds its router-derived `page` with `usePageNameFromRoute`.

- [#20731](https://github.com/LedgerHQ/ledger-live/pull/20731) [`69a5644`](https://github.com/LedgerHQ/ledger-live/commit/69a56440f3cd05dc93082de9afdf634c083b8532) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire Contacts feature analytics to the shared platform tracking contract.

- [#20795](https://github.com/LedgerHQ/ledger-live/pull/20795) [`b8370ec`](https://github.com/LedgerHQ/ledger-live/commit/b8370ec5c17b7b718aa059d65684c0b2479800ad) Thanks [@lewisd5](https://github.com/lewisd5)! - Add 1024 icon for the mac app store

- [#19581](https://github.com/LedgerHQ/ledger-live/pull/19581) [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): improve error context on datadog

- [#20740](https://github.com/LedgerHQ/ledger-live/pull/20740) [`542737c`](https://github.com/LedgerHQ/ledger-live/commit/542737c0015e3a8c5587c1496b5e08e6d7b4a6f2) Thanks [@ishaba](https://github.com/ishaba)! - fix(drawer): don't restore focus to a detached webview on close

- [#20806](https://github.com/LedgerHQ/ledger-live/pull/20806) [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the redundant `PayCard` prefix from the public API of `@features/flow-pay-card-balance`. The package path already scopes the feature, matching sibling flows (`FeatureTour`, `CardLogin`). The hero is now exported as `Balance`, with `useBalanceData`, `aggregateBalance`, `buildBalanceData` and `Balance*` types.

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20755](https://github.com/LedgerHQ/ledger-live/pull/20755) [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile stable balance filter (native select under the hero + queued bottom-sheet picker) and share the filter option and stablecoin logic between desktop and mobile

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

- [#20433](https://github.com/LedgerHQ/ledger-live/pull/20433) [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hand a perps deposit requested by the live app over to the wallet, and let the asset and account pickers word themselves after the role the selection plays: the account funds land in, the account they are taken from, or the perps pick that predates both

- [#20723](https://github.com/LedgerHQ/ledger-live/pull/20723) [`ab35763`](https://github.com/LedgerHQ/ledger-live/commit/ab3576361469edc987afbd8a9fa8f37748b3a2b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix the receive flow reporting a verification error (visible on Polkadot) while the address confirmation succeeded on the device: re-renders no longer start a concurrent `confirmAddress` call, and a late result can no longer overwrite a successful verification.

- [#20742](https://github.com/LedgerHQ/ledger-live/pull/20742) [`2d1bded`](https://github.com/LedgerHQ/ledger-live/commit/2d1bded50bc911a87dcf9924e483fbf15eefc379) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Refactor PayTab integration tests: merge describe blocks and use scoped within queries

- [#20668](https://github.com/LedgerHQ/ledger-live/pull/20668) [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): no contact screen in recipient screen

- [#20681](https://github.com/LedgerHQ/ledger-live/pull/20681) [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an "add contact" step to the send flow, opened from the recipient card, offering to create a new contact or to add the address to an existing one

- [#20645](https://github.com/LedgerHQ/ledger-live/pull/20645) [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared edit contact signer validation state with mocked signer mismatch handling and wire Desktop and Mobile contact edit flows.

- [#20788](https://github.com/LedgerHQ/ledger-live/pull/20788) [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Pay action tiles to the LWD Card screen: mount the shared ActionTiles view-model under the balance hero (Add stablecoin / Request / New payment), add per-tile `appearance` support to the ActionTiles component, and extract the PayTab action-tiles and balance labels into dedicated hooks.

- [#20796](https://github.com/LedgerHQ/ledger-live/pull/20796) [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwd): new send flow keeping the previous recipient after skip memo and edit

- [#20761](https://github.com/LedgerHQ/ledger-live/pull/20761) [`80fb6ae`](https://github.com/LedgerHQ/ledger-live/commit/80fb6ae7b7610635b065d0a9bf8526c935f7222f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Stabilize the PayTab balance integration test by asserting a settled funded state

- [#20732](https://github.com/LedgerHQ/ledger-live/pull/20732) [`0952b2e`](https://github.com/LedgerHQ/ledger-live/commit/0952b2eac8ba3340bbe8da97b2dd1dca245d7965) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Simplify Welcome analytics opt-in V2 gating to lwdAnalyticsOptInScreenV2 only

- [#20658](https://github.com/LedgerHQ/ledger-live/pull/20658) [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345) Thanks [@semeano](https://github.com/semeano)! - Zcash: add self transfer option on send modal

- [#20798](https://github.com/LedgerHQ/ledger-live/pull/20798) [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Name the Ironwood shielded operations and stop listing Zcash self-transfers.

  The Ironwood operation types were declared and given icons but never labelled, so a received or sent Ironwood transaction rendered its raw key in the history. They now carry the same labels, address cells and "Private (Ironwood)" transaction-type detail as the Sapling and Orchard ones.

  A shielded transaction that moved no value across the wallet boundary — every note landing on the account's own internal address — was also emitted as a history row of its own: no counterparty, a value of 0, and, when it was the shielded leg of a transparent-funded sweep, a duplicate of the transparent operation already listing that transaction. Such a transaction now produces an operation typed `NONE`, which keeps it in the account data while leaving it out of the lists. Its classification is unchanged, so the fee and balance logic that reads it is unaffected.

- [#20714](https://github.com/LedgerHQ/ledger-live/pull/20714) [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b) Thanks [@semeano](https://github.com/semeano)! - Show a warning in the send flow when the Zcash private balance is selected as source and funds were shielded in the last 15 minutes, explaining that recently shielded funds need confirmations and scanning before they are spendable

### Patch Changes

- Updated dependencies [[`061d873`](https://github.com/LedgerHQ/ledger-live/commit/061d873d0311a680d31771127c44e2ff219b65cd), [`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1), [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850), [`9accbb8`](https://github.com/LedgerHQ/ledger-live/commit/9accbb86a0495f8b7b69f0b923ab9f7a133f661d), [`841f7a0`](https://github.com/LedgerHQ/ledger-live/commit/841f7a0991ee0a8036f2144858b5d27d654910bc), [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed), [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb), [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1), [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530), [`55768ad`](https://github.com/LedgerHQ/ledger-live/commit/55768ad9f20ee24b2de8bbbe743b62b3b2e53355), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`45dc82e`](https://github.com/LedgerHQ/ledger-live/commit/45dc82e7aaf3dbc70a6fb89c673a342b28b3b12c), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f), [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b), [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a), [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4), [`84e3f9d`](https://github.com/LedgerHQ/ledger-live/commit/84e3f9d68bdf2e17281da9ba338745a51a90d822), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1), [`d43f03d`](https://github.com/LedgerHQ/ledger-live/commit/d43f03d2ab01e821677227cc2a76ee4ff5d0d7e7), [`21323c6`](https://github.com/LedgerHQ/ledger-live/commit/21323c66d04a25979a09b317014c6007d1c6b368), [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c), [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa), [`77dc4d9`](https://github.com/LedgerHQ/ledger-live/commit/77dc4d93ac293095a023efd41713b35b1c5974bf), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`a781abe`](https://github.com/LedgerHQ/ledger-live/commit/a781abec59454ec3bd1cbd4b74b67666aef73aab), [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641), [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`68448cd`](https://github.com/LedgerHQ/ledger-live/commit/68448cdf5c1fd5a2b6d912f4034d170dbabfc93f), [`d1a01e8`](https://github.com/LedgerHQ/ledger-live/commit/d1a01e81f58f2a31b009235b5c9893ff60e6f353), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f), [`42fca4a`](https://github.com/LedgerHQ/ledger-live/commit/42fca4a650043e297b2bcbdd098c6743126d7247), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd), [`4faf5cd`](https://github.com/LedgerHQ/ledger-live/commit/4faf5cdcd91e183777a275123bb7d5c3890adbce), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd), [`004c294`](https://github.com/LedgerHQ/ledger-live/commit/004c29415d581626e16548fb96f18f7006128c2e), [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130), [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432), [`fae92bf`](https://github.com/LedgerHQ/ledger-live/commit/fae92bf68e8ac167644aefa9e9d981a7b12cb23a), [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8), [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1), [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4), [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b), [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84), [`e0d646e`](https://github.com/LedgerHQ/ledger-live/commit/e0d646e62345e411e5c3323a8b8af7361db48802), [`e3e7804`](https://github.com/LedgerHQ/ledger-live/commit/e3e7804bff59e1d6e28ec5c94fcbb421ddbbaf71), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`96ac61e`](https://github.com/LedgerHQ/ledger-live/commit/96ac61e367eae1da998547f00ae144e7c3947f2b), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6), [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345), [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08), [`4cc31ec`](https://github.com/LedgerHQ/ledger-live/commit/4cc31ec90cae0a36663b35da3a569222e8e8efdf), [`02ddf7e`](https://github.com/LedgerHQ/ledger-live/commit/02ddf7e9d7542d6f0fcdb18d7f9461c37a8b8ce1), [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b)]:
  - @ledgerhq/live-common@37.3.0-next.0
  - @features/flow-pay-card-balance@0.2.0-next.0
  - @features/flow-pay-card-deposit@0.2.0-next.0
  - @ledgerhq/coin-zcash@0.4.0-next.0
  - @shared/feature-flags@0.19.0-next.0
  - @domain/api-aggregated-assets@0.4.0-next.0
  - @features/platform-contacts@0.3.0-next.0
  - @domain/entity-contact@0.7.0-next.0
  - @features/flow-contacts@0.7.0-next.0
  - @ledgerhq/live-dmk-shared@0.31.0-next.0
  - @features/flow-large-screen-upsell@1.0.0-next.0
  - @ledgerhq/ledger-auth@0.4.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0-next.0
  - @shared/auth@0.5.0-next.0
  - @shared/api-services@0.4.0-next.0
  - @features/platform-card@0.2.0-next.0
  - @shared/env@0.3.0-next.0
  - @features/flow-contacts-add-contact@0.3.0-next.0
  - @ledgerhq/types-devices@7.0.0-next.0
  - @ledgerhq/coin-concordium@1.0.0-next.0
  - @ledgerhq/coin-filecoin@2.0.0-next.0
  - @ledgerhq/coin-cardano@1.0.0-next.0
  - @ledgerhq/coin-canton@1.0.0-next.0
  - @ledgerhq/coin-casper@3.0.0-next.0
  - @ledgerhq/coin-cosmos@1.0.0-next.0
  - @ledgerhq/coin-evm@5.0.0-next.0
  - @features/flow-contacts-introduction@0.2.0-next.0
  - @features/flow-pay-card-feature-tour@0.3.0-next.0
  - @features/flow-pay-card-auth@0.3.0-next.0
  - @devtools/bindings@0.4.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @features/platform-aggregated-assets@0.4.0-next.0
  - @devtools/transport-panel@0.5.0-next.0
  - @devtools/wire@0.4.0-next.0
  - @domain/entity-currency-token@0.5.0-next.0
  - @domain/api-currency-token@0.5.0-next.0
  - @ledgerhq/asset-detail@0.11.1-next.0
  - @ledgerhq/live-dmk-desktop@0.20.7-next.0
  - @ledgerhq/coin-bitcoin@0.51.1-next.0
  - @features/platform-currencies@0.6.1-next.0
  - @features/platform-feature-flags@0.6.6-next.0
  - @ledgerhq/asset-aggregation@0.13.1-next.0
  - @domain/api-altcoins-sentiment@0.3.2-next.0
  - @domain/api-currency-fiat@0.4.1-next.0
  - @domain/api-market-sentiment@0.3.2-next.0
  - @domain/api-push-devices@0.2.2-next.0
  - @features/platform-env@0.2.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.5-next.0
  - @ledgerhq/wallet-analytics@0.3.4-next.0
  - @ledgerhq/wallet-pnl@0.7.7-next.0
  - @ledgerhq/device-intent@6.0.0-next.0
  - @ledgerhq/live-countervalues@0.24.3-next.0
  - @ledgerhq/live-countervalues-react@0.16.7-next.0
  - @ledgerhq/live-wallet@1.0.1-next.0
  - @ledgerhq/domain-service@1.8.15-next.0
  - @devtools/shell@0.8.1-next.0
  - @domain/entity-currency@0.4.1-next.0
  - @features/flow-analytics-consent@0.2.2-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 4.16.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20315](https://github.com/LedgerHQ/ledger-live/pull/20315) [`4b73f81`](https://github.com/LedgerHQ/ledger-live/commit/4b73f81aca25a92178850b3f7ac7519a7efcac67) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Portfolio upsell banner and Braze content cards can now coexist on Portfolio (Mobile: shared carousel; Desktop: side-by-side grid when Braze placement is enabled, otherwise upsell stacked above the Braze carousel).

- [#20624](https://github.com/LedgerHQ/ledger-live/pull/20624) [`e74a4a3`](https://github.com/LedgerHQ/ledger-live/commit/e74a4a391dd1540c9d09f3e9e86d250422a0df65) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget desktop off the dada-client shims onto @features/platform-aggregated-assets and @domain/api-aggregated-assets

- [#20474](https://github.com/LedgerHQ/ledger-live/pull/20474) [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713) Thanks [@deepyjr](https://github.com/deepyjr)! - Replace the Desktop address name clear action with a help tooltip.

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20266](https://github.com/LedgerHQ/ledger-live/pull/20266) [`626c858`](https://github.com/LedgerHQ/ledger-live/commit/626c858672c15198f2315e260f6e033951782c74) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Upgrade analytics consent QA debug screen to scenario parity

- [#20585](https://github.com/LedgerHQ/ledger-live/pull/20585) [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Require signer confirmation before opening address delete confirmation in Contacts.

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

  `@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
  `src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
  `@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
  `@domain/entity-recent-addresses`. What remains is the account list sync module (`src/accounts/`)
  plus `src/walletSyncComposition.ts`, which assembles the sync modules into the wallet-sync schema.

  Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
  slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
  and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
  `@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
  platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`d989af2`](https://github.com/LedgerHQ/ledger-live/commit/d989af214ff55318633fe8756f64bd60e3e4c100) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add desktop Device Intent Executor context initializer.

- [#20520](https://github.com/LedgerHQ/ledger-live/pull/20520) [`0db9cd3`](https://github.com/LedgerHQ/ledger-live/commit/0db9cd33eeb0175e126046f3113f0bd769155b25) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor shell tracking (lifecycle, errors, dialog dismiss).

- [#20608](https://github.com/LedgerHQ/ledger-live/pull/20608) [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20646](https://github.com/LedgerHQ/ledger-live/pull/20646) [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): add recipient contact card to the send flow

- [#20439](https://github.com/LedgerHQ/ledger-live/pull/20439) [`65beee5`](https://github.com/LedgerHQ/ledger-live/commit/65beee51d8d203b8d3d0a850546f6866d3cebb2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts currency selection list so it fills the modal height.

- [#20454](https://github.com/LedgerHQ/ledger-live/pull/20454) [`e1b63ff`](https://github.com/LedgerHQ/ledger-live/commit/e1b63ff4acf13bbb30ddbd7e95627797b5462147) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): bip21 and eip681 scan for lwd

- [#20455](https://github.com/LedgerHQ/ledger-live/pull/20455) [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8) Thanks [@deepyjr](https://github.com/deepyjr)! - Add invalid and sanctioned address feedback to the Desktop Contacts flow.

- [#20641](https://github.com/LedgerHQ/ledger-live/pull/20641) [`1dde844`](https://github.com/LedgerHQ/ledger-live/commit/1dde844ac3bbd94659076016e69d3e38ed79ebe0) Thanks [@semeano](https://github.com/semeano)! - Add a warning on Zcash accounts that the private balance excludes Sapling and Orchard shielded funds.

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20408](https://github.com/LedgerHQ/ledger-live/pull/20408) [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire send, edit, and delete actions on desktop contact address detail.

- [#20557](https://github.com/LedgerHQ/ledger-live/pull/20557) [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts address edit signer mismatch error from shared flow state.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#20643](https://github.com/LedgerHQ/ledger-live/pull/20643) [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): validate custom fees against native balance for evm tokens

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20638](https://github.com/LedgerHQ/ledger-live/pull/20638) [`120d4eb`](https://github.com/LedgerHQ/ledger-live/commit/120d4eb87fbfe438e56c735e8d34bf6f2a94139c) Thanks [@sarneijim](https://github.com/sarneijim)! - Use full-width LNS upsell MediaBanner in notification center

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20551](https://github.com/LedgerHQ/ledger-live/pull/20551) [`488217f`](https://github.com/LedgerHQ/ledger-live/commit/488217fe52d77761bc18b5f0d1a4c9908e6883cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the payCard slice on desktop: save and restore only { hasSeenFeatureTour } so the Pay feature tour does not reappear after restarting the app

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20518](https://github.com/LedgerHQ/ledger-live/pull/20518) [`ce46179`](https://github.com/LedgerHQ/ledger-live/commit/ce461796d908185e5ea36b630ba71ff9ef8118b8) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refactoring mvvm recipient screen

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20473](https://github.com/LedgerHQ/ledger-live/pull/20473) [`73948c9`](https://github.com/LedgerHQ/ledger-live/commit/73948c9cfdecd63eee106a9ed9dae1495a1198bd) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix sanctionned ens address check

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20371](https://github.com/LedgerHQ/ledger-live/pull/20371) [`0f42c42`](https://github.com/LedgerHQ/ledger-live/commit/0f42c42e9d83aee52414f2e962805480629802f2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mocked confirmation and saved address rendering to Desktop Contacts.

- [#20333](https://github.com/LedgerHQ/ledger-live/pull/20333) [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Inline large-screen upsell modal entity state into the flow package

- [#20471](https://github.com/LedgerHQ/ledger-live/pull/20471) [`3aefd3b`](https://github.com/LedgerHQ/ledger-live/commit/3aefd3b23301f693bb5c8b8533c796a9d8fdefe7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): check sanctions for token recipient addresses

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#20508](https://github.com/LedgerHQ/ledger-live/pull/20508) [`e7c941f`](https://github.com/LedgerHQ/ledger-live/commit/e7c941fbac63f03938fa43f25523e3a6cb33c158) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract ghost-click guard logic to shared utility in EditName dialog

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

- [#20597](https://github.com/LedgerHQ/ledger-live/pull/20597) [`8c97aa1`](https://github.com/LedgerHQ/ledger-live/commit/8c97aa11f96af73f13df2416bd603f6cd0f12a30) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Track Device Intent Executor Connect App states on desktop.

- [#20552](https://github.com/LedgerHQ/ledger-live/pull/20552) [`e499f00`](https://github.com/LedgerHQ/ledger-live/commit/e499f0057dded9b25dfed8ce5ec6f58312906537) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor Connect Device tracking.

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9), [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f), [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713), [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad), [`1de30a9`](https://github.com/LedgerHQ/ledger-live/commit/1de30a98a7a3db27f42de0c9608e1d0be748a10e), [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6), [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604), [`9ef4440`](https://github.com/LedgerHQ/ledger-live/commit/9ef44402ece2207268361bfe4e2af8fbd1396670), [`5297c79`](https://github.com/LedgerHQ/ledger-live/commit/5297c79823362f5e7584886c8193808988ec46fc), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8), [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6), [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd), [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6), [`5bdffd5`](https://github.com/LedgerHQ/ledger-live/commit/5bdffd5b9590cc65e650fb0d5b28a5fbf2477d00), [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3), [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d), [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f), [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9), [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821), [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7), [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec), [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`78ebc73`](https://github.com/LedgerHQ/ledger-live/commit/78ebc736177e9e751f4d7a7a6a3fae97a1913c1f), [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923), [`b0e81d2`](https://github.com/LedgerHQ/ledger-live/commit/b0e81d2edc7c40e2c81236ea372370859d05d0bc), [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c), [`5171877`](https://github.com/LedgerHQ/ledger-live/commit/5171877faeb78ab9efbbf8c20b9fa6697e61872f), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-bitcoin@0.51.0
  - @ledgerhq/coin-canton@0.33.0
  - @ledgerhq/coin-cardano@0.34.0
  - @ledgerhq/coin-casper@2.19.0
  - @ledgerhq/coin-concordium@0.20.0
  - @ledgerhq/coin-cosmos@0.43.0
  - @ledgerhq/coin-evm@4.10.0
  - @ledgerhq/coin-filecoin@1.32.0
  - @ledgerhq/live-common@37.2.0
  - @features/flow-contacts@0.6.0
  - @features/platform-contacts@0.2.0
  - @features/flow-contacts-add-contact@0.2.0
  - @features/flow-pay-card-auth@0.2.0
  - @domain/entity-contact@0.6.0
  - @ledgerhq/ledger-key-ring-protocol@0.19.0
  - @shared/cloud-sync@0.1.0
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @domain/entity-currency-fiat@0.4.0
  - @ledgerhq/live-wallet@1.0.0
  - @domain/entity-wallet-sync@0.1.0
  - @ledgerhq/coin-zcash@0.3.0
  - @domain/api-currency-fiat@0.4.0
  - @domain/api-currency-token@0.4.0
  - @domain/entity-account-name@0.2.0
  - @domain/entity-client-identity@0.2.0
  - @domain/entity-currency@0.4.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/platform-aggregated-assets@0.3.0
  - @features/platform-currencies@0.6.0
  - @features/platform-env@0.2.0
  - @features/platform-style@0.2.0
  - @shared/api-services@0.3.0
  - @shared/auth@0.4.0
  - @shared/feature-flags@0.18.0
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @features/flow-large-screen-upsell@0.5.0
  - @domain/api-aggregated-assets@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @ledgerhq/hw-transport-http@6.37.0
  - @ledgerhq/types-devices@6.32.0
  - @domain/entity-pay-card@0.3.0
  - @devtools/bindings@0.3.0
  - @devtools/transport-panel@0.4.0
  - @devtools/shell@0.8.0
  - @ledgerhq/live-dmk-shared@0.30.0
  - @ledgerhq/asset-detail@0.11.0
  - @ledgerhq/asset-aggregation@0.13.0
  - @ledgerhq/live-dmk-desktop@0.20.6
  - @features/platform-wallet-sync@0.1.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-analytics@0.3.3
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/wallet-pnl@0.7.6
  - @domain/entity-analytics-consent@0.2.1
  - @domain/api-push-devices@0.2.1
  - @domain/api-altcoins-sentiment@0.3.1
  - @domain/api-market-sentiment@0.3.1
  - @domain/entity-recent-addresses@0.1.1
  - @features/platform-feature-flags@0.6.5
  - @devtools/wire@0.3.1
  - @ledgerhq/domain-service@1.8.14
  - @ledgerhq/live-countervalues@0.24.2
  - @ledgerhq/live-countervalues-react@0.16.6
  - @ledgerhq/hw-transport-vault@1.7.8
  - @ledgerhq/device-intent@5.0.0
  - @domain/api-pay-card@0.2.1
  - @features/flow-analytics-consent@0.2.1

## 4.16.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20315](https://github.com/LedgerHQ/ledger-live/pull/20315) [`4b73f81`](https://github.com/LedgerHQ/ledger-live/commit/4b73f81aca25a92178850b3f7ac7519a7efcac67) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Portfolio upsell banner and Braze content cards can now coexist on Portfolio (Mobile: shared carousel; Desktop: side-by-side grid when Braze placement is enabled, otherwise upsell stacked above the Braze carousel).

- [#20624](https://github.com/LedgerHQ/ledger-live/pull/20624) [`e74a4a3`](https://github.com/LedgerHQ/ledger-live/commit/e74a4a391dd1540c9d09f3e9e86d250422a0df65) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget desktop off the dada-client shims onto @features/platform-aggregated-assets and @domain/api-aggregated-assets

- [#20474](https://github.com/LedgerHQ/ledger-live/pull/20474) [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713) Thanks [@deepyjr](https://github.com/deepyjr)! - Replace the Desktop address name clear action with a help tooltip.

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20266](https://github.com/LedgerHQ/ledger-live/pull/20266) [`626c858`](https://github.com/LedgerHQ/ledger-live/commit/626c858672c15198f2315e260f6e033951782c74) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Upgrade analytics consent QA debug screen to scenario parity

- [#20585](https://github.com/LedgerHQ/ledger-live/pull/20585) [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Require signer confirmation before opening address delete confirmation in Contacts.

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

  `@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
  `src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
  `@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
  `@domain/entity-recent-addresses`. What remains is the account list sync module (`src/accounts/`)
  plus `src/walletSyncComposition.ts`, which assembles the sync modules into the wallet-sync schema.

  Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
  slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
  and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
  `@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
  platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`d989af2`](https://github.com/LedgerHQ/ledger-live/commit/d989af214ff55318633fe8756f64bd60e3e4c100) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add desktop Device Intent Executor context initializer.

- [#20520](https://github.com/LedgerHQ/ledger-live/pull/20520) [`0db9cd3`](https://github.com/LedgerHQ/ledger-live/commit/0db9cd33eeb0175e126046f3113f0bd769155b25) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor shell tracking (lifecycle, errors, dialog dismiss).

- [#20608](https://github.com/LedgerHQ/ledger-live/pull/20608) [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20646](https://github.com/LedgerHQ/ledger-live/pull/20646) [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): add recipient contact card to the send flow

- [#20439](https://github.com/LedgerHQ/ledger-live/pull/20439) [`65beee5`](https://github.com/LedgerHQ/ledger-live/commit/65beee51d8d203b8d3d0a850546f6866d3cebb2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts currency selection list so it fills the modal height.

- [#20454](https://github.com/LedgerHQ/ledger-live/pull/20454) [`e1b63ff`](https://github.com/LedgerHQ/ledger-live/commit/e1b63ff4acf13bbb30ddbd7e95627797b5462147) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): bip21 and eip681 scan for lwd

- [#20455](https://github.com/LedgerHQ/ledger-live/pull/20455) [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8) Thanks [@deepyjr](https://github.com/deepyjr)! - Add invalid and sanctioned address feedback to the Desktop Contacts flow.

- [#20641](https://github.com/LedgerHQ/ledger-live/pull/20641) [`1dde844`](https://github.com/LedgerHQ/ledger-live/commit/1dde844ac3bbd94659076016e69d3e38ed79ebe0) Thanks [@semeano](https://github.com/semeano)! - Add a warning on Zcash accounts that the private balance excludes Sapling and Orchard shielded funds.

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20408](https://github.com/LedgerHQ/ledger-live/pull/20408) [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire send, edit, and delete actions on desktop contact address detail.

- [#20557](https://github.com/LedgerHQ/ledger-live/pull/20557) [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts address edit signer mismatch error from shared flow state.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#20643](https://github.com/LedgerHQ/ledger-live/pull/20643) [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): validate custom fees against native balance for evm tokens

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20638](https://github.com/LedgerHQ/ledger-live/pull/20638) [`120d4eb`](https://github.com/LedgerHQ/ledger-live/commit/120d4eb87fbfe438e56c735e8d34bf6f2a94139c) Thanks [@sarneijim](https://github.com/sarneijim)! - Use full-width LNS upsell MediaBanner in notification center

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20551](https://github.com/LedgerHQ/ledger-live/pull/20551) [`488217f`](https://github.com/LedgerHQ/ledger-live/commit/488217fe52d77761bc18b5f0d1a4c9908e6883cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the payCard slice on desktop: save and restore only { hasSeenFeatureTour } so the Pay feature tour does not reappear after restarting the app

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20518](https://github.com/LedgerHQ/ledger-live/pull/20518) [`ce46179`](https://github.com/LedgerHQ/ledger-live/commit/ce461796d908185e5ea36b630ba71ff9ef8118b8) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refactoring mvvm recipient screen

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20473](https://github.com/LedgerHQ/ledger-live/pull/20473) [`73948c9`](https://github.com/LedgerHQ/ledger-live/commit/73948c9cfdecd63eee106a9ed9dae1495a1198bd) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix sanctionned ens address check

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20371](https://github.com/LedgerHQ/ledger-live/pull/20371) [`0f42c42`](https://github.com/LedgerHQ/ledger-live/commit/0f42c42e9d83aee52414f2e962805480629802f2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mocked confirmation and saved address rendering to Desktop Contacts.

- [#20333](https://github.com/LedgerHQ/ledger-live/pull/20333) [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Inline large-screen upsell modal entity state into the flow package

- [#20471](https://github.com/LedgerHQ/ledger-live/pull/20471) [`3aefd3b`](https://github.com/LedgerHQ/ledger-live/commit/3aefd3b23301f693bb5c8b8533c796a9d8fdefe7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): check sanctions for token recipient addresses

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#20508](https://github.com/LedgerHQ/ledger-live/pull/20508) [`e7c941f`](https://github.com/LedgerHQ/ledger-live/commit/e7c941fbac63f03938fa43f25523e3a6cb33c158) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract ghost-click guard logic to shared utility in EditName dialog

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

- [#20597](https://github.com/LedgerHQ/ledger-live/pull/20597) [`8c97aa1`](https://github.com/LedgerHQ/ledger-live/commit/8c97aa11f96af73f13df2416bd603f6cd0f12a30) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Track Device Intent Executor Connect App states on desktop.

- [#20552](https://github.com/LedgerHQ/ledger-live/pull/20552) [`e499f00`](https://github.com/LedgerHQ/ledger-live/commit/e499f0057dded9b25dfed8ce5ec6f58312906537) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor Connect Device tracking.

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9), [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f), [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713), [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad), [`1de30a9`](https://github.com/LedgerHQ/ledger-live/commit/1de30a98a7a3db27f42de0c9608e1d0be748a10e), [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6), [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604), [`9ef4440`](https://github.com/LedgerHQ/ledger-live/commit/9ef44402ece2207268361bfe4e2af8fbd1396670), [`5297c79`](https://github.com/LedgerHQ/ledger-live/commit/5297c79823362f5e7584886c8193808988ec46fc), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8), [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6), [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd), [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6), [`5bdffd5`](https://github.com/LedgerHQ/ledger-live/commit/5bdffd5b9590cc65e650fb0d5b28a5fbf2477d00), [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3), [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d), [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f), [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9), [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821), [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7), [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec), [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`78ebc73`](https://github.com/LedgerHQ/ledger-live/commit/78ebc736177e9e751f4d7a7a6a3fae97a1913c1f), [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923), [`b0e81d2`](https://github.com/LedgerHQ/ledger-live/commit/b0e81d2edc7c40e2c81236ea372370859d05d0bc), [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c), [`5171877`](https://github.com/LedgerHQ/ledger-live/commit/5171877faeb78ab9efbbf8c20b9fa6697e61872f), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-bitcoin@0.51.0-next.0
  - @ledgerhq/coin-canton@0.33.0-next.0
  - @ledgerhq/coin-cardano@0.34.0-next.0
  - @ledgerhq/coin-casper@2.19.0-next.0
  - @ledgerhq/coin-concordium@0.20.0-next.0
  - @ledgerhq/coin-cosmos@0.43.0-next.0
  - @ledgerhq/coin-evm@4.10.0-next.0
  - @ledgerhq/coin-filecoin@1.32.0-next.0
  - @ledgerhq/live-common@37.2.0-next.0
  - @features/flow-contacts@0.6.0-next.0
  - @features/platform-contacts@0.2.0-next.0
  - @features/flow-contacts-add-contact@0.2.0-next.0
  - @features/flow-pay-card-auth@0.2.0-next.0
  - @domain/entity-contact@0.6.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.19.0-next.0
  - @shared/cloud-sync@0.1.0-next.0
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @domain/entity-currency-fiat@0.4.0-next.0
  - @ledgerhq/live-wallet@1.0.0-next.0
  - @domain/entity-wallet-sync@0.1.0-next.0
  - @ledgerhq/coin-zcash@0.3.0-next.0
  - @domain/api-currency-fiat@0.4.0-next.0
  - @domain/api-currency-token@0.4.0-next.0
  - @domain/entity-account-name@0.2.0-next.0
  - @domain/entity-client-identity@0.2.0-next.0
  - @domain/entity-currency@0.4.0-next.0
  - @features/flow-fear-and-greed@0.3.0-next.0
  - @features/platform-aggregated-assets@0.3.0-next.0
  - @features/platform-currencies@0.6.0-next.0
  - @features/platform-env@0.2.0-next.0
  - @features/platform-style@0.2.0-next.0
  - @shared/api-services@0.3.0-next.0
  - @shared/auth@0.4.0-next.0
  - @shared/feature-flags@0.18.0-next.0
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @features/flow-large-screen-upsell@0.5.0-next.0
  - @domain/api-aggregated-assets@0.3.0-next.0
  - @domain/entity-interest-rate@0.3.0-next.0
  - @ledgerhq/hw-transport-http@6.37.0-next.0
  - @ledgerhq/types-devices@6.32.0-next.0
  - @domain/entity-pay-card@0.3.0-next.0
  - @devtools/bindings@0.3.0-next.0
  - @devtools/transport-panel@0.4.0-next.0
  - @devtools/shell@0.8.0-next.0
  - @ledgerhq/live-dmk-shared@0.30.0-next.0
  - @ledgerhq/asset-detail@0.11.0-next.0
  - @ledgerhq/asset-aggregation@0.13.0-next.0
  - @ledgerhq/live-dmk-desktop@0.20.6-next.0
  - @features/platform-wallet-sync@0.1.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-analytics@0.3.3-next.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/wallet-pnl@0.7.6-next.0
  - @domain/entity-analytics-consent@0.2.1-next.0
  - @domain/api-push-devices@0.2.1-next.0
  - @domain/api-altcoins-sentiment@0.3.1-next.0
  - @domain/api-market-sentiment@0.3.1-next.0
  - @domain/entity-recent-addresses@0.1.1-next.0
  - @features/platform-feature-flags@0.6.5-next.0
  - @devtools/wire@0.3.1-next.0
  - @ledgerhq/domain-service@1.8.14-next.0
  - @ledgerhq/live-countervalues@0.24.2-next.0
  - @ledgerhq/live-countervalues-react@0.16.6-next.0
  - @ledgerhq/hw-transport-vault@1.7.8-next.0
  - @ledgerhq/device-intent@5.0.0-next.0
  - @domain/api-pay-card@0.2.1-next.0
  - @features/flow-analytics-consent@0.2.1-next.0

## 4.15.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

- [#20061](https://github.com/LedgerHQ/ledger-live/pull/20061) [`40ba85b`](https://github.com/LedgerHQ/ledger-live/commit/40ba85b823ed657753ee607d4ab16d1d63b18c45) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Scrub wallet addresses and account IDs from Datadog RUM events

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

- [#20318](https://github.com/LedgerHQ/ledger-live/pull/20318) [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189) Thanks [@deepyjr](https://github.com/deepyjr)! - Block sanctioned addresses in the Contacts add-address flow

- [#20263](https://github.com/LedgerHQ/ledger-live/pull/20263) [`6976ff3`](https://github.com/LedgerHQ/ledger-live/commit/6976ff343fb8d999e30cf0963732adb56078e6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire desktop analytics consent renewal to shared policyVersion major/minor decision flow

- [#19989](https://github.com/LedgerHQ/ledger-live/pull/19989) [`78d84d4`](https://github.com/LedgerHQ/ledger-live/commit/78d84d44bf18edc337d73554207e9df1002b0f36) Thanks [@deepyjr](https://github.com/deepyjr)! - Prevent Asset Detail history from stacking after Buy and Sell live app navigation

- [#20388](https://github.com/LedgerHQ/ledger-live/pull/20388) [`c0154aa`](https://github.com/LedgerHQ/ledger-live/commit/c0154aaa356e575f563717bea914800469e52c9f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Fix mismatched Sync Onboarding header background against the page canvas

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20197](https://github.com/LedgerHQ/ledger-live/pull/20197) [`507e450`](https://github.com/LedgerHQ/ledger-live/commit/507e450759f95ed42d5ce7f452825b89dba1df7f) Thanks [@ysitbon](https://github.com/ysitbon)! - Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.

- [#20078](https://github.com/LedgerHQ/ledger-live/pull/20078) [`baea85e`](https://github.com/LedgerHQ/ledger-live/commit/baea85eab9ee1a0a2068f05176bdcb960a3c39af) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Generic Awareness Modal cascade on mobile and add Braze content card logging on mobile and desktop

- [#20288](https://github.com/LedgerHQ/ledger-live/pull/20288) [`5d139b9`](https://github.com/LedgerHQ/ledger-live/commit/5d139b9f50bbfe2f8c7d6929ced877400047b9ed) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix typecheck errors in desktop test files

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20243](https://github.com/LedgerHQ/ledger-live/pull/20243) [`63aa4b6`](https://github.com/LedgerHQ/ledger-live/commit/63aa4b638ff662a53a4a7f41e1bade6e026a208b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove legacy translation keys orphaned by the Wallet 4.0 Q1 cleanup (sidebar/topbar rewrite, legacy dashboard & empty states, Help modal, receive step-options and the sync activity indicator).

- [#20317](https://github.com/LedgerHQ/ledger-live/pull/20317) [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc) Thanks [@deepyjr](https://github.com/deepyjr)! - Render the Desktop Contacts address label step and move shared add-address flow content into the Contacts Flow feature.

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20181](https://github.com/LedgerHQ/ledger-live/pull/20181) [`34a8455`](https://github.com/LedgerHQ/ledger-live/commit/34a8455a46382e5663e46b822f54e80530e23533) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a QR code scanner to the new send flow recipient field: the QR icon shows while the field is empty and is replaced by the clear button once the user types

- [#20496](https://github.com/LedgerHQ/ledger-live/pull/20496) [`aa367b0`](https://github.com/LedgerHQ/ledger-live/commit/aa367b0d4c042b12c7cd57c69910774062d29422) Thanks [@desirendr](https://github.com/desirendr)! - LWD 4.15.0 release notes

- [#20252](https://github.com/LedgerHQ/ledger-live/pull/20252) [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Me contact detail by default with Me display-name formatting and external address CTA.

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20267](https://github.com/LedgerHQ/ledger-live/pull/20267) [`956d4a1`](https://github.com/LedgerHQ/ledger-live/commit/956d4a152187e6853b23fd72ab24e3f66c6c233d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add debug WebSocket transport to DevTools relay

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20224](https://github.com/LedgerHQ/ledger-live/pull/20224) [`f7e013a`](https://github.com/LedgerHQ/ledger-live/commit/f7e013a174e95461bedbd6cc2754134fbbf791b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an info disclaimer next to the recipient address in the new send flow, reminding users to verify the full address on their Ledger device

- [#20264](https://github.com/LedgerHQ/ledger-live/pull/20264) [`725b0dd`](https://github.com/LedgerHQ/ledger-live/commit/725b0ddf0c775bdbf9fa775adcfac2d8e4c56e9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(aleo): view key warning copy update

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20230](https://github.com/LedgerHQ/ledger-live/pull/20230) [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Desktop Contacts address entry flow with embedded currency selection.

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

- [#20217](https://github.com/LedgerHQ/ledger-live/pull/20217) [`9ebc505`](https://github.com/LedgerHQ/ledger-live/commit/9ebc505868dbb6f4155a5985ca87fc4d225c437b) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable dialog flow and an embeddable Modular Dialog presentation.

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`674ae62`](https://github.com/LedgerHQ/ledger-live/commit/674ae62c25b0db62dd789a31956b776466f39d4d), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242), [`f7997c9`](https://github.com/LedgerHQ/ledger-live/commit/f7997c90fe24c24a075b51a0f37db1c8e3eeffcd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189), [`248d24e`](https://github.com/LedgerHQ/ledger-live/commit/248d24e8fb1671878983ad90b0b47281e6773990), [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a), [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395), [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0), [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0), [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3), [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc), [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc), [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258), [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c), [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199), [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f), [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d), [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a), [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`94f7c85`](https://github.com/LedgerHQ/ledger-live/commit/94f7c85211c1947302e52fe9165027b83e202823), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274), [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00), [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd)]:
  - @ledgerhq/coin-bitcoin@0.50.0
  - @ledgerhq/coin-canton@0.32.0
  - @ledgerhq/coin-cardano@0.33.0
  - @ledgerhq/coin-casper@2.18.0
  - @ledgerhq/coin-concordium@0.19.0
  - @ledgerhq/coin-cosmos@0.42.0
  - @ledgerhq/coin-evm@4.9.0
  - @ledgerhq/coin-filecoin@1.31.0
  - @ledgerhq/live-common@37.1.0
  - @ledgerhq/coin-zcash@0.2.0
  - @features/flow-contacts@0.5.0
  - @shared/api-services@0.2.0
  - @domain/api-altcoins-sentiment@0.3.0
  - @domain/api-market-sentiment@0.3.0
  - @domain/api-currency-token@0.3.0
  - @domain/api-currency-fiat@0.3.0
  - @domain/api-push-devices@0.2.0
  - @features/platform-currencies@0.5.0
  - @domain/entity-contact@0.5.0
  - @shared/feature-flags@0.17.0
  - @domain/entity-analytics-consent@0.2.0
  - @ledgerhq/types-live@6.118.0
  - @shared/auth@0.3.0
  - @features/flow-analytics-consent@0.2.0
  - @devtools/transport-panel@0.3.0
  - @devtools/shell@0.7.0
  - @devtools/wire@0.3.0
  - @shared/env@0.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0
  - @domain/entity-currency-crypto@0.9.0
  - @ledgerhq/asset-detail@0.10.0
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/live-dmk-desktop@0.20.5
  - @devtools/bindings@0.2.3
  - @features/flow-large-screen-upsell@0.4.1
  - @features/platform-feature-flags@0.6.4
  - @ledgerhq/asset-aggregation@0.12.2
  - @ledgerhq/domain-service@1.8.13
  - @ledgerhq/live-countervalues@0.24.1
  - @ledgerhq/live-countervalues-react@0.16.5
  - @ledgerhq/live-wallet@0.30.2
  - @ledgerhq/wallet-analytics@0.3.2
  - @ledgerhq/wallet-pnl@0.7.5
  - @features/platform-env@0.1.2
  - @ledgerhq/live-dmk-speculos@0.10.4
  - @domain/entity-currency@0.3.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0

## 4.15.0-next.1

### Minor Changes

- [#20496](https://github.com/LedgerHQ/ledger-live/pull/20496) [`aa367b0`](https://github.com/LedgerHQ/ledger-live/commit/aa367b0d4c042b12c7cd57c69910774062d29422) Thanks [@desirendr](https://github.com/desirendr)! - LWD 4.15.0 release notes

## 4.15.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

- [#20061](https://github.com/LedgerHQ/ledger-live/pull/20061) [`40ba85b`](https://github.com/LedgerHQ/ledger-live/commit/40ba85b823ed657753ee607d4ab16d1d63b18c45) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Scrub wallet addresses and account IDs from Datadog RUM events

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

- [#20318](https://github.com/LedgerHQ/ledger-live/pull/20318) [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189) Thanks [@deepyjr](https://github.com/deepyjr)! - Block sanctioned addresses in the Contacts add-address flow

- [#20263](https://github.com/LedgerHQ/ledger-live/pull/20263) [`6976ff3`](https://github.com/LedgerHQ/ledger-live/commit/6976ff343fb8d999e30cf0963732adb56078e6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire desktop analytics consent renewal to shared policyVersion major/minor decision flow

- [#19989](https://github.com/LedgerHQ/ledger-live/pull/19989) [`78d84d4`](https://github.com/LedgerHQ/ledger-live/commit/78d84d44bf18edc337d73554207e9df1002b0f36) Thanks [@deepyjr](https://github.com/deepyjr)! - Prevent Asset Detail history from stacking after Buy and Sell live app navigation

- [#20388](https://github.com/LedgerHQ/ledger-live/pull/20388) [`c0154aa`](https://github.com/LedgerHQ/ledger-live/commit/c0154aaa356e575f563717bea914800469e52c9f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Fix mismatched Sync Onboarding header background against the page canvas

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20197](https://github.com/LedgerHQ/ledger-live/pull/20197) [`507e450`](https://github.com/LedgerHQ/ledger-live/commit/507e450759f95ed42d5ce7f452825b89dba1df7f) Thanks [@ysitbon](https://github.com/ysitbon)! - Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.

- [#20078](https://github.com/LedgerHQ/ledger-live/pull/20078) [`baea85e`](https://github.com/LedgerHQ/ledger-live/commit/baea85eab9ee1a0a2068f05176bdcb960a3c39af) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Generic Awareness Modal cascade on mobile and add Braze content card logging on mobile and desktop

- [#20288](https://github.com/LedgerHQ/ledger-live/pull/20288) [`5d139b9`](https://github.com/LedgerHQ/ledger-live/commit/5d139b9f50bbfe2f8c7d6929ced877400047b9ed) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix typecheck errors in desktop test files

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20243](https://github.com/LedgerHQ/ledger-live/pull/20243) [`63aa4b6`](https://github.com/LedgerHQ/ledger-live/commit/63aa4b638ff662a53a4a7f41e1bade6e026a208b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove legacy translation keys orphaned by the Wallet 4.0 Q1 cleanup (sidebar/topbar rewrite, legacy dashboard & empty states, Help modal, receive step-options and the sync activity indicator).

- [#20317](https://github.com/LedgerHQ/ledger-live/pull/20317) [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc) Thanks [@deepyjr](https://github.com/deepyjr)! - Render the Desktop Contacts address label step and move shared add-address flow content into the Contacts Flow feature.

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20181](https://github.com/LedgerHQ/ledger-live/pull/20181) [`34a8455`](https://github.com/LedgerHQ/ledger-live/commit/34a8455a46382e5663e46b822f54e80530e23533) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a QR code scanner to the new send flow recipient field: the QR icon shows while the field is empty and is replaced by the clear button once the user types

- [#20252](https://github.com/LedgerHQ/ledger-live/pull/20252) [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Me contact detail by default with Me display-name formatting and external address CTA.

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20267](https://github.com/LedgerHQ/ledger-live/pull/20267) [`956d4a1`](https://github.com/LedgerHQ/ledger-live/commit/956d4a152187e6853b23fd72ab24e3f66c6c233d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add debug WebSocket transport to DevTools relay

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20224](https://github.com/LedgerHQ/ledger-live/pull/20224) [`f7e013a`](https://github.com/LedgerHQ/ledger-live/commit/f7e013a174e95461bedbd6cc2754134fbbf791b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an info disclaimer next to the recipient address in the new send flow, reminding users to verify the full address on their Ledger device

- [#20264](https://github.com/LedgerHQ/ledger-live/pull/20264) [`725b0dd`](https://github.com/LedgerHQ/ledger-live/commit/725b0ddf0c775bdbf9fa775adcfac2d8e4c56e9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(aleo): view key warning copy update

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20230](https://github.com/LedgerHQ/ledger-live/pull/20230) [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Desktop Contacts address entry flow with embedded currency selection.

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

- [#20217](https://github.com/LedgerHQ/ledger-live/pull/20217) [`9ebc505`](https://github.com/LedgerHQ/ledger-live/commit/9ebc505868dbb6f4155a5985ca87fc4d225c437b) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable dialog flow and an embeddable Modular Dialog presentation.

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`674ae62`](https://github.com/LedgerHQ/ledger-live/commit/674ae62c25b0db62dd789a31956b776466f39d4d), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242), [`f7997c9`](https://github.com/LedgerHQ/ledger-live/commit/f7997c90fe24c24a075b51a0f37db1c8e3eeffcd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189), [`248d24e`](https://github.com/LedgerHQ/ledger-live/commit/248d24e8fb1671878983ad90b0b47281e6773990), [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a), [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395), [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0), [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0), [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3), [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc), [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc), [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258), [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c), [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199), [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f), [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d), [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a), [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`94f7c85`](https://github.com/LedgerHQ/ledger-live/commit/94f7c85211c1947302e52fe9165027b83e202823), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274), [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00), [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd)]:
  - @ledgerhq/coin-bitcoin@0.50.0-next.0
  - @ledgerhq/coin-canton@0.32.0-next.0
  - @ledgerhq/coin-cardano@0.33.0-next.0
  - @ledgerhq/coin-casper@2.18.0-next.0
  - @ledgerhq/coin-concordium@0.19.0-next.0
  - @ledgerhq/coin-cosmos@0.42.0-next.0
  - @ledgerhq/coin-evm@4.9.0-next.0
  - @ledgerhq/coin-filecoin@1.31.0-next.0
  - @ledgerhq/live-common@37.1.0-next.0
  - @ledgerhq/coin-zcash@0.2.0-next.0
  - @features/flow-contacts@0.5.0-next.0
  - @shared/api-services@0.2.0-next.0
  - @domain/api-altcoins-sentiment@0.3.0-next.0
  - @domain/api-market-sentiment@0.3.0-next.0
  - @domain/api-currency-token@0.3.0-next.0
  - @domain/api-currency-fiat@0.3.0-next.0
  - @domain/api-push-devices@0.2.0-next.0
  - @features/platform-currencies@0.5.0-next.0
  - @domain/entity-contact@0.5.0-next.0
  - @shared/feature-flags@0.17.0-next.0
  - @domain/entity-analytics-consent@0.2.0-next.0
  - @ledgerhq/types-live@6.118.0-next.0
  - @shared/auth@0.3.0-next.0
  - @features/flow-analytics-consent@0.2.0-next.0
  - @devtools/transport-panel@0.3.0-next.0
  - @devtools/shell@0.7.0-next.0
  - @devtools/wire@0.3.0-next.0
  - @shared/env@0.2.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0-next.0
  - @domain/entity-currency-crypto@0.9.0-next.0
  - @ledgerhq/asset-detail@0.10.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/live-dmk-desktop@0.20.5-next.0
  - @devtools/bindings@0.2.3-next.0
  - @features/flow-large-screen-upsell@0.4.1-next.0
  - @features/platform-feature-flags@0.6.4-next.0
  - @ledgerhq/asset-aggregation@0.12.2-next.0
  - @ledgerhq/domain-service@1.8.13-next.0
  - @ledgerhq/live-countervalues@0.24.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.5-next.0
  - @ledgerhq/live-wallet@0.30.2-next.0
  - @ledgerhq/wallet-analytics@0.3.2-next.0
  - @ledgerhq/wallet-pnl@0.7.5-next.0
  - @features/platform-env@0.1.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.4-next.0
  - @domain/entity-currency@0.3.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0

## 4.14.0

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#19946](https://github.com/LedgerHQ/ledger-live/pull/19946) [`b35f172`](https://github.com/LedgerHQ/ledger-live/commit/b35f1725617f414f219d1da94c1296f153ffc8f9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - integration tests for Aleo desktop app

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#19953](https://github.com/LedgerHQ/ledger-live/pull/19953) [`0c57185`](https://github.com/LedgerHQ/ledger-live/commit/0c571858b3badf4d9e9c706ca0f9aaca3e925310) Thanks [@deepyjr](https://github.com/deepyjr)! - Stabilize Wallet API drawer navigation smoke test.

- [#20146](https://github.com/LedgerHQ/ledger-live/pull/20146) [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Desktop contacts list scroll so the add contact row stays full size at the end of the list.

- [#20050](https://github.com/LedgerHQ/ledger-live/pull/20050) [`4c34536`](https://github.com/LedgerHQ/ledger-live/commit/4c345363f061fb4a525684ae45ce437ea12e77d7) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove Custom Lock Screen step from the post-onboarding widget.

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

- [#19970](https://github.com/LedgerHQ/ledger-live/pull/19970) [`192273e`](https://github.com/LedgerHQ/ledger-live/commit/192273e07f22435e9cea149a8d82a7aa4f1e481f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Hide sidebar on Recover and Perps fullscreen webview routes

- [#19904](https://github.com/LedgerHQ/ledger-live/pull/19904) [`5f383b4`](https://github.com/LedgerHQ/ledger-live/commit/5f383b404f53f44a0b3451a04060958181dadc9e) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix analytics confidentiality filter to scrub account IDs from tracked events

- [#19995](https://github.com/LedgerHQ/ledger-live/pull/19995) [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render validation errors in the Desktop add contact dialog.

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20163](https://github.com/LedgerHQ/ledger-live/pull/20163) [`edab816`](https://github.com/LedgerHQ/ledger-live/commit/edab816584999d93a63d703c0a56238720eae70f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Round market table row corners on hover (asset discoverability view)

- [#20023](https://github.com/LedgerHQ/ledger-live/pull/20023) [`5ad8f9e`](https://github.com/LedgerHQ/ledger-live/commit/5ad8f9e6b323222b1fe98aec246597da6d540cee) Thanks [@deepyjr](https://github.com/deepyjr)! - Start the shared Add Address flow from Desktop contact details

- [#20118](https://github.com/LedgerHQ/ledger-live/pull/20118) [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated contact detail with network-grouped address rows, crypto icons, and shared address detail dialog.

- [#20116](https://github.com/LedgerHQ/ledger-live/pull/20116) [`fce013c`](https://github.com/LedgerHQ/ledger-live/commit/fce013c5a37df9e300c3b3b147f29e2cf92c9121) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix dialog buttons doing nothing while a side drawer is open, by releasing the drawer focus trap when a dialog opens

- [#20091](https://github.com/LedgerHQ/ledger-live/pull/20091) [`ef5945a`](https://github.com/LedgerHQ/ledger-live/commit/ef5945a991c2d93259c414091bb276f527f8cbae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

  - Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
  - Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
  - Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
  - Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.

- [#19892](https://github.com/LedgerHQ/ledger-live/pull/19892) [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Desktop Add contact dialog and shared web form wired to add-contact state.

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#19998](https://github.com/LedgerHQ/ledger-live/pull/19998) [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop contact detail empty state using shared flow-contacts Detail step.

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#19941](https://github.com/LedgerHQ/ledger-live/pull/19941) [`af5ff9e`](https://github.com/LedgerHQ/ledger-live/commit/af5ff9ebd17f3dc4fd4234e48f3fa0dd27af2f94) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix zero price variations in Desktop asset search results.

- [#19925](https://github.com/LedgerHQ/ledger-live/pull/19925) [`72969ec`](https://github.com/LedgerHQ/ledger-live/commit/72969ecd9ae1f6ff8ba380fba1e7f96297f81bbc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Track input mode (fiat or crypto) when clicking review on the new send flow amount screen

- [#20068](https://github.com/LedgerHQ/ledger-live/pull/20068) [`644aefb`](https://github.com/LedgerHQ/ledger-live/commit/644aefbb471f91eb0be7817b665cf773cf3250b1) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix empty asset ledger desktop

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

- [#20097](https://github.com/LedgerHQ/ledger-live/pull/20097) [`7efe94e`](https://github.com/LedgerHQ/ledger-live/commit/7efe94e4dfa707fb0c23ff819791194d33ac5d8f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to self transfer label for Aleo

- [#19637](https://github.com/LedgerHQ/ledger-live/pull/19637) [`07c9576`](https://github.com/LedgerHQ/ledger-live/commit/07c957630a5f271ceac66eb0ecde6c2a690e689b) Thanks [@semeano](https://github.com/semeano)! - Zcash send modal updated; add memo field

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922), [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a), [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855), [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81), [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f), [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd), [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add), [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43), [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf), [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151), [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad), [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7), [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c), [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5), [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124), [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e), [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b), [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2), [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074), [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/live-common@37.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/coin-bitcoin@0.49.0
  - @ledgerhq/coin-canton@0.31.0
  - @ledgerhq/coin-cardano@0.32.0
  - @ledgerhq/coin-casper@2.17.0
  - @ledgerhq/coin-concordium@0.18.0
  - @ledgerhq/coin-cosmos@0.41.0
  - @ledgerhq/coin-evm@4.8.0
  - @ledgerhq/coin-filecoin@1.30.0
  - @ledgerhq/live-network@3.0.0
  - @features/flow-contacts@0.4.0
  - @features/flow-large-screen-upsell@0.4.0
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0
  - @domain/entity-currency@0.3.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-countervalues@0.24.0
  - @domain/entity-contact@0.4.0
  - @shared/feature-flags@0.16.0
  - @devtools/shell@0.6.0
  - @ledgerhq/types-live@6.117.0
  - @ledgerhq/domain-service@1.8.12
  - @ledgerhq/hw-transport@6.35.7
  - @ledgerhq/hw-transport-http@6.36.7
  - @ledgerhq/hw-transport-vault@1.7.7
  - @ledgerhq/asset-detail@0.9.3
  - @ledgerhq/live-dmk-desktop@0.20.4
  - @ledgerhq/live-countervalues-react@0.16.4
  - @ledgerhq/live-wallet@0.30.1
  - @ledgerhq/wallet-analytics@0.3.1
  - @ledgerhq/wallet-pnl@0.7.4
  - @ledgerhq/ledger-key-ring-protocol@0.17.2
  - @domain/api-currency-token@0.2.3
  - @features/platform-currencies@0.4.1
  - @ledgerhq/asset-aggregation@0.12.1
  - @ledgerhq/live-currency-format@0.14.1
  - @devtools/bindings@0.2.2
  - @features/platform-feature-flags@0.6.3
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2
  - @shared/env@0.1.1
  - @ledgerhq/live-dmk-shared@0.29.1
  - @ledgerhq/live-dmk-speculos@0.10.3
  - @features/platform-env@0.1.1

## 4.14.0-next.1

### Patch Changes

- Updated dependencies [[`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a)]:
  - @ledgerhq/coin-bitcoin@0.49.0-next.1
  - @ledgerhq/live-common@37.0.0-next.1
  - @ledgerhq/asset-detail@0.9.3-next.1
  - @ledgerhq/live-dmk-desktop@0.20.4-next.1

## 4.14.0-next.0

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#19946](https://github.com/LedgerHQ/ledger-live/pull/19946) [`b35f172`](https://github.com/LedgerHQ/ledger-live/commit/b35f1725617f414f219d1da94c1296f153ffc8f9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - integration tests for Aleo desktop app

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#19953](https://github.com/LedgerHQ/ledger-live/pull/19953) [`0c57185`](https://github.com/LedgerHQ/ledger-live/commit/0c571858b3badf4d9e9c706ca0f9aaca3e925310) Thanks [@deepyjr](https://github.com/deepyjr)! - Stabilize Wallet API drawer navigation smoke test.

- [#20146](https://github.com/LedgerHQ/ledger-live/pull/20146) [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Desktop contacts list scroll so the add contact row stays full size at the end of the list.

- [#20050](https://github.com/LedgerHQ/ledger-live/pull/20050) [`4c34536`](https://github.com/LedgerHQ/ledger-live/commit/4c345363f061fb4a525684ae45ce437ea12e77d7) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove Custom Lock Screen step from the post-onboarding widget.

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

- [#19970](https://github.com/LedgerHQ/ledger-live/pull/19970) [`192273e`](https://github.com/LedgerHQ/ledger-live/commit/192273e07f22435e9cea149a8d82a7aa4f1e481f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Hide sidebar on Recover and Perps fullscreen webview routes

- [#19904](https://github.com/LedgerHQ/ledger-live/pull/19904) [`5f383b4`](https://github.com/LedgerHQ/ledger-live/commit/5f383b404f53f44a0b3451a04060958181dadc9e) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix analytics confidentiality filter to scrub account IDs from tracked events

- [#19995](https://github.com/LedgerHQ/ledger-live/pull/19995) [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render validation errors in the Desktop add contact dialog.

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20163](https://github.com/LedgerHQ/ledger-live/pull/20163) [`edab816`](https://github.com/LedgerHQ/ledger-live/commit/edab816584999d93a63d703c0a56238720eae70f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Round market table row corners on hover (asset discoverability view)

- [#20023](https://github.com/LedgerHQ/ledger-live/pull/20023) [`5ad8f9e`](https://github.com/LedgerHQ/ledger-live/commit/5ad8f9e6b323222b1fe98aec246597da6d540cee) Thanks [@deepyjr](https://github.com/deepyjr)! - Start the shared Add Address flow from Desktop contact details

- [#20118](https://github.com/LedgerHQ/ledger-live/pull/20118) [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated contact detail with network-grouped address rows, crypto icons, and shared address detail dialog.

- [#20116](https://github.com/LedgerHQ/ledger-live/pull/20116) [`fce013c`](https://github.com/LedgerHQ/ledger-live/commit/fce013c5a37df9e300c3b3b147f29e2cf92c9121) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix dialog buttons doing nothing while a side drawer is open, by releasing the drawer focus trap when a dialog opens

- [#20091](https://github.com/LedgerHQ/ledger-live/pull/20091) [`ef5945a`](https://github.com/LedgerHQ/ledger-live/commit/ef5945a991c2d93259c414091bb276f527f8cbae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

  - Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
  - Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
  - Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
  - Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.

- [#19892](https://github.com/LedgerHQ/ledger-live/pull/19892) [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Desktop Add contact dialog and shared web form wired to add-contact state.

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#19998](https://github.com/LedgerHQ/ledger-live/pull/19998) [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop contact detail empty state using shared flow-contacts Detail step.

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#19941](https://github.com/LedgerHQ/ledger-live/pull/19941) [`af5ff9e`](https://github.com/LedgerHQ/ledger-live/commit/af5ff9ebd17f3dc4fd4234e48f3fa0dd27af2f94) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix zero price variations in Desktop asset search results.

- [#19925](https://github.com/LedgerHQ/ledger-live/pull/19925) [`72969ec`](https://github.com/LedgerHQ/ledger-live/commit/72969ecd9ae1f6ff8ba380fba1e7f96297f81bbc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Track input mode (fiat or crypto) when clicking review on the new send flow amount screen

- [#20068](https://github.com/LedgerHQ/ledger-live/pull/20068) [`644aefb`](https://github.com/LedgerHQ/ledger-live/commit/644aefbb471f91eb0be7817b665cf773cf3250b1) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix empty asset ledger desktop

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

- [#20097](https://github.com/LedgerHQ/ledger-live/pull/20097) [`7efe94e`](https://github.com/LedgerHQ/ledger-live/commit/7efe94e4dfa707fb0c23ff819791194d33ac5d8f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to self transfer label for Aleo

- [#19637](https://github.com/LedgerHQ/ledger-live/pull/19637) [`07c9576`](https://github.com/LedgerHQ/ledger-live/commit/07c957630a5f271ceac66eb0ecde6c2a690e689b) Thanks [@semeano](https://github.com/semeano)! - Zcash send modal updated; add memo field

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922), [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a), [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855), [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81), [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f), [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd), [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add), [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43), [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf), [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151), [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad), [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7), [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c), [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5), [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124), [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e), [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b), [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2), [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074), [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/live-common@37.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/coin-bitcoin@0.49.0-next.0
  - @ledgerhq/coin-canton@0.31.0-next.0
  - @ledgerhq/coin-cardano@0.32.0-next.0
  - @ledgerhq/coin-casper@2.17.0-next.0
  - @ledgerhq/coin-concordium@0.18.0-next.0
  - @ledgerhq/coin-cosmos@0.41.0-next.0
  - @ledgerhq/coin-evm@4.8.0-next.0
  - @ledgerhq/coin-filecoin@1.30.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @features/flow-contacts@0.4.0-next.0
  - @features/flow-large-screen-upsell@0.4.0-next.0
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @domain/entity-currency@0.3.0-next.0
  - @ledgerhq/wallet-btc@0.3.0-next.0
  - @ledgerhq/live-countervalues@0.24.0-next.0
  - @domain/entity-contact@0.4.0-next.0
  - @shared/feature-flags@0.16.0-next.0
  - @devtools/shell@0.6.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/domain-service@1.8.12-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0
  - @ledgerhq/hw-transport-http@6.36.7-next.0
  - @ledgerhq/hw-transport-vault@1.7.7-next.0
  - @ledgerhq/asset-detail@0.9.3-next.0
  - @ledgerhq/live-dmk-desktop@0.20.4-next.0
  - @ledgerhq/live-countervalues-react@0.16.4-next.0
  - @ledgerhq/live-wallet@0.30.1-next.0
  - @ledgerhq/wallet-analytics@0.3.1-next.0
  - @ledgerhq/wallet-pnl@0.7.4-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.2-next.0
  - @domain/api-currency-token@0.2.3-next.0
  - @features/platform-currencies@0.4.1-next.0
  - @ledgerhq/asset-aggregation@0.12.1-next.0
  - @ledgerhq/live-currency-format@0.14.1-next.0
  - @devtools/bindings@0.2.2-next.0
  - @features/platform-feature-flags@0.6.3-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2-next.0
  - @shared/env@0.1.1-next.0
  - @ledgerhq/live-dmk-shared@0.29.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.3-next.0
  - @features/platform-env@0.1.1-next.0

## 4.13.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.6.1
  - @ledgerhq/asset-detail@0.9.2
  - @ledgerhq/live-dmk-desktop@0.20.3

## 4.13.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.6.1-hotfix.0
  - @ledgerhq/asset-detail@0.9.2-hotfix.0
  - @ledgerhq/live-dmk-desktop@0.20.3-hotfix.0

## 4.13.0

### Minor Changes

- [#19843](https://github.com/LedgerHQ/ledger-live/pull/19843) [`6f30183`](https://github.com/LedgerHQ/ledger-live/commit/6f30183f9abdd21cf2e732eefacd339cad73b5bc) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix InputCurrency not applying external value updates (e.g. amount presets) when focused after typing

- [#19813](https://github.com/LedgerHQ/ledger-live/pull/19813) [`928f6e2`](https://github.com/LedgerHQ/ledger-live/commit/928f6e2745d9713c12a8986d46bb3d7e31b5918a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - bump @ledgerhq/context-module to 2.3.0

- [#19799](https://github.com/LedgerHQ/ledger-live/pull/19799) [`65b276f`](https://github.com/LedgerHQ/ledger-live/commit/65b276f370586b1e2f76f2425753dd6e3a535599) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix double Ledger Recover upsell trigger after re-onboarding post-onboarding navigation

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19927](https://github.com/LedgerHQ/ledger-live/pull/19927) [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Desktop large-screen upsell opt-out copy and CTA.

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19759](https://github.com/LedgerHQ/ledger-live/pull/19759) [`9b837a7`](https://github.com/LedgerHQ/ledger-live/commit/9b837a7366ea199b58c0f9d2582f8f557e5c1a92) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix InputCurrency not reflecting external value updates when focused without typing

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19787](https://github.com/LedgerHQ/ledger-live/pull/19787) [`b09b30b`](https://github.com/LedgerHQ/ledger-live/commit/b09b30b236ecf0d3668b3bcc460560b4ccd127dc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract NightlyLayer into MVVM component and improve prerelease watermark visibility

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mock Ledger Sync presentation variants to Desktop Contacts.

- [#19905](https://github.com/LedgerHQ/ledger-live/pull/19905) [`ae9897a`](https://github.com/LedgerHQ/ledger-live/commit/ae9897ad91b89bed89be1d51d73ec5666d337d19) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(send): hide balance in send modal header when discreet mode is enabled

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19893](https://github.com/LedgerHQ/ledger-live/pull/19893) [`47a347b`](https://github.com/LedgerHQ/ledger-live/commit/47a347b17aae8d90527e8eef23bcfcbbdc7df0d1) Thanks [@qperrot](https://github.com/qperrot)! - Fix: no default selection when validator is not a ledger one

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19864](https://github.com/LedgerHQ/ledger-live/pull/19864) [`83e4f6e`](https://github.com/LedgerHQ/ledger-live/commit/83e4f6e578a4212b302956b270a39b4160704ce4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Show a currency-specific disabled tooltip on the EVM Undelegate button: 0G explains the 1 Gwei minimum shares threshold; SEI explains the 7-validator limit.

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19903](https://github.com/LedgerHQ/ledger-live/pull/19903) [`2a61c00`](https://github.com/LedgerHQ/ledger-live/commit/2a61c004855f925422e2c674f4bf2a28ba44dd88) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire the Contacts feature introduction on Desktop with persisted dismissal, defer navigation, integration coverage, and a dev-menu toggle to reset the intro.

- [#19712](https://github.com/LedgerHQ/ledger-live/pull/19712) [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render the populated Desktop Contacts list and add Dev Tool controls to load mock contacts for testing.

- [#19730](https://github.com/LedgerHQ/ledger-live/pull/19730) [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts search results and no-result state

- [#19713](https://github.com/LedgerHQ/ledger-live/pull/19713) [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell QA debug screen and domain setters for simulating modal state

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

- [#19745](https://github.com/LedgerHQ/ledger-live/pull/19745) [`6b86a70`](https://github.com/LedgerHQ/ledger-live/commit/6b86a70f0ee2a67b7b967abbf06084d6e0e63bdb) Thanks [@lewisd5](https://github.com/lewisd5)! - Removing update banner for certain distribution channels

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19347](https://github.com/LedgerHQ/ledger-live/pull/19347) [`e94170f`](https://github.com/LedgerHQ/ledger-live/commit/e94170fd6014838a721db595b6260bfbde4fbbac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron from 42 to 43 for boot-time performance improvements

- [#19847](https://github.com/LedgerHQ/ledger-live/pull/19847) [`6abc9e6`](https://github.com/LedgerHQ/ledger-live/commit/6abc9e6e4e2338a2aa5928fc2c30690eb99e8717) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(errors): replace instanceof guards with .name string checks

- [#19359](https://github.com/LedgerHQ/ledger-live/pull/19359) [`a6bdd26`](https://github.com/LedgerHQ/ledger-live/commit/a6bdd265628036e25954ac6a9998ea8296a3bdf3) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Asset Pre-selection Logic on Asset Page

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

- [#19956](https://github.com/LedgerHQ/ledger-live/pull/19956) [`3c9a320`](https://github.com/LedgerHQ/ledger-live/commit/3c9a320e5ab6a8483ecf68cd53b31c96798a3a7d) Thanks [@lewisd5](https://github.com/lewisd5)! - Small CI patch

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13), [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db), [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2), [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea), [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f), [`ee1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/ee1f9f3ae9f620328a975b7f8ad75a3437f8875b), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5), [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd), [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115), [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983), [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f), [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba), [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f), [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa), [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86), [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7), [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`e1496c5`](https://github.com/LedgerHQ/ledger-live/commit/e1496c5a5b4ab0a2378332d945d81434f58ad503), [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f), [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20), [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e)]:
  - @ledgerhq/live-common@36.6.0
  - @ledgerhq/live-countervalues@0.23.0
  - @ledgerhq/asset-aggregation@0.12.0
  - @ledgerhq/live-wallet@0.30.0
  - @ledgerhq/wallet-analytics@0.3.0
  - @features/flow-large-screen-upsell@0.3.0
  - @features/flow-contacts@0.3.0
  - @ledgerhq/coin-evm@4.7.0
  - @ledgerhq/coin-canton@0.30.0
  - @ledgerhq/coin-cardano@0.31.0
  - @ledgerhq/coin-concordium@0.17.0
  - @ledgerhq/coin-filecoin@1.29.0
  - @ledgerhq/live-dmk-shared@0.29.0
  - @ledgerhq/live-currency-format@0.14.0
  - @ledgerhq/cryptoassets@13.56.0
  - @ledgerhq/types-live@6.116.0
  - @domain/entity-contact@0.3.0
  - @domain/entity-currency-crypto@0.7.0
  - @ledgerhq/wallet-btc@0.2.0
  - @ledgerhq/coin-bitcoin@0.48.0
  - @ledgerhq/live-network@2.7.0
  - @domain/entity-large-screen-upsell-modal@0.3.0
  - @ledgerhq/coin-cosmos@0.40.0
  - @features/platform-currencies@0.4.0
  - @shared/feature-flags@0.15.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/asset-detail@0.9.1
  - @ledgerhq/live-dmk-desktop@0.20.2
  - @ledgerhq/live-countervalues-react@0.16.3
  - @ledgerhq/wallet-pnl@0.7.3
  - @ledgerhq/coin-casper@2.16.1
  - @ledgerhq/domain-service@1.8.11
  - @domain/api-currency-token@0.2.2
  - @ledgerhq/ledger-key-ring-protocol@0.17.1
  - @devtools/bindings@0.2.1
  - @features/platform-feature-flags@0.6.2
  - @devtools/shell@0.5.2

## 4.13.0-next.2

### Minor Changes

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

### Patch Changes

- Updated dependencies [[`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2)]:
  - @ledgerhq/live-common@36.6.0-next.1
  - @ledgerhq/asset-detail@0.9.1-next.1
  - @ledgerhq/live-dmk-desktop@0.20.2-next.1

## 4.13.0-next.1

### Minor Changes

- [#19956](https://github.com/LedgerHQ/ledger-live/pull/19956) [`3c9a320`](https://github.com/LedgerHQ/ledger-live/commit/3c9a320e5ab6a8483ecf68cd53b31c96798a3a7d) Thanks [@lewisd5](https://github.com/lewisd5)! - Small CI patch

## 4.13.0-next.0

### Minor Changes

- [#19843](https://github.com/LedgerHQ/ledger-live/pull/19843) [`6f30183`](https://github.com/LedgerHQ/ledger-live/commit/6f30183f9abdd21cf2e732eefacd339cad73b5bc) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix InputCurrency not applying external value updates (e.g. amount presets) when focused after typing

- [#19813](https://github.com/LedgerHQ/ledger-live/pull/19813) [`928f6e2`](https://github.com/LedgerHQ/ledger-live/commit/928f6e2745d9713c12a8986d46bb3d7e31b5918a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - bump @ledgerhq/context-module to 2.3.0

- [#19799](https://github.com/LedgerHQ/ledger-live/pull/19799) [`65b276f`](https://github.com/LedgerHQ/ledger-live/commit/65b276f370586b1e2f76f2425753dd6e3a535599) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix double Ledger Recover upsell trigger after re-onboarding post-onboarding navigation

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19927](https://github.com/LedgerHQ/ledger-live/pull/19927) [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Desktop large-screen upsell opt-out copy and CTA.

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19759](https://github.com/LedgerHQ/ledger-live/pull/19759) [`9b837a7`](https://github.com/LedgerHQ/ledger-live/commit/9b837a7366ea199b58c0f9d2582f8f557e5c1a92) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix InputCurrency not reflecting external value updates when focused without typing

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19787](https://github.com/LedgerHQ/ledger-live/pull/19787) [`b09b30b`](https://github.com/LedgerHQ/ledger-live/commit/b09b30b236ecf0d3668b3bcc460560b4ccd127dc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract NightlyLayer into MVVM component and improve prerelease watermark visibility

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mock Ledger Sync presentation variants to Desktop Contacts.

- [#19905](https://github.com/LedgerHQ/ledger-live/pull/19905) [`ae9897a`](https://github.com/LedgerHQ/ledger-live/commit/ae9897ad91b89bed89be1d51d73ec5666d337d19) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(send): hide balance in send modal header when discreet mode is enabled

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19893](https://github.com/LedgerHQ/ledger-live/pull/19893) [`47a347b`](https://github.com/LedgerHQ/ledger-live/commit/47a347b17aae8d90527e8eef23bcfcbbdc7df0d1) Thanks [@qperrot](https://github.com/qperrot)! - Fix: no default selection when validator is not a ledger one

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19864](https://github.com/LedgerHQ/ledger-live/pull/19864) [`83e4f6e`](https://github.com/LedgerHQ/ledger-live/commit/83e4f6e578a4212b302956b270a39b4160704ce4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Show a currency-specific disabled tooltip on the EVM Undelegate button: 0G explains the 1 Gwei minimum shares threshold; SEI explains the 7-validator limit.

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19903](https://github.com/LedgerHQ/ledger-live/pull/19903) [`2a61c00`](https://github.com/LedgerHQ/ledger-live/commit/2a61c004855f925422e2c674f4bf2a28ba44dd88) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire the Contacts feature introduction on Desktop with persisted dismissal, defer navigation, integration coverage, and a dev-menu toggle to reset the intro.

- [#19712](https://github.com/LedgerHQ/ledger-live/pull/19712) [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render the populated Desktop Contacts list and add Dev Tool controls to load mock contacts for testing.

- [#19730](https://github.com/LedgerHQ/ledger-live/pull/19730) [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts search results and no-result state

- [#19713](https://github.com/LedgerHQ/ledger-live/pull/19713) [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell QA debug screen and domain setters for simulating modal state

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

- [#19745](https://github.com/LedgerHQ/ledger-live/pull/19745) [`6b86a70`](https://github.com/LedgerHQ/ledger-live/commit/6b86a70f0ee2a67b7b967abbf06084d6e0e63bdb) Thanks [@lewisd5](https://github.com/lewisd5)! - Removing update banner for certain distribution channels

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19347](https://github.com/LedgerHQ/ledger-live/pull/19347) [`e94170f`](https://github.com/LedgerHQ/ledger-live/commit/e94170fd6014838a721db595b6260bfbde4fbbac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron from 42 to 43 for boot-time performance improvements

- [#19847](https://github.com/LedgerHQ/ledger-live/pull/19847) [`6abc9e6`](https://github.com/LedgerHQ/ledger-live/commit/6abc9e6e4e2338a2aa5928fc2c30690eb99e8717) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(errors): replace instanceof guards with .name string checks

- [#19359](https://github.com/LedgerHQ/ledger-live/pull/19359) [`a6bdd26`](https://github.com/LedgerHQ/ledger-live/commit/a6bdd265628036e25954ac6a9998ea8296a3bdf3) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Asset Pre-selection Logic on Asset Page

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13), [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db), [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea), [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f), [`ee1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/ee1f9f3ae9f620328a975b7f8ad75a3437f8875b), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5), [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd), [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115), [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983), [`22afc34`](https://github.com/LedgerHQ/ledger-live/commit/22afc34ac1ff55448414e85227c2d6da96395153), [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f), [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba), [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f), [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa), [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86), [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7), [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`e1496c5`](https://github.com/LedgerHQ/ledger-live/commit/e1496c5a5b4ab0a2378332d945d81434f58ad503), [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f), [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20), [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e)]:
  - @ledgerhq/live-common@36.6.0-next.0
  - @ledgerhq/live-countervalues@0.23.0-next.0
  - @ledgerhq/asset-aggregation@0.12.0-next.0
  - @ledgerhq/live-wallet@0.30.0-next.0
  - @ledgerhq/wallet-analytics@0.3.0-next.0
  - @features/flow-large-screen-upsell@0.3.0-next.0
  - @features/flow-contacts@0.3.0-next.0
  - @ledgerhq/coin-evm@4.7.0-next.0
  - @ledgerhq/coin-canton@0.30.0-next.0
  - @ledgerhq/coin-cardano@0.31.0-next.0
  - @ledgerhq/coin-concordium@0.17.0-next.0
  - @ledgerhq/coin-filecoin@1.29.0-next.0
  - @ledgerhq/live-dmk-shared@0.29.0-next.0
  - @ledgerhq/live-currency-format@0.14.0-next.0
  - @ledgerhq/cryptoassets@13.56.0-next.0
  - @ledgerhq/types-live@6.116.0-next.0
  - @domain/entity-contact@0.3.0-next.0
  - @domain/entity-currency-crypto@0.7.0-next.0
  - @ledgerhq/wallet-btc@0.2.0-next.0
  - @ledgerhq/coin-bitcoin@0.48.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @domain/entity-large-screen-upsell-modal@0.3.0-next.0
  - @ledgerhq/coin-cosmos@0.40.0-next.0
  - @features/platform-currencies@0.4.0-next.0
  - @shared/feature-flags@0.15.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0
  - @ledgerhq/asset-detail@0.9.1-next.0
  - @ledgerhq/live-dmk-desktop@0.20.2-next.0
  - @ledgerhq/live-countervalues-react@0.16.3-next.0
  - @ledgerhq/wallet-pnl@0.7.3-next.0
  - @ledgerhq/coin-casper@2.16.1-next.0
  - @ledgerhq/domain-service@1.8.11-next.0
  - @domain/api-currency-token@0.2.2-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.1-next.0
  - @devtools/bindings@0.2.1-next.0
  - @features/platform-feature-flags@0.6.2-next.0
  - @devtools/shell@0.5.2-next.0

## 4.12.0

### Minor Changes

- [#19411](https://github.com/LedgerHQ/ledger-live/pull/19411) [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(algorand): not opt in asa error message

- [#19373](https://github.com/LedgerHQ/ledger-live/pull/19373) [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix GAM CTA visibility and empty-link click behavior on desktop and mobile

- [#19396](https://github.com/LedgerHQ/ledger-live/pull/19396) [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

- [#19501](https://github.com/LedgerHQ/ledger-live/pull/19501) [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix the Cosmos-family "Undelegating" tooltip in the desktop account summary footer, which hardcoded a 21-day timelock for every chain. It now uses each chain's actual unbonding period (e.g. ~2 days for Babylon, 14 for Osmosis, 30 for dYdX), matching the value already shown in the delegation section.

  Also make the Cosmos chain factory alias the crypto_org_croeseid testnet to crypto_org, so it resolves chain params instead of throwing (previously only the osmosis alias was handled).

- [#19628](https://github.com/LedgerHQ/ledger-live/pull/19628) [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92) Thanks [@qperrot](https://github.com/qperrot)! - Fix coin control not showing selected coins after entering an amount, and refine the coin control screen layout (subheader sizing, header spacing, and scrollbar gutter)

- [#19667](https://github.com/LedgerHQ/ledger-live/pull/19667) [`40a231e`](https://github.com/LedgerHQ/ledger-live/commit/40a231e524f3d2d6edccaae5928d65da23aae6fe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Segment analytics for the large-screen upsell modal (LIVE-33163): flow dismiss/CTA lifecycle ports and desktop trackPage/track wiring.

- [#19468](https://github.com/LedgerHQ/ledger-live/pull/19468) [`6daa358`](https://github.com/LedgerHQ/ledger-live/commit/6daa358825661b45a986c84ec7a85ad745d6a0da) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Desktop Developer settings debug controls for the `lwdContacts` rollout flag.

- [#19365](https://github.com/LedgerHQ/ledger-live/pull/19365) [`40903c6`](https://github.com/LedgerHQ/ledger-live/commit/40903c6960ec3ad99d08cddfca7b9b45b82a01ce) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add new page to lwd that opens devtools

- [#19469](https://github.com/LedgerHQ/ledger-live/pull/19469) [`a8a1e70`](https://github.com/LedgerHQ/ledger-live/commit/a8a1e7088dc97e7e7b41fbe26d1d850d3d9af080) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry config test expectations

- [#19643](https://github.com/LedgerHQ/ledger-live/pull/19643) [`1cc6fff`](https://github.com/LedgerHQ/ledger-live/commit/1cc6fff890d36ae12f81047882ae6e6e6fd2bac8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell modal UI on desktop (LIVE-33162).

- [#19577](https://github.com/LedgerHQ/ledger-live/pull/19577) [`a96b7c8`](https://github.com/LedgerHQ/ledger-live/commit/a96b7c805f326a0e7d5c20602cb614c9f87fc7cb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Reset App to fully reboot Electron so user identities are regenerated on next launch

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19614](https://github.com/LedgerHQ/ledger-live/pull/19614) [`8998c72`](https://github.com/LedgerHQ/ledger-live/commit/8998c720d2a3e525430be9a41761c06f446a21ad) Thanks [@jeportie](https://github.com/jeportie)! - Expose the swap transaction-details provider link URL via test/accessibility attributes so E2E can conditionally verify the provider link only when a provider URL exists (QAA-721)

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19582](https://github.com/LedgerHQ/ledger-live/pull/19582) [`97f30e4`](https://github.com/LedgerHQ/ledger-live/commit/97f30e4df0859097bf9416c9acac034eeedc95e0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop settings.supportedCounterValues — now derived at runtime from @domain/entity-currency-fiat

- [#19565](https://github.com/LedgerHQ/ledger-live/pull/19565) [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Contacts page shell with an empty list to the Desktop Contacts page.

- [#19388](https://github.com/LedgerHQ/ledger-live/pull/19388) [`c7d0489`](https://github.com/LedgerHQ/ledger-live/commit/c7d0489f419cc00262d31c1b0e29ac42eb507138) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `ledgerlive://paytab` deeplink that navigates to the Pay Tab screen when the `lwdPayTab` feature flag is enabled, falling back to the default handler otherwise.

- [#19340](https://github.com/LedgerHQ/ledger-live/pull/19340) [`5feb402`](https://github.com/LedgerHQ/ledger-live/commit/5feb40206e5aa47152698b4173bea95ac7a44b54) Thanks [@deepyjr](https://github.com/deepyjr)! - Add dust filter tracking and active-state copy.

- [#19445](https://github.com/LedgerHQ/ledger-live/pull/19445) [`57e7569`](https://github.com/LedgerHQ/ledger-live/commit/57e7569c491d54d03304d40d4a76c01e92b028b6) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Add stable `data-testid` attributes to the operation details drawer amount and identifier labels to make E2E selectors robust against duplicate on-page text.

- [#19519](https://github.com/LedgerHQ/ledger-live/pull/19519) [`63792ba`](https://github.com/LedgerHQ/ledger-live/commit/63792bae54e2ff58dc39df157385f7206cdd6be5) Thanks [@cfloume](https://github.com/cfloume)! - fix: prevent Q2 tour from showing to users who haven't onboarded

- [#19342](https://github.com/LedgerHQ/ledger-live/pull/19342) [`1ee03bd`](https://github.com/LedgerHQ/ledger-live/commit/1ee03bd0f8ea26c7a069b4fdb53352eae4c0d497) Thanks [@qperrot](https://github.com/qperrot)! - Fix EVM native staking delegation row not always showing the validator name on the account page. The moniker is now resolved from the reactive validators hook (the same source as the Delegate modal) instead of `account.stakingResources.validators`, which was only populated by a successful, non-empty account sync and could leave the raw validator address showing until the next sync.

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

- [#19331](https://github.com/LedgerHQ/ledger-live/pull/19331) [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b) Thanks [@ysitbon](https://github.com/ysitbon)! - Activate the RTK Query supported-fiats flow and retire the legacy CVS polling path: boot-time query populates the Redux slice; settings and countervalue selectors read from the slice synchronously.

- [#19486](https://github.com/LedgerHQ/ledger-live/pull/19486) [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming and outgoing dust transactions in history.

- [#19560](https://github.com/LedgerHQ/ledger-live/pull/19560) [`76049c2`](https://github.com/LedgerHQ/ledger-live/commit/76049c20f7e23daeafa5b1eb386cb43f876336f8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix logger.critical not capturing non-Error thrown values

- [#19419](https://github.com/LedgerHQ/ledger-live/pull/19419) [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming native dust transactions in operation histories.

- [#19536](https://github.com/LedgerHQ/ledger-live/pull/19536) [`f854c29`](https://github.com/LedgerHQ/ledger-live/commit/f854c29bf164948ff2a38c01a1dc88e8fb297bc1) Thanks [@amaslakov](https://github.com/amaslakov)! - Warn and explain when Tezos staking is blocked by an unfinalizable unstake to another validator: translate the raw fee-estimation error into a clear message, and show an inline warning on the change-validator summary while a pending unstake is still unfinalizable

- [#19642](https://github.com/LedgerHQ/ledger-live/pull/19642) [`465ebec`](https://github.com/LedgerHQ/ledger-live/commit/465ebec92fe42416b6af2f8f8c739582643af130) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire the large-screen upsell modal frequency state into desktop (LIVE-33160 / LIVE-33161): register the reducer and hydrate/persist it via storage. Composition hook and UI land in a later slice.

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

- [#19370](https://github.com/LedgerHQ/ledger-live/pull/19370) [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff) Thanks [@pawell24](https://github.com/pawell24)! - Rename "Ledger by Chorus One" to "Ledger by Bitwise" following Bitwise's acquisition of Chorus One

- [#19379](https://github.com/LedgerHQ/ledger-live/pull/19379) [`16be920`](https://github.com/LedgerHQ/ledger-live/commit/16be9200af8048d5b359606a1425b09d092bde9d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Pay Tab to the desktop sidebar, replacing the Card entry when the `lwdPayTab` feature flag is enabled

- [#19594](https://github.com/LedgerHQ/ledger-live/pull/19594) [`569d68a`](https://github.com/LedgerHQ/ledger-live/commit/569d68a6bb9d5115da5e47e1f80021f86e60dbcd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Analytics chart header to show Total balance label, md trend sizing, scrub-driven balance and date updates, and hide the chart scrubber tooltip.

- [#19551](https://github.com/LedgerHQ/ledger-live/pull/19551) [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contact entry and gated empty Contacts page shell backed by domain contacts state.

- [#19389](https://github.com/LedgerHQ/ledger-live/pull/19389) [`c363a8c`](https://github.com/LedgerHQ/ledger-live/commit/c363a8c14d1e5022a21f153c36b3ddf609492487) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Desktop Contacts MVVM feature flag gate for `lwdContacts` entry configuration.

- [#19277](https://github.com/LedgerHQ/ledger-live/pull/19277) [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572) Thanks [@ishaba](https://github.com/ishaba)! - Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

- [#19685](https://github.com/LedgerHQ/ledger-live/pull/19685) [`c9f7d49`](https://github.com/LedgerHQ/ledger-live/commit/c9f7d494158be380622b156d09e5cd16dc6a693e) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - BUmp to lumen latest versions

- [#19552](https://github.com/LedgerHQ/ledger-live/pull/19552) [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate @ledgerhq/client-ids to DDD domain packages: @domain/entity-client-identity and @domain/api-push-devices

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

- [#19682](https://github.com/LedgerHQ/ledger-live/pull/19682) [`eb2a360`](https://github.com/LedgerHQ/ledger-live/commit/eb2a3600b171e57067d7061a3df453e943ed3e59) Thanks [@cfloume](https://github.com/cfloume)! - Include LWD and LWM product tour feature flags in analytics attributes.

- [#19451](https://github.com/LedgerHQ/ledger-live/pull/19451) [`a440904`](https://github.com/LedgerHQ/ledger-live/commit/a440904bf17f35e33bcc0257f06ec937d42ed730) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix desktop pre-release and nightly builds using the wrong Braze API key. Pre-release (RC) now correctly shares the production Braze app with `release` (validating the real integration before shipping, matching mobile's convention), and nightly now uses the staging Braze app (internal-only, safe for CRM to test canvases against), instead of both silently falling back to production

- [#19541](https://github.com/LedgerHQ/ledger-live/pull/19541) [`1c77aa0`](https://github.com/LedgerHQ/ledger-live/commit/1c77aa03b267b928e94bda24959a393ddd15a60b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Reduce console.error usage in main process and Datadog config to lower monitoring noise

- [#19459](https://github.com/LedgerHQ/ledger-live/pull/19459) [`11b78fb`](https://github.com/LedgerHQ/ledger-live/commit/11b78fbb1b6cc36dc0779e6f8c0ae418f5a24ce8) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint desktop UI currency reads from `@ledgerhq/cryptoassets` and the `@ledgerhq/live-common/currencies` barrel to `@domain/entity-currency-{crypto,fiat}` and `@features/platform-currencies` hooks directly.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#19662](https://github.com/LedgerHQ/ledger-live/pull/19662) [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.

- [#19376](https://github.com/LedgerHQ/ledger-live/pull/19376) [`22062fe`](https://github.com/LedgerHQ/ledger-live/commit/22062fef09a228bd9109919f5fc8ed2a2bec33e9) Thanks [@qperrot](https://github.com/qperrot)! - Fix: scroll list for Sei redelegation

- [#19496](https://github.com/LedgerHQ/ledger-live/pull/19496) [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136) Thanks [@deepyjr](https://github.com/deepyjr)! - Move Contacts feature flag parameter normalization and updates into the shared flow package for both debug tools.

- [#19495](https://github.com/LedgerHQ/ledger-live/pull/19495) [`c9aec57`](https://github.com/LedgerHQ/ledger-live/commit/c9aec577c2aeaf80592c643e95f0fda31f2a7bfa) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Stellar "Issuer is invalid" (and wrong lowercase asset code) when adding an asset. The add-asset screens parsed the case-sensitive Stellar code and issuer out of the CAL token id, which CAL lowercases; read them from the case-preserved token fields (name and contractAddress) instead. Also disable the desktop "Continue" button until an asset is selected.

- [#19421](https://github.com/LedgerHQ/ledger-live/pull/19421) [`1f79bd4`](https://github.com/LedgerHQ/ledger-live/commit/1f79bd4e9b7273dbf9e3208e5ddce3b752df62bd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix CryptoAddresses asset cell showing blacklisted tokens

- [#19449](https://github.com/LedgerHQ/ledger-live/pull/19449) [`65e8b15`](https://github.com/LedgerHQ/ledger-live/commit/65e8b15f2f9928e08c8d2b9eab1b7bd0f1b16433) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix minor UI issues on the Swap transaction status dialog on Desktop (canvas-sheet background and spacing below the main button). Forward a `swapId` from the `swapRedirectToHistory` handler to the Swap History screen on both Desktop and Mobile so the transaction status dialog/drawer opens automatically for the matching operation.

- [#19232](https://github.com/LedgerHQ/ledger-live/pull/19232) [`91771ee`](https://github.com/LedgerHQ/ledger-live/commit/91771eee45d56a2c2ab854e9234b06eb7a32feac) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Pass the `swapToEarn` feature flag to the Earn app as a `{ enabled, params? }` object, consistent with how other flags are forwarded

- [#19513](https://github.com/LedgerHQ/ledger-live/pull/19513) [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-card` package with `CardScreen` component integrated into the PayTab on desktop and mobile.

- [#19275](https://github.com/LedgerHQ/ledger-live/pull/19275) [`2c79418`](https://github.com/LedgerHQ/ledger-live/commit/2c794187db6994e7d6941956fd465e0472a46047) Thanks [@sarneijim](https://github.com/sarneijim)! - Support token asset detail deeplinks safely: parse and sanitize market/asset deeplink URLs (preserving token id case and avoiding ReDoS)

- [#19298](https://github.com/LedgerHQ/ledger-live/pull/19298) [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo mobile send flow customization

- [#19255](https://github.com/LedgerHQ/ledger-live/pull/19255) [`a399c13`](https://github.com/LedgerHQ/ledger-live/commit/a399c13984773926960e22b955b2f6bbb00cde32) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Wire Welcome analytics opt-in screen v2 as variant B behind lwdAnalyticsOptInScreenV2

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53), [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85), [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0), [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92), [`40a231e`](https://github.com/LedgerHQ/ledger-live/commit/40a231e524f3d2d6edccaae5928d65da23aae6fe), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`e379f4d`](https://github.com/LedgerHQ/ledger-live/commit/e379f4d8176d823d068b34d0249e5cb2fe48d0ce), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`681cd06`](https://github.com/LedgerHQ/ledger-live/commit/681cd06095cd2aa3f6cbaa7305e4437cde9ee241), [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2), [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa), [`1cc6fff`](https://github.com/LedgerHQ/ledger-live/commit/1cc6fff890d36ae12f81047882ae6e6e6fd2bac8), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a), [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57), [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657), [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`2d58d35`](https://github.com/LedgerHQ/ledger-live/commit/2d58d3505af6592b25be177ea05c56ecc561d422), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6), [`8fd4f90`](https://github.com/LedgerHQ/ledger-live/commit/8fd4f9019c1b3015eaa74ddad62dd786976913f7), [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1), [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`dccffa5`](https://github.com/LedgerHQ/ledger-live/commit/dccffa5c573922066d2ea0b1aba78cfa73a4fd37), [`93da625`](https://github.com/LedgerHQ/ledger-live/commit/93da62553369efbd30f8837a7ff30c5890ad889b), [`6627cb7`](https://github.com/LedgerHQ/ledger-live/commit/6627cb7ef2627c6e3ac520d01db6b2deefdfe7f3), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`2f7619d`](https://github.com/LedgerHQ/ledger-live/commit/2f7619dc269329c581c83ce982ddd4bc6e3c9abe), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5), [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f), [`4668086`](https://github.com/LedgerHQ/ledger-live/commit/4668086ebe172654fab32e9f01b7fd548bba0ced), [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7), [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79), [`452be85`](https://github.com/LedgerHQ/ledger-live/commit/452be85b27378f9240041119296ffa8c580fe071), [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`ad38c6d`](https://github.com/LedgerHQ/ledger-live/commit/ad38c6da54e35e14c53237f9ca4369091f15e8a0), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`44a08fa`](https://github.com/LedgerHQ/ledger-live/commit/44a08fa1cbbd560da60cee496af1ffa49dc380da), [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`92b234f`](https://github.com/LedgerHQ/ledger-live/commit/92b234fb80a0fdeb9a36ed8917d542a912e817ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136), [`deaa7ba`](https://github.com/LedgerHQ/ledger-live/commit/deaa7ba622776b95b87aee9926b34e20a0dc818b), [`f2de6f4`](https://github.com/LedgerHQ/ledger-live/commit/f2de6f4813889b9450266aa90d8436569107185d), [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b), [`f7d68bb`](https://github.com/LedgerHQ/ledger-live/commit/f7d68bb85919a8029536993b6b6ffa93f20c7683), [`2c79418`](https://github.com/LedgerHQ/ledger-live/commit/2c794187db6994e7d6941956fd465e0472a46047), [`e56f1b5`](https://github.com/LedgerHQ/ledger-live/commit/e56f1b53b0ddcde7dc517aad7bf2bb1a33346d76), [`c12485a`](https://github.com/LedgerHQ/ledger-live/commit/c12485ab346a02db79d864e8ecf7837d724a4575), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @ledgerhq/coin-bitcoin@0.47.0
  - @ledgerhq/coin-canton@0.29.0
  - @ledgerhq/coin-cardano@0.30.0
  - @ledgerhq/coin-casper@2.16.0
  - @ledgerhq/coin-concordium@0.16.0
  - @ledgerhq/coin-cosmos@0.39.0
  - @ledgerhq/coin-evm@4.6.0
  - @ledgerhq/coin-filecoin@1.28.0
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-common@36.5.0
  - @ledgerhq/cryptoassets@13.55.0
  - @features/flow-large-screen-upsell@0.2.0
  - @shared/feature-flags@0.14.0
  - @features/flow-contacts@0.2.0
  - @ledgerhq/live-env@2.42.0
  - @domain/api-pay-card@0.2.0
  - @domain/entity-pay-card@0.2.0
  - @features/flow-card@0.2.0
  - @domain/entity-contact@0.2.0
  - @ledgerhq/types-live@6.115.0
  - @domain/entity-currency-crypto@0.6.0
  - @domain/entity-currency-fiat@0.3.0
  - @ledgerhq/live-wallet@0.29.0
  - @domain/entity-large-screen-upsell-modal@0.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0
  - @devtools/bindings@0.2.0
  - @ledgerhq/asset-detail@0.9.0
  - @ledgerhq/live-currency-format@0.13.0
  - @domain/entity-market-sentiment@0.2.0
  - @domain/api-altcoins-sentiment@0.2.0
  - @features/flow-fear-and-greed@0.2.0
  - @domain/api-market-sentiment@0.2.0
  - @features/platform-currencies@0.3.0
  - @ledgerhq/asset-aggregation@0.11.0
  - @ledgerhq/live-countervalues@0.22.1
  - @ledgerhq/live-countervalues-react@0.16.2
  - @ledgerhq/wallet-analytics@0.2.1
  - @ledgerhq/wallet-pnl@0.7.2
  - @ledgerhq/live-dmk-desktop@0.20.1
  - @features/platform-feature-flags@0.6.1
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.1
  - @ledgerhq/live-dmk-speculos@0.10.2
  - @ledgerhq/live-network@2.6.8
  - @ledgerhq/domain-service@1.8.10
  - @domain/api-currency-token@0.2.1
  - @domain/api-currency-fiat@0.2.1
  - @devtools/shell@0.5.1

## 4.12.0-next.0

### Minor Changes

- [#19411](https://github.com/LedgerHQ/ledger-live/pull/19411) [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(algorand): not opt in asa error message

- [#19373](https://github.com/LedgerHQ/ledger-live/pull/19373) [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix GAM CTA visibility and empty-link click behavior on desktop and mobile

- [#19396](https://github.com/LedgerHQ/ledger-live/pull/19396) [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

- [#19501](https://github.com/LedgerHQ/ledger-live/pull/19501) [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix the Cosmos-family "Undelegating" tooltip in the desktop account summary footer, which hardcoded a 21-day timelock for every chain. It now uses each chain's actual unbonding period (e.g. ~2 days for Babylon, 14 for Osmosis, 30 for dYdX), matching the value already shown in the delegation section.

  Also make the Cosmos chain factory alias the crypto_org_croeseid testnet to crypto_org, so it resolves chain params instead of throwing (previously only the osmosis alias was handled).

- [#19628](https://github.com/LedgerHQ/ledger-live/pull/19628) [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92) Thanks [@qperrot](https://github.com/qperrot)! - Fix coin control not showing selected coins after entering an amount, and refine the coin control screen layout (subheader sizing, header spacing, and scrollbar gutter)

- [#19667](https://github.com/LedgerHQ/ledger-live/pull/19667) [`40a231e`](https://github.com/LedgerHQ/ledger-live/commit/40a231e524f3d2d6edccaae5928d65da23aae6fe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Segment analytics for the large-screen upsell modal (LIVE-33163): flow dismiss/CTA lifecycle ports and desktop trackPage/track wiring.

- [#19468](https://github.com/LedgerHQ/ledger-live/pull/19468) [`6daa358`](https://github.com/LedgerHQ/ledger-live/commit/6daa358825661b45a986c84ec7a85ad745d6a0da) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Desktop Developer settings debug controls for the `lwdContacts` rollout flag.

- [#19365](https://github.com/LedgerHQ/ledger-live/pull/19365) [`40903c6`](https://github.com/LedgerHQ/ledger-live/commit/40903c6960ec3ad99d08cddfca7b9b45b82a01ce) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add new page to lwd that opens devtools

- [#19469](https://github.com/LedgerHQ/ledger-live/pull/19469) [`a8a1e70`](https://github.com/LedgerHQ/ledger-live/commit/a8a1e7088dc97e7e7b41fbe26d1d850d3d9af080) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry config test expectations

- [#19643](https://github.com/LedgerHQ/ledger-live/pull/19643) [`1cc6fff`](https://github.com/LedgerHQ/ledger-live/commit/1cc6fff890d36ae12f81047882ae6e6e6fd2bac8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell modal UI on desktop (LIVE-33162).

- [#19577](https://github.com/LedgerHQ/ledger-live/pull/19577) [`a96b7c8`](https://github.com/LedgerHQ/ledger-live/commit/a96b7c805f326a0e7d5c20602cb614c9f87fc7cb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Reset App to fully reboot Electron so user identities are regenerated on next launch

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19614](https://github.com/LedgerHQ/ledger-live/pull/19614) [`8998c72`](https://github.com/LedgerHQ/ledger-live/commit/8998c720d2a3e525430be9a41761c06f446a21ad) Thanks [@jeportie](https://github.com/jeportie)! - Expose the swap transaction-details provider link URL via test/accessibility attributes so E2E can conditionally verify the provider link only when a provider URL exists (QAA-721)

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19582](https://github.com/LedgerHQ/ledger-live/pull/19582) [`97f30e4`](https://github.com/LedgerHQ/ledger-live/commit/97f30e4df0859097bf9416c9acac034eeedc95e0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop settings.supportedCounterValues — now derived at runtime from @domain/entity-currency-fiat

- [#19565](https://github.com/LedgerHQ/ledger-live/pull/19565) [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Contacts page shell with an empty list to the Desktop Contacts page.

- [#19388](https://github.com/LedgerHQ/ledger-live/pull/19388) [`c7d0489`](https://github.com/LedgerHQ/ledger-live/commit/c7d0489f419cc00262d31c1b0e29ac42eb507138) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `ledgerlive://paytab` deeplink that navigates to the Pay Tab screen when the `lwdPayTab` feature flag is enabled, falling back to the default handler otherwise.

- [#19340](https://github.com/LedgerHQ/ledger-live/pull/19340) [`5feb402`](https://github.com/LedgerHQ/ledger-live/commit/5feb40206e5aa47152698b4173bea95ac7a44b54) Thanks [@deepyjr](https://github.com/deepyjr)! - Add dust filter tracking and active-state copy.

- [#19445](https://github.com/LedgerHQ/ledger-live/pull/19445) [`57e7569`](https://github.com/LedgerHQ/ledger-live/commit/57e7569c491d54d03304d40d4a76c01e92b028b6) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Add stable `data-testid` attributes to the operation details drawer amount and identifier labels to make E2E selectors robust against duplicate on-page text.

- [#19519](https://github.com/LedgerHQ/ledger-live/pull/19519) [`63792ba`](https://github.com/LedgerHQ/ledger-live/commit/63792bae54e2ff58dc39df157385f7206cdd6be5) Thanks [@cfloume](https://github.com/cfloume)! - fix: prevent Q2 tour from showing to users who haven't onboarded

- [#19342](https://github.com/LedgerHQ/ledger-live/pull/19342) [`1ee03bd`](https://github.com/LedgerHQ/ledger-live/commit/1ee03bd0f8ea26c7a069b4fdb53352eae4c0d497) Thanks [@qperrot](https://github.com/qperrot)! - Fix EVM native staking delegation row not always showing the validator name on the account page. The moniker is now resolved from the reactive validators hook (the same source as the Delegate modal) instead of `account.stakingResources.validators`, which was only populated by a successful, non-empty account sync and could leave the raw validator address showing until the next sync.

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

- [#19331](https://github.com/LedgerHQ/ledger-live/pull/19331) [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b) Thanks [@ysitbon](https://github.com/ysitbon)! - Activate the RTK Query supported-fiats flow and retire the legacy CVS polling path: boot-time query populates the Redux slice; settings and countervalue selectors read from the slice synchronously.

- [#19486](https://github.com/LedgerHQ/ledger-live/pull/19486) [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming and outgoing dust transactions in history.

- [#19560](https://github.com/LedgerHQ/ledger-live/pull/19560) [`76049c2`](https://github.com/LedgerHQ/ledger-live/commit/76049c20f7e23daeafa5b1eb386cb43f876336f8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix logger.critical not capturing non-Error thrown values

- [#19419](https://github.com/LedgerHQ/ledger-live/pull/19419) [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming native dust transactions in operation histories.

- [#19536](https://github.com/LedgerHQ/ledger-live/pull/19536) [`f854c29`](https://github.com/LedgerHQ/ledger-live/commit/f854c29bf164948ff2a38c01a1dc88e8fb297bc1) Thanks [@amaslakov](https://github.com/amaslakov)! - Warn and explain when Tezos staking is blocked by an unfinalizable unstake to another validator: translate the raw fee-estimation error into a clear message, and show an inline warning on the change-validator summary while a pending unstake is still unfinalizable

- [#19642](https://github.com/LedgerHQ/ledger-live/pull/19642) [`465ebec`](https://github.com/LedgerHQ/ledger-live/commit/465ebec92fe42416b6af2f8f8c739582643af130) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire the large-screen upsell modal frequency state into desktop (LIVE-33160 / LIVE-33161): register the reducer and hydrate/persist it via storage. Composition hook and UI land in a later slice.

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

- [#19370](https://github.com/LedgerHQ/ledger-live/pull/19370) [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff) Thanks [@pawell24](https://github.com/pawell24)! - Rename "Ledger by Chorus One" to "Ledger by Bitwise" following Bitwise's acquisition of Chorus One

- [#19379](https://github.com/LedgerHQ/ledger-live/pull/19379) [`16be920`](https://github.com/LedgerHQ/ledger-live/commit/16be9200af8048d5b359606a1425b09d092bde9d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Pay Tab to the desktop sidebar, replacing the Card entry when the `lwdPayTab` feature flag is enabled

- [#19594](https://github.com/LedgerHQ/ledger-live/pull/19594) [`569d68a`](https://github.com/LedgerHQ/ledger-live/commit/569d68a6bb9d5115da5e47e1f80021f86e60dbcd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Analytics chart header to show Total balance label, md trend sizing, scrub-driven balance and date updates, and hide the chart scrubber tooltip.

- [#19551](https://github.com/LedgerHQ/ledger-live/pull/19551) [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contact entry and gated empty Contacts page shell backed by domain contacts state.

- [#19389](https://github.com/LedgerHQ/ledger-live/pull/19389) [`c363a8c`](https://github.com/LedgerHQ/ledger-live/commit/c363a8c14d1e5022a21f153c36b3ddf609492487) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Desktop Contacts MVVM feature flag gate for `lwdContacts` entry configuration.

- [#19277](https://github.com/LedgerHQ/ledger-live/pull/19277) [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572) Thanks [@ishaba](https://github.com/ishaba)! - Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

- [#19685](https://github.com/LedgerHQ/ledger-live/pull/19685) [`c9f7d49`](https://github.com/LedgerHQ/ledger-live/commit/c9f7d494158be380622b156d09e5cd16dc6a693e) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - BUmp to lumen latest versions

- [#19552](https://github.com/LedgerHQ/ledger-live/pull/19552) [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate @ledgerhq/client-ids to DDD domain packages: @domain/entity-client-identity and @domain/api-push-devices

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

- [#19682](https://github.com/LedgerHQ/ledger-live/pull/19682) [`eb2a360`](https://github.com/LedgerHQ/ledger-live/commit/eb2a3600b171e57067d7061a3df453e943ed3e59) Thanks [@cfloume](https://github.com/cfloume)! - Include LWD and LWM product tour feature flags in analytics attributes.

- [#19451](https://github.com/LedgerHQ/ledger-live/pull/19451) [`a440904`](https://github.com/LedgerHQ/ledger-live/commit/a440904bf17f35e33bcc0257f06ec937d42ed730) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix desktop pre-release and nightly builds using the wrong Braze API key. Pre-release (RC) now correctly shares the production Braze app with `release` (validating the real integration before shipping, matching mobile's convention), and nightly now uses the staging Braze app (internal-only, safe for CRM to test canvases against), instead of both silently falling back to production

- [#19541](https://github.com/LedgerHQ/ledger-live/pull/19541) [`1c77aa0`](https://github.com/LedgerHQ/ledger-live/commit/1c77aa03b267b928e94bda24959a393ddd15a60b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Reduce console.error usage in main process and Datadog config to lower monitoring noise

- [#19459](https://github.com/LedgerHQ/ledger-live/pull/19459) [`11b78fb`](https://github.com/LedgerHQ/ledger-live/commit/11b78fbb1b6cc36dc0779e6f8c0ae418f5a24ce8) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint desktop UI currency reads from `@ledgerhq/cryptoassets` and the `@ledgerhq/live-common/currencies` barrel to `@domain/entity-currency-{crypto,fiat}` and `@features/platform-currencies` hooks directly.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#19662](https://github.com/LedgerHQ/ledger-live/pull/19662) [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.

- [#19376](https://github.com/LedgerHQ/ledger-live/pull/19376) [`22062fe`](https://github.com/LedgerHQ/ledger-live/commit/22062fef09a228bd9109919f5fc8ed2a2bec33e9) Thanks [@qperrot](https://github.com/qperrot)! - Fix: scroll list for Sei redelegation

- [#19496](https://github.com/LedgerHQ/ledger-live/pull/19496) [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136) Thanks [@deepyjr](https://github.com/deepyjr)! - Move Contacts feature flag parameter normalization and updates into the shared flow package for both debug tools.

- [#19495](https://github.com/LedgerHQ/ledger-live/pull/19495) [`c9aec57`](https://github.com/LedgerHQ/ledger-live/commit/c9aec577c2aeaf80592c643e95f0fda31f2a7bfa) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Stellar "Issuer is invalid" (and wrong lowercase asset code) when adding an asset. The add-asset screens parsed the case-sensitive Stellar code and issuer out of the CAL token id, which CAL lowercases; read them from the case-preserved token fields (name and contractAddress) instead. Also disable the desktop "Continue" button until an asset is selected.

- [#19421](https://github.com/LedgerHQ/ledger-live/pull/19421) [`1f79bd4`](https://github.com/LedgerHQ/ledger-live/commit/1f79bd4e9b7273dbf9e3208e5ddce3b752df62bd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix CryptoAddresses asset cell showing blacklisted tokens

- [#19449](https://github.com/LedgerHQ/ledger-live/pull/19449) [`65e8b15`](https://github.com/LedgerHQ/ledger-live/commit/65e8b15f2f9928e08c8d2b9eab1b7bd0f1b16433) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix minor UI issues on the Swap transaction status dialog on Desktop (canvas-sheet background and spacing below the main button). Forward a `swapId` from the `swapRedirectToHistory` handler to the Swap History screen on both Desktop and Mobile so the transaction status dialog/drawer opens automatically for the matching operation.

- [#19232](https://github.com/LedgerHQ/ledger-live/pull/19232) [`91771ee`](https://github.com/LedgerHQ/ledger-live/commit/91771eee45d56a2c2ab854e9234b06eb7a32feac) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Pass the `swapToEarn` feature flag to the Earn app as a `{ enabled, params? }` object, consistent with how other flags are forwarded

- [#19513](https://github.com/LedgerHQ/ledger-live/pull/19513) [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-card` package with `CardScreen` component integrated into the PayTab on desktop and mobile.

- [#19275](https://github.com/LedgerHQ/ledger-live/pull/19275) [`2c79418`](https://github.com/LedgerHQ/ledger-live/commit/2c794187db6994e7d6941956fd465e0472a46047) Thanks [@sarneijim](https://github.com/sarneijim)! - Support token asset detail deeplinks safely: parse and sanitize market/asset deeplink URLs (preserving token id case and avoiding ReDoS)

- [#19298](https://github.com/LedgerHQ/ledger-live/pull/19298) [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo mobile send flow customization

- [#19255](https://github.com/LedgerHQ/ledger-live/pull/19255) [`a399c13`](https://github.com/LedgerHQ/ledger-live/commit/a399c13984773926960e22b955b2f6bbb00cde32) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Wire Welcome analytics opt-in screen v2 as variant B behind lwdAnalyticsOptInScreenV2

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53), [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85), [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0), [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92), [`40a231e`](https://github.com/LedgerHQ/ledger-live/commit/40a231e524f3d2d6edccaae5928d65da23aae6fe), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`e379f4d`](https://github.com/LedgerHQ/ledger-live/commit/e379f4d8176d823d068b34d0249e5cb2fe48d0ce), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`681cd06`](https://github.com/LedgerHQ/ledger-live/commit/681cd06095cd2aa3f6cbaa7305e4437cde9ee241), [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2), [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa), [`1cc6fff`](https://github.com/LedgerHQ/ledger-live/commit/1cc6fff890d36ae12f81047882ae6e6e6fd2bac8), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a), [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57), [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657), [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`2d58d35`](https://github.com/LedgerHQ/ledger-live/commit/2d58d3505af6592b25be177ea05c56ecc561d422), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6), [`8fd4f90`](https://github.com/LedgerHQ/ledger-live/commit/8fd4f9019c1b3015eaa74ddad62dd786976913f7), [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1), [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`dccffa5`](https://github.com/LedgerHQ/ledger-live/commit/dccffa5c573922066d2ea0b1aba78cfa73a4fd37), [`93da625`](https://github.com/LedgerHQ/ledger-live/commit/93da62553369efbd30f8837a7ff30c5890ad889b), [`6627cb7`](https://github.com/LedgerHQ/ledger-live/commit/6627cb7ef2627c6e3ac520d01db6b2deefdfe7f3), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`2f7619d`](https://github.com/LedgerHQ/ledger-live/commit/2f7619dc269329c581c83ce982ddd4bc6e3c9abe), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5), [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f), [`4668086`](https://github.com/LedgerHQ/ledger-live/commit/4668086ebe172654fab32e9f01b7fd548bba0ced), [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7), [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79), [`452be85`](https://github.com/LedgerHQ/ledger-live/commit/452be85b27378f9240041119296ffa8c580fe071), [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`ad38c6d`](https://github.com/LedgerHQ/ledger-live/commit/ad38c6da54e35e14c53237f9ca4369091f15e8a0), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`44a08fa`](https://github.com/LedgerHQ/ledger-live/commit/44a08fa1cbbd560da60cee496af1ffa49dc380da), [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`92b234f`](https://github.com/LedgerHQ/ledger-live/commit/92b234fb80a0fdeb9a36ed8917d542a912e817ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136), [`deaa7ba`](https://github.com/LedgerHQ/ledger-live/commit/deaa7ba622776b95b87aee9926b34e20a0dc818b), [`f2de6f4`](https://github.com/LedgerHQ/ledger-live/commit/f2de6f4813889b9450266aa90d8436569107185d), [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b), [`f7d68bb`](https://github.com/LedgerHQ/ledger-live/commit/f7d68bb85919a8029536993b6b6ffa93f20c7683), [`2c79418`](https://github.com/LedgerHQ/ledger-live/commit/2c794187db6994e7d6941956fd465e0472a46047), [`e56f1b5`](https://github.com/LedgerHQ/ledger-live/commit/e56f1b53b0ddcde7dc517aad7bf2bb1a33346d76), [`c12485a`](https://github.com/LedgerHQ/ledger-live/commit/c12485ab346a02db79d864e8ecf7837d724a4575), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @ledgerhq/coin-bitcoin@0.47.0-next.0
  - @ledgerhq/coin-canton@0.29.0-next.0
  - @ledgerhq/coin-cardano@0.30.0-next.0
  - @ledgerhq/coin-casper@2.16.0-next.0
  - @ledgerhq/coin-concordium@0.16.0-next.0
  - @ledgerhq/coin-cosmos@0.39.0-next.0
  - @ledgerhq/coin-evm@4.6.0-next.0
  - @ledgerhq/coin-filecoin@1.28.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/live-common@36.5.0-next.0
  - @ledgerhq/cryptoassets@13.55.0-next.0
  - @features/flow-large-screen-upsell@0.2.0-next.0
  - @shared/feature-flags@0.14.0-next.0
  - @features/flow-contacts@0.2.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @domain/api-pay-card@0.2.0-next.0
  - @domain/entity-pay-card@0.2.0-next.0
  - @features/flow-card@0.2.0-next.0
  - @domain/entity-contact@0.2.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @domain/entity-currency-crypto@0.6.0-next.0
  - @domain/entity-currency-fiat@0.3.0-next.0
  - @ledgerhq/live-wallet@0.29.0-next.0
  - @domain/entity-large-screen-upsell-modal@0.2.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0-next.0
  - @devtools/bindings@0.2.0-next.0
  - @ledgerhq/asset-detail@0.9.0-next.0
  - @ledgerhq/live-currency-format@0.13.0-next.0
  - @domain/entity-market-sentiment@0.2.0-next.0
  - @domain/api-altcoins-sentiment@0.2.0-next.0
  - @features/flow-fear-and-greed@0.2.0-next.0
  - @domain/api-market-sentiment@0.2.0-next.0
  - @features/platform-currencies@0.3.0-next.0
  - @ledgerhq/asset-aggregation@0.11.0-next.0
  - @ledgerhq/live-countervalues@0.22.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.2-next.0
  - @ledgerhq/wallet-analytics@0.2.1-next.0
  - @ledgerhq/wallet-pnl@0.7.2-next.0
  - @ledgerhq/live-dmk-desktop@0.20.1-next.0
  - @features/platform-feature-flags@0.6.1-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.2-next.0
  - @ledgerhq/live-network@2.6.8-next.0
  - @ledgerhq/domain-service@1.8.10-next.0
  - @domain/api-currency-token@0.2.1-next.0
  - @domain/api-currency-fiat@0.2.1-next.0
  - @devtools/shell@0.5.1-next.0

## 4.11.0

### Minor Changes

- [#19082](https://github.com/LedgerHQ/ledger-live/pull/19082) [`ba55b01`](https://github.com/LedgerHQ/ledger-live/commit/ba55b01bd7ed101f47e685c8204c2b9e9385d8b2) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Rename the desktop analytics property emitted for the `ptxBorrowLiveApp` feature flag from `ptxBorrowLiveApp` to `borrowFeature` so it matches mobile and the documented `borrowFeature` Segment trait.

- [#19180](https://github.com/LedgerHQ/ledger-live/pull/19180) [`343208d`](https://github.com/LedgerHQ/ledger-live/commit/343208d92d0ca0d6b0c23e1c4df39a6e8cf43463) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Update borrow entry point copy and icon in Portfolio, and move the borrow section into the Wallet Assets group on mobile

- [#18987](https://github.com/LedgerHQ/ledger-live/pull/18987) [`98ee95c`](https://github.com/LedgerHQ/ledger-live/commit/98ee95c139df6ecbaa9b5198a4e7dee3a2d0cad4) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Add `borrowFeature` analytics property derived from the `ptxBorrowLiveApp` feature flag, included in identify traits and track events on both desktop and mobile.

- [#19233](https://github.com/LedgerHQ/ledger-live/pull/19233) [`7e5eb6c`](https://github.com/LedgerHQ/ledger-live/commit/7e5eb6c4e6bedc62c0451005ebd14c5c29af2ddd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Replace deprecated findCryptoCurrencyByTicker with findCryptoCurrencyById in EVM staking provider icon

- [#19101](https://github.com/LedgerHQ/ledger-live/pull/19101) [`4b615c2`](https://github.com/LedgerHQ/ledger-live/commit/4b615c242a3b4d8ecb2ebf4e039a46e2bbfe5e19) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix countervalue magnitude in the new send flow

- [#18866](https://github.com/LedgerHQ/ledger-live/pull/18866) [`e0be780`](https://github.com/LedgerHQ/ledger-live/commit/e0be78080913f25173b2352192ee264a46717aa0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add desktop DeviceActionContent component and developer playground

- [#19087](https://github.com/LedgerHQ/ledger-live/pull/19087) [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Use the node's min relay fee as the minimum for manual Bitcoin-family fees in the send flow (BTC falls back to 1 sat/vB). A fee below it is now rejected in the form instead of at broadcast.

- [#18857](https://github.com/LedgerHQ/ledger-live/pull/18857) [`eff921d`](https://github.com/LedgerHQ/ledger-live/commit/eff921d01337b927db19c09ccd3730c4a5a7cec3) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Improve GAM dev tools (campaign id overview, clear dismissed ids, skip APP_START launch hydration) and gate APP_START modal on campaign completeness

- [#19327](https://github.com/LedgerHQ/ledger-live/pull/19327) [`ac338b3`](https://github.com/LedgerHQ/ledger-live/commit/ac338b3b80632b856a9854b3b31af406edf4d2ae) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix analytics chart overflow clipping by removing overflow-hidden class

- [#19314](https://github.com/LedgerHQ/ledger-live/pull/19314) [`4232eab`](https://github.com/LedgerHQ/ledger-live/commit/4232eab720909a50e06aeb6cd9a6161f4beabfe2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Analytics and Asset Detail charts keeping scrubber focus when moving the pointer below the graph. Use the default chart height with Y-axis domain padding instead of an extra 50px SVG hit area.

- [#19627](https://github.com/LedgerHQ/ledger-live/pull/19627) [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merge release branch into hotfix support branch, resolving version and changelog conflicts

- [#18917](https://github.com/LedgerHQ/ledger-live/pull/18917) [`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07) Thanks [@YazhuEth](https://github.com/YazhuEth)! - celo: deprecate the "Ledger by Figment" validator. It is no longer shown or selectable in the vote flow and is never the default — the validator list is now ranked by TVL with none selected by default. Existing delegations remain fully manageable (unvote / unlock / withdraw).

- [#19198](https://github.com/LedgerHQ/ledger-live/pull/19198) [`b50b405`](https://github.com/LedgerHQ/ledger-live/commit/b50b405457d3c12513415cfc43efb84b580613c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the portfolio Analytics chart displaying countervalues inflated by x100. The chart data and variation text are already expressed in the fiat unit's smallest atom, but the formatter applied an extra magnitude shift. A dedicated `createSmallestUnitFiatLineChartValueFormatter` is now used for smallest-atom data, and the variation text is shifted down by the unit magnitude.

- [#18856](https://github.com/LedgerHQ/ledger-live/pull/18856) [`c0c3a63`](https://github.com/LedgerHQ/ledger-live/commit/c0c3a63f631f2806829038faab342dc8888c3451) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): remove all evm mention in the new send flow

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19055](https://github.com/LedgerHQ/ledger-live/pull/19055) [`0675175`](https://github.com/LedgerHQ/ledger-live/commit/067517562894996679f7b05316deba64ae7486f8) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add MVVM connect device flow on desktop with a WebHID discovery source

- [#19010](https://github.com/LedgerHQ/ledger-live/pull/19010) [`d3c7634`](https://github.com/LedgerHQ/ledger-live/commit/d3c7634448b877ddb8c61da31b1597c9a5266ec3) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add a desktop known devices store: a persisted `knownDevices` reducer (seeded on settings load from `lastSeenDevice` / `lastOnboardedDevice`, upserted from device sources, deduped per model id) using the shared `KnownDevice` shape, with WebHID serialization helpers for robust persistence.

- [#18914](https://github.com/LedgerHQ/ledger-live/pull/18914) [`9a79fe3`](https://github.com/LedgerHQ/ledger-live/commit/9a79fe317af773720125f26168856c3de53090e6) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Cosmos "Reward from" row layout in transaction details so the validator name and amount display inline with the other rows

- [#19324](https://github.com/LedgerHQ/ledger-live/pull/19324) [`5c5064f`](https://github.com/LedgerHQ/ledger-live/commit/5c5064f76ac922bb57dc8f7cbacc27c2acb7bb00) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve crypto counter-values by Ledger id instead of ticker, and migrate existing users' persisted crypto counterValue (BTC/ETH) to ids. Fiats keep ticker-based resolution.

- [#19256](https://github.com/LedgerHQ/ledger-live/pull/19256) [`7a3c4a5`](https://github.com/LedgerHQ/ledger-live/commit/7a3c4a5a2dd0c1ca7382d4bc9c27d2e3bfc671a9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - private sync for mobile Aleo part 1

- [#18973](https://github.com/LedgerHQ/ledger-live/pull/18973) [`799e2db`](https://github.com/LedgerHQ/ledger-live/commit/799e2dbad64ee4126dd12d8b904b5e2eecd183cf) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Revert the `@datadog/electron-sdk` main-process integration (#17844) due to boot-time issues. The Electron main process no longer initializes Datadog/dd-trace; renderer Datadog reporting is unchanged. The asar source-map URL rewrite in the renderer `beforeSend` is kept.

- [#19062](https://github.com/LedgerHQ/ledger-live/pull/19062) [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Extract E2E test-support code out of `@ledgerhq/live-common`

  Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
  `@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
  (located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
  out of `live-common`, which is in maintenance mode.

  - `@ledgerhq/live-common`: removed the internal `./e2e` export.
  - `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
    module), so production debug tooling no longer depends on test code.
  - `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
    local map instead of importing from the e2e module.
  - Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.

- [#19184](https://github.com/LedgerHQ/ledger-live/pull/19184) [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

  `AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#18934](https://github.com/LedgerHQ/ledger-live/pull/18934) [`edebe91`](https://github.com/LedgerHQ/ledger-live/commit/edebe91895773e4e2c9f29bc0a991885d2f44a77) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): restore recent address store for lwdm

- [#19480](https://github.com/LedgerHQ/ledger-live/pull/19480) [`131e127`](https://github.com/LedgerHQ/ledger-live/commit/131e127e298147e7e7ea044e54ecb5ab853b0b17) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): open MAD on send from aggregated assets page

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a) Thanks [@ysitbon](https://github.com/ysitbon)! - Add supported-fiats RTK slice to @domain/entity-currency-fiat; wire currencyFiatApi onQueryStarted to dispatch it; register currencyFiatApi in desktop and mobile stores with cvsApiExtra extraArgument composition.

- [#19141](https://github.com/LedgerHQ/ledger-live/pull/19141) [`2caa65c`](https://github.com/LedgerHQ/ledger-live/commit/2caa65c2ada66ef20c76950b5a2b01c49845f8eb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix content card displayedPosition analytics by stripping Braze string values in sanitizeExtras and finalizing numeric indices at the tracking gateway (mobile trackContentCardEvent, desktop trackContentCard) instead of at each call site.

- [#19001](https://github.com/LedgerHQ/ledger-live/pull/19001) [`131af70`](https://github.com/LedgerHQ/ledger-live/commit/131af709959070c34bc54e7436987c02451ed767) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Flex onboarding completion confetti animation stuck in the top-left corner

- [#19207](https://github.com/LedgerHQ/ledger-live/pull/19207) [`b786830`](https://github.com/LedgerHQ/ledger-live/commit/b786830e71db428b8583c61c9897a5b2ec300558) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwd): add linter rules for the new send flow

- [#18951](https://github.com/LedgerHQ/ledger-live/pull/18951) [`bfb5437`](https://github.com/LedgerHQ/ledger-live/commit/bfb543708a32256379067903c3f1c3ab46a323d3) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Desktop transaction history dust filtering controls.

- [#19272](https://github.com/LedgerHQ/ledger-live/pull/19272) [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): raise an error if gas price is less than the network minimum

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#19063](https://github.com/LedgerHQ/ledger-live/pull/19063) [`eab9b13`](https://github.com/LedgerHQ/ledger-live/commit/eab9b130e0a809d6dead08bbd1a588112da94e0c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): refactor useFeePresetFiatValues to use in both LWDM

- [#19245](https://github.com/LedgerHQ/ledger-live/pull/19245) [`b5699a5`](https://github.com/LedgerHQ/ledger-live/commit/b5699a54d7edd5b3579a7f35d77a03d2b0506d19) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): remove memo algorand in new send flow lwdm

- [#18985](https://github.com/LedgerHQ/ledger-live/pull/18985) [`2584bc0`](https://github.com/LedgerHQ/ledger-live/commit/2584bc06cb0d60818996b6f5c90caba3b53cacb7) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: small aleo UI tweaks

- [#18965](https://github.com/LedgerHQ/ledger-live/pull/18965) [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157) Thanks [@ishaba](https://github.com/ishaba)! - perf(sui): populate staking extras at sync, drop per-drawer transaction(digest:) re-fetch

- [#19007](https://github.com/LedgerHQ/ledger-live/pull/19007) [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303) Thanks [@ysitbon](https://github.com/ysitbon)! - Inject the domain-backed crypto-currency registry (`@domain/entity-currency-crypto`) at app bootstrap via `setCryptoCurrenciesStore`, making the domain registry the runtime source of truth for currency data. The bundled data in `@ledgerhq/cryptoassets` stays as the fallback.

- [#18946](https://github.com/LedgerHQ/ledger-live/pull/18946) [`e3f7101`](https://github.com/LedgerHQ/ledger-live/commit/e3f710135c02d85d2399dc0f68f3d2604c520d7f) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bootstrap the Device Intent Executor integration on desktop with an initialization playground.

- [#18849](https://github.com/LedgerHQ/ledger-live/pull/18849) [`8559583`](https://github.com/LedgerHQ/ledger-live/commit/855958357523fa0b9213adcd2ab4c789ea358452) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a data-testid on the My Ledger entry and adapt desktop E2E page objects for the Wallet 4.0 Q2 feature flags (myWallet, operationsList) defaulting ON

- [#18568](https://github.com/LedgerHQ/ledger-live/pull/18568) [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(lkrp): per-application close on Wallet Sync deactivation

  Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

  - `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
  - `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
  - New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
  - `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
  - LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
  - web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.

- [#18870](https://github.com/LedgerHQ/ledger-live/pull/18870) [`efd0670`](https://github.com/LedgerHQ/ledger-live/commit/efd0670ebbf61fecab5fcdd7e7f074a6ddaa8b3a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Make the `lldDatadog` feature flag an exclusive (XOR) switch between Datadog and Sentry crash monitoring for A/B testing. When the flag is on, telemetry goes to Datadog (renderer only) and Sentry is muted; when off, Sentry stays on. The flag is resolved only in the renderer, so it is mirrored to the main process over IPC to also mute the main-process Sentry. Both backends remain gated by the user's "Bug reports" opt-in (`sentryLogs`).

- [#18936](https://github.com/LedgerHQ/ledger-live/pull/18936) [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - lldRebordABTest feature flag clean up

- [#19181](https://github.com/LedgerHQ/ledger-live/pull/19181) [`d23bb3e`](https://github.com/LedgerHQ/ledger-live/commit/d23bb3e59a2180d660c1636ede1143329a0ddff0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system dependencies to the 6/26/2026 release

- [#19424](https://github.com/LedgerHQ/ledger-live/pull/19424) [`8d5087e`](https://github.com/LedgerHQ/ledger-live/commit/8d5087ebbd6684a6e21e4d0db40903a739dae1f5) Thanks [@desirendr](https://github.com/desirendr)! - LWD 4.11.0 release notes

- [#18918](https://github.com/LedgerHQ/ledger-live/pull/18918) [`3899691`](https://github.com/LedgerHQ/ledger-live/commit/38996911f24e72004ae51d07fdf6ca8bd9858796) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Lumen portfolio chart to Analytics when PnL is enabled, with balance header and range-aware variation (first receive baseline for all-time).

- [#18959](https://github.com/LedgerHQ/ledger-live/pull/18959) [`2761740`](https://github.com/LedgerHQ/ledger-live/commit/2761740df78bbc39866bab840c20439eaa0f0f5e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Global Search now surfaces testnets when developer mode is enabled, mirroring the Receive flow's DADA query logic (`includeTestNetworks` + staging environment). Fixes LIVE-33220.

- [#18916](https://github.com/LedgerHQ/ledger-live/pull/18916) [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared LineChart axis/formatters utilities, custom ranges prop, and chart label inset fix. Refactor AssetDetail chart VM to use shared helpers. Add Analytics all-time value change helpers and export `meaningfulPercentage` from live-countervalues.

- [#19115](https://github.com/LedgerHQ/ledger-live/pull/19115) [`f2fa7b5`](https://github.com/LedgerHQ/ledger-live/commit/f2fa7b51fd6f256d3214bd610acc8a3d710dd6eb) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Display percentage evolution alongside absolute values in the LWD PnL detail modal on Asset Detail and Analytics pages.

- [#18960](https://github.com/LedgerHQ/ledger-live/pull/18960) [`199eb86`](https://github.com/LedgerHQ/ledger-live/commit/199eb869e51005a71f041bd851917c9645405695) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet) when the user holds a positive balance. The banner is gated by the `llRobinhoodDisclaimer` feature flag. Adds the shared `isRobinhoodExclusiveAsset` helper to `@ledgerhq/asset-detail`. Implements LIVE-32756.

- [#19023](https://github.com/LedgerHQ/ledger-live/pull/19023) [`3f71b7a`](https://github.com/LedgerHQ/ledger-live/commit/3f71b7af8419e92e907be029b7fed052288561b7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Monad staking: pin the Ledger validator ("Ledger by P2P.org") to the top of the validator list so it is selected by default when delegating

- [#19105](https://github.com/LedgerHQ/ledger-live/pull/19105) [`5b42843`](https://github.com/LedgerHQ/ledger-live/commit/5b42843f4575002f3d808046eb0f7e6fd339e74a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the legacy Wallet 4.0 main-nav feature toggle (`shouldDisplayWallet40MainNav`) and the now-dead legacy navigation code it gated. The new Wallet 4.0 `SideBar` is now always used, and the old `MainSideBar`, `TopBar`, `Stars`, `Help` modal, `ScrollUpButton`, and related unused icons/components have been deleted.

- [#18633](https://github.com/LedgerHQ/ledger-live/pull/18633) [`e9b1707`](https://github.com/LedgerHQ/ledger-live/commit/e9b17073cdf3266692adc4348c9a54f5597da4c8) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): move the Celo "Pay fees in" selector from the Amount step to the Custom fees step using a generic, family-agnostic fee asset descriptor

- [#19133](https://github.com/LedgerHQ/ledger-live/pull/19133) [`eccd24f`](https://github.com/LedgerHQ/ledger-live/commit/eccd24ffee4067dffc9b18a87f23389a4f74cdce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the temporary Wallet 4.0 `graphRework` and `balanceRefreshRework` feature-flag gating on the portfolio. The reworked balance graph, balance refresh animation and two-decimal value-change percentage are now always on, and the related `shouldDisplayGraphRework` / `shouldDisplayBalanceRefreshRework` props and config reads have been dropped.

- [#19187](https://github.com/LedgerHQ/ledger-live/pull/19187) [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e) Thanks [@sarneijim](https://github.com/sarneijim)! - Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.

- [#18913](https://github.com/LedgerHQ/ledger-live/pull/18913) [`c6cf445`](https://github.com/LedgerHQ/ledger-live/commit/c6cf445c9bac5a56bcbf84ccda6b2b269d1ee61a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the legacy add-account modal, DataSelector drawers and modular drawer visibility gating now that the Modular Drawer is the only flow. All Live App, stake, send and account-selection entry points use the modular flows unconditionally, and the `useModularDrawerVisibility` hook is removed in favor of a dedicated `ModularDrawerVisibleParams` type.

- [#18906](https://github.com/LedgerHQ/ledger-live/pull/18906) [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `getProductName` to `@ledgerhq/devices` returning the plain, canonical device product name (e.g. "Ledger Flex"), and deprecate the app-level `getProductName` utils that strip the "Ledger" prefix.

- [#19000](https://github.com/LedgerHQ/ledger-live/pull/19000) [`5d4cc7a`](https://github.com/LedgerHQ/ledger-live/commit/5d4cc7a8056d3f8ad59058091d4378328a960468) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Translate the "To:" prefix label in the new Send flow recipient input

- [#19009](https://github.com/LedgerHQ/ledger-live/pull/19009) [`1f25437`](https://github.com/LedgerHQ/ledger-live/commit/1f254373fedec85e50364fdbc6bb9ec4fd5256b2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Track Funds received analytics when a new receive operation is synced on desktop and mobile.

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#19003](https://github.com/LedgerHQ/ledger-live/pull/19003) [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed

- [#19182](https://github.com/LedgerHQ/ledger-live/pull/19182) [`271334e`](https://github.com/LedgerHQ/ledger-live/commit/271334ed8fb6b09726b36d5ebce107b2657251cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - refactor: remove the Wallet 4.0 feature flag and delete the legacy classic dashboard

  The Wallet 4.0 layout is now the default. Removed the `isWallet40Enabled` branching across the Page, Portfolio and layout components, and deleted the unused legacy dashboard screens (classic dashboard, empty states, featured buttons, no-accounts illustration). The `/` route now renders the MVVM `PortfolioPage` directly.

- [#19046](https://github.com/LedgerHQ/ledger-live/pull/19046) [`ee09168`](https://github.com/LedgerHQ/ledger-live/commit/ee0916882310847b5e79c3ddbdca4c4b38d4260a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - refactored max number of records per account type

- [#18778](https://github.com/LedgerHQ/ledger-live/pull/18778) [`b9ffdc9`](https://github.com/LedgerHQ/ledger-live/commit/b9ffdc91708686ca1d6c126894b9481b0ffb0305) Thanks [@qperrot](https://github.com/qperrot)! - Fix: add a check for minimum staking amount on solana

- [#19254](https://github.com/LedgerHQ/ledger-live/pull/19254) [`0ccdd6c`](https://github.com/LedgerHQ/ledger-live/commit/0ccdd6c301d1c27795bf440559e3e85bdb21d6c4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Reorganize PortfolioPage into screens subdirectory and simplify AssetDistribution Header by removing unused `isResponsiveLayout` prop.

- [#18928](https://github.com/LedgerHQ/ledger-live/pull/18928) [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31) Thanks [@qperrot](https://github.com/qperrot)! - fix(sei): determine Sei EVM account association via on-chain RPC

  `isSeiAccountUnassociated` now resolves whether a Sei EVM (0x) address is linked
  on-chain to its Cosmos (sei1) address by querying the chain's address precompile
  (`getSeiAddr`) instead of inferring it from the local operation history. The
  function is now async and no longer takes an `operations` argument; the delegation
  flow screens (desktop & mobile) resolve the warning asynchronously.

- [#19058](https://github.com/LedgerHQ/ledger-live/pull/19058) [`5fc438e`](https://github.com/LedgerHQ/ledger-live/commit/5fc438ec9357c406717f4e4e8c136533198a38b7) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract useAleoViewKeyApproval hook and buildAccountsWithViewKeys utility to live-common for shared Desktop and Mobile use

- [#19234](https://github.com/LedgerHQ/ledger-live/pull/19234) [`62bf9dd`](https://github.com/LedgerHQ/ledger-live/commit/62bf9dd5d57f9f57dd80703f0e570486b7450e90) Thanks [@ishaba](https://github.com/ishaba)! - fix: keep the caret in place when editing the EVM advanced-mode fee inputs (Max Priority Fee / Max Fee). InputCurrency now maps the caret through sanitizeValueString so editing a value already at the unit's max decimals (e.g. 9 Gwei decimals) no longer teleports the cursor to the end.

- [#17924](https://github.com/LedgerHQ/ledger-live/pull/17924) [`360cea4`](https://github.com/LedgerHQ/ledger-live/commit/360cea435daf7093d853f4ad6402327c6a285895) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Upgrade React Native to 0.81.6, Expo SDK 54 for LWM; React 19.1.4 for LWM and LWD

- [#19176](https://github.com/LedgerHQ/ledger-live/pull/19176) [`16f7a29`](https://github.com/LedgerHQ/ledger-live/commit/16f7a29af078e32cab47a8440952cf42c1a3d92c) Thanks [@ysitbon](https://github.com/ysitbon)! - Register a single crypto-assets token cache per app store, backed by the new domain token api and its persistence, and inject the legacy getCryptoAssetsStore singleton over it. This guarantees one runtime source of token data: the UI and coin-modules share the same cache.

- [#19034](https://github.com/LedgerHQ/ledger-live/pull/19034) [`696a1ee`](https://github.com/LedgerHQ/ledger-live/commit/696a1ee0333d7c2e6d11285aa18f8dd54cd4f57a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - chore(e2e): use ETH instead of SOL/XRP/XLM/SUI for smoke tests where possible (BTC kept)

- [#18829](https://github.com/LedgerHQ/ledger-live/pull/18829) [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.

- [#18971](https://github.com/LedgerHQ/ledger-live/pull/18971) [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).

- [#19112](https://github.com/LedgerHQ/ledger-live/pull/19112) [`8169225`](https://github.com/LedgerHQ/ledger-live/commit/81692256d96fd47acf288c0f646b15c92fe8d7be) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refacto gas and memo in the new send flow

- [#18993](https://github.com/LedgerHQ/ledger-live/pull/18993) [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd sync onboarding feature flag clean up

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19318](https://github.com/LedgerHQ/ledger-live/pull/19318) [`432075b`](https://github.com/LedgerHQ/ledger-live/commit/432075b9b72e3328354a1d28bfccc14181e42133) Thanks [@Justkant](https://github.com/Justkant)! - Fix orphaned Live App `<webview>` DevTools window on Electron 42: leaving a Live App now reliably closes its DevTools window again. The previous cleanup relied on the webview's `devtools-opened` / `devToolsWebContents` capture, which became unreliable on Electron 42 and left the DevTools window open; it is now discovered app-wide via its `devtools://` URL.

- [#19059](https://github.com/LedgerHQ/ledger-live/pull/19059) [`b79b845`](https://github.com/LedgerHQ/ledger-live/commit/b79b84574f73ebe14320f4903ad18937e1d91ce3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(lld): upgrade Electron from 40.6.0 to 42.5.0

- [#19224](https://github.com/LedgerHQ/ledger-live/pull/19224) [`29ac004`](https://github.com/LedgerHQ/ledger-live/commit/29ac004173ed650b9350fdaea905f7b79e27e09a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Analytics chart utils into @ledgerhq/wallet-analytics

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#18852](https://github.com/LedgerHQ/ledger-live/pull/18852) [`e5d7497`](https://github.com/LedgerHQ/ledger-live/commit/e5d74970f625beaa68787f297b91f24c07a7709e) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add Welcome analytics opt-in screen v2 UI with consent illustration

- [#19068](https://github.com/LedgerHQ/ledger-live/pull/19068) [`0e302a5`](https://github.com/LedgerHQ/ledger-live/commit/0e302a5a2e71a63af7e79d9a195e5e2cca36642c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): share useNetworkFee hooks through lwd and lwm in common

- [#18874](https://github.com/LedgerHQ/ledger-live/pull/18874) [`e0b2f53`](https://github.com/LedgerHQ/ledger-live/commit/e0b2f53c10d88554f6e9082f728fb3cfff7e805c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Block XRP send and show an error when the recipient requires a destination tag and none is provided (bumps @ledgerhq/coin-xrp to 7.23.5)

- [#19131](https://github.com/LedgerHQ/ledger-live/pull/19131) [`aea723c`](https://github.com/LedgerHQ/ledger-live/commit/aea723cac83a43596f1940ed4fc6ecbad49074e0) Thanks [@semeano](https://github.com/semeano)! - zcash: add ZIP-316 Unified Address classifier and shielded recipient validation

### Patch Changes

- Updated dependencies [[`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5), [`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd), [`80d44ad`](https://github.com/LedgerHQ/ledger-live/commit/80d44ade41f3bcb02a2b657c0fe3ca5e3bbdd0b3), [`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613), [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104), [`4b615c2`](https://github.com/LedgerHQ/ledger-live/commit/4b615c242a3b4d8ecb2ebf4e039a46e2bbfe5e19), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`e18fe2d`](https://github.com/LedgerHQ/ledger-live/commit/e18fe2d81d86650e816b8b5da9ea311048a3e30e), [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f), [`fe580b7`](https://github.com/LedgerHQ/ledger-live/commit/fe580b7a6205b5fe6e73ee7d67a93e8815b24295), [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79), [`6d9da62`](https://github.com/LedgerHQ/ledger-live/commit/6d9da62546cd54bf562f09542141635aab6c95dd), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`bb4e6db`](https://github.com/LedgerHQ/ledger-live/commit/bb4e6dbda83a6738d6ac375615f690e579ce4527), [`0675175`](https://github.com/LedgerHQ/ledger-live/commit/067517562894996679f7b05316deba64ae7486f8), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3), [`c5763f6`](https://github.com/LedgerHQ/ledger-live/commit/c5763f6171f49d2b9e679b982804e68843800450), [`7a3c4a5`](https://github.com/LedgerHQ/ledger-live/commit/7a3c4a5a2dd0c1ca7382d4bc9c27d2e3bfc671a9), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`7c27a44`](https://github.com/LedgerHQ/ledger-live/commit/7c27a446680a2e014e3154bbdd5e69673dd3e07c), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8), [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`63dcc63`](https://github.com/LedgerHQ/ledger-live/commit/63dcc636c4a1c360beb7ece0a3ee32ba7550b693), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`edebe91`](https://github.com/LedgerHQ/ledger-live/commit/edebe91895773e4e2c9f29bc0a991885d2f44a77), [`acaf6d9`](https://github.com/LedgerHQ/ledger-live/commit/acaf6d991aec6bfcc7b6a0906d873f7d8e57eded), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a), [`4f541c2`](https://github.com/LedgerHQ/ledger-live/commit/4f541c2f45d508dd12b4d4ff92dec294e6005865), [`50ab44f`](https://github.com/LedgerHQ/ledger-live/commit/50ab44f07f628fd819dff28d8cdd14b1ca5e4962), [`2caa65c`](https://github.com/LedgerHQ/ledger-live/commit/2caa65c2ada66ef20c76950b5a2b01c49845f8eb), [`8d7f2b3`](https://github.com/LedgerHQ/ledger-live/commit/8d7f2b3d517780578799cc83152f6434381b2e26), [`8dd5685`](https://github.com/LedgerHQ/ledger-live/commit/8dd5685a0a42b8277846754f0251eaf38a12fa51), [`bfb5437`](https://github.com/LedgerHQ/ledger-live/commit/bfb543708a32256379067903c3f1c3ab46a323d3), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`eab9b13`](https://github.com/LedgerHQ/ledger-live/commit/eab9b130e0a809d6dead08bbd1a588112da94e0c), [`b5699a5`](https://github.com/LedgerHQ/ledger-live/commit/b5699a54d7edd5b3579a7f35d77a03d2b0506d19), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`c1e9aa3`](https://github.com/LedgerHQ/ledger-live/commit/c1e9aa3a8851a85cf0ec9b0718177baf39cc9db8), [`5c2bc46`](https://github.com/LedgerHQ/ledger-live/commit/5c2bc46ce7e0dac5a9bfbf4089ca14868126bc96), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`b1d2ae6`](https://github.com/LedgerHQ/ledger-live/commit/b1d2ae681e8dade5fc193911f1de0a898f65af1c), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`e97314e`](https://github.com/LedgerHQ/ledger-live/commit/e97314e0d8201195a91e5eeb0fcde9e2b1dfff76), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d), [`199eb86`](https://github.com/LedgerHQ/ledger-live/commit/199eb869e51005a71f041bd851917c9645405695), [`8ecbdde`](https://github.com/LedgerHQ/ledger-live/commit/8ecbdde35c80f7c363f1511fa8463155437b9612), [`3f71b7a`](https://github.com/LedgerHQ/ledger-live/commit/3f71b7af8419e92e907be029b7fed052288561b7), [`e9b1707`](https://github.com/LedgerHQ/ledger-live/commit/e9b17073cdf3266692adc4348c9a54f5597da4c8), [`5f735a2`](https://github.com/LedgerHQ/ledger-live/commit/5f735a2c3c8f961c508c41908c4ce78974a709ef), [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016), [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`5a64d39`](https://github.com/LedgerHQ/ledger-live/commit/5a64d39ac89a125331c6d937642bf50d44255082), [`c6cf445`](https://github.com/LedgerHQ/ledger-live/commit/c6cf445c9bac5a56bcbf84ccda6b2b269d1ee61a), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`c4ee26d`](https://github.com/LedgerHQ/ledger-live/commit/c4ee26d18dacfcee597357de4b9dbab9fda01dbb), [`1f25437`](https://github.com/LedgerHQ/ledger-live/commit/1f254373fedec85e50364fdbc6bb9ec4fd5256b2), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`0fa8c6c`](https://github.com/LedgerHQ/ledger-live/commit/0fa8c6c7daf524f075623287418bc8ad74e464f3), [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31), [`5fc438e`](https://github.com/LedgerHQ/ledger-live/commit/5fc438ec9357c406717f4e4e8c136533198a38b7), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`4b2f537`](https://github.com/LedgerHQ/ledger-live/commit/4b2f537cf6ffd1ed20d2df63f6940dc13f68fbee), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`154ff71`](https://github.com/LedgerHQ/ledger-live/commit/154ff7146a642d7953a91394022eeda5d437c450), [`8169225`](https://github.com/LedgerHQ/ledger-live/commit/81692256d96fd47acf288c0f646b15c92fe8d7be), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`df088d2`](https://github.com/LedgerHQ/ledger-live/commit/df088d26908b24e936bc8d6f508a438d151222f0), [`2160260`](https://github.com/LedgerHQ/ledger-live/commit/2160260cc0d660331c05f1bfdb0a4f28d486e275), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`607b032`](https://github.com/LedgerHQ/ledger-live/commit/607b03228d5e648a0611c316c6ab71a60365f349), [`29ac004`](https://github.com/LedgerHQ/ledger-live/commit/29ac004173ed650b9350fdaea905f7b79e27e09a), [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`596a445`](https://github.com/LedgerHQ/ledger-live/commit/596a4452f04afbffdf0935e946e691f7775cb80c), [`0e302a5`](https://github.com/LedgerHQ/ledger-live/commit/0e302a5a2e71a63af7e79d9a195e5e2cca36642c), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839), [`e0b2f53`](https://github.com/LedgerHQ/ledger-live/commit/e0b2f53c10d88554f6e9082f728fb3cfff7e805c), [`e9a51af`](https://github.com/LedgerHQ/ledger-live/commit/e9a51afa1d2a79d856e1487ab3bd77670ccc5e86), [`aea723c`](https://github.com/LedgerHQ/ledger-live/commit/aea723cac83a43596f1940ed4fc6ecbad49074e0), [`1c1e25d`](https://github.com/LedgerHQ/ledger-live/commit/1c1e25d866e8ad9bf8d29c4bd102ebd5fd02c2b3)]:
  - @domain/api-currency-fiat@0.2.0
  - @domain/entity-currency-fiat@0.2.0
  - @domain/api-currency-token@0.2.0
  - @ledgerhq/live-common@36.4.0
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/coin-evm@4.5.0
  - @ledgerhq/types-live@6.114.0
  - @shared/feature-flags@0.13.0
  - @ledgerhq/coin-bitcoin@0.46.0
  - @ledgerhq/asset-aggregation@0.10.0
  - @ledgerhq/asset-detail@0.8.0
  - @ledgerhq/live-dmk-desktop@0.20.0
  - @ledgerhq/coin-cardano@0.29.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/coin-cosmos@0.38.0
  - @ledgerhq/live-dmk-shared@0.28.0
  - @domain/entity-currency-crypto@0.5.0
  - @features/platform-feature-flags@0.6.0
  - @ledgerhq/coin-concordium@0.15.0
  - @ledgerhq/coin-filecoin@1.27.0
  - @ledgerhq/coin-canton@0.28.0
  - @ledgerhq/coin-casper@2.15.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @features/platform-currencies@0.2.0
  - @ledgerhq/live-currency-format@0.12.0
  - @ledgerhq/types-cryptoassets@7.39.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.0
  - @ledgerhq/ledger-key-ring-protocol@0.16.0
  - @ledgerhq/live-countervalues@0.22.0
  - @ledgerhq/react-ui@0.53.0
  - @ledgerhq/devices@8.17.0
  - @ledgerhq/wallet-analytics@0.2.0
  - @ledgerhq/live-wallet@0.28.0
  - @ledgerhq/wallet-pnl@0.7.1
  - @ledgerhq/domain-service@1.8.9
  - @ledgerhq/live-countervalues-react@0.16.1
  - @ledgerhq/client-ids@0.11.1
  - @ledgerhq/live-dmk-speculos@0.10.1
  - @ledgerhq/live-network@2.6.7
  - @ledgerhq/hw-transport@6.35.6
  - @ledgerhq/device-intent@4.0.1
  - @ledgerhq/hw-transport-http@6.36.6
  - @ledgerhq/hw-transport-vault@1.7.6

## 4.11.0-next.0

### Minor Changes

- [#19627](https://github.com/LedgerHQ/ledger-live/pull/19627) [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merge release branch into hotfix support branch, resolving version and changelog conflicts

### Patch Changes

- Updated dependencies [[`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79)]:
  - @ledgerhq/asset-aggregation@0.10.0-next.0
  - @ledgerhq/asset-detail@0.8.0-next.0
  - @ledgerhq/live-common@36.4.0-next.0
  - @ledgerhq/live-dmk-desktop@0.20.0-next.0

## 4.11.0-next.3

### Patch Changes

- Updated dependencies [[`50ab44f`](https://github.com/LedgerHQ/ledger-live/commit/50ab44f07f628fd819dff28d8cdd14b1ca5e4962)]:
  - @ledgerhq/live-common@36.4.0-next.1
  - @ledgerhq/asset-detail@0.8.0-next.1
  - @ledgerhq/live-dmk-desktop@0.20.0-next.1

## 4.11.0-next.2

### Minor Changes

- [#19480](https://github.com/LedgerHQ/ledger-live/pull/19480) [`131e127`](https://github.com/LedgerHQ/ledger-live/commit/131e127e298147e7e7ea044e54ecb5ab853b0b17) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): open MAD on send from aggregated assets page

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
