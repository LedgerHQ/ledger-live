# web-tools

## 0.61.0-next.1

### Patch Changes

- Updated dependencies [[`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319)]:
  - @ledgerhq/live-common@38.5.0-next.1

## 0.61.0-next.0

### Minor Changes

- [#23681](https://github.com/LedgerHQ/ledger-live/pull/23681) [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the explorer URL helpers (`getDefaultExplorerView`, `getTransactionExplorer`, `getAddressExplorer`, `getTokenExplorer`, `getStakePoolExplorer`) from `@ledgerhq/live-common/explorers` to `@domain/entity-currency-crypto`. `getAccountContractExplorer` becomes `getTokenExplorer(view, contractAddress, ownerAddress)` and takes plain strings. All usages are migrated and `@ledgerhq/live-common/explorers` is removed.

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23783](https://github.com/LedgerHQ/ledger-live/pull/23783) [`47390ba`](https://github.com/LedgerHQ/ledger-live/commit/47390baeab2bbc5039511214dab5eb738ba8d28e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align utf-8-validate on 6.0.6 so ws peer variants collapse into a single install

- [#23912](https://github.com/LedgerHQ/ledger-live/pull/23912) [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0) Thanks [@ysitbon](https://github.com/ysitbon)! - `StyleProvider` moves to platform entries: `@features/platform-style/web` and `@features/platform-style/native` each export `StyleProvider` and `StyleProviderProps`, and `@features/platform-style` no longer exports it. The package imports carry no platform suffix and its tests run in a web and a native jest project.

- [#23875](https://github.com/LedgerHQ/ledger-live/pull/23875) [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @tanstack/react-table catalog on 8.21.3 to drop the duplicate 8.5.11 install

### Patch Changes

- Updated dependencies [[`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf), [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6), [`2f49d10`](https://github.com/LedgerHQ/ledger-live/commit/2f49d10deab5f44e7468ffdc4577f0804235824c), [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c), [`d94b2e8`](https://github.com/LedgerHQ/ledger-live/commit/d94b2e8643c76f4b231b5cb21184ac76a3bdff15), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322), [`6b445da`](https://github.com/LedgerHQ/ledger-live/commit/6b445da2f92d7c630424faa7cc31a01bc67db0b9), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`4e9e4f6`](https://github.com/LedgerHQ/ledger-live/commit/4e9e4f65f4a8c22ebcb270a8886c50ebe289c705), [`cdfa0c9`](https://github.com/LedgerHQ/ledger-live/commit/cdfa0c93d31ebdefdbc6bfc5f8deee7135623a3e), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a), [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b), [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d), [`07a548b`](https://github.com/LedgerHQ/ledger-live/commit/07a548bb67cfd5dff60f4554bfdfd386856e97e9), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`01ed754`](https://github.com/LedgerHQ/ledger-live/commit/01ed754cd80959b8e9ec3d73a02b1b8d5289e0be), [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb), [`bfaac14`](https://github.com/LedgerHQ/ledger-live/commit/bfaac14201bb12b1f4b6e6a6d68ab4a0daa55b5c), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9fcce41`](https://github.com/LedgerHQ/ledger-live/commit/9fcce4124460578380778520016adccaf576980d), [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8), [`b977dbb`](https://github.com/LedgerHQ/ledger-live/commit/b977dbb2d8d6459295210b491b33af6e8bace1da), [`e647907`](https://github.com/LedgerHQ/ledger-live/commit/e647907efc9ef15a3bba21ec5acdbbe6cbae658a), [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54), [`77bc92f`](https://github.com/LedgerHQ/ledger-live/commit/77bc92ff77d029d570f7b2553919222ee0e598ca), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba), [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011), [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70), [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b), [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a), [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2), [`cc576e8`](https://github.com/LedgerHQ/ledger-live/commit/cc576e8bd942a354cc428053b2b1da54489d1ff0), [`2929c6e`](https://github.com/LedgerHQ/ledger-live/commit/2929c6ebe1647bb011d37ebe3f6bd7a920045754), [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @ledgerhq/live-common@38.5.0-next.0
  - @domain/entity-currency-fiat@0.5.0-next.0
  - @devtools/bindings@0.13.0-next.0
  - @shared/feature-flags@0.28.0-next.0
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @ledgerhq/live-dmk-shared@0.37.0-next.0
  - @devtools/shell@0.12.0-next.0
  - @devtools/transport-panel@0.8.0-next.0
  - @features/platform-style@0.5.0-next.0
  - @domain/api-currency-token@0.7.0-next.0
  - @shared/api-services@0.11.0-next.0
  - @features/platform-feature-flags@0.10.0-next.0
  - @domain/entity-account-name@0.3.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/hw-app-eth@7.12.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0
  - @features/platform-currencies@0.11.0-next.0
  - @domain/api-market-countervalues@0.2.2-next.0
  - @domain/entity-currency@0.4.8-next.0
  - @domain/entity-market-countervalues@0.4.1-next.0
  - @ledgerhq/wallet-pnl@0.8.2-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @domain/entity-currency-token@0.5.7-next.0
  - @ledgerhq/live-wallet@1.1.8-next.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @shared/env@0.11.0
  - @domain/entity-account@0.1.1-next.0

## 0.60.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @ledgerhq/live-common@38.4.0
  - @domain/entity-currency-crypto@0.16.0
  - @shared/env@0.11.0
  - @devtools/shell@0.11.0
  - @domain/entity-account@0.1.0
  - @features/platform-currencies@0.10.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0
  - @domain/entity-market-countervalues@0.4.0
  - @devtools/bindings@0.12.0
  - @ledgerhq/live-dmk-shared@0.36.0
  - @features/platform-feature-flags@0.9.1
  - @domain/api-currency-token@0.6.5
  - @domain/api-market-countervalues@0.2.1
  - @domain/entity-contact@0.12.1
  - @domain/entity-currency@0.4.7
  - @domain/entity-currency-token@0.5.6
  - @ledgerhq/live-wallet@1.1.7
  - @ledgerhq/wallet-pnl@0.8.1
  - @shared/api-services@0.10.1
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-name@0.2.3
  - @ledgerhq/hw-app-eth@7.11.1

## 0.60.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@38.4.0-next.2

## 0.60.0-next.1

### Patch Changes

- Updated dependencies [[`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be)]:
  - @ledgerhq/live-common@38.4.0-next.1

## 0.60.0-next.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @ledgerhq/live-common@38.4.0-next.0
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @shared/env@0.11.0-next.0
  - @devtools/shell@0.11.0-next.0
  - @domain/entity-account@0.1.0-next.0
  - @features/platform-currencies@0.10.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0
  - @domain/entity-market-countervalues@0.4.0-next.0
  - @devtools/bindings@0.12.0-next.0
  - @ledgerhq/live-dmk-shared@0.36.0-next.0
  - @features/platform-feature-flags@0.9.1-next.0
  - @domain/api-currency-token@0.6.5-next.0
  - @domain/api-market-countervalues@0.2.1-next.0
  - @domain/entity-contact@0.12.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @domain/entity-currency-token@0.5.6-next.0
  - @ledgerhq/live-wallet@1.1.7-next.0
  - @ledgerhq/wallet-pnl@0.8.1-next.0
  - @shared/api-services@0.10.1-next.0
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-name@0.2.3-next.0
  - @ledgerhq/hw-app-eth@7.11.1-next.0

## 0.59.0

### Minor Changes

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

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

- [#22720](https://github.com/LedgerHQ/ledger-live/pull/22720) [`c948500`](https://github.com/LedgerHQ/ledger-live/commit/c948500f0bb4fa85222c06b700439cedcdb574c4) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues state type and initial state from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

### Patch Changes

- Updated dependencies [[`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/live-common@38.3.0
  - @domain/entity-contact@0.12.0
  - @shared/feature-flags@0.26.0
  - @domain/entity-currency-crypto@0.15.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @domain/api-market-countervalues@0.2.0
  - @domain/entity-market-countervalues@0.3.0
  - @shared/api-services@0.10.0
  - @ledgerhq/types-live@6.127.0
  - @shared/env@0.10.0
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/hw-app-eth@7.11.0
  - @ledgerhq/wallet-pnl@0.8.0
  - @features/platform-feature-flags@0.9.0
  - @devtools/bindings@0.11.0
  - @ledgerhq/react-ui@0.56.0
  - @ledgerhq/live-wallet@1.1.6
  - @features/platform-currencies@0.9.2
  - @domain/api-currency-token@0.6.4
  - @domain/entity-currency@0.4.6
  - @domain/entity-currency-token@0.5.5
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @devtools/protocols@0.5.0
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-name@0.2.2
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @devtools/shell@0.10.2

## 0.59.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/live-common@38.3.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/live-wallet@1.1.6-next.1
  - @ledgerhq/wallet-pnl@0.8.0-next.1

## 0.59.0-next.0

### Minor Changes

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

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

- [#22720](https://github.com/LedgerHQ/ledger-live/pull/22720) [`c948500`](https://github.com/LedgerHQ/ledger-live/commit/c948500f0bb4fa85222c06b700439cedcdb574c4) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues state type and initial state from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

### Patch Changes

- Updated dependencies [[`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/live-common@38.3.0-next.0
  - @domain/entity-contact@0.12.0-next.0
  - @shared/feature-flags@0.26.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @domain/api-market-countervalues@0.2.0-next.0
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @shared/api-services@0.10.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @shared/env@0.10.0-next.0
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/hw-app-eth@7.11.0-next.0
  - @ledgerhq/wallet-pnl@0.8.0-next.0
  - @features/platform-feature-flags@0.9.0-next.0
  - @devtools/bindings@0.11.0-next.0
  - @ledgerhq/react-ui@0.56.0-next.0
  - @ledgerhq/live-wallet@1.1.6-next.0
  - @features/platform-currencies@0.9.2-next.0
  - @domain/api-currency-token@0.6.4-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @domain/entity-currency-token@0.5.5-next.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @devtools/protocols@0.5.0
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-name@0.2.2
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @devtools/shell@0.10.2-next.0

## 0.58.1

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @ledgerhq/types-live@6.126.0
  - @domain/entity-contact@0.11.0
  - @ledgerhq/live-dmk-shared@0.34.0
  - @ledgerhq/live-common@38.2.0
  - @shared/feature-flags@0.25.0
  - @shared/env@0.9.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @domain/entity-currency-crypto@0.14.0
  - @ledgerhq/hw-app-eth@7.10.0
  - @devtools/bindings@0.10.0
  - @shared/api-services@0.9.0
  - @ledgerhq/live-wallet@1.1.5
  - @ledgerhq/wallet-pnl@0.7.13
  - @features/platform-currencies@0.9.1
  - @features/platform-feature-flags@0.8.1
  - @ledgerhq/live-countervalues@0.26.2
  - @domain/api-currency-token@0.6.3
  - @domain/entity-currency@0.4.5
  - @domain/entity-currency-token@0.5.4
  - @devtools/shell@0.10.1

## 0.58.1-next.5

### Patch Changes

- Updated dependencies []:
  - @devtools/bindings@0.10.0-next.4

## 0.58.1-next.4

### Patch Changes

- Updated dependencies [[`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @devtools/bindings@0.10.0-next.3
  - @shared/feature-flags@0.25.0-next.1
  - @features/platform-currencies@0.9.1-next.1
  - @features/platform-feature-flags@0.8.1-next.1
  - @ledgerhq/live-common@38.2.0-next.1
  - @devtools/shell@0.10.1-next.1

## 0.58.1-next.3

### Patch Changes

- Updated dependencies []:
  - @devtools/bindings@0.10.0-next.2

## 0.58.1-next.2

### Patch Changes

- Updated dependencies []:
  - @devtools/bindings@0.10.0-next.1

## 0.58.1-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @ledgerhq/live-wallet@1.1.5-next.1

## 0.58.1-next.0

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/live-dmk-shared@0.34.0-next.0
  - @ledgerhq/live-common@38.2.0-next.0
  - @shared/feature-flags@0.25.0-next.0
  - @shared/env@0.9.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @ledgerhq/hw-app-eth@7.10.0-next.0
  - @devtools/bindings@0.10.0-next.0
  - @shared/api-services@0.9.0-next.0
  - @ledgerhq/live-wallet@1.1.5-next.0
  - @ledgerhq/wallet-pnl@0.7.13-next.0
  - @features/platform-currencies@0.9.1-next.0
  - @features/platform-feature-flags@0.8.1-next.0
  - @ledgerhq/live-countervalues@0.26.2-next.0
  - @domain/api-currency-token@0.6.3-next.0
  - @domain/entity-contact@0.10.1-next.0
  - @domain/entity-currency@0.4.5-next.0
  - @domain/entity-currency-token@0.5.4-next.0
  - @devtools/shell@0.10.1-next.0

## 0.58.0

### Minor Changes

- [#22195](https://github.com/LedgerHQ/ledger-live/pull/22195) [`3e3efa0`](https://github.com/LedgerHQ/ledger-live/commit/3e3efa021a0dba01dd21c326d3b34edff24bf18a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Nano S to the Firmware App Deployments tool

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9), [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab), [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4), [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7), [`d6739d7`](https://github.com/LedgerHQ/ledger-live/commit/d6739d7fdc0b02ea26d2a29f6512f28b45c4ac38), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a), [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05), [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8), [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56), [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0
  - @shared/api-services@0.8.0
  - @devtools/bindings@0.9.0
  - @ledgerhq/live-common@38.1.0
  - @domain/entity-currency-crypto@0.13.0
  - @domain/entity-contact@0.10.0
  - @ledgerhq/hw-app-eth@7.9.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-dmk-shared@0.33.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0
  - @devtools/shell@0.10.0
  - @devtools/transport-panel@0.7.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.13.0
  - @shared/feature-flags@0.24.0
  - @features/platform-currencies@0.9.0
  - @devtools/protocols@0.5.0
  - @features/platform-feature-flags@0.8.0
  - @ledgerhq/wallet-pnl@0.7.12
  - @domain/api-currency-token@0.6.2
  - @domain/entity-currency@0.4.4
  - @domain/entity-currency-token@0.5.3
  - @ledgerhq/live-wallet@1.1.4
  - @ledgerhq/live-countervalues@0.26.1
  - @ledgerhq/domain-service@1.8.20
  - @devtools/wire@0.5.1

## 0.58.0-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/bindings@0.9.0-next.1

## 0.58.0-next.0

### Minor Changes

- [#22195](https://github.com/LedgerHQ/ledger-live/pull/22195) [`3e3efa0`](https://github.com/LedgerHQ/ledger-live/commit/3e3efa021a0dba01dd21c326d3b34edff24bf18a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Nano S to the Firmware App Deployments tool

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9), [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab), [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4), [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7), [`d6739d7`](https://github.com/LedgerHQ/ledger-live/commit/d6739d7fdc0b02ea26d2a29f6512f28b45c4ac38), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a), [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05), [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8), [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56), [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0-next.0
  - @shared/api-services@0.8.0-next.0
  - @devtools/bindings@0.9.0-next.0
  - @ledgerhq/live-common@38.1.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @domain/entity-contact@0.10.0-next.0
  - @ledgerhq/hw-app-eth@7.9.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-dmk-shared@0.33.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0-next.0
  - @devtools/shell@0.10.0-next.0
  - @devtools/transport-panel@0.7.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.13.0-next.0
  - @shared/feature-flags@0.24.0-next.0
  - @features/platform-currencies@0.9.0-next.0
  - @devtools/protocols@0.5.0-next.0
  - @features/platform-feature-flags@0.8.0-next.0
  - @ledgerhq/wallet-pnl@0.7.12-next.0
  - @domain/api-currency-token@0.6.2-next.0
  - @domain/entity-currency@0.4.4-next.0
  - @domain/entity-currency-token@0.5.3-next.0
  - @ledgerhq/live-wallet@1.1.4-next.0
  - @ledgerhq/live-countervalues@0.26.1-next.0
  - @ledgerhq/domain-service@1.8.20-next.0
  - @devtools/wire@0.5.1-next.0

## 0.57.0

### Minor Changes

- [#21738](https://github.com/LedgerHQ/ledger-live/pull/21738) [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

  These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

  The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

- [#21892](https://github.com/LedgerHQ/ledger-live/pull/21892) [`e3c31fe`](https://github.com/LedgerHQ/ledger-live/commit/e3c31fe27541fab83214e085e01162977058dae5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add the Firmware App Deployments tool: a matrix of which device app version is published on each device, provider and OS track, read from the Manager API.

### Patch Changes

- Updated dependencies [[`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e3535da`](https://github.com/LedgerHQ/ledger-live/commit/e3535da7e5c884f8ada75eff52c0c4538142fffb), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc), [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8), [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e), [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e), [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141), [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028), [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc)]:
  - @ledgerhq/live-common@38.0.0
  - @shared/feature-flags@0.23.0
  - @ledgerhq/types-live@6.124.0
  - @features/platform-feature-flags@0.7.0
  - @devtools/bindings@0.8.0
  - @ledgerhq/react-ui@0.55.0
  - @domain/entity-contact@0.9.0
  - @shared/env@0.7.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0
  - @ledgerhq/live-countervalues@0.26.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @features/platform-style@0.4.0
  - @features/platform-currencies@0.8.1
  - @ledgerhq/domain-service@1.8.19
  - @ledgerhq/hw-app-eth@7.8.19
  - @ledgerhq/live-wallet@1.1.3
  - @ledgerhq/wallet-pnl@0.7.11
  - @shared/api-services@0.7.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @devtools/shell@0.9.3

## 0.57.0-next.1

### Patch Changes

- Updated dependencies [[`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358)]:
  - @ledgerhq/live-common@38.0.0-next.1

## 0.57.0-next.0

### Minor Changes

- [#21738](https://github.com/LedgerHQ/ledger-live/pull/21738) [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

  These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

  The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

- [#21892](https://github.com/LedgerHQ/ledger-live/pull/21892) [`e3c31fe`](https://github.com/LedgerHQ/ledger-live/commit/e3c31fe27541fab83214e085e01162977058dae5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add the Firmware App Deployments tool: a matrix of which device app version is published on each device, provider and OS track, read from the Manager API.

### Patch Changes

- Updated dependencies [[`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e3535da`](https://github.com/LedgerHQ/ledger-live/commit/e3535da7e5c884f8ada75eff52c0c4538142fffb), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc), [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8), [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e), [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e), [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141), [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028), [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc)]:
  - @ledgerhq/live-common@38.0.0-next.0
  - @shared/feature-flags@0.23.0-next.0
  - @ledgerhq/types-live@6.124.0-next.0
  - @features/platform-feature-flags@0.7.0-next.0
  - @devtools/bindings@0.8.0-next.0
  - @ledgerhq/react-ui@0.55.0-next.0
  - @domain/entity-contact@0.9.0-next.0
  - @shared/env@0.7.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0-next.0
  - @ledgerhq/live-countervalues@0.26.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @features/platform-style@0.4.0-next.0
  - @features/platform-currencies@0.8.1-next.0
  - @ledgerhq/domain-service@1.8.19-next.0
  - @ledgerhq/hw-app-eth@7.8.19-next.0
  - @ledgerhq/live-wallet@1.1.3-next.0
  - @ledgerhq/wallet-pnl@0.7.11-next.0
  - @shared/api-services@0.7.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @devtools/shell@0.9.3-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
