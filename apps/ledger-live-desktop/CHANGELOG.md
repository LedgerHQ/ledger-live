# ledger-live-desktop

## 4.29.0-next.0

### Minor Changes

- [#24839](https://github.com/LedgerHQ/ledger-live/pull/24839) [`2ffe35c`](https://github.com/LedgerHQ/ledger-live/commit/2ffe35c80ed010df56d644ee2178a8994ee98be3) Thanks [@deepyjr](https://github.com/deepyjr)! - Leave room around the chart max and min labels so the scrubber overlay covers them whole

- [#24709](https://github.com/LedgerHQ/ledger-live/pull/24709) [`79fbc3e`](https://github.com/LedgerHQ/ledger-live/commit/79fbc3e91945f78c42bc69c79ca4daf8df331a99) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Read desktop and mobile dust filtering flags through the platform feature-flags hook and selector

- [#24542](https://github.com/LedgerHQ/ledger-live/pull/24542) [`332d615`](https://github.com/LedgerHQ/ledger-live/commit/332d6152b6c11aa923d5fc7f5e16606b5d61a252) Thanks [@may01](https://github.com/may01)! - Do not require the account's app on the device when a live app signs a PSBT with an allowed derived app

- [#24727](https://github.com/LedgerHQ/ledger-live/pull/24727) [`7baf9a8`](https://github.com/LedgerHQ/ledger-live/commit/7baf9a82cbfc441aeb751d53bb91ad6d27a983a1) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Agent Intent entry points on desktop: an Agents sidebar item and a Manage your agents card in My Wallet

- [#24604](https://github.com/LedgerHQ/ledger-live/pull/24604) [`6ae0717`](https://github.com/LedgerHQ/ledger-live/commit/6ae07170880c92bf6944ff42449eeb25991d1edf) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add a Receive DevTools tool to toggle the newReceiveFlow feature flag and its excluded families

- [#24840](https://github.com/LedgerHQ/ledger-live/pull/24840) [`eabafba`](https://github.com/LedgerHQ/ledger-live/commit/eabafbae5a75c22547965eb80f507ab35cd95452) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(hedera): wait for account switch before updating association tx (LIVE-41397)

- [#24646](https://github.com/LedgerHQ/ledger-live/pull/24646) [`ee50575`](https://github.com/LedgerHQ/ledger-live/commit/ee505757f39b870767bb5ee776dd8bd0f19c768f) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Analytics balance and chart when the countervalue is a crypto

- [#24674](https://github.com/LedgerHQ/ledger-live/pull/24674) [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `receive` account data kind: on which address an account receives and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`

- [#24685](https://github.com/LedgerHQ/ledger-live/pull/24685) [`ca6fee0`](https://github.com/LedgerHQ/ledger-live/commit/ca6fee093b8a18b5e4db4a21a4436cc20b96a9fc) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Serve EVM balances from the Portfolio source while its devtool injects it

- [#24697](https://github.com/LedgerHQ/ledger-live/pull/24697) [`b2224b4`](https://github.com/LedgerHQ/ledger-live/commit/b2224b4d0e202ceb21cf7693305baa1cfa5a107b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value Portfolio source operations in the asked countervalue and filter them by token on the service

- [#24657](https://github.com/LedgerHQ/ledger-live/pull/24657) [`effe64c`](https://github.com/LedgerHQ/ledger-live/commit/effe64cde76c319833d7c7596a28727191943812) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the Portfolio source devtool, which lists and reconciles the install's Portfolio service registrations

- [#24695](https://github.com/LedgerHQ/ledger-live/pull/24695) [`93e80dd`](https://github.com/LedgerHQ/ledger-live/commit/93e80dd0c3144ed090001985f6fd25d84172a2a8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Serve EVM balance histories from the Portfolio source while its devtool injects it

- [#24694](https://github.com/LedgerHQ/ledger-live/pull/24694) [`ed79130`](https://github.com/LedgerHQ/ledger-live/commit/ed79130d80ba9b18a26a8380c14bedbdb5435c63) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Serve EVM operations from the Portfolio source while its devtool injects it

- [#24696](https://github.com/LedgerHQ/ledger-live/pull/24696) [`297954a`](https://github.com/LedgerHQ/ledger-live/commit/297954a3e3fec11b44e087f7e0bbc93a7b09baa6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Serve Bitcoin and Cardano (by xpub), Tron, Tezos, Sui, Stellar and Canton accounts from the Portfolio source

- [#24614](https://github.com/LedgerHQ/ledger-live/pull/24614) [`de28165`](https://github.com/LedgerHQ/ledger-live/commit/de28165849281e54355fcb1894bf904c2125b2eb) Thanks [@semeano](https://github.com/semeano)! - Add the Alpen mainnet EVM config and move Alpen Testnet to the Ledger node and explorer, through @ledgerhq/coin-evm 16.4.2

- [#24589](https://github.com/LedgerHQ/ledger-live/pull/24589) [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scale BigNumber amounts down by a power of ten with `shiftedBy` instead of `div`, so the result no longer depends on the global `DECIMAL_PLACES`

- [#24798](https://github.com/LedgerHQ/ledger-live/pull/24798) [`e8305c7`](https://github.com/LedgerHQ/ledger-live/commit/e8305c7492cc970261e24069e52f040aec65f03c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the receive verify hint state from `@features/flow-pay-request/state` to `@features/flow-receive/state`

- [#24859](https://github.com/LedgerHQ/ledger-live/pull/24859) [`e2afea1`](https://github.com/LedgerHQ/ledger-live/commit/e2afea14298ebf9fa64c61b9cc4d5eca740decc1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the receive family contract: notices, support and unsupported device models of the new receive address screen per coin family

- [#24653](https://github.com/LedgerHQ/ledger-live/pull/24653) [`f48cb96`](https://github.com/LedgerHQ/ledger-live/commit/f48cb968a530d257a018807417ddcf4652871399) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Add a Return to Perps button to the swap status dialog opened from Perps, which closes the dialog. Keep the default dialog background on the Perps "Transaction signed" dialog in dark mode.

- [#24766](https://github.com/LedgerHQ/ledger-live/pull/24766) [`12939e3`](https://github.com/LedgerHQ/ledger-live/commit/12939e3bdd940eed4c5f0d1a684fefa689a2b9c9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Emit an `addressDisplayed` verify-address intent state once the address request is sent to the device

- [#24691](https://github.com/LedgerHQ/ledger-live/pull/24691) [`81d566b`](https://github.com/LedgerHQ/ledger-live/commit/81d566bd4b2fc0b72f4317aee917975601cd97b2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account-receive DevTools tool, reading the `receive` kind per account, and the `receive` kind to the mock source

- [#24582](https://github.com/LedgerHQ/ledger-live/pull/24582) [`4df88de`](https://github.com/LedgerHQ/ledger-live/commit/4df88de76e0d58b391bb376783edc552b44dcf24) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Count internal native receives in asset cost basis

- [#24592](https://github.com/LedgerHQ/ledger-live/pull/24592) [`b04379b`](https://github.com/LedgerHQ/ledger-live/commit/b04379bbbb8fcbebcfd7fe49e2ad8226ffa6d806) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the Ledger Sync intents DevTool, which runs the add member and remove member intents on the Device Intent Executor of each app and logs every job state, with the app renderers, executor wrappers and session SDK it needs

- [#24665](https://github.com/LedgerHQ/ledger-live/pull/24665) [`99d2480`](https://github.com/LedgerHQ/ledger-live/commit/99d2480ce988754fb2595a0fa0d7612ddfe77193) Thanks [@ysitbon](https://github.com/ysitbon)! - Build every Ledger Sync session SDK with the setup of the app's cached SDK, the one the wallet sync loop uses, through a shared `sessionWithDevice` adapter, so a member added on the device is known to the sync loop even when the flag environment arrives after the app started; the intents DevTool lists members with the app SDK again

- [#24688](https://github.com/LedgerHQ/ledger-live/pull/24688) [`f028bf9`](https://github.com/LedgerHQ/ledger-live/commit/f028bf9f30374dfa9587e50f4f92532e23d3206b) Thanks [@ysitbon](https://github.com/ysitbon)! - Run the Ledger Sync device steps on the Device Intent Executor behind the lwdLedgerSyncDie flag

- [#24593](https://github.com/LedgerHQ/ledger-live/pull/24593) [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a) Thanks [@deepyjr](https://github.com/deepyjr)! - Gate the Account Detail Analytics banner with the `accountDetail` `analyticsBanner` param, send it to analytics and keep the banner until it is closed

- [#24590](https://github.com/LedgerHQ/ledger-live/pull/24590) [`6eed15b`](https://github.com/LedgerHQ/ledger-live/commit/6eed15b61aeac69daefcd39bcc904b10eb6162fd) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show the add account drawer above the Perps deposit and withdraw dialogs. The dialog hides while the drawer is open and comes back with the amount and the newly added account.

- [#24372](https://github.com/LedgerHQ/ledger-live/pull/24372) [`39b8762`](https://github.com/LedgerHQ/ledger-live/commit/39b87620fce0f123406907372d8250713b0e9416) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show the Perps deposit errors

- [#24707](https://github.com/LedgerHQ/ledger-live/pull/24707) [`7133d63`](https://github.com/LedgerHQ/ledger-live/commit/7133d632892e8781260212f90e0a2cb4ed5bc885) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Track the Perps withdraw signing failure, the submit, its failure and its settlement on desktop and mobile

- [#24825](https://github.com/LedgerHQ/ledger-live/pull/24825) [`db7418a`](https://github.com/LedgerHQ/ledger-live/commit/db7418ab935c334687af009587df815434f2269a) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(die): make the device deprecation screen text readable in the desktop Device Intent Executor dialog and say Ledger Wallet instead of Ledger Live

- [#24689](https://github.com/LedgerHQ/ledger-live/pull/24689) [`393695d`](https://github.com/LedgerHQ/ledger-live/commit/393695db90c73639ddf7e8d38dc2cf88dad19064) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Hide blocked and unregistered Polkadot validators from the nomination list and reject them before signing

- [#24473](https://github.com/LedgerHQ/ledger-live/pull/24473) [`c5d0d84`](https://github.com/LedgerHQ/ledger-live/commit/c5d0d8489518b9c5635ed8aa415eb7187f4124d9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions DevTool on desktop and mobile to inspect and reset what the Predictions onboarding stored, and preview the trading wallet setup. `@domain/entity-predictions` gets `resetPredictionsIntroSeen`

- [#24125](https://github.com/LedgerHQ/ledger-live/pull/24125) [`b33851b`](https://github.com/LedgerHQ/ledger-live/commit/b33851b2b5015eb37cced36d7ba6119534c64ff3) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Record "Analytics opt-in prompt main" when the desktop consent prompt is shown

- [#24769](https://github.com/LedgerHQ/ledger-live/pull/24769) [`94bb3b3`](https://github.com/LedgerHQ/ledger-live/commit/94bb3b36d114163b9907dc574344e8bb66945eb5) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a search field to the analytics asset filter on mobile and desktop, and fix the spacing between the filters and the chart on mobile

- [#24519](https://github.com/LedgerHQ/ledger-live/pull/24519) [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - List perps withdrawals in the swap history, anchored to their payout transaction, and show their payout and Hyperliquid fees on the swap status screen. Keep unknown fields in the perps withdraw payload so the SwapKit submit gets it back unmodified

- [#24772](https://github.com/LedgerHQ/ledger-live/pull/24772) [`9012872`](https://github.com/LedgerHQ/ledger-live/commit/9012872e214386a6b9af13fa3d67b2b153027697) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Allow restricting the modular asset and account dialog to given networks with `networkIds`

- [#24636](https://github.com/LedgerHQ/ledger-live/pull/24636) [`1f907a7`](https://github.com/LedgerHQ/ledger-live/commit/1f907a7d358d3778339fedf84e2ba679d214f9c9) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the selected account icon on the analytics account filter

- [#24747](https://github.com/LedgerHQ/ledger-live/pull/24747) [`8b743fb`](https://github.com/LedgerHQ/ledger-live/commit/8b743fb4d98b915eac60d3b7a991dbe6a03f2b03) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each balance history point in the fiat a query asks for, at its date, with the `countervalue` query

- [#24361](https://github.com/LedgerHQ/ledger-live/pull/24361) [`76ca8e7`](https://github.com/LedgerHQ/ledger-live/commit/76ca8e7dae5dd46abef453ffa61ff38d19b47344) Thanks [@LL782](https://github.com/LL782)! - Block wallet and accounts writes to app.json while the app is locked

- [#24643](https://github.com/LedgerHQ/ledger-live/pull/24643) [`10216dd`](https://github.com/LedgerHQ/ledger-live/commit/10216dd420daf71018cbcdcf2e172f9355a62830) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update rstack

  - Updated `@rsbuild/core` to `2.3.1`
  - Updated `@rsdoctor/core` to `2.0.2`
  - Updated `@rslib/core` to `1.0.6`
  - Updated `@rspack/cli` to `2.3.1`
  - Updated `@rspack/core` to `2.3.1`

- [#24648](https://github.com/LedgerHQ/ledger-live/pull/24648) [`431165e`](https://github.com/LedgerHQ/ledger-live/commit/431165efb50051c4359808f8ee1ceb1ef7566bbd) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update typescript-eslint monorepo to v8.72.1

  - Updated `@typescript-eslint/parser` to `8.72.1`

- [#24675](https://github.com/LedgerHQ/ledger-live/pull/24675) [`b08cbc3`](https://github.com/LedgerHQ/ledger-live/commit/b08cbc304d2ddf218c1fa1ccd00dd1a73953b7b2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the partner live app for stake from account and asset detail instead of always opening Earn

- [#24708](https://github.com/LedgerHQ/ledger-live/pull/24708) [`71556e9`](https://github.com/LedgerHQ/ledger-live/commit/71556e9f0babd4c63e8ad58cced7a77bf0351fef) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Use Lumen for the crypto address name suggestions and portfolio banner icons

- [#24651](https://github.com/LedgerHQ/ledger-live/pull/24651) [`a5a5309`](https://github.com/LedgerHQ/ledger-live/commit/a5a5309e913428497dfff7e1e13ad3d18e995cf3) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep the contact address ENS notice visible while an edited ENS name is revalidated, so the modal no longer blinks on each keystroke.

- [#24633](https://github.com/LedgerHQ/ledger-live/pull/24633) [`8492733`](https://github.com/LedgerHQ/ledger-live/commit/8492733e73d90f1eca5f9ca9ec1cfffaaf84a8f4) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix dropdown scrollbar not responding to mouse clicks and drags

- [#24597](https://github.com/LedgerHQ/ledger-live/pull/24597) [`205aa4b`](https://github.com/LedgerHQ/ledger-live/commit/205aa4b7d5ef984fb020e08a05ca47ad08dff95c) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Account Detail Analytics banner only to installations that had completed onboarding with a device before the rollout, through a one-time persisted eligibility snapshot

- [#24560](https://github.com/LedgerHQ/ledger-live/pull/24560) [`36434e9`](https://github.com/LedgerHQ/ledger-live/commit/36434e9206d26b18895fd2b4f777d60aaf581b08) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Reuse a recent BTC sync for quotes and show the fee estimation failure on the Perps deposit form

- [#24652](https://github.com/LedgerHQ/ledger-live/pull/24652) [`e0e1e67`](https://github.com/LedgerHQ/ledger-live/commit/e0e1e6706c6cee74a920b296587dfb32c2569ccc) Thanks [@deepyjr](https://github.com/deepyjr)! - Truncate long contact address action labels on one line with an ellipsis and show the full label on hover, so translations such as Russian no longer overflow the buttons.

- [#24756](https://github.com/LedgerHQ/ledger-live/pull/24756) [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): apply the die for the new send flow in lwd

- [#24637](https://github.com/LedgerHQ/ledger-live/pull/24637) [`27a2b6b`](https://github.com/LedgerHQ/ledger-live/commit/27a2b6be0baff6924ab10011f3f42dbc84661987) Thanks [@deepyjr](https://github.com/deepyjr)! - Give the account name more room in the account list and show the cut address type in a tooltip

- [#24678](https://github.com/LedgerHQ/ledger-live/pull/24678) [`a9ac0c9`](https://github.com/LedgerHQ/ledger-live/commit/a9ac0c99eef6b267bdee5f52708ef3d34cab7b8c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Prefill the XRP trust limit Max with the protocol maximum from coin-xrp 13.7.0, no longer fetched, and read the optional `limit` of a held IOU

- [#24837](https://github.com/LedgerHQ/ledger-live/pull/24837) [`e3f44dc`](https://github.com/LedgerHQ/ledger-live/commit/e3f44dc9b07da59bacf25f69fda0c0d3e7e37f37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Share the XRP token holding condition of the add-token modal in live-common

- [#24735](https://github.com/LedgerHQ/ledger-live/pull/24735) [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Add the `OPT_EDIT` operation type and `BridgeApi.tokenOptParentRow`. XRP tokens: opt-in and opt-out history rows keep their type, a pending edit is an `OPT_EDIT`, IOU device review fields, IOU amounts from fiat or the 25/50/75 % buttons rounded to 16 significant digits, error texts, send errors on the LWD amount step, and LWD Token settings messages for a limit of 0 and a limit below the balance

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`4d9a494`](https://github.com/LedgerHQ/ledger-live/commit/4d9a4949a9c03da89241f0163325940217762f7e), [`79fbc3e`](https://github.com/LedgerHQ/ledger-live/commit/79fbc3e91945f78c42bc69c79ca4daf8df331a99), [`332d615`](https://github.com/LedgerHQ/ledger-live/commit/332d6152b6c11aa923d5fc7f5e16606b5d61a252), [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5), [`0e964a8`](https://github.com/LedgerHQ/ledger-live/commit/0e964a897b6d740d172a55060b8aba960800b2cc), [`dc295d0`](https://github.com/LedgerHQ/ledger-live/commit/dc295d0bf733a21897b23c810b9b9c1f44343f4d), [`6ae0717`](https://github.com/LedgerHQ/ledger-live/commit/6ae07170880c92bf6944ff42449eeb25991d1edf), [`eabafba`](https://github.com/LedgerHQ/ledger-live/commit/eabafbae5a75c22547965eb80f507ab35cd95452), [`180de5b`](https://github.com/LedgerHQ/ledger-live/commit/180de5baca4b9e6abf44dce3991ea511ea84836a), [`ea45007`](https://github.com/LedgerHQ/ledger-live/commit/ea45007b1a8f6f7afbb1f29df2bc93d77766d69a), [`5895784`](https://github.com/LedgerHQ/ledger-live/commit/5895784ef0da900092abf361b3647eba1eb1547f), [`ee50575`](https://github.com/LedgerHQ/ledger-live/commit/ee505757f39b870767bb5ee776dd8bd0f19c768f), [`9f10baf`](https://github.com/LedgerHQ/ledger-live/commit/9f10bafef466914b2536c7e509ff7c3c2c49b5c8), [`0fc43ab`](https://github.com/LedgerHQ/ledger-live/commit/0fc43ab03928e17d2da761f747ec0c449228d4aa), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`45f0819`](https://github.com/LedgerHQ/ledger-live/commit/45f081972c38225dfed314c9d8313cd510629a85), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`6baeada`](https://github.com/LedgerHQ/ledger-live/commit/6baeadaca277a70109580c0d939278ebf729922b), [`de62f18`](https://github.com/LedgerHQ/ledger-live/commit/de62f18c8fdfa5d07228396410040d9d5f92459d), [`de28165`](https://github.com/LedgerHQ/ledger-live/commit/de28165849281e54355fcb1894bf904c2125b2eb), [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7), [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48), [`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`17a6fe5`](https://github.com/LedgerHQ/ledger-live/commit/17a6fe50223648ab962217e1388633d1d67c63a7), [`e8305c7`](https://github.com/LedgerHQ/ledger-live/commit/e8305c7492cc970261e24069e52f040aec65f03c), [`e2afea1`](https://github.com/LedgerHQ/ledger-live/commit/e2afea14298ebf9fa64c61b9cc4d5eca740decc1), [`12939e3`](https://github.com/LedgerHQ/ledger-live/commit/12939e3bdd940eed4c5f0d1a684fefa689a2b9c9), [`2734bf4`](https://github.com/LedgerHQ/ledger-live/commit/2734bf48a141d35b8df665e6112bb01c2fc203ec), [`4ce1aca`](https://github.com/LedgerHQ/ledger-live/commit/4ce1acad62b9bb4b186a6fba14fce381b699d2c2), [`2ccdc0f`](https://github.com/LedgerHQ/ledger-live/commit/2ccdc0f0b1020daca45dfbd1444a79e2aae0bd36), [`c3dcfd8`](https://github.com/LedgerHQ/ledger-live/commit/c3dcfd821153bf18896eb4a63bb2ed40c55e310b), [`e0cae47`](https://github.com/LedgerHQ/ledger-live/commit/e0cae4765262eb5e58de7b20d348907a4f5a5ccc), [`81d566b`](https://github.com/LedgerHQ/ledger-live/commit/81d566bd4b2fc0b72f4317aee917975601cd97b2), [`3374abb`](https://github.com/LedgerHQ/ledger-live/commit/3374abbb9491f94fb98417b696b4e30c1bced021), [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b), [`13a6d68`](https://github.com/LedgerHQ/ledger-live/commit/13a6d687f486e1fcb3001a15f437a84b26ea5609), [`0413ec3`](https://github.com/LedgerHQ/ledger-live/commit/0413ec3d26b430e0e39a49c3f19cbead2317f855), [`4df88de`](https://github.com/LedgerHQ/ledger-live/commit/4df88de76e0d58b391bb376783edc552b44dcf24), [`bc460b0`](https://github.com/LedgerHQ/ledger-live/commit/bc460b08ac220010875e9d245577360918bf94ac), [`20484fe`](https://github.com/LedgerHQ/ledger-live/commit/20484fead9eccb0988ed9363466d2dbdd5b3efea), [`b04379b`](https://github.com/LedgerHQ/ledger-live/commit/b04379bbbb8fcbebcfd7fe49e2ad8226ffa6d806), [`99d2480`](https://github.com/LedgerHQ/ledger-live/commit/99d2480ce988754fb2595a0fa0d7612ddfe77193), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`f03b96e`](https://github.com/LedgerHQ/ledger-live/commit/f03b96ed3d72e7404eebe2b8b12e42833cf55a1b), [`44fc466`](https://github.com/LedgerHQ/ledger-live/commit/44fc466224cb5f03d68cda98d3cc23e652b38251), [`a40069c`](https://github.com/LedgerHQ/ledger-live/commit/a40069cca2db75a7cd2fcc11beed61977f53c655), [`e2bb865`](https://github.com/LedgerHQ/ledger-live/commit/e2bb865733ba1ac054b9c35d02cd94fe91ae212e), [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a), [`bd2a285`](https://github.com/LedgerHQ/ledger-live/commit/bd2a285f8548c8cda16cf8960c71fbb82513e18a), [`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31), [`ec49c1a`](https://github.com/LedgerHQ/ledger-live/commit/ec49c1aedabd57b76987f1bd265800fd916772bc), [`83d314d`](https://github.com/LedgerHQ/ledger-live/commit/83d314dcad271f5c7bdc2cf04eea1a37d94f3b5a), [`1ec8aa8`](https://github.com/LedgerHQ/ledger-live/commit/1ec8aa83633767ab20807fea41b76025fd000222), [`39b8762`](https://github.com/LedgerHQ/ledger-live/commit/39b87620fce0f123406907372d8250713b0e9416), [`7133d63`](https://github.com/LedgerHQ/ledger-live/commit/7133d632892e8781260212f90e0a2cb4ed5bc885), [`393695d`](https://github.com/LedgerHQ/ledger-live/commit/393695db90c73639ddf7e8d38dc2cf88dad19064), [`c5d0d84`](https://github.com/LedgerHQ/ledger-live/commit/c5d0d8489518b9c5635ed8aa415eb7187f4124d9), [`94bb3b3`](https://github.com/LedgerHQ/ledger-live/commit/94bb3b36d114163b9907dc574344e8bb66945eb5), [`c24caff`](https://github.com/LedgerHQ/ledger-live/commit/c24cafffbc8b6fd0f05c6ec13e70d70fd4557697), [`4a749db`](https://github.com/LedgerHQ/ledger-live/commit/4a749db93ffbb57b2296315869df761a6a2ed6ec), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`5c70ad0`](https://github.com/LedgerHQ/ledger-live/commit/5c70ad082840b169ae8a22d196fcc765b779575b), [`91056c1`](https://github.com/LedgerHQ/ledger-live/commit/91056c17c325bf042f6449c3ed74412adcb84899), [`1f907a7`](https://github.com/LedgerHQ/ledger-live/commit/1f907a7d358d3778339fedf84e2ba679d214f9c9), [`b0866af`](https://github.com/LedgerHQ/ledger-live/commit/b0866afc6240ac2097ff1a266d76d783d98a498a), [`8b743fb`](https://github.com/LedgerHQ/ledger-live/commit/8b743fb4d98b915eac60d3b7a991dbe6a03f2b03), [`4ef7618`](https://github.com/LedgerHQ/ledger-live/commit/4ef7618524bd8e8dcdb940c2cd852ff9e666bc6b), [`a5a5309`](https://github.com/LedgerHQ/ledger-live/commit/a5a5309e913428497dfff7e1e13ad3d18e995cf3), [`205aa4b`](https://github.com/LedgerHQ/ledger-live/commit/205aa4b7d5ef984fb020e08a05ca47ad08dff95c), [`36434e9`](https://github.com/LedgerHQ/ledger-live/commit/36434e9206d26b18895fd2b4f777d60aaf581b08), [`88c94ff`](https://github.com/LedgerHQ/ledger-live/commit/88c94ffe78402e1789ee70aa8cf1d0cbfeef1aef), [`e0e1e67`](https://github.com/LedgerHQ/ledger-live/commit/e0e1e6706c6cee74a920b296587dfb32c2569ccc), [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab), [`c72e5c3`](https://github.com/LedgerHQ/ledger-live/commit/c72e5c334206fcb1e83fea43c68cc5b359ba70f6), [`427d4d3`](https://github.com/LedgerHQ/ledger-live/commit/427d4d3c3d80263f5026cd0b8fbe83ce881a1953), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`a9ac0c9`](https://github.com/LedgerHQ/ledger-live/commit/a9ac0c99eef6b267bdee5f52708ef3d34cab7b8c), [`e3f44dc`](https://github.com/LedgerHQ/ledger-live/commit/e3f44dc9b07da59bacf25f69fda0c0d3e7e37f37), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @shared/feature-flags@0.31.0-next.0
  - @ledgerhq/types-live@6.132.0-next.0
  - @shared/trend@0.2.0-next.0
  - @features/platform-feature-flags@0.13.0-next.0
  - @ledgerhq/coin-bitcoin@1.3.0-next.0
  - @ledgerhq/live-common@38.8.0-next.0
  - @features/flow-agent-intent-entry-points@0.2.0-next.0
  - @features/platform-device-onboarding@0.6.0-next.0
  - @features/flow-account-analytics@0.3.0-next.0
  - @devtools/bindings@0.16.0-next.0
  - @devtools/shell@0.15.0-next.0
  - @domain/api-account-data@0.6.0-next.0
  - @features/platform-account-source-coin-module@0.3.0-next.0
  - @domain/entity-account@0.4.0-next.0
  - @ledgerhq/coin-stacks@0.37.0-next.0
  - @features/flow-account-detail@0.5.0-next.0
  - @domain/entity-account-receive@0.1.0-next.0
  - @domain/entity-account-data@0.6.0-next.0
  - @domain/entity-account-operation@0.3.0-next.0
  - @domain/entity-client-identity@0.6.0-next.0
  - @features/platform-currencies@0.14.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.12.0-next.0
  - @shared/ui-info-state@0.8.0-next.0
  - @features/flow-account-detail-analytics-notice@0.4.0-next.0
  - @features/flow-receive@0.2.0-next.0
  - @features/flow-pay-request@0.11.0-next.0
  - @features/platform-intent-verify-address@0.4.0-next.0
  - @features/platform-card@0.10.0-next.0
  - @shared/clipboard@0.2.0-next.0
  - @features/platform-device-action-content@0.5.0-next.0
  - @ledgerhq/live-dmk-shared@0.40.0-next.0
  - @features/flow-fear-and-greed@0.6.0-next.0
  - @ledgerhq/wallet-pnl@0.10.0-next.0
  - @features/flow-large-screen-upsell@2.5.0-next.0
  - @features/platform-intent-wallet-sync@0.3.0-next.0
  - @shared/env@0.14.0-next.0
  - @shared/lottie@0.2.0-next.0
  - @shared/network-status@0.1.0-next.0
  - @features/flow-pay-bank-transfer@0.5.0-next.0
  - @features/flow-pay-card-auth@0.13.0-next.0
  - @features/flow-pay-deposit@0.7.0-next.0
  - @features/flow-pay-feature-tour@0.10.0-next.0
  - @domain/entity-predictions@0.4.0-next.0
  - @features/flow-predictions@0.3.0-next.0
  - @ledgerhq/coin-canton@2.0.0-next.0
  - @features/platform-device-intent@5.5.0-next.0
  - @domain/entity-account-balance-history@0.3.0-next.0
  - @domain/api-market-countervalues@0.4.0-next.0
  - @features/platform-contacts@0.13.0-next.0
  - @features/flow-contacts-add-address@0.10.0-next.0
  - @features/flow-contacts-edit-address@0.8.0-next.0
  - @ledgerhq/live-dmk-speculos@0.13.0-next.0
  - @features/flow-contacts-detail@0.5.0-next.0
  - @features/flow-portfolio-services-entry-points@0.3.1-next.0
  - @features/platform-feature-flags-firebase@0.1.5-next.0
  - @ledgerhq/asset-aggregation@0.19.1-next.0
  - @ledgerhq/coin-cardano@3.0.1-next.0
  - @ledgerhq/coin-casper@3.8.1-next.0
  - @ledgerhq/coin-concordium@1.8.1-next.0
  - @ledgerhq/coin-filecoin@2.7.1-next.0
  - @ledgerhq/coin-zcash@1.2.1-next.0
  - @ledgerhq/live-send@0.2.1-next.0
  - @ledgerhq/live-signer-evm@0.24.6-next.0
  - @ledgerhq/live-wallet@1.2.1-next.0
  - @ledgerhq/transaction-observability@0.6.3-next.0
  - @ledgerhq/wallet-analytics@0.5.6-next.0
  - @features/platform-assets-table@0.3.1-next.0
  - @features/flow-analytics-consent@0.2.14-next.0
  - @ledgerhq/asset-detail@0.13.1-next.0
  - @ledgerhq/live-dmk-desktop@0.27.1-next.0
  - @domain/entity-account-balance@0.3.1-next.0
  - @domain/entity-account-alias@0.2.1-next.0
  - @domain/entity-account-name@0.4.1-next.0
  - @domain/entity-starred-account@0.1.1-next.0
  - @domain/api-push-devices@0.3.1-next.0
  - @features/flow-account-detail-settings@0.3.2-next.0
  - @features/flow-pay-card-transactions@0.7.3-next.0
  - @ledgerhq/live-signer-tron@0.2.6-next.0
  - @domain/api-aggregated-assets@0.7.1-next.0
  - @features/platform-aggregated-assets@0.7.1-next.0
  - @features/platform-env@0.4.6-next.0
  - @features/flow-pay-card@0.9.1-next.0
  - @features/flow-pay-card-assets@0.7.1-next.0
  - @features/flow-pay-card-details@0.11.1-next.0
  - @features/platform-predictions@0.4.1-next.0
  - @features/platform-market-countervalues@0.5.1-next.0
  - @features/flow-contacts@0.18.1-next.0
  - @features/flow-contacts-add-contact@0.10.2-next.0
  - @features/flow-contacts-delete-address@0.4.2-next.0
  - @features/flow-contacts-delete-contact@0.5.2-next.0
  - @features/flow-contacts-edit-contact@0.9.2-next.0
  - @features/flow-contacts-list@0.12.2-next.0
  - @features/flow-pay-contact@0.9.1-next.0
  - @features/flow-account-detail-balance-summary@0.1.0
  - @features/flow-account-detail-delegations@0.3.0
  - @features/flow-account-detail-hero@0.4.0
  - @features/flow-account-detail-notices@0.3.0
  - @features/flow-app-availability@0.3.2
  - @features/flow-contacts-introduction@1.6.0
  - @features/flow-pay-balance@0.10.0
  - @features/flow-pay-card-widget@0.7.0
  - @ledgerhq/wallet-btc@1.2.0
  - @features/platform-content-ab-tests@0.2.5-next.0

## 4.28.0

### Minor Changes

- [#24189](https://github.com/LedgerHQ/ledger-live/pull/24189) [`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Let users pick the network when they swap a multi-network asset from Market or Asset Detail, also when they have no account for it. Show only the networks of the asset itself, so USDC no longer opens an extra asset step. When the drawer keeps only one network, open the account step on that network.

- [#24195](https://github.com/LedgerHQ/ledger-live/pull/24195) [`1fa3701`](https://github.com/LedgerHQ/ledger-live/commit/1fa3701af2b570706605c2f59964e366b289cbf3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail sends the events of its tracking plan, with the same names and properties on both apps

- [#24262](https://github.com/LedgerHQ/ledger-live/pull/24262) [`4bd0f62`](https://github.com/LedgerHQ/ledger-live/commit/4bd0f62b9480e79e7628d0c918b7191f1087f0bd) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - chore(lumen): bump ui-rnative to 0.1.72 for rn 0.86 (LIVE-39312)

  Bump lumen-ui-rnative to 0.1.72, lumen-ui-react to 0.1.69 and lumen-utils-shared to 0.1.19. The new lumen-ui-rnative peer ranges accept react-native 0.86, react-native-worklets 0.10 and expo-haptics 57. Lumen native inputs now expose their label as the TextInput accessibility label and hide the visual label from accessibility, so mobile tests query these inputs with `getByLabelText`.

- [#24412](https://github.com/LedgerHQ/ledger-live/pull/24412) [`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sample `estimateFees` and `validateIntent` successes in `coin_module_call` with a new `preparationSampleRate` param of the `coinObservability` flag (default 0.1): the bridge calls them on every edit of a transaction, so sending each call made them most of the volume. Their failures are still always sent, and `craftTransaction`, `craftRawTransaction`, `craftTransactionData`, `combine` and `broadcast` stay unsampled. Each `coin_module_call` now carries its tier's `sampleRate` and an `inSample` flag, so dashboards can compute unbiased failure rates and estimate volumes from the sample.

- [#23955](https://github.com/LedgerHQ/ledger-live/pull/23955) [`03cafaf`](https://github.com/LedgerHQ/ledger-live/commit/03cafaff14567ab3a8ee8495f3da964a7d56683a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.9.0, which ships each native binary in its own optional package. The desktop app now packages only the binaries it runs on (darwin arm64/x64, win32 x64, linux x64) instead of all six.

- [#24339](https://github.com/LedgerHQ/ledger-live/pull/24339) [`eac050d`](https://github.com/LedgerHQ/ledger-live/commit/eac050d156808c13da83985ec3ebaed0567caa51) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Cardano delegation and balances with the shared Lumen components

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24235](https://github.com/LedgerHQ/ledger-live/pull/24235) [`0ebe8ea`](https://github.com/LedgerHQ/ledger-live/commit/0ebe8ea274936993a9dff1c36bf7b036d531e1f5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Hide the account detail empty state when a receive updates the balance before operations

- [#24348](https://github.com/LedgerHQ/ledger-live/pull/24348) [`cc73a3f`](https://github.com/LedgerHQ/ledger-live/commit/cc73a3f12a1cb7e367bcddaea42680d0c74a62ed) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Widen the account delegations validator column so the validator name is shown in full

- [#24354](https://github.com/LedgerHQ/ledger-live/pull/24354) [`2c728a2`](https://github.com/LedgerHQ/ledger-live/commit/2c728a22e6acce91ec50f07bb676114850389d4a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Shrink the account asset picker dialog to its content when few assets are listed

- [#24325](https://github.com/LedgerHQ/ledger-live/pull/24325) [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an account-detail DevTools tool to reset the Account Detail card that redirects to Analytics

- [#24556](https://github.com/LedgerHQ/ledger-live/pull/24556) [`e6c438d`](https://github.com/LedgerHQ/ledger-live/commit/e6c438d64ad0beb6224bd4c0361241641fe2a37d) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the native Account Analytics surface (filter chips opening a bottom sheet, status and Retry) and export AccountAnalytics from the package root for both apps.

- [#24554](https://github.com/LedgerHQ/ledger-live/pull/24554) [`e7a4d5a`](https://github.com/LedgerHQ/ledger-live/commit/e7a4d5a01ce2aa5636609f70cccc6274d5189b08) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics balance, renderer status and PnL scope rules between the apps through the Account Analytics package.

- [#24553](https://github.com/LedgerHQ/ledger-live/pull/24553) [`ba1b7c4`](https://github.com/LedgerHQ/ledger-live/commit/ba1b7c45b4818bed008fcbed07d97b9a3e9aa0b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics catalog rules (eligible positions, asset grouping, catalog state) between the apps through the Account Analytics package.

- [#24572](https://github.com/LedgerHQ/ledger-live/pull/24572) [`a85db5d`](https://github.com/LedgerHQ/ledger-live/commit/a85db5d1808cb7470e224dcc70f0510920664223) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Asset detail "See all" transactions no longer lists the operations of the tokens held by the same account

- [#24127](https://github.com/LedgerHQ/ledger-live/pull/24127) [`1c99745`](https://github.com/LedgerHQ/ledger-live/commit/1c9974592fc45d93014b5111973c12ff4fd2b663) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a test id to the network fees fiat value on the custom fees screen

- [#24443](https://github.com/LedgerHQ/ledger-live/pull/24443) [`c842892`](https://github.com/LedgerHQ/ledger-live/commit/c8428923a5cf0ed556ff7a48a6e373c740cdb6a1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Send `network` instead of `currency` and drop `isTokenAccount` on the account detail page events

- [#24468](https://github.com/LedgerHQ/ledger-live/pull/24468) [`f720cc5`](https://github.com/LedgerHQ/ledger-live/commit/f720cc5c89cca816c8e4954a911e0b894a38924b) Thanks [@deepyjr](https://github.com/deepyjr)! - Stop the Analytics chart from flickering when the asset, account or range changes: keep the previous curve on screen until the new one is ready instead of blanking it.

- [#24463](https://github.com/LedgerHQ/ledger-live/pull/24463) [`6ef8d46`](https://github.com/LedgerHQ/ledger-live/commit/6ef8d46d779e672c2e4ee6ca7925b43ad28c10c2) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Analytics balance and chart when a held asset has no price, leaving that asset out of the total as the Portfolio does. Analytics still reports unavailable data when no held asset of the selection has a price.

- [#24226](https://github.com/LedgerHQ/ledger-live/pull/24226) [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): do not spend the inputs of pending operations

  `prepareTransaction` and `estimateMaxSpendable` exclude the UTXOs spent by the account's own
  pending operations. When the explorer does not report mempool spends, a sync listed them as
  spendable again and the next send was rejected with `txn-mempool-conflict`. An RBF edit keeps
  the inputs of the operation it replaces.

  `addPendingOperation` keeps every pending UTXO operation (those with `extra.inputs`) instead of
  only the latest one, and removes one only when the new operation spends one of its inputs (an RBF
  replacement). Operations of other coins are unchanged.

  `isOldestBitcoinPendingOperation` takes the operation instead of its date: a pending operation
  can be sped up unless it spends an output of another unconfirmed operation of the account. Pending
  sends of unrelated UTXOs no longer block each other's speed-up.

- [#24520](https://github.com/LedgerHQ/ledger-live/pull/24520) [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand `AggregatedAssetId` and `MarketId`, and replace both copies of `dadaIdToMarketId` with the typed `toMarketId` and `parseMarketRef` bridge in `@domain/api-aggregated-assets`

- [#24541](https://github.com/LedgerHQ/ledger-live/pull/24541) [`120e07b`](https://github.com/LedgerHQ/ledger-live/commit/120e07b05d40d2099fe5eeee2f3042e29b1be389) Thanks [@LucHebrard](https://github.com/LucHebrard)! - Send in-progress Ledger Recover users from the Backup Hub to the Recover upsell page

- [#24318](https://github.com/LedgerHQ/ledger-live/pull/24318) [`fb3956b`](https://github.com/LedgerHQ/ledger-live/commit/fb3956b429b34b35b4b6e3e50b14f6d9bdf2d59b) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Sign the Perps SwapKit withdrawal on the Ethereum app and submit it on desktop and mobile

- [#24350](https://github.com/LedgerHQ/ledger-live/pull/24350) [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the supportDeviceApex feature flag: Apex is always listed in onboarding device selection and BLE pairing

- [#24255](https://github.com/LedgerHQ/ledger-live/pull/24255) [`81f924e`](https://github.com/LedgerHQ/ledger-live/commit/81f924e4acd4d79e898fa0cc8b1acf03a6c01de6) Thanks [@deepyjr](https://github.com/deepyjr)! - Integrate scoped Analytics filters, current balance and all-time PnL into desktop.

- [#24500](https://github.com/LedgerHQ/ledger-live/pull/24500) [`6da9b38`](https://github.com/LedgerHQ/ledger-live/commit/6da9b38e20ae18b9aa3e31d41a155420ace9987b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/auth` 0.2.0, `@ledgerhq/devices` 8.19.0, `@ledgerhq/domain-service` 1.10.0, `@ledgerhq/evm-tools` 2.1.0, `@ledgerhq/hw-ledger-key-ring-protocol` 1.1.0, `@ledgerhq/hw-transport` 6.37.0, `@ledgerhq/hw-transport-mocker` 6.36.0, `@ledgerhq/ledger-key-ring-protocol` 1.2.0, `@ledgerhq/live-config` 3.10.0, `@ledgerhq/live-currency-format` 0.17.0, `@ledgerhq/live-env` 4.2.0, `@ledgerhq/live-network` 3.3.0, `@ledgerhq/live-promise` 0.5.0, `@ledgerhq/logs` 6.20.0, `@ledgerhq/psbtv2` 0.7.0).

- [#24292](https://github.com/LedgerHQ/ledger-live/pull/24292) [`c6d8c4f`](https://github.com/LedgerHQ/ledger-live/commit/c6d8c4f1c50ada25f9c2bb4b5bbd50c117e3fce1) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the desktop Analytics catalog and scoped balance readers.

- [#24245](https://github.com/LedgerHQ/ledger-live/pull/24245) [`c533e40`](https://github.com/LedgerHQ/ledger-live/commit/c533e40882433c3e9cdc3dcb462ecda5c34beac4) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Add the Perps withdraw summary screen with an auto-refreshing SwapKit quote on desktop and mobile

- [#24472](https://github.com/LedgerHQ/ledger-live/pull/24472) [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Show the 1D market variation for an unchanged account balance

- [#24326](https://github.com/LedgerHQ/ledger-live/pull/24326) [`e6cf079`](https://github.com/LedgerHQ/ledger-live/commit/e6cf079531083672e9d0408c600fd8e4b4b613a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the full all-time high and all-time low dates on the desktop asset page.

- [#24437](https://github.com/LedgerHQ/ledger-live/pull/24437) [`716dba7`](https://github.com/LedgerHQ/ledger-live/commit/716dba70f24aea647d9b0fcfec75f315afbe9dbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the legacy currency distribution and always build the asset distribution

- [#24293](https://github.com/LedgerHQ/ledger-live/pull/24293) [`94961d4`](https://github.com/LedgerHQ/ledger-live/commit/94961d48d733bce0b50061f02c00f7942774fa70) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared Analytics web surface with asset/account filters and injected chart and PnL renderers.

- [#24415](https://github.com/LedgerHQ/ledger-live/pull/24415) [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the coin-config DevTool on desktop and mobile to override LiveConfig values. The overrides slice moves to the new @shared/live-config-overrides package, and mobile now keeps the overrides across restarts

- [#24217](https://github.com/LedgerHQ/ledger-live/pull/24217) [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactDetailActionsMenu` moves to the native platform entry `@features/flow-contacts-detail/native` and reads its bottom inset from the sheet context; `ContactDetailActions` becomes internal. The universal entry is one unconditioned `src/index.ts`, `ContactAddressDetailDialog` and `ContactsEditSignerMismatchDialog` each have one props contract, `ContactDetailView` takes `onOpenLedgerWalletAccounts` and `onOpenAddressDetail`, and the web address detail dialog shows a Share tile when `onShareAddress` is set.

- [#24370](https://github.com/LedgerHQ/ledger-live/pull/24370) [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.

- [#24591](https://github.com/LedgerHQ/ledger-live/pull/24591) [`9b95c30`](https://github.com/LedgerHQ/ledger-live/commit/9b95c30ca4420bc7cedb634ff131c98fe1a2c727) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Run the desktop rspack tooling with Node's native TypeScript support instead of ts-node

- [#24515](https://github.com/LedgerHQ/ledger-live/pull/24515) [`8baa24b`](https://github.com/LedgerHQ/ledger-live/commit/8baa24be642c4d670ecea9d739e5edffff09df92) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Type SelectCurrency options for TypeScript 7.1

- [#24575](https://github.com/LedgerHQ/ledger-live/pull/24575) [`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Make `onExecutorStateChanged` and `cancelIntentRequestId` optional on the device intent executor

- [#24303](https://github.com/LedgerHQ/ledger-live/pull/24303) [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d) Thanks [@ysitbon](https://github.com/ysitbon)! - Split device onboarding by job: `@features/platform-device-onboarding` runs the actor with `useDeviceOnboardingActor`, and `@devtools/bindings` builds the devtool's log, context and next states with `useDeviceOnboardingToolState` and `useDeviceOnboardingToolProps`. The mobile funnel no longer imports `@devtools/*`, and the desktop device onboarding code moves under DevTools

- [#24271](https://github.com/LedgerHQ/ledger-live/pull/24271) [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the CoinGecko market client and keep the USD chart fallback

- [#24683](https://github.com/LedgerHQ/ledger-live/pull/24683) [`d5eefc2`](https://github.com/LedgerHQ/ledger-live/commit/d5eefc2b56c9556146a5bdb5acbae5e0d170a308) Thanks [@ben778899](https://github.com/ben778899)! - Fake update to trigger the update test cases.

- [#24297](https://github.com/LedgerHQ/ledger-live/pull/24297) [`6464950`](https://github.com/LedgerHQ/ledger-live/commit/6464950833e7e27eb44da0171772f3ba5be8c116) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-contacts` exposes `ContactsView` and `ContactsButton` from a single `.` entry with shared `ContactsViewProps` and `ContactsButtonProps` contracts. List logic and platform contact hooks are imported from `@features/flow-contacts-list` and `@features/platform-contacts`. Desktop and mobile hosts mount feature and Ledger Sync introduction UI outside `ContactsView`.

- [#24487](https://github.com/LedgerHQ/ledger-live/pull/24487) [`c0c5bff`](https://github.com/LedgerHQ/ledger-live/commit/c0c5bfffdb1aefa91de627f26ea15b75ca6b5107) Thanks [@amaslakov](https://github.com/amaslakov)! - Enable the Tron votes panel earn rewards and desktop vote now actions, routed like the account Earn action

- [#23539](https://github.com/LedgerHQ/ledger-live/pull/23539) [`310127f`](https://github.com/LedgerHQ/ledger-live/commit/310127f2b7fbc19eba7b2e45bd1d6467e447e84e) Thanks [@ishaba](https://github.com/ishaba)! - Show the energy provider's terms on the Tronify rent signature step, which the user accepts by signing, and align the rent, polling and transfer step copy with the validated wording

- [#23466](https://github.com/LedgerHQ/ledger-live/pull/23466) [`ad006b9`](https://github.com/LedgerHQ/ledger-live/commit/ad006b94782873e9fe8727dcea96e3adb54f8d28) Thanks [@ishaba](https://github.com/ishaba)! - Resolve TRON TRC10 tokens by their CAL token_identifier

- [#24594](https://github.com/LedgerHQ/ledger-live/pull/24594) [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align desktop 1D asset and account variation with the market banner

- [#24406](https://github.com/LedgerHQ/ledger-live/pull/24406) [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show aggregated assets and drop the lwmWallet40 aggregatedAssets param

- [#24295](https://github.com/LedgerHQ/ledger-live/pull/24295) [`3571671`](https://github.com/LedgerHQ/ledger-live/commit/3571671667a23517ced1aa9fec421368cb751ef7) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-pay-contact` exports `PaySuccess` and the address picker from `.`, with `./web` and `./native` platform entries for `Contacts`. `PaySuccess` shares one props contract; suffix imports are removed from the package.

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#24149](https://github.com/LedgerHQ/ledger-live/pull/24149) [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a Predictions card to the portfolio services entry points and a Predictions screen that opens the live app, behind the `ptxPredictionsLiveAppDesktop` and `ptxPredictionsLiveAppMobile` flags

- [#24475](https://github.com/LedgerHQ/ledger-live/pull/24475) [`a2354b8`](https://github.com/LedgerHQ/ledger-live/commit/a2354b8ed84af0a52a09860038e4f8d51533a778) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Show the Device Intent Executor dialog on the Lumen sheet background

- [#24240](https://github.com/LedgerHQ/ledger-live/pull/24240) [`ae675f9`](https://github.com/LedgerHQ/ledger-live/commit/ae675f9479e10b46d1e5f749e35d7640ead4de96) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover the remaining Account Detail integration scenarios on desktop and mobile

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

- [#24110](https://github.com/LedgerHQ/ledger-live/pull/24110) [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4) Thanks [@qperrot](https://github.com/qperrot)! - Remove Fantom, whose network migrated to Sonic

- [#24205](https://github.com/LedgerHQ/ledger-live/pull/24205) [`7647d9b`](https://github.com/LedgerHQ/ledger-live/commit/7647d9b092814564ce8947368f852780582c212f) Thanks [@henri-ly](https://github.com/henri-ly)! - Block sends of known non-transferable ERC-20 tokens with a TokenNonTransferable amount error

- [#24371](https://github.com/LedgerHQ/ledger-live/pull/24371) [`32be7d2`](https://github.com/LedgerHQ/ledger-live/commit/32be7d2b61e9c7c5024b2a155822fb88e76c8ca8) Thanks [@ysitbon](https://github.com/ysitbon)! - Lock the universal-components waiver list empty, remove waiver helpers from enforce-package-structure, and record the rollout as complete in the ADR.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

- [#24290](https://github.com/LedgerHQ/ledger-live/pull/24290) [`94df3d0`](https://github.com/LedgerHQ/ledger-live/commit/94df3d0acc235f2aa429ffaea4f21bf327469fe3) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - [LWDM] chore(deps): update dependency oxfmt to v0.75.0

  - Updated `oxfmt` to `0.75.0`

- [#24291](https://github.com/LedgerHQ/ledger-live/pull/24291) [`4fc4674`](https://github.com/LedgerHQ/ledger-live/commit/4fc4674c788390588d2d3733fc5928372d2c8382) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency oxlint to v1.90.0

  - Updated `oxlint` to `1.90.0`

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24400](https://github.com/LedgerHQ/ledger-live/pull/24400) [`836c45b`](https://github.com/LedgerHQ/ledger-live/commit/836c45b3181060458ce399c0a6572b6468c699d1) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - fix(deps): update dependency dotenv to v16.4.7

  - Updated `dotenv` to `16.4.7`

- [#24429](https://github.com/LedgerHQ/ledger-live/pull/24429) [`0a430b8`](https://github.com/LedgerHQ/ledger-live/commit/0a430b829d97b4137e8de60a935efbbc9bb355ba) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency cross-env to v10

  - Updated `cross-env` to `10.1.0`

- [#24545](https://github.com/LedgerHQ/ledger-live/pull/24545) [`dfbc33b`](https://github.com/LedgerHQ/ledger-live/commit/dfbc33bba8ec826c1b5d585fbfd9f0c9135e68c0) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @electron/notarize to v3.1.2

  - Updated `@electron/notarize` to `3.1.2`

- [#24157](https://github.com/LedgerHQ/ledger-live/pull/24157) [`d528ea0`](https://github.com/LedgerHQ/ledger-live/commit/d528ea06fe6571e7c990936f2f22831e754b0178) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Share the account asset picker across desktop and mobile

- [#24050](https://github.com/LedgerHQ/ledger-live/pull/24050) [`6a70efc`](https://github.com/LedgerHQ/ledger-live/commit/6a70efc3eb1e625206286d913d7f5d07b01ee8ad) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Share the device mock server session client and URL helpers in @features/platform-device-mock-server and the legacy transport in live-dmk-shared, and use them in Ledger Wallet Desktop

- [#24196](https://github.com/LedgerHQ/ledger-live/pull/24196) [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Account Detail Analytics introduction in a dedicated layout slot above the custom place, with dismissal persisted across desktop restarts and account entry context.

- [#24568](https://github.com/LedgerHQ/ledger-live/pull/24568) [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98) Thanks [@qperrot](https://github.com/qperrot)! - Remove Stargaze from Ledger Wallet

- [#24431](https://github.com/LedgerHQ/ledger-live/pull/24431) [`41c9607`](https://github.com/LedgerHQ/ledger-live/commit/41c960724990ccc044f959d51b294e66c5fa3f65) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Count staked SUI in the account balance; spend and stake checks use the spendable balance only. Stake operations move the balance by their gas only, and an unstake also by its reward, so the balance history stays consistent.

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

- [#24462](https://github.com/LedgerHQ/ledger-live/pull/24462) [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85) Thanks [@deepyjr](https://github.com/deepyjr)! - Track the Analytics filters, the Analytics banner click and its visibility on the account page.

- [#24561](https://github.com/LedgerHQ/ledger-live/pull/24561) [`6d015f0`](https://github.com/LedgerHQ/ledger-live/commit/6d015f0b776d5488eee4a4b94503e0f32aa22abe) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add the XRP add token flow, trust limit edit and rippling state display on desktop, behind `enabledTokenStandards`

### Patch Changes

- Updated dependencies [[`0d2aead`](https://github.com/LedgerHQ/ledger-live/commit/0d2aeadc33cfde80c7ef0ad83a6424a756b20b0d), [`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b), [`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78), [`03cafaf`](https://github.com/LedgerHQ/ledger-live/commit/03cafaff14567ab3a8ee8495f3da964a7d56683a), [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`0ebe8ea`](https://github.com/LedgerHQ/ledger-live/commit/0ebe8ea274936993a9dff1c36bf7b036d531e1f5), [`cd66cae`](https://github.com/LedgerHQ/ledger-live/commit/cd66caee3d913da639911a3cc29024215bf9a2e6), [`cc73a3f`](https://github.com/LedgerHQ/ledger-live/commit/cc73a3f12a1cb7e367bcddaea42680d0c74a62ed), [`2c728a2`](https://github.com/LedgerHQ/ledger-live/commit/2c728a22e6acce91ec50f07bb676114850389d4a), [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4), [`e6c438d`](https://github.com/LedgerHQ/ledger-live/commit/e6c438d64ad0beb6224bd4c0361241641fe2a37d), [`e7a4d5a`](https://github.com/LedgerHQ/ledger-live/commit/e7a4d5a01ce2aa5636609f70cccc6274d5189b08), [`ba1b7c4`](https://github.com/LedgerHQ/ledger-live/commit/ba1b7c45b4818bed008fcbed07d97b9a3e9aa0b3), [`64c16b8`](https://github.com/LedgerHQ/ledger-live/commit/64c16b8200c14d691b104a99396c00252731be2a), [`cc4eced`](https://github.com/LedgerHQ/ledger-live/commit/cc4eced87a10926e185c430c6e38d9151482266f), [`59280f5`](https://github.com/LedgerHQ/ledger-live/commit/59280f54cb1b4cf679f926dfeac4848103b0ac42), [`c842892`](https://github.com/LedgerHQ/ledger-live/commit/c8428923a5cf0ed556ff7a48a6e373c740cdb6a1), [`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`a95a6bc`](https://github.com/LedgerHQ/ledger-live/commit/a95a6bcb630289fde6782430fb511b9c48c9ffcc), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`93aef61`](https://github.com/LedgerHQ/ledger-live/commit/93aef61f00e4e65de92695a983bfbca21e156ccb), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead), [`fb3956b`](https://github.com/LedgerHQ/ledger-live/commit/fb3956b429b34b35b4b6e3e50b14f6d9bdf2d59b), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`d02425e`](https://github.com/LedgerHQ/ledger-live/commit/d02425e29efe55595b51556e598fde0f9c34574f), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`81f924e`](https://github.com/LedgerHQ/ledger-live/commit/81f924e4acd4d79e898fa0cc8b1acf03a6c01de6), [`3835bab`](https://github.com/LedgerHQ/ledger-live/commit/3835babeb6da9775f5750a2219f480a5422269ab), [`6da9b38`](https://github.com/LedgerHQ/ledger-live/commit/6da9b38e20ae18b9aa3e31d41a155420ace9987b), [`c6d8c4f`](https://github.com/LedgerHQ/ledger-live/commit/c6d8c4f1c50ada25f9c2bb4b5bbd50c117e3fce1), [`b282f26`](https://github.com/LedgerHQ/ledger-live/commit/b282f26a470c5f3519d252eb301b5ddb98fe68e9), [`c533e40`](https://github.com/LedgerHQ/ledger-live/commit/c533e40882433c3e9cdc3dcb462ecda5c34beac4), [`72da4b1`](https://github.com/LedgerHQ/ledger-live/commit/72da4b19bd803dc85ef83d3b09a45445f95186fa), [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab), [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b), [`716dba7`](https://github.com/LedgerHQ/ledger-live/commit/716dba70f24aea647d9b0fcfec75f315afbe9dbc), [`94961d4`](https://github.com/LedgerHQ/ledger-live/commit/94961d48d733bce0b50061f02c00f7942774fa70), [`498cbdd`](https://github.com/LedgerHQ/ledger-live/commit/498cbdd918b0117959e9e0ff9db6adb31191b138), [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d), [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72), [`ed8d437`](https://github.com/LedgerHQ/ledger-live/commit/ed8d437ae166be537aa7bf309691691ee56b8ffc), [`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e), [`085d781`](https://github.com/LedgerHQ/ledger-live/commit/085d781d100c76bcb9b6dc573af1c7f28fc115e1), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`31f7eba`](https://github.com/LedgerHQ/ledger-live/commit/31f7ebace98301cb3e46185a91621aa3ef59bb3b), [`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372), [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d), [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`6464950`](https://github.com/LedgerHQ/ledger-live/commit/6464950833e7e27eb44da0171772f3ba5be8c116), [`5bc9bb1`](https://github.com/LedgerHQ/ledger-live/commit/5bc9bb199bd54af8046a7889b2b846603d083207), [`0b3f0f2`](https://github.com/LedgerHQ/ledger-live/commit/0b3f0f28584733a0c17634117b7d53ff07fe025b), [`310127f`](https://github.com/LedgerHQ/ledger-live/commit/310127f2b7fbc19eba7b2e45bd1d6467e447e84e), [`ad006b9`](https://github.com/LedgerHQ/ledger-live/commit/ad006b94782873e9fe8727dcea96e3adb54f8d28), [`9621949`](https://github.com/LedgerHQ/ledger-live/commit/9621949145e7e771a3663969f2e6610ac91459bd), [`06c81d3`](https://github.com/LedgerHQ/ledger-live/commit/06c81d33d1c2da765bbd34f4e8e1593f43ce745d), [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25), [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`a6c95e2`](https://github.com/LedgerHQ/ledger-live/commit/a6c95e2ae469bfe6eb3432fc691efea35d70a741), [`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`2cee99e`](https://github.com/LedgerHQ/ledger-live/commit/2cee99e4b728ef315e5df94271c2bd6b695a7ade), [`8777c73`](https://github.com/LedgerHQ/ledger-live/commit/8777c73879acf3e38b8cef00fb88213c55011f96), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`7282cc0`](https://github.com/LedgerHQ/ledger-live/commit/7282cc0d6d7431ecb4d49534d267f5f562652965), [`8dae360`](https://github.com/LedgerHQ/ledger-live/commit/8dae360c044392da40c67e29416d11bbe34afd8b), [`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff), [`3571671`](https://github.com/LedgerHQ/ledger-live/commit/3571671667a23517ced1aa9fec421368cb751ef7), [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39), [`7e4dccf`](https://github.com/LedgerHQ/ledger-live/commit/7e4dccffcad306c45ed380758cd6e7624c9c7921), [`e0ac369`](https://github.com/LedgerHQ/ledger-live/commit/e0ac36999d2ff30c0788c40a4a7ed80293d72fe0), [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4), [`7647d9b`](https://github.com/LedgerHQ/ledger-live/commit/7647d9b092814564ce8947368f852780582c212f), [`80b6233`](https://github.com/LedgerHQ/ledger-live/commit/80b62337e7e2b754004ca5f93b9f7d569015e1eb), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`d528ea0`](https://github.com/LedgerHQ/ledger-live/commit/d528ea06fe6571e7c990936f2f22831e754b0178), [`6a70efc`](https://github.com/LedgerHQ/ledger-live/commit/6a70efc3eb1e625206286d913d7f5d07b01ee8ad), [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a), [`d4bccad`](https://github.com/LedgerHQ/ledger-live/commit/d4bccadbcafe6365dd589ada054bd05d307722d2), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`0d2268d`](https://github.com/LedgerHQ/ledger-live/commit/0d2268d099e6ad7adac33bcb1e4456a28712a2ec), [`aec9525`](https://github.com/LedgerHQ/ledger-live/commit/aec9525f565f851007d992a6c807efdf0958eb27), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85), [`5eec368`](https://github.com/LedgerHQ/ledger-live/commit/5eec368a80f6b8ad05ff97b1cbd78851b8391b2b), [`f53d517`](https://github.com/LedgerHQ/ledger-live/commit/f53d517815a694c54cb535ba39ebc1b249a88775), [`9a3e7bf`](https://github.com/LedgerHQ/ledger-live/commit/9a3e7bf4f8d5192f748fc3aa0a2dc9ac889f1513), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/live-common@38.7.0
  - @features/platform-aggregated-assets@0.7.0
  - @shared/feature-flags@0.30.0
  - @ledgerhq/coin-zcash@1.2.0
  - @domain/entity-account-operation@0.2.0
  - @domain/api-market-countervalues@0.3.0
  - @devtools/bindings@0.15.0
  - @features/platform-account-source-coin-module@0.2.0
  - @features/flow-account-detail-hero@0.4.0
  - @features/flow-account-detail-delegations@0.3.0
  - @features/flow-account-detail-analytics-notice@0.3.0
  - @features/flow-account-analytics@0.2.0
  - @features/flow-account-detail@0.4.0
  - @ledgerhq/types-live@6.131.0
  - @domain/entity-currency-crypto@0.19.0
  - @ledgerhq/coin-bitcoin@1.2.0
  - @ledgerhq/ledger-wallet-framework@3.11.0
  - @domain/entity-currency-fiat@0.6.0
  - @domain/entity-aggregated-asset@0.4.0
  - @domain/api-aggregated-assets@0.7.0
  - @ledgerhq/asset-detail@0.13.0
  - @domain/api-account-data@0.5.0
  - @devtools/shell@0.14.0
  - @ledgerhq/wallet-btc@1.2.0
  - @ledgerhq/live-wallet@1.2.0
  - @ledgerhq/live-dmk-shared@0.39.0
  - @features/platform-device-onboarding@0.5.0
  - @ledgerhq/coin-cardano@3.0.0
  - @shared/env@0.13.0
  - @features/platform-feature-flags@0.12.0
  - @shared/live-config-overrides@0.2.0
  - @ledgerhq/coin-canton@1.7.0
  - @ledgerhq/coin-casper@3.8.0
  - @ledgerhq/coin-concordium@1.8.0
  - @ledgerhq/coin-filecoin@2.7.0
  - @ledgerhq/coin-stacks@0.36.0
  - @domain/entity-contact@0.13.0
  - @features/flow-contacts-detail@0.4.0
  - @domain/entity-currency@0.5.0
  - @domain/entity-account-balance@0.3.0
  - @domain/entity-account-balance-history@0.2.0
  - @features/platform-device-intent@5.4.0
  - @features/flow-contacts@0.18.0
  - @domain/api-currency-token@0.8.0
  - @features/platform-assets-table@0.3.0
  - @features/flow-portfolio-services-entry-points@0.3.0
  - @features/platform-device-mock-server@0.1.0
  - @shared/ui-info-state@0.7.0
  - @features/flow-pay-card-assets@0.7.0
  - @features/flow-pay-card-details@0.11.0
  - @features/flow-pay-card@0.9.0
  - @features/flow-pay-contact@0.9.0
  - @features/flow-predictions@0.2.0
  - @features/platform-predictions@0.4.0
  - @shared/ui-animated-height@0.3.0
  - @domain/entity-predictions@0.3.0
  - @features/flow-pay-balance@0.10.0
  - @features/flow-pay-request@0.10.0
  - @domain/api-card-management@0.9.0
  - @domain/api-currency-fiat@0.6.0
  - @domain/api-market-index-altcoin-season@0.5.0
  - @domain/api-market-index-fear-and-greed@0.5.0
  - @domain/api-push-devices@0.3.0
  - @domain/entity-account@0.3.0
  - @domain/entity-account-alias@0.2.0
  - @domain/entity-account-data@0.5.0
  - @domain/entity-account-name@0.4.0
  - @domain/entity-client-identity@0.5.0
  - @domain/entity-market-countervalues@0.5.0
  - @domain/entity-recent-addresses@0.3.0
  - @domain/entity-starred-account@0.1.0
  - @domain/entity-wallet-sync@0.2.0
  - @features/flow-large-screen-upsell@2.4.0
  - @features/flow-pay-card-auth@0.12.0
  - @features/flow-pay-card-widget@0.7.0
  - @features/flow-pay-feature-tour@0.9.0
  - @features/platform-card@0.9.0
  - @features/platform-currencies@0.13.0
  - @features/platform-market-countervalues@0.5.0
  - @shared/api-services@0.13.0
  - @shared/app-config@0.3.0
  - @shared/auth@0.9.0
  - @ledgerhq/live-dmk-desktop@0.27.0
  - @ledgerhq/live-send@0.2.0
  - @ledgerhq/wallet-pnl@0.9.0
  - @ledgerhq/asset-aggregation@0.19.0
  - @features/flow-contacts-add-address@0.9.1
  - @features/platform-contacts@0.12.2
  - @features/platform-feature-flags-firebase@0.1.4
  - @ledgerhq/live-signer-evm@0.24.5
  - @ledgerhq/transaction-observability@0.6.2
  - @ledgerhq/wallet-analytics@0.5.5
  - @domain/entity-currency-token@0.5.9
  - @features/flow-account-detail-notices@0.3.0
  - @features/flow-account-detail-settings@0.3.1
  - @features/platform-account-analytics@0.2.0
  - @ledgerhq/live-signer-tron@0.2.5
  - @features/platform-env@0.4.5
  - @features/flow-analytics-consent@0.2.13
  - @features/flow-contacts-add-contact@0.10.1
  - @features/flow-contacts-delete-address@0.4.1
  - @features/flow-contacts-delete-contact@0.5.1
  - @features/flow-contacts-edit-address@0.7.1
  - @features/flow-contacts-edit-contact@0.9.1
  - @features/flow-contacts-list@0.12.1
  - @features/platform-intent-verify-address@0.3.2
  - @features/flow-pay-card-transactions@0.7.2
  - @features/flow-fear-and-greed@0.5.2
  - @features/flow-app-availability@0.3.2
  - @features/platform-content-ab-tests@0.2.4

## 4.28.0-next.1

### Minor Changes

- [#24683](https://github.com/LedgerHQ/ledger-live/pull/24683) [`d5eefc2`](https://github.com/LedgerHQ/ledger-live/commit/d5eefc2b56c9556146a5bdb5acbae5e0d170a308) Thanks [@ben778899](https://github.com/ben778899)! - Fake update to trigger the update test cases.

## 4.28.0-next.0

### Minor Changes

- [#24189](https://github.com/LedgerHQ/ledger-live/pull/24189) [`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Let users pick the network when they swap a multi-network asset from Market or Asset Detail, also when they have no account for it. Show only the networks of the asset itself, so USDC no longer opens an extra asset step. When the drawer keeps only one network, open the account step on that network.

- [#24195](https://github.com/LedgerHQ/ledger-live/pull/24195) [`1fa3701`](https://github.com/LedgerHQ/ledger-live/commit/1fa3701af2b570706605c2f59964e366b289cbf3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail sends the events of its tracking plan, with the same names and properties on both apps

- [#24262](https://github.com/LedgerHQ/ledger-live/pull/24262) [`4bd0f62`](https://github.com/LedgerHQ/ledger-live/commit/4bd0f62b9480e79e7628d0c918b7191f1087f0bd) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - chore(lumen): bump ui-rnative to 0.1.72 for rn 0.86 (LIVE-39312)

  Bump lumen-ui-rnative to 0.1.72, lumen-ui-react to 0.1.69 and lumen-utils-shared to 0.1.19. The new lumen-ui-rnative peer ranges accept react-native 0.86, react-native-worklets 0.10 and expo-haptics 57. Lumen native inputs now expose their label as the TextInput accessibility label and hide the visual label from accessibility, so mobile tests query these inputs with `getByLabelText`.

- [#24412](https://github.com/LedgerHQ/ledger-live/pull/24412) [`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sample `estimateFees` and `validateIntent` successes in `coin_module_call` with a new `preparationSampleRate` param of the `coinObservability` flag (default 0.1): the bridge calls them on every edit of a transaction, so sending each call made them most of the volume. Their failures are still always sent, and `craftTransaction`, `craftRawTransaction`, `craftTransactionData`, `combine` and `broadcast` stay unsampled. Each `coin_module_call` now carries its tier's `sampleRate` and an `inSample` flag, so dashboards can compute unbiased failure rates and estimate volumes from the sample.

- [#23955](https://github.com/LedgerHQ/ledger-live/pull/23955) [`03cafaf`](https://github.com/LedgerHQ/ledger-live/commit/03cafaff14567ab3a8ee8495f3da964a7d56683a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.9.0, which ships each native binary in its own optional package. The desktop app now packages only the binaries it runs on (darwin arm64/x64, win32 x64, linux x64) instead of all six.

- [#24339](https://github.com/LedgerHQ/ledger-live/pull/24339) [`eac050d`](https://github.com/LedgerHQ/ledger-live/commit/eac050d156808c13da83985ec3ebaed0567caa51) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Cardano delegation and balances with the shared Lumen components

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24235](https://github.com/LedgerHQ/ledger-live/pull/24235) [`0ebe8ea`](https://github.com/LedgerHQ/ledger-live/commit/0ebe8ea274936993a9dff1c36bf7b036d531e1f5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Hide the account detail empty state when a receive updates the balance before operations

- [#24348](https://github.com/LedgerHQ/ledger-live/pull/24348) [`cc73a3f`](https://github.com/LedgerHQ/ledger-live/commit/cc73a3f12a1cb7e367bcddaea42680d0c74a62ed) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Widen the account delegations validator column so the validator name is shown in full

- [#24354](https://github.com/LedgerHQ/ledger-live/pull/24354) [`2c728a2`](https://github.com/LedgerHQ/ledger-live/commit/2c728a22e6acce91ec50f07bb676114850389d4a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Shrink the account asset picker dialog to its content when few assets are listed

- [#24325](https://github.com/LedgerHQ/ledger-live/pull/24325) [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an account-detail DevTools tool to reset the Account Detail card that redirects to Analytics

- [#24556](https://github.com/LedgerHQ/ledger-live/pull/24556) [`e6c438d`](https://github.com/LedgerHQ/ledger-live/commit/e6c438d64ad0beb6224bd4c0361241641fe2a37d) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the native Account Analytics surface (filter chips opening a bottom sheet, status and Retry) and export AccountAnalytics from the package root for both apps.

- [#24554](https://github.com/LedgerHQ/ledger-live/pull/24554) [`e7a4d5a`](https://github.com/LedgerHQ/ledger-live/commit/e7a4d5a01ce2aa5636609f70cccc6274d5189b08) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics balance, renderer status and PnL scope rules between the apps through the Account Analytics package.

- [#24553](https://github.com/LedgerHQ/ledger-live/pull/24553) [`ba1b7c4`](https://github.com/LedgerHQ/ledger-live/commit/ba1b7c45b4818bed008fcbed07d97b9a3e9aa0b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Share the Analytics catalog rules (eligible positions, asset grouping, catalog state) between the apps through the Account Analytics package.

- [#24572](https://github.com/LedgerHQ/ledger-live/pull/24572) [`a85db5d`](https://github.com/LedgerHQ/ledger-live/commit/a85db5d1808cb7470e224dcc70f0510920664223) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Asset detail "See all" transactions no longer lists the operations of the tokens held by the same account

- [#24127](https://github.com/LedgerHQ/ledger-live/pull/24127) [`1c99745`](https://github.com/LedgerHQ/ledger-live/commit/1c9974592fc45d93014b5111973c12ff4fd2b663) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a test id to the network fees fiat value on the custom fees screen

- [#24443](https://github.com/LedgerHQ/ledger-live/pull/24443) [`c842892`](https://github.com/LedgerHQ/ledger-live/commit/c8428923a5cf0ed556ff7a48a6e373c740cdb6a1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Send `network` instead of `currency` and drop `isTokenAccount` on the account detail page events

- [#24468](https://github.com/LedgerHQ/ledger-live/pull/24468) [`f720cc5`](https://github.com/LedgerHQ/ledger-live/commit/f720cc5c89cca816c8e4954a911e0b894a38924b) Thanks [@deepyjr](https://github.com/deepyjr)! - Stop the Analytics chart from flickering when the asset, account or range changes: keep the previous curve on screen until the new one is ready instead of blanking it.

- [#24463](https://github.com/LedgerHQ/ledger-live/pull/24463) [`6ef8d46`](https://github.com/LedgerHQ/ledger-live/commit/6ef8d46d779e672c2e4ee6ca7925b43ad28c10c2) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Analytics balance and chart when a held asset has no price, leaving that asset out of the total as the Portfolio does. Analytics still reports unavailable data when no held asset of the selection has a price.

- [#24226](https://github.com/LedgerHQ/ledger-live/pull/24226) [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): do not spend the inputs of pending operations

  `prepareTransaction` and `estimateMaxSpendable` exclude the UTXOs spent by the account's own
  pending operations. When the explorer does not report mempool spends, a sync listed them as
  spendable again and the next send was rejected with `txn-mempool-conflict`. An RBF edit keeps
  the inputs of the operation it replaces.

  `addPendingOperation` keeps every pending UTXO operation (those with `extra.inputs`) instead of
  only the latest one, and removes one only when the new operation spends one of its inputs (an RBF
  replacement). Operations of other coins are unchanged.

  `isOldestBitcoinPendingOperation` takes the operation instead of its date: a pending operation
  can be sped up unless it spends an output of another unconfirmed operation of the account. Pending
  sends of unrelated UTXOs no longer block each other's speed-up.

- [#24520](https://github.com/LedgerHQ/ledger-live/pull/24520) [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand `AggregatedAssetId` and `MarketId`, and replace both copies of `dadaIdToMarketId` with the typed `toMarketId` and `parseMarketRef` bridge in `@domain/api-aggregated-assets`

- [#24541](https://github.com/LedgerHQ/ledger-live/pull/24541) [`120e07b`](https://github.com/LedgerHQ/ledger-live/commit/120e07b05d40d2099fe5eeee2f3042e29b1be389) Thanks [@LucHebrard](https://github.com/LucHebrard)! - Send in-progress Ledger Recover users from the Backup Hub to the Recover upsell page

- [#24318](https://github.com/LedgerHQ/ledger-live/pull/24318) [`fb3956b`](https://github.com/LedgerHQ/ledger-live/commit/fb3956b429b34b35b4b6e3e50b14f6d9bdf2d59b) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Sign the Perps SwapKit withdrawal on the Ethereum app and submit it on desktop and mobile

- [#24350](https://github.com/LedgerHQ/ledger-live/pull/24350) [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the supportDeviceApex feature flag: Apex is always listed in onboarding device selection and BLE pairing

- [#24255](https://github.com/LedgerHQ/ledger-live/pull/24255) [`81f924e`](https://github.com/LedgerHQ/ledger-live/commit/81f924e4acd4d79e898fa0cc8b1acf03a6c01de6) Thanks [@deepyjr](https://github.com/deepyjr)! - Integrate scoped Analytics filters, current balance and all-time PnL into desktop.

- [#24500](https://github.com/LedgerHQ/ledger-live/pull/24500) [`6da9b38`](https://github.com/LedgerHQ/ledger-live/commit/6da9b38e20ae18b9aa3e31d41a155420ace9987b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/auth` 0.2.0, `@ledgerhq/devices` 8.19.0, `@ledgerhq/domain-service` 1.10.0, `@ledgerhq/evm-tools` 2.1.0, `@ledgerhq/hw-ledger-key-ring-protocol` 1.1.0, `@ledgerhq/hw-transport` 6.37.0, `@ledgerhq/hw-transport-mocker` 6.36.0, `@ledgerhq/ledger-key-ring-protocol` 1.2.0, `@ledgerhq/live-config` 3.10.0, `@ledgerhq/live-currency-format` 0.17.0, `@ledgerhq/live-env` 4.2.0, `@ledgerhq/live-network` 3.3.0, `@ledgerhq/live-promise` 0.5.0, `@ledgerhq/logs` 6.20.0, `@ledgerhq/psbtv2` 0.7.0).

- [#24292](https://github.com/LedgerHQ/ledger-live/pull/24292) [`c6d8c4f`](https://github.com/LedgerHQ/ledger-live/commit/c6d8c4f1c50ada25f9c2bb4b5bbd50c117e3fce1) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the desktop Analytics catalog and scoped balance readers.

- [#24245](https://github.com/LedgerHQ/ledger-live/pull/24245) [`c533e40`](https://github.com/LedgerHQ/ledger-live/commit/c533e40882433c3e9cdc3dcb462ecda5c34beac4) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Add the Perps withdraw summary screen with an auto-refreshing SwapKit quote on desktop and mobile

- [#24472](https://github.com/LedgerHQ/ledger-live/pull/24472) [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Show the 1D market variation for an unchanged account balance

- [#24326](https://github.com/LedgerHQ/ledger-live/pull/24326) [`e6cf079`](https://github.com/LedgerHQ/ledger-live/commit/e6cf079531083672e9d0408c600fd8e4b4b613a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the full all-time high and all-time low dates on the desktop asset page.

- [#24437](https://github.com/LedgerHQ/ledger-live/pull/24437) [`716dba7`](https://github.com/LedgerHQ/ledger-live/commit/716dba70f24aea647d9b0fcfec75f315afbe9dbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the legacy currency distribution and always build the asset distribution

- [#24293](https://github.com/LedgerHQ/ledger-live/pull/24293) [`94961d4`](https://github.com/LedgerHQ/ledger-live/commit/94961d48d733bce0b50061f02c00f7942774fa70) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared Analytics web surface with asset/account filters and injected chart and PnL renderers.

- [#24415](https://github.com/LedgerHQ/ledger-live/pull/24415) [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the coin-config DevTool on desktop and mobile to override LiveConfig values. The overrides slice moves to the new @shared/live-config-overrides package, and mobile now keeps the overrides across restarts

- [#24217](https://github.com/LedgerHQ/ledger-live/pull/24217) [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactDetailActionsMenu` moves to the native platform entry `@features/flow-contacts-detail/native` and reads its bottom inset from the sheet context; `ContactDetailActions` becomes internal. The universal entry is one unconditioned `src/index.ts`, `ContactAddressDetailDialog` and `ContactsEditSignerMismatchDialog` each have one props contract, `ContactDetailView` takes `onOpenLedgerWalletAccounts` and `onOpenAddressDetail`, and the web address detail dialog shows a Share tile when `onShareAddress` is set.

- [#24370](https://github.com/LedgerHQ/ledger-live/pull/24370) [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.

- [#24591](https://github.com/LedgerHQ/ledger-live/pull/24591) [`9b95c30`](https://github.com/LedgerHQ/ledger-live/commit/9b95c30ca4420bc7cedb634ff131c98fe1a2c727) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Run the desktop rspack tooling with Node's native TypeScript support instead of ts-node

- [#24515](https://github.com/LedgerHQ/ledger-live/pull/24515) [`8baa24b`](https://github.com/LedgerHQ/ledger-live/commit/8baa24be642c4d670ecea9d739e5edffff09df92) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Type SelectCurrency options for TypeScript 7.1

- [#24575](https://github.com/LedgerHQ/ledger-live/pull/24575) [`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Make `onExecutorStateChanged` and `cancelIntentRequestId` optional on the device intent executor

- [#24303](https://github.com/LedgerHQ/ledger-live/pull/24303) [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d) Thanks [@ysitbon](https://github.com/ysitbon)! - Split device onboarding by job: `@features/platform-device-onboarding` runs the actor with `useDeviceOnboardingActor`, and `@devtools/bindings` builds the devtool's log, context and next states with `useDeviceOnboardingToolState` and `useDeviceOnboardingToolProps`. The mobile funnel no longer imports `@devtools/*`, and the desktop device onboarding code moves under DevTools

- [#24271](https://github.com/LedgerHQ/ledger-live/pull/24271) [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the CoinGecko market client and keep the USD chart fallback

- [#24297](https://github.com/LedgerHQ/ledger-live/pull/24297) [`6464950`](https://github.com/LedgerHQ/ledger-live/commit/6464950833e7e27eb44da0171772f3ba5be8c116) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-contacts` exposes `ContactsView` and `ContactsButton` from a single `.` entry with shared `ContactsViewProps` and `ContactsButtonProps` contracts. List logic and platform contact hooks are imported from `@features/flow-contacts-list` and `@features/platform-contacts`. Desktop and mobile hosts mount feature and Ledger Sync introduction UI outside `ContactsView`.

- [#24487](https://github.com/LedgerHQ/ledger-live/pull/24487) [`c0c5bff`](https://github.com/LedgerHQ/ledger-live/commit/c0c5bfffdb1aefa91de627f26ea15b75ca6b5107) Thanks [@amaslakov](https://github.com/amaslakov)! - Enable the Tron votes panel earn rewards and desktop vote now actions, routed like the account Earn action

- [#23539](https://github.com/LedgerHQ/ledger-live/pull/23539) [`310127f`](https://github.com/LedgerHQ/ledger-live/commit/310127f2b7fbc19eba7b2e45bd1d6467e447e84e) Thanks [@ishaba](https://github.com/ishaba)! - Show the energy provider's terms on the Tronify rent signature step, which the user accepts by signing, and align the rent, polling and transfer step copy with the validated wording

- [#23466](https://github.com/LedgerHQ/ledger-live/pull/23466) [`ad006b9`](https://github.com/LedgerHQ/ledger-live/commit/ad006b94782873e9fe8727dcea96e3adb54f8d28) Thanks [@ishaba](https://github.com/ishaba)! - Resolve TRON TRC10 tokens by their CAL token_identifier

- [#24594](https://github.com/LedgerHQ/ledger-live/pull/24594) [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align desktop 1D asset and account variation with the market banner

- [#24406](https://github.com/LedgerHQ/ledger-live/pull/24406) [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show aggregated assets and drop the lwmWallet40 aggregatedAssets param

- [#24295](https://github.com/LedgerHQ/ledger-live/pull/24295) [`3571671`](https://github.com/LedgerHQ/ledger-live/commit/3571671667a23517ced1aa9fec421368cb751ef7) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-pay-contact` exports `PaySuccess` and the address picker from `.`, with `./web` and `./native` platform entries for `Contacts`. `PaySuccess` shares one props contract; suffix imports are removed from the package.

- [#24449](https://github.com/LedgerHQ/ledger-live/pull/24449) [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add `custom.predictions.bindAccount` and `custom.predictions.reportSetup`: Ledger Wallet asks the user to confirm on their device that they own the account picked in Predictions, then shows the trading wallet setup the live app reports. `AnimatedHeight` now counts SVG children, like a loading spinner, so the dialog no longer clips its bottom

- [#24149](https://github.com/LedgerHQ/ledger-live/pull/24149) [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a Predictions card to the portfolio services entry points and a Predictions screen that opens the live app, behind the `ptxPredictionsLiveAppDesktop` and `ptxPredictionsLiveAppMobile` flags

- [#24475](https://github.com/LedgerHQ/ledger-live/pull/24475) [`a2354b8`](https://github.com/LedgerHQ/ledger-live/commit/a2354b8ed84af0a52a09860038e4f8d51533a778) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Show the Device Intent Executor dialog on the Lumen sheet background

- [#24240](https://github.com/LedgerHQ/ledger-live/pull/24240) [`ae675f9`](https://github.com/LedgerHQ/ledger-live/commit/ae675f9479e10b46d1e5f749e35d7640ead4de96) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover the remaining Account Detail integration scenarios on desktop and mobile

- [#23551](https://github.com/LedgerHQ/ledger-live/pull/23551) [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the Predictions onboarding sheet behind the custom.predictions.onboard and custom.predictions.close Wallet API methods

- [#24110](https://github.com/LedgerHQ/ledger-live/pull/24110) [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4) Thanks [@qperrot](https://github.com/qperrot)! - Remove Fantom, whose network migrated to Sonic

- [#24205](https://github.com/LedgerHQ/ledger-live/pull/24205) [`7647d9b`](https://github.com/LedgerHQ/ledger-live/commit/7647d9b092814564ce8947368f852780582c212f) Thanks [@henri-ly](https://github.com/henri-ly)! - Block sends of known non-transferable ERC-20 tokens with a TokenNonTransferable amount error

- [#24371](https://github.com/LedgerHQ/ledger-live/pull/24371) [`32be7d2`](https://github.com/LedgerHQ/ledger-live/commit/32be7d2b61e9c7c5024b2a155822fb88e76c8ca8) Thanks [@ysitbon](https://github.com/ysitbon)! - Lock the universal-components waiver list empty, remove waiver helpers from enforce-package-structure, and record the rollout as complete in the ADR.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

- [#24290](https://github.com/LedgerHQ/ledger-live/pull/24290) [`94df3d0`](https://github.com/LedgerHQ/ledger-live/commit/94df3d0acc235f2aa429ffaea4f21bf327469fe3) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - [LWDM] chore(deps): update dependency oxfmt to v0.75.0

  - Updated `oxfmt` to `0.75.0`

- [#24291](https://github.com/LedgerHQ/ledger-live/pull/24291) [`4fc4674`](https://github.com/LedgerHQ/ledger-live/commit/4fc4674c788390588d2d3733fc5928372d2c8382) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency oxlint to v1.90.0

  - Updated `oxlint` to `1.90.0`

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24400](https://github.com/LedgerHQ/ledger-live/pull/24400) [`836c45b`](https://github.com/LedgerHQ/ledger-live/commit/836c45b3181060458ce399c0a6572b6468c699d1) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - fix(deps): update dependency dotenv to v16.4.7

  - Updated `dotenv` to `16.4.7`

- [#24429](https://github.com/LedgerHQ/ledger-live/pull/24429) [`0a430b8`](https://github.com/LedgerHQ/ledger-live/commit/0a430b829d97b4137e8de60a935efbbc9bb355ba) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency cross-env to v10

  - Updated `cross-env` to `10.1.0`

- [#24545](https://github.com/LedgerHQ/ledger-live/pull/24545) [`dfbc33b`](https://github.com/LedgerHQ/ledger-live/commit/dfbc33bba8ec826c1b5d585fbfd9f0c9135e68c0) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @electron/notarize to v3.1.2

  - Updated `@electron/notarize` to `3.1.2`

- [#24157](https://github.com/LedgerHQ/ledger-live/pull/24157) [`d528ea0`](https://github.com/LedgerHQ/ledger-live/commit/d528ea06fe6571e7c990936f2f22831e754b0178) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Share the account asset picker across desktop and mobile

- [#24050](https://github.com/LedgerHQ/ledger-live/pull/24050) [`6a70efc`](https://github.com/LedgerHQ/ledger-live/commit/6a70efc3eb1e625206286d913d7f5d07b01ee8ad) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Share the device mock server session client and URL helpers in @features/platform-device-mock-server and the legacy transport in live-dmk-shared, and use them in Ledger Wallet Desktop

- [#24196](https://github.com/LedgerHQ/ledger-live/pull/24196) [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Account Detail Analytics introduction in a dedicated layout slot above the custom place, with dismissal persisted across desktop restarts and account entry context.

- [#24568](https://github.com/LedgerHQ/ledger-live/pull/24568) [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98) Thanks [@qperrot](https://github.com/qperrot)! - Remove Stargaze from Ledger Wallet

- [#24431](https://github.com/LedgerHQ/ledger-live/pull/24431) [`41c9607`](https://github.com/LedgerHQ/ledger-live/commit/41c960724990ccc044f959d51b294e66c5fa3f65) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Count staked SUI in the account balance; spend and stake checks use the spendable balance only. Stake operations move the balance by their gas only, and an unstake also by its reward, so the balance history stays consistent.

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

- [#24462](https://github.com/LedgerHQ/ledger-live/pull/24462) [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85) Thanks [@deepyjr](https://github.com/deepyjr)! - Track the Analytics filters, the Analytics banner click and its visibility on the account page.

- [#24561](https://github.com/LedgerHQ/ledger-live/pull/24561) [`6d015f0`](https://github.com/LedgerHQ/ledger-live/commit/6d015f0b776d5488eee4a4b94503e0f32aa22abe) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add the XRP add token flow, trust limit edit and rippling state display on desktop, behind `enabledTokenStandards`

### Patch Changes

- Updated dependencies [[`0d2aead`](https://github.com/LedgerHQ/ledger-live/commit/0d2aeadc33cfde80c7ef0ad83a6424a756b20b0d), [`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b), [`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78), [`03cafaf`](https://github.com/LedgerHQ/ledger-live/commit/03cafaff14567ab3a8ee8495f3da964a7d56683a), [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`0ebe8ea`](https://github.com/LedgerHQ/ledger-live/commit/0ebe8ea274936993a9dff1c36bf7b036d531e1f5), [`cd66cae`](https://github.com/LedgerHQ/ledger-live/commit/cd66caee3d913da639911a3cc29024215bf9a2e6), [`cc73a3f`](https://github.com/LedgerHQ/ledger-live/commit/cc73a3f12a1cb7e367bcddaea42680d0c74a62ed), [`2c728a2`](https://github.com/LedgerHQ/ledger-live/commit/2c728a22e6acce91ec50f07bb676114850389d4a), [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4), [`e6c438d`](https://github.com/LedgerHQ/ledger-live/commit/e6c438d64ad0beb6224bd4c0361241641fe2a37d), [`e7a4d5a`](https://github.com/LedgerHQ/ledger-live/commit/e7a4d5a01ce2aa5636609f70cccc6274d5189b08), [`ba1b7c4`](https://github.com/LedgerHQ/ledger-live/commit/ba1b7c45b4818bed008fcbed07d97b9a3e9aa0b3), [`64c16b8`](https://github.com/LedgerHQ/ledger-live/commit/64c16b8200c14d691b104a99396c00252731be2a), [`cc4eced`](https://github.com/LedgerHQ/ledger-live/commit/cc4eced87a10926e185c430c6e38d9151482266f), [`59280f5`](https://github.com/LedgerHQ/ledger-live/commit/59280f54cb1b4cf679f926dfeac4848103b0ac42), [`c842892`](https://github.com/LedgerHQ/ledger-live/commit/c8428923a5cf0ed556ff7a48a6e373c740cdb6a1), [`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`a95a6bc`](https://github.com/LedgerHQ/ledger-live/commit/a95a6bcb630289fde6782430fb511b9c48c9ffcc), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`93aef61`](https://github.com/LedgerHQ/ledger-live/commit/93aef61f00e4e65de92695a983bfbca21e156ccb), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead), [`fb3956b`](https://github.com/LedgerHQ/ledger-live/commit/fb3956b429b34b35b4b6e3e50b14f6d9bdf2d59b), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`d02425e`](https://github.com/LedgerHQ/ledger-live/commit/d02425e29efe55595b51556e598fde0f9c34574f), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`81f924e`](https://github.com/LedgerHQ/ledger-live/commit/81f924e4acd4d79e898fa0cc8b1acf03a6c01de6), [`3835bab`](https://github.com/LedgerHQ/ledger-live/commit/3835babeb6da9775f5750a2219f480a5422269ab), [`6da9b38`](https://github.com/LedgerHQ/ledger-live/commit/6da9b38e20ae18b9aa3e31d41a155420ace9987b), [`c6d8c4f`](https://github.com/LedgerHQ/ledger-live/commit/c6d8c4f1c50ada25f9c2bb4b5bbd50c117e3fce1), [`b282f26`](https://github.com/LedgerHQ/ledger-live/commit/b282f26a470c5f3519d252eb301b5ddb98fe68e9), [`c533e40`](https://github.com/LedgerHQ/ledger-live/commit/c533e40882433c3e9cdc3dcb462ecda5c34beac4), [`72da4b1`](https://github.com/LedgerHQ/ledger-live/commit/72da4b19bd803dc85ef83d3b09a45445f95186fa), [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab), [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b), [`716dba7`](https://github.com/LedgerHQ/ledger-live/commit/716dba70f24aea647d9b0fcfec75f315afbe9dbc), [`94961d4`](https://github.com/LedgerHQ/ledger-live/commit/94961d48d733bce0b50061f02c00f7942774fa70), [`498cbdd`](https://github.com/LedgerHQ/ledger-live/commit/498cbdd918b0117959e9e0ff9db6adb31191b138), [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d), [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72), [`ed8d437`](https://github.com/LedgerHQ/ledger-live/commit/ed8d437ae166be537aa7bf309691691ee56b8ffc), [`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e), [`085d781`](https://github.com/LedgerHQ/ledger-live/commit/085d781d100c76bcb9b6dc573af1c7f28fc115e1), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`31f7eba`](https://github.com/LedgerHQ/ledger-live/commit/31f7ebace98301cb3e46185a91621aa3ef59bb3b), [`235a1ae`](https://github.com/LedgerHQ/ledger-live/commit/235a1ae2d5de213ab2f59a2aa584ef59e2058372), [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d), [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`6464950`](https://github.com/LedgerHQ/ledger-live/commit/6464950833e7e27eb44da0171772f3ba5be8c116), [`5bc9bb1`](https://github.com/LedgerHQ/ledger-live/commit/5bc9bb199bd54af8046a7889b2b846603d083207), [`0b3f0f2`](https://github.com/LedgerHQ/ledger-live/commit/0b3f0f28584733a0c17634117b7d53ff07fe025b), [`310127f`](https://github.com/LedgerHQ/ledger-live/commit/310127f2b7fbc19eba7b2e45bd1d6467e447e84e), [`ad006b9`](https://github.com/LedgerHQ/ledger-live/commit/ad006b94782873e9fe8727dcea96e3adb54f8d28), [`9621949`](https://github.com/LedgerHQ/ledger-live/commit/9621949145e7e771a3663969f2e6610ac91459bd), [`06c81d3`](https://github.com/LedgerHQ/ledger-live/commit/06c81d33d1c2da765bbd34f4e8e1593f43ce745d), [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25), [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`a6c95e2`](https://github.com/LedgerHQ/ledger-live/commit/a6c95e2ae469bfe6eb3432fc691efea35d70a741), [`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`2cee99e`](https://github.com/LedgerHQ/ledger-live/commit/2cee99e4b728ef315e5df94271c2bd6b695a7ade), [`8777c73`](https://github.com/LedgerHQ/ledger-live/commit/8777c73879acf3e38b8cef00fb88213c55011f96), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`7282cc0`](https://github.com/LedgerHQ/ledger-live/commit/7282cc0d6d7431ecb4d49534d267f5f562652965), [`8dae360`](https://github.com/LedgerHQ/ledger-live/commit/8dae360c044392da40c67e29416d11bbe34afd8b), [`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff), [`3571671`](https://github.com/LedgerHQ/ledger-live/commit/3571671667a23517ced1aa9fec421368cb751ef7), [`1ca6846`](https://github.com/LedgerHQ/ledger-live/commit/1ca6846e46be5ac899daf4b3931439a0ffa7886d), [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24), [`4a22a1d`](https://github.com/LedgerHQ/ledger-live/commit/4a22a1d2114db23d2b2ebfc6d8b41679c5f6fe39), [`7e4dccf`](https://github.com/LedgerHQ/ledger-live/commit/7e4dccffcad306c45ed380758cd6e7624c9c7921), [`e0ac369`](https://github.com/LedgerHQ/ledger-live/commit/e0ac36999d2ff30c0788c40a4a7ed80293d72fe0), [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4), [`7647d9b`](https://github.com/LedgerHQ/ledger-live/commit/7647d9b092814564ce8947368f852780582c212f), [`80b6233`](https://github.com/LedgerHQ/ledger-live/commit/80b62337e7e2b754004ca5f93b9f7d569015e1eb), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`d528ea0`](https://github.com/LedgerHQ/ledger-live/commit/d528ea06fe6571e7c990936f2f22831e754b0178), [`6a70efc`](https://github.com/LedgerHQ/ledger-live/commit/6a70efc3eb1e625206286d913d7f5d07b01ee8ad), [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a), [`d4bccad`](https://github.com/LedgerHQ/ledger-live/commit/d4bccadbcafe6365dd589ada054bd05d307722d2), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`0d2268d`](https://github.com/LedgerHQ/ledger-live/commit/0d2268d099e6ad7adac33bcb1e4456a28712a2ec), [`aec9525`](https://github.com/LedgerHQ/ledger-live/commit/aec9525f565f851007d992a6c807efdf0958eb27), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`73bd4ee`](https://github.com/LedgerHQ/ledger-live/commit/73bd4ee5567f188c79b70a3f2bd2507e81d2ba85), [`5eec368`](https://github.com/LedgerHQ/ledger-live/commit/5eec368a80f6b8ad05ff97b1cbd78851b8391b2b), [`f53d517`](https://github.com/LedgerHQ/ledger-live/commit/f53d517815a694c54cb535ba39ebc1b249a88775), [`9a3e7bf`](https://github.com/LedgerHQ/ledger-live/commit/9a3e7bf4f8d5192f748fc3aa0a2dc9ac889f1513), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/live-common@38.7.0-next.0
  - @features/platform-aggregated-assets@0.7.0-next.0
  - @shared/feature-flags@0.30.0-next.0
  - @ledgerhq/coin-zcash@1.2.0-next.0
  - @domain/entity-account-operation@0.2.0-next.0
  - @domain/api-market-countervalues@0.3.0-next.0
  - @devtools/bindings@0.15.0-next.0
  - @features/platform-account-source-coin-module@0.2.0-next.0
  - @features/flow-account-detail-hero@0.4.0-next.0
  - @features/flow-account-detail-delegations@0.3.0-next.0
  - @features/flow-account-detail-analytics-notice@0.3.0-next.0
  - @features/flow-account-analytics@0.2.0-next.0
  - @features/flow-account-detail@0.4.0-next.0
  - @ledgerhq/types-live@6.131.0-next.0
  - @domain/entity-currency-crypto@0.19.0-next.0
  - @ledgerhq/coin-bitcoin@1.2.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.11.0-next.0
  - @domain/entity-currency-fiat@0.6.0-next.0
  - @domain/entity-aggregated-asset@0.4.0-next.0
  - @domain/api-aggregated-assets@0.7.0-next.0
  - @ledgerhq/asset-detail@0.13.0-next.0
  - @domain/api-account-data@0.5.0-next.0
  - @devtools/shell@0.14.0-next.0
  - @ledgerhq/wallet-btc@1.2.0-next.0
  - @ledgerhq/live-wallet@1.2.0-next.0
  - @ledgerhq/live-dmk-shared@0.39.0-next.0
  - @features/platform-device-onboarding@0.5.0-next.0
  - @ledgerhq/coin-cardano@3.0.0-next.0
  - @shared/env@0.13.0-next.0
  - @features/platform-feature-flags@0.12.0-next.0
  - @shared/live-config-overrides@0.2.0-next.0
  - @ledgerhq/coin-canton@1.7.0-next.0
  - @ledgerhq/coin-casper@3.8.0-next.0
  - @ledgerhq/coin-concordium@1.8.0-next.0
  - @ledgerhq/coin-filecoin@2.7.0-next.0
  - @ledgerhq/coin-stacks@0.36.0-next.0
  - @domain/entity-contact@0.13.0-next.0
  - @features/flow-contacts-detail@0.4.0-next.0
  - @domain/entity-currency@0.5.0-next.0
  - @domain/entity-account-balance@0.3.0-next.0
  - @domain/entity-account-balance-history@0.2.0-next.0
  - @features/platform-device-intent@5.4.0-next.0
  - @features/flow-contacts@0.18.0-next.0
  - @domain/api-currency-token@0.8.0-next.0
  - @features/platform-assets-table@0.3.0-next.0
  - @features/flow-portfolio-services-entry-points@0.3.0-next.0
  - @features/platform-device-mock-server@0.1.0-next.0
  - @shared/ui-info-state@0.7.0-next.0
  - @features/flow-pay-card-assets@0.7.0-next.0
  - @features/flow-pay-card-details@0.11.0-next.0
  - @features/flow-pay-card@0.9.0-next.0
  - @features/flow-pay-contact@0.9.0-next.0
  - @features/flow-predictions@0.2.0-next.0
  - @features/platform-predictions@0.4.0-next.0
  - @shared/ui-animated-height@0.3.0-next.0
  - @domain/entity-predictions@0.3.0-next.0
  - @features/flow-pay-balance@0.10.0-next.0
  - @features/flow-pay-request@0.10.0-next.0
  - @domain/api-card-management@0.9.0-next.0
  - @domain/api-currency-fiat@0.6.0-next.0
  - @domain/api-market-index-altcoin-season@0.5.0-next.0
  - @domain/api-market-index-fear-and-greed@0.5.0-next.0
  - @domain/api-push-devices@0.3.0-next.0
  - @domain/entity-account@0.3.0-next.0
  - @domain/entity-account-alias@0.2.0-next.0
  - @domain/entity-account-data@0.5.0-next.0
  - @domain/entity-account-name@0.4.0-next.0
  - @domain/entity-client-identity@0.5.0-next.0
  - @domain/entity-market-countervalues@0.5.0-next.0
  - @domain/entity-recent-addresses@0.3.0-next.0
  - @domain/entity-starred-account@0.1.0-next.0
  - @domain/entity-wallet-sync@0.2.0-next.0
  - @features/flow-large-screen-upsell@2.4.0-next.0
  - @features/flow-pay-card-auth@0.12.0-next.0
  - @features/flow-pay-card-widget@0.7.0-next.0
  - @features/flow-pay-feature-tour@0.9.0-next.0
  - @features/platform-card@0.9.0-next.0
  - @features/platform-currencies@0.13.0-next.0
  - @features/platform-market-countervalues@0.5.0-next.0
  - @shared/api-services@0.13.0-next.0
  - @shared/app-config@0.3.0-next.0
  - @shared/auth@0.9.0-next.0
  - @ledgerhq/live-dmk-desktop@0.27.0-next.0
  - @ledgerhq/live-send@0.2.0-next.0
  - @ledgerhq/wallet-pnl@0.9.0-next.0
  - @ledgerhq/asset-aggregation@0.19.0-next.0
  - @features/flow-contacts-add-address@0.9.1-next.0
  - @features/platform-contacts@0.12.2-next.0
  - @features/platform-feature-flags-firebase@0.1.4-next.0
  - @ledgerhq/live-signer-evm@0.24.5-next.0
  - @ledgerhq/transaction-observability@0.6.2-next.0
  - @ledgerhq/wallet-analytics@0.5.5-next.0
  - @domain/entity-currency-token@0.5.9-next.0
  - @features/flow-account-detail-notices@0.3.0
  - @features/flow-account-detail-settings@0.3.1-next.0
  - @features/platform-account-analytics@0.2.0
  - @ledgerhq/live-signer-tron@0.2.5-next.0
  - @features/platform-env@0.4.5-next.0
  - @features/flow-analytics-consent@0.2.13-next.0
  - @features/flow-contacts-add-contact@0.10.1-next.0
  - @features/flow-contacts-delete-address@0.4.1-next.0
  - @features/flow-contacts-delete-contact@0.5.1-next.0
  - @features/flow-contacts-edit-address@0.7.1-next.0
  - @features/flow-contacts-edit-contact@0.9.1-next.0
  - @features/flow-contacts-list@0.12.1-next.0
  - @features/platform-intent-verify-address@0.3.2-next.0
  - @features/flow-pay-card-transactions@0.7.2-next.0
  - @features/flow-fear-and-greed@0.5.2-next.0
  - @features/flow-app-availability@0.3.2-next.0
  - @features/platform-content-ab-tests@0.2.4-next.0

## 4.27.0

### Minor Changes

- [#23982](https://github.com/LedgerHQ/ledger-live/pull/23982) [`5be64be`](https://github.com/LedgerHQ/ledger-live/commit/5be64be2b44e1ad7358a2b6db2ab56108ef73fd0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail on LWD shows the account notices (currency migration, deprecation and custom banners, Robinhood disclaimer, Perps) and the family blocks (pending transfer proposals, sub header, balance summary footer, body header) in the custom place. The notices package now maps the remote currency config into notice signals (`toCurrencyStatusSignal`, `toCustomBannerSignal`).

- [#23894](https://github.com/LedgerHQ/ledger-live/pull/23894) [`4be13d5`](https://github.com/LedgerHQ/ledger-live/commit/4be13d5ee940cb84794b33bed7320287647cc82e) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` replaces `authApiExtra` with `createAuthMiddleware`: the auth provider is held by a store middleware instead of the thunk `extraArgument`, and `getAuthProvider(dispatch)` reads it.

- [#24119](https://github.com/LedgerHQ/ledger-live/pull/24119) [`6a2b43c`](https://github.com/LedgerHQ/ledger-live/commit/6a2b43c493ccdb6ecb3f928520fe94d5e93168d1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Move the desktop assets table into @features/platform-assets-table, shared by Portfolio, Crypto addresses and Account Detail

- [#24166](https://github.com/LedgerHQ/ledger-live/pull/24166) [`7cb4286`](https://github.com/LedgerHQ/ledger-live/commit/7cb4286473bb5f755a833f874498ed63e71d502f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the address type of an account (Native segwit, Taproot...) as a tag in the account hero, the Asset Detail addresses and the Crypto Addresses table

- [#24084](https://github.com/LedgerHQ/ledger-live/pull/24084) [`b279fa5`](https://github.com/LedgerHQ/ledger-live/commit/b279fa5852e1781d533489961bb92a5ce56d1ac1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Solana stakes with the shared Lumen delegation component

- [#24083](https://github.com/LedgerHQ/ledger-live/pull/24083) [`00e6b35`](https://github.com/LedgerHQ/ledger-live/commit/00e6b35f033ff81ce92365d56b630d3302b49a9c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Tron votes with the shared Lumen delegation component

- [#24082](https://github.com/LedgerHQ/ledger-live/pull/24082) [`a9aac86`](https://github.com/LedgerHQ/ledger-live/commit/a9aac86b79c371c0b98bd8f16c966dadb81e07d6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared delegation section of Account Detail (Lumen table on LWD, list with a bottom sheet on LWM) and the family slot that lets a family use it

- [#24106](https://github.com/LedgerHQ/ledger-live/pull/24106) [`6a57877`](https://github.com/LedgerHQ/ledger-live/commit/6a5787794620a64fc8a1e92edf1325fbbae92046) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail offers a "+ Add" action in the Assets section for Algorand, Stellar and Hedera (Algorand and Stellar on mobile)

- [#24108](https://github.com/LedgerHQ/ledger-live/pull/24108) [`6c4c4bf`](https://github.com/LedgerHQ/ledger-live/commit/6c4c4bf2e840cfff30c8c913082c64b0a668177e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Solana and Tron balances as Lumen cards with the shared balance summary component

- [#24122](https://github.com/LedgerHQ/ledger-live/pull/24122) [`7cd4567`](https://github.com/LedgerHQ/ledger-live/commit/7cd4567eb848e6fda0e80ea4df177528caa017d7) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail notice banners show their full description instead of cutting it after 5 lines.

- [#24172](https://github.com/LedgerHQ/ledger-live/pull/24172) [`5d8a2c6`](https://github.com/LedgerHQ/ledger-live/commit/5d8a2c6e6054e93e5de7e6afe63f0fe00bf7b55d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail assets are clickable and open the Asset Detail page of the asset

- [#23993](https://github.com/LedgerHQ/ledger-live/pull/23993) [`27dff22`](https://github.com/LedgerHQ/ledger-live/commit/27dff225cdbc54cbfc8ed9c7637de0fd56d04505) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a test id to the coin control strategy select

- [#23994](https://github.com/LedgerHQ/ledger-live/pull/23994) [`01b4e55`](https://github.com/LedgerHQ/ledger-live/commit/01b4e55ec30e549a25f29d76408ebcc1096e9d72) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a test id to the onboarding tutorial Back button

- [#24173](https://github.com/LedgerHQ/ledger-live/pull/24173) [`f0af054`](https://github.com/LedgerHQ/ledger-live/commit/f0af054a383ca1b0c5b7daffd9a2507abc7478a1) Thanks [@ysitbon](https://github.com/ysitbon)! - Plug the account data recorder in from the DevTools screen instead of at boot, so the store and the sources no longer import `@devtools/bindings`

- [#24040](https://github.com/LedgerHQ/ledger-live/pull/24040) [`d185364`](https://github.com/LedgerHQ/ledger-live/commit/d185364617d5f4d2f52d05cc2d137055227dc6d3) Thanks [@ysitbon](https://github.com/ysitbon)! - `AccountSettings` moves to the web platform entry `@features/flow-account-detail-settings/web` and `AccountSettingsSheet` to the native platform entry `@features/flow-account-detail-settings/native`; `AccountSettingsDialog` becomes internal. The universal entry is one unconditioned `src/index.ts` holding the menu, advanced logs and remove contents and `buildAdvancedLogs`, and imports carry no platform suffix.

- [#23953](https://github.com/LedgerHQ/ledger-live/pull/23953) [`cd14395`](https://github.com/LedgerHQ/ledger-live/commit/cd1439596d45fd4f66a4c778c9a678644078bbca) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - add the balance type step to the new send flow on mobile and reuse the shared balance type copy for Aleo

- [#24036](https://github.com/LedgerHQ/ledger-live/pull/24036) [`ebe7149`](https://github.com/LedgerHQ/ledger-live/commit/ebe71498f5f6f54cd455df0038f4d2119524b758) Thanks [@ysitbon](https://github.com/ysitbon)! - List the desktop api services once with `defineApiServices`, which builds their reducers, middlewares and thunk `extraArgument`

- [#24024](https://github.com/LedgerHQ/ledger-live/pull/24024) [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137) Thanks [@qperrot](https://github.com/qperrot)! - Remove Blast and Blast Sepolia, whose chain shut down

- [#23862](https://github.com/LedgerHQ/ledger-live/pull/23862) [`e6d5e3c`](https://github.com/LedgerHQ/ledger-live/commit/e6d5e3c668cabd575edfd44d7dfe47bf7f37e84e) Thanks [@amaslakov](https://github.com/amaslakov)! - List every active Tezos baker instead of a hardcoded whitelist, preselect Ledger by Kiln only when it is listed, and only list bakers that accept staking in the stake flow

- [#24147](https://github.com/LedgerHQ/ledger-live/pull/24147) [`a49773f`](https://github.com/LedgerHQ/ledger-live/commit/a49773f51027c607adac26d1133a36a37ada456c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.8.0 and `@ledgerhq/device-signer-kit-solana` to 1.15.0, and keep the backup and show the out-of-memory screen when the OS update restore ends with an out-of-memory status

- [#23972](https://github.com/LedgerHQ/ledger-live/pull/23972) [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop aggregated assets, drop the lwdWallet40 param, and align desktop e2e

- [#24068](https://github.com/LedgerHQ/ledger-live/pull/24068) [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show desktop asset discoverability without a feature flag

- [#24031](https://github.com/LedgerHQ/ledger-live/pull/24031) [`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactsAddContactContent` of `@features/flow-contacts-add-contact` has one props contract on both platforms: `ContactsAddContactContentProps` gains the native-only `autoFocus`, and `ContactsAddContactContentNativeProps` is gone. The mobile content renders `ContactNameDisclaimer`. `ContactsAddContactDialog` moves to the `./web` entry, and `ContactsAddContactFooter` with `ContactsAddContactFooterProps` to the `./native` entry. The `.` entry has no `react-native` condition.

- [#24029](https://github.com/LedgerHQ/ledger-live/pull/24029) [`4bb6da0`](https://github.com/LedgerHQ/ledger-live/commit/4bb6da0fa786d014149c544d414398786aae9fc6) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-contacts-list` exports `ContactsListView` from `./web` and `./native`, each with its own props, and `ContactsAddContactHeaderButton` from `./native`. The `.` entry has no `react-native` condition and exports the list logic plus the universal `ContactsCompactList`, which now calls `onSelectContact` and takes an optional `testID`. `ContactsCompactRow` and `ContactsSearchNoResults` are no longer exported, and `@features/flow-contacts` stops re-exporting `ContactsAddContactHeaderButton`.

- [#24067](https://github.com/LedgerHQ/ledger-live/pull/24067) [`df941ac`](https://github.com/LedgerHQ/ledger-live/commit/df941acce2848e62f2a44f8d27cddf0ff28abe2b) Thanks [@dilaouid](https://github.com/dilaouid)! - testnet accounts have no countervalue, so the amount step only offers the crypto input (no fiat toggle or fiat equivalent) and amounts are always validated

- [#24100](https://github.com/LedgerHQ/ledger-live/pull/24100) [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show the desktop asset section and drop the lwdWallet40 assetSection param

- [#24169](https://github.com/LedgerHQ/ledger-live/pull/24169) [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account balance histories slice, add a Balance history page to the DevTools Accounts section and serve the balanceHistory kind for mock accounts

- [#24071](https://github.com/LedgerHQ/ledger-live/pull/24071) [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account operations slice and add an Operations page to the DevTools Accounts section

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

- [#23587](https://github.com/LedgerHQ/ledger-live/pull/23587) [`afbe91f`](https://github.com/LedgerHQ/ledger-live/commit/afbe91fc14b69bc52b86bd2984e5e2d80e80a6db) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Open the DevTools panel in its own window from a top-bar button in developer mode

- [#24113](https://github.com/LedgerHQ/ledger-live/pull/24113) [`198fa76`](https://github.com/LedgerHQ/ledger-live/commit/198fa76df6b3048033c21a723be51eebda95bd88) Thanks [@dilaouid](https://github.com/dilaouid)! - Add the coin module account data source, reading the balance of an account from its coin module, ranked before the full sync source

- [#24007](https://github.com/LedgerHQ/ledger-live/pull/24007) [`bda0e29`](https://github.com/LedgerHQ/ledger-live/commit/bda0e297ae889fd821721a8dcf0147d320373571) Thanks [@Justkant](https://github.com/Justkant)! - Log manifest domain check violations, rejected `goToURL` fallbacks and rejected `loadURL` calls to the exported logs, once per distinct violation. Add `resolveInitialURL`, which returns the initial URL along with the `goToURL` it rejected

- [#23351](https://github.com/LedgerHQ/ledger-live/pull/23351) [`80325b3`](https://github.com/LedgerHQ/ledger-live/commit/80325b3fe630a0405a8618dfe498ae480f3224e3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - feat(perps): add the custom.perps.migrateAccount wallet API method, which hands a legacy Perps user the Hyperliquid account at their legacy address, adding it through the standard add account flow when the wallet has none

- [#24013](https://github.com/LedgerHQ/ledger-live/pull/24013) [`8aad423`](https://github.com/LedgerHQ/ledger-live/commit/8aad4236ec8f65d1d5026d54ae761ba51efe863c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the ledgerlive://predictions deep link, which opens the Predictions live app with the link's query params. On mobile, https universal links (ledger.go.link) now go through the same deep link handling as ledgerlive:// links

- [#24179](https://github.com/LedgerHQ/ledger-live/pull/24179) [`52755c2`](https://github.com/LedgerHQ/ledger-live/commit/52755c2351e960dcc200da3885817ca0e6e9c8a2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated styles for Aleo new send flow

- [#23772](https://github.com/LedgerHQ/ledger-live/pull/23772) [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(devtools): add the account-portfolio devtool to call the Portfolio service, with a balance history chart and paged history

- [#23806](https://github.com/LedgerHQ/ledger-live/pull/23806) [`b947ef4`](https://github.com/LedgerHQ/ledger-live/commit/b947ef485dc1351050f14610ba9bf7054717252a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin modules dependencies (coin-module-framework 11, coin-evm, coin-hypercore, coin-stellar, coin-tezos, coin-xrp)

- [#22966](https://github.com/LedgerHQ/ledger-live/pull/22966) [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf) Thanks [@qperrot](https://github.com/qperrot)! - Remove deprecated Moonbeam and Moonriver blockchains and the `currencyMoonriver` feature flag

- [#23768](https://github.com/LedgerHQ/ledger-live/pull/23768) [`c5443a4`](https://github.com/LedgerHQ/ledger-live/commit/c5443a4862e77f1033922b517468a1bf81412add) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Move the Send flow's animated dialog height into @shared/ui-animated-height so other dialogs can reuse it

- [#24258](https://github.com/LedgerHQ/ledger-live/pull/24258) [`16ef2fa`](https://github.com/LedgerHQ/ledger-live/commit/16ef2fab932ca52098c9029467faf627076de0c8) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): keep transactions within the 4 instructions the Nano S app parses, by leaving out the compute-unit limit when it and the price don't both fit (a stake creation with its delegation, a token transfer creating the recipient account with a memo), instead of requiring blind signing

- [#23736](https://github.com/LedgerHQ/ledger-live/pull/23736) [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-solana): read endpoints and tuning values from the coin config

  `rpcUrls` is now a required field of `SolanaCoinConfig` and `endpointByCurrencyId` resolves the
  endpoint of a currency from `rpcUrls[<currencyId>]` alone: the `API_SOLANA_PROXY` env and the
  web3.js `clusterApiUrl` fallbacks are removed, and a missing entry throws. live-common registers
  `config_currency_solana_devnet` and `config_currency_solana_testnet` next to
  `config_currency_solana`, each carrying its own endpoint, and the legacy coin config resolves the
  configuration of the requested currency instead of always reading the mainnet one.

  The legacy validators list is read from `validatorsUrl` of the requested currency, the field the
  Alpaca `getValidators` already reads: `config_currency_solana` defaults to the production Earn API
  list (`/v0/network/solana/validator-details`) and `config_currency_solana_testnet` to the
  `validators-solana` testnet list. `solana_devnet` still derives its validators from the RPC vote
  accounts. A missing `validatorsUrl` on mainnet or testnet throws.

  The validator APY is read from `staking.validatorsSummaryUrl` (default in `config_currency_solana`:
  the production Figment summary on the Earn API) in both the legacy and the Alpaca paths, at call
  time instead of once at module load. A currency without it lists its validators without APY, so
  `solana_testnet` no longer fetches the mainnet APY through the Alpaca API.

  The tuning values are read from the coin config at call time, each falling back to one exported
  module default in `constants`: `broadcast.timeoutMs` (`DEFAULT_BROADCAST_TIMEOUT_MS`, 100000),
  `node.retries` / `node.retryDelayMs` (`DEFAULT_NODE_RETRIES` 3, `DEFAULT_NODE_RETRY_DELAY_MS` 500),
  `node.maxTxQuery` / `node.batchSize` (100 / 100), `fees.computeUnitMargin` (0.1),
  `fees.defaultTxFee` (5000, also replacing the `?? 5000` copies in `craftTransaction`),
  `fees.blockhashRetries` / `fees.blockhashRetryDelayMs` (5 / 5000), `staking.ledgerValidators`
  (`DEFAULT_LEDGER_VALIDATORS`) and `validators.cacheTtlMs` (`DEFAULT_VALIDATORS_CACHE_TTL_MS`,
  900000). The ky HTTP retry on status codes stays a constant.

  The module keeps no configuration state: `config.ts` holds types only and every reader resolves
  `config_currency_<id>` through a `SolanaContext` at call time. live-common builds it with
  `buildContext` for the message signer and the validators hook.

  Breaking: the `API_SOLANA_PROXY`, `SOLANA_VALIDATORS_APP_BASE_URL`,
  `SOLANA_TESTNET_VALIDATORS_APP_BASE_URL`, `SOLANA_VALIDATORS_SUMMARY_BASE_URL` and
  `SOLANA_TX_CONFIRMATION_TIMEOUT` env definitions are removed; override `rpcUrls.<id>`, `validatorsUrl` and `staking.validatorsSummaryUrl` in
  `config_currency_<id>` instead. The legacy `getValidators` of `network/validator-app` now takes
  `(validatorsUrl, validatorsSummaryUrl?)` instead of a cluster, and the Alpaca `getValidators` takes
  the summary URL as its second argument. `craftTransaction`, `estimateFees`, `estimateTxFee`,
  `unstakeReserve`, `computeUnstakeReserve`, `getBalance` and `listOperations` take the
  `SolanaCoinConfig` as their second argument, `buildVersionedTransaction` as its fourth, and the
  `network/chain/web3` instruction builders take the resolved `computeUnitMargin`.
  `getChainAPI` accepts `confirmationTimeoutMs`, `retries` and `retryDelayMs`; build its config with
  `chainConfigFrom(config, currencyId)`. `LEDGER_VALIDATOR_DEFAULT`, `LEDGER_VALIDATOR_LIST` and
  `LEDGER_VALIDATORS_VOTE_ACCOUNTS` are removed: use `ledgerValidatorsOf(config)` /
  `defaultLedgerValidatorOf(config)`; `LEDGER_VALIDATOR_BY_FIGMENT` / `_BY_BITWISE` moved to
  `constants`. `ledgerFirstValidators` takes the Ledger list as its second argument. The `coinConfig` default export of `config` (`setCoinConfig` / `getCoinConfig`) is removed:
  `getSolanaValidators(context, currencyId)` and `fetchValidators(config, currencyId)` take the
  config explicitly, and `signMessage(signerContext, contextOf)` resolves the account's currency
  context when signing.

- [#24022](https://github.com/LedgerHQ/ledger-live/pull/24022) [`8b9464a`](https://github.com/LedgerHQ/ledger-live/commit/8b9464a1f6d4e873e6ecbaf606d48040bcb86612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a ledgerlive://contacts deeplink that opens Contacts when lwdContacts is enabled

- [#24080](https://github.com/LedgerHQ/ledger-live/pull/24080) [`08aafc3`](https://github.com/LedgerHQ/ledger-live/commit/08aafc35e7abe1948b34f149d946d1114d6a39a7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade rspack to 2.3.0, rsbuild to 2.3.0 and rslib to 1.0.5

### Patch Changes

- Updated dependencies [[`5be64be`](https://github.com/LedgerHQ/ledger-live/commit/5be64be2b44e1ad7358a2b6db2ab56108ef73fd0), [`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64), [`4be13d5`](https://github.com/LedgerHQ/ledger-live/commit/4be13d5ee940cb84794b33bed7320287647cc82e), [`edb6f42`](https://github.com/LedgerHQ/ledger-live/commit/edb6f42309bda273de7d1c058698c4b0f8c1df86), [`6a2b43c`](https://github.com/LedgerHQ/ledger-live/commit/6a2b43c493ccdb6ecb3f928520fe94d5e93168d1), [`c1c388f`](https://github.com/LedgerHQ/ledger-live/commit/c1c388f850e9d045f87acb13b9af8fc71e546b45), [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`a9aac86`](https://github.com/LedgerHQ/ledger-live/commit/a9aac86b79c371c0b98bd8f16c966dadb81e07d6), [`08324bd`](https://github.com/LedgerHQ/ledger-live/commit/08324bd138b45b83dc0b763cddc284411a4e9577), [`3775d3f`](https://github.com/LedgerHQ/ledger-live/commit/3775d3fc1b6eba54ddaccc41f6cd9d935a818782), [`d185364`](https://github.com/LedgerHQ/ledger-live/commit/d185364617d5f4d2f52d05cc2d137055227dc6d3), [`cd14395`](https://github.com/LedgerHQ/ledger-live/commit/cd1439596d45fd4f66a4c778c9a678644078bbca), [`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9), [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`e6d5e3c`](https://github.com/LedgerHQ/ledger-live/commit/e6d5e3c668cabd575edfd44d7dfe47bf7f37e84e), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`a49773f`](https://github.com/LedgerHQ/ledger-live/commit/a49773f51027c607adac26d1133a36a37ada456c), [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c), [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11), [`9c2d544`](https://github.com/LedgerHQ/ledger-live/commit/9c2d544e7dbf8bd06d6abff29361f2ccdb7c61e1), [`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca), [`0c9ce30`](https://github.com/LedgerHQ/ledger-live/commit/0c9ce30960837b6cf52f5df9be2999a5c7377abf), [`55dc039`](https://github.com/LedgerHQ/ledger-live/commit/55dc0396b8bea844c6b745dc54f8b5b7a01c0ecd), [`d7778b9`](https://github.com/LedgerHQ/ledger-live/commit/d7778b9a6fcaae428e8a4e30e0bcdab13e6b2c1d), [`1dee328`](https://github.com/LedgerHQ/ledger-live/commit/1dee328bd842dce945aff197ecf14d665b453bfd), [`4bb6da0`](https://github.com/LedgerHQ/ledger-live/commit/4bb6da0fa786d014149c544d414398786aae9fc6), [`df941ac`](https://github.com/LedgerHQ/ledger-live/commit/df941acce2848e62f2a44f8d27cddf0ff28abe2b), [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d), [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51), [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb), [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`fdb0bdc`](https://github.com/LedgerHQ/ledger-live/commit/fdb0bdc25a803ba7907959d4f390e70b229423e2), [`198fa76`](https://github.com/LedgerHQ/ledger-live/commit/198fa76df6b3048033c21a723be51eebda95bd88), [`2b8aa58`](https://github.com/LedgerHQ/ledger-live/commit/2b8aa5862ed01665cefc11b62ce80d314c5771ba), [`bda0e29`](https://github.com/LedgerHQ/ledger-live/commit/bda0e297ae889fd821721a8dcf0147d320373571), [`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13), [`80325b3`](https://github.com/LedgerHQ/ledger-live/commit/80325b3fe630a0405a8618dfe498ae480f3224e3), [`8aad423`](https://github.com/LedgerHQ/ledger-live/commit/8aad4236ec8f65d1d5026d54ae761ba51efe863c), [`4397830`](https://github.com/LedgerHQ/ledger-live/commit/43978303a19c12b516cf9caf30eee84c49e8b478), [`e275739`](https://github.com/LedgerHQ/ledger-live/commit/e27573929d3e688afbb6544c58274e025867e6e4), [`33fc619`](https://github.com/LedgerHQ/ledger-live/commit/33fc61994dcf0265a4f98e77a2f6947f455ae6de), [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9), [`b947ef4`](https://github.com/LedgerHQ/ledger-live/commit/b947ef485dc1351050f14610ba9bf7054717252a), [`54c706e`](https://github.com/LedgerHQ/ledger-live/commit/54c706ecb75b930267d7ba83a6e13ce7a99cbab7), [`e6382fe`](https://github.com/LedgerHQ/ledger-live/commit/e6382fec7ac8b74c432990ecfe9a49224267bb77), [`604337a`](https://github.com/LedgerHQ/ledger-live/commit/604337ae838d77457b41bf42ad075a3016edf80d), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c5443a4`](https://github.com/LedgerHQ/ledger-live/commit/c5443a4862e77f1033922b517468a1bf81412add), [`496a4ef`](https://github.com/LedgerHQ/ledger-live/commit/496a4ef8f04d08b4df63f5b8632a6b4e73a184cb), [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea), [`dbe42b3`](https://github.com/LedgerHQ/ledger-live/commit/dbe42b3c907c59d822419c8444ce1074d1863407), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @features/flow-account-detail-notices@0.3.0
  - @domain/entity-account-operation@0.1.0
  - @shared/auth@0.8.0
  - @ledgerhq/live-common@38.6.0
  - @features/platform-assets-table@0.2.0
  - @features/flow-account-detail-hero@0.3.0
  - @domain/entity-account-data@0.4.0
  - @domain/api-account-data@0.4.0
  - @domain/entity-account-balance-history@0.1.0
  - @devtools/bindings@0.14.0
  - @features/flow-account-detail-delegations@0.2.0
  - @features/flow-account-detail@0.3.0
  - @features/flow-account-detail-settings@0.3.0
  - @shared/api-services@0.12.0
  - @domain/entity-currency-crypto@0.18.0
  - @features/platform-currencies@0.12.0
  - @shared/feature-flags@0.29.0
  - @ledgerhq/types-live@6.130.0
  - @ledgerhq/ledger-wallet-framework@3.10.0
  - @ledgerhq/live-dmk-shared@0.38.0
  - @features/platform-feature-flags@0.11.0
  - @features/flow-contacts-add-address@0.9.0
  - @features/flow-contacts-add-contact@0.10.0
  - @features/flow-pay-contact@0.8.0
  - @features/flow-contacts-delete-address@0.4.0
  - @features/flow-contacts-delete-contact@0.5.0
  - @features/flow-contacts-edit-address@0.7.0
  - @features/flow-contacts-edit-contact@0.9.0
  - @features/flow-contacts-list@0.12.0
  - @features/flow-contacts@0.17.0
  - @features/flow-portfolio-services-entry-points@0.2.0
  - @devtools/shell@0.13.0
  - @domain/entity-account@0.2.0
  - @features/platform-account-source-coin-module@0.1.0
  - @features/flow-pay-card-assets@0.6.0
  - @features/flow-pay-card-details@0.10.0
  - @features/flow-pay-card@0.8.0
  - @features/platform-predictions@0.3.0
  - @features/platform-device-onboarding@0.4.0
  - @features/platform-aggregated-assets@0.6.0
  - @shared/ui-animated-height@0.2.0
  - @shared/env@0.12.0
  - @ledgerhq/asset-detail@0.12.3
  - @ledgerhq/live-dmk-desktop@0.26.1
  - @ledgerhq/live-send@0.1.6
  - @domain/entity-account-balance@0.2.2
  - @domain/api-aggregated-assets@0.6.3
  - @domain/api-card-management@0.8.4
  - @domain/api-currency-fiat@0.5.1
  - @domain/api-currency-token@0.7.1
  - @domain/api-market-countervalues@0.2.3
  - @domain/api-market-index-altcoin-season@0.4.4
  - @domain/api-market-index-fear-and-greed@0.4.4
  - @domain/api-push-devices@0.2.11
  - @features/platform-card@0.8.3
  - @domain/entity-contact@0.12.3
  - @domain/entity-currency@0.4.9
  - @domain/entity-currency-token@0.5.8
  - @domain/entity-market-countervalues@0.4.2
  - @features/flow-contacts-detail@0.3.1
  - @features/platform-account-analytics@0.2.0
  - @features/platform-contacts@0.12.1
  - @features/platform-market-countervalues@0.4.1
  - @ledgerhq/asset-aggregation@0.18.3
  - @ledgerhq/coin-bitcoin@1.1.1
  - @ledgerhq/coin-cardano@2.1.1
  - @ledgerhq/live-wallet@1.1.9
  - @ledgerhq/wallet-analytics@0.5.4
  - @ledgerhq/wallet-pnl@0.8.3
  - @features/flow-large-screen-upsell@2.3.1
  - @features/flow-pay-feature-tour@0.8.3
  - @features/platform-feature-flags-firebase@0.1.3
  - @ledgerhq/coin-canton@1.6.1
  - @ledgerhq/coin-casper@3.7.1
  - @ledgerhq/coin-concordium@1.7.1
  - @ledgerhq/coin-filecoin@2.6.1
  - @ledgerhq/coin-stacks@0.35.1
  - @ledgerhq/coin-zcash@1.1.1
  - @ledgerhq/live-signer-evm@0.24.4
  - @ledgerhq/transaction-observability@0.6.1
  - @ledgerhq/live-signer-tron@0.2.4
  - @features/flow-analytics-consent@0.2.12
  - @domain/entity-account-alias@0.1.3
  - @domain/entity-account-name@0.3.1
  - @domain/entity-starred-account@0.0.4
  - @features/platform-env@0.4.4
  - @features/flow-pay-card-auth@0.11.1
  - @features/flow-pay-card-transactions@0.7.1
  - @features/flow-pay-card-widget@0.6.2
  - @features/flow-fear-and-greed@0.5.1
  - @features/flow-app-availability@0.3.1
  - @ledgerhq/wallet-btc@1.1.0
  - @features/platform-content-ab-tests@0.2.3

## 4.27.0-next.1

### Minor Changes

- [#24258](https://github.com/LedgerHQ/ledger-live/pull/24258) [`16ef2fa`](https://github.com/LedgerHQ/ledger-live/commit/16ef2fab932ca52098c9029467faf627076de0c8) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): keep transactions within the 4 instructions the Nano S app parses, by leaving out the compute-unit limit when it and the price don't both fit (a stake creation with its delegation, a token transfer creating the recipient account with a memo), instead of requiring blind signing

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@38.6.0-next.1
  - @ledgerhq/asset-detail@0.12.3-next.1
  - @ledgerhq/live-dmk-desktop@0.26.1-next.1
  - @ledgerhq/live-send@0.1.6-next.1

## 4.27.0-next.0

### Minor Changes

- [#23982](https://github.com/LedgerHQ/ledger-live/pull/23982) [`5be64be`](https://github.com/LedgerHQ/ledger-live/commit/5be64be2b44e1ad7358a2b6db2ab56108ef73fd0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail on LWD shows the account notices (currency migration, deprecation and custom banners, Robinhood disclaimer, Perps) and the family blocks (pending transfer proposals, sub header, balance summary footer, body header) in the custom place. The notices package now maps the remote currency config into notice signals (`toCurrencyStatusSignal`, `toCustomBannerSignal`).

- [#23894](https://github.com/LedgerHQ/ledger-live/pull/23894) [`4be13d5`](https://github.com/LedgerHQ/ledger-live/commit/4be13d5ee940cb84794b33bed7320287647cc82e) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` replaces `authApiExtra` with `createAuthMiddleware`: the auth provider is held by a store middleware instead of the thunk `extraArgument`, and `getAuthProvider(dispatch)` reads it.

- [#24119](https://github.com/LedgerHQ/ledger-live/pull/24119) [`6a2b43c`](https://github.com/LedgerHQ/ledger-live/commit/6a2b43c493ccdb6ecb3f928520fe94d5e93168d1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Move the desktop assets table into @features/platform-assets-table, shared by Portfolio, Crypto addresses and Account Detail

- [#24166](https://github.com/LedgerHQ/ledger-live/pull/24166) [`7cb4286`](https://github.com/LedgerHQ/ledger-live/commit/7cb4286473bb5f755a833f874498ed63e71d502f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the address type of an account (Native segwit, Taproot...) as a tag in the account hero, the Asset Detail addresses and the Crypto Addresses table

- [#24084](https://github.com/LedgerHQ/ledger-live/pull/24084) [`b279fa5`](https://github.com/LedgerHQ/ledger-live/commit/b279fa5852e1781d533489961bb92a5ce56d1ac1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Solana stakes with the shared Lumen delegation component

- [#24083](https://github.com/LedgerHQ/ledger-live/pull/24083) [`00e6b35`](https://github.com/LedgerHQ/ledger-live/commit/00e6b35f033ff81ce92365d56b630d3302b49a9c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Tron votes with the shared Lumen delegation component

- [#24082](https://github.com/LedgerHQ/ledger-live/pull/24082) [`a9aac86`](https://github.com/LedgerHQ/ledger-live/commit/a9aac86b79c371c0b98bd8f16c966dadb81e07d6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared delegation section of Account Detail (Lumen table on LWD, list with a bottom sheet on LWM) and the family slot that lets a family use it

- [#24106](https://github.com/LedgerHQ/ledger-live/pull/24106) [`6a57877`](https://github.com/LedgerHQ/ledger-live/commit/6a5787794620a64fc8a1e92edf1325fbbae92046) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail offers a "+ Add" action in the Assets section for Algorand, Stellar and Hedera (Algorand and Stellar on mobile)

- [#24108](https://github.com/LedgerHQ/ledger-live/pull/24108) [`6c4c4bf`](https://github.com/LedgerHQ/ledger-live/commit/6c4c4bf2e840cfff30c8c913082c64b0a668177e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the Solana and Tron balances as Lumen cards with the shared balance summary component

- [#24122](https://github.com/LedgerHQ/ledger-live/pull/24122) [`7cd4567`](https://github.com/LedgerHQ/ledger-live/commit/7cd4567eb848e6fda0e80ea4df177528caa017d7) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail notice banners show their full description instead of cutting it after 5 lines.

- [#24172](https://github.com/LedgerHQ/ledger-live/pull/24172) [`5d8a2c6`](https://github.com/LedgerHQ/ledger-live/commit/5d8a2c6e6054e93e5de7e6afe63f0fe00bf7b55d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail assets are clickable and open the Asset Detail page of the asset

- [#23993](https://github.com/LedgerHQ/ledger-live/pull/23993) [`27dff22`](https://github.com/LedgerHQ/ledger-live/commit/27dff225cdbc54cbfc8ed9c7637de0fd56d04505) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a test id to the coin control strategy select

- [#23994](https://github.com/LedgerHQ/ledger-live/pull/23994) [`01b4e55`](https://github.com/LedgerHQ/ledger-live/commit/01b4e55ec30e549a25f29d76408ebcc1096e9d72) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a test id to the onboarding tutorial Back button

- [#24173](https://github.com/LedgerHQ/ledger-live/pull/24173) [`f0af054`](https://github.com/LedgerHQ/ledger-live/commit/f0af054a383ca1b0c5b7daffd9a2507abc7478a1) Thanks [@ysitbon](https://github.com/ysitbon)! - Plug the account data recorder in from the DevTools screen instead of at boot, so the store and the sources no longer import `@devtools/bindings`

- [#24040](https://github.com/LedgerHQ/ledger-live/pull/24040) [`d185364`](https://github.com/LedgerHQ/ledger-live/commit/d185364617d5f4d2f52d05cc2d137055227dc6d3) Thanks [@ysitbon](https://github.com/ysitbon)! - `AccountSettings` moves to the web platform entry `@features/flow-account-detail-settings/web` and `AccountSettingsSheet` to the native platform entry `@features/flow-account-detail-settings/native`; `AccountSettingsDialog` becomes internal. The universal entry is one unconditioned `src/index.ts` holding the menu, advanced logs and remove contents and `buildAdvancedLogs`, and imports carry no platform suffix.

- [#23953](https://github.com/LedgerHQ/ledger-live/pull/23953) [`cd14395`](https://github.com/LedgerHQ/ledger-live/commit/cd1439596d45fd4f66a4c778c9a678644078bbca) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - add the balance type step to the new send flow on mobile and reuse the shared balance type copy for Aleo

- [#24036](https://github.com/LedgerHQ/ledger-live/pull/24036) [`ebe7149`](https://github.com/LedgerHQ/ledger-live/commit/ebe71498f5f6f54cd455df0038f4d2119524b758) Thanks [@ysitbon](https://github.com/ysitbon)! - List the desktop api services once with `defineApiServices`, which builds their reducers, middlewares and thunk `extraArgument`

- [#24024](https://github.com/LedgerHQ/ledger-live/pull/24024) [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137) Thanks [@qperrot](https://github.com/qperrot)! - Remove Blast and Blast Sepolia, whose chain shut down

- [#23862](https://github.com/LedgerHQ/ledger-live/pull/23862) [`e6d5e3c`](https://github.com/LedgerHQ/ledger-live/commit/e6d5e3c668cabd575edfd44d7dfe47bf7f37e84e) Thanks [@amaslakov](https://github.com/amaslakov)! - List every active Tezos baker instead of a hardcoded whitelist, preselect Ledger by Kiln only when it is listed, and only list bakers that accept staking in the stake flow

- [#24147](https://github.com/LedgerHQ/ledger-live/pull/24147) [`a49773f`](https://github.com/LedgerHQ/ledger-live/commit/a49773f51027c607adac26d1133a36a37ada456c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.8.0 and `@ledgerhq/device-signer-kit-solana` to 1.15.0, and keep the backup and show the out-of-memory screen when the OS update restore ends with an out-of-memory status

- [#23972](https://github.com/LedgerHQ/ledger-live/pull/23972) [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop aggregated assets, drop the lwdWallet40 param, and align desktop e2e

- [#24068](https://github.com/LedgerHQ/ledger-live/pull/24068) [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show desktop asset discoverability without a feature flag

- [#24031](https://github.com/LedgerHQ/ledger-live/pull/24031) [`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactsAddContactContent` of `@features/flow-contacts-add-contact` has one props contract on both platforms: `ContactsAddContactContentProps` gains the native-only `autoFocus`, and `ContactsAddContactContentNativeProps` is gone. The mobile content renders `ContactNameDisclaimer`. `ContactsAddContactDialog` moves to the `./web` entry, and `ContactsAddContactFooter` with `ContactsAddContactFooterProps` to the `./native` entry. The `.` entry has no `react-native` condition.

- [#24029](https://github.com/LedgerHQ/ledger-live/pull/24029) [`4bb6da0`](https://github.com/LedgerHQ/ledger-live/commit/4bb6da0fa786d014149c544d414398786aae9fc6) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-contacts-list` exports `ContactsListView` from `./web` and `./native`, each with its own props, and `ContactsAddContactHeaderButton` from `./native`. The `.` entry has no `react-native` condition and exports the list logic plus the universal `ContactsCompactList`, which now calls `onSelectContact` and takes an optional `testID`. `ContactsCompactRow` and `ContactsSearchNoResults` are no longer exported, and `@features/flow-contacts` stops re-exporting `ContactsAddContactHeaderButton`.

- [#24067](https://github.com/LedgerHQ/ledger-live/pull/24067) [`df941ac`](https://github.com/LedgerHQ/ledger-live/commit/df941acce2848e62f2a44f8d27cddf0ff28abe2b) Thanks [@dilaouid](https://github.com/dilaouid)! - testnet accounts have no countervalue, so the amount step only offers the crypto input (no fiat toggle or fiat equivalent) and amounts are always validated

- [#24100](https://github.com/LedgerHQ/ledger-live/pull/24100) [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show the desktop asset section and drop the lwdWallet40 assetSection param

- [#24169](https://github.com/LedgerHQ/ledger-live/pull/24169) [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account balance histories slice, add a Balance history page to the DevTools Accounts section and serve the balanceHistory kind for mock accounts

- [#24071](https://github.com/LedgerHQ/ledger-live/pull/24071) [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account operations slice and add an Operations page to the DevTools Accounts section

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

- [#23587](https://github.com/LedgerHQ/ledger-live/pull/23587) [`afbe91f`](https://github.com/LedgerHQ/ledger-live/commit/afbe91fc14b69bc52b86bd2984e5e2d80e80a6db) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Open the DevTools panel in its own window from a top-bar button in developer mode

- [#24113](https://github.com/LedgerHQ/ledger-live/pull/24113) [`198fa76`](https://github.com/LedgerHQ/ledger-live/commit/198fa76df6b3048033c21a723be51eebda95bd88) Thanks [@dilaouid](https://github.com/dilaouid)! - Add the coin module account data source, reading the balance of an account from its coin module, ranked before the full sync source

- [#24007](https://github.com/LedgerHQ/ledger-live/pull/24007) [`bda0e29`](https://github.com/LedgerHQ/ledger-live/commit/bda0e297ae889fd821721a8dcf0147d320373571) Thanks [@Justkant](https://github.com/Justkant)! - Log manifest domain check violations, rejected `goToURL` fallbacks and rejected `loadURL` calls to the exported logs, once per distinct violation. Add `resolveInitialURL`, which returns the initial URL along with the `goToURL` it rejected

- [#23351](https://github.com/LedgerHQ/ledger-live/pull/23351) [`80325b3`](https://github.com/LedgerHQ/ledger-live/commit/80325b3fe630a0405a8618dfe498ae480f3224e3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - feat(perps): add the custom.perps.migrateAccount wallet API method, which hands a legacy Perps user the Hyperliquid account at their legacy address, adding it through the standard add account flow when the wallet has none

- [#24013](https://github.com/LedgerHQ/ledger-live/pull/24013) [`8aad423`](https://github.com/LedgerHQ/ledger-live/commit/8aad4236ec8f65d1d5026d54ae761ba51efe863c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add the ledgerlive://predictions deep link, which opens the Predictions live app with the link's query params. On mobile, https universal links (ledger.go.link) now go through the same deep link handling as ledgerlive:// links

- [#24179](https://github.com/LedgerHQ/ledger-live/pull/24179) [`52755c2`](https://github.com/LedgerHQ/ledger-live/commit/52755c2351e960dcc200da3885817ca0e6e9c8a2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated styles for Aleo new send flow

- [#23772](https://github.com/LedgerHQ/ledger-live/pull/23772) [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(devtools): add the account-portfolio devtool to call the Portfolio service, with a balance history chart and paged history

- [#23806](https://github.com/LedgerHQ/ledger-live/pull/23806) [`b947ef4`](https://github.com/LedgerHQ/ledger-live/commit/b947ef485dc1351050f14610ba9bf7054717252a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin modules dependencies (coin-module-framework 11, coin-evm, coin-hypercore, coin-stellar, coin-tezos, coin-xrp)

- [#22966](https://github.com/LedgerHQ/ledger-live/pull/22966) [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf) Thanks [@qperrot](https://github.com/qperrot)! - Remove deprecated Moonbeam and Moonriver blockchains and the `currencyMoonriver` feature flag

- [#23768](https://github.com/LedgerHQ/ledger-live/pull/23768) [`c5443a4`](https://github.com/LedgerHQ/ledger-live/commit/c5443a4862e77f1033922b517468a1bf81412add) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Move the Send flow's animated dialog height into @shared/ui-animated-height so other dialogs can reuse it

- [#23736](https://github.com/LedgerHQ/ledger-live/pull/23736) [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-solana): read endpoints and tuning values from the coin config

  `rpcUrls` is now a required field of `SolanaCoinConfig` and `endpointByCurrencyId` resolves the
  endpoint of a currency from `rpcUrls[<currencyId>]` alone: the `API_SOLANA_PROXY` env and the
  web3.js `clusterApiUrl` fallbacks are removed, and a missing entry throws. live-common registers
  `config_currency_solana_devnet` and `config_currency_solana_testnet` next to
  `config_currency_solana`, each carrying its own endpoint, and the legacy coin config resolves the
  configuration of the requested currency instead of always reading the mainnet one.

  The legacy validators list is read from `validatorsUrl` of the requested currency, the field the
  Alpaca `getValidators` already reads: `config_currency_solana` defaults to the production Earn API
  list (`/v0/network/solana/validator-details`) and `config_currency_solana_testnet` to the
  `validators-solana` testnet list. `solana_devnet` still derives its validators from the RPC vote
  accounts. A missing `validatorsUrl` on mainnet or testnet throws.

  The validator APY is read from `staking.validatorsSummaryUrl` (default in `config_currency_solana`:
  the production Figment summary on the Earn API) in both the legacy and the Alpaca paths, at call
  time instead of once at module load. A currency without it lists its validators without APY, so
  `solana_testnet` no longer fetches the mainnet APY through the Alpaca API.

  The tuning values are read from the coin config at call time, each falling back to one exported
  module default in `constants`: `broadcast.timeoutMs` (`DEFAULT_BROADCAST_TIMEOUT_MS`, 100000),
  `node.retries` / `node.retryDelayMs` (`DEFAULT_NODE_RETRIES` 3, `DEFAULT_NODE_RETRY_DELAY_MS` 500),
  `node.maxTxQuery` / `node.batchSize` (100 / 100), `fees.computeUnitMargin` (0.1),
  `fees.defaultTxFee` (5000, also replacing the `?? 5000` copies in `craftTransaction`),
  `fees.blockhashRetries` / `fees.blockhashRetryDelayMs` (5 / 5000), `staking.ledgerValidators`
  (`DEFAULT_LEDGER_VALIDATORS`) and `validators.cacheTtlMs` (`DEFAULT_VALIDATORS_CACHE_TTL_MS`,
  900000). The ky HTTP retry on status codes stays a constant.

  The module keeps no configuration state: `config.ts` holds types only and every reader resolves
  `config_currency_<id>` through a `SolanaContext` at call time. live-common builds it with
  `buildContext` for the message signer and the validators hook.

  Breaking: the `API_SOLANA_PROXY`, `SOLANA_VALIDATORS_APP_BASE_URL`,
  `SOLANA_TESTNET_VALIDATORS_APP_BASE_URL`, `SOLANA_VALIDATORS_SUMMARY_BASE_URL` and
  `SOLANA_TX_CONFIRMATION_TIMEOUT` env definitions are removed; override `rpcUrls.<id>`, `validatorsUrl` and `staking.validatorsSummaryUrl` in
  `config_currency_<id>` instead. The legacy `getValidators` of `network/validator-app` now takes
  `(validatorsUrl, validatorsSummaryUrl?)` instead of a cluster, and the Alpaca `getValidators` takes
  the summary URL as its second argument. `craftTransaction`, `estimateFees`, `estimateTxFee`,
  `unstakeReserve`, `computeUnstakeReserve`, `getBalance` and `listOperations` take the
  `SolanaCoinConfig` as their second argument, `buildVersionedTransaction` as its fourth, and the
  `network/chain/web3` instruction builders take the resolved `computeUnitMargin`.
  `getChainAPI` accepts `confirmationTimeoutMs`, `retries` and `retryDelayMs`; build its config with
  `chainConfigFrom(config, currencyId)`. `LEDGER_VALIDATOR_DEFAULT`, `LEDGER_VALIDATOR_LIST` and
  `LEDGER_VALIDATORS_VOTE_ACCOUNTS` are removed: use `ledgerValidatorsOf(config)` /
  `defaultLedgerValidatorOf(config)`; `LEDGER_VALIDATOR_BY_FIGMENT` / `_BY_BITWISE` moved to
  `constants`. `ledgerFirstValidators` takes the Ledger list as its second argument. The `coinConfig` default export of `config` (`setCoinConfig` / `getCoinConfig`) is removed:
  `getSolanaValidators(context, currencyId)` and `fetchValidators(config, currencyId)` take the
  config explicitly, and `signMessage(signerContext, contextOf)` resolves the account's currency
  context when signing.

- [#24022](https://github.com/LedgerHQ/ledger-live/pull/24022) [`8b9464a`](https://github.com/LedgerHQ/ledger-live/commit/8b9464a1f6d4e873e6ecbaf606d48040bcb86612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a ledgerlive://contacts deeplink that opens Contacts when lwdContacts is enabled

- [#24080](https://github.com/LedgerHQ/ledger-live/pull/24080) [`08aafc3`](https://github.com/LedgerHQ/ledger-live/commit/08aafc35e7abe1948b34f149d946d1114d6a39a7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade rspack to 2.3.0, rsbuild to 2.3.0 and rslib to 1.0.5

### Patch Changes

- Updated dependencies [[`5be64be`](https://github.com/LedgerHQ/ledger-live/commit/5be64be2b44e1ad7358a2b6db2ab56108ef73fd0), [`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64), [`4be13d5`](https://github.com/LedgerHQ/ledger-live/commit/4be13d5ee940cb84794b33bed7320287647cc82e), [`edb6f42`](https://github.com/LedgerHQ/ledger-live/commit/edb6f42309bda273de7d1c058698c4b0f8c1df86), [`6a2b43c`](https://github.com/LedgerHQ/ledger-live/commit/6a2b43c493ccdb6ecb3f928520fe94d5e93168d1), [`c1c388f`](https://github.com/LedgerHQ/ledger-live/commit/c1c388f850e9d045f87acb13b9af8fc71e546b45), [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`a9aac86`](https://github.com/LedgerHQ/ledger-live/commit/a9aac86b79c371c0b98bd8f16c966dadb81e07d6), [`08324bd`](https://github.com/LedgerHQ/ledger-live/commit/08324bd138b45b83dc0b763cddc284411a4e9577), [`3775d3f`](https://github.com/LedgerHQ/ledger-live/commit/3775d3fc1b6eba54ddaccc41f6cd9d935a818782), [`d185364`](https://github.com/LedgerHQ/ledger-live/commit/d185364617d5f4d2f52d05cc2d137055227dc6d3), [`cd14395`](https://github.com/LedgerHQ/ledger-live/commit/cd1439596d45fd4f66a4c778c9a678644078bbca), [`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9), [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`e6d5e3c`](https://github.com/LedgerHQ/ledger-live/commit/e6d5e3c668cabd575edfd44d7dfe47bf7f37e84e), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`a49773f`](https://github.com/LedgerHQ/ledger-live/commit/a49773f51027c607adac26d1133a36a37ada456c), [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c), [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11), [`9c2d544`](https://github.com/LedgerHQ/ledger-live/commit/9c2d544e7dbf8bd06d6abff29361f2ccdb7c61e1), [`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca), [`0c9ce30`](https://github.com/LedgerHQ/ledger-live/commit/0c9ce30960837b6cf52f5df9be2999a5c7377abf), [`55dc039`](https://github.com/LedgerHQ/ledger-live/commit/55dc0396b8bea844c6b745dc54f8b5b7a01c0ecd), [`d7778b9`](https://github.com/LedgerHQ/ledger-live/commit/d7778b9a6fcaae428e8a4e30e0bcdab13e6b2c1d), [`1dee328`](https://github.com/LedgerHQ/ledger-live/commit/1dee328bd842dce945aff197ecf14d665b453bfd), [`4bb6da0`](https://github.com/LedgerHQ/ledger-live/commit/4bb6da0fa786d014149c544d414398786aae9fc6), [`df941ac`](https://github.com/LedgerHQ/ledger-live/commit/df941acce2848e62f2a44f8d27cddf0ff28abe2b), [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d), [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51), [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb), [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`fdb0bdc`](https://github.com/LedgerHQ/ledger-live/commit/fdb0bdc25a803ba7907959d4f390e70b229423e2), [`198fa76`](https://github.com/LedgerHQ/ledger-live/commit/198fa76df6b3048033c21a723be51eebda95bd88), [`2b8aa58`](https://github.com/LedgerHQ/ledger-live/commit/2b8aa5862ed01665cefc11b62ce80d314c5771ba), [`bda0e29`](https://github.com/LedgerHQ/ledger-live/commit/bda0e297ae889fd821721a8dcf0147d320373571), [`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13), [`80325b3`](https://github.com/LedgerHQ/ledger-live/commit/80325b3fe630a0405a8618dfe498ae480f3224e3), [`8aad423`](https://github.com/LedgerHQ/ledger-live/commit/8aad4236ec8f65d1d5026d54ae761ba51efe863c), [`4397830`](https://github.com/LedgerHQ/ledger-live/commit/43978303a19c12b516cf9caf30eee84c49e8b478), [`e275739`](https://github.com/LedgerHQ/ledger-live/commit/e27573929d3e688afbb6544c58274e025867e6e4), [`33fc619`](https://github.com/LedgerHQ/ledger-live/commit/33fc61994dcf0265a4f98e77a2f6947f455ae6de), [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9), [`b947ef4`](https://github.com/LedgerHQ/ledger-live/commit/b947ef485dc1351050f14610ba9bf7054717252a), [`54c706e`](https://github.com/LedgerHQ/ledger-live/commit/54c706ecb75b930267d7ba83a6e13ce7a99cbab7), [`e6382fe`](https://github.com/LedgerHQ/ledger-live/commit/e6382fec7ac8b74c432990ecfe9a49224267bb77), [`604337a`](https://github.com/LedgerHQ/ledger-live/commit/604337ae838d77457b41bf42ad075a3016edf80d), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c5443a4`](https://github.com/LedgerHQ/ledger-live/commit/c5443a4862e77f1033922b517468a1bf81412add), [`496a4ef`](https://github.com/LedgerHQ/ledger-live/commit/496a4ef8f04d08b4df63f5b8632a6b4e73a184cb), [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea), [`dbe42b3`](https://github.com/LedgerHQ/ledger-live/commit/dbe42b3c907c59d822419c8444ce1074d1863407), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @features/flow-account-detail-notices@0.3.0-next.0
  - @domain/entity-account-operation@0.1.0-next.0
  - @shared/auth@0.8.0-next.0
  - @ledgerhq/live-common@38.6.0-next.0
  - @features/platform-assets-table@0.2.0-next.0
  - @features/flow-account-detail-hero@0.3.0-next.0
  - @domain/entity-account-data@0.4.0-next.0
  - @domain/api-account-data@0.4.0-next.0
  - @domain/entity-account-balance-history@0.1.0-next.0
  - @devtools/bindings@0.14.0-next.0
  - @features/flow-account-detail-delegations@0.2.0-next.0
  - @features/flow-account-detail@0.3.0-next.0
  - @features/flow-account-detail-settings@0.3.0-next.0
  - @shared/api-services@0.12.0-next.0
  - @domain/entity-currency-crypto@0.18.0-next.0
  - @features/platform-currencies@0.12.0-next.0
  - @shared/feature-flags@0.29.0-next.0
  - @ledgerhq/types-live@6.130.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.10.0-next.0
  - @ledgerhq/live-dmk-shared@0.38.0-next.0
  - @features/platform-feature-flags@0.11.0-next.0
  - @features/flow-contacts-add-address@0.9.0-next.0
  - @features/flow-contacts-add-contact@0.10.0-next.0
  - @features/flow-pay-contact@0.8.0-next.0
  - @features/flow-contacts-delete-address@0.4.0-next.0
  - @features/flow-contacts-delete-contact@0.5.0-next.0
  - @features/flow-contacts-edit-address@0.7.0-next.0
  - @features/flow-contacts-edit-contact@0.9.0-next.0
  - @features/flow-contacts-list@0.12.0-next.0
  - @features/flow-contacts@0.17.0-next.0
  - @features/flow-portfolio-services-entry-points@0.2.0-next.0
  - @devtools/shell@0.13.0-next.0
  - @domain/entity-account@0.2.0-next.0
  - @features/platform-account-source-coin-module@0.1.0-next.0
  - @features/flow-pay-card-assets@0.6.0-next.0
  - @features/flow-pay-card-details@0.10.0-next.0
  - @features/flow-pay-card@0.8.0-next.0
  - @features/platform-predictions@0.3.0-next.0
  - @features/platform-device-onboarding@0.4.0-next.0
  - @features/platform-aggregated-assets@0.6.0-next.0
  - @shared/ui-animated-height@0.2.0-next.0
  - @shared/env@0.12.0-next.0
  - @ledgerhq/asset-detail@0.12.3-next.0
  - @ledgerhq/live-dmk-desktop@0.26.1-next.0
  - @ledgerhq/live-send@0.1.6-next.0
  - @domain/entity-account-balance@0.2.2-next.0
  - @domain/api-aggregated-assets@0.6.3-next.0
  - @domain/api-card-management@0.8.4-next.0
  - @domain/api-currency-fiat@0.5.1-next.0
  - @domain/api-currency-token@0.7.1-next.0
  - @domain/api-market-countervalues@0.2.3-next.0
  - @domain/api-market-index-altcoin-season@0.4.4-next.0
  - @domain/api-market-index-fear-and-greed@0.4.4-next.0
  - @domain/api-push-devices@0.2.11-next.0
  - @features/platform-card@0.8.3-next.0
  - @domain/entity-contact@0.12.3-next.0
  - @domain/entity-currency@0.4.9-next.0
  - @domain/entity-currency-token@0.5.8-next.0
  - @domain/entity-market-countervalues@0.4.2-next.0
  - @features/flow-contacts-detail@0.3.1-next.0
  - @features/platform-account-analytics@0.2.0
  - @features/platform-contacts@0.12.1-next.0
  - @features/platform-market-countervalues@0.4.1-next.0
  - @ledgerhq/asset-aggregation@0.18.3-next.0
  - @ledgerhq/coin-bitcoin@1.1.1-next.0
  - @ledgerhq/coin-cardano@2.1.1-next.0
  - @ledgerhq/live-wallet@1.1.9-next.0
  - @ledgerhq/wallet-analytics@0.5.4-next.0
  - @ledgerhq/wallet-pnl@0.8.3-next.0
  - @features/flow-large-screen-upsell@2.3.1-next.0
  - @features/flow-pay-feature-tour@0.8.3-next.0
  - @features/platform-feature-flags-firebase@0.1.3-next.0
  - @ledgerhq/coin-canton@1.6.1-next.0
  - @ledgerhq/coin-casper@3.7.1-next.0
  - @ledgerhq/coin-concordium@1.7.1-next.0
  - @ledgerhq/coin-filecoin@2.6.1-next.0
  - @ledgerhq/coin-stacks@0.35.1-next.0
  - @ledgerhq/coin-zcash@1.1.1-next.0
  - @ledgerhq/live-signer-evm@0.24.4-next.0
  - @ledgerhq/transaction-observability@0.6.1-next.0
  - @ledgerhq/live-signer-tron@0.2.4-next.0
  - @features/flow-analytics-consent@0.2.12-next.0
  - @domain/entity-account-alias@0.1.3-next.0
  - @domain/entity-account-name@0.3.1-next.0
  - @domain/entity-starred-account@0.0.4-next.0
  - @features/platform-env@0.4.4-next.0
  - @features/flow-pay-card-auth@0.11.1-next.0
  - @features/flow-pay-card-transactions@0.7.1-next.0
  - @features/flow-pay-card-widget@0.6.2-next.0
  - @features/flow-fear-and-greed@0.5.1-next.0
  - @features/flow-app-availability@0.3.1-next.0
  - @ledgerhq/wallet-btc@1.1.0
  - @features/platform-content-ab-tests@0.2.3-next.0

## 4.26.0

### Minor Changes

- [#23761](https://github.com/LedgerHQ/ledger-live/pull/23761) [`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LWD Account Detail shows the account hero: the account balance (native and token sub-accounts countervalue) and the Receive · Send · Buy · Sell · Earn quick actions. The hero package exposes web views through a new `./web` entry, including an account-scoped asset picker dialog. On desktop, Sell is now hidden when the currency is not on the ramp, like Buy. Both apps now build the hero port with shared `useAvailableAssetsByAction` and `useAccountHeroStatus` hooks from the hero package.

- [#23811](https://github.com/LedgerHQ/ledger-live/pull/23811) [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LWD Account Detail shows the swap console in the right panel, prefilled with the account. It is gated by the `accountDetail` flag (not the swap-console A/B test) and hidden when the currency is unsupported or no asset of the account can be swapped. `resolveSwapConsole` only needs the currency support and swap availability.

- [#22944](https://github.com/LedgerHQ/ledger-live/pull/22944) [`bb382a2`](https://github.com/LedgerHQ/ledger-live/commit/bb382a21a87e206d8e30487c8deb2f2de7cd89c1) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Close the perps sign dialogs when "Open My Ledger" is clicked from the firmware update, app update or outdated app screens. My Ledger opened behind the dialog, which stayed on top; device action error screens now pass `onOpenManager` so hosts the button cannot close themselves can close on navigation

- [#23863](https://github.com/LedgerHQ/ledger-live/pull/23863) [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf) Thanks [@LL782](https://github.com/LL782)! - The OFAC-sanctioned fiat list now has one owner, `@domain/entity-currency-fiat`, behind `isSanctionedFiatTicker(ticker)`. The package no longer exports `OFAC_FIAT_TICKERS`, and `@ledgerhq/live-common/currencies` no longer exports `OFAC_CURRENCIES`. Both apps and `@domain/api-currency-fiat` call the new function.

- [#23614](https://github.com/LedgerHQ/ledger-live/pull/23614) [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18) Thanks [@thesan](https://github.com/thesan)! - Add the App config devtool: it shows the default option of the build, then lists each app config switch with its options and their values, the option the session runs on and the one saved for the next. Selecting an option saves its id, and selecting the default removes it so the switch follows the default again; neither reloads. The Reload button (Restart on mobile) only appears while a saved option differs from the current one, and applies every saved change at once: a renderer reload on desktop, an app restart on mobile. A search bar and an All / Switched filter narrow the list. `resolveAppConfig` now returns `{ config, session }`: `session` is what it resolved the session from, which both stores pass to `createAppConfigMiddleware` with their reload. The middleware sets the new `appConfig` slice, saves the `selectAppConfigOption` and `resetAppConfigSwitch` actions to the storage and reloads on `reloadAppConfig`. `ConfigStorage` gains `remove`.

- [#23628](https://github.com/LedgerHQ/ledger-live/pull/23628) [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(asset-detail): A/B test the swap console and a swap quick action on the LWD asset page

  `lwdSwapConsoleAbtest` params `console` and `quickAction` toggle the swap right panel and a highlighted Swap CTA placed before Receive. Flag state and params are reported to Mixpanel as `lwdSwapConsoleAbtest`.

- [#23861](https://github.com/LedgerHQ/ledger-live/pull/23861) [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The hero package exposes `AccountEmptyState` (`./web` and `./native`): a Lumen `Spot` with the coins icon, "No activity yet" and a description of the funding actions available on the account (Receive, Swap, Buy), one full sentence per combination. Both apps get the English copy. The empty-state rule model is renamed `AccountEmptyStateModel`.

- [#23900](https://github.com/LedgerHQ/ledger-live/pull/23900) [`a8a7b16`](https://github.com/LedgerHQ/ledger-live/commit/a8a7b163245a4efc1e1e4bb6869f34f66b8d43e2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the shared empty state instead of the Assets and Transactions sections when the account has no activity (no operation or pending operation, on the account or its tokens), on LWD and LWM. The hero stays above it. On LWM, an account without funds now offers Transfer · Swap · Buy (Swap opens with the account as destination), and with Swap a lone active Buy or Sell is shown as its own tile instead of More.

- [#23742](https://github.com/LedgerHQ/ledger-live/pull/23742) [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.8.0, built on the stable Zcash crates that set the NU7 mainnet activation height (3543405). A mainnet transaction whose target block is past that height is built under the NU7 branch id, with a 120-block default expiry.

- [#23583](https://github.com/LedgerHQ/ledger-live/pull/23583) [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Track the Zcash private balance activation funnel and whether Zcash accounts have their shielded balance enabled.

- [#23723](https://github.com/LedgerHQ/ledger-live/pull/23723) [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps withdraw input screen on desktop (amount, Max, destination account and live SwapKit quote), with shared Perps components, the `perpetuals:withdraw` drawer use case and the withdraw amount and default account helpers.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

- [#23816](https://github.com/LedgerHQ/ledger-live/pull/23816) [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(portfolio): A/B test services entry points cards between Crypto and Stablecoins

  `entryPointsServices` replaces the Perps and Borrow banners with a Services cards section on the LWD and LWM portfolio asset section. `params.services` sets which services show and their order. Flag state and order are reported to Mixpanel as `entryPointsServices`.

- [#23788](https://github.com/LedgerHQ/ledger-live/pull/23788) [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c) Thanks [@thesan](https://github.com/thesan)! - Add dev values to the app config on staging-default builds: each switch offers Dev | Staging | Prod and each fixed value Dev | Fixed in the App config devtool, which now also lists the fixed values. On Dev the values are text fields; a switch on Dev runs on its default option's values with its dev values on top, and a fixed value on its dev value. The schema of each value parses its dev value when the devtool saves it and again at boot, which ignores an invalid one. Dev values stay stored when another option is picked. Prod-default builds ignore Dev: they never offer it, never read the dev values, and ignore the selections holding `dev` without clearing them. The desktop build now defines `CONFIG_PROFILE` in every mode (`prod` outside development). `resolveAppConfig` now takes an `AppConfigStorage` (`selections` and `devValues`), `resetAppConfigSwitch` becomes `resetAppConfigSelection`, and `selectAppConfigOption` takes `{ id, selectionId }`. Playwright and Detox runs can pass dev values with `appConfigDevValues`.

- [#23681](https://github.com/LedgerHQ/ledger-live/pull/23681) [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the explorer URL helpers (`getDefaultExplorerView`, `getTransactionExplorer`, `getAddressExplorer`, `getTokenExplorer`, `getStakePoolExplorer`) from `@ledgerhq/live-common/explorers` to `@domain/entity-currency-crypto`. `getAccountContractExplorer` becomes `getTokenExplorer(view, contractAddress, ownerAddress)` and takes plain strings. All usages are migrated and `@ledgerhq/live-common/explorers` is removed.

- [#23713](https://github.com/LedgerHQ/ledger-live/pull/23713) [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account settings (LWM bottom sheet, LWD dialog) show a **View in explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking` as a sensitive link: `openLink(url, { sensitive: true })` still opens the full URL but only reports its origin to `onLinkOpened`, so the address never reaches analytics; `getDefaultExplorerView` accepts any object carrying `explorerViews`.

- [#23854](https://github.com/LedgerHQ/ledger-live/pull/23854) [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The account hero balance comes from a shared `useAccountCountervalue` hook in `@features/flow-account-detail-hero`: the apps only inject their countervalue callback. On LWM, an account whose assets are all empty now shows `$0.00`, like LWD, and a funded asset without a quote no longer counts as a known zero.

- [#23936](https://github.com/LedgerHQ/ledger-live/pull/23936) [`8ecfdc4`](https://github.com/LedgerHQ/ledger-live/commit/8ecfdc43164fe229209aac15f54a098063024c7a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - New `@features/flow-account-detail-notices` package: the notices shown on the Account Detail page above the family blocks (currency migration and upcoming deprecation, remote custom banner, Robinhood chain disclaimer, Perps). `resolveAccountNotices` turns plain signals from each app into the notices to show, in a fixed order; `AccountNotices` and `AccountStatusBanner` render them as Lumen info banners with package-owned copy (added to both English catalogs). The features-flow web Lumen test stub now renders `Banner` actions, like the native one.

- [#23706](https://github.com/LedgerHQ/ledger-live/pull/23706) [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Show the block height of a Zcash operation, label its confirmation count, and show the block height the birthday date resolves to in the private balance flow.

- [#23833](https://github.com/LedgerHQ/ledger-live/pull/23833) [`c439810`](https://github.com/LedgerHQ/ledger-live/commit/c4398107f46a9ab34b4925caa7827e4e8abf344c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Report a Perps deposit closed mid-swap to /swap/cancelled, like Swap does.

- [#23976](https://github.com/LedgerHQ/ledger-live/pull/23976) [`5b8eca9`](https://github.com/LedgerHQ/ledger-live/commit/5b8eca97b49dae69e77fb179b80bf3db2aab616e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the "Powered by" card and its "More info" drawer from the account page, on LWD and LWM. Family warnings (Solana frozen token and extensions, MultiversX guardian, Concordium) are unchanged.

- [#23906](https://github.com/LedgerHQ/ledger-live/pull/23906) [`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234) Thanks [@ysitbon](https://github.com/ysitbon)! - Make `TrackScreen` one universal component with a shared `TrackScreenProps` contract and remove the web-only `TrackPage`, which desktop now renders as `TrackScreen`

- [#23673](https://github.com/LedgerHQ/ledger-live/pull/23673) [`17d3660`](https://github.com/LedgerHQ/ledger-live/commit/17d3660cc61c095a6c5b18cdc132e218a35d695c) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Hide the Aleo self transfer header action when the new send flow is active for Aleo.

- [#23555](https://github.com/LedgerHQ/ledger-live/pull/23555) [`d81d157`](https://github.com/LedgerHQ/ledger-live/commit/d81d157753173799377cf7c2c612394bd50263bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sort Asset Detail addresses by fiat value so the highest balance is shown first

- [#23576](https://github.com/LedgerHQ/ledger-live/pull/23576) [`ada0f0b`](https://github.com/LedgerHQ/ledger-live/commit/ada0f0b89838da9098ac591856a3152f4ce59237) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron to 44.9.3

- [#23882](https://github.com/LedgerHQ/ledger-live/pull/23882) [`c38988c`](https://github.com/LedgerHQ/ledger-live/commit/c38988c079eb929be7307fc9311c324a1c81424a) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show privacy policy link when adding an address to any contact, not only your own

- [#23526](https://github.com/LedgerHQ/ledger-live/pull/23526) [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the desktop `operationsList` flag and always show transaction history

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23708](https://github.com/LedgerHQ/ledger-live/pull/23708) [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/auth` 0.1.1, `@ledgerhq/devices` 8.18.1, `@ledgerhq/hw-transport` 6.36.1, `@ledgerhq/hw-transport-mocker` 6.35.1, `@ledgerhq/hw-ledger-key-ring-protocol` 1.0.1, `@ledgerhq/ledger-key-ring-protocol` 1.1.0, `@ledgerhq/live-config` 3.9.1, `@ledgerhq/psbtv2` 0.6.2), `zod` 4.6.7, `semver` 7.8.5, `lodash` 4.18.1, and catalog `bitcoinjs-lib` 7.0.4.

- [#23741](https://github.com/LedgerHQ/ledger-live/pull/23741) [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a) Thanks [@LL782](https://github.com/LL782)! - The stored CAL token cache is restored without a wait for CAL, so Desktop and Mobile no longer stay on the loading screen when CAL hangs. Tokens of a currency with a stored hash are restored whatever their age, and the hash is checked in the background: a changed hash evicts the token cache, and a failed check keeps the stored tokens and hash. Tokens of a currency with no stored hash keep the 24 h limit, because no check can find them stale.

  `restoreTokensToCache(dispatch, persistedData)` is now synchronous and takes no `ttl`. `filterExpiredTokens` is removed.

- [#23740](https://github.com/LedgerHQ/ledger-live/pull/23740) [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153) Thanks [@LL782](https://github.com/LL782)! - Each CAL request attempt now ends after 30 seconds, and a timed-out attempt is not retried. A hung CAL no longer keeps token account sync (evm, cardano, celo…) or app loading waiting for ever: sync shows its error indicator instead. The sync hash requests (`getTokensSyncHash`, `getTokenListHash`) now go through the shared CAL base query, so they get the same timeout, cancellation and retries as the other CAL requests.

- [#23951](https://github.com/LedgerHQ/ledger-live/pull/23951) [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Confirming Remove account on desktop deletes the account and returns to the previous screen

- [#23737](https://github.com/LedgerHQ/ledger-live/pull/23737) [`82cd8cc`](https://github.com/LedgerHQ/ledger-live/commit/82cd8cce3ba3eb641f34dd90a878c2b67328519a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the device list when My Ledger sets up an unseeded Nano

- [#23758](https://github.com/LedgerHQ/ledger-live/pull/23758) [`b14f45e`](https://github.com/LedgerHQ/ledger-live/commit/b14f45edefdd89289607cd7b3d721d18cfad74f2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Set flow and source on modular drawer events from the asset page

- [#23918](https://github.com/LedgerHQ/ledger-live/pull/23918) [`42e9955`](https://github.com/LedgerHQ/ledger-live/commit/42e99552b343d4e6be8865807b80f01816af80cd) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(contacts-introduction): split the platform components into web and native entries

  The dialogs move to `@features/flow-contacts-introduction/web` and the bottom-sheet contents to `@features/flow-contacts-introduction/native`, with their props types. The root entry keeps the state, resolvers, preference port and hooks, and is the same on both platforms.

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

- [#23061](https://github.com/LedgerHQ/ledger-live/pull/23061) [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0) Thanks [@ishaba](https://github.com/ishaba)! - Let users pick the Tronify sponsored fee from the send flow on mobile, and link the fee payment disclaimer to a Learn more article

- [#23596](https://github.com/LedgerHQ/ledger-live/pull/23596) [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop My Wallet and drop the lwdWallet40 myWallet param

- [#23961](https://github.com/LedgerHQ/ledger-live/pull/23961) [`b68248a`](https://github.com/LedgerHQ/ledger-live/commit/b68248a16eb7b652d62bf5aaea2d8dc31a279265) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Register the Portfolio service in development builds, with its ids redacted from logs and Datadog

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

- [#23763](https://github.com/LedgerHQ/ledger-live/pull/23763) [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read an account name by AccountUUID, and add a Names page to the DevTools Accounts section

- [#23171](https://github.com/LedgerHQ/ledger-live/pull/23171) [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1) Thanks [@KVNLS](https://github.com/KVNLS)! - chore: replace node `querystring` with `URLSearchParams` / `encodeURIComponent` and drop the `querystring-es3` renderer fallback

- [#23604](https://github.com/LedgerHQ/ledger-live/pull/23604) [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset the device onboarding like a quit, and leave the genuine check screen even when quit comes before the device answered

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Ask the family send descriptor whether an arriving rent changes the fee, so the Amount step no longer checks Tron's TRC-20 token type itself

- [#23605](https://github.com/LedgerHQ/ledger-live/pull/23605) [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): share one full sync between BridgeSync and the FullSync source

  `syncLegacyAccount` writes each update into the legacy store and shares the sync in flight per account, so the background sync and account data reads never sync one account twice. The FullSync source skips the sync of an account whose last sync completed within the default max age, and answers it from the store.

- [#23781](https://github.com/LedgerHQ/ledger-live/pull/23781) [`5039dc5`](https://github.com/LedgerHQ/ledger-live/commit/5039dc56c41865e705de7eca774a0fd9df8d01cc) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Expose the CoinModuleApi for native ICP through `createApi` on the `./api` entry point, which keeps exporting the network client.

- [#23965](https://github.com/LedgerHQ/ledger-live/pull/23965) [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f) Thanks [@ysitbon](https://github.com/ysitbon)! - `InfoState` takes one props contract, `InfoStateProps` from `InfoState.types.ts`, on web and native, and the native `spot` preset now honors `backgroundTone` on its bottom sheet. `DialogBackgroundToneProvider` moves to the web platform entry `@shared/ui-info-state/web`; the gradient, context and tone hooks become internal. The universal entry is one unconditioned `src/index.ts`, imports carry no platform suffix, and the package gets a `lint` script.

- [#23558](https://github.com/LedgerHQ/ledger-live/pull/23558) [`725f00c`](https://github.com/LedgerHQ/ledger-live/commit/725f00cdc294de3afac68650f00db6b8059da0aa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Correct Ledger Sync steps that still mention a removed menu item

- [#23873](https://github.com/LedgerHQ/ledger-live/pull/23873) [`b86c5ad`](https://github.com/LedgerHQ/ledger-live/commit/b86c5ad86a3038af158b04c1e280279763f08851) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@lottiefiles/dotlottie-react` to 0.20.0 (`@lottiefiles/dotlottie-web` 0.81.0), dropping ~2.8 MB of published source maps from node_modules

- [#23691](https://github.com/LedgerHQ/ledger-live/pull/23691) [`e9e89b2`](https://github.com/LedgerHQ/ledger-live/commit/e9e89b24e0ae923421dce49c5bdd5764084a06c3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Assets table crypto icons render at 40px instead of 32px.

- [#24014](https://github.com/LedgerHQ/ledger-live/pull/24014) [`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319) Thanks [@Justkant](https://github.com/Justkant)! - Log manifest domain check violations, rejected `goToURL` fallbacks and rejected `loadURL` calls to the exported logs, once per distinct violation. Add `resolveInitialURL`, which returns the initial URL along with the `goToURL` it rejected

- [#23901](https://github.com/LedgerHQ/ledger-live/pull/23901) [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54) Thanks [@LL782](https://github.com/LL782)! - Improve the broadcast log events sent to Datadog

- [#23905](https://github.com/LedgerHQ/ledger-live/pull/23905) [`293dee2`](https://github.com/LedgerHQ/ledger-live/commit/293dee21b94eccbeffb471d3c4ac798b294b89a3) Thanks [@LL782](https://github.com/LL782)! - Improve device rename tracking

- [#23903](https://github.com/LedgerHQ/ledger-live/pull/23903) [`11493f8`](https://github.com/LedgerHQ/ledger-live/commit/11493f8545e2ff34531a86e09aff6e8e31637f76) Thanks [@LL782](https://github.com/LL782)! - Improve memo and explorer link tracking in coin families

- [#23902](https://github.com/LedgerHQ/ledger-live/pull/23902) [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa) Thanks [@LL782](https://github.com/LL782)! - Improve link and deeplink tracking

- [#23904](https://github.com/LedgerHQ/ledger-live/pull/23904) [`28a8eed`](https://github.com/LedgerHQ/ledger-live/commit/28a8eed033ac0129a8ee184e0b266ddf57da2544) Thanks [@LL782](https://github.com/LL782)! - Improve explorer link tracking in the swap status dialog

- [#23949](https://github.com/LedgerHQ/ledger-live/pull/23949) [`7282246`](https://github.com/LedgerHQ/ledger-live/commit/728224687387931e1a30fc53ffcff2ca0f8124f0) Thanks [@ysitbon](https://github.com/ysitbon)! - Rename the action tile callback from `onPress` to `onOpenFlow`, and resolve `.` to one `src/index.ts` on both platforms, with no `react-native` condition.

- [#23612](https://github.com/LedgerHQ/ledger-live/pull/23612) [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - The account sync hash is now the CAL token list hash of the account's network (`token_list_hash` from `/v1/networks`, new `getTokenListHash` endpoint) instead of the `X-Ledger-Commit` header. The commit header changed on every CAL deployment, so an update to any chain's tokens made every account of every network resync from scratch. A network the CAL lists no token for gets a fixed `no-tokens` hash.

  The token cache is still validated against the commit (`getTokensSyncHash` endpoint), so a metadata-only token correction still evicts it.

  Stored sync hashes were built from the commit, so each account resyncs from scratch once after this update.

- [#23797](https://github.com/LedgerHQ/ledger-live/pull/23797) [`ceb479f`](https://github.com/LedgerHQ/ledger-live/commit/ceb479fb8571380c2bb806298cb1e469bcbf08b4) Thanks [@qperrot](https://github.com/qperrot)! - Keep the recipient card add contact button label on one line so it stays aligned with the send button

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Mark the Send Review button busy while it loads

- [#23757](https://github.com/LedgerHQ/ledger-live/pull/23757) [`987ae55`](https://github.com/LedgerHQ/ledger-live/commit/987ae550a9cd29856238979e6426ffa471034bcb) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): fix double vertical scrollbar on the send flow contacts selection step

- [#23766](https://github.com/LedgerHQ/ledger-live/pull/23766) [`8763f6f`](https://github.com/LedgerHQ/ledger-live/commit/8763f6fea2477aca670bc244a4c82678d5f41ff4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace the firebase umbrella dependency with @firebase/app and @firebase/remote-config

- [#23255](https://github.com/LedgerHQ/ledger-live/pull/23255) [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): slim the account model (sequence, staking resources with validators, mode-based transaction type)

- [#23613](https://github.com/LedgerHQ/ledger-live/pull/23613) [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - A Solana account no longer resyncs its whole history when the CAL token list changes. The sync resumes from its watermark unless the account holds a token that just became listed (or is no longer blacklisted), the only case where the stored history misses operations a sub-account needs.

  A family opts in with the new `BridgeApi.balanceListsEveryToken` flag, which declares that `getBalance` lists every token the address holds without scanning its history. Solana is the only family that sets it.

- [#23705](https://github.com/LedgerHQ/ledger-live/pull/23705) [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a) Thanks [@semeano](https://github.com/semeano)! - Include the Stacks memo in sent transactions on the generic coin framework. The memo fields now also set `memoType`/`memoValue`, which the generic bridge turns into the intent's memo, and coin-stacks writes it into STX and SIP-010 transfers and rejects one longer than 34 bytes (LIVE-39478).

- [#23609](https://github.com/LedgerHQ/ledger-live/pull/23609) [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3) Thanks [@semeano](https://github.com/semeano)! - fix(coin-stacks): show stake details on the device step, map device rejection to UserRefusedOnDevice, type pox stake/unstake as DELEGATE/UNDELEGATE, reject boot contracts as pools, estimate a stake before its data is complete, validate the stake form inline, retype stored contract-call operations on load (as CONTRACT_CALL: a stored row has no contract id, so stakes synced before this change stay "Contract call" while new ones are DELEGATE/UNDELEGATE), and fall back to the transfer fee rate when the node proxy has no POST /v2/fees/transaction route

- [#23588](https://github.com/LedgerHQ/ledger-live/pull/23588) [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show Wallet 4.0 PnL and drop the `pnl` feature flag param

- [#23912](https://github.com/LedgerHQ/ledger-live/pull/23912) [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0) Thanks [@ysitbon](https://github.com/ysitbon)! - `StyleProvider` moves to platform entries: `@features/platform-style/web` and `@features/platform-style/native` each export `StyleProvider` and `StyleProviderProps`, and `@features/platform-style` no longer exports it. The package imports carry no platform suffix and its tests run in a web and a native jest project.

- [#24025](https://github.com/LedgerHQ/ledger-live/pull/24025) [`eaef2ce`](https://github.com/LedgerHQ/ledger-live/commit/eaef2ce67a4918615003023b028c43039a3d9f09) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a ledgerlive://contacts deeplink that opens Contacts when lwdContacts is enabled

- [#23924](https://github.com/LedgerHQ/ledger-live/pull/23924) [`cb3a452`](https://github.com/LedgerHQ/ledger-live/commit/cb3a45291269a6f63887399e8601d4027d1efe08) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron to 45.0.0

- [#23578](https://github.com/LedgerHQ/ledger-live/pull/23578) [`9830d23`](https://github.com/LedgerHQ/ledger-live/commit/9830d233c6d35ca7417498f74c7810fa7a95c3c7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade electron-builder and dmg-builder to 26.15.3

- [#23517](https://github.com/LedgerHQ/ledger-live/pull/23517) [`f90542d`](https://github.com/LedgerHQ/ledger-live/commit/f90542d8ec08cbba54601d821d7967cefda8bf5b) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): track the transaction sent event once per flow session

- [#23533](https://github.com/LedgerHQ/ledger-live/pull/23533) [`a140623`](https://github.com/LedgerHQ/ledger-live/commit/a140623b793cd36b80f5c0591672d02215f40e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace @rsdoctor/rspack-plugin 2.0.0-alpha.0 with @rsdoctor/core 2.0.0

- [#23875](https://github.com/LedgerHQ/ledger-live/pull/23875) [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @tanstack/react-table catalog on 8.21.3 to drop the duplicate 8.5.11 install

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Keep a paid Tronify rental in mind after Send is closed: a reopened USDT send no longer offers a second rental while the energy is arriving, tells the user it is on its way, and re-estimates the fee on the amount step once it lands

- [#23638](https://github.com/LedgerHQ/ledger-live/pull/23638) [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c) Thanks [@dilaouid](https://github.com/dilaouid)! - Enforce manifest origins on the Live App bridges: the Wallet API and Platform API are served on a bridge session bound to the main-frame origin, desktop bridge messages go through main, mobile WebViews answer only the main frame on a manifest origin, manifest domains are enforced on every main-frame load (mobile check on by default), and violations are reported to Datadog

### Patch Changes

- Updated dependencies [[`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826), [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf), [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`55a8889`](https://github.com/LedgerHQ/ledger-live/commit/55a88899741201271f070f7e79995f110817d677), [`fab7c15`](https://github.com/LedgerHQ/ledger-live/commit/fab7c1541531f1f50efbc0c3efec1fbecda63ff9), [`102829a`](https://github.com/LedgerHQ/ledger-live/commit/102829a0c606564a8d36541391fac354ffb5b0cc), [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac), [`93b62c3`](https://github.com/LedgerHQ/ledger-live/commit/93b62c317f1aeb5666f74ae91bff9d589c5ac1d5), [`a8a7b16`](https://github.com/LedgerHQ/ledger-live/commit/a8a7b163245a4efc1e1e4bb6869f34f66b8d43e2), [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288), [`6f774fb`](https://github.com/LedgerHQ/ledger-live/commit/6f774fb511e4190d4d0cf51bad655e707f3d0eb9), [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6), [`3ef486e`](https://github.com/LedgerHQ/ledger-live/commit/3ef486ee49b8dd3dfa5beec224f3baa3afdffd5a), [`2f49d10`](https://github.com/LedgerHQ/ledger-live/commit/2f49d10deab5f44e7468ffdc4577f0804235824c), [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c), [`d94b2e8`](https://github.com/LedgerHQ/ledger-live/commit/d94b2e8643c76f4b231b5cb21184ac76a3bdff15), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58), [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322), [`6b445da`](https://github.com/LedgerHQ/ledger-live/commit/6b445da2f92d7c630424faa7cc31a01bc67db0b9), [`20102d3`](https://github.com/LedgerHQ/ledger-live/commit/20102d3d6f99cdfa8e8e14f9c3b86f960adef64c), [`f51f724`](https://github.com/LedgerHQ/ledger-live/commit/f51f72470d118331f3c3219ed28f13039df309cb), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`4e9e4f6`](https://github.com/LedgerHQ/ledger-live/commit/4e9e4f65f4a8c22ebcb270a8886c50ebe289c705), [`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6), [`d81d157`](https://github.com/LedgerHQ/ledger-live/commit/d81d157753173799377cf7c2c612394bd50263bf), [`cdfa0c9`](https://github.com/LedgerHQ/ledger-live/commit/cdfa0c93d31ebdefdbc6bfc5f8deee7135623a3e), [`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a), [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`3d47846`](https://github.com/LedgerHQ/ledger-live/commit/3d47846307baebb9f7dbca75764650bf9c11506c), [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2), [`6ba7d71`](https://github.com/LedgerHQ/ledger-live/commit/6ba7d7194f8f8e3c96303537ccdf944ac7bf53a7), [`d316d23`](https://github.com/LedgerHQ/ledger-live/commit/d316d23562d9fc50834d308bf978f548aa032c57), [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b), [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9), [`2218721`](https://github.com/LedgerHQ/ledger-live/commit/2218721c96a5d03a8f4078245bf0bbca238a1f8d), [`42e9955`](https://github.com/LedgerHQ/ledger-live/commit/42e99552b343d4e6be8865807b80f01816af80cd), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d), [`07a548b`](https://github.com/LedgerHQ/ledger-live/commit/07a548bb67cfd5dff60f4554bfdfd386856e97e9), [`2dc1bee`](https://github.com/LedgerHQ/ledger-live/commit/2dc1beef8479530302204a9563b541ba9f7dbc2c), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`01ed754`](https://github.com/LedgerHQ/ledger-live/commit/01ed754cd80959b8e9ec3d73a02b1b8d5289e0be), [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`bfaac14`](https://github.com/LedgerHQ/ledger-live/commit/bfaac14201bb12b1f4b6e6a6d68ab4a0daa55b5c), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9fcce41`](https://github.com/LedgerHQ/ledger-live/commit/9fcce4124460578380778520016adccaf576980d), [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8), [`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319), [`b977dbb`](https://github.com/LedgerHQ/ledger-live/commit/b977dbb2d8d6459295210b491b33af6e8bace1da), [`e647907`](https://github.com/LedgerHQ/ledger-live/commit/e647907efc9ef15a3bba21ec5acdbbe6cbae658a), [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54), [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa), [`77bc92f`](https://github.com/LedgerHQ/ledger-live/commit/77bc92ff77d029d570f7b2553919222ee0e598ca), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`7282246`](https://github.com/LedgerHQ/ledger-live/commit/728224687387931e1a30fc53ffcff2ca0f8124f0), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59), [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba), [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011), [`6c6fd48`](https://github.com/LedgerHQ/ledger-live/commit/6c6fd486fbb642bac383e13fdd88ab67397e4bd6), [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301), [`c742800`](https://github.com/LedgerHQ/ledger-live/commit/c742800474dca6346e83690f414c31a747b0755f), [`675d1ca`](https://github.com/LedgerHQ/ledger-live/commit/675d1ca015c7d75a9ec3404c72a86896db7c1d06), [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b), [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a), [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3), [`8d462cb`](https://github.com/LedgerHQ/ledger-live/commit/8d462cbfd64fec0e533396e7b7316a17550733bc), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2), [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0), [`2929c6e`](https://github.com/LedgerHQ/ledger-live/commit/2929c6ebe1647bb011d37ebe3f6bd7a920045754), [`93e9617`](https://github.com/LedgerHQ/ledger-live/commit/93e961762f1c06f8ed3b6de447e3c61f35945d6d), [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @features/flow-account-detail-hero@0.2.0
  - @features/platform-quick-actions@0.1.0
  - @ledgerhq/live-common@38.5.0
  - @domain/entity-currency-fiat@0.5.0
  - @domain/api-currency-fiat@0.5.0
  - @shared/app-config@0.2.0
  - @devtools/bindings@0.13.0
  - @shared/feature-flags@0.28.0
  - @features/flow-account-detail@0.2.0
  - @ledgerhq/coin-zcash@1.1.0
  - @shared/lottie@0.1.0
  - @features/flow-fear-and-greed@0.5.0
  - @features/platform-coin-observability@0.2.0
  - @ledgerhq/transaction-observability@0.6.0
  - @features/flow-portfolio-services-entry-points@0.1.0
  - @domain/entity-currency-crypto@0.17.0
  - @features/flow-account-detail-settings@0.2.0
  - @shared/linking@0.4.0
  - @ledgerhq/live-dmk-shared@0.37.0
  - @ledgerhq/live-dmk-desktop@0.26.0
  - @domain/api-account-data@0.3.0
  - @shared/analytics-react@0.5.0
  - @features/platform-pay-analytics@0.4.0
  - @features/flow-app-availability@0.3.0
  - @features/platform-market-countervalues@0.4.0
  - @features/platform-device-intent@5.3.0
  - @features/platform-contacts@0.12.0
  - @ledgerhq/coin-bitcoin@1.1.0
  - @ledgerhq/wallet-btc@1.1.0
  - @devtools/shell@0.12.0
  - @devtools/transport-panel@0.8.0
  - @features/flow-contacts@0.16.0
  - @features/flow-contacts-add-contact@0.9.0
  - @features/flow-contacts-introduction@1.6.0
  - @features/flow-contacts-list@0.11.0
  - @features/flow-large-screen-upsell@2.3.0
  - @features/flow-pay-balance@0.9.0
  - @features/flow-pay-card-details@0.9.0
  - @features/platform-style@0.5.0
  - @shared/ui-info-state@0.6.0
  - @domain/api-currency-token@0.7.0
  - @shared/api-services@0.11.0
  - @ledgerhq/coin-canton@1.6.0
  - @domain/entity-client-identity@0.4.0
  - @features/platform-device-onboarding@0.3.0
  - @ledgerhq/coin-concordium@1.7.0
  - @features/flow-contacts-add-address@0.8.0
  - @features/flow-contacts-delete-address@0.3.0
  - @features/flow-contacts-delete-contact@0.4.0
  - @features/flow-contacts-detail@0.3.0
  - @features/flow-contacts-edit-address@0.6.0
  - @features/flow-contacts-edit-contact@0.8.0
  - @features/platform-feature-flags@0.10.0
  - @domain/entity-account-data@0.3.0
  - @domain/entity-account-name@0.3.0
  - @ledgerhq/ledger-wallet-framework@3.9.0
  - @features/flow-pay-card-auth@0.11.0
  - @ledgerhq/coin-cardano@2.1.0
  - @ledgerhq/coin-casper@3.7.0
  - @ledgerhq/coin-filecoin@2.6.0
  - @ledgerhq/coin-stacks@0.35.0
  - @ledgerhq/types-devices@7.2.0
  - @ledgerhq/types-live@6.129.0
  - @features/flow-pay-card-transactions@0.7.0
  - @features/flow-pay-card-assets@0.5.0
  - @features/platform-currencies@0.11.0
  - @ledgerhq/asset-detail@0.12.2
  - @ledgerhq/live-send@0.1.5
  - @domain/api-market-countervalues@0.2.2
  - @domain/entity-currency@0.4.8
  - @domain/entity-market-countervalues@0.4.1
  - @ledgerhq/wallet-analytics@0.5.3
  - @ledgerhq/wallet-pnl@0.8.2
  - @features/flow-pay-feature-tour@0.8.2
  - @features/platform-feature-flags-firebase@0.1.2
  - @features/platform-device-action-content@0.4.1
  - @domain/api-aggregated-assets@0.6.2
  - @domain/entity-account-balance@0.2.1
  - @domain/entity-contact@0.12.2
  - @domain/entity-currency-token@0.5.7
  - @features/platform-account-analytics@0.2.0
  - @ledgerhq/asset-aggregation@0.18.2
  - @ledgerhq/live-wallet@1.1.8
  - @features/flow-pay-bank-transfer@0.4.2
  - @features/flow-pay-card@0.7.2
  - @features/flow-pay-card-widget@0.6.1
  - @features/flow-pay-contact@0.7.1
  - @features/flow-pay-deposit@0.6.1
  - @features/flow-pay-request@0.9.1
  - @features/platform-app-update@0.1.0
  - @ledgerhq/live-signer-evm@0.24.3
  - @shared/analytics@0.4.0
  - @shared/auth@0.7.0
  - @shared/clipboard@0.1.0
  - @shared/cloud-sync@0.3.0
  - @shared/env@0.11.0
  - @shared/i18n@0.2.0
  - @shared/network-status@0.0.0
  - @ledgerhq/live-signer-tron@0.2.3
  - @domain/entity-account@0.1.1
  - @features/platform-verify-address-intent@0.3.1
  - @domain/api-card-management@0.8.3
  - @domain/api-market-index-altcoin-season@0.4.3
  - @domain/api-market-index-fear-and-greed@0.4.3
  - @domain/api-push-devices@0.2.10
  - @features/platform-card@0.8.2
  - @features/flow-analytics-consent@0.2.11
  - @features/platform-aggregated-assets@0.5.8
  - @features/platform-content-ab-tests@0.2.2
  - @domain/entity-account-alias@0.1.2
  - @domain/entity-starred-account@0.0.3

## 4.26.0-next.2

### Minor Changes

- [#24025](https://github.com/LedgerHQ/ledger-live/pull/24025) [`eaef2ce`](https://github.com/LedgerHQ/ledger-live/commit/eaef2ce67a4918615003023b028c43039a3d9f09) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a ledgerlive://contacts deeplink that opens Contacts when lwdContacts is enabled

## 4.26.0-next.1

### Minor Changes

- [#24014](https://github.com/LedgerHQ/ledger-live/pull/24014) [`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319) Thanks [@Justkant](https://github.com/Justkant)! - Log manifest domain check violations, rejected `goToURL` fallbacks and rejected `loadURL` calls to the exported logs, once per distinct violation. Add `resolveInitialURL`, which returns the initial URL along with the `goToURL` it rejected

### Patch Changes

- Updated dependencies [[`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319)]:
  - @ledgerhq/live-common@38.5.0-next.1
  - @ledgerhq/asset-detail@0.12.2-next.1
  - @ledgerhq/live-dmk-desktop@0.26.0-next.1
  - @ledgerhq/live-send@0.1.5-next.1

## 4.26.0-next.0

### Minor Changes

- [#23761](https://github.com/LedgerHQ/ledger-live/pull/23761) [`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LWD Account Detail shows the account hero: the account balance (native and token sub-accounts countervalue) and the Receive · Send · Buy · Sell · Earn quick actions. The hero package exposes web views through a new `./web` entry, including an account-scoped asset picker dialog. On desktop, Sell is now hidden when the currency is not on the ramp, like Buy. Both apps now build the hero port with shared `useAvailableAssetsByAction` and `useAccountHeroStatus` hooks from the hero package.

- [#23811](https://github.com/LedgerHQ/ledger-live/pull/23811) [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - LWD Account Detail shows the swap console in the right panel, prefilled with the account. It is gated by the `accountDetail` flag (not the swap-console A/B test) and hidden when the currency is unsupported or no asset of the account can be swapped. `resolveSwapConsole` only needs the currency support and swap availability.

- [#22944](https://github.com/LedgerHQ/ledger-live/pull/22944) [`bb382a2`](https://github.com/LedgerHQ/ledger-live/commit/bb382a21a87e206d8e30487c8deb2f2de7cd89c1) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Close the perps sign dialogs when "Open My Ledger" is clicked from the firmware update, app update or outdated app screens. My Ledger opened behind the dialog, which stayed on top; device action error screens now pass `onOpenManager` so hosts the button cannot close themselves can close on navigation

- [#23863](https://github.com/LedgerHQ/ledger-live/pull/23863) [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf) Thanks [@LL782](https://github.com/LL782)! - The OFAC-sanctioned fiat list now has one owner, `@domain/entity-currency-fiat`, behind `isSanctionedFiatTicker(ticker)`. The package no longer exports `OFAC_FIAT_TICKERS`, and `@ledgerhq/live-common/currencies` no longer exports `OFAC_CURRENCIES`. Both apps and `@domain/api-currency-fiat` call the new function.

- [#23614](https://github.com/LedgerHQ/ledger-live/pull/23614) [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18) Thanks [@thesan](https://github.com/thesan)! - Add the App config devtool: it shows the default option of the build, then lists each app config switch with its options and their values, the option the session runs on and the one saved for the next. Selecting an option saves its id, and selecting the default removes it so the switch follows the default again; neither reloads. The Reload button (Restart on mobile) only appears while a saved option differs from the current one, and applies every saved change at once: a renderer reload on desktop, an app restart on mobile. A search bar and an All / Switched filter narrow the list. `resolveAppConfig` now returns `{ config, session }`: `session` is what it resolved the session from, which both stores pass to `createAppConfigMiddleware` with their reload. The middleware sets the new `appConfig` slice, saves the `selectAppConfigOption` and `resetAppConfigSwitch` actions to the storage and reloads on `reloadAppConfig`. `ConfigStorage` gains `remove`.

- [#23628](https://github.com/LedgerHQ/ledger-live/pull/23628) [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(asset-detail): A/B test the swap console and a swap quick action on the LWD asset page

  `lwdSwapConsoleAbtest` params `console` and `quickAction` toggle the swap right panel and a highlighted Swap CTA placed before Receive. Flag state and params are reported to Mixpanel as `lwdSwapConsoleAbtest`.

- [#23861](https://github.com/LedgerHQ/ledger-live/pull/23861) [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The hero package exposes `AccountEmptyState` (`./web` and `./native`): a Lumen `Spot` with the coins icon, "No activity yet" and a description of the funding actions available on the account (Receive, Swap, Buy), one full sentence per combination. Both apps get the English copy. The empty-state rule model is renamed `AccountEmptyStateModel`.

- [#23900](https://github.com/LedgerHQ/ledger-live/pull/23900) [`a8a7b16`](https://github.com/LedgerHQ/ledger-live/commit/a8a7b163245a4efc1e1e4bb6869f34f66b8d43e2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account Detail shows the shared empty state instead of the Assets and Transactions sections when the account has no activity (no operation or pending operation, on the account or its tokens), on LWD and LWM. The hero stays above it. On LWM, an account without funds now offers Transfer · Swap · Buy (Swap opens with the account as destination), and with Swap a lone active Buy or Sell is shown as its own tile instead of More.

- [#23742](https://github.com/LedgerHQ/ledger-live/pull/23742) [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.8.0, built on the stable Zcash crates that set the NU7 mainnet activation height (3543405). A mainnet transaction whose target block is past that height is built under the NU7 branch id, with a 120-block default expiry.

- [#23583](https://github.com/LedgerHQ/ledger-live/pull/23583) [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Track the Zcash private balance activation funnel and whether Zcash accounts have their shielded balance enabled.

- [#23723](https://github.com/LedgerHQ/ledger-live/pull/23723) [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps withdraw input screen on desktop (amount, Max, destination account and live SwapKit quote), with shared Perps components, the `perpetuals:withdraw` drawer use case and the withdraw amount and default account helpers.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

- [#23816](https://github.com/LedgerHQ/ledger-live/pull/23816) [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(portfolio): A/B test services entry points cards between Crypto and Stablecoins

  `entryPointsServices` replaces the Perps and Borrow banners with a Services cards section on the LWD and LWM portfolio asset section. `params.services` sets which services show and their order. Flag state and order are reported to Mixpanel as `entryPointsServices`.

- [#23788](https://github.com/LedgerHQ/ledger-live/pull/23788) [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c) Thanks [@thesan](https://github.com/thesan)! - Add dev values to the app config on staging-default builds: each switch offers Dev | Staging | Prod and each fixed value Dev | Fixed in the App config devtool, which now also lists the fixed values. On Dev the values are text fields; a switch on Dev runs on its default option's values with its dev values on top, and a fixed value on its dev value. The schema of each value parses its dev value when the devtool saves it and again at boot, which ignores an invalid one. Dev values stay stored when another option is picked. Prod-default builds ignore Dev: they never offer it, never read the dev values, and ignore the selections holding `dev` without clearing them. The desktop build now defines `CONFIG_PROFILE` in every mode (`prod` outside development). `resolveAppConfig` now takes an `AppConfigStorage` (`selections` and `devValues`), `resetAppConfigSwitch` becomes `resetAppConfigSelection`, and `selectAppConfigOption` takes `{ id, selectionId }`. Playwright and Detox runs can pass dev values with `appConfigDevValues`.

- [#23681](https://github.com/LedgerHQ/ledger-live/pull/23681) [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the explorer URL helpers (`getDefaultExplorerView`, `getTransactionExplorer`, `getAddressExplorer`, `getTokenExplorer`, `getStakePoolExplorer`) from `@ledgerhq/live-common/explorers` to `@domain/entity-currency-crypto`. `getAccountContractExplorer` becomes `getTokenExplorer(view, contractAddress, ownerAddress)` and takes plain strings. All usages are migrated and `@ledgerhq/live-common/explorers` is removed.

- [#23713](https://github.com/LedgerHQ/ledger-live/pull/23713) [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account settings (LWM bottom sheet, LWD dialog) show a **View in explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking` as a sensitive link: `openLink(url, { sensitive: true })` still opens the full URL but only reports its origin to `onLinkOpened`, so the address never reaches analytics; `getDefaultExplorerView` accepts any object carrying `explorerViews`.

- [#23854](https://github.com/LedgerHQ/ledger-live/pull/23854) [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The account hero balance comes from a shared `useAccountCountervalue` hook in `@features/flow-account-detail-hero`: the apps only inject their countervalue callback. On LWM, an account whose assets are all empty now shows `$0.00`, like LWD, and a funded asset without a quote no longer counts as a known zero.

- [#23936](https://github.com/LedgerHQ/ledger-live/pull/23936) [`8ecfdc4`](https://github.com/LedgerHQ/ledger-live/commit/8ecfdc43164fe229209aac15f54a098063024c7a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - New `@features/flow-account-detail-notices` package: the notices shown on the Account Detail page above the family blocks (currency migration and upcoming deprecation, remote custom banner, Robinhood chain disclaimer, Perps). `resolveAccountNotices` turns plain signals from each app into the notices to show, in a fixed order; `AccountNotices` and `AccountStatusBanner` render them as Lumen info banners with package-owned copy (added to both English catalogs). The features-flow web Lumen test stub now renders `Banner` actions, like the native one.

- [#23706](https://github.com/LedgerHQ/ledger-live/pull/23706) [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Show the block height of a Zcash operation, label its confirmation count, and show the block height the birthday date resolves to in the private balance flow.

- [#23833](https://github.com/LedgerHQ/ledger-live/pull/23833) [`c439810`](https://github.com/LedgerHQ/ledger-live/commit/c4398107f46a9ab34b4925caa7827e4e8abf344c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Report a Perps deposit closed mid-swap to /swap/cancelled, like Swap does.

- [#23976](https://github.com/LedgerHQ/ledger-live/pull/23976) [`5b8eca9`](https://github.com/LedgerHQ/ledger-live/commit/5b8eca97b49dae69e77fb179b80bf3db2aab616e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the "Powered by" card and its "More info" drawer from the account page, on LWD and LWM. Family warnings (Solana frozen token and extensions, MultiversX guardian, Concordium) are unchanged.

- [#23906](https://github.com/LedgerHQ/ledger-live/pull/23906) [`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234) Thanks [@ysitbon](https://github.com/ysitbon)! - Make `TrackScreen` one universal component with a shared `TrackScreenProps` contract and remove the web-only `TrackPage`, which desktop now renders as `TrackScreen`

- [#23673](https://github.com/LedgerHQ/ledger-live/pull/23673) [`17d3660`](https://github.com/LedgerHQ/ledger-live/commit/17d3660cc61c095a6c5b18cdc132e218a35d695c) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Hide the Aleo self transfer header action when the new send flow is active for Aleo.

- [#23555](https://github.com/LedgerHQ/ledger-live/pull/23555) [`d81d157`](https://github.com/LedgerHQ/ledger-live/commit/d81d157753173799377cf7c2c612394bd50263bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sort Asset Detail addresses by fiat value so the highest balance is shown first

- [#23576](https://github.com/LedgerHQ/ledger-live/pull/23576) [`ada0f0b`](https://github.com/LedgerHQ/ledger-live/commit/ada0f0b89838da9098ac591856a3152f4ce59237) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron to 44.9.3

- [#23882](https://github.com/LedgerHQ/ledger-live/pull/23882) [`c38988c`](https://github.com/LedgerHQ/ledger-live/commit/c38988c079eb929be7307fc9311c324a1c81424a) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show privacy policy link when adding an address to any contact, not only your own

- [#23526](https://github.com/LedgerHQ/ledger-live/pull/23526) [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the desktop `operationsList` flag and always show transaction history

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23708](https://github.com/LedgerHQ/ledger-live/pull/23708) [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/auth` 0.1.1, `@ledgerhq/devices` 8.18.1, `@ledgerhq/hw-transport` 6.36.1, `@ledgerhq/hw-transport-mocker` 6.35.1, `@ledgerhq/hw-ledger-key-ring-protocol` 1.0.1, `@ledgerhq/ledger-key-ring-protocol` 1.1.0, `@ledgerhq/live-config` 3.9.1, `@ledgerhq/psbtv2` 0.6.2), `zod` 4.6.7, `semver` 7.8.5, `lodash` 4.18.1, and catalog `bitcoinjs-lib` 7.0.4.

- [#23741](https://github.com/LedgerHQ/ledger-live/pull/23741) [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a) Thanks [@LL782](https://github.com/LL782)! - The stored CAL token cache is restored without a wait for CAL, so Desktop and Mobile no longer stay on the loading screen when CAL hangs. Tokens of a currency with a stored hash are restored whatever their age, and the hash is checked in the background: a changed hash evicts the token cache, and a failed check keeps the stored tokens and hash. Tokens of a currency with no stored hash keep the 24 h limit, because no check can find them stale.

  `restoreTokensToCache(dispatch, persistedData)` is now synchronous and takes no `ttl`. `filterExpiredTokens` is removed.

- [#23740](https://github.com/LedgerHQ/ledger-live/pull/23740) [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153) Thanks [@LL782](https://github.com/LL782)! - Each CAL request attempt now ends after 30 seconds, and a timed-out attempt is not retried. A hung CAL no longer keeps token account sync (evm, cardano, celo…) or app loading waiting for ever: sync shows its error indicator instead. The sync hash requests (`getTokensSyncHash`, `getTokenListHash`) now go through the shared CAL base query, so they get the same timeout, cancellation and retries as the other CAL requests.

- [#23951](https://github.com/LedgerHQ/ledger-live/pull/23951) [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Confirming Remove account on desktop deletes the account and returns to the previous screen

- [#23737](https://github.com/LedgerHQ/ledger-live/pull/23737) [`82cd8cc`](https://github.com/LedgerHQ/ledger-live/commit/82cd8cce3ba3eb641f34dd90a878c2b67328519a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the device list when My Ledger sets up an unseeded Nano

- [#23758](https://github.com/LedgerHQ/ledger-live/pull/23758) [`b14f45e`](https://github.com/LedgerHQ/ledger-live/commit/b14f45edefdd89289607cd7b3d721d18cfad74f2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Set flow and source on modular drawer events from the asset page

- [#23918](https://github.com/LedgerHQ/ledger-live/pull/23918) [`42e9955`](https://github.com/LedgerHQ/ledger-live/commit/42e99552b343d4e6be8865807b80f01816af80cd) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(contacts-introduction): split the platform components into web and native entries

  The dialogs move to `@features/flow-contacts-introduction/web` and the bottom-sheet contents to `@features/flow-contacts-introduction/native`, with their props types. The root entry keeps the state, resolvers, preference port and hooks, and is the same on both platforms.

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

- [#23061](https://github.com/LedgerHQ/ledger-live/pull/23061) [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0) Thanks [@ishaba](https://github.com/ishaba)! - Let users pick the Tronify sponsored fee from the send flow on mobile, and link the fee payment disclaimer to a Learn more article

- [#23596](https://github.com/LedgerHQ/ledger-live/pull/23596) [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop My Wallet and drop the lwdWallet40 myWallet param

- [#23961](https://github.com/LedgerHQ/ledger-live/pull/23961) [`b68248a`](https://github.com/LedgerHQ/ledger-live/commit/b68248a16eb7b652d62bf5aaea2d8dc31a279265) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Register the Portfolio service in development builds, with its ids redacted from logs and Datadog

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

- [#23763](https://github.com/LedgerHQ/ledger-live/pull/23763) [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read an account name by AccountUUID, and add a Names page to the DevTools Accounts section

- [#23171](https://github.com/LedgerHQ/ledger-live/pull/23171) [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1) Thanks [@KVNLS](https://github.com/KVNLS)! - chore: replace node `querystring` with `URLSearchParams` / `encodeURIComponent` and drop the `querystring-es3` renderer fallback

- [#23604](https://github.com/LedgerHQ/ledger-live/pull/23604) [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset the device onboarding like a quit, and leave the genuine check screen even when quit comes before the device answered

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Ask the family send descriptor whether an arriving rent changes the fee, so the Amount step no longer checks Tron's TRC-20 token type itself

- [#23605](https://github.com/LedgerHQ/ledger-live/pull/23605) [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): share one full sync between BridgeSync and the FullSync source

  `syncLegacyAccount` writes each update into the legacy store and shares the sync in flight per account, so the background sync and account data reads never sync one account twice. The FullSync source skips the sync of an account whose last sync completed within the default max age, and answers it from the store.

- [#23781](https://github.com/LedgerHQ/ledger-live/pull/23781) [`5039dc5`](https://github.com/LedgerHQ/ledger-live/commit/5039dc56c41865e705de7eca774a0fd9df8d01cc) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Expose the CoinModuleApi for native ICP through `createApi` on the `./api` entry point, which keeps exporting the network client.

- [#23965](https://github.com/LedgerHQ/ledger-live/pull/23965) [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f) Thanks [@ysitbon](https://github.com/ysitbon)! - `InfoState` takes one props contract, `InfoStateProps` from `InfoState.types.ts`, on web and native, and the native `spot` preset now honors `backgroundTone` on its bottom sheet. `DialogBackgroundToneProvider` moves to the web platform entry `@shared/ui-info-state/web`; the gradient, context and tone hooks become internal. The universal entry is one unconditioned `src/index.ts`, imports carry no platform suffix, and the package gets a `lint` script.

- [#23558](https://github.com/LedgerHQ/ledger-live/pull/23558) [`725f00c`](https://github.com/LedgerHQ/ledger-live/commit/725f00cdc294de3afac68650f00db6b8059da0aa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Correct Ledger Sync steps that still mention a removed menu item

- [#23873](https://github.com/LedgerHQ/ledger-live/pull/23873) [`b86c5ad`](https://github.com/LedgerHQ/ledger-live/commit/b86c5ad86a3038af158b04c1e280279763f08851) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@lottiefiles/dotlottie-react` to 0.20.0 (`@lottiefiles/dotlottie-web` 0.81.0), dropping ~2.8 MB of published source maps from node_modules

- [#23691](https://github.com/LedgerHQ/ledger-live/pull/23691) [`e9e89b2`](https://github.com/LedgerHQ/ledger-live/commit/e9e89b24e0ae923421dce49c5bdd5764084a06c3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Assets table crypto icons render at 40px instead of 32px.

- [#23901](https://github.com/LedgerHQ/ledger-live/pull/23901) [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54) Thanks [@LL782](https://github.com/LL782)! - Improve the broadcast log events sent to Datadog

- [#23905](https://github.com/LedgerHQ/ledger-live/pull/23905) [`293dee2`](https://github.com/LedgerHQ/ledger-live/commit/293dee21b94eccbeffb471d3c4ac798b294b89a3) Thanks [@LL782](https://github.com/LL782)! - Improve device rename tracking

- [#23903](https://github.com/LedgerHQ/ledger-live/pull/23903) [`11493f8`](https://github.com/LedgerHQ/ledger-live/commit/11493f8545e2ff34531a86e09aff6e8e31637f76) Thanks [@LL782](https://github.com/LL782)! - Improve memo and explorer link tracking in coin families

- [#23902](https://github.com/LedgerHQ/ledger-live/pull/23902) [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa) Thanks [@LL782](https://github.com/LL782)! - Improve link and deeplink tracking

- [#23904](https://github.com/LedgerHQ/ledger-live/pull/23904) [`28a8eed`](https://github.com/LedgerHQ/ledger-live/commit/28a8eed033ac0129a8ee184e0b266ddf57da2544) Thanks [@LL782](https://github.com/LL782)! - Improve explorer link tracking in the swap status dialog

- [#23949](https://github.com/LedgerHQ/ledger-live/pull/23949) [`7282246`](https://github.com/LedgerHQ/ledger-live/commit/728224687387931e1a30fc53ffcff2ca0f8124f0) Thanks [@ysitbon](https://github.com/ysitbon)! - Rename the action tile callback from `onPress` to `onOpenFlow`, and resolve `.` to one `src/index.ts` on both platforms, with no `react-native` condition.

- [#23612](https://github.com/LedgerHQ/ledger-live/pull/23612) [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - The account sync hash is now the CAL token list hash of the account's network (`token_list_hash` from `/v1/networks`, new `getTokenListHash` endpoint) instead of the `X-Ledger-Commit` header. The commit header changed on every CAL deployment, so an update to any chain's tokens made every account of every network resync from scratch. A network the CAL lists no token for gets a fixed `no-tokens` hash.

  The token cache is still validated against the commit (`getTokensSyncHash` endpoint), so a metadata-only token correction still evicts it.

  Stored sync hashes were built from the commit, so each account resyncs from scratch once after this update.

- [#23797](https://github.com/LedgerHQ/ledger-live/pull/23797) [`ceb479f`](https://github.com/LedgerHQ/ledger-live/commit/ceb479fb8571380c2bb806298cb1e469bcbf08b4) Thanks [@qperrot](https://github.com/qperrot)! - Keep the recipient card add contact button label on one line so it stays aligned with the send button

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Mark the Send Review button busy while it loads

- [#23757](https://github.com/LedgerHQ/ledger-live/pull/23757) [`987ae55`](https://github.com/LedgerHQ/ledger-live/commit/987ae550a9cd29856238979e6426ffa471034bcb) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): fix double vertical scrollbar on the send flow contacts selection step

- [#23766](https://github.com/LedgerHQ/ledger-live/pull/23766) [`8763f6f`](https://github.com/LedgerHQ/ledger-live/commit/8763f6fea2477aca670bc244a4c82678d5f41ff4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace the firebase umbrella dependency with @firebase/app and @firebase/remote-config

- [#23255](https://github.com/LedgerHQ/ledger-live/pull/23255) [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): slim the account model (sequence, staking resources with validators, mode-based transaction type)

- [#23613](https://github.com/LedgerHQ/ledger-live/pull/23613) [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - A Solana account no longer resyncs its whole history when the CAL token list changes. The sync resumes from its watermark unless the account holds a token that just became listed (or is no longer blacklisted), the only case where the stored history misses operations a sub-account needs.

  A family opts in with the new `BridgeApi.balanceListsEveryToken` flag, which declares that `getBalance` lists every token the address holds without scanning its history. Solana is the only family that sets it.

- [#23705](https://github.com/LedgerHQ/ledger-live/pull/23705) [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a) Thanks [@semeano](https://github.com/semeano)! - Include the Stacks memo in sent transactions on the generic coin framework. The memo fields now also set `memoType`/`memoValue`, which the generic bridge turns into the intent's memo, and coin-stacks writes it into STX and SIP-010 transfers and rejects one longer than 34 bytes (LIVE-39478).

- [#23609](https://github.com/LedgerHQ/ledger-live/pull/23609) [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3) Thanks [@semeano](https://github.com/semeano)! - fix(coin-stacks): show stake details on the device step, map device rejection to UserRefusedOnDevice, type pox stake/unstake as DELEGATE/UNDELEGATE, reject boot contracts as pools, estimate a stake before its data is complete, validate the stake form inline, retype stored contract-call operations on load (as CONTRACT_CALL: a stored row has no contract id, so stakes synced before this change stay "Contract call" while new ones are DELEGATE/UNDELEGATE), and fall back to the transfer fee rate when the node proxy has no POST /v2/fees/transaction route

- [#23588](https://github.com/LedgerHQ/ledger-live/pull/23588) [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show Wallet 4.0 PnL and drop the `pnl` feature flag param

- [#23912](https://github.com/LedgerHQ/ledger-live/pull/23912) [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0) Thanks [@ysitbon](https://github.com/ysitbon)! - `StyleProvider` moves to platform entries: `@features/platform-style/web` and `@features/platform-style/native` each export `StyleProvider` and `StyleProviderProps`, and `@features/platform-style` no longer exports it. The package imports carry no platform suffix and its tests run in a web and a native jest project.

- [#23924](https://github.com/LedgerHQ/ledger-live/pull/23924) [`cb3a452`](https://github.com/LedgerHQ/ledger-live/commit/cb3a45291269a6f63887399e8601d4027d1efe08) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron to 45.0.0

- [#23578](https://github.com/LedgerHQ/ledger-live/pull/23578) [`9830d23`](https://github.com/LedgerHQ/ledger-live/commit/9830d233c6d35ca7417498f74c7810fa7a95c3c7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade electron-builder and dmg-builder to 26.15.3

- [#23517](https://github.com/LedgerHQ/ledger-live/pull/23517) [`f90542d`](https://github.com/LedgerHQ/ledger-live/commit/f90542d8ec08cbba54601d821d7967cefda8bf5b) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): track the transaction sent event once per flow session

- [#23533](https://github.com/LedgerHQ/ledger-live/pull/23533) [`a140623`](https://github.com/LedgerHQ/ledger-live/commit/a140623b793cd36b80f5c0591672d02215f40e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace @rsdoctor/rspack-plugin 2.0.0-alpha.0 with @rsdoctor/core 2.0.0

- [#23875](https://github.com/LedgerHQ/ledger-live/pull/23875) [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @tanstack/react-table catalog on 8.21.3 to drop the duplicate 8.5.11 install

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Keep a paid Tronify rental in mind after Send is closed: a reopened USDT send no longer offers a second rental while the energy is arriving, tells the user it is on its way, and re-estimates the fee on the amount step once it lands

- [#23638](https://github.com/LedgerHQ/ledger-live/pull/23638) [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c) Thanks [@dilaouid](https://github.com/dilaouid)! - Enforce manifest origins on the Live App bridges: the Wallet API and Platform API are served on a bridge session bound to the main-frame origin, desktop bridge messages go through main, mobile WebViews answer only the main frame on a manifest origin, manifest domains are enforced on every main-frame load (mobile check on by default), and violations are reported to Datadog

### Patch Changes

- Updated dependencies [[`35233dc`](https://github.com/LedgerHQ/ledger-live/commit/35233dc9e0f3389644536070fc3b9a2624d79826), [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf), [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`55a8889`](https://github.com/LedgerHQ/ledger-live/commit/55a88899741201271f070f7e79995f110817d677), [`fab7c15`](https://github.com/LedgerHQ/ledger-live/commit/fab7c1541531f1f50efbc0c3efec1fbecda63ff9), [`102829a`](https://github.com/LedgerHQ/ledger-live/commit/102829a0c606564a8d36541391fac354ffb5b0cc), [`5b0e4e1`](https://github.com/LedgerHQ/ledger-live/commit/5b0e4e112e84cc236adea3fad7d2dba119286aac), [`93b62c3`](https://github.com/LedgerHQ/ledger-live/commit/93b62c317f1aeb5666f74ae91bff9d589c5ac1d5), [`a8a7b16`](https://github.com/LedgerHQ/ledger-live/commit/a8a7b163245a4efc1e1e4bb6869f34f66b8d43e2), [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288), [`6f774fb`](https://github.com/LedgerHQ/ledger-live/commit/6f774fb511e4190d4d0cf51bad655e707f3d0eb9), [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6), [`3ef486e`](https://github.com/LedgerHQ/ledger-live/commit/3ef486ee49b8dd3dfa5beec224f3baa3afdffd5a), [`2f49d10`](https://github.com/LedgerHQ/ledger-live/commit/2f49d10deab5f44e7468ffdc4577f0804235824c), [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c), [`d94b2e8`](https://github.com/LedgerHQ/ledger-live/commit/d94b2e8643c76f4b231b5cb21184ac76a3bdff15), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`292b712`](https://github.com/LedgerHQ/ledger-live/commit/292b7129a233b43150c9c452b0efb20629a0bb58), [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322), [`6b445da`](https://github.com/LedgerHQ/ledger-live/commit/6b445da2f92d7c630424faa7cc31a01bc67db0b9), [`20102d3`](https://github.com/LedgerHQ/ledger-live/commit/20102d3d6f99cdfa8e8e14f9c3b86f960adef64c), [`f51f724`](https://github.com/LedgerHQ/ledger-live/commit/f51f72470d118331f3c3219ed28f13039df309cb), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`4e9e4f6`](https://github.com/LedgerHQ/ledger-live/commit/4e9e4f65f4a8c22ebcb270a8886c50ebe289c705), [`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6), [`d81d157`](https://github.com/LedgerHQ/ledger-live/commit/d81d157753173799377cf7c2c612394bd50263bf), [`cdfa0c9`](https://github.com/LedgerHQ/ledger-live/commit/cdfa0c93d31ebdefdbc6bfc5f8deee7135623a3e), [`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a), [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`3d47846`](https://github.com/LedgerHQ/ledger-live/commit/3d47846307baebb9f7dbca75764650bf9c11506c), [`8df0f06`](https://github.com/LedgerHQ/ledger-live/commit/8df0f06428dea5a14e9f81672cdf4ed6042967a2), [`6ba7d71`](https://github.com/LedgerHQ/ledger-live/commit/6ba7d7194f8f8e3c96303537ccdf944ac7bf53a7), [`d316d23`](https://github.com/LedgerHQ/ledger-live/commit/d316d23562d9fc50834d308bf978f548aa032c57), [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b), [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9), [`2218721`](https://github.com/LedgerHQ/ledger-live/commit/2218721c96a5d03a8f4078245bf0bbca238a1f8d), [`42e9955`](https://github.com/LedgerHQ/ledger-live/commit/42e99552b343d4e6be8865807b80f01816af80cd), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d), [`07a548b`](https://github.com/LedgerHQ/ledger-live/commit/07a548bb67cfd5dff60f4554bfdfd386856e97e9), [`2dc1bee`](https://github.com/LedgerHQ/ledger-live/commit/2dc1beef8479530302204a9563b541ba9f7dbc2c), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`01ed754`](https://github.com/LedgerHQ/ledger-live/commit/01ed754cd80959b8e9ec3d73a02b1b8d5289e0be), [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`bfaac14`](https://github.com/LedgerHQ/ledger-live/commit/bfaac14201bb12b1f4b6e6a6d68ab4a0daa55b5c), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9fcce41`](https://github.com/LedgerHQ/ledger-live/commit/9fcce4124460578380778520016adccaf576980d), [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8), [`b977dbb`](https://github.com/LedgerHQ/ledger-live/commit/b977dbb2d8d6459295210b491b33af6e8bace1da), [`e647907`](https://github.com/LedgerHQ/ledger-live/commit/e647907efc9ef15a3bba21ec5acdbbe6cbae658a), [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54), [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa), [`77bc92f`](https://github.com/LedgerHQ/ledger-live/commit/77bc92ff77d029d570f7b2553919222ee0e598ca), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`7282246`](https://github.com/LedgerHQ/ledger-live/commit/728224687387931e1a30fc53ffcff2ca0f8124f0), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59), [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba), [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011), [`6c6fd48`](https://github.com/LedgerHQ/ledger-live/commit/6c6fd486fbb642bac383e13fdd88ab67397e4bd6), [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301), [`c742800`](https://github.com/LedgerHQ/ledger-live/commit/c742800474dca6346e83690f414c31a747b0755f), [`675d1ca`](https://github.com/LedgerHQ/ledger-live/commit/675d1ca015c7d75a9ec3404c72a86896db7c1d06), [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b), [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a), [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3), [`8d462cb`](https://github.com/LedgerHQ/ledger-live/commit/8d462cbfd64fec0e533396e7b7316a17550733bc), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2), [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0), [`2929c6e`](https://github.com/LedgerHQ/ledger-live/commit/2929c6ebe1647bb011d37ebe3f6bd7a920045754), [`93e9617`](https://github.com/LedgerHQ/ledger-live/commit/93e961762f1c06f8ed3b6de447e3c61f35945d6d), [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @features/flow-account-detail-hero@0.2.0-next.0
  - @features/platform-quick-actions@0.1.0-next.0
  - @ledgerhq/live-common@38.5.0-next.0
  - @domain/entity-currency-fiat@0.5.0-next.0
  - @domain/api-currency-fiat@0.5.0-next.0
  - @shared/app-config@0.2.0-next.0
  - @devtools/bindings@0.13.0-next.0
  - @shared/feature-flags@0.28.0-next.0
  - @features/flow-account-detail@0.2.0-next.0
  - @ledgerhq/coin-zcash@1.1.0-next.0
  - @shared/lottie@0.1.0-next.0
  - @features/flow-fear-and-greed@0.5.0-next.0
  - @features/platform-coin-observability@0.2.0-next.0
  - @ledgerhq/transaction-observability@0.6.0-next.0
  - @features/flow-portfolio-services-entry-points@0.1.0-next.0
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @features/flow-account-detail-settings@0.2.0-next.0
  - @shared/linking@0.4.0-next.0
  - @ledgerhq/live-dmk-shared@0.37.0-next.0
  - @ledgerhq/live-dmk-desktop@0.26.0-next.0
  - @domain/api-account-data@0.3.0-next.0
  - @shared/analytics-react@0.5.0-next.0
  - @features/platform-pay-analytics@0.4.0-next.0
  - @features/flow-app-availability@0.3.0-next.0
  - @features/platform-market-countervalues@0.4.0-next.0
  - @features/platform-device-intent@5.3.0-next.0
  - @features/platform-contacts@0.12.0-next.0
  - @ledgerhq/coin-bitcoin@1.1.0-next.0
  - @ledgerhq/wallet-btc@1.1.0-next.0
  - @devtools/shell@0.12.0-next.0
  - @devtools/transport-panel@0.8.0-next.0
  - @features/flow-contacts@0.16.0-next.0
  - @features/flow-contacts-add-contact@0.9.0-next.0
  - @features/flow-contacts-introduction@1.6.0-next.0
  - @features/flow-contacts-list@0.11.0-next.0
  - @features/flow-large-screen-upsell@2.3.0-next.0
  - @features/flow-pay-balance@0.9.0-next.0
  - @features/flow-pay-card-details@0.9.0-next.0
  - @features/platform-style@0.5.0-next.0
  - @shared/ui-info-state@0.6.0-next.0
  - @domain/api-currency-token@0.7.0-next.0
  - @shared/api-services@0.11.0-next.0
  - @ledgerhq/coin-canton@1.6.0-next.0
  - @domain/entity-client-identity@0.4.0-next.0
  - @features/platform-device-onboarding@0.3.0-next.0
  - @ledgerhq/coin-concordium@1.7.0-next.0
  - @features/flow-contacts-add-address@0.8.0-next.0
  - @features/flow-contacts-delete-address@0.3.0-next.0
  - @features/flow-contacts-delete-contact@0.4.0-next.0
  - @features/flow-contacts-detail@0.3.0-next.0
  - @features/flow-contacts-edit-address@0.6.0-next.0
  - @features/flow-contacts-edit-contact@0.8.0-next.0
  - @features/platform-feature-flags@0.10.0-next.0
  - @domain/entity-account-data@0.3.0-next.0
  - @domain/entity-account-name@0.3.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @features/flow-pay-card-auth@0.11.0-next.0
  - @ledgerhq/coin-cardano@2.1.0-next.0
  - @ledgerhq/coin-casper@3.7.0-next.0
  - @ledgerhq/coin-filecoin@2.6.0-next.0
  - @ledgerhq/coin-stacks@0.35.0-next.0
  - @ledgerhq/types-devices@7.2.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0
  - @features/flow-pay-card-transactions@0.7.0-next.0
  - @features/flow-pay-card-assets@0.5.0-next.0
  - @features/platform-currencies@0.11.0-next.0
  - @ledgerhq/asset-detail@0.12.2-next.0
  - @ledgerhq/live-send@0.1.5-next.0
  - @domain/api-market-countervalues@0.2.2-next.0
  - @domain/entity-currency@0.4.8-next.0
  - @domain/entity-market-countervalues@0.4.1-next.0
  - @ledgerhq/wallet-analytics@0.5.3-next.0
  - @ledgerhq/wallet-pnl@0.8.2-next.0
  - @features/flow-pay-feature-tour@0.8.2-next.0
  - @features/platform-feature-flags-firebase@0.1.2-next.0
  - @features/platform-device-action-content@0.4.1-next.0
  - @domain/api-aggregated-assets@0.6.2-next.0
  - @domain/entity-account-balance@0.2.1-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @domain/entity-currency-token@0.5.7-next.0
  - @features/platform-account-analytics@0.2.0
  - @ledgerhq/asset-aggregation@0.18.2-next.0
  - @ledgerhq/live-wallet@1.1.8-next.0
  - @features/flow-pay-bank-transfer@0.4.2-next.0
  - @features/flow-pay-card@0.7.2-next.0
  - @features/flow-pay-card-widget@0.6.1-next.0
  - @features/flow-pay-contact@0.7.1-next.0
  - @features/flow-pay-deposit@0.6.1-next.0
  - @features/flow-pay-request@0.9.1-next.0
  - @features/platform-app-update@0.1.0
  - @ledgerhq/live-signer-evm@0.24.3-next.0
  - @shared/analytics@0.4.0
  - @shared/auth@0.7.0
  - @shared/clipboard@0.1.0
  - @shared/cloud-sync@0.3.0
  - @shared/env@0.11.0
  - @shared/i18n@0.2.0
  - @shared/network-status@0.0.0
  - @ledgerhq/live-signer-tron@0.2.3-next.0
  - @domain/entity-account@0.1.1-next.0
  - @features/platform-verify-address-intent@0.3.1-next.0
  - @domain/api-card-management@0.8.3-next.0
  - @domain/api-market-index-altcoin-season@0.4.3-next.0
  - @domain/api-market-index-fear-and-greed@0.4.3-next.0
  - @domain/api-push-devices@0.2.10-next.0
  - @features/platform-card@0.8.2-next.0
  - @features/flow-analytics-consent@0.2.11-next.0
  - @features/platform-aggregated-assets@0.5.8-next.0
  - @features/platform-content-ab-tests@0.2.2-next.0
  - @domain/entity-account-alias@0.1.2-next.0
  - @domain/entity-starred-account@0.0.3-next.0

## 4.25.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23367](https://github.com/LedgerHQ/ledger-live/pull/23367) [`bc0a9e1`](https://github.com/LedgerHQ/ledger-live/commit/bc0a9e149eef9dc38769df14dadc46ff115e7c1b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail page shell behind the `accountDetail` flag: `/account` routes switch per account to the new page (token sub-accounts redirect to their parent), the legacy page otherwise.

- [#23381](https://github.com/LedgerHQ/ledger-live/pull/23381) [`755532d`](https://github.com/LedgerHQ/ledger-live/commit/755532d67c3b03f886c08fe297bce61ccf8df5de) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail header on LWD: back button, account name, shortened address with the network icon, and an "Account settings" button.

- [#23401](https://github.com/LedgerHQ/ledger-live/pull/23401) [`0c0f9b2`](https://github.com/LedgerHQ/ledger-live/commit/0c0f9b2634a979bd97df53ff8cc85a6a86f736f0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail settings dialog on LWD: the settings button opens the account settings menu and the remove account confirmation.

- [#23463](https://github.com/LedgerHQ/ledger-live/pull/23463) [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the account name from the LWD Account Detail settings dialog: new change name step (back to the menu, name field, Change name button), disabled while accounts are syncing.

- [#23486](https://github.com/LedgerHQ/ledger-live/pull/23486) [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the advanced logs from the LWD Account Detail settings dialog: new advanced logs step (back to the menu, derivation tip, sync date, account JSON, Copy logs with a Copied state).

- [#23496](https://github.com/LedgerHQ/ledger-live/pull/23496) [`914c8b7`](https://github.com/LedgerHQ/ledger-live/commit/914c8b74e3baeb9aaf9ac086ead5a6369d0fd5cf) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the assets of the account on the LWD Account Detail page: native coin and tokens with balance, value and trend, sorted by value. The assets table moves to `mvvm/components/AssetsTable` and can hide its price column.

- [#23412](https://github.com/LedgerHQ/ledger-live/pull/23412) [`7644e3f`](https://github.com/LedgerHQ/ledger-live/commit/7644e3fb6195adceaf9e2f6cb1f527cd0f5bc33b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Transactions section to the LWD Account Detail page: the 3 latest operations of the account and its tokens, opening the full history scoped to the account. The Asset Detail section now uses the same shared component.

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23004](https://github.com/LedgerHQ/ledger-live/pull/23004) [`505eea9`](https://github.com/LedgerHQ/ledger-live/commit/505eea91332a042c158fdca7a36ebeddff379da3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.

- [#23346](https://github.com/LedgerHQ/ledger-live/pull/23346) [`80a62ae`](https://github.com/LedgerHQ/ledger-live/commit/80a62ae9b54253c0059abf236ca486f8a6bbc9ca) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show perps deposit device errors with the new error state and a retry.

- [#23195](https://github.com/LedgerHQ/ledger-live/pull/23195) [`490496e`](https://github.com/LedgerHQ/ledger-live/commit/490496e5eb52c62830b8e843c21c14662404b89e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - zcash: the spendable-balance warning no longer quotes a wait time that changes with the block spacing

- [#23344](https://github.com/LedgerHQ/ledger-live/pull/23344) [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b) Thanks [@cted-ledger](https://github.com/cted-ledger)! - give zcash testnet accounts the zcash screens and shielded sync, by recognising every zcash currency rather than the mainnet id only

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23485](https://github.com/LedgerHQ/ledger-live/pull/23485) [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.

- [#23283](https://github.com/LedgerHQ/ledger-live/pull/23283) [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash account type from coin-zcash instead of the bitcoin family types

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23417](https://github.com/LedgerHQ/ledger-live/pull/23417) [`56c8c10`](https://github.com/LedgerHQ/ledger-live/commit/56c8c102f4d6a89e2da1c9517006bcc9f109918b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(wallet-sync): show every Ledger Sync instance and scroll the list when there are many instances

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23502](https://github.com/LedgerHQ/ledger-live/pull/23502) [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).

- [#23489](https://github.com/LedgerHQ/ledger-live/pull/23489) [`53d3149`](https://github.com/LedgerHQ/ledger-live/commit/53d314969d2711da75471e7aef870038105e5092) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the LWD Account Detail page header pinned at the top while scrolling, like the Asset Detail header (`PageHeader` accepts a `className`).

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23543](https://github.com/LedgerHQ/ledger-live/pull/23543) [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(account-balance): add the balance entity

  Crypto balances of an account, one row per asset, keyed by AccountUUID. Both apps mount the slice. Fiat stays a view.

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23213](https://github.com/LedgerHQ/ledger-live/pull/23213) [`6ce41e8`](https://github.com/LedgerHQ/ledger-live/commit/6ce41e89e4af226cefdcedd53763f1b5c8988d5b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add the Descriptionitem component for the new send flow

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23154](https://github.com/LedgerHQ/ledger-live/pull/23154) [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues polling loop into a Redux middleware and drop the countervalues React context.

  - After changing the countervalue currency, adding an account or tracking a new asset, amounts no longer briefly fall back to the last daily rate before the new rates land.
  - On mobile, changing the countervalue currency or adding an account no longer re-renders every amount on screen several times, and loads the rates once instead of up to three times.
  - `@features/platform-market-countervalues`: `useCountervaluesState`, `useCountervaluesPolling`, `useCalculate`, `useCalculateCountervalueCallback` and `useSendAmount` keep their names and signatures and read the `countervalues` slice with `useSelector`. The loop moves into `createCountervaluesMiddleware`, started with `startCountervaluesSync({ savedState })`. `CountervaluesProvider`, `CountervaluesBridge`, `Props`, `PollingState` and `useCountervaluesUserSettings` are removed.
  - Desktop: the store installs the middleware; boot starts it right before the first render, so the saved rates show from the first frame. The window focus and blur events, the network changes and the saving to disk move into the middleware's configuration.
  - Mobile: the store installs the middleware; boot starts it when the app is let through, and a reboot starts it again from the saved state. The extra session tracking pairs move from an RxJS subject into the store.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23421](https://github.com/LedgerHQ/ledger-live/pull/23421) [`cb527aa`](https://github.com/LedgerHQ/ledger-live/commit/cb527aafdf311c6764a14d931bdb49d2bae6afcd) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): persist the CAL token cache again

  The persistence middleware matched CAL actions on the hardcoded `cryptoAssetsApi/` prefix, which stopped matching when the CAL api moved to the `calApi` reducer path. It now derives the prefix from `cryptoAssetsApi.reducerPath`.

- [#23365](https://github.com/LedgerHQ/ledger-live/pull/23365) [`c3e735a`](https://github.com/LedgerHQ/ledger-live/commit/c3e735ae6199bba5d1c1e45e6fbc455cb18d8602) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Run desktop E2E against Speculinho (remote Speculos). The app passes the Speculos address and session token to its Speculos transport at each open, and exposes `window.ledger.setSpeculosTarget` so a relaunched remote device (new URL and token) reaches the running app. The full desktop suite uses Speculinho, the smoke job does once its caller passes `SPECULINHO_URL`, and failed tests attach the Speculinho logs.

- [#23518](https://github.com/LedgerHQ/ledger-live/pull/23518) [`03274f1`](https://github.com/LedgerHQ/ledger-live/commit/03274f1c639bc9f50bafd53dfa136b5b1844f734) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump firebase from 9.23.0 to 12.19.0

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23360](https://github.com/LedgerHQ/ledger-live/pull/23360) [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the desktop Fear and Greed UI into the flow package

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23270](https://github.com/LedgerHQ/ledger-live/pull/23270) [`8c5a730`](https://github.com/LedgerHQ/ledger-live/commit/8c5a730bd1e38e9305a1e99177b42e12011cd79f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove the dev-only BYPASS_CORS workaround

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23240](https://github.com/LedgerHQ/ledger-live/pull/23240) [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - feat(onboarding): show the onboarding warning modal on touchscreen devices

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23239](https://github.com/LedgerHQ/ledger-live/pull/23239) [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo new send flow descriptor and extended self transfer flow

- [#23425](https://github.com/LedgerHQ/ledger-live/pull/23425) [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo estimated signing time row on the new send flow Amount step

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23234](https://github.com/LedgerHQ/ledger-live/pull/23234) [`c2c2f0a`](https://github.com/LedgerHQ/ledger-live/commit/c2c2f0a1b289dcef8e51f45ef6fe3c9f8418f045) Thanks [@LL782](https://github.com/LL782)! - Gate desktop launch on the shared app availability flow

- [#23510](https://github.com/LedgerHQ/ledger-live/pull/23510) [`cc970db`](https://github.com/LedgerHQ/ledger-live/commit/cc970db42cb0da0d21c6d862ac0eb5d3886bc80b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace unmaintained listr with a minimal task runner in the dist script

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23509](https://github.com/LedgerHQ/ledger-live/pull/23509) [`3df619d`](https://github.com/LedgerHQ/ledger-live/commit/3df619dafffd7aea45cacb18d705aa291c4dcb47) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused allure-commandline dependency

- [#23503](https://github.com/LedgerHQ/ledger-live/pull/23503) [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Allow Aleo token accounts to self-transfer between their public and private balances in the new send flow

- [#22782](https://github.com/LedgerHQ/ledger-live/pull/22782) [`014d4fd`](https://github.com/LedgerHQ/ledger-live/commit/014d4fd1d40ac1de41e55b0fb0bcef19be148367) Thanks [@KVNLS](https://github.com/KVNLS)! - Run the desktop renderer with `contextIsolation` and `sandbox` enabled, and without `nodeIntegration`.

  Previously any XSS, Live App escape or compromised dependency executing in the renderer had full Node available: `child_process`, arbitrary filesystem access, and unrestricted access to the account database files. The renderer now has none of that. It runs in its own JavaScript world inside an OS-level sandbox, and reaches the main process only through the allow-listed preload bridge, which exposes one method per operation rather than a generic `invoke(channel, ...)` passthrough. The renderer can still read and write its own `app` data through the bridge, as it must to work, and password attempts against the database are throttled in the main process; making encrypted fields unreadable while the app is locked is a separate follow-up.

  Live App `<webview>`s are checked before they are created: isolation, sandbox and web security are pinned, only the two webview preloads are accepted, and a disallowed `src` scheme blocks the webview. They also can no longer load local files, which the renderer could otherwise read back through `webview.loadURL()`.

  The three flags have to move together: `sandbox` has defaulted to true since Electron 20 and is auto-disabled only by `nodeIntegration`, so changing that one alone would silently sandbox the renderer _and_ strip Node from the preload.

  No data migration: `localStorage` is keyed by an origin that does not change, and both `app.json` and `lld.json` live in the main process either way.

- [#23550](https://github.com/LedgerHQ/ledger-live/pull/23550) [`589bae3`](https://github.com/LedgerHQ/ledger-live/commit/589bae35869b822c6337dd99b15f474119ea828c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Revert the network selection when swapping from Market (#23182, #23299).

- [#23226](https://github.com/LedgerHQ/ledger-live/pull/23226) [`dd34e1b`](https://github.com/LedgerHQ/ledger-live/commit/dd34e1b8929faff2869d6d3a2366acc16c649229) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Shorten the device intent executor component names

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`e5762fc`](https://github.com/LedgerHQ/ledger-live/commit/e5762fc3dc7bb36007c8133efefeeb6523cebf05), [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78), [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @features/flow-account-detail-settings@0.1.0
  - @features/flow-contacts-detail@0.2.0
  - @features/flow-contacts@0.15.0
  - @features/flow-pay-contact@0.7.0
  - @ledgerhq/coin-concordium@1.6.0
  - @ledgerhq/coin-zcash@1.0.0
  - @ledgerhq/live-common@38.4.0
  - @domain/entity-currency-crypto@0.16.0
  - @shared/app-config@0.1.0
  - @shared/env@0.11.0
  - @shared/auth@0.7.0
  - @ledgerhq/coin-bitcoin@1.0.0
  - @features/flow-account-detail@0.1.0
  - @features/flow-pay-card-details@0.8.0
  - @devtools/shell@0.11.0
  - @features/flow-fear-and-greed@0.4.0
  - @features/flow-contacts-introduction@1.5.0
  - @features/flow-contacts-list@0.10.0
  - @features/flow-pay-balance@0.8.0
  - @features/flow-pay-card-assets@0.4.0
  - @features/flow-pay-card-transactions@0.6.0
  - @features/flow-pay-card-widget@0.6.0
  - @features/flow-pay-deposit@0.6.0
  - @features/flow-pay-request@0.9.0
  - @features/platform-contacts@0.11.0
  - @shared/ui-info-state@0.5.0
  - @domain/entity-account-balance@0.2.0
  - @domain/entity-account-data@0.2.0
  - @domain/api-account-data@0.2.0
  - @domain/entity-account@0.1.0
  - @features/flow-contacts-add-contact@0.8.0
  - @features/platform-currencies@0.10.0
  - @ledgerhq/wallet-btc@1.0.0
  - @features/platform-account-analytics@0.2.0
  - @features/flow-contacts-add-address@0.7.0
  - @ledgerhq/coin-stacks@0.34.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0
  - @ledgerhq/coin-cosmos@2.0.0
  - @features/flow-contacts-edit-address@0.5.0
  - @domain/entity-market-countervalues@0.4.0
  - @features/platform-market-countervalues@0.3.0
  - @features/flow-contacts-delete-address@0.2.0
  - @features/flow-contacts-delete-contact@0.3.0
  - @features/flow-contacts-edit-contact@0.7.0
  - @ledgerhq/coin-filecoin@2.5.0
  - @features/platform-app-update@0.1.0
  - @features/platform-device-onboarding@0.2.0
  - @devtools/bindings@0.12.0
  - @ledgerhq/coin-casper@3.6.0
  - @ledgerhq/live-dmk-speculos@0.12.0
  - @features/flow-app-availability@0.2.0
  - @ledgerhq/live-dmk-shared@0.36.0
  - @ledgerhq/live-dmk-desktop@0.25.0
  - @ledgerhq/coin-canton@1.5.0
  - @features/flow-large-screen-upsell@2.2.3
  - @features/flow-pay-feature-tour@0.8.1
  - @features/platform-feature-flags@0.9.1
  - @features/platform-feature-flags-firebase@0.1.1
  - @features/flow-pay-bank-transfer@0.4.1
  - @features/flow-pay-card-auth@0.10.1
  - @ledgerhq/asset-detail@0.12.1
  - @ledgerhq/live-send@0.1.4
  - @domain/api-aggregated-assets@0.6.1
  - @domain/api-currency-token@0.6.5
  - @domain/api-market-countervalues@0.2.1
  - @domain/entity-contact@0.12.1
  - @domain/entity-currency@0.4.7
  - @domain/entity-currency-token@0.5.6
  - @ledgerhq/asset-aggregation@0.18.1
  - @ledgerhq/coin-cardano@2.0.1
  - @ledgerhq/live-wallet@1.1.7
  - @ledgerhq/wallet-analytics@0.5.2
  - @ledgerhq/wallet-pnl@0.8.1
  - @features/platform-aggregated-assets@0.5.7
  - @features/platform-env@0.4.3
  - @ledgerhq/transaction-observability@0.5.1
  - @shared/api-services@0.10.1
  - @features/flow-pay-card@0.7.1
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-alias@0.1.1
  - @domain/entity-account-name@0.2.3
  - @domain/entity-starred-account@0.0.2
  - @ledgerhq/live-signer-evm@0.24.2
  - @ledgerhq/live-signer-tron@0.2.2
  - @features/flow-analytics-consent@0.2.10
  - @features/platform-content-ab-tests@0.2.1
  - @domain/api-card-management@0.8.2
  - @domain/api-currency-fiat@0.4.8
  - @domain/api-market-index-altcoin-season@0.4.2
  - @domain/api-market-index-fear-and-greed@0.4.2
  - @domain/api-push-devices@0.2.9
  - @features/platform-card@0.8.1

## 4.25.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-zcash@1.0.0-next.1
  - @ledgerhq/live-common@38.4.0-next.2
  - @ledgerhq/asset-detail@0.12.1-next.2
  - @ledgerhq/live-dmk-desktop@0.25.0-next.2
  - @ledgerhq/live-send@0.1.4-next.2

## 4.25.0-next.1

### Minor Changes

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

### Patch Changes

- Updated dependencies [[`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be)]:
  - @ledgerhq/live-common@38.4.0-next.1
  - @ledgerhq/asset-detail@0.12.1-next.1
  - @ledgerhq/live-dmk-desktop@0.25.0-next.1
  - @ledgerhq/live-send@0.1.4-next.1

## 4.25.0-next.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23367](https://github.com/LedgerHQ/ledger-live/pull/23367) [`bc0a9e1`](https://github.com/LedgerHQ/ledger-live/commit/bc0a9e149eef9dc38769df14dadc46ff115e7c1b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail page shell behind the `accountDetail` flag: `/account` routes switch per account to the new page (token sub-accounts redirect to their parent), the legacy page otherwise.

- [#23381](https://github.com/LedgerHQ/ledger-live/pull/23381) [`755532d`](https://github.com/LedgerHQ/ledger-live/commit/755532d67c3b03f886c08fe297bce61ccf8df5de) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail header on LWD: back button, account name, shortened address with the network icon, and an "Account settings" button.

- [#23401](https://github.com/LedgerHQ/ledger-live/pull/23401) [`0c0f9b2`](https://github.com/LedgerHQ/ledger-live/commit/0c0f9b2634a979bd97df53ff8cc85a6a86f736f0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail settings dialog on LWD: the settings button opens the account settings menu and the remove account confirmation.

- [#23463](https://github.com/LedgerHQ/ledger-live/pull/23463) [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the account name from the LWD Account Detail settings dialog: new change name step (back to the menu, name field, Change name button), disabled while accounts are syncing.

- [#23486](https://github.com/LedgerHQ/ledger-live/pull/23486) [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the advanced logs from the LWD Account Detail settings dialog: new advanced logs step (back to the menu, derivation tip, sync date, account JSON, Copy logs with a Copied state).

- [#23496](https://github.com/LedgerHQ/ledger-live/pull/23496) [`914c8b7`](https://github.com/LedgerHQ/ledger-live/commit/914c8b74e3baeb9aaf9ac086ead5a6369d0fd5cf) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the assets of the account on the LWD Account Detail page: native coin and tokens with balance, value and trend, sorted by value. The assets table moves to `mvvm/components/AssetsTable` and can hide its price column.

- [#23412](https://github.com/LedgerHQ/ledger-live/pull/23412) [`7644e3f`](https://github.com/LedgerHQ/ledger-live/commit/7644e3fb6195adceaf9e2f6cb1f527cd0f5bc33b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Transactions section to the LWD Account Detail page: the 3 latest operations of the account and its tokens, opening the full history scoped to the account. The Asset Detail section now uses the same shared component.

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23004](https://github.com/LedgerHQ/ledger-live/pull/23004) [`505eea9`](https://github.com/LedgerHQ/ledger-live/commit/505eea91332a042c158fdca7a36ebeddff379da3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.

- [#23346](https://github.com/LedgerHQ/ledger-live/pull/23346) [`80a62ae`](https://github.com/LedgerHQ/ledger-live/commit/80a62ae9b54253c0059abf236ca486f8a6bbc9ca) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show perps deposit device errors with the new error state and a retry.

- [#23195](https://github.com/LedgerHQ/ledger-live/pull/23195) [`490496e`](https://github.com/LedgerHQ/ledger-live/commit/490496e5eb52c62830b8e843c21c14662404b89e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - zcash: the spendable-balance warning no longer quotes a wait time that changes with the block spacing

- [#23344](https://github.com/LedgerHQ/ledger-live/pull/23344) [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b) Thanks [@cted-ledger](https://github.com/cted-ledger)! - give zcash testnet accounts the zcash screens and shielded sync, by recognising every zcash currency rather than the mainnet id only

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23485](https://github.com/LedgerHQ/ledger-live/pull/23485) [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.

- [#23283](https://github.com/LedgerHQ/ledger-live/pull/23283) [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash account type from coin-zcash instead of the bitcoin family types

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23417](https://github.com/LedgerHQ/ledger-live/pull/23417) [`56c8c10`](https://github.com/LedgerHQ/ledger-live/commit/56c8c102f4d6a89e2da1c9517006bcc9f109918b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(wallet-sync): show every Ledger Sync instance and scroll the list when there are many instances

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23502](https://github.com/LedgerHQ/ledger-live/pull/23502) [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).

- [#23489](https://github.com/LedgerHQ/ledger-live/pull/23489) [`53d3149`](https://github.com/LedgerHQ/ledger-live/commit/53d314969d2711da75471e7aef870038105e5092) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the LWD Account Detail page header pinned at the top while scrolling, like the Asset Detail header (`PageHeader` accepts a `className`).

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23543](https://github.com/LedgerHQ/ledger-live/pull/23543) [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(account-balance): add the balance entity

  Crypto balances of an account, one row per asset, keyed by AccountUUID. Both apps mount the slice. Fiat stays a view.

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23213](https://github.com/LedgerHQ/ledger-live/pull/23213) [`6ce41e8`](https://github.com/LedgerHQ/ledger-live/commit/6ce41e89e4af226cefdcedd53763f1b5c8988d5b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add the Descriptionitem component for the new send flow

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23154](https://github.com/LedgerHQ/ledger-live/pull/23154) [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues polling loop into a Redux middleware and drop the countervalues React context.

  - After changing the countervalue currency, adding an account or tracking a new asset, amounts no longer briefly fall back to the last daily rate before the new rates land.
  - On mobile, changing the countervalue currency or adding an account no longer re-renders every amount on screen several times, and loads the rates once instead of up to three times.
  - `@features/platform-market-countervalues`: `useCountervaluesState`, `useCountervaluesPolling`, `useCalculate`, `useCalculateCountervalueCallback` and `useSendAmount` keep their names and signatures and read the `countervalues` slice with `useSelector`. The loop moves into `createCountervaluesMiddleware`, started with `startCountervaluesSync({ savedState })`. `CountervaluesProvider`, `CountervaluesBridge`, `Props`, `PollingState` and `useCountervaluesUserSettings` are removed.
  - Desktop: the store installs the middleware; boot starts it right before the first render, so the saved rates show from the first frame. The window focus and blur events, the network changes and the saving to disk move into the middleware's configuration.
  - Mobile: the store installs the middleware; boot starts it when the app is let through, and a reboot starts it again from the saved state. The extra session tracking pairs move from an RxJS subject into the store.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23421](https://github.com/LedgerHQ/ledger-live/pull/23421) [`cb527aa`](https://github.com/LedgerHQ/ledger-live/commit/cb527aafdf311c6764a14d931bdb49d2bae6afcd) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): persist the CAL token cache again

  The persistence middleware matched CAL actions on the hardcoded `cryptoAssetsApi/` prefix, which stopped matching when the CAL api moved to the `calApi` reducer path. It now derives the prefix from `cryptoAssetsApi.reducerPath`.

- [#23365](https://github.com/LedgerHQ/ledger-live/pull/23365) [`c3e735a`](https://github.com/LedgerHQ/ledger-live/commit/c3e735ae6199bba5d1c1e45e6fbc455cb18d8602) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Run desktop E2E against Speculinho (remote Speculos). The app passes the Speculos address and session token to its Speculos transport at each open, and exposes `window.ledger.setSpeculosTarget` so a relaunched remote device (new URL and token) reaches the running app. The full desktop suite uses Speculinho, the smoke job does once its caller passes `SPECULINHO_URL`, and failed tests attach the Speculinho logs.

- [#23518](https://github.com/LedgerHQ/ledger-live/pull/23518) [`03274f1`](https://github.com/LedgerHQ/ledger-live/commit/03274f1c639bc9f50bafd53dfa136b5b1844f734) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump firebase from 9.23.0 to 12.19.0

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23360](https://github.com/LedgerHQ/ledger-live/pull/23360) [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the desktop Fear and Greed UI into the flow package

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23270](https://github.com/LedgerHQ/ledger-live/pull/23270) [`8c5a730`](https://github.com/LedgerHQ/ledger-live/commit/8c5a730bd1e38e9305a1e99177b42e12011cd79f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove the dev-only BYPASS_CORS workaround

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23240](https://github.com/LedgerHQ/ledger-live/pull/23240) [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - feat(onboarding): show the onboarding warning modal on touchscreen devices

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23239](https://github.com/LedgerHQ/ledger-live/pull/23239) [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo new send flow descriptor and extended self transfer flow

- [#23425](https://github.com/LedgerHQ/ledger-live/pull/23425) [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo estimated signing time row on the new send flow Amount step

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23234](https://github.com/LedgerHQ/ledger-live/pull/23234) [`c2c2f0a`](https://github.com/LedgerHQ/ledger-live/commit/c2c2f0a1b289dcef8e51f45ef6fe3c9f8418f045) Thanks [@LL782](https://github.com/LL782)! - Gate desktop launch on the shared app availability flow

- [#23510](https://github.com/LedgerHQ/ledger-live/pull/23510) [`cc970db`](https://github.com/LedgerHQ/ledger-live/commit/cc970db42cb0da0d21c6d862ac0eb5d3886bc80b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace unmaintained listr with a minimal task runner in the dist script

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23509](https://github.com/LedgerHQ/ledger-live/pull/23509) [`3df619d`](https://github.com/LedgerHQ/ledger-live/commit/3df619dafffd7aea45cacb18d705aa291c4dcb47) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused allure-commandline dependency

- [#23503](https://github.com/LedgerHQ/ledger-live/pull/23503) [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Allow Aleo token accounts to self-transfer between their public and private balances in the new send flow

- [#22782](https://github.com/LedgerHQ/ledger-live/pull/22782) [`014d4fd`](https://github.com/LedgerHQ/ledger-live/commit/014d4fd1d40ac1de41e55b0fb0bcef19be148367) Thanks [@KVNLS](https://github.com/KVNLS)! - Run the desktop renderer with `contextIsolation` and `sandbox` enabled, and without `nodeIntegration`.

  Previously any XSS, Live App escape or compromised dependency executing in the renderer had full Node available: `child_process`, arbitrary filesystem access, and unrestricted access to the account database files. The renderer now has none of that. It runs in its own JavaScript world inside an OS-level sandbox, and reaches the main process only through the allow-listed preload bridge, which exposes one method per operation rather than a generic `invoke(channel, ...)` passthrough. The renderer can still read and write its own `app` data through the bridge, as it must to work, and password attempts against the database are throttled in the main process; making encrypted fields unreadable while the app is locked is a separate follow-up.

  Live App `<webview>`s are checked before they are created: isolation, sandbox and web security are pinned, only the two webview preloads are accepted, and a disallowed `src` scheme blocks the webview. They also can no longer load local files, which the renderer could otherwise read back through `webview.loadURL()`.

  The three flags have to move together: `sandbox` has defaulted to true since Electron 20 and is auto-disabled only by `nodeIntegration`, so changing that one alone would silently sandbox the renderer _and_ strip Node from the preload.

  No data migration: `localStorage` is keyed by an origin that does not change, and both `app.json` and `lld.json` live in the main process either way.

- [#23550](https://github.com/LedgerHQ/ledger-live/pull/23550) [`589bae3`](https://github.com/LedgerHQ/ledger-live/commit/589bae35869b822c6337dd99b15f474119ea828c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Revert the network selection when swapping from Market (#23182, #23299).

- [#23226](https://github.com/LedgerHQ/ledger-live/pull/23226) [`dd34e1b`](https://github.com/LedgerHQ/ledger-live/commit/dd34e1b8929faff2869d6d3a2366acc16c649229) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Shorten the device intent executor component names

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`e5762fc`](https://github.com/LedgerHQ/ledger-live/commit/e5762fc3dc7bb36007c8133efefeeb6523cebf05), [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78), [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @features/flow-account-detail-settings@0.1.0-next.0
  - @features/flow-contacts-detail@0.2.0-next.0
  - @features/flow-contacts@0.15.0-next.0
  - @features/flow-pay-contact@0.7.0-next.0
  - @ledgerhq/coin-concordium@1.6.0-next.0
  - @ledgerhq/coin-zcash@1.0.0-next.0
  - @ledgerhq/live-common@38.4.0-next.0
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @shared/app-config@0.1.0-next.0
  - @shared/env@0.11.0-next.0
  - @shared/auth@0.7.0-next.0
  - @ledgerhq/coin-bitcoin@1.0.0-next.0
  - @features/flow-account-detail@0.1.0-next.0
  - @features/flow-pay-card-details@0.8.0-next.0
  - @devtools/shell@0.11.0-next.0
  - @features/flow-fear-and-greed@0.4.0-next.0
  - @features/flow-contacts-introduction@1.5.0-next.0
  - @features/flow-contacts-list@0.10.0-next.0
  - @features/flow-pay-balance@0.8.0-next.0
  - @features/flow-pay-card-assets@0.4.0-next.0
  - @features/flow-pay-card-transactions@0.6.0-next.0
  - @features/flow-pay-card-widget@0.6.0-next.0
  - @features/flow-pay-deposit@0.6.0-next.0
  - @features/flow-pay-request@0.9.0-next.0
  - @features/platform-contacts@0.11.0-next.0
  - @shared/ui-info-state@0.5.0-next.0
  - @domain/entity-account-balance@0.2.0-next.0
  - @domain/entity-account-data@0.2.0-next.0
  - @domain/api-account-data@0.2.0-next.0
  - @domain/entity-account@0.1.0-next.0
  - @features/flow-contacts-add-contact@0.8.0-next.0
  - @features/platform-currencies@0.10.0-next.0
  - @ledgerhq/wallet-btc@1.0.0-next.0
  - @features/platform-account-analytics@0.2.0-next.0
  - @features/flow-contacts-add-address@0.7.0-next.0
  - @ledgerhq/coin-stacks@0.34.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0
  - @ledgerhq/coin-cosmos@2.0.0-next.0
  - @features/flow-contacts-edit-address@0.5.0-next.0
  - @domain/entity-market-countervalues@0.4.0-next.0
  - @features/platform-market-countervalues@0.3.0-next.0
  - @features/flow-contacts-delete-address@0.2.0-next.0
  - @features/flow-contacts-delete-contact@0.3.0-next.0
  - @features/flow-contacts-edit-contact@0.7.0-next.0
  - @ledgerhq/coin-filecoin@2.5.0-next.0
  - @features/platform-app-update@0.1.0-next.0
  - @features/platform-device-onboarding@0.2.0-next.0
  - @devtools/bindings@0.12.0-next.0
  - @ledgerhq/coin-casper@3.6.0-next.0
  - @ledgerhq/live-dmk-speculos@0.12.0-next.0
  - @features/flow-app-availability@0.2.0-next.0
  - @ledgerhq/live-dmk-shared@0.36.0-next.0
  - @ledgerhq/live-dmk-desktop@0.25.0-next.0
  - @ledgerhq/coin-canton@1.5.0-next.0
  - @features/flow-large-screen-upsell@2.2.3-next.0
  - @features/flow-pay-feature-tour@0.8.1-next.0
  - @features/platform-feature-flags@0.9.1-next.0
  - @features/platform-feature-flags-firebase@0.1.1-next.0
  - @features/flow-pay-bank-transfer@0.4.1-next.0
  - @features/flow-pay-card-auth@0.10.1-next.0
  - @ledgerhq/asset-detail@0.12.1-next.0
  - @ledgerhq/live-send@0.1.4-next.0
  - @domain/api-aggregated-assets@0.6.1-next.0
  - @domain/api-currency-token@0.6.5-next.0
  - @domain/api-market-countervalues@0.2.1-next.0
  - @domain/entity-contact@0.12.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @domain/entity-currency-token@0.5.6-next.0
  - @ledgerhq/asset-aggregation@0.18.1-next.0
  - @ledgerhq/coin-cardano@2.0.1-next.0
  - @ledgerhq/live-wallet@1.1.7-next.0
  - @ledgerhq/wallet-analytics@0.5.2-next.0
  - @ledgerhq/wallet-pnl@0.8.1-next.0
  - @features/platform-aggregated-assets@0.5.7-next.0
  - @features/platform-env@0.4.3-next.0
  - @ledgerhq/transaction-observability@0.5.1-next.0
  - @shared/api-services@0.10.1-next.0
  - @features/flow-pay-card@0.7.1-next.0
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-alias@0.1.1-next.0
  - @domain/entity-account-name@0.2.3-next.0
  - @domain/entity-starred-account@0.0.2-next.0
  - @ledgerhq/live-signer-evm@0.24.2-next.0
  - @ledgerhq/live-signer-tron@0.2.2-next.0
  - @features/flow-analytics-consent@0.2.10-next.0
  - @features/platform-content-ab-tests@0.2.1-next.0
  - @domain/api-card-management@0.8.2-next.0
  - @domain/api-currency-fiat@0.4.8-next.0
  - @domain/api-market-index-altcoin-season@0.4.2-next.0
  - @domain/api-market-index-fear-and-greed@0.4.2-next.0
  - @domain/api-push-devices@0.2.9-next.0
  - @features/platform-card@0.8.1-next.0

## 4.24.0

### Minor Changes

- [#23017](https://github.com/LedgerHQ/ledger-live/pull/23017) [`eaff720`](https://github.com/LedgerHQ/ledger-live/commit/eaff72056535cd3d78ac4b0266fa9933b54c9a6e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a concise message when adding an account fails because the provider returns a server or network error

- [#22909](https://github.com/LedgerHQ/ledger-live/pull/22909) [`29ead28`](https://github.com/LedgerHQ/ledger-live/commit/29ead2847f8227440eb1752984068a85cd0ab51e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(add-account): allow creating other BTC address types when the existing account is empty

- [#22981](https://github.com/LedgerHQ/ledger-live/pull/22981) [`3faf47c`](https://github.com/LedgerHQ/ledger-live/commit/3faf47c8c7d8daecb352f7dd32ef72c8d064ba0e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Rename the market banner "View all" tile to "More" so it no longer gets cropped in longer languages.

- [#22971](https://github.com/LedgerHQ/ledger-live/pull/22971) [`f8a4b3e`](https://github.com/LedgerHQ/ledger-live/commit/f8a4b3e5f6e68cd507c74b7538247e0e5efc7a3a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(top-bar): keep a minimum width for the search and truncate the update pills on narrow windows

- [#23139](https://github.com/LedgerHQ/ledger-live/pull/23139) [`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve the market id of an asset from the ledger ids when needed, so favorites added from search show up in the Market banner

- [#22519](https://github.com/LedgerHQ/ledger-live/pull/22519) [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add desktop stake and unstake flows

  coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

  coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23143](https://github.com/LedgerHQ/ledger-live/pull/23143) [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - refactor(contacts): clean up the Contacts debug tools

  The send-history contacts builder was copied in both apps. It now lives once in
  `@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
  adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
  desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
  value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
  drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#23182](https://github.com/LedgerHQ/ledger-live/pull/23182) [`0d31c6b`](https://github.com/LedgerHQ/ledger-live/commit/0d31c6b7e2b5cf09376d1e59fe025be5968ae560) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap from Market only after the user has picked the network and account to swap from, whenever they hold an account on any of the asset's networks.

- [#22904](https://github.com/LedgerHQ/ledger-live/pull/22904) [`1696c5d`](https://github.com/LedgerHQ/ledger-live/commit/1696c5dd3149b658d71a51470ba1a723e1cff940) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wrap Analytics PnL cards and balance header on narrow windows instead of overflowing horizontally

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#22920](https://github.com/LedgerHQ/ledger-live/pull/22920) [`c45454e`](https://github.com/LedgerHQ/ledger-live/commit/c45454e9d53bdb7fc8632dbe857a2cc80fac8aa6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(errors): stop reporting DMK and empty errors as TranslatedError invalid usage

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23053](https://github.com/LedgerHQ/ledger-live/pull/23053) [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show each stablecoin as its own Pay balance filter option, including testnet holdings

- [#22988](https://github.com/LedgerHQ/ledger-live/pull/22988) [`7cfa427`](https://github.com/LedgerHQ/ledger-live/commit/7cfa427f8df0405cf6499657cbe3d5957d1e3509) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(crypto-addresses): keep the rename dialog open while accounts sync or countervalues refresh

- [#23172](https://github.com/LedgerHQ/ledger-live/pull/23172) [`37f6895`](https://github.com/LedgerHQ/ledger-live/commit/37f68959c13c69794d734a66c143106f9b446a8f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): reopen the sidebar after an automatic collapse

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23173](https://github.com/LedgerHQ/ledger-live/pull/23173) [`55e5d67`](https://github.com/LedgerHQ/ledger-live/commit/55e5d67e920dbce854c5db338e1fa0b146da5181) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the full Assets column label in a tooltip when it is truncated

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

- [#22938](https://github.com/LedgerHQ/ledger-live/pull/22938) [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519) Thanks [@qperrot](https://github.com/qperrot)! - Rename BNB Chain to BNB Smart Chain

- [#22639](https://github.com/LedgerHQ/ledger-live/pull/22639) [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 9.0.1 and pass a logger to its APIs

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#22418](https://github.com/LedgerHQ/ledger-live/pull/22418) [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E coverage for creating a contact, registering Ethereum addresses on the device and deleting both, and let device intents discover Speculos.

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23246](https://github.com/LedgerHQ/ledger-live/pull/23246) [`71c5860`](https://github.com/LedgerHQ/ledger-live/commit/71c58602037e7dc69e35b99fb648c11e365adcd1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.7.1, `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22387](https://github.com/LedgerHQ/ledger-live/pull/22387) [`3dd4ee2`](https://github.com/LedgerHQ/ledger-live/commit/3dd4ee274f5743d62820d1c37f7b1ac8830bf4ea) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): link the PLT support article from the token list and Receive alert

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22657](https://github.com/LedgerHQ/ledger-live/pull/22657) [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in desktop E2E against the mock server, which keeps the OS available after the device leaves the Ethereum app.

- [#22930](https://github.com/LedgerHQ/ledger-live/pull/22930) [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Ledger Wallet addresses entry at full height in the desktop contact detail on small windows, and let the empty detail scroll with the custom scrollbar (LIVE-38297).

- [#22604](https://github.com/LedgerHQ/ledger-live/pull/22604) [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add an `ab_tests` attribute to desktop and mobile analytics events with the `trackingConfiguration` of each enabled English copy experiment, or `{}` when none applies

- [#22603](https://github.com/LedgerHQ/ledger-live/pull/22603) [`9c0feca`](https://github.com/LedgerHQ/ledger-live/commit/9c0feca47571b81e45c8dc3f0f1132583801ea95) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `feature_copy_*` experiments to the feature flags debug screen so `enabled` and `copy` can be mocked locally

- [#22413](https://github.com/LedgerHQ/ledger-live/pull/22413) [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

  Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
  the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
  write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
  adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
  `genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
  error anywhere.

  Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
  `CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
  bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
  write sites now call, so they can't drift out of sync. Also adds the memo length check
  (`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
  the UI's `maxLength` truncation.

- [#23001](https://github.com/LedgerHQ/ledger-live/pull/23001) [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues Redux slice into `@features/platform-market-countervalues`: its reducer, action creators, initial state, state type and selectors. Both apps now mount `countervaluesReducer` at the same `countervalues` store key and keep their own `useSelector` hooks, persistence, polling and user-settings computation. The action types keep the desktop strings, so mobile's pending, error and wipe actions are now named `COUNTERVALUES_STATE_SET_PENDING`, `COUNTERVALUES_STATE_SET_ERROR` and `COUNTERVALUES_WIPE`. The reducer stays a plain function rather than `createSlice`, because immer would freeze the rate maps that `loadCountervalues` updates in place.

- [#23107](https://github.com/LedgerHQ/ledger-live/pull/23107) [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6) Thanks [@ysitbon](https://github.com/ysitbon)! - Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

  - `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
  - Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
  - Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.

- [#21799](https://github.com/LedgerHQ/ledger-live/pull/21799) [`2c4e8cb`](https://github.com/LedgerHQ/ledger-live/commit/2c4e8cb37989c3fb5e2b986983172d18179f4fe8) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwd): fix modal height on send flow

- [#22722](https://github.com/LedgerHQ/ledger-live/pull/22722) [`03aa2c9`](https://github.com/LedgerHQ/ledger-live/commit/03aa2c92492d3056d04d7e5b7f6e92504771aded) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in Desktop, coin-integration code

- [#22744](https://github.com/LedgerHQ/ledger-live/pull/22744) [`5879819`](https://github.com/LedgerHQ/ledger-live/commit/58798197564fb4a6599ab214a3dde6211af98758) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types and helpers from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Stop setting the USER_ID env on desktop, now that the firmware checks read the user ID from the identities store

- [#22789](https://github.com/LedgerHQ/ledger-live/pull/22789) [`8569110`](https://github.com/LedgerHQ/ledger-live/commit/856911057bd1309ae676157825f46f6277968758) Thanks [@LL782](https://github.com/LL782)! - Remove stale analytics shim mocks and docs

- [#22726](https://github.com/LedgerHQ/ledger-live/pull/22726) [`e21564c`](https://github.com/LedgerHQ/ledger-live/commit/e21564cb145e409a90b18806f8b4acbda0da0aca) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in engagement Desktop code

- [#22724](https://github.com/LedgerHQ/ledger-live/pull/22724) [`46fe382`](https://github.com/LedgerHQ/ledger-live/commit/46fe382b4e7bff37473591e62ae81834ec58da4d) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in live-devices Desktop code

- [#22804](https://github.com/LedgerHQ/ledger-live/pull/22804) [`948cc81`](https://github.com/LedgerHQ/ledger-live/commit/948cc8108b5be9f55a11f1f74705deab442f0069) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): build nightlies against the production Firebase project

  Desktop nightlies compiled the whole `.env.staging`, so they read feature flags from the Firebase
  staging project while mobile nightlies read production. Nightlies keep the staging services (Braze,
  Segment, Earn, Card, Datadog) but now take their `FIREBASE_*` values from `.env.production`.

- [#22859](https://github.com/LedgerHQ/ledger-live/pull/22859) [`c4cf243`](https://github.com/LedgerHQ/ledger-live/commit/c4cf243161fafa9c1a77ec661983e780e505ba87) Thanks [@sarneijim](https://github.com/sarneijim)! - Port device onboarding into desktop DevTools

- [#22727](https://github.com/LedgerHQ/ledger-live/pull/22727) [`5b11a5a`](https://github.com/LedgerHQ/ledger-live/commit/5b11a5ae9e06003fc7bae51b6799eaacedba69c6) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in platform Desktop code

- [#22935](https://github.com/LedgerHQ/ledger-live/pull/22935) [`8e427a6`](https://github.com/LedgerHQ/ledger-live/commit/8e427a6392d28ec9b79c3f805e8da3fb70e13f54) Thanks [@ysitbon](https://github.com/ysitbon)! - Read the countervalues provider and hooks, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react` and live-common, and drop the `@ledgerhq/live-countervalues-react` dependency. The app and the test wrapper now mount the platform provider in place of the old one.

- [#22662](https://github.com/LedgerHQ/ledger-live/pull/22662) [`487620c`](https://github.com/LedgerHQ/ledger-live/commit/487620c67a0ffa66fbcb401fed42bddcc150c24e) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in ptx Desktop code

- [#22725](https://github.com/LedgerHQ/ledger-live/pull/22725) [`a4c1969`](https://github.com/LedgerHQ/ledger-live/commit/a4c19695650db22bcf3bded692bc1e71bd03f785) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in recover-software Desktop code

- [#23012](https://github.com/LedgerHQ/ledger-live/pull/23012) [`1289c30`](https://github.com/LedgerHQ/ledger-live/commit/1289c30bce53f7713e666329818893a11f866277) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the HTTP proxy device transport (`DEVICE_PROXY_URL`) from the desktop app, together with its IPC transport and the `window.lld.transport` bridge. Real devices and Speculos connect from the renderer through the Device Management Kit.

- [#22694](https://github.com/LedgerHQ/ledger-live/pull/22694) [`d9d44dc`](https://github.com/LedgerHQ/ledger-live/commit/d9d44dcb6c7584d9e135c5732eef7ff0f97beb82) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in wallet-xp Desktop code

- [#23219](https://github.com/LedgerHQ/ledger-live/pull/23219) [`c50dc4d`](https://github.com/LedgerHQ/ledger-live/commit/c50dc4d1551af01e4eb9e2fe912608e245ef1ead) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): resizeobserver amount fix

- [#22803](https://github.com/LedgerHQ/ledger-live/pull/22803) [`0e3e7b0`](https://github.com/LedgerHQ/ledger-live/commit/0e3e7b023b7b285a955bb2aabb308d143d47bfba) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): show the Firebase project the build actually targets

  The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
  remote flag, a value set by hand in each Firebase project, so a staging build reported
  `ledger-live-production`. It now reads the project id from the Firebase config bundled in the
  build.

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`c7e76f3`](https://github.com/LedgerHQ/ledger-live/commit/c7e76f3a015cf00cfdb1d057d1eee85ea6e99dc0) Thanks [@ishaba](https://github.com/ishaba)! - fix(babylon): remove pre-selected validator, default to show all

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22591](https://github.com/LedgerHQ/ledger-live/pull/22591) [`828c892`](https://github.com/LedgerHQ/ledger-live/commit/828c892019cab180b5a5024b03dc82987af695b2) Thanks [@sarneijim](https://github.com/sarneijim)! - Apply enabled `feature_copy_*` Remote Config values as English copy overrides, reusing the feature-flag fetch

- [#22913](https://github.com/LedgerHQ/ledger-live/pull/22913) [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate desktop Hedera flows to the generic transaction shape and enable generic adapter

- [#22784](https://github.com/LedgerHQ/ledger-live/pull/22784) [`e72683b`](https://github.com/LedgerHQ/ledger-live/commit/e72683b8ed45df73659811db2ef15a18b4e0927c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22640](https://github.com/LedgerHQ/ledger-live/pull/22640) [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(contacts): stop reading `ethereumLikeInfo` and promote `chainId` from coin config

- [#22779](https://github.com/LedgerHQ/ledger-live/pull/22779) [`9c8a8f3`](https://github.com/LedgerHQ/ledger-live/commit/9c8a8f3c8952094908a8593c5f8894266f22d0a7) Thanks [@KVNLS](https://github.com/KVNLS)! - The desktop app's own device animations are code-split per device model and loaded lazily instead of being read back through a runtime `require()`. The shared pin/continue animations are still bundled with the renderer.

- [#22395](https://github.com/LedgerHQ/ledger-live/pull/22395) [`39d91b6`](https://github.com/LedgerHQ/ledger-live/commit/39d91b68fa8b7ad7625887fee6ff126c131eaf34) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwm

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#23097](https://github.com/LedgerHQ/ledger-live/pull/23097) [`9bffec1`](https://github.com/LedgerHQ/ledger-live/commit/9bffec14b310816bb0091c04f3c220a173de74e8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the updater signature check to `@features/platform-app-update`, so desktop no longer depends on `@noble/curves` directly.

- [#22975](https://github.com/LedgerHQ/ledger-live/pull/22975) [`11cc5fc`](https://github.com/LedgerHQ/ledger-live/commit/11cc5fcefd5c493d15dde20dd60f113211adaacd) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - Fix Market list and coin page showing the Settings currency symbol next to prices fetched in the currency picked from the Market dropdown

- [#22969](https://github.com/LedgerHQ/ledger-live/pull/22969) [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Show the mock server device as a floating window from `@ledgerhq/device-mockserver-react`, replacing the sidebar device screen.

- [#22808](https://github.com/LedgerHQ/ledger-live/pull/22808) [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Upgrade @ledgerhq/coin-evm to version 10.0.0 and remove obsolete gas tracker parameters

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22915](https://github.com/LedgerHQ/ledger-live/pull/22915) [`957f451`](https://github.com/LedgerHQ/ledger-live/commit/957f4516e6446f8179de0021b1c0265ef2bcd615) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Require a genuine-checked device ID before the sync onboarding companion

- [#22695](https://github.com/LedgerHQ/ledger-live/pull/22695) [`570a8a0`](https://github.com/LedgerHQ/ledger-live/commit/570a8a0827e524ae18a7d216263d8ccb5a2c17b8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay tab screen test id and cover the stablecoin balance, filter, and deposit options

- [#22878](https://github.com/LedgerHQ/ledger-live/pull/22878) [`d098cd3`](https://github.com/LedgerHQ/ledger-live/commit/d098cd3ce7f0009de59bab78cba0d8f397bb6b4d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22879](https://github.com/LedgerHQ/ledger-live/pull/22879) [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22876](https://github.com/LedgerHQ/ledger-live/pull/22876) [`d5de868`](https://github.com/LedgerHQ/ledger-live/commit/d5de8686938f48fb517060a23fcba8f54558a2cb) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22910](https://github.com/LedgerHQ/ledger-live/pull/22910) [`177a5b4`](https://github.com/LedgerHQ/ledger-live/commit/177a5b413ca0348c78aca5cbdfca9340355f4b23) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22649](https://github.com/LedgerHQ/ledger-live/pull/22649) [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show a newly linked Card asset when the user comes back to Pay from Baanx.

- [#22877](https://github.com/LedgerHQ/ledger-live/pull/22877) [`f49824c`](https://github.com/LedgerHQ/ledger-live/commit/f49824c51b04078d3715daf6a03f40f046bc3272) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22027](https://github.com/LedgerHQ/ledger-live/pull/22027) [`10e4a67`](https://github.com/LedgerHQ/ledger-live/commit/10e4a67f1aeffc909e8f5153b9720f568140323b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Default the Perps deposit funding account to the USDC account with the highest non-zero spendable balance

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#22766](https://github.com/LedgerHQ/ledger-live/pull/22766) [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22978](https://github.com/LedgerHQ/ledger-live/pull/22978) [`8102f7d`](https://github.com/LedgerHQ/ledger-live/commit/8102f7dab7cea81bd30e74e19a3ee6fce9e47fe0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Close the modular dialog, modals and drawer before handling any deeplink

- [#23114](https://github.com/LedgerHQ/ledger-live/pull/23114) [`bdf552d`](https://github.com/LedgerHQ/ledger-live/commit/bdf552d00d5cd02e392637749d6384c4ff0919e7) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Bump Playwright from 1.60.0 to 1.63.0 and allure-playwright / allure-js-commons from 3.9.0 to 3.13.0

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile

- [#23024](https://github.com/LedgerHQ/ledger-live/pull/23024) [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate desktop Add Account off pre-ldls onto Lumen and remove the React pre-ldls entry

- [#22896](https://github.com/LedgerHQ/ledger-live/pull/22896) [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove unused react-ui components and switch the desktop token list checkbox to Lumen

- [#22830](https://github.com/LedgerHQ/ledger-live/pull/22830) [`8509abf`](https://github.com/LedgerHQ/ledger-live/commit/8509abfd9f96a5e845e9a5e6392081366d31760c) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's application database and device transport (HTTP proxy) access onto the preload bridge (`window.lld.db`, `window.lld.transport`), with one named method per operation. Password attempts against the account database are now throttled in the main process after five consecutive failures.

- [#22831](https://github.com/LedgerHQ/ledger-live/pull/22831) [`fa15dfc`](https://github.com/LedgerHQ/ledger-live/commit/fa15dfcb7c71eeacc13a98a3dd57d5bc5117406a) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the auto-updater and deep-link channels and the remaining renderer IPC onto the preload bridge, in preparation for enabling `contextIsolation`.

  Updater status and deep links are pushed to the renderer through `on*` subscriptions that return an unsubscribe closure. App lifecycle, native dialogs, file operations, the screen-awake blocker and the `lld.json` store writes go through named bridge methods instead of `ipcRenderer`. Channel names and main-side payloads are unchanged.

  With this, the only renderer `ipcRenderer` call left is the Pay card PNG save, which moves onto the bridge with the other save dialogs in the next change. The only other `electron` imports outside main and the preload scripts are the three chokepoints introduced earlier — clipboard, `webFrame` and `shell.openExternal`, none of which are IPC — plus one type-only import.

  Log export now checks whether the save dialog was cancelled. `showSaveDialog` always resolves to an object, so the previous `if (path)` guard was always true and the export ran on cancel, relying on the main process to ignore a cancelled target. The observable behaviour is unchanged; the check now says what it means.

- [#22832](https://github.com/LedgerHQ/ledger-live/pull/22832) [`20dccb1`](https://github.com/LedgerHQ/ledger-live/commit/20dccb15b91c13f1e31a29f34bc4db4762f2bf0b) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's last Electron chokepoints (clipboard, `webFrame`, `shell.openExternal`) onto the preload bridge, and run the save dialogs in the main process. Main now keeps the chosen path for the log export, the operations CSV export and the Pay card PNG save, so the renderer can no longer hand an arbitrary path back to be written. The write handlers return `"saved" | "canceled" | "failed"`, so cancelling an export is no longer reported as an error. Main registers every IPC handler through the shared `CHANNELS` contract.

- [#22829](https://github.com/LedgerHQ/ledger-live/pull/22829) [`8c4ccbe`](https://github.com/LedgerHQ/ledger-live/commit/8c4ccbe0172c4cc1dc08e0384980545819a082c3) Thanks [@KVNLS](https://github.com/KVNLS)! - Prepare the desktop renderer for running without Node integration: remove dead IPC channels and Node-only globals (`global.localStorage`, `setImmediate` in the post-onboarding redirect), replace winston in the renderer with a minimal logger of the same surface, route clipboard, `webFrame`, dialogs and `os` through single-purpose modules, import and export local Live App manifests with a file input and a download instead of the filesystem, and give the dev-only Firebase diagnostic its per-project configs from the build instead of reading `.env` files at runtime. No behaviour change.

- [#22780](https://github.com/LedgerHQ/ledger-live/pull/22780) [`8d10218`](https://github.com/LedgerHQ/ledger-live/commit/8d10218395571eeed1ea4921fbae95b0e8c0ab2d) Thanks [@KVNLS](https://github.com/KVNLS)! - Add an explicit, allow-listed preload bridge (`window.lld`) for the desktop renderer, declared once in `src/bridge/contract.ts` and imported by both sides. Main captures a bootstrap snapshot (env, `os`, paths, distribution channel) that the renderer reads synchronously, `electron-store` moves into the main process, and the Datadog anonymizer reads its paths from the snapshot. The `CARD_SESSION_BOOTSTRAP` credential is kept out of the snapshot and handed over once per page load. The renderer still runs with `nodeIntegration` on; the bridge works in both modes, so this changes no behaviour on its own.

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

- [#22902](https://github.com/LedgerHQ/ledger-live/pull/22902) [`240ce9c`](https://github.com/LedgerHQ/ledger-live/commit/240ce9cae739d97023cd9abebd5470b6dff2ed8d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: replace react-key-handler with an in-house hook for the Ctrl+E logs export shortcut, which behaves the same and drops about 21 MB of dependencies.

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#23183](https://github.com/LedgerHQ/ledger-live/pull/23183) [`271861f`](https://github.com/LedgerHQ/ledger-live/commit/271861f9a26c5a26fe82d0b1ccefd9f339e547d0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): always start fully open after a reload or app restart

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22304](https://github.com/LedgerHQ/ledger-live/pull/22304) [`e11e449`](https://github.com/LedgerHQ/ledger-live/commit/e11e449b3be2cd309d3d22769a8f8ac44422dc7a) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwd

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22710](https://github.com/LedgerHQ/ledger-live/pull/22710) [`da9651f`](https://github.com/LedgerHQ/ledger-live/commit/da9651fa484c969369df12d777003093b0f02d9c) Thanks [@jcchevalier-ledger](https://github.com/jcchevalier-ledger)! - Keep explorer requests on the same Cloudflare load-balancer origin by replaying the `__cflb` affinity cookie

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20) Thanks [@ishaba](https://github.com/ishaba)! - Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22891](https://github.com/LedgerHQ/ledger-live/pull/22891) [`cc764ec`](https://github.com/LedgerHQ/ledger-live/commit/cc764ec269edef9640fb58ff4aa26b70bff8d3c7) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap history from the `swap/history` deeplink, with the swap matching `swapId` opened

- [#23185](https://github.com/LedgerHQ/ledger-live/pull/23185) [`437d666`](https://github.com/LedgerHQ/ledger-live/commit/437d66634fd97401a91637013ceca7d473ea32fb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace @react-native-community/netinfo with expo-network behind the new @shared/network-status package, and use it for the desktop network status

- [#22708](https://github.com/LedgerHQ/ledger-live/pull/22708) [`ad3303b`](https://github.com/LedgerHQ/ledger-live/commit/ad3303b835078606b3d3f87d66879263ed3cddfb) Thanks [@qperrot](https://github.com/qperrot)! - Let the Send flow dialog grow to fit its content so the Review button stays visible with long amount messages

- [#22959](https://github.com/LedgerHQ/ledger-live/pull/22959) [`b46294e`](https://github.com/LedgerHQ/ledger-live/commit/b46294ea1eae6f65647973efc8161b23e31ae668) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(contact): display contact in tx details lwd

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#23223](https://github.com/LedgerHQ/ledger-live/pull/23223) [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): skip association for erc-20 tokens in ReceiveWithAssociationModal and resolve the new association token in the legacy adapter

- [#22818](https://github.com/LedgerHQ/ledger-live/pull/22818) [`c56dcb3`](https://github.com/LedgerHQ/ledger-live/commit/c56dcb3804eb00b1a2d8dc47aa586de28e353e94) Thanks [@ysitbon](https://github.com/ysitbon)! - `useSendAmount` takes the `cryptoCurrency` to convert instead of the `account` holding it. Callers resolve it with `getAccountCurrency` on the same account they passed before, so a token account still converts with its token. The hook no longer imports any account type or helper.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22383](https://github.com/LedgerHQ/ledger-live/pull/22383) [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500) Thanks [@ysitbon](https://github.com/ysitbon)! - Let wallet-pnl declare the countervalues interface it needs

  The package computed profit and loss straight against the countervalues implementation, which
  tied a pure pricing calculation to a concrete state shape. It now declares the three operations
  it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
  `@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
  beside the crypto-assets store and the two lookups already registered there.

  The exported signatures keep their arity and the state argument is assignable as before, so no
  caller needs a change for the interface.

  The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
  history relevant to a pair, which it used to compute inline from three countervalues helpers.
  That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
  `lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
  and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
  and the existing cache tests pin it without being modified.

  The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
  construct countervalues state rather than reading it, so they cannot work against an opaque
  snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
  `@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
  from the entity directly.

  web-tools registers the interface too. It renders profit and loss through the same package but
  was never a consumer of the two lookups registered previously, so it needed wiring of its own.

### Patch Changes

- Updated dependencies [[`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115), [`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636), [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`29b0e0c`](https://github.com/LedgerHQ/ledger-live/commit/29b0e0c324494c21d82f5deb26f6774c3c5aca6f), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced), [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/asset-detail@0.12.0
  - @ledgerhq/transaction-observability@0.5.0
  - @ledgerhq/coin-stacks@0.33.0
  - @ledgerhq/live-common@38.3.0
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0
  - @shared/clipboard@0.1.0
  - @features/flow-pay-card-transactions@0.5.0
  - @features/flow-contacts@0.14.0
  - @features/flow-pay-request@0.8.0
  - @shared/feature-flags@0.26.0
  - @features/flow-contacts-introduction@1.4.0
  - @features/flow-pay-contact@0.6.0
  - @features/flow-pay-balance@0.7.0
  - @ledgerhq/coin-bitcoin@0.55.0
  - @ledgerhq/coin-zcash@0.11.0
  - @domain/entity-currency-crypto@0.15.0
  - @ledgerhq/wallet-btc@0.7.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @domain/api-market-countervalues@0.2.0
  - @domain/entity-market-countervalues@0.3.0
  - @shared/api-services@0.10.0
  - @ledgerhq/coin-cardano@2.0.0
  - @ledgerhq/types-live@6.127.0
  - @shared/env@0.10.0
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/live-dmk-desktop@0.24.0
  - @ledgerhq/device-onboarding@0.5.0
  - @ledgerhq/coin-canton@1.4.0
  - @features/platform-card@0.8.0
  - @features/flow-pay-card-auth@0.10.0
  - @features/platform-content-ab-tests@0.2.0
  - @ledgerhq/coin-cosmos@1.6.0
  - @features/platform-market-countervalues@0.2.0
  - @ledgerhq/asset-aggregation@0.18.0
  - @ledgerhq/wallet-pnl@0.8.0
  - @domain/entity-client-identity@0.3.0
  - @features/platform-feature-flags-firebase@0.1.0
  - @features/platform-feature-flags@0.9.0
  - @domain/api-aggregated-assets@0.6.0
  - @features/flow-pay-feature-tour@0.8.0
  - @devtools/bindings@0.11.0
  - @features/flow-pay-card-details@0.7.0
  - @features/flow-pay-card@0.7.0
  - @ledgerhq/react-ui@0.56.0
  - @features/platform-device-action-content@0.4.0
  - @ledgerhq/coin-filecoin@2.4.0
  - @ledgerhq/live-send@0.1.3
  - @features/flow-contacts-add-address@0.6.2
  - @features/flow-contacts-add-contact@0.7.2
  - @features/flow-contacts-delete-contact@0.2.5
  - @features/flow-contacts-edit-address@0.4.2
  - @features/flow-contacts-edit-contact@0.6.2
  - @features/flow-contacts-list@0.9.1
  - @ledgerhq/live-wallet@1.1.6
  - @features/flow-pay-card-assets@0.3.1
  - @features/flow-large-screen-upsell@2.2.2
  - @features/platform-currencies@0.9.2
  - @domain/api-currency-token@0.6.4
  - @domain/entity-currency@0.4.6
  - @domain/entity-currency-token@0.5.5
  - @ledgerhq/wallet-analytics@0.5.1
  - @ledgerhq/coin-casper@3.5.1
  - @ledgerhq/coin-concordium@1.5.1
  - @ledgerhq/live-signer-evm@0.24.1
  - @domain/api-card-management@0.8.1
  - @domain/api-currency-fiat@0.4.7
  - @domain/api-market-index-altcoin-season@0.4.1
  - @domain/api-market-index-fear-and-greed@0.4.1
  - @domain/api-push-devices@0.2.8
  - @features/platform-aggregated-assets@0.5.6
  - @features/platform-env@0.4.2
  - @ledgerhq/live-signer-tron@0.2.1
  - @features/flow-analytics-consent@0.2.9
  - @shared/analytics@0.4.0
  - @shared/analytics-react@0.4.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/linking@0.3.0
  - @shared/lottie@0.0.0
  - @shared/network-status@0.0.0
  - @shared/ui-info-state@0.4.0
  - @features/flow-pay-card-widget@0.5.1
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-alias@0.1.0
  - @domain/entity-account-name@0.2.2
  - @domain/entity-analytics-consent@0.2.2
  - @domain/entity-card-asset-mapping@0.7.0
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-starred-account@0.0.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/platform-app-update@0.0.0
  - @features/platform-device-intent@5.2.0
  - @features/platform-pay-analytics@0.3.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/ethereum-provider@0.8.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/types-devices@7.1.0
  - @devtools/shell@0.10.2

## 4.24.0-next.1

### Minor Changes

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/live-common@38.3.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/asset-detail@0.12.0-next.1
  - @ledgerhq/live-dmk-desktop@0.24.0-next.1
  - @ledgerhq/live-send@0.1.3-next.1
  - @ledgerhq/asset-aggregation@0.18.0-next.1
  - @ledgerhq/coin-bitcoin@0.55.0-next.1
  - @ledgerhq/coin-canton@1.4.0-next.1
  - @ledgerhq/coin-cardano@2.0.0-next.1
  - @ledgerhq/coin-casper@3.5.1-next.1
  - @ledgerhq/coin-concordium@1.5.1-next.1
  - @ledgerhq/coin-cosmos@1.6.0-next.1
  - @ledgerhq/coin-filecoin@2.4.0-next.1
  - @ledgerhq/coin-stacks@0.33.0-next.1
  - @ledgerhq/coin-zcash@0.11.0-next.1
  - @ledgerhq/live-signer-evm@0.24.1-next.1
  - @ledgerhq/live-wallet@1.1.6-next.1
  - @ledgerhq/wallet-analytics@0.5.1-next.1
  - @ledgerhq/wallet-pnl@0.8.0-next.1
  - @ledgerhq/wallet-btc@0.7.0-next.0

## 4.24.0-next.0

### Minor Changes

- [#23017](https://github.com/LedgerHQ/ledger-live/pull/23017) [`eaff720`](https://github.com/LedgerHQ/ledger-live/commit/eaff72056535cd3d78ac4b0266fa9933b54c9a6e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a concise message when adding an account fails because the provider returns a server or network error

- [#22909](https://github.com/LedgerHQ/ledger-live/pull/22909) [`29ead28`](https://github.com/LedgerHQ/ledger-live/commit/29ead2847f8227440eb1752984068a85cd0ab51e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(add-account): allow creating other BTC address types when the existing account is empty

- [#22981](https://github.com/LedgerHQ/ledger-live/pull/22981) [`3faf47c`](https://github.com/LedgerHQ/ledger-live/commit/3faf47c8c7d8daecb352f7dd32ef72c8d064ba0e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Rename the market banner "View all" tile to "More" so it no longer gets cropped in longer languages.

- [#22971](https://github.com/LedgerHQ/ledger-live/pull/22971) [`f8a4b3e`](https://github.com/LedgerHQ/ledger-live/commit/f8a4b3e5f6e68cd507c74b7538247e0e5efc7a3a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(top-bar): keep a minimum width for the search and truncate the update pills on narrow windows

- [#23139](https://github.com/LedgerHQ/ledger-live/pull/23139) [`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve the market id of an asset from the ledger ids when needed, so favorites added from search show up in the Market banner

- [#22519](https://github.com/LedgerHQ/ledger-live/pull/22519) [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add desktop stake and unstake flows

  coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

  coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23143](https://github.com/LedgerHQ/ledger-live/pull/23143) [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - refactor(contacts): clean up the Contacts debug tools

  The send-history contacts builder was copied in both apps. It now lives once in
  `@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
  adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
  desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
  value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
  drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#23182](https://github.com/LedgerHQ/ledger-live/pull/23182) [`0d31c6b`](https://github.com/LedgerHQ/ledger-live/commit/0d31c6b7e2b5cf09376d1e59fe025be5968ae560) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap from Market only after the user has picked the network and account to swap from, whenever they hold an account on any of the asset's networks.

- [#22904](https://github.com/LedgerHQ/ledger-live/pull/22904) [`1696c5d`](https://github.com/LedgerHQ/ledger-live/commit/1696c5dd3149b658d71a51470ba1a723e1cff940) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wrap Analytics PnL cards and balance header on narrow windows instead of overflowing horizontally

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#22920](https://github.com/LedgerHQ/ledger-live/pull/22920) [`c45454e`](https://github.com/LedgerHQ/ledger-live/commit/c45454e9d53bdb7fc8632dbe857a2cc80fac8aa6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(errors): stop reporting DMK and empty errors as TranslatedError invalid usage

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23053](https://github.com/LedgerHQ/ledger-live/pull/23053) [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show each stablecoin as its own Pay balance filter option, including testnet holdings

- [#22988](https://github.com/LedgerHQ/ledger-live/pull/22988) [`7cfa427`](https://github.com/LedgerHQ/ledger-live/commit/7cfa427f8df0405cf6499657cbe3d5957d1e3509) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(crypto-addresses): keep the rename dialog open while accounts sync or countervalues refresh

- [#23172](https://github.com/LedgerHQ/ledger-live/pull/23172) [`37f6895`](https://github.com/LedgerHQ/ledger-live/commit/37f68959c13c69794d734a66c143106f9b446a8f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): reopen the sidebar after an automatic collapse

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23173](https://github.com/LedgerHQ/ledger-live/pull/23173) [`55e5d67`](https://github.com/LedgerHQ/ledger-live/commit/55e5d67e920dbce854c5db338e1fa0b146da5181) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the full Assets column label in a tooltip when it is truncated

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

- [#22938](https://github.com/LedgerHQ/ledger-live/pull/22938) [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519) Thanks [@qperrot](https://github.com/qperrot)! - Rename BNB Chain to BNB Smart Chain

- [#22639](https://github.com/LedgerHQ/ledger-live/pull/22639) [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 9.0.1 and pass a logger to its APIs

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#22418](https://github.com/LedgerHQ/ledger-live/pull/22418) [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E coverage for creating a contact, registering Ethereum addresses on the device and deleting both, and let device intents discover Speculos.

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23246](https://github.com/LedgerHQ/ledger-live/pull/23246) [`71c5860`](https://github.com/LedgerHQ/ledger-live/commit/71c58602037e7dc69e35b99fb648c11e365adcd1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.7.1, `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22387](https://github.com/LedgerHQ/ledger-live/pull/22387) [`3dd4ee2`](https://github.com/LedgerHQ/ledger-live/commit/3dd4ee274f5743d62820d1c37f7b1ac8830bf4ea) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): link the PLT support article from the token list and Receive alert

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22657](https://github.com/LedgerHQ/ledger-live/pull/22657) [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in desktop E2E against the mock server, which keeps the OS available after the device leaves the Ethereum app.

- [#22930](https://github.com/LedgerHQ/ledger-live/pull/22930) [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Ledger Wallet addresses entry at full height in the desktop contact detail on small windows, and let the empty detail scroll with the custom scrollbar (LIVE-38297).

- [#22604](https://github.com/LedgerHQ/ledger-live/pull/22604) [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add an `ab_tests` attribute to desktop and mobile analytics events with the `trackingConfiguration` of each enabled English copy experiment, or `{}` when none applies

- [#22603](https://github.com/LedgerHQ/ledger-live/pull/22603) [`9c0feca`](https://github.com/LedgerHQ/ledger-live/commit/9c0feca47571b81e45c8dc3f0f1132583801ea95) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `feature_copy_*` experiments to the feature flags debug screen so `enabled` and `copy` can be mocked locally

- [#22413](https://github.com/LedgerHQ/ledger-live/pull/22413) [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

  Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
  the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
  write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
  adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
  `genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
  error anywhere.

  Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
  `CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
  bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
  write sites now call, so they can't drift out of sync. Also adds the memo length check
  (`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
  the UI's `maxLength` truncation.

- [#23001](https://github.com/LedgerHQ/ledger-live/pull/23001) [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues Redux slice into `@features/platform-market-countervalues`: its reducer, action creators, initial state, state type and selectors. Both apps now mount `countervaluesReducer` at the same `countervalues` store key and keep their own `useSelector` hooks, persistence, polling and user-settings computation. The action types keep the desktop strings, so mobile's pending, error and wipe actions are now named `COUNTERVALUES_STATE_SET_PENDING`, `COUNTERVALUES_STATE_SET_ERROR` and `COUNTERVALUES_WIPE`. The reducer stays a plain function rather than `createSlice`, because immer would freeze the rate maps that `loadCountervalues` updates in place.

- [#23107](https://github.com/LedgerHQ/ledger-live/pull/23107) [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6) Thanks [@ysitbon](https://github.com/ysitbon)! - Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

  - `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
  - Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
  - Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.

- [#21799](https://github.com/LedgerHQ/ledger-live/pull/21799) [`2c4e8cb`](https://github.com/LedgerHQ/ledger-live/commit/2c4e8cb37989c3fb5e2b986983172d18179f4fe8) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwd): fix modal height on send flow

- [#22722](https://github.com/LedgerHQ/ledger-live/pull/22722) [`03aa2c9`](https://github.com/LedgerHQ/ledger-live/commit/03aa2c92492d3056d04d7e5b7f6e92504771aded) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in Desktop, coin-integration code

- [#22744](https://github.com/LedgerHQ/ledger-live/pull/22744) [`5879819`](https://github.com/LedgerHQ/ledger-live/commit/58798197564fb4a6599ab214a3dde6211af98758) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types and helpers from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Stop setting the USER_ID env on desktop, now that the firmware checks read the user ID from the identities store

- [#22789](https://github.com/LedgerHQ/ledger-live/pull/22789) [`8569110`](https://github.com/LedgerHQ/ledger-live/commit/856911057bd1309ae676157825f46f6277968758) Thanks [@LL782](https://github.com/LL782)! - Remove stale analytics shim mocks and docs

- [#22726](https://github.com/LedgerHQ/ledger-live/pull/22726) [`e21564c`](https://github.com/LedgerHQ/ledger-live/commit/e21564cb145e409a90b18806f8b4acbda0da0aca) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in engagement Desktop code

- [#22724](https://github.com/LedgerHQ/ledger-live/pull/22724) [`46fe382`](https://github.com/LedgerHQ/ledger-live/commit/46fe382b4e7bff37473591e62ae81834ec58da4d) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in live-devices Desktop code

- [#22804](https://github.com/LedgerHQ/ledger-live/pull/22804) [`948cc81`](https://github.com/LedgerHQ/ledger-live/commit/948cc8108b5be9f55a11f1f74705deab442f0069) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): build nightlies against the production Firebase project

  Desktop nightlies compiled the whole `.env.staging`, so they read feature flags from the Firebase
  staging project while mobile nightlies read production. Nightlies keep the staging services (Braze,
  Segment, Earn, Card, Datadog) but now take their `FIREBASE_*` values from `.env.production`.

- [#22859](https://github.com/LedgerHQ/ledger-live/pull/22859) [`c4cf243`](https://github.com/LedgerHQ/ledger-live/commit/c4cf243161fafa9c1a77ec661983e780e505ba87) Thanks [@sarneijim](https://github.com/sarneijim)! - Port device onboarding into desktop DevTools

- [#22727](https://github.com/LedgerHQ/ledger-live/pull/22727) [`5b11a5a`](https://github.com/LedgerHQ/ledger-live/commit/5b11a5ae9e06003fc7bae51b6799eaacedba69c6) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in platform Desktop code

- [#22935](https://github.com/LedgerHQ/ledger-live/pull/22935) [`8e427a6`](https://github.com/LedgerHQ/ledger-live/commit/8e427a6392d28ec9b79c3f805e8da3fb70e13f54) Thanks [@ysitbon](https://github.com/ysitbon)! - Read the countervalues provider and hooks, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react` and live-common, and drop the `@ledgerhq/live-countervalues-react` dependency. The app and the test wrapper now mount the platform provider in place of the old one.

- [#22662](https://github.com/LedgerHQ/ledger-live/pull/22662) [`487620c`](https://github.com/LedgerHQ/ledger-live/commit/487620c67a0ffa66fbcb401fed42bddcc150c24e) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in ptx Desktop code

- [#22725](https://github.com/LedgerHQ/ledger-live/pull/22725) [`a4c1969`](https://github.com/LedgerHQ/ledger-live/commit/a4c19695650db22bcf3bded692bc1e71bd03f785) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in recover-software Desktop code

- [#23012](https://github.com/LedgerHQ/ledger-live/pull/23012) [`1289c30`](https://github.com/LedgerHQ/ledger-live/commit/1289c30bce53f7713e666329818893a11f866277) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the HTTP proxy device transport (`DEVICE_PROXY_URL`) from the desktop app, together with its IPC transport and the `window.lld.transport` bridge. Real devices and Speculos connect from the renderer through the Device Management Kit.

- [#22694](https://github.com/LedgerHQ/ledger-live/pull/22694) [`d9d44dc`](https://github.com/LedgerHQ/ledger-live/commit/d9d44dcb6c7584d9e135c5732eef7ff0f97beb82) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in wallet-xp Desktop code

- [#23219](https://github.com/LedgerHQ/ledger-live/pull/23219) [`c50dc4d`](https://github.com/LedgerHQ/ledger-live/commit/c50dc4d1551af01e4eb9e2fe912608e245ef1ead) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): resizeobserver amount fix

- [#22803](https://github.com/LedgerHQ/ledger-live/pull/22803) [`0e3e7b0`](https://github.com/LedgerHQ/ledger-live/commit/0e3e7b023b7b285a955bb2aabb308d143d47bfba) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): show the Firebase project the build actually targets

  The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
  remote flag, a value set by hand in each Firebase project, so a staging build reported
  `ledger-live-production`. It now reads the project id from the Firebase config bundled in the
  build.

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`c7e76f3`](https://github.com/LedgerHQ/ledger-live/commit/c7e76f3a015cf00cfdb1d057d1eee85ea6e99dc0) Thanks [@ishaba](https://github.com/ishaba)! - fix(babylon): remove pre-selected validator, default to show all

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22591](https://github.com/LedgerHQ/ledger-live/pull/22591) [`828c892`](https://github.com/LedgerHQ/ledger-live/commit/828c892019cab180b5a5024b03dc82987af695b2) Thanks [@sarneijim](https://github.com/sarneijim)! - Apply enabled `feature_copy_*` Remote Config values as English copy overrides, reusing the feature-flag fetch

- [#22913](https://github.com/LedgerHQ/ledger-live/pull/22913) [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate desktop Hedera flows to the generic transaction shape and enable generic adapter

- [#22784](https://github.com/LedgerHQ/ledger-live/pull/22784) [`e72683b`](https://github.com/LedgerHQ/ledger-live/commit/e72683b8ed45df73659811db2ef15a18b4e0927c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22640](https://github.com/LedgerHQ/ledger-live/pull/22640) [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(contacts): stop reading `ethereumLikeInfo` and promote `chainId` from coin config

- [#22779](https://github.com/LedgerHQ/ledger-live/pull/22779) [`9c8a8f3`](https://github.com/LedgerHQ/ledger-live/commit/9c8a8f3c8952094908a8593c5f8894266f22d0a7) Thanks [@KVNLS](https://github.com/KVNLS)! - The desktop app's own device animations are code-split per device model and loaded lazily instead of being read back through a runtime `require()`. The shared pin/continue animations are still bundled with the renderer.

- [#22395](https://github.com/LedgerHQ/ledger-live/pull/22395) [`39d91b6`](https://github.com/LedgerHQ/ledger-live/commit/39d91b68fa8b7ad7625887fee6ff126c131eaf34) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwm

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#23097](https://github.com/LedgerHQ/ledger-live/pull/23097) [`9bffec1`](https://github.com/LedgerHQ/ledger-live/commit/9bffec14b310816bb0091c04f3c220a173de74e8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the updater signature check to `@features/platform-app-update`, so desktop no longer depends on `@noble/curves` directly.

- [#22975](https://github.com/LedgerHQ/ledger-live/pull/22975) [`11cc5fc`](https://github.com/LedgerHQ/ledger-live/commit/11cc5fcefd5c493d15dde20dd60f113211adaacd) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - Fix Market list and coin page showing the Settings currency symbol next to prices fetched in the currency picked from the Market dropdown

- [#22969](https://github.com/LedgerHQ/ledger-live/pull/22969) [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Show the mock server device as a floating window from `@ledgerhq/device-mockserver-react`, replacing the sidebar device screen.

- [#22808](https://github.com/LedgerHQ/ledger-live/pull/22808) [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Upgrade @ledgerhq/coin-evm to version 10.0.0 and remove obsolete gas tracker parameters

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22915](https://github.com/LedgerHQ/ledger-live/pull/22915) [`957f451`](https://github.com/LedgerHQ/ledger-live/commit/957f4516e6446f8179de0021b1c0265ef2bcd615) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Require a genuine-checked device ID before the sync onboarding companion

- [#22695](https://github.com/LedgerHQ/ledger-live/pull/22695) [`570a8a0`](https://github.com/LedgerHQ/ledger-live/commit/570a8a0827e524ae18a7d216263d8ccb5a2c17b8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay tab screen test id and cover the stablecoin balance, filter, and deposit options

- [#22878](https://github.com/LedgerHQ/ledger-live/pull/22878) [`d098cd3`](https://github.com/LedgerHQ/ledger-live/commit/d098cd3ce7f0009de59bab78cba0d8f397bb6b4d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22879](https://github.com/LedgerHQ/ledger-live/pull/22879) [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22876](https://github.com/LedgerHQ/ledger-live/pull/22876) [`d5de868`](https://github.com/LedgerHQ/ledger-live/commit/d5de8686938f48fb517060a23fcba8f54558a2cb) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22910](https://github.com/LedgerHQ/ledger-live/pull/22910) [`177a5b4`](https://github.com/LedgerHQ/ledger-live/commit/177a5b413ca0348c78aca5cbdfca9340355f4b23) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22649](https://github.com/LedgerHQ/ledger-live/pull/22649) [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show a newly linked Card asset when the user comes back to Pay from Baanx.

- [#22877](https://github.com/LedgerHQ/ledger-live/pull/22877) [`f49824c`](https://github.com/LedgerHQ/ledger-live/commit/f49824c51b04078d3715daf6a03f40f046bc3272) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22027](https://github.com/LedgerHQ/ledger-live/pull/22027) [`10e4a67`](https://github.com/LedgerHQ/ledger-live/commit/10e4a67f1aeffc909e8f5153b9720f568140323b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Default the Perps deposit funding account to the USDC account with the highest non-zero spendable balance

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#22766](https://github.com/LedgerHQ/ledger-live/pull/22766) [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22978](https://github.com/LedgerHQ/ledger-live/pull/22978) [`8102f7d`](https://github.com/LedgerHQ/ledger-live/commit/8102f7dab7cea81bd30e74e19a3ee6fce9e47fe0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Close the modular dialog, modals and drawer before handling any deeplink

- [#23114](https://github.com/LedgerHQ/ledger-live/pull/23114) [`bdf552d`](https://github.com/LedgerHQ/ledger-live/commit/bdf552d00d5cd02e392637749d6384c4ff0919e7) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Bump Playwright from 1.60.0 to 1.63.0 and allure-playwright / allure-js-commons from 3.9.0 to 3.13.0

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile

- [#23024](https://github.com/LedgerHQ/ledger-live/pull/23024) [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate desktop Add Account off pre-ldls onto Lumen and remove the React pre-ldls entry

- [#22896](https://github.com/LedgerHQ/ledger-live/pull/22896) [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove unused react-ui components and switch the desktop token list checkbox to Lumen

- [#22830](https://github.com/LedgerHQ/ledger-live/pull/22830) [`8509abf`](https://github.com/LedgerHQ/ledger-live/commit/8509abfd9f96a5e845e9a5e6392081366d31760c) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's application database and device transport (HTTP proxy) access onto the preload bridge (`window.lld.db`, `window.lld.transport`), with one named method per operation. Password attempts against the account database are now throttled in the main process after five consecutive failures.

- [#22831](https://github.com/LedgerHQ/ledger-live/pull/22831) [`fa15dfc`](https://github.com/LedgerHQ/ledger-live/commit/fa15dfcb7c71eeacc13a98a3dd57d5bc5117406a) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the auto-updater and deep-link channels and the remaining renderer IPC onto the preload bridge, in preparation for enabling `contextIsolation`.

  Updater status and deep links are pushed to the renderer through `on*` subscriptions that return an unsubscribe closure. App lifecycle, native dialogs, file operations, the screen-awake blocker and the `lld.json` store writes go through named bridge methods instead of `ipcRenderer`. Channel names and main-side payloads are unchanged.

  With this, the only renderer `ipcRenderer` call left is the Pay card PNG save, which moves onto the bridge with the other save dialogs in the next change. The only other `electron` imports outside main and the preload scripts are the three chokepoints introduced earlier — clipboard, `webFrame` and `shell.openExternal`, none of which are IPC — plus one type-only import.

  Log export now checks whether the save dialog was cancelled. `showSaveDialog` always resolves to an object, so the previous `if (path)` guard was always true and the export ran on cancel, relying on the main process to ignore a cancelled target. The observable behaviour is unchanged; the check now says what it means.

- [#22832](https://github.com/LedgerHQ/ledger-live/pull/22832) [`20dccb1`](https://github.com/LedgerHQ/ledger-live/commit/20dccb15b91c13f1e31a29f34bc4db4762f2bf0b) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's last Electron chokepoints (clipboard, `webFrame`, `shell.openExternal`) onto the preload bridge, and run the save dialogs in the main process. Main now keeps the chosen path for the log export, the operations CSV export and the Pay card PNG save, so the renderer can no longer hand an arbitrary path back to be written. The write handlers return `"saved" | "canceled" | "failed"`, so cancelling an export is no longer reported as an error. Main registers every IPC handler through the shared `CHANNELS` contract.

- [#22829](https://github.com/LedgerHQ/ledger-live/pull/22829) [`8c4ccbe`](https://github.com/LedgerHQ/ledger-live/commit/8c4ccbe0172c4cc1dc08e0384980545819a082c3) Thanks [@KVNLS](https://github.com/KVNLS)! - Prepare the desktop renderer for running without Node integration: remove dead IPC channels and Node-only globals (`global.localStorage`, `setImmediate` in the post-onboarding redirect), replace winston in the renderer with a minimal logger of the same surface, route clipboard, `webFrame`, dialogs and `os` through single-purpose modules, import and export local Live App manifests with a file input and a download instead of the filesystem, and give the dev-only Firebase diagnostic its per-project configs from the build instead of reading `.env` files at runtime. No behaviour change.

- [#22780](https://github.com/LedgerHQ/ledger-live/pull/22780) [`8d10218`](https://github.com/LedgerHQ/ledger-live/commit/8d10218395571eeed1ea4921fbae95b0e8c0ab2d) Thanks [@KVNLS](https://github.com/KVNLS)! - Add an explicit, allow-listed preload bridge (`window.lld`) for the desktop renderer, declared once in `src/bridge/contract.ts` and imported by both sides. Main captures a bootstrap snapshot (env, `os`, paths, distribution channel) that the renderer reads synchronously, `electron-store` moves into the main process, and the Datadog anonymizer reads its paths from the snapshot. The `CARD_SESSION_BOOTSTRAP` credential is kept out of the snapshot and handed over once per page load. The renderer still runs with `nodeIntegration` on; the bridge works in both modes, so this changes no behaviour on its own.

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

- [#22902](https://github.com/LedgerHQ/ledger-live/pull/22902) [`240ce9c`](https://github.com/LedgerHQ/ledger-live/commit/240ce9cae739d97023cd9abebd5470b6dff2ed8d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: replace react-key-handler with an in-house hook for the Ctrl+E logs export shortcut, which behaves the same and drops about 21 MB of dependencies.

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#23183](https://github.com/LedgerHQ/ledger-live/pull/23183) [`271861f`](https://github.com/LedgerHQ/ledger-live/commit/271861f9a26c5a26fe82d0b1ccefd9f339e547d0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): always start fully open after a reload or app restart

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22304](https://github.com/LedgerHQ/ledger-live/pull/22304) [`e11e449`](https://github.com/LedgerHQ/ledger-live/commit/e11e449b3be2cd309d3d22769a8f8ac44422dc7a) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwd

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22710](https://github.com/LedgerHQ/ledger-live/pull/22710) [`da9651f`](https://github.com/LedgerHQ/ledger-live/commit/da9651fa484c969369df12d777003093b0f02d9c) Thanks [@jcchevalier-ledger](https://github.com/jcchevalier-ledger)! - Keep explorer requests on the same Cloudflare load-balancer origin by replaying the `__cflb` affinity cookie

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20) Thanks [@ishaba](https://github.com/ishaba)! - Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22891](https://github.com/LedgerHQ/ledger-live/pull/22891) [`cc764ec`](https://github.com/LedgerHQ/ledger-live/commit/cc764ec269edef9640fb58ff4aa26b70bff8d3c7) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap history from the `swap/history` deeplink, with the swap matching `swapId` opened

- [#23185](https://github.com/LedgerHQ/ledger-live/pull/23185) [`437d666`](https://github.com/LedgerHQ/ledger-live/commit/437d66634fd97401a91637013ceca7d473ea32fb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace @react-native-community/netinfo with expo-network behind the new @shared/network-status package, and use it for the desktop network status

- [#22708](https://github.com/LedgerHQ/ledger-live/pull/22708) [`ad3303b`](https://github.com/LedgerHQ/ledger-live/commit/ad3303b835078606b3d3f87d66879263ed3cddfb) Thanks [@qperrot](https://github.com/qperrot)! - Let the Send flow dialog grow to fit its content so the Review button stays visible with long amount messages

- [#22959](https://github.com/LedgerHQ/ledger-live/pull/22959) [`b46294e`](https://github.com/LedgerHQ/ledger-live/commit/b46294ea1eae6f65647973efc8161b23e31ae668) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(contact): display contact in tx details lwd

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#23223](https://github.com/LedgerHQ/ledger-live/pull/23223) [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): skip association for erc-20 tokens in ReceiveWithAssociationModal and resolve the new association token in the legacy adapter

- [#22818](https://github.com/LedgerHQ/ledger-live/pull/22818) [`c56dcb3`](https://github.com/LedgerHQ/ledger-live/commit/c56dcb3804eb00b1a2d8dc47aa586de28e353e94) Thanks [@ysitbon](https://github.com/ysitbon)! - `useSendAmount` takes the `cryptoCurrency` to convert instead of the `account` holding it. Callers resolve it with `getAccountCurrency` on the same account they passed before, so a token account still converts with its token. The hook no longer imports any account type or helper.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22383](https://github.com/LedgerHQ/ledger-live/pull/22383) [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500) Thanks [@ysitbon](https://github.com/ysitbon)! - Let wallet-pnl declare the countervalues interface it needs

  The package computed profit and loss straight against the countervalues implementation, which
  tied a pure pricing calculation to a concrete state shape. It now declares the three operations
  it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
  `@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
  beside the crypto-assets store and the two lookups already registered there.

  The exported signatures keep their arity and the state argument is assignable as before, so no
  caller needs a change for the interface.

  The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
  history relevant to a pair, which it used to compute inline from three countervalues helpers.
  That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
  `lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
  and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
  and the existing cache tests pin it without being modified.

  The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
  construct countervalues state rather than reading it, so they cannot work against an opaque
  snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
  `@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
  from the entity directly.

  web-tools registers the interface too. It renders profit and loss through the same package but
  was never a consumer of the two lookups registered previously, so it needed wiring of its own.

### Patch Changes

- Updated dependencies [[`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115), [`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636), [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`29b0e0c`](https://github.com/LedgerHQ/ledger-live/commit/29b0e0c324494c21d82f5deb26f6774c3c5aca6f), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced), [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/asset-detail@0.12.0-next.0
  - @ledgerhq/transaction-observability@0.5.0-next.0
  - @ledgerhq/coin-stacks@0.33.0-next.0
  - @ledgerhq/live-common@38.3.0-next.0
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0
  - @shared/clipboard@0.1.0-next.0
  - @features/flow-pay-card-transactions@0.5.0-next.0
  - @features/flow-contacts@0.14.0-next.0
  - @features/flow-pay-request@0.8.0-next.0
  - @shared/feature-flags@0.26.0-next.0
  - @features/flow-contacts-introduction@1.4.0-next.0
  - @features/flow-pay-contact@0.6.0-next.0
  - @features/flow-pay-balance@0.7.0-next.0
  - @ledgerhq/coin-bitcoin@0.55.0-next.0
  - @ledgerhq/coin-zcash@0.11.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @ledgerhq/wallet-btc@0.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @domain/api-market-countervalues@0.2.0-next.0
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @shared/api-services@0.10.0-next.0
  - @ledgerhq/coin-cardano@2.0.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @shared/env@0.10.0-next.0
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/live-dmk-desktop@0.24.0-next.0
  - @ledgerhq/device-onboarding@0.5.0-next.0
  - @ledgerhq/coin-canton@1.4.0-next.0
  - @features/platform-card@0.8.0-next.0
  - @features/flow-pay-card-auth@0.10.0-next.0
  - @features/platform-content-ab-tests@0.2.0-next.0
  - @ledgerhq/coin-cosmos@1.6.0-next.0
  - @features/platform-market-countervalues@0.2.0-next.0
  - @ledgerhq/asset-aggregation@0.18.0-next.0
  - @ledgerhq/wallet-pnl@0.8.0-next.0
  - @domain/entity-client-identity@0.3.0-next.0
  - @features/platform-feature-flags-firebase@0.1.0-next.0
  - @features/platform-feature-flags@0.9.0-next.0
  - @domain/api-aggregated-assets@0.6.0-next.0
  - @features/flow-pay-feature-tour@0.8.0-next.0
  - @devtools/bindings@0.11.0-next.0
  - @features/flow-pay-card-details@0.7.0-next.0
  - @features/flow-pay-card@0.7.0-next.0
  - @ledgerhq/react-ui@0.56.0-next.0
  - @features/platform-device-action-content@0.4.0-next.0
  - @ledgerhq/coin-filecoin@2.4.0-next.0
  - @ledgerhq/live-send@0.1.3-next.0
  - @features/flow-contacts-add-address@0.6.2-next.0
  - @features/flow-contacts-add-contact@0.7.2-next.0
  - @features/flow-contacts-delete-contact@0.2.5-next.0
  - @features/flow-contacts-edit-address@0.4.2-next.0
  - @features/flow-contacts-edit-contact@0.6.2-next.0
  - @features/flow-contacts-list@0.9.1-next.0
  - @ledgerhq/live-wallet@1.1.6-next.0
  - @features/flow-pay-card-assets@0.3.1-next.0
  - @features/flow-large-screen-upsell@2.2.2-next.0
  - @features/platform-currencies@0.9.2-next.0
  - @domain/api-currency-token@0.6.4-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @domain/entity-currency-token@0.5.5-next.0
  - @ledgerhq/wallet-analytics@0.5.1-next.0
  - @ledgerhq/coin-casper@3.5.1-next.0
  - @ledgerhq/coin-concordium@1.5.1-next.0
  - @ledgerhq/live-signer-evm@0.24.1-next.0
  - @domain/api-card-management@0.8.1-next.0
  - @domain/api-currency-fiat@0.4.7-next.0
  - @domain/api-market-index-altcoin-season@0.4.1-next.0
  - @domain/api-market-index-fear-and-greed@0.4.1-next.0
  - @domain/api-push-devices@0.2.8-next.0
  - @features/platform-aggregated-assets@0.5.6-next.0
  - @features/platform-env@0.4.2-next.0
  - @ledgerhq/live-signer-tron@0.2.1-next.0
  - @features/flow-analytics-consent@0.2.9-next.0
  - @shared/analytics@0.4.0
  - @shared/analytics-react@0.4.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/linking@0.3.0
  - @shared/lottie@0.0.0
  - @shared/network-status@0.0.0
  - @shared/ui-info-state@0.4.0
  - @features/flow-pay-card-widget@0.5.1-next.0
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-alias@0.1.0
  - @domain/entity-account-name@0.2.2
  - @domain/entity-analytics-consent@0.2.2
  - @domain/entity-card-asset-mapping@0.7.0
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-starred-account@0.0.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/platform-app-update@0.0.0
  - @features/platform-device-intent@5.2.0
  - @features/platform-pay-analytics@0.3.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/ethereum-provider@0.8.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/types-devices@7.1.0
  - @devtools/shell@0.10.2-next.0

## 4.23.0

### Minor Changes

- [#22217](https://github.com/LedgerHQ/ledger-live/pull/22217) [`63960b1`](https://github.com/LedgerHQ/ledger-live/commit/63960b12982ace30544a058c3128a13046f0bddb) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix the Swap receive field staying empty when reaching Swap from the Earn no-funds screen. Desktop now always identifies a token by `toTokenId` (plus its `toToken` alias), which `toCurrencyId` alone could not do; mobile passed no parameters at all and now forwards the asset. On both, an account the Earn live app synthesised for a token the user does not hold is no longer sent as an unresolvable id

- [#22404](https://github.com/LedgerHQ/ledger-live/pull/22404) [`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the card cashback banner from `GET /v1/card/cashback`

  - Add `getCardCashback` endpoint, resolving the asset's `currency`/`network` pair (both nullable) to its `ledgerId`
  - Remove `getRewardWallet` (`GET /v1/wallet/reward`), its schema, types, mock and handlers
  - `useCardCashback` replaces `useCardRewardWallet` in the reward banner
  - Banner subtitle now shows the rate and ticker: "Total cashback · 1% in BTC"
  - `cardRewardsAvailable` / `cardRewardCurrency` analytics now read the cashback (amount > 0)

- [#22450](https://github.com/LedgerHQ/ledger-live/pull/22450) [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(i18n): keep Thai selected across app restarts

  Removes the `llmThai` / `lldThai` feature flags. Flags resolve on their `enabled: false` default
  until the first remote fetch settles, so on every cold start the locale guard saw Thai as
  unsupported and persisted English over the user's choice.

- [#22840](https://github.com/LedgerHQ/ledger-live/pull/22840) [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#22634](https://github.com/LedgerHQ/ledger-live/pull/22634) [`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - fix(aleo): keep the newer public and private sync fields when both syncs overlap

- [#22381](https://github.com/LedgerHQ/ledger-live/pull/22381) [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db) Thanks [@ysitbon](https://github.com/ysitbon)! - Rename `@domain/api-market-sentiment` to `@domain/api-market-index-fear-and-greed`, and its exported api from `marketSentimentApi` to `fearAndGreedApi`, so the name states which CoinMarketCap index the package serves

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22567](https://github.com/LedgerHQ/ledger-live/pull/22567) [`3ee4143`](https://github.com/LedgerHQ/ledger-live/commit/3ee4143819b419d07642d06f073d0019ebfc5dca) Thanks [@tonykhaov](https://github.com/tonykhaov)! - List the Me contact in the desktop Send recipient contacts, like mobile, with only its addresses on the selected network.

- [#22615](https://github.com/LedgerHQ/ledger-live/pull/22615) [`7bc8d65`](https://github.com/LedgerHQ/ledger-live/commit/7bc8d65f5565f881094751204475f7e3d0b16106) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the Pay request flow from the Add stablecoin "Crypto address" option instead of the standard Receive flow

- [#22318](https://github.com/LedgerHQ/ledger-live/pull/22318) [`83b8a5c`](https://github.com/LedgerHQ/ledger-live/commit/83b8a5c95bed52ad2ba5ffef866f978596b855fc) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Use dnd-kit to reorder card assets in the desktop manage-assets dialog

- [#22379](https://github.com/LedgerHQ/ledger-live/pull/22379) [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Let the card transaction history read past its first page.

  - Both platforms read on by scrolling: native through the list's `onEndReached`, web through an observer on a sentinel at the end of the table.
  - A spinner marks the page in flight; no new copy, so nothing to translate.
  - Both take `loadMore`/`isLoadingMore` from the shared view model, so the three-row previews on the Pay surfaces are unaffected.

- [#22432](https://github.com/LedgerHQ/ledger-live/pull/22432) [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the cashback a card transaction earned in its detail view

- [#22665](https://github.com/LedgerHQ/ledger-live/pull/22665) [`46cfd43`](https://github.com/LedgerHQ/ledger-live/commit/46cfd437c30624c37b3d89478eba43aa1391ef92) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(celo): label pending withdrawal rows with their unlock date

- [#22474](https://github.com/LedgerHQ/ledger-live/pull/22474) [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin module dependencies (coin-evm, coin-module-framework, coin-stellar, coin-tezos) and rebuild the lockfile

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22656](https://github.com/LedgerHQ/ledger-live/pull/22656) [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only mention ENS in the contact address input placeholder for networks that support domain resolution (LIVE-38284).

- [#22348](https://github.com/LedgerHQ/ledger-live/pull/22348) [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f) Thanks [@ysitbon](https://github.com/ysitbon)! - Let asset-aggregation and wallet-analytics declare the countervalues interface they need

  Both packages only ever needed one countervalues operation, `calculate`, over a state they
  receive as a parameter and never inspect. They now declare that operation themselves as a
  `RateLookup` interface, treat the state as an opaque `RateSnapshot`, and drop
  `@ledgerhq/live-countervalues` from their dependencies entirely. The apps fill the interface
  at startup, beside the crypto-assets store and the currencies resolver.

  No caller changes: the exported signatures keep their arity and the state argument is
  assignable as before, so the 41 files consuming these two packages are untouched.

  Tests get simpler as a side effect. Mocking countervalues was a module mock reaching across a
  package boundary; it is now an injected fake passed to `setRateLookup`.

- [#22534](https://github.com/LedgerHQ/ledger-live/pull/22534) [`c5a6a7e`](https://github.com/LedgerHQ/ledger-live/commit/c5a6a7e7d62b867a443346b152ca5b1d801f6a66) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): report a re-resolution that throws

  A feature-flags re-resolution that throws at boot is now reported through `logger.critical`,
  whatever the state of the remote-flag cache.

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

- [#22481](https://github.com/LedgerHQ/ledger-live/pull/22481) [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - adapt crypto card title to be consistent

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#22788](https://github.com/LedgerHQ/ledger-live/pull/22788) [`3699ef4`](https://github.com/LedgerHQ/ledger-live/commit/3699ef4a5d48c99dcf9892324ef1ed6bc7cccdbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22614](https://github.com/LedgerHQ/ledger-live/pull/22614) [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update the verify address next steps copy, add a third step, and size the mobile shield spot to match desktop

- [#22433](https://github.com/LedgerHQ/ledger-live/pull/22433) [`8c787ee`](https://github.com/LedgerHQ/ledger-live/commit/8c787eec93a4d8155cea02c46c426acd50b163e5) Thanks [@jeportie](https://github.com/jeportie)! - Add test IDs to the My Ledger values that automation has to read.

  The device storage figures and the install success banner render their values as bare text nodes, so a test can see the containers but cannot assert what they show. This adds them to the used, capacity, apps count and free space figures in the storage card, and to the install success banner's title and its manage accounts button.

  No behaviour changes: every addition is a `data-testid` attribute.

- [#22322](https://github.com/LedgerHQ/ledger-live/pull/22322) [`08e23bb`](https://github.com/LedgerHQ/ledger-live/commit/08e23bb00577065206a028365d18b7e509cbdca4) Thanks [@jeportie](https://github.com/jeportie)! - Add test IDs to the My Ledger controls that automation has to click.

  The manager screen already exposes test IDs for its containers, inputs and success states, but not for several triggers and submit buttons, so those flows could not be driven from a test. This adds them to the app catalog's Show and Sort dropdowns, the device rename entry point and its submit button, the custom lock screen removal link and its success state, and the OS version and genuine badge values.

  No behaviour changes: every addition is a `data-testid` attribute.

- [#22571](https://github.com/LedgerHQ/ledger-live/pull/22571) [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

- [#22438](https://github.com/LedgerHQ/ledger-live/pull/22438) [`f9b43be`](https://github.com/LedgerHQ/ledger-live/commit/f9b43beb27558199ac97c56a7787e49c49c8b204) Thanks [@pawell24](https://github.com/pawell24)! - fix(near): size staking gas from measured usage and price it the way the chain does

  Staking fees priced the attached gas at the current gas price. nearcore buys the gas attached
  to a receipt at `max(current_gas_price, min_gas_purchase_price)`, and that floor is an order of
  magnitude above the current price on mainnet, so every stake, unstake and withdraw quoted about a
  tenth of what the account had to hold. A withdraw quoted at 0.02 NEAR was rejected on broadcast
  with `NotEnoughBalance` naming a cost of 0.1759 NEAR.

  The fee now uses the same floor the runtime does, and the attached gas drops from 125 TGas (175
  for withdraw_all) to 50 TGas for every staking call. The heaviest poolv1 path, the first call in
  a new epoch which also restakes and runs the pool's 20 TGas `on_stake_action` callback, was
  measured across five mainnet pools: at most 13.64 TGas charged, and 30 TGas attached succeeds on
  it. The old budget, bought at the floor, locked 0.2 NEAR for a call that burns about 0.001;
  the new one locks 0.055.

  Unstake and withdraw are validated against the balance left above storage staking, which is what
  the chain checks, instead of the spendable balance that also subtracts the minimum-balance
  reserve. The withdraw flow gains the NotEnoughFundsToUnstake banner the unstake flow already
  shows, so a real shortfall is explained with the available balance and Buy/Swap/Deposit actions.

  The NEAR coin-tester scenario's withdraw step now requires the withdrawn amount itself to have
  landed before the send-max step sizes its amount: the pool pays out through a Transfer receipt
  that lands a block after the call, and the smaller gas refund alone used to satisfy the step.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22573](https://github.com/LedgerHQ/ledger-live/pull/22573) [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add `useOtherContactsAddresses(excludeContactId?)` so the duplicate-address list is built in one place, with each owner's display name: "This address is already used for My addresses (Me)." It replaces five copies in the Contacts and Send view models.

- [#22321](https://github.com/LedgerHQ/ledger-live/pull/22321) [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the Pay Card transaction history one page at a time.

  - `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
  - `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
  - The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
  - A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
  - `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
  - The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
  - `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
  - `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
  - The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.

- [#22302](https://github.com/LedgerHQ/ledger-live/pull/22302) [`e81a3d8`](https://github.com/LedgerHQ/ledger-live/commit/e81a3d863b0cc83ed021c23938bc1348ce615a46) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Attach Pay Mixpanel user properties when the Pay flag is on.

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22592](https://github.com/LedgerHQ/ledger-live/pull/22592) [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a dedicated empty and error state in Pay card assets and hide Manage until the list is ready.

- [#22545](https://github.com/LedgerHQ/ledger-live/pull/22545) [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): show every login error in a retryable panel

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`40b22c1`](https://github.com/LedgerHQ/ledger-live/commit/40b22c1c98b985d025e370475bcd13964b578b6e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22389](https://github.com/LedgerHQ/ledger-live/pull/22389) [`9c98732`](https://github.com/LedgerHQ/ledger-live/commit/9c98732967950e28d44e2d3d065d44e208dad9b5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Collapse the Pay Tab card hosted-page openers into one helper and pass the host view model through to the card flow

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`87f8ce0`](https://github.com/LedgerHQ/ledger-live/commit/87f8ce0cccbfeffd8865d7d33130298e8e3c2e81) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22507](https://github.com/LedgerHQ/ledger-live/pull/22507) [`219049d`](https://github.com/LedgerHQ/ledger-live/commit/219049db91c6b01ec53bc80c9d70434bd6d0c1ce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Baanx session when the user leaves and opens the Pay tab again.

- [#22328](https://github.com/LedgerHQ/ledger-live/pull/22328) [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open top-up in the legacy `cl-card` live app when the new `legacyTopUp` param of `lwdPayTab` or `lwmPayTab` is on.

- [#22293](https://github.com/LedgerHQ/ledger-live/pull/22293) [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the aspect ratio of the login intro hero image and theme the desktop row icons

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22682](https://github.com/LedgerHQ/ledger-live/pull/22682) [`f678cbd`](https://github.com/LedgerHQ/ledger-live/commit/f678cbd3c4ac2a5028d98142e076380c1dc2f216) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Mention Monavate instead of Baanx in the Pay card add asset and withdraw copy.

- [#22908](https://github.com/LedgerHQ/ledger-live/pull/22908) [`23ee31c`](https://github.com/LedgerHQ/ledger-live/commit/23ee31c0ebf892ea7924e18dc43ad947e7810782) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`8369030`](https://github.com/LedgerHQ/ledger-live/commit/836903036462a9524c834f5b6c3e8d7873bcf2e6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22241](https://github.com/LedgerHQ/ledger-live/pull/22241) [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Include the Me contact in Pay contact strips and contact selection, keeping the existing order.

- [#22358](https://github.com/LedgerHQ/ledger-live/pull/22358) [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a Pay disclaimer at the bottom of the desktop Card panel and the mobile Pay tab.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22427](https://github.com/LedgerHQ/ledger-live/pull/22427) [`b9742c4`](https://github.com/LedgerHQ/ledger-live/commit/b9742c46b56860cc572643b25abfe64660082968) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop brackets around the recipient name on the Pay send confirmation screen.

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22031](https://github.com/LedgerHQ/ledger-live/pull/22031) [`f28215d`](https://github.com/LedgerHQ/ledger-live/commit/f28215d4b314c2a2dd32b5f2355aacc4776ee1f5) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Reserve height for the Perps deposit quoted-amount and status rows so the form no longer jumps when switching between the provider notice, the quote, and the error message

- [#22033](https://github.com/LedgerHQ/ledger-live/pull/22033) [`db7b972`](https://github.com/LedgerHQ/ledger-live/commit/db7b972bd6328a2bd215a7adec3bd5353a727a81) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Keep the entered Perps deposit amount when switching the funding asset/account instead of resetting it

- [#22488](https://github.com/LedgerHQ/ledger-live/pull/22488) [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608) Thanks [@LL782](https://github.com/LL782)! - Replace mutable analytics screen refs with a function-only tracking-page API.

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22767](https://github.com/LedgerHQ/ledger-live/pull/22767) [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22562](https://github.com/LedgerHQ/ledger-live/pull/22562) [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Keep re-reading the Pay Card status after the holder returns from Apple or Google Wallet, and when the app comes back to the foreground

- [#22491](https://github.com/LedgerHQ/ledger-live/pull/22491) [`c8d3949`](https://github.com/LedgerHQ/ledger-live/commit/c8d39499a8f21e7b4d7f27d4c4f55d3b75c96983) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the redundant Card extra in the History navbar when the type switcher is visible.

- [#22631](https://github.com/LedgerHQ/ledger-live/pull/22631) [`9be4635`](https://github.com/LedgerHQ/ledger-live/commit/9be4635d76d6d649be51a001d39b08c3bfd52af1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay tab active in the sidebar while a Card live app is open

- [#22378](https://github.com/LedgerHQ/ledger-live/pull/22378) [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(domain): rename `@domain/api-altcoins-sentiment` to `@domain/api-market-index-altcoin-season`

  The package wraps one specific CoinMarketCap product, the Altcoin Season Index, so the old name
  used `sentiment` as a top-level leaf for something that measures capital rotation rather than
  sentiment. The new name places it in the `market-index-*` namespace alongside its Fear and Greed
  sibling and uses the provider's own product name for the leaf.

  The exported api follows the package leaf: `altcoinsSentimentApi` becomes `altcoinSeasonApi` and
  the `AltcoinsSentimentApi` type becomes `AltcoinSeasonApi`. `ALTCOIN_SEASON_INDEX_TAGS`,
  `transformAltcoinSeasonIndexResponse` and `useGetAltcoinSeasonIndexLatestQuery` are unchanged.
  The README, which documented an implementation the package never had, is rewritten against the
  code. No behaviour change.

- [#22376](https://github.com/LedgerHQ/ledger-live/pull/22376) [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(market): rename the Fear & Greed entity package to the `market-index-*` namespace

  `@domain/entity-market-sentiment` becomes `@domain/entity-market-index-fear-and-greed`, and
  `domain/entity/market-sentiment` becomes `domain/entity/market-index-fear-and-greed`. The old
  name used a namespace as a leaf: it holds one specific CoinMarketCap index, not market sentiment
  in general, which left the sibling Altcoin Season index with nowhere to sit.

  Pure rename. No behaviour change, and no symbol changes inside the package: `FearAndGreedIndexSchema`
  and `FearAndGreedIndex` already carried the index's real name.

- [#22238](https://github.com/LedgerHQ/ledger-live/pull/22238) [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the selected contact in Send and open the recipient picker from the To bar.

- [#22407](https://github.com/LedgerHQ/ledger-live/pull/22407) [`4efaa4f`](https://github.com/LedgerHQ/ledger-live/commit/4efaa4fa4aefee20dc446eb6b19ab65be2e95f95) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the Ledger by Figment T&Cs link from the Sui delegation validator step

- [#22579](https://github.com/LedgerHQ/ledger-live/pull/22579) [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Re-read `SWAP_API_BASE` on every swap/Perps quote request instead of baking it into the store at startup, so a debug-menu override reaches the aggregator without an app restart

- [#22392](https://github.com/LedgerHQ/ledger-live/pull/22392) [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d) Thanks [@CremaFR](https://github.com/CremaFR)! - Include Exchange and signing app versions on swap cancel payloads

- [#22382](https://github.com/LedgerHQ/ledger-live/pull/22382) [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Redirect the "choose card type" onboarding step to the Baanx hosted order-card page, and align pay bottom sheet spacing and tile styles

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

- [#22664](https://github.com/LedgerHQ/ledger-live/pull/22664) [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f) Thanks [@semeano](https://github.com/semeano)! - Add Zcash privacy/transfer-flow attributes to the new send flow's Segment tracking, and a first page event for the balance-type step, so a private vs public Zcash send is distinguishable in analytics (LIVE-38009).

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`4fc2063`](https://github.com/LedgerHQ/ledger-live/commit/4fc2063b0e49a445ebb660f750214e69d5c4355a), [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10), [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868), [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`739334b`](https://github.com/LedgerHQ/ledger-live/commit/739334b0d854a3b11d9a2b6ba47ce022dc0797d9), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8), [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fc6f187`](https://github.com/LedgerHQ/ledger-live/commit/fc6f1878bb1fa7f0c87c18478abbb194c6edee0d), [`6fa8121`](https://github.com/LedgerHQ/ledger-live/commit/6fa81215cdeade45495994d5dc7dc0477c097e2c), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb), [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30), [`4f0fdc3`](https://github.com/LedgerHQ/ledger-live/commit/4f0fdc3d78ac46e4396106eaf10e20ca6c0ed3cf), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3), [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715), [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @domain/api-card-management@0.8.0
  - @features/flow-pay-card-details@0.6.0
  - @features/platform-pay-analytics@0.3.0
  - @features/flow-contacts-list@0.9.0
  - @ledgerhq/types-live@6.126.0
  - @domain/entity-contact@0.11.0
  - @features/flow-contacts-introduction@1.3.0
  - @features/flow-pay-contact@0.5.0
  - @domain/api-market-index-fear-and-greed@0.4.0
  - @shared/ui-info-state@0.4.0
  - @ledgerhq/live-dmk-shared@0.34.0
  - @ledgerhq/live-dmk-desktop@0.23.0
  - @ledgerhq/live-signer-evm@0.24.0
  - @ledgerhq/live-common@38.2.0
  - @ledgerhq/coin-casper@3.5.0
  - @features/platform-device-action-content@0.3.0
  - @features/flow-contacts@0.13.0
  - @features/flow-pay-card-assets@0.3.0
  - @features/flow-pay-balance@0.6.0
  - @features/flow-pay-card-transactions@0.4.0
  - @features/platform-card@0.7.0
  - @features/flow-pay-card-auth@0.9.0
  - @features/flow-pay-card@0.6.0
  - @features/flow-pay-card-widget@0.5.0
  - @shared/feature-flags@0.25.0
  - @shared/env@0.9.0
  - @features/platform-contacts@0.9.0
  - @ledgerhq/asset-aggregation@0.17.0
  - @ledgerhq/wallet-analytics@0.5.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @domain/entity-currency-crypto@0.14.0
  - @ledgerhq/coin-bitcoin@0.54.0
  - @ledgerhq/coin-zcash@0.10.0
  - @ledgerhq/live-signer-tron@0.2.0
  - @ledgerhq/transaction-observability@0.4.0
  - @ledgerhq/coin-cosmos@1.5.0
  - @features/flow-pay-feature-tour@0.7.0
  - @features/flow-pay-request@0.7.0
  - @ledgerhq/coin-canton@1.3.0
  - @ledgerhq/coin-cardano@1.3.0
  - @ledgerhq/coin-concordium@1.5.0
  - @ledgerhq/coin-filecoin@2.3.0
  - @features/flow-pay-bank-transfer@0.4.0
  - @features/flow-pay-deposit@0.5.0
  - @devtools/bindings@0.10.0
  - @shared/analytics@0.4.0
  - @domain/api-market-index-altcoin-season@0.4.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @shared/analytics-react@0.4.0
  - @shared/api-services@0.9.0
  - @ledgerhq/live-countervalues-react@0.18.2
  - @ledgerhq/live-send@0.1.2
  - @ledgerhq/live-wallet@1.1.5
  - @ledgerhq/wallet-pnl@0.7.13
  - @features/flow-contacts-add-address@0.6.1
  - @features/flow-contacts-add-contact@0.7.1
  - @features/flow-contacts-delete-contact@0.2.4
  - @features/flow-contacts-edit-address@0.4.1
  - @features/flow-contacts-edit-contact@0.6.1
  - @ledgerhq/asset-detail@0.11.7
  - @features/flow-large-screen-upsell@2.2.1
  - @features/platform-currencies@0.9.1
  - @features/platform-feature-flags@0.8.1
  - @domain/api-aggregated-assets@0.5.3
  - @features/platform-aggregated-assets@0.5.5
  - @features/platform-env@0.4.1
  - @ledgerhq/live-countervalues@0.26.2
  - @domain/api-currency-token@0.6.3
  - @domain/entity-currency@0.4.5
  - @domain/entity-currency-token@0.5.4
  - @domain/api-currency-fiat@0.4.6
  - @domain/api-push-devices@0.2.7
  - @devtools/shell@0.10.1
  - @features/flow-analytics-consent@0.2.8
  - @ledgerhq/wallet-btc@0.6.0

## 4.23.0-next.9

### Patch Changes

- Updated dependencies [[`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981)]:
  - @features/flow-pay-card-auth@0.9.0-next.3
  - @devtools/bindings@0.10.0-next.4
  - @features/flow-pay-card@0.6.0-next.4
  - @features/flow-pay-card-assets@0.3.0-next.4
  - @features/flow-pay-card-details@0.6.0-next.4
  - @features/flow-pay-card-transactions@0.4.0-next.4

## 4.23.0-next.8

### Minor Changes

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`40b22c1`](https://github.com/LedgerHQ/ledger-live/commit/40b22c1c98b985d025e370475bcd13964b578b6e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`87f8ce0`](https://github.com/LedgerHQ/ledger-live/commit/87f8ce0cccbfeffd8865d7d33130298e8e3c2e81) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22908](https://github.com/LedgerHQ/ledger-live/pull/22908) [`23ee31c`](https://github.com/LedgerHQ/ledger-live/commit/23ee31c0ebf892ea7924e18dc43ad947e7810782) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`8369030`](https://github.com/LedgerHQ/ledger-live/commit/836903036462a9524c834f5b6c3e8d7873bcf2e6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

### Patch Changes

- Updated dependencies [[`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @features/flow-pay-balance@0.6.0-next.1
  - @features/flow-pay-card-auth@0.9.0-next.2
  - @devtools/bindings@0.10.0-next.3
  - @features/flow-pay-card@0.6.0-next.3
  - @features/flow-pay-feature-tour@0.7.0-next.2
  - @shared/feature-flags@0.25.0-next.1
  - @features/flow-pay-card-assets@0.3.0-next.3
  - @features/flow-pay-card-details@0.6.0-next.3
  - @features/flow-pay-card-transactions@0.4.0-next.3
  - @features/flow-contacts-add-address@0.6.1-next.2
  - @features/flow-large-screen-upsell@2.2.1-next.1
  - @features/platform-contacts@0.9.0-next.2
  - @features/platform-currencies@0.9.1-next.1
  - @features/platform-feature-flags@0.8.1-next.1
  - @ledgerhq/live-common@38.2.0-next.1
  - @devtools/shell@0.10.1-next.1
  - @features/flow-contacts@0.13.0-next.3
  - @features/flow-contacts-add-contact@0.7.1-next.2
  - @features/flow-contacts-delete-contact@0.2.4-next.2
  - @features/flow-contacts-edit-address@0.4.1-next.2
  - @features/flow-contacts-edit-contact@0.6.1-next.2
  - @features/flow-contacts-list@0.9.0-next.2
  - @features/flow-pay-contact@0.5.0-next.4
  - @features/flow-analytics-consent@0.2.8-next.1
  - @ledgerhq/asset-detail@0.11.7-next.1
  - @ledgerhq/live-dmk-desktop@0.23.0-next.1
  - @ledgerhq/live-send@0.1.2-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
