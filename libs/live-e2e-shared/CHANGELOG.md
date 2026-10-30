# @ledgerhq/live-e2e-shared

## 0.17.0-next.1

### Patch Changes

- Updated dependencies [[`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319)]:
  - @ledgerhq/live-common@38.5.0-next.1

## 0.17.0-next.0

### Minor Changes

- [#23610](https://github.com/LedgerHQ/ledger-live/pull/23610) [`72872d3`](https://github.com/LedgerHQ/ledger-live/commit/72872d303dedde87d6170b41dc87e1357bd28749) Thanks [@valeriiboiko-ext-ops](https://github.com/valeriiboiko-ext-ops)! - Use named parameters (options object) in the Account and TokenAccount constructors, and set the missing legacy derivation mode on BTC_LEGACY_2.

- [#23286](https://github.com/LedgerHQ/ledger-live/pull/23286) [`b78e207`](https://github.com/LedgerHQ/ledger-live/commit/b78e207f1c45bd98b215bcd085e4e3af961a275f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in mobile E2E against the mock server, and let device intents discover that transport.

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Add a fake Tronify server and Tron rent-payment helpers for the sponsored send E2E tests

- [#23720](https://github.com/LedgerHQ/ledger-live/pull/23720) [`10be9ea`](https://github.com/LedgerHQ/ledger-live/commit/10be9ea45ed5b42babf40a11a0277fce79620ae6) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Move the token approval swaps to Ethereum 5 and revoke a token allowance only when it is too small

- [#23330](https://github.com/LedgerHQ/ledger-live/pull/23330) [`fcdd599`](https://github.com/LedgerHQ/ledger-live/commit/fcdd5998da0bb2b7d32015d1267e9ca50716a574) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Serialize e2e broadcasts per on-chain account across CI machines with an R2-backed lock

### Patch Changes

- Updated dependencies [[`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4), [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288), [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6), [`2f49d10`](https://github.com/LedgerHQ/ledger-live/commit/2f49d10deab5f44e7468ffdc4577f0804235824c), [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c), [`d94b2e8`](https://github.com/LedgerHQ/ledger-live/commit/d94b2e8643c76f4b231b5cb21184ac76a3bdff15), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`4e9e4f6`](https://github.com/LedgerHQ/ledger-live/commit/4e9e4f65f4a8c22ebcb270a8886c50ebe289c705), [`cdfa0c9`](https://github.com/LedgerHQ/ledger-live/commit/cdfa0c93d31ebdefdbc6bfc5f8deee7135623a3e), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b), [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`07a548b`](https://github.com/LedgerHQ/ledger-live/commit/07a548bb67cfd5dff60f4554bfdfd386856e97e9), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`01ed754`](https://github.com/LedgerHQ/ledger-live/commit/01ed754cd80959b8e9ec3d73a02b1b8d5289e0be), [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9fcce41`](https://github.com/LedgerHQ/ledger-live/commit/9fcce4124460578380778520016adccaf576980d), [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8), [`e647907`](https://github.com/LedgerHQ/ledger-live/commit/e647907efc9ef15a3bba21ec5acdbbe6cbae658a), [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011), [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70), [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b), [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a), [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`2929c6e`](https://github.com/LedgerHQ/ledger-live/commit/2929c6ebe1647bb011d37ebe3f6bd7a920045754), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @ledgerhq/live-common@38.5.0-next.0
  - @shared/feature-flags@0.28.0-next.0
  - @ledgerhq/coin-zcash@1.1.0-next.0
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-devices@7.2.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @ledgerhq/live-wallet@1.1.8-next.0
  - @ledgerhq/live-signer-evm@0.24.3-next.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @shared/env@0.11.0
  - @ledgerhq/live-signer-aleo@0.19.16-next.0
  - @ledgerhq/device-core@0.11.21-next.0

## 0.16.0

### Minor Changes

- [#23301](https://github.com/LedgerHQ/ledger-live/pull/23301) [`8366c55`](https://github.com/LedgerHQ/ledger-live/commit/8366c557f49390150e9f6695c9239ff875e92fee) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Send from each Bitcoin derivation's own account in the send E2E tests, so the legacy, segwit, native segwit and taproot tests no longer race for one account's UTXO. Desktop new send flow tests now fail as soon as the flow ends on an error or info screen instead of after the 41s expect timeout.

- [#23410](https://github.com/LedgerHQ/ledger-live/pull/23410) [`65e90bb`](https://github.com/LedgerHQ/ledger-live/commit/65e90bb3973a012eb34969e461e2aad9d7718aac) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Skip on Nano S the mobile E2E tests that Desktop already skips there: SUI, VET, HBAR and ALEO tests, plus EGLD and SEI delegate, CELO lock and vote and CCD send. Desktop and Mobile now read the currencies with no Nano S coverage from one list in `@ledgerhq/live-e2e-shared`.

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23470](https://github.com/LedgerHQ/ledger-live/pull/23470) [`ba07b05`](https://github.com/LedgerHQ/ledger-live/commit/ba07b0562bf91bb0e5468d4806bc5d7781785248) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Watch the Speculos screen during local E2E runs: `SPECULOS_SCREEN=web` opens the Speculos web page (through a local proxy that adds the Speculinho session token), `SPECULOS_SCREEN=vnc` a VNC viewer (through a local bridge to the Speculinho VNC websocket). Ignored in CI. Local Docker Speculos now always runs its VNC server, bound to 127.0.0.1.

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`ba07b05`](https://github.com/LedgerHQ/ledger-live/commit/ba07b0562bf91bb0e5468d4806bc5d7781785248), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @ledgerhq/coin-zcash@1.0.0
  - @ledgerhq/live-common@38.4.0
  - @domain/entity-currency-crypto@0.16.0
  - @shared/env@0.11.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0
  - @ledgerhq/live-dmk-speculos@0.12.0
  - @ledgerhq/speculos-transport@0.13.0
  - @domain/entity-contact@0.12.1
  - @ledgerhq/live-wallet@1.1.7
  - @ledgerhq/live-signer-aleo@0.19.15
  - @ledgerhq/live-signer-evm@0.24.2
  - @ledgerhq/device-core@0.11.20

## 0.16.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-zcash@1.0.0-next.1
  - @ledgerhq/live-common@38.4.0-next.2

## 0.16.0-next.1

### Patch Changes

- Updated dependencies [[`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be)]:
  - @ledgerhq/live-common@38.4.0-next.1

## 0.16.0-next.0

### Minor Changes

- [#23301](https://github.com/LedgerHQ/ledger-live/pull/23301) [`8366c55`](https://github.com/LedgerHQ/ledger-live/commit/8366c557f49390150e9f6695c9239ff875e92fee) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Send from each Bitcoin derivation's own account in the send E2E tests, so the legacy, segwit, native segwit and taproot tests no longer race for one account's UTXO. Desktop new send flow tests now fail as soon as the flow ends on an error or info screen instead of after the 41s expect timeout.

- [#23410](https://github.com/LedgerHQ/ledger-live/pull/23410) [`65e90bb`](https://github.com/LedgerHQ/ledger-live/commit/65e90bb3973a012eb34969e461e2aad9d7718aac) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Skip on Nano S the mobile E2E tests that Desktop already skips there: SUI, VET, HBAR and ALEO tests, plus EGLD and SEI delegate, CELO lock and vote and CCD send. Desktop and Mobile now read the currencies with no Nano S coverage from one list in `@ledgerhq/live-e2e-shared`.

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23470](https://github.com/LedgerHQ/ledger-live/pull/23470) [`ba07b05`](https://github.com/LedgerHQ/ledger-live/commit/ba07b0562bf91bb0e5468d4806bc5d7781785248) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Watch the Speculos screen during local E2E runs: `SPECULOS_SCREEN=web` opens the Speculos web page (through a local proxy that adds the Speculinho session token), `SPECULOS_SCREEN=vnc` a VNC viewer (through a local bridge to the Speculinho VNC websocket). Ignored in CI. Local Docker Speculos now always runs its VNC server, bound to 127.0.0.1.

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`ba07b05`](https://github.com/LedgerHQ/ledger-live/commit/ba07b0562bf91bb0e5468d4806bc5d7781785248), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @ledgerhq/coin-zcash@1.0.0-next.0
  - @ledgerhq/live-common@38.4.0-next.0
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @shared/env@0.11.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0
  - @ledgerhq/live-dmk-speculos@0.12.0-next.0
  - @ledgerhq/speculos-transport@0.13.0-next.0
  - @domain/entity-contact@0.12.1-next.0
  - @ledgerhq/live-wallet@1.1.7-next.0
  - @ledgerhq/live-signer-aleo@0.19.15-next.0
  - @ledgerhq/live-signer-evm@0.24.2-next.0
  - @ledgerhq/device-core@0.11.20-next.0

## 0.15.0

### Minor Changes

- [#21734](https://github.com/LedgerHQ/ledger-live/pull/21734) [`6b4ea77`](https://github.com/LedgerHQ/ledger-live/commit/6b4ea7724fc9c4e00cff1ecbab548e7d95c96687) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add mobile Borrow E2E coverage for full repay (B2CQA-6073) and withdraw collateral (B2CQA-6080), closing the LLD/LLM parity gap on those keys (QAA-1477). Open loan, repay and withdraw now share one spec, and each resets the ERC-20 allowance its approval step needs, with the spender resolved from the partner's own action.

  The borrow driver now enables blind signing on touch devices, and a partner 5xx is retried only on read endpoints, so a lost response can no longer leave a second action behind. It pads gas limits so a call no longer runs out of gas when state moves before inclusion. Mobile and desktop now wait for each on-chain step to land before starting the next, so the app never reuses a nonce still in flight, and each test waits for the partner to index its outcome before cleanup touches the account. A detox retry also skips the describe blocks it has nothing to rerun instead of repeating their on-chain setup. On desktop, waiting for the device validation screen now gets the same budget as the sign modal, since the partner prepares each transaction server-side.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22657](https://github.com/LedgerHQ/ledger-live/pull/22657) [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in desktop E2E against the mock server, which keeps the OS available after the device leaves the Ethereum app.

- [#23161](https://github.com/LedgerHQ/ledger-live/pull/23161) [`efc1511`](https://github.com/LedgerHQ/ledger-live/commit/efc1511d3f50887f0a5be254e5a73e967cd34eca) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Tap the footer Confirm button on touch devices instead of the review title

- [#22754](https://github.com/LedgerHQ/ledger-live/pull/22754) [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cover paying a contact from the mobile Pay tab, selecting the native tile by contact id

### Patch Changes

- Updated dependencies [[`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1)]:
  - @ledgerhq/live-common@38.3.0
  - @domain/entity-contact@0.12.0
  - @shared/feature-flags@0.26.0
  - @ledgerhq/coin-zcash@0.11.0
  - @domain/entity-currency-crypto@0.15.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0
  - @shared/env@0.10.0
  - @ledgerhq/live-wallet@1.1.6
  - @ledgerhq/live-signer-evm@0.24.1
  - @ledgerhq/live-signer-aleo@0.19.14
  - @ledgerhq/device-core@0.11.19
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/types-devices@7.1.0

## 0.15.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/live-common@38.3.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/coin-zcash@0.11.0-next.1
  - @ledgerhq/live-signer-evm@0.24.1-next.1
  - @ledgerhq/live-wallet@1.1.6-next.1
  - @ledgerhq/live-signer-aleo@0.19.14-next.1

## 0.15.0-next.0

### Minor Changes

- [#21734](https://github.com/LedgerHQ/ledger-live/pull/21734) [`6b4ea77`](https://github.com/LedgerHQ/ledger-live/commit/6b4ea7724fc9c4e00cff1ecbab548e7d95c96687) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add mobile Borrow E2E coverage for full repay (B2CQA-6073) and withdraw collateral (B2CQA-6080), closing the LLD/LLM parity gap on those keys (QAA-1477). Open loan, repay and withdraw now share one spec, and each resets the ERC-20 allowance its approval step needs, with the spender resolved from the partner's own action.

  The borrow driver now enables blind signing on touch devices, and a partner 5xx is retried only on read endpoints, so a lost response can no longer leave a second action behind. It pads gas limits so a call no longer runs out of gas when state moves before inclusion. Mobile and desktop now wait for each on-chain step to land before starting the next, so the app never reuses a nonce still in flight, and each test waits for the partner to index its outcome before cleanup touches the account. A detox retry also skips the describe blocks it has nothing to rerun instead of repeating their on-chain setup. On desktop, waiting for the device validation screen now gets the same budget as the sign modal, since the partner prepares each transaction server-side.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22657](https://github.com/LedgerHQ/ledger-live/pull/22657) [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in desktop E2E against the mock server, which keeps the OS available after the device leaves the Ethereum app.

- [#23161](https://github.com/LedgerHQ/ledger-live/pull/23161) [`efc1511`](https://github.com/LedgerHQ/ledger-live/commit/efc1511d3f50887f0a5be254e5a73e967cd34eca) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Tap the footer Confirm button on touch devices instead of the review title

- [#22754](https://github.com/LedgerHQ/ledger-live/pull/22754) [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cover paying a contact from the mobile Pay tab, selecting the native tile by contact id

### Patch Changes

- Updated dependencies [[`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1)]:
  - @ledgerhq/live-common@38.3.0-next.0
  - @domain/entity-contact@0.12.0-next.0
  - @shared/feature-flags@0.26.0-next.0
  - @ledgerhq/coin-zcash@0.11.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @shared/env@0.10.0-next.0
  - @ledgerhq/live-wallet@1.1.6-next.0
  - @ledgerhq/live-signer-evm@0.24.1-next.0
  - @ledgerhq/live-signer-aleo@0.19.14-next.0
  - @ledgerhq/device-core@0.11.19-next.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/types-devices@7.1.0

## 0.14.0

### Minor Changes

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

- [#22132](https://github.com/LedgerHQ/ledger-live/pull/22132) [`9e3d00a`](https://github.com/LedgerHQ/ledger-live/commit/9e3d00a7e7311b3cdd3defe81a88faba93700fc7) Thanks [@jeportie](https://github.com/jeportie)! - Fix the mock server device presets for the Nano models, and add a way to seed installed apps.

  `device_type` has to be the camelCase model id the transport resolves, so `nanox`, `nanosp` and `nanos` never carried a model: the device connected, but the manager screen rendered nothing behind a buy-device dialog.

  `withInstallHashes` looks each install hash up in the manager API for the device under test. An app declared without a hash reads as sideloaded and is never reported as installed, and hashes are published per target id and firmware, so they cannot be carried from one model to another.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/live-signer-evm@0.24.0
  - @ledgerhq/live-common@38.2.0
  - @shared/feature-flags@0.25.0
  - @shared/env@0.9.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @domain/entity-currency-crypto@0.14.0
  - @ledgerhq/coin-zcash@0.10.0
  - @ledgerhq/device-core@0.11.18
  - @ledgerhq/live-signer-aleo@0.19.13
  - @ledgerhq/live-wallet@1.1.5

## 0.14.0-next.2

### Patch Changes

- Updated dependencies [[`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @shared/feature-flags@0.25.0-next.1
  - @ledgerhq/live-common@38.2.0-next.1

## 0.14.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-wallet@1.1.5-next.1

## 0.14.0-next.0

### Minor Changes

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

- [#22132](https://github.com/LedgerHQ/ledger-live/pull/22132) [`9e3d00a`](https://github.com/LedgerHQ/ledger-live/commit/9e3d00a7e7311b3cdd3defe81a88faba93700fc7) Thanks [@jeportie](https://github.com/jeportie)! - Fix the mock server device presets for the Nano models, and add a way to seed installed apps.

  `device_type` has to be the camelCase model id the transport resolves, so `nanox`, `nanosp` and `nanos` never carried a model: the device connected, but the manager screen rendered nothing behind a buy-device dialog.

  `withInstallHashes` looks each install hash up in the manager API for the device under test. An app declared without a hash reads as sideloaded and is never reported as installed, and hashes are published per target id and firmware, so they cannot be carried from one model to another.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/live-signer-evm@0.24.0-next.0
  - @ledgerhq/live-common@38.2.0-next.0
  - @shared/feature-flags@0.25.0-next.0
  - @shared/env@0.9.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @ledgerhq/coin-zcash@0.10.0-next.0
  - @ledgerhq/device-core@0.11.18-next.0
  - @ledgerhq/live-signer-aleo@0.19.13-next.0
  - @ledgerhq/live-wallet@1.1.5-next.0

## 0.13.0

### Minor Changes

- [#22079](https://github.com/LedgerHQ/ledger-live/pull/22079) [`7396e53`](https://github.com/LedgerHQ/ledger-live/commit/7396e5378ba6692318de27ebdcb9b1a37aecac4c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop and mobile E2E coverage for browsing and searching contacts (B2CQA-6240).

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9), [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab), [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4), [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972), [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7), [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05), [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8), [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56), [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0
  - @ledgerhq/live-common@38.1.0
  - @domain/entity-currency-crypto@0.13.0
  - @ledgerhq/coin-zcash@0.9.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/speculos-transport@0.12.0
  - @ledgerhq/types-devices@7.1.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0
  - @shared/feature-flags@0.24.0
  - @ledgerhq/live-signer-aleo@0.19.12
  - @ledgerhq/live-wallet@1.1.4
  - @ledgerhq/live-signer-evm@0.23.3
  - @ledgerhq/device-core@0.11.17

## 0.13.0-next.0

### Minor Changes

- [#22079](https://github.com/LedgerHQ/ledger-live/pull/22079) [`7396e53`](https://github.com/LedgerHQ/ledger-live/commit/7396e5378ba6692318de27ebdcb9b1a37aecac4c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop and mobile E2E coverage for browsing and searching contacts (B2CQA-6240).

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9), [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab), [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4), [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972), [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7), [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05), [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8), [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56), [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0-next.0
  - @ledgerhq/live-common@38.1.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @ledgerhq/coin-zcash@0.9.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/speculos-transport@0.12.0-next.0
  - @ledgerhq/types-devices@7.1.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0-next.0
  - @shared/feature-flags@0.24.0-next.0
  - @ledgerhq/live-signer-aleo@0.19.12-next.0
  - @ledgerhq/live-wallet@1.1.4-next.0
  - @ledgerhq/live-signer-evm@0.23.3-next.0
  - @ledgerhq/device-core@0.11.17-next.0

## 0.12.0

### Minor Changes

- [#21894](https://github.com/LedgerHQ/ledger-live/pull/21894) [`ca6dd3a`](https://github.com/LedgerHQ/ledger-live/commit/ca6dd3a81b3453808e22794ad416a10658c5e3d4) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix the nightly mobile borrow e2e run.

  `BorrowPage.expectStepDone` reached for detox's `device` global, which a page object is not
  loaded with, so the first signed step threw `ReferenceError: device is not defined` after its
  transaction had already gone out — and every retry then found the approval step complete and
  failed on its "not yet done" precondition. Granting Morpho access is account state rather than
  per-loan state, so that step now passes through when it is already granted.

  The Speculos driver gained the Ethereum app's blind-signing setting, without which Morpho
  calldata is answered with `6a80` and no review is ever drawn, plus the risk warning that
  enabling it puts in front of the review. Transaction Check now stops waiting as soon as that
  warning appears instead of spending its whole budget on it.

  The borrow driver also floors the keyless RPC's priority-fee suggestion so its broadcasts get
  mined, keeps the fee cap proportional to the base fee so the node's up-front reservation stays
  within the account balance, retries reads the RPC's archive-restricted backends reject, polls
  for the receipt rather than watching whole blocks for a replacement, waits for a remote
  Speculos to be ready so its address is published, and reports the partner's reason for a
  rejected action instead of only the status line.

- [#21661](https://github.com/LedgerHQ/ledger-live/pull/21661) [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Converge on a single Speculos transport and stop resolving Speculos config through the env singleton

  `@ledgerhq/hw-transport-node-speculos-http` and `@ledgerhq/hw-transport-node-speculos` are removed.
  The former was a duplicate of `@ledgerhq/live-dmk-speculos` — same class, same `SpeculosHttpTransportOpts`,
  same `SpeculosButton` enum, but without the DMK session cache, reconnect-on-APDU-failure and transient
  HTTP retries — and had a single consumer left. The latter implemented the websocket/TCP mode gated on
  `SPECULOS_USE_WEBSOCKET`, which defaulted to `false` and was never enabled anywhere; that definition is
  removed too. `@ledgerhq/live-dmk-speculos` is now the only Speculos transport, and it additionally
  exports `SpeculosButton`.

  `@ledgerhq/speculos-transport` loses the websocket branch, so `getPorts` has one shape,
  `SpeculosDeviceInternal` is no longer a union and `SpeculosTransport` is a single type. It no longer
  reads `@shared/env`: the Speculos PKI flag (`-p`) moves from `getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX")`
  to an explicit `pki` field on `DeviceParams`, which `live-e2e-shared`'s `startSpeculos` sets — aligning
  the local Docker provider with the Speculinho provider, which already passed `-p` unconditionally.
  `@ledgerhq/live-dmk-speculos` resolves `SPECULOS_API_PORT` from `process.env` at the point of use
  instead of the env registry, so neither package depends on `@shared/env` any more.

  `@ledgerhq/live-cli` drops the `SPECULOS_APDU_PORT` / `SPECULOS_BUTTON_PORT` / `SPECULOS_HOST`
  websocket branch; use `SPECULOS_API_PORT`. The Canton integration test, the Solana smoke script and the
  disabled BTC integration test move to `@ledgerhq/live-dmk-speculos`, and the dead
  `hw-transport-node-speculos` devDependency is dropped from `coin-kaspa`, `hw-app-kaspa`, `hw-app-icon`
  and `ledger-wallet-framework`.

  `@ledgerhq/ledger-key-ring-protocol` declared `@ledgerhq/speculos-transport` and
  `@ledgerhq/hw-transport-mocker` as runtime `dependencies` even though both are only reachable from
  `tests/` and `src/__tests__/`, which `tsconfig.build.json` excludes from the published build. They
  move to `devDependencies`, so the Docker/Speculos harness is no longer part of the package's runtime
  dependency closure.

  Two further dead Speculos definitions leave `@shared/env`: `SPECULOS_PID_OFFSET`, which had no
  reference anywhere in the repo, and `SPECULOS_FIRMWARE_VERSION`, whose registry entry was unused
  because every reader (`live-common/src/load/speculos.ts`, `live-e2e-shared/src/speculosAppVersion.ts`,
  the CI workflows) already goes through `process.env`.

- [#21702](https://github.com/LedgerHQ/ledger-live/pull/21702) [`654199a`](https://github.com/LedgerHQ/ledger-live/commit/654199ad52f8dce63fc46cd826d11f90c533b804) Thanks [@jeportie](https://github.com/jeportie)! - Surface the swap-init root cause on mobile E2E failures

  When the device stalls on "Exchange app is ready", `waitForReviewTransaction` appends a hint telling
  the reader to open the "⚠️ Swap-init error" attachment. That hint lives in shared code and is
  emitted on both platforms, but the attachment was produced by the desktop harness only, so on
  mobile it pointed at something that never existed.

  The extraction now lives in `@ledgerhq/live-e2e-shared/swapInitError` and both harnesses use it.
  Mobile attaches the result first, scanning the app logs and the webview console together, because
  the failure can surface on either side of the wallet-api call. Desktop delegates to the shared
  function and keeps its previous output.

### Patch Changes

- Updated dependencies [[`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc), [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8), [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e), [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e), [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f), [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028), [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc)]:
  - @ledgerhq/live-common@38.0.0
  - @shared/feature-flags@0.23.0
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/speculos-transport@0.11.0
  - @shared/env@0.7.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/live-signer-aleo@0.19.11
  - @ledgerhq/device-core@0.11.16
  - @ledgerhq/live-signer-evm@0.23.2
  - @ledgerhq/live-wallet@1.1.3
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0

## 0.12.0-next.1

### Patch Changes

- Updated dependencies [[`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358)]:
  - @ledgerhq/live-common@38.0.0-next.1

## 0.12.0-next.0

### Minor Changes

- [#21894](https://github.com/LedgerHQ/ledger-live/pull/21894) [`ca6dd3a`](https://github.com/LedgerHQ/ledger-live/commit/ca6dd3a81b3453808e22794ad416a10658c5e3d4) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix the nightly mobile borrow e2e run.

  `BorrowPage.expectStepDone` reached for detox's `device` global, which a page object is not
  loaded with, so the first signed step threw `ReferenceError: device is not defined` after its
  transaction had already gone out — and every retry then found the approval step complete and
  failed on its "not yet done" precondition. Granting Morpho access is account state rather than
  per-loan state, so that step now passes through when it is already granted.

  The Speculos driver gained the Ethereum app's blind-signing setting, without which Morpho
  calldata is answered with `6a80` and no review is ever drawn, plus the risk warning that
  enabling it puts in front of the review. Transaction Check now stops waiting as soon as that
  warning appears instead of spending its whole budget on it.

  The borrow driver also floors the keyless RPC's priority-fee suggestion so its broadcasts get
  mined, keeps the fee cap proportional to the base fee so the node's up-front reservation stays
  within the account balance, retries reads the RPC's archive-restricted backends reject, polls
  for the receipt rather than watching whole blocks for a replacement, waits for a remote
  Speculos to be ready so its address is published, and reports the partner's reason for a
  rejected action instead of only the status line.

- [#21661](https://github.com/LedgerHQ/ledger-live/pull/21661) [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Converge on a single Speculos transport and stop resolving Speculos config through the env singleton

  `@ledgerhq/hw-transport-node-speculos-http` and `@ledgerhq/hw-transport-node-speculos` are removed.
  The former was a duplicate of `@ledgerhq/live-dmk-speculos` — same class, same `SpeculosHttpTransportOpts`,
  same `SpeculosButton` enum, but without the DMK session cache, reconnect-on-APDU-failure and transient
  HTTP retries — and had a single consumer left. The latter implemented the websocket/TCP mode gated on
  `SPECULOS_USE_WEBSOCKET`, which defaulted to `false` and was never enabled anywhere; that definition is
  removed too. `@ledgerhq/live-dmk-speculos` is now the only Speculos transport, and it additionally
  exports `SpeculosButton`.

  `@ledgerhq/speculos-transport` loses the websocket branch, so `getPorts` has one shape,
  `SpeculosDeviceInternal` is no longer a union and `SpeculosTransport` is a single type. It no longer
  reads `@shared/env`: the Speculos PKI flag (`-p`) moves from `getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX")`
  to an explicit `pki` field on `DeviceParams`, which `live-e2e-shared`'s `startSpeculos` sets — aligning
  the local Docker provider with the Speculinho provider, which already passed `-p` unconditionally.
  `@ledgerhq/live-dmk-speculos` resolves `SPECULOS_API_PORT` from `process.env` at the point of use
  instead of the env registry, so neither package depends on `@shared/env` any more.

  `@ledgerhq/live-cli` drops the `SPECULOS_APDU_PORT` / `SPECULOS_BUTTON_PORT` / `SPECULOS_HOST`
  websocket branch; use `SPECULOS_API_PORT`. The Canton integration test, the Solana smoke script and the
  disabled BTC integration test move to `@ledgerhq/live-dmk-speculos`, and the dead
  `hw-transport-node-speculos` devDependency is dropped from `coin-kaspa`, `hw-app-kaspa`, `hw-app-icon`
  and `ledger-wallet-framework`.

  `@ledgerhq/ledger-key-ring-protocol` declared `@ledgerhq/speculos-transport` and
  `@ledgerhq/hw-transport-mocker` as runtime `dependencies` even though both are only reachable from
  `tests/` and `src/__tests__/`, which `tsconfig.build.json` excludes from the published build. They
  move to `devDependencies`, so the Docker/Speculos harness is no longer part of the package's runtime
  dependency closure.

  Two further dead Speculos definitions leave `@shared/env`: `SPECULOS_PID_OFFSET`, which had no
  reference anywhere in the repo, and `SPECULOS_FIRMWARE_VERSION`, whose registry entry was unused
  because every reader (`live-common/src/load/speculos.ts`, `live-e2e-shared/src/speculosAppVersion.ts`,
  the CI workflows) already goes through `process.env`.

- [#21702](https://github.com/LedgerHQ/ledger-live/pull/21702) [`654199a`](https://github.com/LedgerHQ/ledger-live/commit/654199ad52f8dce63fc46cd826d11f90c533b804) Thanks [@jeportie](https://github.com/jeportie)! - Surface the swap-init root cause on mobile E2E failures

  When the device stalls on "Exchange app is ready", `waitForReviewTransaction` appends a hint telling
  the reader to open the "⚠️ Swap-init error" attachment. That hint lives in shared code and is
  emitted on both platforms, but the attachment was produced by the desktop harness only, so on
  mobile it pointed at something that never existed.

  The extraction now lives in `@ledgerhq/live-e2e-shared/swapInitError` and both harnesses use it.
  Mobile attaches the result first, scanning the app logs and the webview console together, because
  the failure can surface on either side of the wallet-api call. Desktop delegates to the shared
  function and keeps its previous output.

### Patch Changes

- Updated dependencies [[`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc), [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8), [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e), [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e), [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f), [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028), [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc)]:
  - @ledgerhq/live-common@38.0.0-next.0
  - @shared/feature-flags@0.23.0-next.0
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/live-dmk-speculos@0.11.0-next.0
  - @ledgerhq/speculos-transport@0.11.0-next.0
  - @shared/env@0.7.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/live-signer-aleo@0.19.11-next.0
  - @ledgerhq/device-core@0.11.16-next.0
  - @ledgerhq/live-signer-evm@0.23.2-next.0
  - @ledgerhq/live-wallet@1.1.3-next.0
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0

## 0.11.0

### Minor Changes

- [#21206](https://github.com/LedgerHQ/ledger-live/pull/21206) [`750bdd4`](https://github.com/LedgerHQ/ledger-live/commit/750bdd4bbaaf7a1c591c8a8f21479f6c64fc9c95) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add mobile E2E for the post-onboarding hub mock flow (LIVE-31323).

- [#21419](https://github.com/LedgerHQ/ledger-live/pull/21419) [`18f2991`](https://github.com/LedgerHQ/ledger-live/commit/18f299191122309ba77a8301b0a2556866563aa9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: aleo e2e native swap

- [#21498](https://github.com/LedgerHQ/ledger-live/pull/21498) [`8213a42`](https://github.com/LedgerHQ/ledger-live/commit/8213a42d58fb62b189839590170e0a0fa7b4c11e) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Point the Solana GIGA 1 token account constant at the account that exists on-chain

### Patch Changes

- Updated dependencies [[`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c), [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0), [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8), [`dd134e9`](https://github.com/LedgerHQ/ledger-live/commit/dd134e9c126773d47cd8dfb6aaf677534f2e7b23), [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a), [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb), [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`70b93a0`](https://github.com/LedgerHQ/ledger-live/commit/70b93a037c9217a1f64e66c13085d43c1d4fde2e), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254), [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`3e14841`](https://github.com/LedgerHQ/ledger-live/commit/3e14841c47bf578e6a8c9aabda22a8b59facb83f), [`800e718`](https://github.com/LedgerHQ/ledger-live/commit/800e71806a6b743161ae1eb4f163d6a9ca654f85), [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f), [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149), [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`918e931`](https://github.com/LedgerHQ/ledger-live/commit/918e9318379ec8ed73dfaca58a7dd8ff06dd897b), [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`ebeb266`](https://github.com/LedgerHQ/ledger-live/commit/ebeb266bb8091b86a4393497677088b1aa51dee5), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`9b15a72`](https://github.com/LedgerHQ/ledger-live/commit/9b15a7228b9eafb6f627b887c9b950899d79501d), [`bcf6eef`](https://github.com/LedgerHQ/ledger-live/commit/bcf6eef986320df10bed2a1bb3054e701264421f), [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2), [`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017), [`93251f5`](https://github.com/LedgerHQ/ledger-live/commit/93251f5594214aa21a1ab17ae4baba52b227ee8f), [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f), [`dcdec92`](https://github.com/LedgerHQ/ledger-live/commit/dcdec92fec41cf5bef0d3f54566e4649b851607f), [`db09cfc`](https://github.com/LedgerHQ/ledger-live/commit/db09cfc0a41f71af1dd2f452d7d5ad7865f4ffe7), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`b683a6d`](https://github.com/LedgerHQ/ledger-live/commit/b683a6dc7709dd9b669288e7178414334790ba9e), [`3da476c`](https://github.com/LedgerHQ/ledger-live/commit/3da476c2d4c435c62aa3fe11a0290f56d7283cbe), [`12199a1`](https://github.com/LedgerHQ/ledger-live/commit/12199a1c615ccd21c1f3574b0f1868dbf0800ba2), [`1c58fb1`](https://github.com/LedgerHQ/ledger-live/commit/1c58fb15f0b3421d6cf82b53db66f39a21fb7bc0), [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7), [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d)]:
  - @ledgerhq/live-common@37.6.0
  - @shared/env@0.6.0
  - @shared/feature-flags@0.22.0
  - @domain/entity-currency-crypto@0.12.0
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-signer-aleo@0.19.10
  - @ledgerhq/ledger-key-ring-protocol@0.21.2
  - @ledgerhq/live-dmk-speculos@0.10.8
  - @ledgerhq/speculos-transport@0.10.14
  - @ledgerhq/live-wallet@1.1.2
  - @ledgerhq/device-core@0.11.15
  - @ledgerhq/live-signer-evm@0.23.1
  - @shared/cloud-sync@0.3.0
  - @shared/cloud-sync-module@0.4.0

## 0.11.0-next.4

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1
  - @ledgerhq/live-common@37.6.0-next.4

## 0.11.0-next.3

### Patch Changes

- Updated dependencies [[`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017)]:
  - @ledgerhq/live-common@37.6.0-next.3

## 0.11.0-next.2

### Patch Changes

- Updated dependencies [[`800e718`](https://github.com/LedgerHQ/ledger-live/commit/800e71806a6b743161ae1eb4f163d6a9ca654f85)]:
  - @ledgerhq/live-common@37.6.0-next.2

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
