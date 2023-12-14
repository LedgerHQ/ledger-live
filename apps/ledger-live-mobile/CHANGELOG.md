# live-mobile

## 3.36.0

### Minor Changes

- [#5543](https://github.com/LedgerHQ/ledger-live/pull/5543) [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9) Thanks [@chabroA](https://github.com/chabroA)! - rename Crypto.org to Cronos POS Chain

- [#5588](https://github.com/LedgerHQ/ledger-live/pull/5588) [`95ce679`](https://github.com/LedgerHQ/ledger-live/commit/95ce679a9da4e72672903ee63167cca8eea7c910) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing account actions for Cardano on LLM + better typing on all families

- [#5574](https://github.com/LedgerHQ/ledger-live/pull/5574) [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04) Thanks [@Wozacosta](https://github.com/Wozacosta)! - introduces the ability to highlight live apps in discover section

- [#4947](https://github.com/LedgerHQ/ledger-live/pull/4947) [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - vechain integration

### Patch Changes

- [#5341](https://github.com/LedgerHQ/ledger-live/pull/5341) [`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - live-config lib setup for featureflag framework

- [#5618](https://github.com/LedgerHQ/ledger-live/pull/5618) [`ed17856`](https://github.com/LedgerHQ/ledger-live/commit/ed17856adc5a6723bc87c409e03a2b832432a1db) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Wait for firebase and analytics to be ready before adding featureflags to segment identity

- [#5522](https://github.com/LedgerHQ/ledger-live/pull/5522) [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Add recover banner for subscribtion informations

- [#5112](https://github.com/LedgerHQ/ledger-live/pull/5112) [`ab1db96`](https://github.com/LedgerHQ/ledger-live/commit/ab1db965c25cd629bf384f7323f0b018309e4e66) Thanks [@lvndry](https://github.com/lvndry)! - Eliminate usage of @polkadot/react-identicons

- [#5458](https://github.com/LedgerHQ/ledger-live/pull/5458) [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a) Thanks [@mle-gall](https://github.com/mle-gall)! - Changing post onboarding items in LLM

- [#5171](https://github.com/LedgerHQ/ledger-live/pull/5171) [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Usage of new abort timeouts and transport access refactoring

  - `getOnboardingStatePolling` : usage of `transportAbortTimeoutMs` value for both the opening and exchange (via `getVersion`) abort timeout
  - `getVersion` : usage of `abortTimeoutMs` on exchange
  - More tracing and documentations

  `withDevice` refactoring:

  - better variables names
  - more documentation (especially the queue-made-with-promise part)
  - some simple unit tests

  Updates on 1st version of the device SDK:

  The 1st implementation of the "device SDK" is redefining a `withDevie` named `withTransport`.
  It had its own queue of waiting jobs, that was independent from the queue of job from `withDevice`
  With this refactoring, `withTransport` and `withDevice` have been updated to use the same jobs queue.

- [#5529](https://github.com/LedgerHQ/ledger-live/pull/5529) [`e0f1feb`](https://github.com/LedgerHQ/ledger-live/commit/e0f1feb85fefcb556d6fdefa6ca83da5582be0f9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix wording in receive flow

- [#5501](https://github.com/LedgerHQ/ledger-live/pull/5501) [`f6dd7d3`](https://github.com/LedgerHQ/ledger-live/commit/f6dd7d391a54442d4a7c428bc7be9261b104fb21) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Update Stax onboarding (firmware update)

- [#5478](https://github.com/LedgerHQ/ledger-live/pull/5478) [`2258116`](https://github.com/LedgerHQ/ledger-live/commit/2258116e334d749a26c50555edad2f5d432dbef8) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed unresponsive export logs on android 14

- [#5350](https://github.com/LedgerHQ/ledger-live/pull/5350) [`342ed3b`](https://github.com/LedgerHQ/ledger-live/commit/342ed3b81613ca81790c1c3d6cfe639c8700562a) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Fix UI issue on shutdown device during language pack install by whitelisting errors that retry polling

- [#5316](https://github.com/LedgerHQ/ledger-live/pull/5316) [`ff77076`](https://github.com/LedgerHQ/ledger-live/commit/ff770765cc5fbb68b61370ac71fb768ae1e345db) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Close open drawer when lock screen appears

- [#5149](https://github.com/LedgerHQ/ledger-live/pull/5149) [`e7b5ffc`](https://github.com/LedgerHQ/ledger-live/commit/e7b5ffc86a4b69bd1ce75fde9ea19018050e544f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Loading state in ending CTA of ESC

- [#5633](https://github.com/LedgerHQ/ledger-live/pull/5633) [`cc56827`](https://github.com/LedgerHQ/ledger-live/commit/cc56827cc9682049a02d1360683ecdfd9460f4c9) Thanks [@chabroA](https://github.com/chabroA)! - add display of USDC staking rewards for dydx

- [#5573](https://github.com/LedgerHQ/ledger-live/pull/5573) [`5733ed7`](https://github.com/LedgerHQ/ledger-live/commit/5733ed7716ad7bb425c3f9acd01fdb668a77063f) Thanks [@KVNLS](https://github.com/KVNLS)! - LLM - Fix layout issues with Experimental Header and Market page

- [#5619](https://github.com/LedgerHQ/ledger-live/pull/5619) [`75c3bea`](https://github.com/LedgerHQ/ledger-live/commit/75c3bea0430b6cef511730b0f043f82047f16725) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LL Welcome Page Partially in EN when a PWD is set and you were is French or any other language

- [#5608](https://github.com/LedgerHQ/ledger-live/pull/5608) [`9244272`](https://github.com/LedgerHQ/ledger-live/commit/9244272695352cf90eef087daea1dc5a0bab1119) Thanks [@mbertin-ledger](https://github.com/mbertin-ledger)! - Replace "Allow Manager" Lottie by "Validate" Lottie's

- [#5591](https://github.com/LedgerHQ/ledger-live/pull/5591) [`7e4b1d0`](https://github.com/LedgerHQ/ledger-live/commit/7e4b1d082bdf73fd3b84a7a24e49dfe73a60a02c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix 2 "X" icons to close when scanning QR code on Send

- [#5586](https://github.com/LedgerHQ/ledger-live/pull/5586) [`2a543de`](https://github.com/LedgerHQ/ledger-live/commit/2a543de8f5d94cb496d277dec228ddc8c5c2e734) Thanks [@chabroA](https://github.com/chabroA)! - avoid account scheme duplication in add account flow

- [#5572](https://github.com/LedgerHQ/ledger-live/pull/5572) [`134cb77`](https://github.com/LedgerHQ/ledger-live/commit/134cb77a2ce893b892ac5c1361f2382845c50c24) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Loading multiple invalid picture for stax and using the back arrow navigate to the correct page

- [#5559](https://github.com/LedgerHQ/ledger-live/pull/5559) [`d6ed6b4`](https://github.com/LedgerHQ/ledger-live/commit/d6ed6b4400d53348693cfea2031c3c984d6c3e71) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Stax LLM MVP Polishes: ESC and Setup manual

- [#5138](https://github.com/LedgerHQ/ledger-live/pull/5138) [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add low battery warning during early security check

- [#5511](https://github.com/LedgerHQ/ledger-live/pull/5511) [`888241f`](https://github.com/LedgerHQ/ledger-live/commit/888241f58b87d0ff198a156fde47de953f22f230) Thanks [@beths-ledger](https://github.com/beths-ledger)! - remove state update in earn screen that was causing App Not Found screen to display when app state was not loading but the manifest was also not yet found.

- [#5560](https://github.com/LedgerHQ/ledger-live/pull/5560) [`50de57c`](https://github.com/LedgerHQ/ledger-live/commit/50de57cf05e30ac3b5a593872579c40f41467469) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - update design recover banner pixel polish

- [#4710](https://github.com/LedgerHQ/ledger-live/pull/4710) [`a1f9e20`](https://github.com/LedgerHQ/ledger-live/commit/a1f9e209e661a8446216fe21257cfce84840404e) Thanks [@mohammed-ledger](https://github.com/mohammed-ledger)! - Add sonarqube integration

- [#5594](https://github.com/LedgerHQ/ledger-live/pull/5594) [`124fbb3`](https://github.com/LedgerHQ/ledger-live/commit/124fbb349a67b2aad8f8cc8f102100ff6c7a3d8e) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix - LLM - Fixed post onboarding not properly closed causing it to reopen.

- [#5560](https://github.com/LedgerHQ/ledger-live/pull/5560) [`50de57c`](https://github.com/LedgerHQ/ledger-live/commit/50de57cf05e30ac3b5a593872579c40f41467469) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - update design recover banner

- [#5538](https://github.com/LedgerHQ/ledger-live/pull/5538) [`a7f3353`](https://github.com/LedgerHQ/ledger-live/commit/a7f3353b081a9af0591de1192a1d304d0d1724d3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix text color when notifications enabled

- [#5465](https://github.com/LedgerHQ/ledger-live/pull/5465) [`38f9956`](https://github.com/LedgerHQ/ledger-live/commit/38f9956fba6bded4e7b41062ea973d85dba0d745) Thanks [@mbertin-ledger](https://github.com/mbertin-ledger)! - Remove useless notification channel on Android

- [#5701](https://github.com/LedgerHQ/ledger-live/pull/5701) [`2287d6a`](https://github.com/LedgerHQ/ledger-live/commit/2287d6a04c4737de6aed696e18e29edf06780ab0) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "FirmwareNotRecognized" to errors ignored by Sentry

- [#5446](https://github.com/LedgerHQ/ledger-live/pull/5446) [`2b3ed02`](https://github.com/LedgerHQ/ledger-live/commit/2b3ed025d6988a4b7560522c209a5c9c1ca430a2) Thanks [@gre](https://github.com/gre)! - Rework the marketcap ordering of currencies using the new v3 countervalues API.

- [#5605](https://github.com/LedgerHQ/ledger-live/pull/5605) [`878ab36`](https://github.com/LedgerHQ/ledger-live/commit/878ab361a197e766228e31565f0d472ba7be6fec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mask MyLedger device list when more than 3

- [#5472](https://github.com/LedgerHQ/ledger-live/pull/5472) [`b82d161`](https://github.com/LedgerHQ/ledger-live/commit/b82d16148f0cd7fe456a3c56aae707e0be61fe19) Thanks [@gre](https://github.com/gre)! - Optimize filtering on currencies in add account flows (LLD+LLM)

- Updated dependencies [[`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013), [`ed17856`](https://github.com/LedgerHQ/ledger-live/commit/ed17856adc5a6723bc87c409e03a2b832432a1db), [`b7d58b4`](https://github.com/LedgerHQ/ledger-live/commit/b7d58b4cf3aa041b7b794d9af6f0b89bbc0df633), [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d), [`1ccd674`](https://github.com/LedgerHQ/ledger-live/commit/1ccd6746e9ccec5e60ae576d09aca48767da1124), [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`18afc73`](https://github.com/LedgerHQ/ledger-live/commit/18afc730b2c40df16af67f95c1061508c13343c8), [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9), [`f20c114`](https://github.com/LedgerHQ/ledger-live/commit/f20c1149be9eb255e05f0f41f4a0575e8b89dab6), [`75d0019`](https://github.com/LedgerHQ/ledger-live/commit/75d001910faa24bcb76c49eb66c0c49e9770f4b2), [`39d327e`](https://github.com/LedgerHQ/ledger-live/commit/39d327ec4965bda6a8fb6f202238e3156451cfde), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`342ed3b`](https://github.com/LedgerHQ/ledger-live/commit/342ed3b81613ca81790c1c3d6cfe639c8700562a), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29), [`2287d6a`](https://github.com/LedgerHQ/ledger-live/commit/2287d6a04c4737de6aed696e18e29edf06780ab0), [`cc56827`](https://github.com/LedgerHQ/ledger-live/commit/cc56827cc9682049a02d1360683ecdfd9460f4c9), [`88da01e`](https://github.com/LedgerHQ/ledger-live/commit/88da01e071a0332236b7fdeda619a0eb0284cec7), [`c094e4e`](https://github.com/LedgerHQ/ledger-live/commit/c094e4ed0c3220877d13703e20c77a0b013cd3ea), [`c8172ab`](https://github.com/LedgerHQ/ledger-live/commit/c8172abc5c052a753b93be8b6c9cfd88ce0dd64a), [`88fc78a`](https://github.com/LedgerHQ/ledger-live/commit/88fc78a7c1a8fee9102b3c8c907372497425d143), [`5d03bf5`](https://github.com/LedgerHQ/ledger-live/commit/5d03bf514fcf7aea91dc8beae0cd503ed6b4ab3c), [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63), [`2545442`](https://github.com/LedgerHQ/ledger-live/commit/25454425a7f80b551025513f1c2f1bdecb7cceeb), [`124fbb3`](https://github.com/LedgerHQ/ledger-live/commit/124fbb349a67b2aad8f8cc8f102100ff6c7a3d8e), [`0fb6cb3`](https://github.com/LedgerHQ/ledger-live/commit/0fb6cb3cb0085b71dfadfd3a92602511cb7e9928), [`d4a17e1`](https://github.com/LedgerHQ/ledger-live/commit/d4a17e177afb3cd6888479b7319ccb1c38011faa), [`6dc1007`](https://github.com/LedgerHQ/ledger-live/commit/6dc100774010ad674001d04b531239f5adfdce7b), [`95ce679`](https://github.com/LedgerHQ/ledger-live/commit/95ce679a9da4e72672903ee63167cca8eea7c910), [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04), [`313d52a`](https://github.com/LedgerHQ/ledger-live/commit/313d52a516b911229537d7e50badaedd045ed2a0), [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446), [`c4bc268`](https://github.com/LedgerHQ/ledger-live/commit/c4bc2688de43ad1f5ecec5e83d8e5c88edb6d372), [`95acaec`](https://github.com/LedgerHQ/ledger-live/commit/95acaec69f559295ffbe289abc8cddc598038ca7), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`6d62700`](https://github.com/LedgerHQ/ledger-live/commit/6d627002d76a81d68663e33cdcaeebcd89ea84d8), [`2b3ed02`](https://github.com/LedgerHQ/ledger-live/commit/2b3ed025d6988a4b7560522c209a5c9c1ca430a2), [`6dea540`](https://github.com/LedgerHQ/ledger-live/commit/6dea54057f67162a1f556661afae16e0422f7ac3), [`e70e345`](https://github.com/LedgerHQ/ledger-live/commit/e70e345bd21d4f5c82fbedfd4447aec0e866be5a)]:
  - @ledgerhq/live-config@1.0.0
  - @ledgerhq/live-common@33.3.0
  - @ledgerhq/types-live@6.43.1
  - @ledgerhq/coin-framework@0.10.0
  - @ledgerhq/live-env@0.8.0
  - @ledgerhq/react-native-hw-transport-ble@6.32.0
  - @ledgerhq/hw-transport@6.30.1
  - @ledgerhq/errors@6.16.1
  - @ledgerhq/native-ui@0.22.3
  - @ledgerhq/coin-evm@0.11.1
  - @ledgerhq/devices@8.2.0
  - @ledgerhq/domain-service@1.1.16
  - @ledgerhq/hw-transport-http@6.29.1
  - @ledgerhq/react-native-hid@6.31.1

## 3.36.0-next.3

### Patch Changes

- Updated dependencies [[`18afc73`](https://github.com/LedgerHQ/ledger-live/commit/18afc730b2c40df16af67f95c1061508c13343c8)]:
  - @ledgerhq/live-common@33.3.0-next.3

## 3.36.0-next.2

### Patch Changes

- Updated dependencies [[`0fb6cb3`](https://github.com/LedgerHQ/ledger-live/commit/0fb6cb3cb0085b71dfadfd3a92602511cb7e9928)]:
  - @ledgerhq/coin-evm@0.11.1-next.1
  - @ledgerhq/live-common@33.3.0-next.2

## 3.36.0-next.1

### Patch Changes

- [#5701](https://github.com/LedgerHQ/ledger-live/pull/5701) [`2287d6a`](https://github.com/LedgerHQ/ledger-live/commit/2287d6a04c4737de6aed696e18e29edf06780ab0) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "FirmwareNotRecognized" to errors ignored by Sentry

- Updated dependencies [[`2287d6a`](https://github.com/LedgerHQ/ledger-live/commit/2287d6a04c4737de6aed696e18e29edf06780ab0)]:
  - @ledgerhq/live-common@33.3.0-next.1

## 3.36.0-next.0

### Minor Changes

- [#5543](https://github.com/LedgerHQ/ledger-live/pull/5543) [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9) Thanks [@chabroA](https://github.com/chabroA)! - rename Crypto.org to Cronos POS Chain

- [#5588](https://github.com/LedgerHQ/ledger-live/pull/5588) [`95ce679`](https://github.com/LedgerHQ/ledger-live/commit/95ce679a9da4e72672903ee63167cca8eea7c910) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing account actions for Cardano on LLM + better typing on all families

- [#5574](https://github.com/LedgerHQ/ledger-live/pull/5574) [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04) Thanks [@Wozacosta](https://github.com/Wozacosta)! - introduces the ability to highlight live apps in discover section

- [#4947](https://github.com/LedgerHQ/ledger-live/pull/4947) [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - vechain integration

### Patch Changes

- [#5341](https://github.com/LedgerHQ/ledger-live/pull/5341) [`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - live-config lib setup for featureflag framework

- [#5618](https://github.com/LedgerHQ/ledger-live/pull/5618) [`ed17856`](https://github.com/LedgerHQ/ledger-live/commit/ed17856adc5a6723bc87c409e03a2b832432a1db) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Wait for firebase and analytics to be ready before adding featureflags to segment identity

- [#5522](https://github.com/LedgerHQ/ledger-live/pull/5522) [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Add recover banner for subscribtion informations

- [#5112](https://github.com/LedgerHQ/ledger-live/pull/5112) [`ab1db96`](https://github.com/LedgerHQ/ledger-live/commit/ab1db965c25cd629bf384f7323f0b018309e4e66) Thanks [@lvndry](https://github.com/lvndry)! - Eliminate usage of @polkadot/react-identicons

- [#5458](https://github.com/LedgerHQ/ledger-live/pull/5458) [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a) Thanks [@mle-gall](https://github.com/mle-gall)! - Changing post onboarding items in LLM

- [#5171](https://github.com/LedgerHQ/ledger-live/pull/5171) [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Usage of new abort timeouts and transport access refactoring

  - `getOnboardingStatePolling` : usage of `transportAbortTimeoutMs` value for both the opening and exchange (via `getVersion`) abort timeout
  - `getVersion` : usage of `abortTimeoutMs` on exchange
  - More tracing and documentations

  `withDevice` refactoring:

  - better variables names
  - more documentation (especially the queue-made-with-promise part)
  - some simple unit tests

  Updates on 1st version of the device SDK:

  The 1st implementation of the "device SDK" is redefining a `withDevie` named `withTransport`.
  It had its own queue of waiting jobs, that was independent from the queue of job from `withDevice`
  With this refactoring, `withTransport` and `withDevice` have been updated to use the same jobs queue.

- [#5529](https://github.com/LedgerHQ/ledger-live/pull/5529) [`e0f1feb`](https://github.com/LedgerHQ/ledger-live/commit/e0f1feb85fefcb556d6fdefa6ca83da5582be0f9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix wording in receive flow

- [#5501](https://github.com/LedgerHQ/ledger-live/pull/5501) [`f6dd7d3`](https://github.com/LedgerHQ/ledger-live/commit/f6dd7d391a54442d4a7c428bc7be9261b104fb21) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Update Stax onboarding (firmware update)

- [#5478](https://github.com/LedgerHQ/ledger-live/pull/5478) [`2258116`](https://github.com/LedgerHQ/ledger-live/commit/2258116e334d749a26c50555edad2f5d432dbef8) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed unresponsive export logs on android 14

- [#5350](https://github.com/LedgerHQ/ledger-live/pull/5350) [`342ed3b`](https://github.com/LedgerHQ/ledger-live/commit/342ed3b81613ca81790c1c3d6cfe639c8700562a) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Fix UI issue on shutdown device during language pack install by whitelisting errors that retry polling

- [#5316](https://github.com/LedgerHQ/ledger-live/pull/5316) [`ff77076`](https://github.com/LedgerHQ/ledger-live/commit/ff770765cc5fbb68b61370ac71fb768ae1e345db) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Close open drawer when lock screen appears

- [#5149](https://github.com/LedgerHQ/ledger-live/pull/5149) [`e7b5ffc`](https://github.com/LedgerHQ/ledger-live/commit/e7b5ffc86a4b69bd1ce75fde9ea19018050e544f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Loading state in ending CTA of ESC

- [#5633](https://github.com/LedgerHQ/ledger-live/pull/5633) [`cc56827`](https://github.com/LedgerHQ/ledger-live/commit/cc56827cc9682049a02d1360683ecdfd9460f4c9) Thanks [@chabroA](https://github.com/chabroA)! - add display of USDC staking rewards for dydx

- [#5573](https://github.com/LedgerHQ/ledger-live/pull/5573) [`5733ed7`](https://github.com/LedgerHQ/ledger-live/commit/5733ed7716ad7bb425c3f9acd01fdb668a77063f) Thanks [@KVNLS](https://github.com/KVNLS)! - LLM - Fix layout issues with Experimental Header and Market page

- [#5619](https://github.com/LedgerHQ/ledger-live/pull/5619) [`75c3bea`](https://github.com/LedgerHQ/ledger-live/commit/75c3bea0430b6cef511730b0f043f82047f16725) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LL Welcome Page Partially in EN when a PWD is set and you were is French or any other language

- [#5608](https://github.com/LedgerHQ/ledger-live/pull/5608) [`9244272`](https://github.com/LedgerHQ/ledger-live/commit/9244272695352cf90eef087daea1dc5a0bab1119) Thanks [@mbertin-ledger](https://github.com/mbertin-ledger)! - Replace "Allow Manager" Lottie by "Validate" Lottie's

- [#5591](https://github.com/LedgerHQ/ledger-live/pull/5591) [`7e4b1d0`](https://github.com/LedgerHQ/ledger-live/commit/7e4b1d082bdf73fd3b84a7a24e49dfe73a60a02c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix 2 "X" icons to close when scanning QR code on Send

- [#5586](https://github.com/LedgerHQ/ledger-live/pull/5586) [`2a543de`](https://github.com/LedgerHQ/ledger-live/commit/2a543de8f5d94cb496d277dec228ddc8c5c2e734) Thanks [@chabroA](https://github.com/chabroA)! - avoid account scheme duplication in add account flow

- [#5572](https://github.com/LedgerHQ/ledger-live/pull/5572) [`134cb77`](https://github.com/LedgerHQ/ledger-live/commit/134cb77a2ce893b892ac5c1361f2382845c50c24) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Loading multiple invalid picture for stax and using the back arrow navigate to the correct page

- [#5559](https://github.com/LedgerHQ/ledger-live/pull/5559) [`d6ed6b4`](https://github.com/LedgerHQ/ledger-live/commit/d6ed6b4400d53348693cfea2031c3c984d6c3e71) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Stax LLM MVP Polishes: ESC and Setup manual

- [#5138](https://github.com/LedgerHQ/ledger-live/pull/5138) [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add low battery warning during early security check

- [#5511](https://github.com/LedgerHQ/ledger-live/pull/5511) [`888241f`](https://github.com/LedgerHQ/ledger-live/commit/888241f58b87d0ff198a156fde47de953f22f230) Thanks [@beths-ledger](https://github.com/beths-ledger)! - remove state update in earn screen that was causing App Not Found screen to display when app state was not loading but the manifest was also not yet found.

- [#5560](https://github.com/LedgerHQ/ledger-live/pull/5560) [`50de57c`](https://github.com/LedgerHQ/ledger-live/commit/50de57cf05e30ac3b5a593872579c40f41467469) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - update design recover banner pixel polish

- [#4710](https://github.com/LedgerHQ/ledger-live/pull/4710) [`a1f9e20`](https://github.com/LedgerHQ/ledger-live/commit/a1f9e209e661a8446216fe21257cfce84840404e) Thanks [@mohammed-ledger](https://github.com/mohammed-ledger)! - Add sonarqube integration

- [#5594](https://github.com/LedgerHQ/ledger-live/pull/5594) [`124fbb3`](https://github.com/LedgerHQ/ledger-live/commit/124fbb349a67b2aad8f8cc8f102100ff6c7a3d8e) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix - LLM - Fixed post onboarding not properly closed causing it to reopen.

- [#5560](https://github.com/LedgerHQ/ledger-live/pull/5560) [`50de57c`](https://github.com/LedgerHQ/ledger-live/commit/50de57cf05e30ac3b5a593872579c40f41467469) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - update design recover banner

- [#5538](https://github.com/LedgerHQ/ledger-live/pull/5538) [`a7f3353`](https://github.com/LedgerHQ/ledger-live/commit/a7f3353b081a9af0591de1192a1d304d0d1724d3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix text color when notifications enabled

- [#5465](https://github.com/LedgerHQ/ledger-live/pull/5465) [`38f9956`](https://github.com/LedgerHQ/ledger-live/commit/38f9956fba6bded4e7b41062ea973d85dba0d745) Thanks [@mbertin-ledger](https://github.com/mbertin-ledger)! - Remove useless notification channel on Android

- [#5446](https://github.com/LedgerHQ/ledger-live/pull/5446) [`2b3ed02`](https://github.com/LedgerHQ/ledger-live/commit/2b3ed025d6988a4b7560522c209a5c9c1ca430a2) Thanks [@gre](https://github.com/gre)! - Rework the marketcap ordering of currencies using the new v3 countervalues API.

- [#5605](https://github.com/LedgerHQ/ledger-live/pull/5605) [`878ab36`](https://github.com/LedgerHQ/ledger-live/commit/878ab361a197e766228e31565f0d472ba7be6fec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mask MyLedger device list when more than 3

- [#5472](https://github.com/LedgerHQ/ledger-live/pull/5472) [`b82d161`](https://github.com/LedgerHQ/ledger-live/commit/b82d16148f0cd7fe456a3c56aae707e0be61fe19) Thanks [@gre](https://github.com/gre)! - Optimize filtering on currencies in add account flows (LLD+LLM)

- Updated dependencies [[`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013), [`ed17856`](https://github.com/LedgerHQ/ledger-live/commit/ed17856adc5a6723bc87c409e03a2b832432a1db), [`b7d58b4`](https://github.com/LedgerHQ/ledger-live/commit/b7d58b4cf3aa041b7b794d9af6f0b89bbc0df633), [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d), [`1ccd674`](https://github.com/LedgerHQ/ledger-live/commit/1ccd6746e9ccec5e60ae576d09aca48767da1124), [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9), [`f20c114`](https://github.com/LedgerHQ/ledger-live/commit/f20c1149be9eb255e05f0f41f4a0575e8b89dab6), [`75d0019`](https://github.com/LedgerHQ/ledger-live/commit/75d001910faa24bcb76c49eb66c0c49e9770f4b2), [`39d327e`](https://github.com/LedgerHQ/ledger-live/commit/39d327ec4965bda6a8fb6f202238e3156451cfde), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`342ed3b`](https://github.com/LedgerHQ/ledger-live/commit/342ed3b81613ca81790c1c3d6cfe639c8700562a), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29), [`cc56827`](https://github.com/LedgerHQ/ledger-live/commit/cc56827cc9682049a02d1360683ecdfd9460f4c9), [`88da01e`](https://github.com/LedgerHQ/ledger-live/commit/88da01e071a0332236b7fdeda619a0eb0284cec7), [`c094e4e`](https://github.com/LedgerHQ/ledger-live/commit/c094e4ed0c3220877d13703e20c77a0b013cd3ea), [`c8172ab`](https://github.com/LedgerHQ/ledger-live/commit/c8172abc5c052a753b93be8b6c9cfd88ce0dd64a), [`88fc78a`](https://github.com/LedgerHQ/ledger-live/commit/88fc78a7c1a8fee9102b3c8c907372497425d143), [`5d03bf5`](https://github.com/LedgerHQ/ledger-live/commit/5d03bf514fcf7aea91dc8beae0cd503ed6b4ab3c), [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63), [`2545442`](https://github.com/LedgerHQ/ledger-live/commit/25454425a7f80b551025513f1c2f1bdecb7cceeb), [`124fbb3`](https://github.com/LedgerHQ/ledger-live/commit/124fbb349a67b2aad8f8cc8f102100ff6c7a3d8e), [`d4a17e1`](https://github.com/LedgerHQ/ledger-live/commit/d4a17e177afb3cd6888479b7319ccb1c38011faa), [`6dc1007`](https://github.com/LedgerHQ/ledger-live/commit/6dc100774010ad674001d04b531239f5adfdce7b), [`95ce679`](https://github.com/LedgerHQ/ledger-live/commit/95ce679a9da4e72672903ee63167cca8eea7c910), [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04), [`313d52a`](https://github.com/LedgerHQ/ledger-live/commit/313d52a516b911229537d7e50badaedd045ed2a0), [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446), [`c4bc268`](https://github.com/LedgerHQ/ledger-live/commit/c4bc2688de43ad1f5ecec5e83d8e5c88edb6d372), [`95acaec`](https://github.com/LedgerHQ/ledger-live/commit/95acaec69f559295ffbe289abc8cddc598038ca7), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`6d62700`](https://github.com/LedgerHQ/ledger-live/commit/6d627002d76a81d68663e33cdcaeebcd89ea84d8), [`2b3ed02`](https://github.com/LedgerHQ/ledger-live/commit/2b3ed025d6988a4b7560522c209a5c9c1ca430a2), [`6dea540`](https://github.com/LedgerHQ/ledger-live/commit/6dea54057f67162a1f556661afae16e0422f7ac3), [`e70e345`](https://github.com/LedgerHQ/ledger-live/commit/e70e345bd21d4f5c82fbedfd4447aec0e866be5a)]:
  - @ledgerhq/live-config@1.0.0-next.0
  - @ledgerhq/live-common@33.3.0-next.0
  - @ledgerhq/types-live@6.43.1-next.0
  - @ledgerhq/coin-framework@0.10.0-next.0
  - @ledgerhq/live-env@0.8.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.32.0-next.0
  - @ledgerhq/hw-transport@6.30.1-next.0
  - @ledgerhq/errors@6.16.1-next.0
  - @ledgerhq/native-ui@0.22.3-next.0
  - @ledgerhq/coin-evm@0.11.1-next.0
  - @ledgerhq/devices@8.2.0-next.0
  - @ledgerhq/domain-service@1.1.16-next.0
  - @ledgerhq/hw-transport-http@6.29.1-next.0
  - @ledgerhq/react-native-hid@6.31.1-next.0

## 3.35.0

### Minor Changes

- [#5332](https://github.com/LedgerHQ/ledger-live/pull/5332) [`e6aa09cfe1`](https://github.com/LedgerHQ/ledger-live/commit/e6aa09cfe15147f19af09e5963b61ddac3370e3e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix localization in App Store

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for casper blockchain

- [#5359](https://github.com/LedgerHQ/ledger-live/pull/5359) [`133ad8f25e`](https://github.com/LedgerHQ/ledger-live/commit/133ad8f25e6b82d779bb5bc92d1ba34e7a65c0e8) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move useBroadcast from LLD/LLM to live-common

- [#5279](https://github.com/LedgerHQ/ledger-live/pull/5279) [`4aed614347`](https://github.com/LedgerHQ/ledger-live/commit/4aed6143474e999f0f8f9ad4a903ff4fb1a6cc16) Thanks [@KVNLS](https://github.com/KVNLS)! - Update Android SDK from 33 to 34

### Patch Changes

- [#5374](https://github.com/LedgerHQ/ledger-live/pull/5374) [`86745e3f3c`](https://github.com/LedgerHQ/ledger-live/commit/86745e3f3ce937b3d0aa05122350b4e9e9d9f7f2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - TransferDrawer modifications on Swap/buy popular tag and remove entry for WalletConnect

- [#5252](https://github.com/LedgerHQ/ledger-live/pull/5252) [`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Recover options/promotion remove for uncompatible devices

- [#5528](https://github.com/LedgerHQ/ledger-live/pull/5528) [`8438a7bdbc`](https://github.com/LedgerHQ/ledger-live/commit/8438a7bdbc704f425f5c89469cbe9bb38bb293bd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix wording in receive flow

- [#5292](https://github.com/LedgerHQ/ledger-live/pull/5292) [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Lukso

- [#5387](https://github.com/LedgerHQ/ledger-live/pull/5387) [`d53359ee99`](https://github.com/LedgerHQ/ledger-live/commit/d53359ee994d0f06b4c20b382ec471c2a38d02a8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wallet Connect CTA was displayed in the Earn section on supported account page, now it's on the Asset & Account header page when supported

- [#5473](https://github.com/LedgerHQ/ledger-live/pull/5473) [`b98f9d832e`](https://github.com/LedgerHQ/ledger-live/commit/b98f9d832eafb84397b1a094a664e17b05389f8a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed unresponsive export logs on android 14

- [#5277](https://github.com/LedgerHQ/ledger-live/pull/5277) [`1e3692f0f7`](https://github.com/LedgerHQ/ledger-live/commit/1e3692f0f7619b2f1ed62d3ad8947a0bc0eee61e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix analytics on tabs in header

- [#5486](https://github.com/LedgerHQ/ledger-live/pull/5486) [`4657a5ba87`](https://github.com/LedgerHQ/ledger-live/commit/4657a5ba87e6a237ae73c072e776ad55deb2fa02) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: race condition on exchange issue in PairDevices

  - Due to an incorrect usage of RxJS firstValueFrom
  - Also improve observability with tracing

- [#5463](https://github.com/LedgerHQ/ledger-live/pull/5463) [`6c07f1ec32`](https://github.com/LedgerHQ/ledger-live/commit/6c07f1ec32b9df630c1c53fe5c2407b7bf79458c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - remove state update in earn screen that was causing App Not Found screen to display when app state was not loading but the manifest was also not yet found.

- [#5409](https://github.com/LedgerHQ/ledger-live/pull/5409) [`432714b322`](https://github.com/LedgerHQ/ledger-live/commit/432714b3220cae449b75c810fb8022725013c8d7) Thanks [@chabroA](https://github.com/chabroA)! - Fix set custom fees in evm flow

  When updating the fees in custom mode for an EVM transaction, clicking on the "Valide Fees" CTA would't do anything (expected behaviour would be to return the fee strategy selection screen with new custom entry selected).
  Fixes this and returns to fee strategy selection screen with the new custom entry selected.
  PS: for the swap flow, updating the transaction will redirect to the swap summary screen, which is the expected behaviour as of today

- [#5070](https://github.com/LedgerHQ/ledger-live/pull/5070) [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove walletConnectLiveApp featurFlag

- [#5444](https://github.com/LedgerHQ/ledger-live/pull/5444) [`23d19443fe`](https://github.com/LedgerHQ/ledger-live/commit/23d19443fef6e314e56084b0a8ec8630eb412c7b) Thanks [@chabroA](https://github.com/chabroA)! - update "enable contract data" error message

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - fixes crash on llm when parsing operations

- [#5224](https://github.com/LedgerHQ/ledger-live/pull/5224) [`75781c1ba8`](https://github.com/LedgerHQ/ledger-live/commit/75781c1ba87ae8f2a21b18d86525b7186b3a1d1e) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Partly upgrade legacy components to modern components

- [#5315](https://github.com/LedgerHQ/ledger-live/pull/5315) [`19c7484663`](https://github.com/LedgerHQ/ledger-live/commit/19c7484663e9e1592b8b2024bee3cdbeb1853e0a) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Improve wording of "not found entity" error

- [#5225](https://github.com/LedgerHQ/ledger-live/pull/5225) [`de2e03534a`](https://github.com/LedgerHQ/ledger-live/commit/de2e03534ac831fcb66d1f038d0e90e7f65f2545) Thanks [@lvndry](https://github.com/lvndry)! - Update bondedBalanceBelowMinimum message

- [#5288](https://github.com/LedgerHQ/ledger-live/pull/5288) [`6d782bb877`](https://github.com/LedgerHQ/ledger-live/commit/6d782bb877451f18000a65c44524b9a79cf3403b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix wording mentioning "Manager"/"the manager" instead of "My Ledger" which is the correct name for this screen

- [#5263](https://github.com/LedgerHQ/ledger-live/pull/5263) [`efb63747a7`](https://github.com/LedgerHQ/ledger-live/commit/efb63747a7dc37ac56786754ffdacc54f7d8b88e) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Remove "Login to Ledger Recover" button

- [#5376](https://github.com/LedgerHQ/ledger-live/pull/5376) [`f2f0a88d54`](https://github.com/LedgerHQ/ledger-live/commit/f2f0a88d5479cc333328c8dc80aeab7295de79b7) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update earn dashboard player padding to be platform dependent.

- Updated dependencies [[`a3ee4acfaa`](https://github.com/LedgerHQ/ledger-live/commit/a3ee4acfaa286c73916514f320451fa9d562d4fb), [`743e1ede3e`](https://github.com/LedgerHQ/ledger-live/commit/743e1ede3eebf806e1e22c8627191b419870a476), [`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3), [`98739b2007`](https://github.com/LedgerHQ/ledger-live/commit/98739b2007ee33ad675881cd824056a41b2907f6), [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd), [`b47113d7bb`](https://github.com/LedgerHQ/ledger-live/commit/b47113d7bbc42b06e85e4b5e6e247565ec6cd2cb), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`f2e408d7a1`](https://github.com/LedgerHQ/ledger-live/commit/f2e408d7a1debf9bb4fcc9811999b2be3764059f), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`a150321fc9`](https://github.com/LedgerHQ/ledger-live/commit/a150321fc90a5256144316ce20f071885065a6d9), [`1b72bebc07`](https://github.com/LedgerHQ/ledger-live/commit/1b72bebc07da1a5be6f16d1b329f5e26c30311f0), [`d53359ee99`](https://github.com/LedgerHQ/ledger-live/commit/d53359ee994d0f06b4c20b382ec471c2a38d02a8), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`4657a5ba87`](https://github.com/LedgerHQ/ledger-live/commit/4657a5ba87e6a237ae73c072e776ad55deb2fa02), [`3aef1832ea`](https://github.com/LedgerHQ/ledger-live/commit/3aef1832ea76ba32c999bee6e408251e7ecb0b3b), [`3122c64b07`](https://github.com/LedgerHQ/ledger-live/commit/3122c64b07177468016f2becaa036bc67c8743f5), [`710fed08da`](https://github.com/LedgerHQ/ledger-live/commit/710fed08daf6d54727065657e9cb9feaa1a2e54a), [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`133ad8f25e`](https://github.com/LedgerHQ/ledger-live/commit/133ad8f25e6b82d779bb5bc92d1ba34e7a65c0e8), [`da9e3cd1e6`](https://github.com/LedgerHQ/ledger-live/commit/da9e3cd1e6f3b9b8846260b552e18fde19e18b32), [`19c7484663`](https://github.com/LedgerHQ/ledger-live/commit/19c7484663e9e1592b8b2024bee3cdbeb1853e0a), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/live-common@33.2.0
  - @ledgerhq/coin-evm@0.11.0
  - @ledgerhq/types-live@6.43.0
  - @ledgerhq/types-cryptoassets@7.8.0
  - @ledgerhq/errors@6.16.0
  - @ledgerhq/coin-framework@0.9.0
  - @ledgerhq/live-env@0.7.0
  - @ledgerhq/react-native-hw-transport-ble@6.31.0
  - @ledgerhq/hw-transport-http@6.29.0
  - @ledgerhq/react-native-hid@6.31.0
  - @ledgerhq/types-devices@6.23.0
  - @ledgerhq/hw-transport@6.30.0
  - @ledgerhq/devices@8.1.0
  - @ledgerhq/logs@6.12.0
  - @ledgerhq/domain-service@1.1.15
  - @ledgerhq/native-ui@0.22.2

## 3.35.0-next.7

### Patch Changes

- [#5528](https://github.com/LedgerHQ/ledger-live/pull/5528) [`8438a7bdbc`](https://github.com/LedgerHQ/ledger-live/commit/8438a7bdbc704f425f5c89469cbe9bb38bb293bd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix wording in receive flow

## 3.35.0-next.6

### Patch Changes

- Updated dependencies [[`b47113d7bb`](https://github.com/LedgerHQ/ledger-live/commit/b47113d7bbc42b06e85e4b5e6e247565ec6cd2cb)]:
  - @ledgerhq/live-common@33.2.0-next.4

## 3.35.0-next.5

### Patch Changes

- [#5463](https://github.com/LedgerHQ/ledger-live/pull/5463) [`6c07f1ec32`](https://github.com/LedgerHQ/ledger-live/commit/6c07f1ec32b9df630c1c53fe5c2407b7bf79458c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - remove state update in earn screen that was causing App Not Found screen to display when app state was not loading but the manifest was also not yet found.

## 3.35.0-next.4

### Patch Changes

- [#5486](https://github.com/LedgerHQ/ledger-live/pull/5486) [`4657a5ba87`](https://github.com/LedgerHQ/ledger-live/commit/4657a5ba87e6a237ae73c072e776ad55deb2fa02) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: race condition on exchange issue in PairDevices

  - Due to an incorrect usage of RxJS firstValueFrom
  - Also improve observability with tracing

- Updated dependencies [[`4657a5ba87`](https://github.com/LedgerHQ/ledger-live/commit/4657a5ba87e6a237ae73c072e776ad55deb2fa02)]:
  - @ledgerhq/live-common@33.2.0-next.3

## 3.35.0-next.3

### Patch Changes

- Updated dependencies [[`a3ee4acfaa`](https://github.com/LedgerHQ/ledger-live/commit/a3ee4acfaa286c73916514f320451fa9d562d4fb)]:
  - @ledgerhq/live-common@33.2.0-next.2

## 3.35.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-evm@0.11.0-next.1
  - @ledgerhq/coin-framework@0.9.0-next.1
  - @ledgerhq/live-common@33.2.0-next.1

## 3.35.0-next.1

### Patch Changes

- [#5473](https://github.com/LedgerHQ/ledger-live/pull/5473) [`b98f9d832e`](https://github.com/LedgerHQ/ledger-live/commit/b98f9d832eafb84397b1a094a664e17b05389f8a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed unresponsive export logs on android 14

## 3.35.0-next.0

### Minor Changes

- [#5332](https://github.com/LedgerHQ/ledger-live/pull/5332) [`e6aa09cfe1`](https://github.com/LedgerHQ/ledger-live/commit/e6aa09cfe15147f19af09e5963b61ddac3370e3e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix localization in App Store

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for casper blockchain

- [#5359](https://github.com/LedgerHQ/ledger-live/pull/5359) [`133ad8f25e`](https://github.com/LedgerHQ/ledger-live/commit/133ad8f25e6b82d779bb5bc92d1ba34e7a65c0e8) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move useBroadcast from LLD/LLM to live-common

- [#5279](https://github.com/LedgerHQ/ledger-live/pull/5279) [`4aed614347`](https://github.com/LedgerHQ/ledger-live/commit/4aed6143474e999f0f8f9ad4a903ff4fb1a6cc16) Thanks [@KVNLS](https://github.com/KVNLS)! - Update Android SDK from 33 to 34

### Patch Changes

- [#5374](https://github.com/LedgerHQ/ledger-live/pull/5374) [`86745e3f3c`](https://github.com/LedgerHQ/ledger-live/commit/86745e3f3ce937b3d0aa05122350b4e9e9d9f7f2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - TransferDrawer modifications on Swap/buy popular tag and remove entry for WalletConnect

- [#5252](https://github.com/LedgerHQ/ledger-live/pull/5252) [`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Recover options/promotion remove for uncompatible devices

- [#5292](https://github.com/LedgerHQ/ledger-live/pull/5292) [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Lukso

- [#5387](https://github.com/LedgerHQ/ledger-live/pull/5387) [`d53359ee99`](https://github.com/LedgerHQ/ledger-live/commit/d53359ee994d0f06b4c20b382ec471c2a38d02a8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wallet Connect CTA was displayed in the Earn section on supported account page, now it's on the Asset & Account header page when supported

- [#5277](https://github.com/LedgerHQ/ledger-live/pull/5277) [`1e3692f0f7`](https://github.com/LedgerHQ/ledger-live/commit/1e3692f0f7619b2f1ed62d3ad8947a0bc0eee61e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix analytics on tabs in header

- [#5409](https://github.com/LedgerHQ/ledger-live/pull/5409) [`432714b322`](https://github.com/LedgerHQ/ledger-live/commit/432714b3220cae449b75c810fb8022725013c8d7) Thanks [@chabroA](https://github.com/chabroA)! - Fix set custom fees in evm flow

  When updating the fees in custom mode for an EVM transaction, clicking on the "Valide Fees" CTA would't do anything (expected behaviour would be to return the fee strategy selection screen with new custom entry selected).
  Fixes this and returns to fee strategy selection screen with the new custom entry selected.
  PS: for the swap flow, updating the transaction will redirect to the swap summary screen, which is the expected behaviour as of today

- [#5070](https://github.com/LedgerHQ/ledger-live/pull/5070) [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove walletConnectLiveApp featurFlag

- [#5444](https://github.com/LedgerHQ/ledger-live/pull/5444) [`23d19443fe`](https://github.com/LedgerHQ/ledger-live/commit/23d19443fef6e314e56084b0a8ec8630eb412c7b) Thanks [@chabroA](https://github.com/chabroA)! - update "enable contract data" error message

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - fixes crash on llm when parsing operations

- [#5224](https://github.com/LedgerHQ/ledger-live/pull/5224) [`75781c1ba8`](https://github.com/LedgerHQ/ledger-live/commit/75781c1ba87ae8f2a21b18d86525b7186b3a1d1e) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Partly upgrade legacy components to modern components

- [#5315](https://github.com/LedgerHQ/ledger-live/pull/5315) [`19c7484663`](https://github.com/LedgerHQ/ledger-live/commit/19c7484663e9e1592b8b2024bee3cdbeb1853e0a) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Improve wording of "not found entity" error

- [#5225](https://github.com/LedgerHQ/ledger-live/pull/5225) [`de2e03534a`](https://github.com/LedgerHQ/ledger-live/commit/de2e03534ac831fcb66d1f038d0e90e7f65f2545) Thanks [@lvndry](https://github.com/lvndry)! - Update bondedBalanceBelowMinimum message

- [#5288](https://github.com/LedgerHQ/ledger-live/pull/5288) [`6d782bb877`](https://github.com/LedgerHQ/ledger-live/commit/6d782bb877451f18000a65c44524b9a79cf3403b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix wording mentioning "Manager"/"the manager" instead of "My Ledger" which is the correct name for this screen

- [#5263](https://github.com/LedgerHQ/ledger-live/pull/5263) [`efb63747a7`](https://github.com/LedgerHQ/ledger-live/commit/efb63747a7dc37ac56786754ffdacc54f7d8b88e) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Remove "Login to Ledger Recover" button

- [#5376](https://github.com/LedgerHQ/ledger-live/pull/5376) [`f2f0a88d54`](https://github.com/LedgerHQ/ledger-live/commit/f2f0a88d5479cc333328c8dc80aeab7295de79b7) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update earn dashboard player padding to be platform dependent.

- Updated dependencies [[`743e1ede3e`](https://github.com/LedgerHQ/ledger-live/commit/743e1ede3eebf806e1e22c8627191b419870a476), [`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3), [`98739b2007`](https://github.com/LedgerHQ/ledger-live/commit/98739b2007ee33ad675881cd824056a41b2907f6), [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`f2e408d7a1`](https://github.com/LedgerHQ/ledger-live/commit/f2e408d7a1debf9bb4fcc9811999b2be3764059f), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`a150321fc9`](https://github.com/LedgerHQ/ledger-live/commit/a150321fc90a5256144316ce20f071885065a6d9), [`1b72bebc07`](https://github.com/LedgerHQ/ledger-live/commit/1b72bebc07da1a5be6f16d1b329f5e26c30311f0), [`d53359ee99`](https://github.com/LedgerHQ/ledger-live/commit/d53359ee994d0f06b4c20b382ec471c2a38d02a8), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`3aef1832ea`](https://github.com/LedgerHQ/ledger-live/commit/3aef1832ea76ba32c999bee6e408251e7ecb0b3b), [`3122c64b07`](https://github.com/LedgerHQ/ledger-live/commit/3122c64b07177468016f2becaa036bc67c8743f5), [`710fed08da`](https://github.com/LedgerHQ/ledger-live/commit/710fed08daf6d54727065657e9cb9feaa1a2e54a), [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`133ad8f25e`](https://github.com/LedgerHQ/ledger-live/commit/133ad8f25e6b82d779bb5bc92d1ba34e7a65c0e8), [`da9e3cd1e6`](https://github.com/LedgerHQ/ledger-live/commit/da9e3cd1e6f3b9b8846260b552e18fde19e18b32), [`19c7484663`](https://github.com/LedgerHQ/ledger-live/commit/19c7484663e9e1592b8b2024bee3cdbeb1853e0a), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/coin-evm@0.11.0-next.0
  - @ledgerhq/types-live@6.43.0-next.0
  - @ledgerhq/live-common@33.2.0-next.0
  - @ledgerhq/types-cryptoassets@7.8.0-next.0
  - @ledgerhq/errors@6.16.0-next.0
  - @ledgerhq/coin-framework@0.9.0-next.0
  - @ledgerhq/live-env@0.7.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.31.0-next.0
  - @ledgerhq/hw-transport-http@6.29.0-next.0
  - @ledgerhq/react-native-hid@6.31.0-next.0
  - @ledgerhq/types-devices@6.23.0-next.0
  - @ledgerhq/hw-transport@6.30.0-next.0
  - @ledgerhq/devices@8.1.0-next.0
  - @ledgerhq/logs@6.12.0-next.0
  - @ledgerhq/domain-service@1.1.15-next.0
  - @ledgerhq/native-ui@0.22.2-next.0

## 3.34.1

### Patch Changes

- Updated dependencies [[`100f41a61f`](https://github.com/LedgerHQ/ledger-live/commit/100f41a61f5958e9ba1426ea0b8069c35ea94cb8), [`5ea4167efa`](https://github.com/LedgerHQ/ledger-live/commit/5ea4167efa81a0c8257db03e77e833280ece3feb)]:
  - @ledgerhq/live-common@33.1.1

## 3.34.1-hotfix.1

### Patch Changes

- Updated dependencies [[`5ea4167efa`](https://github.com/LedgerHQ/ledger-live/commit/5ea4167efa81a0c8257db03e77e833280ece3feb)]:
  - @ledgerhq/live-common@33.1.1-hotfix.1

## 3.34.1-hotfix.0

### Patch Changes

- Updated dependencies [[`100f41a61f`](https://github.com/LedgerHQ/ledger-live/commit/100f41a61f5958e9ba1426ea0b8069c35ea94cb8)]:
  - @ledgerhq/live-common@33.1.1-hotfix.0

## 3.34.0

### Minor Changes

- [#5167](https://github.com/LedgerHQ/ledger-live/pull/5167) [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Dydx

- [#5173](https://github.com/LedgerHQ/ledger-live/pull/5173) [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e) Thanks [@chabroA](https://github.com/chabroA)! - Add neon_evm support

- [#4985](https://github.com/LedgerHQ/ledger-live/pull/4985) [`e9af8df166`](https://github.com/LedgerHQ/ledger-live/commit/e9af8df16658fbab689af98f4b6f7e5c21967802) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add custom handler support

- [#4919](https://github.com/LedgerHQ/ledger-live/pull/4919) [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Change network error to better suit node flakiness

- [#4979](https://github.com/LedgerHQ/ledger-live/pull/4979) [`68488f4d7e`](https://github.com/LedgerHQ/ledger-live/commit/68488f4d7e372c9890d38c2ab7a74f4a0aea1dd1) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update deep link routing on mobile to redirect to account screen on /account?currency={{id}}... in line with desktop deep links.

### Patch Changes

- [#4808](https://github.com/LedgerHQ/ledger-live/pull/4808) [`881cd3462e`](https://github.com/LedgerHQ/ledger-live/commit/881cd3462e854b9859c1ce70559366ce555afd24) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - remove source query params includes in featureflags

- [#5068](https://github.com/LedgerHQ/ledger-live/pull/5068) [`4c292d6a54`](https://github.com/LedgerHQ/ledger-live/commit/4c292d6a545d19883be679b4e110130210801b79) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Search input Market was refreshing for each input

- [#4932](https://github.com/LedgerHQ/ledger-live/pull/4932) [`9d8c602fd2`](https://github.com/LedgerHQ/ledger-live/commit/9d8c602fd21bc21f3255726535b16fafd9ca92d5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - NFT screen/Stax: only display "custom lock screen" option if the user has connected a Stax once

- [#5158](https://github.com/LedgerHQ/ledger-live/pull/5158) [`54a648ae4e`](https://github.com/LedgerHQ/ledger-live/commit/54a648ae4ec8e337e7137402e5bb22f82c863444) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM Experimental features section translation is done

- [#5060](https://github.com/LedgerHQ/ledger-live/pull/5060) [`518e5d888b`](https://github.com/LedgerHQ/ledger-live/commit/518e5d888b2f46967ed25188c1ee88cdace9f56d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - refresh segment user properties when accounts changes

- [#5251](https://github.com/LedgerHQ/ledger-live/pull/5251) [`0ea184bdbf`](https://github.com/LedgerHQ/ledger-live/commit/0ea184bdbfc3c73095669732e27e7050a6ef2770) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Rename some of the Stax tracking events to not include the product name in their eventName

- [#4877](https://github.com/LedgerHQ/ledger-live/pull/4877) [`bb247ac329`](https://github.com/LedgerHQ/ledger-live/commit/bb247ac329fb5594a4742e765bdb4ccc0b69112f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - improve ble pairing deep links

- [#5178](https://github.com/LedgerHQ/ledger-live/pull/5178) [`148e1b58af`](https://github.com/LedgerHQ/ledger-live/commit/148e1b58af080ee51ee36bf0f7dfc6277d047dfc) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Deposit flow: adress verification close button redirect to the QR code page

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- [#5278](https://github.com/LedgerHQ/ledger-live/pull/5278) [`0a133fe2c9`](https://github.com/LedgerHQ/ledger-live/commit/0a133fe2c98ed25ba40c6db78fa0d57b8695e288) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix text Onboarding partners mention

- [#4896](https://github.com/LedgerHQ/ledger-live/pull/4896) [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flag listAppsV2 replaced by listAppsV2minor1
  Fix listApps v2 logic: adapt to breaking changes in the API and fix "polyfilling" logic of data of apps

- [#4999](https://github.com/LedgerHQ/ledger-live/pull/4999) [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor FeatureFlagsProvider and take into account new signature of useFeature (can return null)

- [#4289](https://github.com/LedgerHQ/ledger-live/pull/4289) [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade react-native to 0.72.3 (also closely related dependencies such as expo SDK to expo 49, react-native-reanimated to 3.3.0, @react-native-community/cli to 11.3.7)

- [#5305](https://github.com/LedgerHQ/ledger-live/pull/5305) [`1a914e801e`](https://github.com/LedgerHQ/ledger-live/commit/1a914e801e333fe2ad99319122d8e9a64029eaba) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: added locked device errors to Sentry ignore list

- [#4922](https://github.com/LedgerHQ/ledger-live/pull/4922) [`4831135369`](https://github.com/LedgerHQ/ledger-live/commit/48311353690bf352686b7e34874055fa7fd89c02) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Tap and drag to see price over time on graph is buggy on LLM

- [#5136](https://github.com/LedgerHQ/ledger-live/pull/5136) [`6cf5d66f6a`](https://github.com/LedgerHQ/ledger-live/commit/6cf5d66f6a4c41b757d2456994e746281e0b576c) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Fix wallet/account background gradient on large phones

- [#4845](https://github.com/LedgerHQ/ledger-live/pull/4845) [`f08474f11a`](https://github.com/LedgerHQ/ledger-live/commit/f08474f11a09963e2a7ffae3d57ce2146c1e58c3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update wording on Lock Screen for Stax

- [#5078](https://github.com/LedgerHQ/ledger-live/pull/5078) [`4909b28695`](https://github.com/LedgerHQ/ledger-live/commit/4909b28695ed0d09b485c35597bf9d6a43097ed6) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Passed currency param on recover redirection

- [#5106](https://github.com/LedgerHQ/ledger-live/pull/5106) [`af02880169`](https://github.com/LedgerHQ/ledger-live/commit/af02880169368df0ea1f14046f9adbc6326c9fcf) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Display correct transaction date in the Wallet transaction history

- [#4871](https://github.com/LedgerHQ/ledger-live/pull/4871) [`97c5941c94`](https://github.com/LedgerHQ/ledger-live/commit/97c5941c948298d27633ffd44020fd3c9404f448) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Stax wording + add oldVersion -> newVersion to firmware update screen

- [#5170](https://github.com/LedgerHQ/ledger-live/pull/5170) [`5ec0f1fc32`](https://github.com/LedgerHQ/ledger-live/commit/5ec0f1fc325fdca70da5c990a8e399f838bc3c15) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove Recommendations section in the settings

- [#4953](https://github.com/LedgerHQ/ledger-live/pull/4953) [`ec8a37c9ef`](https://github.com/LedgerHQ/ledger-live/commit/ec8a37c9ef9819f7b708b61fcda660df029d3d6a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update My Ledger provider wording in Experimental feature

- [#5136](https://github.com/LedgerHQ/ledger-live/pull/5136) [`511df15eb3`](https://github.com/LedgerHQ/ledger-live/commit/511df15eb38251ac343abb2ef306c25a76fe1301) Thanks [@ak-ledger](https://github.com/ak-ledger)! - My ledger Tab: change nano device size for large phones

- [#4991](https://github.com/LedgerHQ/ledger-live/pull/4991) [`fcb3bec5a3`](https://github.com/LedgerHQ/ledger-live/commit/fcb3bec5a3b0180127bf0b6aec96cd41ee4fdbce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - QR Code scan during Send paste address in input

- [#5118](https://github.com/LedgerHQ/ledger-live/pull/5118) [`c21faee219`](https://github.com/LedgerHQ/ledger-live/commit/c21faee2195d4839a8d498ec76421424f1acc06d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Add new analytics user properties for notifications preferences

- [#4755](https://github.com/LedgerHQ/ledger-live/pull/4755) [`7cb2d033a6`](https://github.com/LedgerHQ/ledger-live/commit/7cb2d033a6b358e3508c098565393ebc64b25166) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): request account was not showing token accounts in some cases

  The issue was only visible on mobile but is also prevented on desktop now
  The issue was only reproducible when omitting the parent account currency from the currencyIds of the request account query

- [#5201](https://github.com/LedgerHQ/ledger-live/pull/5201) [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f) Thanks [@mle-gall](https://github.com/mle-gall)! - New supported countervalues source from API.

- [#4841](https://github.com/LedgerHQ/ledger-live/pull/4841) [`948d3bac85`](https://github.com/LedgerHQ/ledger-live/commit/948d3bac856a47ef203989111f565002379c416e) Thanks [@cksanders](https://github.com/cksanders)! - Add account wallet id conversion for buy deeplinks

- [#4929](https://github.com/LedgerHQ/ledger-live/pull/4929) [`46fd5666c1`](https://github.com/LedgerHQ/ledger-live/commit/46fd5666c128cab15e2c23d130b60de77c734b15) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: remove the "save logs" button if the error is a "refused on device" error

- [#5001](https://github.com/LedgerHQ/ledger-live/pull/5001) [`a733486230`](https://github.com/LedgerHQ/ledger-live/commit/a7334862309bb85480c48b471ccd5a7232f5a795) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Added Path Mappings to LLM

- [#4896](https://github.com/LedgerHQ/ledger-live/pull/4896) [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix interaction between "InstalledAppsModal" and "UninstallDependenciesModal", the later one was not getting opened in case an app with dependents was getting uninstalled from the first one, due to a bad usage of drawers (not using QueuedDrawer).
  Refactor prop drilling nightmare of setAppInstallWithDependencies/setAppUninstallWithDependencies with a simple React.Context.
  Refactor InstalledAppDependenciesModal and UninstallAppDependenciesModal to have no business logic inside
  Rename action creator installAppFirstTime to setHasInstalledAnyApp for more clarity

- [#5119](https://github.com/LedgerHQ/ledger-live/pull/5119) [`2691a1419d`](https://github.com/LedgerHQ/ledger-live/commit/2691a1419de5ea299d72eeb973ad3792898850d3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix success event on last step in Deposit flow

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: enable printing logs to stdout for debug

  - Setup simple tracing system on LLM with context
  - If `VERBOSE` env var is set, filtered logs can be stdout from the main thread

- [#4930](https://github.com/LedgerHQ/ledger-live/pull/4930) [`bbad6146ce`](https://github.com/LedgerHQ/ledger-live/commit/bbad6146cee4fa55a8d0e2fec47579c945e6e59b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix of OperationDetails view using the wrong currency in the `useNftMetadata` & `useNftCollectionMetadata` hooks

- [#4887](https://github.com/LedgerHQ/ledger-live/pull/4887) [`cf5ee11bad`](https://github.com/LedgerHQ/ledger-live/commit/cf5ee11bad98dbe3c473244891b5d2a7ef8d7106) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix discreet mode on Deposit flow LLM

- [#5231](https://github.com/LedgerHQ/ledger-live/pull/5231) [`d6cebdc99b`](https://github.com/LedgerHQ/ledger-live/commit/d6cebdc99b2ecb270c7430454e85189c25f1a2bc) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Add check script

- [#4933](https://github.com/LedgerHQ/ledger-live/pull/4933) [`b959dba2b4`](https://github.com/LedgerHQ/ledger-live/commit/b959dba2b429e06444c16596afe8e32ebf8c367b) Thanks [@lvndry](https://github.com/lvndry)! - fix scan of ethereum addresses from qr code

- [#4983](https://github.com/LedgerHQ/ledger-live/pull/4983) [`719047f16a`](https://github.com/LedgerHQ/ledger-live/commit/719047f16a69ee51945de539514ed491d07c49dd) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add correct drawer when device is locked during pairing

- [#4976](https://github.com/LedgerHQ/ledger-live/pull/4976) [`f2b7c63d6d`](https://github.com/LedgerHQ/ledger-live/commit/f2b7c63d6d734926f825008daa5aa37a0b5ef57b) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Fix onboarding issues when closing quiz drawer

- [#4884](https://github.com/LedgerHQ/ledger-live/pull/4884) [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Need to add other link firebase for quickAccess Recover

- [#4927](https://github.com/LedgerHQ/ledger-live/pull/4927) [`1c16480ee5`](https://github.com/LedgerHQ/ledger-live/commit/1c16480ee5f4e1826e64a6c16c092601a0307e42) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - fix display thumbnail of a story

- [#5019](https://github.com/LedgerHQ/ledger-live/pull/5019) [`fbbd563fad`](https://github.com/LedgerHQ/ledger-live/commit/fbbd563fad154f78cc6ab60ffc5f73731b01413e) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix design of bluetooth pairing error screen

- [#4790](https://github.com/LedgerHQ/ledger-live/pull/4790) [`6b9bf82828`](https://github.com/LedgerHQ/ledger-live/commit/6b9bf8282833909e097c28b61fb149330a281c83) Thanks [@chabroA](https://github.com/chabroA)! - Fix wrong fee value for evm custom fee in strategies list

- [#4789](https://github.com/LedgerHQ/ledger-live/pull/4789) [`2bdd03b36c`](https://github.com/LedgerHQ/ledger-live/commit/2bdd03b36ce296649b18d58d6a68378a5ae09523) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add New Entry in TransferDrawer for Recover

- [#4844](https://github.com/LedgerHQ/ledger-live/pull/4844) [`7ffc6619aa`](https://github.com/LedgerHQ/ledger-live/commit/7ffc6619aae18b8071ce8ebd2d664d8e09729b47) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Fix drawers in LLM onboarding

- [#4818](https://github.com/LedgerHQ/ledger-live/pull/4818) [`e00647bc97`](https://github.com/LedgerHQ/ledger-live/commit/e00647bc9719659f29a30d0acae9c9f609cff8a1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update UI in Manager for Services Recover

- [#5103](https://github.com/LedgerHQ/ledger-live/pull/5103) [`76d57f7f0c`](https://github.com/LedgerHQ/ledger-live/commit/76d57f7f0ce2ef36498ec72e077897785f04c966) Thanks [@lvndry](https://github.com/lvndry)! - Align NotEnoughGas error in LLD and LLM

- [#4800](https://github.com/LedgerHQ/ledger-live/pull/4800) [`e63d3bbc2a`](https://github.com/LedgerHQ/ledger-live/commit/e63d3bbc2ad60411920cc4872d36fc11d1ae73d7) Thanks [@Justkant](https://github.com/Justkant)! - fix: platform-sdk & wallet-api onClose response in `account.request` & `message.sign`

- [#5137](https://github.com/LedgerHQ/ledger-live/pull/5137) [`0d177abe59`](https://github.com/LedgerHQ/ledger-live/commit/0d177abe599f37eb0626eb170a698b5a9bb0f7f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename Deposit into Receive

- [#4877](https://github.com/LedgerHQ/ledger-live/pull/4877) [`bb247ac329`](https://github.com/LedgerHQ/ledger-live/commit/bb247ac329fb5594a4742e765bdb4ccc0b69112f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Create new bluetooth pairing flow screen for onboarding

- [#5215](https://github.com/LedgerHQ/ledger-live/pull/5215) [`279e4e0920`](https://github.com/LedgerHQ/ledger-live/commit/279e4e0920dd762e30a2991963e350e10e401756) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - track flowInitiatedFrom on mobile and desktop for broadcast success

- [#5211](https://github.com/LedgerHQ/ledger-live/pull/5211) [`b259781b72`](https://github.com/LedgerHQ/ledger-live/commit/b259781b7212aa7758437640e7c48c5d17b0fa79) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Include swap batch in segment identity

- [#5069](https://github.com/LedgerHQ/ledger-live/pull/5069) [`ea1f2776c6`](https://github.com/LedgerHQ/ledger-live/commit/ea1f2776c6df46df5dbde42ebc6b42064f0163f5) Thanks [@chabroA](https://github.com/chabroA)! - fix NotEnoughGas related UI on LLM and LLD

  - fix buy CTA button style on LLD to make it more visible
  - add related support link for NotEnoughGas error on LLM and LLD to display an "learn more" CTA redirecting to [related CS article](https://support.ledger.com/hc/en-us/articles/9096370252573?support=true)
  - fix buy button when NotEnoughGas on LLM
    - The logic to display the button was related to the currency being sent and not the main account currency (if I don't have enough fund to pay for the gas when I want to send USDT on ethereum, I need to buy some ETH and not some USDT)
    - The related text was wrongly hardcoded only for ethereum currency when a user might be using another evm network and thus needing to buy a different currency than ethereum (i.e: the currency of the actual EVM network he is using)

- Updated dependencies [[`2ec5360679`](https://github.com/LedgerHQ/ledger-live/commit/2ec53606794c84a08fa49898c31ee976f3a8b9cc), [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757), [`a40169babf`](https://github.com/LedgerHQ/ledger-live/commit/a40169babff5f5ea4938464326dd90bc7e0a8a4a), [`3dc4937cc0`](https://github.com/LedgerHQ/ledger-live/commit/3dc4937cc0c77f6dc40ac7c628e9ab165dfb899f), [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757), [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7), [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072), [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68), [`173d7d6d22`](https://github.com/LedgerHQ/ledger-live/commit/173d7d6d224bcf1cecf364062b6571f52792e371), [`9d9f8bb5d2`](https://github.com/LedgerHQ/ledger-live/commit/9d9f8bb5d2b5dcf5d8223b15c7847c7261dade77), [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e), [`3ce4f6e485`](https://github.com/LedgerHQ/ledger-live/commit/3ce4f6e485ac07c27e11def153cf2e3b656d5ab2), [`2fc6d1efa0`](https://github.com/LedgerHQ/ledger-live/commit/2fc6d1efa0233a90b0fa273782cff1dd6344d52c), [`bf4c366b6f`](https://github.com/LedgerHQ/ledger-live/commit/bf4c366b6f5b062476645fe37ce62b3925822377), [`5883eccc3b`](https://github.com/LedgerHQ/ledger-live/commit/5883eccc3b023c8c18615283a88fea08d705ef6a), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`3b2b2bf847`](https://github.com/LedgerHQ/ledger-live/commit/3b2b2bf847a7e9797b49f48fd31c23368c830a91), [`17a0822f95`](https://github.com/LedgerHQ/ledger-live/commit/17a0822f953a6fc57ed6732b881886b83cfa233b), [`38ea4700ff`](https://github.com/LedgerHQ/ledger-live/commit/38ea4700ff7ccf9c663c03b6deb21ac7c7a6fd28), [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f), [`c3aea5b42d`](https://github.com/LedgerHQ/ledger-live/commit/c3aea5b42defc71ff381bcd0c3dbb7a9ea9332fe), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`6b68e895fb`](https://github.com/LedgerHQ/ledger-live/commit/6b68e895fbee723a2426f7a956796cac31a45454), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68), [`e12ab4c986`](https://github.com/LedgerHQ/ledger-live/commit/e12ab4c9863f4c74a32d081637826d807aee7bcb), [`f52baa219e`](https://github.com/LedgerHQ/ledger-live/commit/f52baa219e1cd85fdb50d47f0c64e10e8533c926), [`719047f16a`](https://github.com/LedgerHQ/ledger-live/commit/719047f16a69ee51945de539514ed491d07c49dd), [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d), [`e9af8df166`](https://github.com/LedgerHQ/ledger-live/commit/e9af8df16658fbab689af98f4b6f7e5c21967802), [`18d4fb6077`](https://github.com/LedgerHQ/ledger-live/commit/18d4fb6077480fe68cbe215019c77fa21a17be48), [`e63d3bbc2a`](https://github.com/LedgerHQ/ledger-live/commit/e63d3bbc2ad60411920cc4872d36fc11d1ae73d7), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`f3b2e7d0eb`](https://github.com/LedgerHQ/ledger-live/commit/f3b2e7d0eb1413781fc45e27c690e73c1058fec6), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd), [`b259781b72`](https://github.com/LedgerHQ/ledger-live/commit/b259781b7212aa7758437640e7c48c5d17b0fa79)]:
  - @ledgerhq/live-common@33.1.0
  - @ledgerhq/native-ui@0.22.1
  - @ledgerhq/types-live@6.42.0
  - @ledgerhq/domain-service@1.1.14
  - @ledgerhq/types-cryptoassets@7.7.0
  - @ledgerhq/coin-evm@0.10.0
  - @ledgerhq/logs@6.11.0
  - @ledgerhq/coin-framework@0.8.1
  - @ledgerhq/hw-transport@6.29.0
  - @ledgerhq/live-env@0.6.1
  - @ledgerhq/react-native-hw-transport-ble@6.30.0
  - @ledgerhq/errors@6.15.0
  - @ledgerhq/devices@8.0.8
  - @ledgerhq/hw-transport-http@6.28.4
  - @ledgerhq/react-native-hid@6.30.1

## 3.34.0-next.1

### Patch Changes

- [#5305](https://github.com/LedgerHQ/ledger-live/pull/5305) [`1a914e801e`](https://github.com/LedgerHQ/ledger-live/commit/1a914e801e333fe2ad99319122d8e9a64029eaba) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: added locked device errors to Sentry ignore list

## 3.34.0-next.0

### Minor Changes

- [#5167](https://github.com/LedgerHQ/ledger-live/pull/5167) [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Dydx

- [#5173](https://github.com/LedgerHQ/ledger-live/pull/5173) [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e) Thanks [@chabroA](https://github.com/chabroA)! - Add neon_evm support

- [#4985](https://github.com/LedgerHQ/ledger-live/pull/4985) [`e9af8df166`](https://github.com/LedgerHQ/ledger-live/commit/e9af8df16658fbab689af98f4b6f7e5c21967802) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add custom handler support

- [#4919](https://github.com/LedgerHQ/ledger-live/pull/4919) [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Change network error to better suit node flakiness

- [#4979](https://github.com/LedgerHQ/ledger-live/pull/4979) [`68488f4d7e`](https://github.com/LedgerHQ/ledger-live/commit/68488f4d7e372c9890d38c2ab7a74f4a0aea1dd1) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update deep link routing on mobile to redirect to account screen on /account?currency={{id}}... in line with desktop deep links.

### Patch Changes

- [#4808](https://github.com/LedgerHQ/ledger-live/pull/4808) [`881cd3462e`](https://github.com/LedgerHQ/ledger-live/commit/881cd3462e854b9859c1ce70559366ce555afd24) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - remove source query params includes in featureflags

- [#5068](https://github.com/LedgerHQ/ledger-live/pull/5068) [`4c292d6a54`](https://github.com/LedgerHQ/ledger-live/commit/4c292d6a545d19883be679b4e110130210801b79) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Search input Market was refreshing for each input

- [#4932](https://github.com/LedgerHQ/ledger-live/pull/4932) [`9d8c602fd2`](https://github.com/LedgerHQ/ledger-live/commit/9d8c602fd21bc21f3255726535b16fafd9ca92d5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - NFT screen/Stax: only display "custom lock screen" option if the user has connected a Stax once

- [#5158](https://github.com/LedgerHQ/ledger-live/pull/5158) [`54a648ae4e`](https://github.com/LedgerHQ/ledger-live/commit/54a648ae4ec8e337e7137402e5bb22f82c863444) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM Experimental features section translation is done

- [#5060](https://github.com/LedgerHQ/ledger-live/pull/5060) [`518e5d888b`](https://github.com/LedgerHQ/ledger-live/commit/518e5d888b2f46967ed25188c1ee88cdace9f56d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - refresh segment user properties when accounts changes

- [#5251](https://github.com/LedgerHQ/ledger-live/pull/5251) [`0ea184bdbf`](https://github.com/LedgerHQ/ledger-live/commit/0ea184bdbfc3c73095669732e27e7050a6ef2770) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Rename some of the Stax tracking events to not include the product name in their eventName

- [#4877](https://github.com/LedgerHQ/ledger-live/pull/4877) [`bb247ac329`](https://github.com/LedgerHQ/ledger-live/commit/bb247ac329fb5594a4742e765bdb4ccc0b69112f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - improve ble pairing deep links

- [#5178](https://github.com/LedgerHQ/ledger-live/pull/5178) [`148e1b58af`](https://github.com/LedgerHQ/ledger-live/commit/148e1b58af080ee51ee36bf0f7dfc6277d047dfc) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Deposit flow: adress verification close button redirect to the QR code page

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- [#5278](https://github.com/LedgerHQ/ledger-live/pull/5278) [`0a133fe2c9`](https://github.com/LedgerHQ/ledger-live/commit/0a133fe2c98ed25ba40c6db78fa0d57b8695e288) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix text Onboarding partners mention

- [#4896](https://github.com/LedgerHQ/ledger-live/pull/4896) [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flag listAppsV2 replaced by listAppsV2minor1
  Fix listApps v2 logic: adapt to breaking changes in the API and fix "polyfilling" logic of data of apps

- [#4999](https://github.com/LedgerHQ/ledger-live/pull/4999) [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor FeatureFlagsProvider and take into account new signature of useFeature (can return null)

- [#4289](https://github.com/LedgerHQ/ledger-live/pull/4289) [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade react-native to 0.72.3 (also closely related dependencies such as expo SDK to expo 49, react-native-reanimated to 3.3.0, @react-native-community/cli to 11.3.7)

- [#4922](https://github.com/LedgerHQ/ledger-live/pull/4922) [`4831135369`](https://github.com/LedgerHQ/ledger-live/commit/48311353690bf352686b7e34874055fa7fd89c02) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Tap and drag to see price over time on graph is buggy on LLM

- [#5136](https://github.com/LedgerHQ/ledger-live/pull/5136) [`6cf5d66f6a`](https://github.com/LedgerHQ/ledger-live/commit/6cf5d66f6a4c41b757d2456994e746281e0b576c) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Fix wallet/account background gradient on large phones

- [#4845](https://github.com/LedgerHQ/ledger-live/pull/4845) [`f08474f11a`](https://github.com/LedgerHQ/ledger-live/commit/f08474f11a09963e2a7ffae3d57ce2146c1e58c3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update wording on Lock Screen for Stax

- [#5078](https://github.com/LedgerHQ/ledger-live/pull/5078) [`4909b28695`](https://github.com/LedgerHQ/ledger-live/commit/4909b28695ed0d09b485c35597bf9d6a43097ed6) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Passed currency param on recover redirection

- [#5106](https://github.com/LedgerHQ/ledger-live/pull/5106) [`af02880169`](https://github.com/LedgerHQ/ledger-live/commit/af02880169368df0ea1f14046f9adbc6326c9fcf) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Display correct transaction date in the Wallet transaction history

- [#4871](https://github.com/LedgerHQ/ledger-live/pull/4871) [`97c5941c94`](https://github.com/LedgerHQ/ledger-live/commit/97c5941c948298d27633ffd44020fd3c9404f448) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Stax wording + add oldVersion -> newVersion to firmware update screen

- [#5170](https://github.com/LedgerHQ/ledger-live/pull/5170) [`5ec0f1fc32`](https://github.com/LedgerHQ/ledger-live/commit/5ec0f1fc325fdca70da5c990a8e399f838bc3c15) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove Recommendations section in the settings

- [#4953](https://github.com/LedgerHQ/ledger-live/pull/4953) [`ec8a37c9ef`](https://github.com/LedgerHQ/ledger-live/commit/ec8a37c9ef9819f7b708b61fcda660df029d3d6a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update My Ledger provider wording in Experimental feature

- [#5136](https://github.com/LedgerHQ/ledger-live/pull/5136) [`511df15eb3`](https://github.com/LedgerHQ/ledger-live/commit/511df15eb38251ac343abb2ef306c25a76fe1301) Thanks [@ak-ledger](https://github.com/ak-ledger)! - My ledger Tab: change nano device size for large phones

- [#4991](https://github.com/LedgerHQ/ledger-live/pull/4991) [`fcb3bec5a3`](https://github.com/LedgerHQ/ledger-live/commit/fcb3bec5a3b0180127bf0b6aec96cd41ee4fdbce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - QR Code scan during Send paste address in input

- [#5118](https://github.com/LedgerHQ/ledger-live/pull/5118) [`c21faee219`](https://github.com/LedgerHQ/ledger-live/commit/c21faee2195d4839a8d498ec76421424f1acc06d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Add new analytics user properties for notifications preferences

- [#4755](https://github.com/LedgerHQ/ledger-live/pull/4755) [`7cb2d033a6`](https://github.com/LedgerHQ/ledger-live/commit/7cb2d033a6b358e3508c098565393ebc64b25166) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): request account was not showing token accounts in some cases

  The issue was only visible on mobile but is also prevented on desktop now
  The issue was only reproducible when omitting the parent account currency from the currencyIds of the request account query

- [#5201](https://github.com/LedgerHQ/ledger-live/pull/5201) [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f) Thanks [@mle-gall](https://github.com/mle-gall)! - New supported countervalues source from API.

- [#4841](https://github.com/LedgerHQ/ledger-live/pull/4841) [`948d3bac85`](https://github.com/LedgerHQ/ledger-live/commit/948d3bac856a47ef203989111f565002379c416e) Thanks [@cksanders](https://github.com/cksanders)! - Add account wallet id conversion for buy deeplinks

- [#4929](https://github.com/LedgerHQ/ledger-live/pull/4929) [`46fd5666c1`](https://github.com/LedgerHQ/ledger-live/commit/46fd5666c128cab15e2c23d130b60de77c734b15) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: remove the "save logs" button if the error is a "refused on device" error

- [#5001](https://github.com/LedgerHQ/ledger-live/pull/5001) [`a733486230`](https://github.com/LedgerHQ/ledger-live/commit/a7334862309bb85480c48b471ccd5a7232f5a795) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Added Path Mappings to LLM

- [#4896](https://github.com/LedgerHQ/ledger-live/pull/4896) [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix interaction between "InstalledAppsModal" and "UninstallDependenciesModal", the later one was not getting opened in case an app with dependents was getting uninstalled from the first one, due to a bad usage of drawers (not using QueuedDrawer).
  Refactor prop drilling nightmare of setAppInstallWithDependencies/setAppUninstallWithDependencies with a simple React.Context.
  Refactor InstalledAppDependenciesModal and UninstallAppDependenciesModal to have no business logic inside
  Rename action creator installAppFirstTime to setHasInstalledAnyApp for more clarity

- [#5119](https://github.com/LedgerHQ/ledger-live/pull/5119) [`2691a1419d`](https://github.com/LedgerHQ/ledger-live/commit/2691a1419de5ea299d72eeb973ad3792898850d3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix success event on last step in Deposit flow

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: enable printing logs to stdout for debug

  - Setup simple tracing system on LLM with context
  - If `VERBOSE` env var is set, filtered logs can be stdout from the main thread

- [#4930](https://github.com/LedgerHQ/ledger-live/pull/4930) [`bbad6146ce`](https://github.com/LedgerHQ/ledger-live/commit/bbad6146cee4fa55a8d0e2fec47579c945e6e59b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix of OperationDetails view using the wrong currency in the `useNftMetadata` & `useNftCollectionMetadata` hooks

- [#4887](https://github.com/LedgerHQ/ledger-live/pull/4887) [`cf5ee11bad`](https://github.com/LedgerHQ/ledger-live/commit/cf5ee11bad98dbe3c473244891b5d2a7ef8d7106) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix discreet mode on Deposit flow LLM

- [#5231](https://github.com/LedgerHQ/ledger-live/pull/5231) [`d6cebdc99b`](https://github.com/LedgerHQ/ledger-live/commit/d6cebdc99b2ecb270c7430454e85189c25f1a2bc) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Add check script

- [#4933](https://github.com/LedgerHQ/ledger-live/pull/4933) [`b959dba2b4`](https://github.com/LedgerHQ/ledger-live/commit/b959dba2b429e06444c16596afe8e32ebf8c367b) Thanks [@lvndry](https://github.com/lvndry)! - fix scan of ethereum addresses from qr code

- [#4983](https://github.com/LedgerHQ/ledger-live/pull/4983) [`719047f16a`](https://github.com/LedgerHQ/ledger-live/commit/719047f16a69ee51945de539514ed491d07c49dd) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add correct drawer when device is locked during pairing

- [#4976](https://github.com/LedgerHQ/ledger-live/pull/4976) [`f2b7c63d6d`](https://github.com/LedgerHQ/ledger-live/commit/f2b7c63d6d734926f825008daa5aa37a0b5ef57b) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Fix onboarding issues when closing quiz drawer

- [#4884](https://github.com/LedgerHQ/ledger-live/pull/4884) [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Need to add other link firebase for quickAccess Recover

- [#4927](https://github.com/LedgerHQ/ledger-live/pull/4927) [`1c16480ee5`](https://github.com/LedgerHQ/ledger-live/commit/1c16480ee5f4e1826e64a6c16c092601a0307e42) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - fix display thumbnail of a story

- [#5019](https://github.com/LedgerHQ/ledger-live/pull/5019) [`fbbd563fad`](https://github.com/LedgerHQ/ledger-live/commit/fbbd563fad154f78cc6ab60ffc5f73731b01413e) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix design of bluetooth pairing error screen

- [#4790](https://github.com/LedgerHQ/ledger-live/pull/4790) [`6b9bf82828`](https://github.com/LedgerHQ/ledger-live/commit/6b9bf8282833909e097c28b61fb149330a281c83) Thanks [@chabroA](https://github.com/chabroA)! - Fix wrong fee value for evm custom fee in strategies list

- [#4789](https://github.com/LedgerHQ/ledger-live/pull/4789) [`2bdd03b36c`](https://github.com/LedgerHQ/ledger-live/commit/2bdd03b36ce296649b18d58d6a68378a5ae09523) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add New Entry in TransferDrawer for Recover

- [#4844](https://github.com/LedgerHQ/ledger-live/pull/4844) [`7ffc6619aa`](https://github.com/LedgerHQ/ledger-live/commit/7ffc6619aae18b8071ce8ebd2d664d8e09729b47) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Fix drawers in LLM onboarding

- [#4818](https://github.com/LedgerHQ/ledger-live/pull/4818) [`e00647bc97`](https://github.com/LedgerHQ/ledger-live/commit/e00647bc9719659f29a30d0acae9c9f609cff8a1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update UI in Manager for Services Recover

- [#5103](https://github.com/LedgerHQ/ledger-live/pull/5103) [`76d57f7f0c`](https://github.com/LedgerHQ/ledger-live/commit/76d57f7f0ce2ef36498ec72e077897785f04c966) Thanks [@lvndry](https://github.com/lvndry)! - Align NotEnoughGas error in LLD and LLM

- [#4800](https://github.com/LedgerHQ/ledger-live/pull/4800) [`e63d3bbc2a`](https://github.com/LedgerHQ/ledger-live/commit/e63d3bbc2ad60411920cc4872d36fc11d1ae73d7) Thanks [@Justkant](https://github.com/Justkant)! - fix: platform-sdk & wallet-api onClose response in `account.request` & `message.sign`

- [#5137](https://github.com/LedgerHQ/ledger-live/pull/5137) [`0d177abe59`](https://github.com/LedgerHQ/ledger-live/commit/0d177abe599f37eb0626eb170a698b5a9bb0f7f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename Deposit into Receive

- [#4877](https://github.com/LedgerHQ/ledger-live/pull/4877) [`bb247ac329`](https://github.com/LedgerHQ/ledger-live/commit/bb247ac329fb5594a4742e765bdb4ccc0b69112f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Create new bluetooth pairing flow screen for onboarding

- [#5215](https://github.com/LedgerHQ/ledger-live/pull/5215) [`279e4e0920`](https://github.com/LedgerHQ/ledger-live/commit/279e4e0920dd762e30a2991963e350e10e401756) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - track flowInitiatedFrom on mobile and desktop for broadcast success

- [#5211](https://github.com/LedgerHQ/ledger-live/pull/5211) [`b259781b72`](https://github.com/LedgerHQ/ledger-live/commit/b259781b7212aa7758437640e7c48c5d17b0fa79) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Include swap batch in segment identity

- [#5069](https://github.com/LedgerHQ/ledger-live/pull/5069) [`ea1f2776c6`](https://github.com/LedgerHQ/ledger-live/commit/ea1f2776c6df46df5dbde42ebc6b42064f0163f5) Thanks [@chabroA](https://github.com/chabroA)! - fix NotEnoughGas related UI on LLM and LLD

  - fix buy CTA button style on LLD to make it more visible
  - add related support link for NotEnoughGas error on LLM and LLD to display an "learn more" CTA redirecting to [related CS article](https://support.ledger.com/hc/en-us/articles/9096370252573?support=true)
  - fix buy button when NotEnoughGas on LLM
    - The logic to display the button was related to the currency being sent and not the main account currency (if I don't have enough fund to pay for the gas when I want to send USDT on ethereum, I need to buy some ETH and not some USDT)
    - The related text was wrongly hardcoded only for ethereum currency when a user might be using another evm network and thus needing to buy a different currency than ethereum (i.e: the currency of the actual EVM network he is using)

- Updated dependencies [[`2ec5360679`](https://github.com/LedgerHQ/ledger-live/commit/2ec53606794c84a08fa49898c31ee976f3a8b9cc), [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757), [`a40169babf`](https://github.com/LedgerHQ/ledger-live/commit/a40169babff5f5ea4938464326dd90bc7e0a8a4a), [`3dc4937cc0`](https://github.com/LedgerHQ/ledger-live/commit/3dc4937cc0c77f6dc40ac7c628e9ab165dfb899f), [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757), [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7), [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072), [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68), [`173d7d6d22`](https://github.com/LedgerHQ/ledger-live/commit/173d7d6d224bcf1cecf364062b6571f52792e371), [`9d9f8bb5d2`](https://github.com/LedgerHQ/ledger-live/commit/9d9f8bb5d2b5dcf5d8223b15c7847c7261dade77), [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e), [`3ce4f6e485`](https://github.com/LedgerHQ/ledger-live/commit/3ce4f6e485ac07c27e11def153cf2e3b656d5ab2), [`2fc6d1efa0`](https://github.com/LedgerHQ/ledger-live/commit/2fc6d1efa0233a90b0fa273782cff1dd6344d52c), [`bf4c366b6f`](https://github.com/LedgerHQ/ledger-live/commit/bf4c366b6f5b062476645fe37ce62b3925822377), [`5883eccc3b`](https://github.com/LedgerHQ/ledger-live/commit/5883eccc3b023c8c18615283a88fea08d705ef6a), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`3b2b2bf847`](https://github.com/LedgerHQ/ledger-live/commit/3b2b2bf847a7e9797b49f48fd31c23368c830a91), [`17a0822f95`](https://github.com/LedgerHQ/ledger-live/commit/17a0822f953a6fc57ed6732b881886b83cfa233b), [`38ea4700ff`](https://github.com/LedgerHQ/ledger-live/commit/38ea4700ff7ccf9c663c03b6deb21ac7c7a6fd28), [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f), [`c3aea5b42d`](https://github.com/LedgerHQ/ledger-live/commit/c3aea5b42defc71ff381bcd0c3dbb7a9ea9332fe), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`6b68e895fb`](https://github.com/LedgerHQ/ledger-live/commit/6b68e895fbee723a2426f7a956796cac31a45454), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68), [`e12ab4c986`](https://github.com/LedgerHQ/ledger-live/commit/e12ab4c9863f4c74a32d081637826d807aee7bcb), [`f52baa219e`](https://github.com/LedgerHQ/ledger-live/commit/f52baa219e1cd85fdb50d47f0c64e10e8533c926), [`719047f16a`](https://github.com/LedgerHQ/ledger-live/commit/719047f16a69ee51945de539514ed491d07c49dd), [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d), [`e9af8df166`](https://github.com/LedgerHQ/ledger-live/commit/e9af8df16658fbab689af98f4b6f7e5c21967802), [`18d4fb6077`](https://github.com/LedgerHQ/ledger-live/commit/18d4fb6077480fe68cbe215019c77fa21a17be48), [`e63d3bbc2a`](https://github.com/LedgerHQ/ledger-live/commit/e63d3bbc2ad60411920cc4872d36fc11d1ae73d7), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`f3b2e7d0eb`](https://github.com/LedgerHQ/ledger-live/commit/f3b2e7d0eb1413781fc45e27c690e73c1058fec6), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd), [`b259781b72`](https://github.com/LedgerHQ/ledger-live/commit/b259781b7212aa7758437640e7c48c5d17b0fa79)]:
  - @ledgerhq/live-common@33.1.0-next.0
  - @ledgerhq/native-ui@0.22.1-next.0
  - @ledgerhq/types-live@6.42.0-next.0
  - @ledgerhq/domain-service@1.1.14-next.0
  - @ledgerhq/types-cryptoassets@7.7.0-next.0
  - @ledgerhq/coin-evm@0.10.0-next.0
  - @ledgerhq/logs@6.11.0-next.0
  - @ledgerhq/coin-framework@0.8.1-next.0
  - @ledgerhq/hw-transport@6.29.0-next.0
  - @ledgerhq/live-env@0.6.1-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.30.0-next.0
  - @ledgerhq/errors@6.15.0-next.0
  - @ledgerhq/devices@8.0.8-next.0
  - @ledgerhq/hw-transport-http@6.28.4-next.0
  - @ledgerhq/react-native-hid@6.30.1-next.0

## 3.33.1

### Patch Changes

- [#4895](https://github.com/LedgerHQ/ledger-live/pull/4895) [`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - feat(protect-2592): add other link on firebase for quick access recover

- [#4915](https://github.com/LedgerHQ/ledger-live/pull/4915) [`ef6bc3319c`](https://github.com/LedgerHQ/ledger-live/commit/ef6bc3319ca90dd06c0a1f089e732416d1e6b3dc) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Need to allow restore on onboarding state without device selected yet

- [#4924](https://github.com/LedgerHQ/ledger-live/pull/4924) [`ae2c209be4`](https://github.com/LedgerHQ/ledger-live/commit/ae2c209be4c82ded56faf8a2539fcf27cf07fbb4) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - small modif on the name of a param from the protectServicesMobile feature flag. Also the recover button is now displayed before the wallet connect button in the quick actions

- [#4882](https://github.com/LedgerHQ/ledger-live/pull/4882) [`b5f6faf0df`](https://github.com/LedgerHQ/ledger-live/commit/b5f6faf0df5e484dc56b422883e16e04d181903f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add New Entry in TransferDrawer for Recover

- [#4862](https://github.com/LedgerHQ/ledger-live/pull/4862) [`112fc4deb0`](https://github.com/LedgerHQ/ledger-live/commit/112fc4deb0b391ccde19f655efd76bf7de063c99) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update UI in Manager for Services Recover

- Updated dependencies [[`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb), [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24)]:
  - @ledgerhq/live-common@33.0.1
  - @ledgerhq/types-live@6.41.1
  - @ledgerhq/coin-evm@0.9.0
  - @ledgerhq/coin-framework@0.8.0
  - @ledgerhq/domain-service@1.1.13

## 3.33.1-hotfix.2

### Patch Changes

- Updated dependencies [[`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24)]:
  - @ledgerhq/live-common@33.0.1-hotfix.2
  - @ledgerhq/coin-evm@0.9.0-hotfix.2
  - @ledgerhq/coin-framework@0.8.0-hotfix.2
  - @ledgerhq/domain-service@1.1.13-hotfix.1

## 3.33.1-hotfix.1

### Patch Changes

- Updated dependencies [[`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975)]:
  - @ledgerhq/coin-evm@0.9.0-hotfix.1
  - @ledgerhq/coin-framework@0.8.0-hotfix.1
  - @ledgerhq/live-common@33.0.1-hotfix.1

## 3.33.1-hotfix.0

### Patch Changes

- [#4895](https://github.com/LedgerHQ/ledger-live/pull/4895) [`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - feat(protect-2592): add other link on firebase for quick access recover

- [#4915](https://github.com/LedgerHQ/ledger-live/pull/4915) [`ef6bc3319c`](https://github.com/LedgerHQ/ledger-live/commit/ef6bc3319ca90dd06c0a1f089e732416d1e6b3dc) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Need to allow restore on onboarding state without device selected yet

- [#4924](https://github.com/LedgerHQ/ledger-live/pull/4924) [`ae2c209be4`](https://github.com/LedgerHQ/ledger-live/commit/ae2c209be4c82ded56faf8a2539fcf27cf07fbb4) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - small modif on the name of a param from the protectServicesMobile feature flag. Also the recover button is now displayed before the wallet connect button in the quick actions

- [#4882](https://github.com/LedgerHQ/ledger-live/pull/4882) [`b5f6faf0df`](https://github.com/LedgerHQ/ledger-live/commit/b5f6faf0df5e484dc56b422883e16e04d181903f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add New Entry in TransferDrawer for Recover

- [#4862](https://github.com/LedgerHQ/ledger-live/pull/4862) [`112fc4deb0`](https://github.com/LedgerHQ/ledger-live/commit/112fc4deb0b391ccde19f655efd76bf7de063c99) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update UI in Manager for Services Recover

- Updated dependencies [[`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb)]:
  - @ledgerhq/live-common@33.0.1-hotfix.0
  - @ledgerhq/types-live@6.41.1-hotfix.0
  - @ledgerhq/coin-evm@0.8.1-hotfix.0
  - @ledgerhq/coin-framework@0.7.1-hotfix.0
  - @ledgerhq/domain-service@1.1.13-hotfix.0

## 3.33.0

### Minor Changes

- [#4741](https://github.com/LedgerHQ/ledger-live/pull/4741) [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532) Thanks [@chabroA](https://github.com/chabroA)! - Fix swap issue when estimating and editing fees

- [#4583](https://github.com/LedgerHQ/ledger-live/pull/4583) [`f527d1bb5a`](https://github.com/LedgerHQ/ledger-live/commit/f527d1bb5a2888a916f761d43d2ba5093eaa3e3f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate injective + gas rework

- [#4616](https://github.com/LedgerHQ/ledger-live/pull/4616) [`299eaba752`](https://github.com/LedgerHQ/ledger-live/commit/299eaba752f2581e935706efbd13ae752627fa3e) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add a deeplinking state in redux to inform the AuthPass component not to lock when app is temporarily backgrounded by ptx player deeplinks.

- [#4706](https://github.com/LedgerHQ/ledger-live/pull/4706) [`4dd486d87f`](https://github.com/LedgerHQ/ledger-live/commit/4dd486d87fea4c641cc4a21fc181c6097bab9d3d) Thanks [@Justkant](https://github.com/Justkant)! - feat: send LL version to the manifest-api

- [#4628](https://github.com/LedgerHQ/ledger-live/pull/4628) [`d1d0977f33`](https://github.com/LedgerHQ/ledger-live/commit/d1d0977f338beb860d40f4b38a9e123cbbb5ebbb) Thanks [@KVNLS](https://github.com/KVNLS)! - [LIVE-8347] Add quick actions on the wallet

- [#4285](https://github.com/LedgerHQ/ledger-live/pull/4285) [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c) Thanks [@chabroA](https://github.com/chabroA)! - Migrate Ethereum family implementation to EVM family

  Replace the legcay Ethereum familly implementation that was present in ledger-live-common by the coin-evm lib implementation.
  This change was made in order to improve scalabillity and maintainability of the evm coins, as well as more easilly integrate new evm based chains in the future.

### Patch Changes

- [#4693](https://github.com/LedgerHQ/ledger-live/pull/4693) [`f99705e45c`](https://github.com/LedgerHQ/ledger-live/commit/f99705e45c004e90f4f33969b9c223da76475ccb) Thanks [@cksanders](https://github.com/cksanders)! - Ensure we reset the storage correctly in the PTXWebPlayer

- [#4680](https://github.com/LedgerHQ/ledger-live/pull/4680) [`8c1de2f9de`](https://github.com/LedgerHQ/ledger-live/commit/8c1de2f9debb825b47c99e6fc34a19d73d04c1cf) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Add Entry point to CEX with feature flag

- [#4717](https://github.com/LedgerHQ/ledger-live/pull/4717) [`a80310f16a`](https://github.com/LedgerHQ/ledger-live/commit/a80310f16af3f22f71052d0f3696ab8b7a652a77) Thanks [@lvndry](https://github.com/lvndry)! - Update staking icon

- [#4861](https://github.com/LedgerHQ/ledger-live/pull/4861) [`0872f274dc`](https://github.com/LedgerHQ/ledger-live/commit/0872f274dceaddfdefc33cd2880476f44e8c43a4) Thanks [@cksanders](https://github.com/cksanders)! - Pass correct account ID, due to Platform SDK account ID not being equivalent to Wallet API account ID

  Includes fix for iOS and Android A series.

- [#4674](https://github.com/LedgerHQ/ledger-live/pull/4674) [`4f3ff62b77`](https://github.com/LedgerHQ/ledger-live/commit/4f3ff62b775ffde01c546c798d7cd4f87959e5fc) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - change ui button device select restore flow

- [#4792](https://github.com/LedgerHQ/ledger-live/pull/4792) [`260b3811dd`](https://github.com/LedgerHQ/ledger-live/commit/260b3811dd4804ab02dd52b9a6ab4d738e28b656) Thanks [@sarneijim](https://github.com/sarneijim)! - Add account wallet id conversion for buy deeplinks

- [#4617](https://github.com/LedgerHQ/ledger-live/pull/4617) [`a5b7444489`](https://github.com/LedgerHQ/ledger-live/commit/a5b7444489af8b58cd4b8a04abdb2df81d21c813) Thanks [@cksanders](https://github.com/cksanders)! - Ensure iOS opens links correctly in wallet api webview & remove binancecnt

- [#4679](https://github.com/LedgerHQ/ledger-live/pull/4679) [`9bde1dcda3`](https://github.com/LedgerHQ/ledger-live/commit/9bde1dcda31de44d5362abed00e2bee580e7c13e) Thanks [@Justkant](https://github.com/Justkant)! - fix: wallet-api & platform verify account screen

- [#4853](https://github.com/LedgerHQ/ledger-live/pull/4853) [`06d20dd95f`](https://github.com/LedgerHQ/ledger-live/commit/06d20dd95fbda6c2ed7148f9182816d20ea53910) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent crash on Custom Fees selection when no GasOptions is set for EVM transactions

- [#4648](https://github.com/LedgerHQ/ledger-live/pull/4648) [`8b09b0b571`](https://github.com/LedgerHQ/ledger-live/commit/8b09b0b5717a47aedae5a8a80acf6d077af3b40b) Thanks [@cksanders](https://github.com/cksanders)! - Update multibuy manifest to v2 to ensure full backwards compatibility

- [#4685](https://github.com/LedgerHQ/ledger-live/pull/4685) [`35cb442294`](https://github.com/LedgerHQ/ledger-live/commit/35cb4422944f1e7af696c816a53a6ada74525de2) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Conditionally render different text when user arrives at the buy funds modal from a get funds button rather than default of no funds. Applies to mobile and desktop.

- [#4780](https://github.com/LedgerHQ/ledger-live/pull/4780) [`602e15dcfa`](https://github.com/LedgerHQ/ledger-live/commit/602e15dcfa5079a64db9aaf4cc08c46547daa0ab) Thanks [@sarneijim](https://github.com/sarneijim)! - Add SUPPLY_UPLOAD_MAX_RETRIES fastlane android env

- [#4796](https://github.com/LedgerHQ/ledger-live/pull/4796) [`e1c089470a`](https://github.com/LedgerHQ/ledger-live/commit/e1c089470a880b6c74d6834d110975169fd006fc) Thanks [@chabroA](https://github.com/chabroA)! - Use account instead of main account for evm custom fees navigation

- [#4588](https://github.com/LedgerHQ/ledger-live/pull/4588) [`c89f7d0e9e`](https://github.com/LedgerHQ/ledger-live/commit/c89f7d0e9e37f4389578c2833adde076a5811ff5) Thanks [@aboissiere-ledger](https://github.com/aboissiere-ledger)! - Fix jest config to generate coverage report and include untested files

- [#4771](https://github.com/LedgerHQ/ledger-live/pull/4771) [`1d7b4543f5`](https://github.com/LedgerHQ/ledger-live/commit/1d7b4543f5a9f6a8658c5355a3ae87c890223ab4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - bump fastlane to fix publishing to google play store

- [#4533](https://github.com/LedgerHQ/ledger-live/pull/4533) [`70e4277bc9`](https://github.com/LedgerHQ/ledger-live/commit/70e4277bc9dda253b894bdae5f2c8a5f43a9a64e) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Typed useFeature hook

- Updated dependencies [[`51857f5c20`](https://github.com/LedgerHQ/ledger-live/commit/51857f5c2016d435fa970fac899aa906e3f97722), [`61a891b06f`](https://github.com/LedgerHQ/ledger-live/commit/61a891b06f9028f285f87c321487f691272a9172), [`f527d1bb5a`](https://github.com/LedgerHQ/ledger-live/commit/f527d1bb5a2888a916f761d43d2ba5093eaa3e3f), [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532), [`cf2f585659`](https://github.com/LedgerHQ/ledger-live/commit/cf2f58565937b2a695ac7ff7d225cdbb6e598039), [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532), [`4dd486d87f`](https://github.com/LedgerHQ/ledger-live/commit/4dd486d87fea4c641cc4a21fc181c6097bab9d3d), [`4cb507a52b`](https://github.com/LedgerHQ/ledger-live/commit/4cb507a52bf336d395b08b4c1a429bd4956ab22d), [`d1d0977f33`](https://github.com/LedgerHQ/ledger-live/commit/d1d0977f338beb860d40f4b38a9e123cbbb5ebbb), [`b21de593ee`](https://github.com/LedgerHQ/ledger-live/commit/b21de593ee705ece38fc812eedb9bf85694e94cb), [`8b09b0b571`](https://github.com/LedgerHQ/ledger-live/commit/8b09b0b5717a47aedae5a8a80acf6d077af3b40b), [`b779f6c964`](https://github.com/LedgerHQ/ledger-live/commit/b779f6c964079b9cd9a4ee985cd5cdbb8c49406e), [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c), [`70e4277bc9`](https://github.com/LedgerHQ/ledger-live/commit/70e4277bc9dda253b894bdae5f2c8a5f43a9a64e)]:
  - @ledgerhq/live-common@33.0.0
  - @ledgerhq/types-cryptoassets@7.6.0
  - @ledgerhq/types-live@6.41.0
  - @ledgerhq/coin-evm@0.8.0
  - @ledgerhq/native-ui@0.22.0
  - @ledgerhq/coin-framework@0.7.0
  - @ledgerhq/live-env@0.6.0
  - @ledgerhq/domain-service@1.1.12

## 3.32.1-next.0

### Patch Changes

- Updated dependencies [[`61a891b06f`](https://github.com/LedgerHQ/ledger-live/commit/61a891b06f9028f285f87c321487f691272a9172)]:
  - @ledgerhq/live-common@32.1.0-next.0

## 3.32.0

### Minor Changes

- [#4851](https://github.com/LedgerHQ/ledger-live/pull/4851) [`6c83521fee`](https://github.com/LedgerHQ/ledger-live/commit/6c83521fee8da656858630c1cb37a5af95df3362) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate injective + gas rework

### Patch Changes

- Updated dependencies [[`61272164de`](https://github.com/LedgerHQ/ledger-live/commit/61272164de6e81d9b5e5ad988b7eb8c40d3cf735), [`6c83521fee`](https://github.com/LedgerHQ/ledger-live/commit/6c83521fee8da656858630c1cb37a5af95df3362)]:
  - @ledgerhq/live-common@31.8.0
  - @ledgerhq/types-cryptoassets@7.5.0
  - @ledgerhq/types-live@6.40.0
  - @ledgerhq/coin-evm@0.6.2
  - @ledgerhq/coin-framework@0.5.4
  - @ledgerhq/domain-service@1.1.11
  - @ledgerhq/evm-tools@1.0.7

## 3.31.0

### Minor Changes

- [#4557](https://github.com/LedgerHQ/ledger-live/pull/4557) [`6c5a27ac02`](https://github.com/LedgerHQ/ledger-live/commit/6c5a27ac029d473b97e1ba93e7f1842b4aa4ea7c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed the following issue : User cannot select device on device selection screen when verifying address a second time

### Patch Changes

- Update broken readme environment variable link.

- [#4556](https://github.com/LedgerHQ/ledger-live/pull/4556) [`04206a2939`](https://github.com/LedgerHQ/ledger-live/commit/04206a2939bb8bb807a9f57a175f054c613e3d57) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix sync onboarding: if the sync onboarding is aborted after the device has been seeded, the device should appear in the list of known devices

- [#4519](https://github.com/LedgerHQ/ledger-live/pull/4519) [`ea97040266`](https://github.com/LedgerHQ/ledger-live/commit/ea97040266cc0b0b084882739bd38a90908d2b98) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor error rendering to make base UI bricks easily reusable
  New icons and slightly different design for error rendering
  Pixel polish of early security checks flow and device language change flow

- [#4453](https://github.com/LedgerHQ/ledger-live/pull/4453) [`efd119dc7c`](https://github.com/LedgerHQ/ledger-live/commit/efd119dc7c320715fff2feeffedbaaf1e78b7583) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Cleanup dead code, kill unused react contexts

- [#4569](https://github.com/LedgerHQ/ledger-live/pull/4569) [`8f99e87e43`](https://github.com/LedgerHQ/ledger-live/commit/8f99e87e43da87ac9cc768eddfb183ebc88cebb2) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - cache live app manifest to prevent infinite reload

- Updated dependencies [[`ea97040266`](https://github.com/LedgerHQ/ledger-live/commit/ea97040266cc0b0b084882739bd38a90908d2b98), [`ea97040266`](https://github.com/LedgerHQ/ledger-live/commit/ea97040266cc0b0b084882739bd38a90908d2b98), [`e0cc3a0841`](https://github.com/LedgerHQ/ledger-live/commit/e0cc3a08415de84b9d3ce828444248a043a9d699), [`18b4a47b48`](https://github.com/LedgerHQ/ledger-live/commit/18b4a47b4878a23695a50096b7770134883b8a2e), [`5d20c326a0`](https://github.com/LedgerHQ/ledger-live/commit/5d20c326a038a430a38f28815ba65af71152118b), [`b2e8c1053e`](https://github.com/LedgerHQ/ledger-live/commit/b2e8c1053e57c763575c9c4d77d1daca8ef566fe), [`1c6deb2336`](https://github.com/LedgerHQ/ledger-live/commit/1c6deb2336a8b76517cc4d367f76dca24f9228dc), [`3ec5739f8a`](https://github.com/LedgerHQ/ledger-live/commit/3ec5739f8a4e3ff81da468cd91036b7b271dfd06), [`bfd4fef405`](https://github.com/LedgerHQ/ledger-live/commit/bfd4fef405f832489cc5258330e6483260c896d2)]:
  - @ledgerhq/native-ui@0.21.1
  - @ledgerhq/live-common@31.7.0
  - @ledgerhq/coin-framework@0.5.3
  - @ledgerhq/coin-evm@0.6.1
  - @ledgerhq/domain-service@1.1.10
  - @ledgerhq/evm-tools@1.0.6

## 3.30.0

### Minor Changes

- [#4558](https://github.com/LedgerHQ/ledger-live/pull/4558) [`7dc9d2bfa8`](https://github.com/LedgerHQ/ledger-live/commit/7dc9d2bfa869c467657483d635c38073beda03d1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed the following issue : User cannot select device on device selection screen when verifying address a second time

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

- [#4212](https://github.com/LedgerHQ/ledger-live/pull/4212) [`9154178962`](https://github.com/LedgerHQ/ledger-live/commit/9154178962b68ef974831ebff36d39d2e27d15e2) Thanks [@cksanders](https://github.com/cksanders)! - - Update WebPTXPlayer to load correct manifest

  - Remove unused LL BUY/SELL in favour of BUY/SELL Live App

- [#4364](https://github.com/LedgerHQ/ledger-live/pull/4364) [`a4648d5c78`](https://github.com/LedgerHQ/ledger-live/commit/a4648d5c78e21989c9d5a3de7c7df80e05672eef) Thanks [@AlexandruPislariu](https://github.com/AlexandruPislariu)! - Fixed improper minimum staking balance calculation.

- [#4327](https://github.com/LedgerHQ/ledger-live/pull/4327) [`1cfd51f86f`](https://github.com/LedgerHQ/ledger-live/commit/1cfd51f86f08670e47c77dea45ad8f17f68c9041) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add earn info modal

- [#3928](https://github.com/LedgerHQ/ledger-live/pull/3928) [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - New Deposit flow

- [#4408](https://github.com/LedgerHQ/ledger-live/pull/4408) [`268ebcfd48`](https://github.com/LedgerHQ/ledger-live/commit/268ebcfd488dcf77802d756eb94dd547943f4fb1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - changed the color of the operations to be orange when pending

### Patch Changes

- [#4397](https://github.com/LedgerHQ/ledger-live/pull/4397) [`2cdbc483fa`](https://github.com/LedgerHQ/ledger-live/commit/2cdbc483fa1df4aa1dae4c93c83cf06bb0676927) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Notifications get re-enabled when updating the app

- [#4466](https://github.com/LedgerHQ/ledger-live/pull/4466) [`cd9579816d`](https://github.com/LedgerHQ/ledger-live/commit/cd9579816d92807c8e1645b96ff9978fa7f9fc09) Thanks [@sarneijim](https://github.com/sarneijim)! - Add deeplink_clicked track to LLM and improve deeplink_clicked track to LLD

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4274](https://github.com/LedgerHQ/ledger-live/pull/4274) [`95c9573979`](https://github.com/LedgerHQ/ledger-live/commit/95c9573979d7a1cf435ac3b3b377f76d605ca214) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Added locale to Earn URL navigation

- [#4471](https://github.com/LedgerHQ/ledger-live/pull/4471) [`f55c6e4f90`](https://github.com/LedgerHQ/ledger-live/commit/f55c6e4f9027e8277553af44334026a70ee3bdaa) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New firmware update flow: redesign of fw update available banner

- [#4152](https://github.com/LedgerHQ/ledger-live/pull/4152) [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074) Thanks [@grsoares21](https://github.com/grsoares21)! - Feat: adds a first step to display the changelog of the fw update

  Handling correctly when a user leaves the fw update from this first step

- [#4467](https://github.com/LedgerHQ/ledger-live/pull/4467) [`c4c16e6a32`](https://github.com/LedgerHQ/ledger-live/commit/c4c16e6a326040767747d38fe87c17ce5dd91b03) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Re-use account-specific stake flow actions directly in the Earn Navigator to avoid empty stake flow navigation that was causing empty modals to appear.

- [#4421](https://github.com/LedgerHQ/ledger-live/pull/4421) [`00c1159356`](https://github.com/LedgerHQ/ledger-live/commit/00c11593565ac8b370df77af13dc3f1d8de90914) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Allow passing of onPressWhenDisabled prop to native ui button

- [#4423](https://github.com/LedgerHQ/ledger-live/pull/4423) [`5049231835`](https://github.com/LedgerHQ/ledger-live/commit/5049231835eb2eb6777dea5ee9a8813b95ed1ccb) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - fix back arrow on market detail when ptxEarn feature enabled

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: genuine check and firmware update check during the ESC

  - UX and UI implementation of the new ESC
  - Enable a firmware update during the ESC (before a device is seeded)
  - Handles different error/failure/quit scenarios

- [#4169](https://github.com/LedgerHQ/ledger-live/pull/4169) [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a) Thanks [@gre](https://github.com/gre)! - Introduces use\*DeviceAction() hooks in order to mock test all device actions. It impacts all screens that have device actions.

- [#4208](https://github.com/LedgerHQ/ledger-live/pull/4208) [`151ae54309`](https://github.com/LedgerHQ/ledger-live/commit/151ae543093d646b332851c6873ec7e735830445) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Analytics console: workaround for layout issue that happens after a while in the scrollview

- [#4407](https://github.com/LedgerHQ/ledger-live/pull/4407) [`d6c1984620`](https://github.com/LedgerHQ/ledger-live/commit/d6c1984620b1d7d8289cf73f5b782217f241c2e6) Thanks [@beths-ledger](https://github.com/beths-ledger)! - fix deep link to buy coins to display no funds flow with option to add account if none available. Remove excess padding above market list and fix overlap of main nav button over earn screen.

- [#4199](https://github.com/LedgerHQ/ledger-live/pull/4199) [`f161be752a`](https://github.com/LedgerHQ/ledger-live/commit/f161be752a668110bdaa0039c721ebb55ca888f2) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Update Swap Form - Edit Rates props

- [#4432](https://github.com/LedgerHQ/ledger-live/pull/4432) [`213b66a80f`](https://github.com/LedgerHQ/ledger-live/commit/213b66a80f3751e4be7bcbab5bb9de3bc8db366a) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - fix broken ui on market tab switching

- [#4152](https://github.com/LedgerHQ/ledger-live/pull/4152) [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix: several bugs during the firmware update on LLM

  Several bug were fixed:

  - an issue on how "user solvable" errors were handled on the logic and UI of the fw update
  - a bug on errors that were supposed to be ignored (e.g. an inexistent lockscreen image when backing
    up) and were actually being reported to the user
  - a bug when a “allow manager”/secure channel was refused as the beginning of the fw update
  - a bug on the battery check UX that made the app re-navigate to the firmware update automatically
    once the user exited it

- [#4307](https://github.com/LedgerHQ/ledger-live/pull/4307) [`82f9d775fc`](https://github.com/LedgerHQ/ledger-live/commit/82f9d775fc560843c19c9a0b25648cbe60d2b190) Thanks [@gre](https://github.com/gre)! - Implement resiliency on importing accounts that fail to be decoded (bad currencyId, bad derivationMode,...)

- [#4426](https://github.com/LedgerHQ/ledger-live/pull/4426) [`2bec4b7f08`](https://github.com/LedgerHQ/ledger-live/commit/2bec4b7f080d6dc9a6b22805c0fa317ff55c7202) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: improve error wording in some cases

- [#4461](https://github.com/LedgerHQ/ledger-live/pull/4461) [`ed6da731dd`](https://github.com/LedgerHQ/ledger-live/commit/ed6da731dd196a76350b66db2301968bc3df3a05) Thanks [@Justkant](https://github.com/Justkant)! - fix: accessing restore flow from onboarding

- [#4317](https://github.com/LedgerHQ/ledger-live/pull/4317) [`3f36af3127`](https://github.com/LedgerHQ/ledger-live/commit/3f36af31273aba263b79b3f161599ac089cfc6e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Remove legacy code for WalletConnect

- [#4390](https://github.com/LedgerHQ/ledger-live/pull/4390) [`3723b104e4`](https://github.com/LedgerHQ/ledger-live/commit/3723b104e48be93e7233837742d8e757422e8e6e) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - fix: do not pop from live app when verifying address

- [#4353](https://github.com/LedgerHQ/ledger-live/pull/4353) [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add evm mock test

- [#4355](https://github.com/LedgerHQ/ledger-live/pull/4355) [`850dad94df`](https://github.com/LedgerHQ/ledger-live/commit/850dad94dfb9f04f48b4c7a5d90cfed6777013d7) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - fixes safe area view on earn screen

- [#4385](https://github.com/LedgerHQ/ledger-live/pull/4385) [`87cbec4062`](https://github.com/LedgerHQ/ledger-live/commit/87cbec4062f95d2348d7dd134cb4f13f071425d5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade dependencies:

  - Android:
    - compileSdkVersion and targetSdkVersion to 33
    - androidX core libs to 1.8.0
  - JS:
    - replace outdated "@react-native-community/clipboard" by "@react-native-clipboard/clipboard": "^1.11.2"
    - "@react-native-async-storage/async-storage": "^1.19.2"
    - "lottie-react-native": "^6.2.0"
    - "react-native-image-picker": "^5.6.1"
    - "react-native-svg": "^13.11.0"

- [#4451](https://github.com/LedgerHQ/ledger-live/pull/4451) [`87a0a8b0dc`](https://github.com/LedgerHQ/ledger-live/commit/87a0a8b0dce2d36a34541f890697b4ffba258382) Thanks [@Justkant](https://github.com/Justkant)! - fix: recover restore and onboarding issues

  Fix desktop LNX onboarding back when coming from recover
  Skip genuine check when coming from recover to restore the device (it would be better to allow unseeded device on the genuine check screen instead)
  Send the deviceId to the recover app in order to avoid multiple device selection during the restore process
  Update the podfile to config the build settings with ccache support (You might need to check https://stackoverflow.com/a/70189990 for ccache to work correctly when building with xcode)
  Cleanup old RecoverStaxFlow screen
  Patch react-native-webview to add support for `allowsUnsecureHttps`
  Added `IGNORE_CERTIFICATE_ERRORS=1` to use `allowsUnsecureHttps` in the webview in dev same as for LLD
  Added `protect-local` & `protect-local-dev` manifest support in dev
  Update wallet-api dependencies

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add language change prompt at the beginning of the early security check

- [#4287](https://github.com/LedgerHQ/ledger-live/pull/4287) [`c54f1a8d17`](https://github.com/LedgerHQ/ledger-live/commit/c54f1a8d17bd7d642a43de63420dcd3dda3892e2) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing keys to RN components

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`b238109174`](https://github.com/LedgerHQ/ledger-live/commit/b238109174ab3cad39f9531639b32bf3778abc72), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`87cbec4062`](https://github.com/LedgerHQ/ledger-live/commit/87cbec4062f95d2348d7dd134cb4f13f071425d5), [`d031e69737`](https://github.com/LedgerHQ/ledger-live/commit/d031e69737ac4b4d00890de477408dfa4870faf7), [`9154178962`](https://github.com/LedgerHQ/ledger-live/commit/9154178962b68ef974831ebff36d39d2e27d15e2), [`a4648d5c78`](https://github.com/LedgerHQ/ledger-live/commit/a4648d5c78e21989c9d5a3de7c7df80e05672eef), [`2f73df6545`](https://github.com/LedgerHQ/ledger-live/commit/2f73df65457c16cceb632a9c745e4c20a6ae4934), [`032b68731f`](https://github.com/LedgerHQ/ledger-live/commit/032b68731f29a4faad2c84a51bda588507ccf45d), [`5b2247695c`](https://github.com/LedgerHQ/ledger-live/commit/5b2247695c80af26d8c3187df1cb53c95e3317b1), [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a), [`7002c6c8f9`](https://github.com/LedgerHQ/ledger-live/commit/7002c6c8f9bcbc5c2387cb064f218c5e27c70315), [`00c1159356`](https://github.com/LedgerHQ/ledger-live/commit/00c11593565ac8b370df77af13dc3f1d8de90914), [`88846cc39d`](https://github.com/LedgerHQ/ledger-live/commit/88846cc39d053726800aabb435b04dc299c4c485), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`f3f4745b20`](https://github.com/LedgerHQ/ledger-live/commit/f3f4745b20261b877a938a897b5ad24291fca8aa), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`1b4321f363`](https://github.com/LedgerHQ/ledger-live/commit/1b4321f363b1e2c93e2406dd327cd4d1def7b458), [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e), [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5), [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074), [`de641a013f`](https://github.com/LedgerHQ/ledger-live/commit/de641a013fc8c4bb6897624d306f2a34339691d0), [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5), [`2bec4b7f08`](https://github.com/LedgerHQ/ledger-live/commit/2bec4b7f080d6dc9a6b22805c0fa317ff55c7202), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`3f36af3127`](https://github.com/LedgerHQ/ledger-live/commit/3f36af31273aba263b79b3f161599ac089cfc6e7), [`4cb6add5d9`](https://github.com/LedgerHQ/ledger-live/commit/4cb6add5d991e24acebac8b59549ced40ee1a19d), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a), [`e8a7bc5378`](https://github.com/LedgerHQ/ledger-live/commit/e8a7bc537898ef58ab312097860bae1d27999a81), [`87a0a8b0dc`](https://github.com/LedgerHQ/ledger-live/commit/87a0a8b0dce2d36a34541f890697b4ffba258382), [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688), [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a), [`f7ab71db0e`](https://github.com/LedgerHQ/ledger-live/commit/f7ab71db0eaeb5c69a7c7b9aeed755f17c872797)]:
  - @ledgerhq/types-live@6.39.0
  - @ledgerhq/live-common@31.6.0
  - @ledgerhq/coin-evm@0.6.0
  - @ledgerhq/live-env@0.5.0
  - @ledgerhq/coin-framework@0.5.2
  - @ledgerhq/native-ui@0.21.0
  - @ledgerhq/domain-service@1.1.9
  - @ledgerhq/evm-tools@1.0.5

## 3.30.0-next.2

### Minor Changes

- [#4558](https://github.com/LedgerHQ/ledger-live/pull/4558) [`7dc9d2bfa8`](https://github.com/LedgerHQ/ledger-live/commit/7dc9d2bfa869c467657483d635c38073beda03d1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed the following issue : User cannot select device on device selection screen when verifying address a second time

## 3.30.0-next.1

### Patch Changes

- Updated dependencies [[`de641a013f`](https://github.com/LedgerHQ/ledger-live/commit/de641a013fc8c4bb6897624d306f2a34339691d0)]:
  - @ledgerhq/live-common@31.6.0-next.1

## 3.30.0-next.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

- [#4212](https://github.com/LedgerHQ/ledger-live/pull/4212) [`9154178962`](https://github.com/LedgerHQ/ledger-live/commit/9154178962b68ef974831ebff36d39d2e27d15e2) Thanks [@cksanders](https://github.com/cksanders)! - - Update WebPTXPlayer to load correct manifest

  - Remove unused LL BUY/SELL in favour of BUY/SELL Live App

- [#4364](https://github.com/LedgerHQ/ledger-live/pull/4364) [`a4648d5c78`](https://github.com/LedgerHQ/ledger-live/commit/a4648d5c78e21989c9d5a3de7c7df80e05672eef) Thanks [@AlexandruPislariu](https://github.com/AlexandruPislariu)! - Fixed improper minimum staking balance calculation.

- [#4327](https://github.com/LedgerHQ/ledger-live/pull/4327) [`1cfd51f86f`](https://github.com/LedgerHQ/ledger-live/commit/1cfd51f86f08670e47c77dea45ad8f17f68c9041) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add earn info modal

- [#3928](https://github.com/LedgerHQ/ledger-live/pull/3928) [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - New Deposit flow

- [#4408](https://github.com/LedgerHQ/ledger-live/pull/4408) [`268ebcfd48`](https://github.com/LedgerHQ/ledger-live/commit/268ebcfd488dcf77802d756eb94dd547943f4fb1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - changed the color of the operations to be orange when pending

### Patch Changes

- [#4397](https://github.com/LedgerHQ/ledger-live/pull/4397) [`2cdbc483fa`](https://github.com/LedgerHQ/ledger-live/commit/2cdbc483fa1df4aa1dae4c93c83cf06bb0676927) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Notifications get re-enabled when updating the app

- [#4466](https://github.com/LedgerHQ/ledger-live/pull/4466) [`cd9579816d`](https://github.com/LedgerHQ/ledger-live/commit/cd9579816d92807c8e1645b96ff9978fa7f9fc09) Thanks [@sarneijim](https://github.com/sarneijim)! - Add deeplink_clicked track to LLM and improve deeplink_clicked track to LLD

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4274](https://github.com/LedgerHQ/ledger-live/pull/4274) [`95c9573979`](https://github.com/LedgerHQ/ledger-live/commit/95c9573979d7a1cf435ac3b3b377f76d605ca214) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Added locale to Earn URL navigation

- [#4471](https://github.com/LedgerHQ/ledger-live/pull/4471) [`f55c6e4f90`](https://github.com/LedgerHQ/ledger-live/commit/f55c6e4f9027e8277553af44334026a70ee3bdaa) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New firmware update flow: redesign of fw update available banner

- [#4152](https://github.com/LedgerHQ/ledger-live/pull/4152) [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074) Thanks [@grsoares21](https://github.com/grsoares21)! - Feat: adds a first step to display the changelog of the fw update

  Handling correctly when a user leaves the fw update from this first step

- [#4467](https://github.com/LedgerHQ/ledger-live/pull/4467) [`c4c16e6a32`](https://github.com/LedgerHQ/ledger-live/commit/c4c16e6a326040767747d38fe87c17ce5dd91b03) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Re-use account-specific stake flow actions directly in the Earn Navigator to avoid empty stake flow navigation that was causing empty modals to appear.

- [#4421](https://github.com/LedgerHQ/ledger-live/pull/4421) [`00c1159356`](https://github.com/LedgerHQ/ledger-live/commit/00c11593565ac8b370df77af13dc3f1d8de90914) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Allow passing of onPressWhenDisabled prop to native ui button

- [#4423](https://github.com/LedgerHQ/ledger-live/pull/4423) [`5049231835`](https://github.com/LedgerHQ/ledger-live/commit/5049231835eb2eb6777dea5ee9a8813b95ed1ccb) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - fix back arrow on market detail when ptxEarn feature enabled

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: genuine check and firmware update check during the ESC

  - UX and UI implementation of the new ESC
  - Enable a firmware update during the ESC (before a device is seeded)
  - Handles different error/failure/quit scenarios

- [#4169](https://github.com/LedgerHQ/ledger-live/pull/4169) [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a) Thanks [@gre](https://github.com/gre)! - Introduces use\*DeviceAction() hooks in order to mock test all device actions. It impacts all screens that have device actions.

- [#4208](https://github.com/LedgerHQ/ledger-live/pull/4208) [`151ae54309`](https://github.com/LedgerHQ/ledger-live/commit/151ae543093d646b332851c6873ec7e735830445) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Analytics console: workaround for layout issue that happens after a while in the scrollview

- [#4407](https://github.com/LedgerHQ/ledger-live/pull/4407) [`d6c1984620`](https://github.com/LedgerHQ/ledger-live/commit/d6c1984620b1d7d8289cf73f5b782217f241c2e6) Thanks [@beths-ledger](https://github.com/beths-ledger)! - fix deep link to buy coins to display no funds flow with option to add account if none available. Remove excess padding above market list and fix overlap of main nav button over earn screen.

- [#4199](https://github.com/LedgerHQ/ledger-live/pull/4199) [`f161be752a`](https://github.com/LedgerHQ/ledger-live/commit/f161be752a668110bdaa0039c721ebb55ca888f2) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Update Swap Form - Edit Rates props

- [#4432](https://github.com/LedgerHQ/ledger-live/pull/4432) [`213b66a80f`](https://github.com/LedgerHQ/ledger-live/commit/213b66a80f3751e4be7bcbab5bb9de3bc8db366a) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - fix broken ui on market tab switching

- [#4152](https://github.com/LedgerHQ/ledger-live/pull/4152) [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix: several bugs during the firmware update on LLM

  Several bug were fixed:

  - an issue on how "user solvable" errors were handled on the logic and UI of the fw update
  - a bug on errors that were supposed to be ignored (e.g. an inexistent lockscreen image when backing
    up) and were actually being reported to the user
  - a bug when a “allow manager”/secure channel was refused as the beginning of the fw update
  - a bug on the battery check UX that made the app re-navigate to the firmware update automatically
    once the user exited it

- [#4307](https://github.com/LedgerHQ/ledger-live/pull/4307) [`82f9d775fc`](https://github.com/LedgerHQ/ledger-live/commit/82f9d775fc560843c19c9a0b25648cbe60d2b190) Thanks [@gre](https://github.com/gre)! - Implement resiliency on importing accounts that fail to be decoded (bad currencyId, bad derivationMode,...)

- [#4426](https://github.com/LedgerHQ/ledger-live/pull/4426) [`2bec4b7f08`](https://github.com/LedgerHQ/ledger-live/commit/2bec4b7f080d6dc9a6b22805c0fa317ff55c7202) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: improve error wording in some cases

- [#4461](https://github.com/LedgerHQ/ledger-live/pull/4461) [`ed6da731dd`](https://github.com/LedgerHQ/ledger-live/commit/ed6da731dd196a76350b66db2301968bc3df3a05) Thanks [@Justkant](https://github.com/Justkant)! - fix: accessing restore flow from onboarding

- [#4317](https://github.com/LedgerHQ/ledger-live/pull/4317) [`3f36af3127`](https://github.com/LedgerHQ/ledger-live/commit/3f36af31273aba263b79b3f161599ac089cfc6e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Remove legacy code for WalletConnect

- [#4390](https://github.com/LedgerHQ/ledger-live/pull/4390) [`3723b104e4`](https://github.com/LedgerHQ/ledger-live/commit/3723b104e48be93e7233837742d8e757422e8e6e) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - fix: do not pop from live app when verifying address

- [#4353](https://github.com/LedgerHQ/ledger-live/pull/4353) [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add evm mock test

- [#4355](https://github.com/LedgerHQ/ledger-live/pull/4355) [`850dad94df`](https://github.com/LedgerHQ/ledger-live/commit/850dad94dfb9f04f48b4c7a5d90cfed6777013d7) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - fixes safe area view on earn screen

- [#4385](https://github.com/LedgerHQ/ledger-live/pull/4385) [`87cbec4062`](https://github.com/LedgerHQ/ledger-live/commit/87cbec4062f95d2348d7dd134cb4f13f071425d5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade dependencies:

  - Android:
    - compileSdkVersion and targetSdkVersion to 33
    - androidX core libs to 1.8.0
  - JS:
    - replace outdated "@react-native-community/clipboard" by "@react-native-clipboard/clipboard": "^1.11.2"
    - "@react-native-async-storage/async-storage": "^1.19.2"
    - "lottie-react-native": "^6.2.0"
    - "react-native-image-picker": "^5.6.1"
    - "react-native-svg": "^13.11.0"

- [#4451](https://github.com/LedgerHQ/ledger-live/pull/4451) [`87a0a8b0dc`](https://github.com/LedgerHQ/ledger-live/commit/87a0a8b0dce2d36a34541f890697b4ffba258382) Thanks [@Justkant](https://github.com/Justkant)! - fix: recover restore and onboarding issues

  Fix desktop LNX onboarding back when coming from recover
  Skip genuine check when coming from recover to restore the device (it would be better to allow unseeded device on the genuine check screen instead)
  Send the deviceId to the recover app in order to avoid multiple device selection during the restore process
  Update the podfile to config the build settings with ccache support (You might need to check https://stackoverflow.com/a/70189990 for ccache to work correctly when building with xcode)
  Cleanup old RecoverStaxFlow screen
  Patch react-native-webview to add support for `allowsUnsecureHttps`
  Added `IGNORE_CERTIFICATE_ERRORS=1` to use `allowsUnsecureHttps` in the webview in dev same as for LLD
  Added `protect-local` & `protect-local-dev` manifest support in dev
  Update wallet-api dependencies

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add language change prompt at the beginning of the early security check

- [#4287](https://github.com/LedgerHQ/ledger-live/pull/4287) [`c54f1a8d17`](https://github.com/LedgerHQ/ledger-live/commit/c54f1a8d17bd7d642a43de63420dcd3dda3892e2) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing keys to RN components

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`b238109174`](https://github.com/LedgerHQ/ledger-live/commit/b238109174ab3cad39f9531639b32bf3778abc72), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`87cbec4062`](https://github.com/LedgerHQ/ledger-live/commit/87cbec4062f95d2348d7dd134cb4f13f071425d5), [`d031e69737`](https://github.com/LedgerHQ/ledger-live/commit/d031e69737ac4b4d00890de477408dfa4870faf7), [`9154178962`](https://github.com/LedgerHQ/ledger-live/commit/9154178962b68ef974831ebff36d39d2e27d15e2), [`a4648d5c78`](https://github.com/LedgerHQ/ledger-live/commit/a4648d5c78e21989c9d5a3de7c7df80e05672eef), [`2f73df6545`](https://github.com/LedgerHQ/ledger-live/commit/2f73df65457c16cceb632a9c745e4c20a6ae4934), [`032b68731f`](https://github.com/LedgerHQ/ledger-live/commit/032b68731f29a4faad2c84a51bda588507ccf45d), [`5b2247695c`](https://github.com/LedgerHQ/ledger-live/commit/5b2247695c80af26d8c3187df1cb53c95e3317b1), [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a), [`7002c6c8f9`](https://github.com/LedgerHQ/ledger-live/commit/7002c6c8f9bcbc5c2387cb064f218c5e27c70315), [`00c1159356`](https://github.com/LedgerHQ/ledger-live/commit/00c11593565ac8b370df77af13dc3f1d8de90914), [`88846cc39d`](https://github.com/LedgerHQ/ledger-live/commit/88846cc39d053726800aabb435b04dc299c4c485), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`f3f4745b20`](https://github.com/LedgerHQ/ledger-live/commit/f3f4745b20261b877a938a897b5ad24291fca8aa), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`1b4321f363`](https://github.com/LedgerHQ/ledger-live/commit/1b4321f363b1e2c93e2406dd327cd4d1def7b458), [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e), [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5), [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074), [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5), [`2bec4b7f08`](https://github.com/LedgerHQ/ledger-live/commit/2bec4b7f080d6dc9a6b22805c0fa317ff55c7202), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`3f36af3127`](https://github.com/LedgerHQ/ledger-live/commit/3f36af31273aba263b79b3f161599ac089cfc6e7), [`4cb6add5d9`](https://github.com/LedgerHQ/ledger-live/commit/4cb6add5d991e24acebac8b59549ced40ee1a19d), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a), [`e8a7bc5378`](https://github.com/LedgerHQ/ledger-live/commit/e8a7bc537898ef58ab312097860bae1d27999a81), [`87a0a8b0dc`](https://github.com/LedgerHQ/ledger-live/commit/87a0a8b0dce2d36a34541f890697b4ffba258382), [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688), [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a), [`f7ab71db0e`](https://github.com/LedgerHQ/ledger-live/commit/f7ab71db0eaeb5c69a7c7b9aeed755f17c872797)]:
  - @ledgerhq/types-live@6.39.0-next.0
  - @ledgerhq/live-common@31.6.0-next.0
  - @ledgerhq/coin-evm@0.6.0-next.0
  - @ledgerhq/live-env@0.5.0-next.0
  - @ledgerhq/coin-framework@0.5.2-next.0
  - @ledgerhq/native-ui@0.21.0-next.0
  - @ledgerhq/domain-service@1.1.9-next.0
  - @ledgerhq/evm-tools@1.0.5-next.0

## 3.29.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/native-ui@0.20.6

## 3.29.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/native-ui@0.20.6-hotfix.0

## 3.29.0

### Minor Changes

- [#4148](https://github.com/LedgerHQ/ledger-live/pull/4148) [`dfea8a7a0c`](https://github.com/LedgerHQ/ledger-live/commit/dfea8a7a0c24e85b45863a314d010bb7e2bcd878) Thanks [@Justkant](https://github.com/Justkant)! - feat: update wallet-api

  Add `device.select` and `device.open` support
  Bump `bignumber.js` to latest because of mismatch between wallet-api version and ours

### Patch Changes

- [#4203](https://github.com/LedgerHQ/ledger-live/pull/4203) [`ec75bf3fa6`](https://github.com/LedgerHQ/ledger-live/commit/ec75bf3fa6f3506fcd96bafca87967b0a711f62f) Thanks [@cng-ledger](https://github.com/cng-ledger)! - Default ProviderIcon to boxed mode in order to support light and dark mode out of the box

- [#4214](https://github.com/LedgerHQ/ledger-live/pull/4214) [`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6) Thanks [@mle-gall](https://github.com/mle-gall)! - Pixel polishing for stax (LLM) : Error states, My Ledger, CLS, Post Onboarding, Device Selection

- [#4211](https://github.com/LedgerHQ/ledger-live/pull/4211) [`652e587374`](https://github.com/LedgerHQ/ledger-live/commit/652e58737480a268c9664f5213fc7d73092f0211) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix feature flag for Polygon Zk EVM

- [#4145](https://github.com/LedgerHQ/ledger-live/pull/4145) [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Removing FTX and Wyre related code from LLD, LLM and LLC

- [#4209](https://github.com/LedgerHQ/ledger-live/pull/4209) [`90d7c237a4`](https://github.com/LedgerHQ/ledger-live/commit/90d7c237a4380ad91134f24d0c39c10079896725) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add account as query param to multibuy redirect on NotEnoughGasSwap link click

- [#4186](https://github.com/LedgerHQ/ledger-live/pull/4186) [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add linked errors to LLM

- [#4053](https://github.com/LedgerHQ/ledger-live/pull/4053) [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387) Thanks [@mle-gall](https://github.com/mle-gall)! - New NPS ratings flow

- [#4022](https://github.com/LedgerHQ/ledger-live/pull/4022) [`1c3eae57c9`](https://github.com/LedgerHQ/ledger-live/commit/1c3eae57c94fe1372f807a7bd848ee36218c3624) Thanks [@mderrick](https://github.com/mderrick)! - fix header breaking when navigating wallet tabs

- [#4279](https://github.com/LedgerHQ/ledger-live/pull/4279) [`d3df280539`](https://github.com/LedgerHQ/ledger-live/commit/d3df280539cc17f295fd178a2fddd2d1fb7ba59a) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix feature flag for Secret Network

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`dfea8a7a0c`](https://github.com/LedgerHQ/ledger-live/commit/dfea8a7a0c24e85b45863a314d010bb7e2bcd878), [`d5d0e399ce`](https://github.com/LedgerHQ/ledger-live/commit/d5d0e399ce3cf3a49802bc8a5563eedd8a590094), [`90d7c237a4`](https://github.com/LedgerHQ/ledger-live/commit/90d7c237a4380ad91134f24d0c39c10079896725), [`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`d21f0bc2e4`](https://github.com/LedgerHQ/ledger-live/commit/d21f0bc2e4bb7ec62c18bc878e6fb0f5240b5ca0), [`9fa642e428`](https://github.com/LedgerHQ/ledger-live/commit/9fa642e428dc88f88dcd3e6e439c3ee40337dbaf), [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/types-live@6.38.1
  - @ledgerhq/live-common@31.5.0
  - @ledgerhq/live-env@0.4.2
  - @ledgerhq/native-ui@0.20.5
  - @ledgerhq/errors@6.14.0
  - @ledgerhq/react-native-hid@6.30.0
  - @ledgerhq/coin-evm@0.5.1
  - @ledgerhq/coin-framework@0.5.1
  - @ledgerhq/domain-service@1.1.8
  - @ledgerhq/evm-tools@1.0.4
  - @ledgerhq/devices@8.0.7
  - @ledgerhq/hw-transport@6.28.8
  - @ledgerhq/hw-transport-http@6.28.3
  - @ledgerhq/react-native-hw-transport-ble@6.29.5

## 3.29.0-next.2

### Patch Changes

- [#4279](https://github.com/LedgerHQ/ledger-live/pull/4279) [`d3df280539`](https://github.com/LedgerHQ/ledger-live/commit/d3df280539cc17f295fd178a2fddd2d1fb7ba59a) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix feature flag for Secret Network

## 3.29.0-next.1

### Patch Changes

- Updated dependencies [[`9fa642e428`](https://github.com/LedgerHQ/ledger-live/commit/9fa642e428dc88f88dcd3e6e439c3ee40337dbaf)]:
  - @ledgerhq/live-common@31.5.0-next.1

## 3.29.0-next.0

### Minor Changes

- [#4148](https://github.com/LedgerHQ/ledger-live/pull/4148) [`dfea8a7a0c`](https://github.com/LedgerHQ/ledger-live/commit/dfea8a7a0c24e85b45863a314d010bb7e2bcd878) Thanks [@Justkant](https://github.com/Justkant)! - feat: update wallet-api

  Add `device.select` and `device.open` support
  Bump `bignumber.js` to latest because of mismatch between wallet-api version and ours

### Patch Changes

- [#4203](https://github.com/LedgerHQ/ledger-live/pull/4203) [`ec75bf3fa6`](https://github.com/LedgerHQ/ledger-live/commit/ec75bf3fa6f3506fcd96bafca87967b0a711f62f) Thanks [@cng-ledger](https://github.com/cng-ledger)! - Default ProviderIcon to boxed mode in order to support light and dark mode out of the box

- [#4214](https://github.com/LedgerHQ/ledger-live/pull/4214) [`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6) Thanks [@mle-gall](https://github.com/mle-gall)! - Pixel polishing for stax (LLM) : Error states, My Ledger, CLS, Post Onboarding, Device Selection

- [#4211](https://github.com/LedgerHQ/ledger-live/pull/4211) [`652e587374`](https://github.com/LedgerHQ/ledger-live/commit/652e58737480a268c9664f5213fc7d73092f0211) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix feature flag for Polygon Zk EVM

- [#4145](https://github.com/LedgerHQ/ledger-live/pull/4145) [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Removing FTX and Wyre related code from LLD, LLM and LLC

- [#4209](https://github.com/LedgerHQ/ledger-live/pull/4209) [`90d7c237a4`](https://github.com/LedgerHQ/ledger-live/commit/90d7c237a4380ad91134f24d0c39c10079896725) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add account as query param to multibuy redirect on NotEnoughGasSwap link click

- [#4186](https://github.com/LedgerHQ/ledger-live/pull/4186) [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add linked errors to LLM

- [#4053](https://github.com/LedgerHQ/ledger-live/pull/4053) [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387) Thanks [@mle-gall](https://github.com/mle-gall)! - New NPS ratings flow

- [#4022](https://github.com/LedgerHQ/ledger-live/pull/4022) [`1c3eae57c9`](https://github.com/LedgerHQ/ledger-live/commit/1c3eae57c94fe1372f807a7bd848ee36218c3624) Thanks [@mderrick](https://github.com/mderrick)! - fix header breaking when navigating wallet tabs

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`dfea8a7a0c`](https://github.com/LedgerHQ/ledger-live/commit/dfea8a7a0c24e85b45863a314d010bb7e2bcd878), [`d5d0e399ce`](https://github.com/LedgerHQ/ledger-live/commit/d5d0e399ce3cf3a49802bc8a5563eedd8a590094), [`90d7c237a4`](https://github.com/LedgerHQ/ledger-live/commit/90d7c237a4380ad91134f24d0c39c10079896725), [`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`d21f0bc2e4`](https://github.com/LedgerHQ/ledger-live/commit/d21f0bc2e4bb7ec62c18bc878e6fb0f5240b5ca0), [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/types-live@6.38.1-next.0
  - @ledgerhq/live-common@31.5.0-next.0
  - @ledgerhq/live-env@0.4.2-next.0
  - @ledgerhq/native-ui@0.20.5-next.0
  - @ledgerhq/errors@6.14.0-next.0
  - @ledgerhq/react-native-hid@6.30.0-next.0
  - @ledgerhq/coin-evm@0.5.1-next.0
  - @ledgerhq/coin-framework@0.5.1-next.0
  - @ledgerhq/domain-service@1.1.8-next.0
  - @ledgerhq/evm-tools@1.0.4-next.0
  - @ledgerhq/devices@8.0.7-next.0
  - @ledgerhq/hw-transport@6.28.8-next.0
  - @ledgerhq/hw-transport-http@6.28.3-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.5-next.0

## 3.28.1

### Patch Changes

- Updated dependencies [[`5696f24b93`](https://github.com/LedgerHQ/ledger-live/commit/5696f24b93151bc0ee063d1cb88cef1e2d052f9e)]:
  - @ledgerhq/native-ui@0.20.4

## 3.28.0

### Minor Changes

- [#3945](https://github.com/LedgerHQ/ledger-live/pull/3945) [`b4071d2957`](https://github.com/LedgerHQ/ledger-live/commit/b4071d2957cdf728c98fffb1deb542516019da9d) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow for LLM

- [#4013](https://github.com/LedgerHQ/ledger-live/pull/4013) [`fce9daab99`](https://github.com/LedgerHQ/ledger-live/commit/fce9daab99de0ca092ee3dbd9f578e7f5f8ffd86) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - adds earn dashboard screen and earn deeplinks

- [#4139](https://github.com/LedgerHQ/ledger-live/pull/4139) [`28068a5333`](https://github.com/LedgerHQ/ledger-live/commit/28068a53336eb51936c529e0a06605b64ece24ec) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - add generic error and add error screen recover device already seeded

- [#4139](https://github.com/LedgerHQ/ledger-live/pull/4139) [`89de3b7659`](https://github.com/LedgerHQ/ledger-live/commit/89de3b76593fe1f6df7634ed3638267c90517851) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - change wording error device already seeded on recover onboarding

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#4040](https://github.com/LedgerHQ/ledger-live/pull/4040) [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add feature flags around ptx services in llm

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

- [#4151](https://github.com/LedgerHQ/ledger-live/pull/4151) [`37d5cd4d43`](https://github.com/LedgerHQ/ledger-live/commit/37d5cd4d43738b182d8c3066689434aab1962c60) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - market screen entrypoint in wallet screen on feature flag. Deeplink mutations on feature flag changes.

### Patch Changes

- [#3792](https://github.com/LedgerHQ/ledger-live/pull/3792) [`9428e776cd`](https://github.com/LedgerHQ/ledger-live/commit/9428e776cd2f42f08472ab53a3c050d00a93b31c) Thanks [@grsoares21](https://github.com/grsoares21)! - Design polishes on the new UX for the firmware update feature

- [#3999](https://github.com/LedgerHQ/ledger-live/pull/3999) [`795daf3898`](https://github.com/LedgerHQ/ledger-live/commit/795daf38985c3b4f18f9982bd09c2334469929f4) Thanks [@grsoares21](https://github.com/grsoares21)! - Filter for Stax devices during the "set NFT as custom lockscreen" flow

- [#4215](https://github.com/LedgerHQ/ledger-live/pull/4215) [`8a777071ed`](https://github.com/LedgerHQ/ledger-live/commit/8a777071edd501f785f230b17a7dcd06381cb3a9) Thanks [@cng-ledger](https://github.com/cng-ledger)! - Default ProviderIcon to boxed mode in order to support light and dark mode out of the box

- [#4026](https://github.com/LedgerHQ/ledger-live/pull/4026) [`27874942b1`](https://github.com/LedgerHQ/ledger-live/commit/27874942b1c1a3cba0d4000bf345c233ebd6eda7) Thanks [@chabroA](https://github.com/chabroA)! - Fix wrong `shouldSkipAmount` in general send flow

- [#4084](https://github.com/LedgerHQ/ledger-live/pull/4084) [`0df5f85306`](https://github.com/LedgerHQ/ledger-live/commit/0df5f85306275adfc1efdb45243b2803b0367d41) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add toasts and drawer for apple warning about ptx services

- [#4175](https://github.com/LedgerHQ/ledger-live/pull/4175) [`865b0d4256`](https://github.com/LedgerHQ/ledger-live/commit/865b0d42561c02b56f4852b3e7b6a229487da599) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix feature flag for Polygon Zk EVM

- [#4108](https://github.com/LedgerHQ/ledger-live/pull/4108) [`77cd8b8d46`](https://github.com/LedgerHQ/ledger-live/commit/77cd8b8d46774432a1a43d176cba428d0021db2e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - give users notEnoughBalance error when available balance is too low for cosmos llm

- [#4054](https://github.com/LedgerHQ/ledger-live/pull/4054) [`aba777d60a`](https://github.com/LedgerHQ/ledger-live/commit/aba777d60a389ace93eccfbd1b19f247c124bb3a) Thanks [@mderrick](https://github.com/mderrick)! - apply discreet mode to nft gallery

- [#4114](https://github.com/LedgerHQ/ledger-live/pull/4114) [`d560c16d14`](https://github.com/LedgerHQ/ledger-live/commit/d560c16d1403355f15d18d215d26d8c8bfe60cb4) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add earn entrypoint in mobile tab navigation

- [#4042](https://github.com/LedgerHQ/ledger-live/pull/4042) [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: locked device errors handling in LLM new firmwre update

- [#3963](https://github.com/LedgerHQ/ledger-live/pull/3963) [`178d65887d`](https://github.com/LedgerHQ/ledger-live/commit/178d65887d7e6d67ddda8b83181c9fc1a3b0a13b) Thanks [@sarneijim](https://github.com/sarneijim)! - chore: add staking_completed track to tezos and dot

- [#3964](https://github.com/LedgerHQ/ledger-live/pull/3964) [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - rename optimism to op mainnet

- [#4091](https://github.com/LedgerHQ/ledger-live/pull/4091) [`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7) Thanks [@mle-gall](https://github.com/mle-gall)! - UILib - New icons + renamed old icon set to Legacy (should not be used anymore by consumers eg LLD and LLM)

- [#4070](https://github.com/LedgerHQ/ledger-live/pull/4070) [`0ac4ab5455`](https://github.com/LedgerHQ/ledger-live/commit/0ac4ab5455098f734fe51a9f5c71971fd2234d24) Thanks [@mderrick](https://github.com/mderrick)! - use transparent background on nft viewer screen

- [#4185](https://github.com/LedgerHQ/ledger-live/pull/4185) [`73d24bb470`](https://github.com/LedgerHQ/ledger-live/commit/73d24bb47009befb5be9719d523382eac2b94e30) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Rephrase refer a friend banner in BTC account

- [#4003](https://github.com/LedgerHQ/ledger-live/pull/4003) [`3de79a2927`](https://github.com/LedgerHQ/ledger-live/commit/3de79a2927a1679ce4571f2c298cd404877cc49a) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove extra refresh effect when configuration change in swap llm

- [#3983](https://github.com/LedgerHQ/ledger-live/pull/3983) [`5dba98a39d`](https://github.com/LedgerHQ/ledger-live/commit/5dba98a39de6765539f76446613f1a90ddb743d5) Thanks [@cng-ledger](https://github.com/cng-ledger)! - added ProviderIcon component to LLD & LLM which loads svg icons from CDN

- [#4016](https://github.com/LedgerHQ/ledger-live/pull/4016) [`44cce5d4e3`](https://github.com/LedgerHQ/ledger-live/commit/44cce5d4e3262b6a924471ec75a80fabd14c4e6b) Thanks [@sarneijim](https://github.com/sarneijim)! - Add attributes in stake screen tracks

- [#4130](https://github.com/LedgerHQ/ledger-live/pull/4130) [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - coreum integration

- [#4113](https://github.com/LedgerHQ/ledger-live/pull/4113) [`4e47969867`](https://github.com/LedgerHQ/ledger-live/commit/4e4796986724579c8a9e405add44db6280878508) Thanks [@grsoares21](https://github.com/grsoares21)! - Add manual retry mechanism for app restoration errors during the firmware update

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Add ethereum and polygon as evm familly for test

- [#4137](https://github.com/LedgerHQ/ledger-live/pull/4137) [`4c093f90ed`](https://github.com/LedgerHQ/ledger-live/commit/4c093f90edd41b146a8310a3d9d0f469b5bad23d) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - remove header from earn dashboard

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4020](https://github.com/LedgerHQ/ledger-live/pull/4020) [`37c4e845c3`](https://github.com/LedgerHQ/ledger-live/commit/37c4e845c3f821760a67c56bdbfa09f45f736c78) Thanks [@chabroA](https://github.com/chabroA)! - remove unnecessary check on tx networkInfo

- [#3581](https://github.com/LedgerHQ/ledger-live/pull/3581) [`f4111c10c3`](https://github.com/LedgerHQ/ledger-live/commit/f4111c10c3170952d87d31ed2f275a17e040cab4) Thanks [@grsoares21](https://github.com/grsoares21)! - Make the battery warning banner for firmware updates on Stax unskippable.

- [#3957](https://github.com/LedgerHQ/ledger-live/pull/3957) [`af7aa74fc5`](https://github.com/LedgerHQ/ledger-live/commit/af7aa74fc5aa11e73c7c5d2f9c1e33d2e870f89d) Thanks [@mderrick](https://github.com/mderrick)! - nft gallery blockchain filters

- Updated dependencies [[`12c6004c2c`](https://github.com/LedgerHQ/ledger-live/commit/12c6004c2cbc97df13cd465e1a9a09e6114df2be), [`4e47969867`](https://github.com/LedgerHQ/ledger-live/commit/4e4796986724579c8a9e405add44db6280878508), [`a690f9802f`](https://github.com/LedgerHQ/ledger-live/commit/a690f9802f81643ac047d6626f691353953adca1), [`28068a5333`](https://github.com/LedgerHQ/ledger-live/commit/28068a53336eb51936c529e0a06605b64ece24ec), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`e775c83ab7`](https://github.com/LedgerHQ/ledger-live/commit/e775c83ab7fa28b395c149d03679cdd93535b14a), [`2e5e37af96`](https://github.com/LedgerHQ/ledger-live/commit/2e5e37af96120b58fb56386cf77b6478cf06eed8), [`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7), [`3de79a2927`](https://github.com/LedgerHQ/ledger-live/commit/3de79a2927a1679ce4571f2c298cd404877cc49a), [`5dba98a39d`](https://github.com/LedgerHQ/ledger-live/commit/5dba98a39de6765539f76446613f1a90ddb743d5), [`7901608c80`](https://github.com/LedgerHQ/ledger-live/commit/7901608c80343abb271cce495fce673c544e6330), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`03896700ca`](https://github.com/LedgerHQ/ledger-live/commit/03896700ca019b5a0b6a2d68b49abb80e47d3d02), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22), [`37c4e845c3`](https://github.com/LedgerHQ/ledger-live/commit/37c4e845c3f821760a67c56bdbfa09f45f736c78), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`cd00fe93c5`](https://github.com/LedgerHQ/ledger-live/commit/cd00fe93c599dfd8d71c49adf538c0c8fd2e4280), [`9428e776cd`](https://github.com/LedgerHQ/ledger-live/commit/9428e776cd2f42f08472ab53a3c050d00a93b31c), [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4)]:
  - @ledgerhq/live-common@31.4.0
  - @ledgerhq/live-env@0.4.1
  - @ledgerhq/native-ui@0.20.3
  - @ledgerhq/types-cryptoassets@7.4.0
  - @ledgerhq/types-live@6.38.0
  - @ledgerhq/coin-evm@0.5.0
  - @ledgerhq/coin-framework@0.5.0
  - @ledgerhq/evm-tools@1.0.3
  - @ledgerhq/errors@6.13.1
  - @ledgerhq/domain-service@1.1.7
  - @ledgerhq/devices@8.0.6
  - @ledgerhq/hw-transport@6.28.7
  - @ledgerhq/hw-transport-http@6.28.2
  - @ledgerhq/react-native-hid@6.29.6
  - @ledgerhq/react-native-hw-transport-ble@6.29.4

## 3.28.0-next.3

### Patch Changes

- [#4215](https://github.com/LedgerHQ/ledger-live/pull/4215) [`8a777071ed`](https://github.com/LedgerHQ/ledger-live/commit/8a777071edd501f785f230b17a7dcd06381cb3a9) Thanks [@cng-ledger](https://github.com/cng-ledger)! - Default ProviderIcon to boxed mode in order to support light and dark mode out of the box

## 3.28.0-next.2

### Patch Changes

- [#4175](https://github.com/LedgerHQ/ledger-live/pull/4175) [`865b0d4256`](https://github.com/LedgerHQ/ledger-live/commit/865b0d42561c02b56f4852b3e7b6a229487da599) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix feature flag for Polygon Zk EVM

## 3.28.0-next.1

### Patch Changes

- [#4185](https://github.com/LedgerHQ/ledger-live/pull/4185) [`73d24bb470`](https://github.com/LedgerHQ/ledger-live/commit/73d24bb47009befb5be9719d523382eac2b94e30) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Rephrase refer a friend banner in BTC account

## 3.28.0-next.0

### Minor Changes

- [#3945](https://github.com/LedgerHQ/ledger-live/pull/3945) [`b4071d2957`](https://github.com/LedgerHQ/ledger-live/commit/b4071d2957cdf728c98fffb1deb542516019da9d) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow for LLM

- [#4013](https://github.com/LedgerHQ/ledger-live/pull/4013) [`fce9daab99`](https://github.com/LedgerHQ/ledger-live/commit/fce9daab99de0ca092ee3dbd9f578e7f5f8ffd86) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - adds earn dashboard screen and earn deeplinks

- [#4139](https://github.com/LedgerHQ/ledger-live/pull/4139) [`28068a5333`](https://github.com/LedgerHQ/ledger-live/commit/28068a53336eb51936c529e0a06605b64ece24ec) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - add generic error and add error screen recover device already seeded

- [#4139](https://github.com/LedgerHQ/ledger-live/pull/4139) [`89de3b7659`](https://github.com/LedgerHQ/ledger-live/commit/89de3b76593fe1f6df7634ed3638267c90517851) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - change wording error device already seeded on recover onboarding

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#4040](https://github.com/LedgerHQ/ledger-live/pull/4040) [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add feature flags around ptx services in llm

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

- [#4151](https://github.com/LedgerHQ/ledger-live/pull/4151) [`37d5cd4d43`](https://github.com/LedgerHQ/ledger-live/commit/37d5cd4d43738b182d8c3066689434aab1962c60) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - market screen entrypoint in wallet screen on feature flag. Deeplink mutations on feature flag changes.

### Patch Changes

- [#3792](https://github.com/LedgerHQ/ledger-live/pull/3792) [`9428e776cd`](https://github.com/LedgerHQ/ledger-live/commit/9428e776cd2f42f08472ab53a3c050d00a93b31c) Thanks [@grsoares21](https://github.com/grsoares21)! - Design polishes on the new UX for the firmware update feature

- [#3999](https://github.com/LedgerHQ/ledger-live/pull/3999) [`795daf3898`](https://github.com/LedgerHQ/ledger-live/commit/795daf38985c3b4f18f9982bd09c2334469929f4) Thanks [@grsoares21](https://github.com/grsoares21)! - Filter for Stax devices during the "set NFT as custom lockscreen" flow

- [#4026](https://github.com/LedgerHQ/ledger-live/pull/4026) [`27874942b1`](https://github.com/LedgerHQ/ledger-live/commit/27874942b1c1a3cba0d4000bf345c233ebd6eda7) Thanks [@chabroA](https://github.com/chabroA)! - Fix wrong `shouldSkipAmount` in general send flow

- [#4084](https://github.com/LedgerHQ/ledger-live/pull/4084) [`0df5f85306`](https://github.com/LedgerHQ/ledger-live/commit/0df5f85306275adfc1efdb45243b2803b0367d41) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add toasts and drawer for apple warning about ptx services

- [#4108](https://github.com/LedgerHQ/ledger-live/pull/4108) [`77cd8b8d46`](https://github.com/LedgerHQ/ledger-live/commit/77cd8b8d46774432a1a43d176cba428d0021db2e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - give users notEnoughBalance error when available balance is too low for cosmos llm

- [#4054](https://github.com/LedgerHQ/ledger-live/pull/4054) [`aba777d60a`](https://github.com/LedgerHQ/ledger-live/commit/aba777d60a389ace93eccfbd1b19f247c124bb3a) Thanks [@mderrick](https://github.com/mderrick)! - apply discreet mode to nft gallery

- [#4114](https://github.com/LedgerHQ/ledger-live/pull/4114) [`d560c16d14`](https://github.com/LedgerHQ/ledger-live/commit/d560c16d1403355f15d18d215d26d8c8bfe60cb4) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add earn entrypoint in mobile tab navigation

- [#4042](https://github.com/LedgerHQ/ledger-live/pull/4042) [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: locked device errors handling in LLM new firmwre update

- [#3963](https://github.com/LedgerHQ/ledger-live/pull/3963) [`178d65887d`](https://github.com/LedgerHQ/ledger-live/commit/178d65887d7e6d67ddda8b83181c9fc1a3b0a13b) Thanks [@sarneijim](https://github.com/sarneijim)! - chore: add staking_completed track to tezos and dot

- [#3964](https://github.com/LedgerHQ/ledger-live/pull/3964) [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - rename optimism to op mainnet

- [#4091](https://github.com/LedgerHQ/ledger-live/pull/4091) [`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7) Thanks [@mle-gall](https://github.com/mle-gall)! - UILib - New icons + renamed old icon set to Legacy (should not be used anymore by consumers eg LLD and LLM)

- [#4070](https://github.com/LedgerHQ/ledger-live/pull/4070) [`0ac4ab5455`](https://github.com/LedgerHQ/ledger-live/commit/0ac4ab5455098f734fe51a9f5c71971fd2234d24) Thanks [@mderrick](https://github.com/mderrick)! - use transparent background on nft viewer screen

- [#4003](https://github.com/LedgerHQ/ledger-live/pull/4003) [`3de79a2927`](https://github.com/LedgerHQ/ledger-live/commit/3de79a2927a1679ce4571f2c298cd404877cc49a) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove extra refresh effect when configuration change in swap llm

- [#3983](https://github.com/LedgerHQ/ledger-live/pull/3983) [`5dba98a39d`](https://github.com/LedgerHQ/ledger-live/commit/5dba98a39de6765539f76446613f1a90ddb743d5) Thanks [@cng-ledger](https://github.com/cng-ledger)! - added ProviderIcon component to LLD & LLM which loads svg icons from CDN

- [#4016](https://github.com/LedgerHQ/ledger-live/pull/4016) [`44cce5d4e3`](https://github.com/LedgerHQ/ledger-live/commit/44cce5d4e3262b6a924471ec75a80fabd14c4e6b) Thanks [@sarneijim](https://github.com/sarneijim)! - Add attributes in stake screen tracks

- [#4130](https://github.com/LedgerHQ/ledger-live/pull/4130) [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - coreum integration

- [#4113](https://github.com/LedgerHQ/ledger-live/pull/4113) [`4e47969867`](https://github.com/LedgerHQ/ledger-live/commit/4e4796986724579c8a9e405add44db6280878508) Thanks [@grsoares21](https://github.com/grsoares21)! - Add manual retry mechanism for app restoration errors during the firmware update

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Add ethereum and polygon as evm familly for test

- [#4137](https://github.com/LedgerHQ/ledger-live/pull/4137) [`4c093f90ed`](https://github.com/LedgerHQ/ledger-live/commit/4c093f90edd41b146a8310a3d9d0f469b5bad23d) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - remove header from earn dashboard

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4020](https://github.com/LedgerHQ/ledger-live/pull/4020) [`37c4e845c3`](https://github.com/LedgerHQ/ledger-live/commit/37c4e845c3f821760a67c56bdbfa09f45f736c78) Thanks [@chabroA](https://github.com/chabroA)! - remove unnecessary check on tx networkInfo

- [#3581](https://github.com/LedgerHQ/ledger-live/pull/3581) [`f4111c10c3`](https://github.com/LedgerHQ/ledger-live/commit/f4111c10c3170952d87d31ed2f275a17e040cab4) Thanks [@grsoares21](https://github.com/grsoares21)! - Make the battery warning banner for firmware updates on Stax unskippable.

- [#3957](https://github.com/LedgerHQ/ledger-live/pull/3957) [`af7aa74fc5`](https://github.com/LedgerHQ/ledger-live/commit/af7aa74fc5aa11e73c7c5d2f9c1e33d2e870f89d) Thanks [@mderrick](https://github.com/mderrick)! - nft gallery blockchain filters

- Updated dependencies [[`12c6004c2c`](https://github.com/LedgerHQ/ledger-live/commit/12c6004c2cbc97df13cd465e1a9a09e6114df2be), [`4e47969867`](https://github.com/LedgerHQ/ledger-live/commit/4e4796986724579c8a9e405add44db6280878508), [`a690f9802f`](https://github.com/LedgerHQ/ledger-live/commit/a690f9802f81643ac047d6626f691353953adca1), [`28068a5333`](https://github.com/LedgerHQ/ledger-live/commit/28068a53336eb51936c529e0a06605b64ece24ec), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`e775c83ab7`](https://github.com/LedgerHQ/ledger-live/commit/e775c83ab7fa28b395c149d03679cdd93535b14a), [`2e5e37af96`](https://github.com/LedgerHQ/ledger-live/commit/2e5e37af96120b58fb56386cf77b6478cf06eed8), [`eeab77fba0`](https://github.com/LedgerHQ/ledger-live/commit/eeab77fba08eedc09dc28780f1a4d270d90569e7), [`3de79a2927`](https://github.com/LedgerHQ/ledger-live/commit/3de79a2927a1679ce4571f2c298cd404877cc49a), [`5dba98a39d`](https://github.com/LedgerHQ/ledger-live/commit/5dba98a39de6765539f76446613f1a90ddb743d5), [`7901608c80`](https://github.com/LedgerHQ/ledger-live/commit/7901608c80343abb271cce495fce673c544e6330), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`03896700ca`](https://github.com/LedgerHQ/ledger-live/commit/03896700ca019b5a0b6a2d68b49abb80e47d3d02), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22), [`37c4e845c3`](https://github.com/LedgerHQ/ledger-live/commit/37c4e845c3f821760a67c56bdbfa09f45f736c78), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`cd00fe93c5`](https://github.com/LedgerHQ/ledger-live/commit/cd00fe93c599dfd8d71c49adf538c0c8fd2e4280), [`9428e776cd`](https://github.com/LedgerHQ/ledger-live/commit/9428e776cd2f42f08472ab53a3c050d00a93b31c), [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4)]:
  - @ledgerhq/live-common@31.4.0-next.0
  - @ledgerhq/live-env@0.4.1-next.0
  - @ledgerhq/native-ui@0.20.3-next.0
  - @ledgerhq/types-cryptoassets@7.4.0-next.0
  - @ledgerhq/types-live@6.38.0-next.0
  - @ledgerhq/coin-evm@0.5.0-next.0
  - @ledgerhq/coin-framework@0.5.0-next.0
  - @ledgerhq/evm-tools@1.0.3-next.0
  - @ledgerhq/errors@6.13.1-next.0
  - @ledgerhq/domain-service@1.1.7-next.0
  - @ledgerhq/devices@8.0.6-next.0
  - @ledgerhq/hw-transport@6.28.7-next.0
  - @ledgerhq/hw-transport-http@6.28.2-next.0
  - @ledgerhq/react-native-hid@6.29.6-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.4-next.0

## 3.27.1

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/evm-tools@1.0.2
  - @ledgerhq/live-common@31.3.1

## 3.27.1-hotfix.0

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/evm-tools@1.0.2-hotfix.0
  - @ledgerhq/live-common@31.3.1-hotfix.0

## 3.27.0

### Minor Changes

- [#3843](https://github.com/LedgerHQ/ledger-live/pull/3843) [`96322128d8`](https://github.com/LedgerHQ/ledger-live/commit/96322128d8e4fffd0eea384e4f787c9e26e9fbac) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover llm stax

- [#3459](https://github.com/LedgerHQ/ledger-live/pull/3459) [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to stacks blockchain

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update SignMessage logic to be simpler, with improved typing.

- [#3692](https://github.com/LedgerHQ/ledger-live/pull/3692) [`be437fa19f`](https://github.com/LedgerHQ/ledger-live/commit/be437fa19ff8c0557fe426fc8a174445fbee0f7a) Thanks [@cksanders](https://github.com/cksanders)! - Add DEX providers to SWAP

- [#3867](https://github.com/LedgerHQ/ledger-live/pull/3867) [`f5e05ef9f1`](https://github.com/LedgerHQ/ledger-live/commit/f5e05ef9f1598fca8d62cc91265ff41e18fb4e71) Thanks [@henri-ly](https://github.com/henri-ly)! - change polkadot react icon to identicon

- [#2499](https://github.com/LedgerHQ/ledger-live/pull/2499) [`9d2382c84b`](https://github.com/LedgerHQ/ledger-live/commit/9d2382c84bae333b81fe67158da1e0199e2b828b) Thanks [@lvndry](https://github.com/lvndry)! - Users can cancel and speedup ethereum transactions

- [#3815](https://github.com/LedgerHQ/ledger-live/pull/3815) [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Support for Internet Computer blockchain

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for NFT w/ the EVM family

- [#3949](https://github.com/LedgerHQ/ledger-live/pull/3949) [`16d29e18ee`](https://github.com/LedgerHQ/ledger-live/commit/16d29e18eef21009ba384f15f495c92b2028b4c4) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add timeout and timeoutErrorMessage params to useSwapTransaction

- [#3825](https://github.com/LedgerHQ/ledger-live/pull/3825) [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Cosmos chains : stargaze, desmos, umee, secret network

### Patch Changes

- [#3877](https://github.com/LedgerHQ/ledger-live/pull/3877) [`57088d976b`](https://github.com/LedgerHQ/ledger-live/commit/57088d976b8679d4a5406022c37400a9d2c011e8) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - feat: add feature flag to tracking

- [#3706](https://github.com/LedgerHQ/ledger-live/pull/3706) [`8334b5ccc9`](https://github.com/LedgerHQ/ledger-live/commit/8334b5ccc9d266bbc8ae96ef1de61d7f78a213d8) Thanks [@mderrick](https://github.com/mderrick)! - add nft image viewer pan and zoom

- [#4024](https://github.com/LedgerHQ/ledger-live/pull/4024) [`d51bf94843`](https://github.com/LedgerHQ/ledger-live/commit/d51bf9484357aaaab93491fe392fbe74a57d6cdf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix wrong `shouldSkipAmount` in general send flow

- [#3614](https://github.com/LedgerHQ/ledger-live/pull/3614) [`c352c557f8`](https://github.com/LedgerHQ/ledger-live/commit/c352c557f8b39b8c03f13332b557690006615fb2) Thanks [@grsoares21](https://github.com/grsoares21)! - Small modifications to the wording on the restore steps of the new firmware update UX.

- [#3736](https://github.com/LedgerHQ/ledger-live/pull/3736) [`a31cbf1f4a`](https://github.com/LedgerHQ/ledger-live/commit/a31cbf1f4ab8068f8518cc90731b49f9fad5f7fc) Thanks [@mderrick](https://github.com/mderrick)! - add nft detail view background

- [#3812](https://github.com/LedgerHQ/ledger-live/pull/3812) [`dc2b1db53a`](https://github.com/LedgerHQ/ledger-live/commit/dc2b1db53adbd65cc06a3c5de02251ee10d16d25) Thanks [@mderrick](https://github.com/mderrick)! - add nft gallery scroll to top button

- [#3852](https://github.com/LedgerHQ/ledger-live/pull/3852) [`dab136d518`](https://github.com/LedgerHQ/ledger-live/commit/dab136d5188ba87afe1511a1537590009c83db4e) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Aligned UI of pairing flow + wording change

- [#3862](https://github.com/LedgerHQ/ledger-live/pull/3862) [`dd3d108c1b`](https://github.com/LedgerHQ/ledger-live/commit/dd3d108c1b2e4fbf9942027307d04b433a0bcfdf) Thanks [@grsoares21](https://github.com/grsoares21)! - Make reloading of manager upon new connection specific to Bluetooth to USB transitions

- [#3813](https://github.com/LedgerHQ/ledger-live/pull/3813) [`ef39bc40f3`](https://github.com/LedgerHQ/ledger-live/commit/ef39bc40f3a1ad97d523ee93df0efbc9cb3d695d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - adjust wording on recover quiz

- [#3848](https://github.com/LedgerHQ/ledger-live/pull/3848) [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add debug setting to simulate LL having connected once to a Ledger Stax

- [#3831](https://github.com/LedgerHQ/ledger-live/pull/3831) [`04f63f0776`](https://github.com/LedgerHQ/ledger-live/commit/04f63f077647f9d77fe2c80ec62f872547ed332a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Fix no funds swap result

- [#3709](https://github.com/LedgerHQ/ledger-live/pull/3709) [`f474bc5631`](https://github.com/LedgerHQ/ledger-live/commit/f474bc56314a32b8b81453bf2c3c43959d42c3bd) Thanks [@grsoares21](https://github.com/grsoares21)! - Add retry possibility when an error happens during the firmware update

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding clone currencies of ethereum & polygon with the evm family for test purposes

- Updated dependencies [[`d0cfcbc6d7`](https://github.com/LedgerHQ/ledger-live/commit/d0cfcbc6d7ca4693bd9db9f3958d4fbbdd947865), [`9676e157b3`](https://github.com/LedgerHQ/ledger-live/commit/9676e157b3471ce43c9a283417c718ee11978ee4), [`d2c1b9ed8d`](https://github.com/LedgerHQ/ledger-live/commit/d2c1b9ed8d7dc3bacfc9c5020a4612693cd62272), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`96322128d8`](https://github.com/LedgerHQ/ledger-live/commit/96322128d8e4fffd0eea384e4f787c9e26e9fbac), [`f474bc5631`](https://github.com/LedgerHQ/ledger-live/commit/f474bc56314a32b8b81453bf2c3c43959d42c3bd), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`2292a285e0`](https://github.com/LedgerHQ/ledger-live/commit/2292a285e03d34951b57d778b0c3626e9b4aff17), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`194acaf3d7`](https://github.com/LedgerHQ/ledger-live/commit/194acaf3d7389727ace87206a45a39fd3a5e1f98), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`b68120562b`](https://github.com/LedgerHQ/ledger-live/commit/b68120562b99d6a19ffc4c9cc13ac49979bef3e8), [`04f63f0776`](https://github.com/LedgerHQ/ledger-live/commit/04f63f077647f9d77fe2c80ec62f872547ed332a), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`be437fa19f`](https://github.com/LedgerHQ/ledger-live/commit/be437fa19ff8c0557fe426fc8a174445fbee0f7a), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`23f26c0f80`](https://github.com/LedgerHQ/ledger-live/commit/23f26c0f8005f7accbbdd96909b858fbfc4719a0), [`16d29e18ee`](https://github.com/LedgerHQ/ledger-live/commit/16d29e18eef21009ba384f15f495c92b2028b4c4), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`ae9f327cc7`](https://github.com/LedgerHQ/ledger-live/commit/ae9f327cc7414d7f769704dd1cc83128c876d185), [`989707f00c`](https://github.com/LedgerHQ/ledger-live/commit/989707f00c76145cef924f3e5417894ee117080e)]:
  - @ledgerhq/live-common@31.3.0
  - @ledgerhq/live-env@0.4.0
  - @ledgerhq/coin-framework@0.4.0
  - @ledgerhq/errors@6.13.0
  - @ledgerhq/types-live@6.37.0
  - @ledgerhq/types-cryptoassets@7.3.1
  - @ledgerhq/evm-tools@1.0.1
  - @ledgerhq/domain-service@1.1.6
  - @ledgerhq/devices@8.0.5
  - @ledgerhq/hw-transport@6.28.6
  - @ledgerhq/hw-transport-http@6.28.1
  - @ledgerhq/react-native-hid@6.29.5
  - @ledgerhq/react-native-hw-transport-ble@6.29.3
  - @ledgerhq/native-ui@0.20.2

## 3.27.0-next.2

### Patch Changes

- [#4024](https://github.com/LedgerHQ/ledger-live/pull/4024) [`d51bf94843`](https://github.com/LedgerHQ/ledger-live/commit/d51bf9484357aaaab93491fe392fbe74a57d6cdf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix wrong `shouldSkipAmount` in general send flow

## 3.27.0-next.1

### Patch Changes

- Updated dependencies [[`23f26c0f80`](https://github.com/LedgerHQ/ledger-live/commit/23f26c0f8005f7accbbdd96909b858fbfc4719a0)]:
  - @ledgerhq/live-common@31.3.0-next.1

## 3.27.0-next.0

### Minor Changes

- [#3843](https://github.com/LedgerHQ/ledger-live/pull/3843) [`96322128d8`](https://github.com/LedgerHQ/ledger-live/commit/96322128d8e4fffd0eea384e4f787c9e26e9fbac) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover llm stax

- [#3459](https://github.com/LedgerHQ/ledger-live/pull/3459) [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to stacks blockchain

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update SignMessage logic to be simpler, with improved typing.

- [#3692](https://github.com/LedgerHQ/ledger-live/pull/3692) [`be437fa19f`](https://github.com/LedgerHQ/ledger-live/commit/be437fa19ff8c0557fe426fc8a174445fbee0f7a) Thanks [@cksanders](https://github.com/cksanders)! - Add DEX providers to SWAP

- [#3867](https://github.com/LedgerHQ/ledger-live/pull/3867) [`f5e05ef9f1`](https://github.com/LedgerHQ/ledger-live/commit/f5e05ef9f1598fca8d62cc91265ff41e18fb4e71) Thanks [@henri-ly](https://github.com/henri-ly)! - change polkadot react icon to identicon

- [#2499](https://github.com/LedgerHQ/ledger-live/pull/2499) [`9d2382c84b`](https://github.com/LedgerHQ/ledger-live/commit/9d2382c84bae333b81fe67158da1e0199e2b828b) Thanks [@lvndry](https://github.com/lvndry)! - Users can cancel and speedup ethereum transactions

- [#3815](https://github.com/LedgerHQ/ledger-live/pull/3815) [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Support for Internet Computer blockchain

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for NFT w/ the EVM family

- [#3949](https://github.com/LedgerHQ/ledger-live/pull/3949) [`16d29e18ee`](https://github.com/LedgerHQ/ledger-live/commit/16d29e18eef21009ba384f15f495c92b2028b4c4) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add timeout and timeoutErrorMessage params to useSwapTransaction

- [#3825](https://github.com/LedgerHQ/ledger-live/pull/3825) [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Cosmos chains : stargaze, desmos, umee, secret network

### Patch Changes

- [#3877](https://github.com/LedgerHQ/ledger-live/pull/3877) [`57088d976b`](https://github.com/LedgerHQ/ledger-live/commit/57088d976b8679d4a5406022c37400a9d2c011e8) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - feat: add feature flag to tracking

- [#3706](https://github.com/LedgerHQ/ledger-live/pull/3706) [`8334b5ccc9`](https://github.com/LedgerHQ/ledger-live/commit/8334b5ccc9d266bbc8ae96ef1de61d7f78a213d8) Thanks [@mderrick](https://github.com/mderrick)! - add nft image viewer pan and zoom

- [#3614](https://github.com/LedgerHQ/ledger-live/pull/3614) [`c352c557f8`](https://github.com/LedgerHQ/ledger-live/commit/c352c557f8b39b8c03f13332b557690006615fb2) Thanks [@grsoares21](https://github.com/grsoares21)! - Small modifications to the wording on the restore steps of the new firmware update UX.

- [#3736](https://github.com/LedgerHQ/ledger-live/pull/3736) [`a31cbf1f4a`](https://github.com/LedgerHQ/ledger-live/commit/a31cbf1f4ab8068f8518cc90731b49f9fad5f7fc) Thanks [@mderrick](https://github.com/mderrick)! - add nft detail view background

- [#3812](https://github.com/LedgerHQ/ledger-live/pull/3812) [`dc2b1db53a`](https://github.com/LedgerHQ/ledger-live/commit/dc2b1db53adbd65cc06a3c5de02251ee10d16d25) Thanks [@mderrick](https://github.com/mderrick)! - add nft gallery scroll to top button

- [#3852](https://github.com/LedgerHQ/ledger-live/pull/3852) [`dab136d518`](https://github.com/LedgerHQ/ledger-live/commit/dab136d5188ba87afe1511a1537590009c83db4e) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Aligned UI of pairing flow + wording change

- [#3862](https://github.com/LedgerHQ/ledger-live/pull/3862) [`dd3d108c1b`](https://github.com/LedgerHQ/ledger-live/commit/dd3d108c1b2e4fbf9942027307d04b433a0bcfdf) Thanks [@grsoares21](https://github.com/grsoares21)! - Make reloading of manager upon new connection specific to Bluetooth to USB transitions

- [#3813](https://github.com/LedgerHQ/ledger-live/pull/3813) [`ef39bc40f3`](https://github.com/LedgerHQ/ledger-live/commit/ef39bc40f3a1ad97d523ee93df0efbc9cb3d695d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - adjust wording on recover quiz

- [#3848](https://github.com/LedgerHQ/ledger-live/pull/3848) [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add debug setting to simulate LL having connected once to a Ledger Stax

- [#3831](https://github.com/LedgerHQ/ledger-live/pull/3831) [`04f63f0776`](https://github.com/LedgerHQ/ledger-live/commit/04f63f077647f9d77fe2c80ec62f872547ed332a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Fix no funds swap result

- [#3709](https://github.com/LedgerHQ/ledger-live/pull/3709) [`f474bc5631`](https://github.com/LedgerHQ/ledger-live/commit/f474bc56314a32b8b81453bf2c3c43959d42c3bd) Thanks [@grsoares21](https://github.com/grsoares21)! - Add retry possibility when an error happens during the firmware update

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding clone currencies of ethereum & polygon with the evm family for test purposes

- Updated dependencies [[`d0cfcbc6d7`](https://github.com/LedgerHQ/ledger-live/commit/d0cfcbc6d7ca4693bd9db9f3958d4fbbdd947865), [`9676e157b3`](https://github.com/LedgerHQ/ledger-live/commit/9676e157b3471ce43c9a283417c718ee11978ee4), [`d2c1b9ed8d`](https://github.com/LedgerHQ/ledger-live/commit/d2c1b9ed8d7dc3bacfc9c5020a4612693cd62272), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`96322128d8`](https://github.com/LedgerHQ/ledger-live/commit/96322128d8e4fffd0eea384e4f787c9e26e9fbac), [`f474bc5631`](https://github.com/LedgerHQ/ledger-live/commit/f474bc56314a32b8b81453bf2c3c43959d42c3bd), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`2292a285e0`](https://github.com/LedgerHQ/ledger-live/commit/2292a285e03d34951b57d778b0c3626e9b4aff17), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`194acaf3d7`](https://github.com/LedgerHQ/ledger-live/commit/194acaf3d7389727ace87206a45a39fd3a5e1f98), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`b68120562b`](https://github.com/LedgerHQ/ledger-live/commit/b68120562b99d6a19ffc4c9cc13ac49979bef3e8), [`04f63f0776`](https://github.com/LedgerHQ/ledger-live/commit/04f63f077647f9d77fe2c80ec62f872547ed332a), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`be437fa19f`](https://github.com/LedgerHQ/ledger-live/commit/be437fa19ff8c0557fe426fc8a174445fbee0f7a), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`16d29e18ee`](https://github.com/LedgerHQ/ledger-live/commit/16d29e18eef21009ba384f15f495c92b2028b4c4), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`ae9f327cc7`](https://github.com/LedgerHQ/ledger-live/commit/ae9f327cc7414d7f769704dd1cc83128c876d185), [`989707f00c`](https://github.com/LedgerHQ/ledger-live/commit/989707f00c76145cef924f3e5417894ee117080e)]:
  - @ledgerhq/live-common@31.3.0-next.0
  - @ledgerhq/live-env@0.4.0-next.0
  - @ledgerhq/coin-framework@0.4.0-next.0
  - @ledgerhq/errors@6.13.0-next.0
  - @ledgerhq/types-live@6.37.0-next.0
  - @ledgerhq/types-cryptoassets@7.3.1-next.0
  - @ledgerhq/evm-tools@1.0.1-next.0
  - @ledgerhq/domain-service@1.1.6-next.0
  - @ledgerhq/devices@8.0.5-next.0
  - @ledgerhq/hw-transport@6.28.6-next.0
  - @ledgerhq/hw-transport-http@6.28.1-next.0
  - @ledgerhq/react-native-hid@6.29.5-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.3-next.0
  - @ledgerhq/native-ui@0.20.2-next.0

## 3.26.0

### Minor Changes

- [#3708](https://github.com/LedgerHQ/ledger-live/pull/3708) [`bdd99894e6`](https://github.com/LedgerHQ/ledger-live/commit/bdd99894e6b4f746f3570b757c7c8da8818e1dbd) Thanks [@henri-ly](https://github.com/henri-ly)! - Change network fees label to max network fees for eth

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - New Onboarding UI/UX with new Device Selection flow

- [#3682](https://github.com/LedgerHQ/ledger-live/pull/3682) [`4f77456c28`](https://github.com/LedgerHQ/ledger-live/commit/4f77456c2841972e924dd9cc667abca4f31771b4) Thanks [@RamyEB](https://github.com/RamyEB)! - rewording llm discoverv2

### Patch Changes

- [#3700](https://github.com/LedgerHQ/ledger-live/pull/3700) [`0532575351`](https://github.com/LedgerHQ/ledger-live/commit/0532575351ac661442f1ae77f454bf2ef10e4b93) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Support token accounts in request account method on mobile

- [#3685](https://github.com/LedgerHQ/ledger-live/pull/3685) [`b9789822fb`](https://github.com/LedgerHQ/ledger-live/commit/b9789822fb4adbb0949aa02ce4fe40f4f3601881) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Tracking for new OS update flow on LLM

  - Implemented the preview of the restored custom lock screen picture in the OS update flow

- [#3663](https://github.com/LedgerHQ/ledger-live/pull/3663) [`db6988ce18`](https://github.com/LedgerHQ/ledger-live/commit/db6988ce185673a3c4764d613b0455e1ab0d902a) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: revert update of babel/core

  Reverting `babel/core` from v7.22.1 back to v7.21.0.
  This created issues on animations.
  For now a fixed version `babel/core` (`7.21.0`) is set.

- [#3665](https://github.com/LedgerHQ/ledger-live/pull/3665) [`553120a527`](https://github.com/LedgerHQ/ledger-live/commit/553120a52785ee7593c958850b59b56ba61d25d3) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Allows iOS to access discover screen via deeplink

- [#3694](https://github.com/LedgerHQ/ledger-live/pull/3694) [`67a937d143`](https://github.com/LedgerHQ/ledger-live/commit/67a937d1434afb59405ad41adf4f15ff6a493bcf) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: fix uncaught error in useCenteredImage
  Custom lock screen: fix NFT picture preview not loading

- [#3596](https://github.com/LedgerHQ/ledger-live/pull/3596) [`731f111e08`](https://github.com/LedgerHQ/ledger-live/commit/731f111e08bc9c07b664226dda1968b28ea59cee) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the manager redirection after the new firmware update flow

- [#3570](https://github.com/LedgerHQ/ledger-live/pull/3570) [`c50592bd22`](https://github.com/LedgerHQ/ledger-live/commit/c50592bd22a8c8a4fe026b83e2207c670ab38a1f) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix potential USB-only restriction bypass for firmware update on unsupported devices.

- [#3739](https://github.com/LedgerHQ/ledger-live/pull/3739) [`1d54060e13`](https://github.com/LedgerHQ/ledger-live/commit/1d54060e13c2d5e0e65e92c2563130119eb9b6ff) Thanks [@cksanders](https://github.com/cksanders)! - Fix flickering in header by removing buggy onLoadProgress hook

- [#3828](https://github.com/LedgerHQ/ledger-live/pull/3828) [`32e3d60144`](https://github.com/LedgerHQ/ledger-live/commit/32e3d60144d3e6afebcffd87400c6cb1c10aeb67) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Fix discover catalog visibility and ordering

- [#3621](https://github.com/LedgerHQ/ledger-live/pull/3621) [`113a694a0e`](https://github.com/LedgerHQ/ledger-live/commit/113a694a0ebe4dc18eb5fbfd4c80887d34abf953) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: added documentation on sync onboarding

- [#3693](https://github.com/LedgerHQ/ledger-live/pull/3693) [`bd2c412c30`](https://github.com/LedgerHQ/ledger-live/commit/bd2c412c3017170bed477cac5e667b923c3b786e) Thanks [@mderrick](https://github.com/mderrick)! - fix android crashing when using navigation on nft gallery page

- [#3593](https://github.com/LedgerHQ/ledger-live/pull/3593) [`2444f6f090`](https://github.com/LedgerHQ/ledger-live/commit/2444f6f09070f8346d6441de54b1ea00e41cc6fb) Thanks [@grsoares21](https://github.com/grsoares21)! - Add info drawer when users deny a settings restore step during the firmware update allowing them to retry or skip the restore step.

- [#3846](https://github.com/LedgerHQ/ledger-live/pull/3846) [`85169ecac7`](https://github.com/LedgerHQ/ledger-live/commit/85169ecac7ac68ebe35dbb37e3679f68774c12c3) Thanks [@grsoares21](https://github.com/grsoares21)! - Make reloading of manager upon new connection specific to Bluetooth to USB transitions

- [#3767](https://github.com/LedgerHQ/ledger-live/pull/3767) [`42f64359c5`](https://github.com/LedgerHQ/ledger-live/commit/42f64359c5554d66529091070185b7ab43d33d21) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove critical error on navigation

- [#3777](https://github.com/LedgerHQ/ledger-live/pull/3777) [`2e025f84d1`](https://github.com/LedgerHQ/ledger-live/commit/2e025f84d18d21a5cf1b9af1f3574230e2cdcdbb) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - hide referral banner when feature flag is disabled

- [#3696](https://github.com/LedgerHQ/ledger-live/pull/3696) [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow to enable listAppsV2 via feature flags instead of experimental settings

- [#3780](https://github.com/LedgerHQ/ledger-live/pull/3780) [`edbe50ccff`](https://github.com/LedgerHQ/ledger-live/commit/edbe50ccffe4f569d408818707dc3311d77cbb25) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Fix crash on selecting from account in swap form

- [#3739](https://github.com/LedgerHQ/ledger-live/pull/3739) [`1d54060e13`](https://github.com/LedgerHQ/ledger-live/commit/1d54060e13c2d5e0e65e92c2563130119eb9b6ff) Thanks [@cksanders](https://github.com/cksanders)! - Add loading spinner when navigating between web pages in WebPTXPLayer

- [#3759](https://github.com/LedgerHQ/ledger-live/pull/3759) [`2c8e294006`](https://github.com/LedgerHQ/ledger-live/commit/2c8e294006937ca0cbdb1b183f323870544c92b4) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - My Ledger: add tracking in device selection screen

- [#3871](https://github.com/LedgerHQ/ledger-live/pull/3871) [`2103cef1c8`](https://github.com/LedgerHQ/ledger-live/commit/2103cef1c8fc05d4ec31445dc44242d4534ca41c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Icons alignment on new Onboarding flow

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Revamp Onboarding LLM

- [#3707](https://github.com/LedgerHQ/ledger-live/pull/3707) [`7ae4766e09`](https://github.com/LedgerHQ/ledger-live/commit/7ae4766e094d928f58e820319a33900b88a67502) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update the CLS icon for LLM

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9), [`32e3d60144`](https://github.com/LedgerHQ/ledger-live/commit/32e3d60144d3e6afebcffd87400c6cb1c10aeb67), [`8df4c0a0dc`](https://github.com/LedgerHQ/ledger-live/commit/8df4c0a0dcf1e2ff51dc49403f3a3c377ae272a8), [`e8b94aab79`](https://github.com/LedgerHQ/ledger-live/commit/e8b94aab79736d1ca4e81005ae9a8978e23cf0d5), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`e4bd3297cf`](https://github.com/LedgerHQ/ledger-live/commit/e4bd3297cf1064faa04935c2e35455e06ed88e9e), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39), [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`ea8e24732f`](https://github.com/LedgerHQ/ledger-live/commit/ea8e24732f44a9315eb5a27077cd9d34b6c408b4), [`500e36a789`](https://github.com/LedgerHQ/ledger-live/commit/500e36a789b34125164433fbd03c00305669ee4d), [`42d99e6c65`](https://github.com/LedgerHQ/ledger-live/commit/42d99e6c659845b4893173af2ccbad4b098e2c15), [`cc31fc9213`](https://github.com/LedgerHQ/ledger-live/commit/cc31fc9213dc2e3e751b63a7722207dc711bbe3d), [`88063df9d6`](https://github.com/LedgerHQ/ledger-live/commit/88063df9d6046c78c32258ea95cd527cda9214d5), [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312), [`7719cbf508`](https://github.com/LedgerHQ/ledger-live/commit/7719cbf5087a44aefa3fc66e7a28c69ba7687bcc), [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312)]:
  - @ledgerhq/live-common@31.2.0
  - @ledgerhq/domain-service@1.1.5
  - @ledgerhq/types-live@6.36.0
  - @ledgerhq/types-cryptoassets@7.3.0
  - @ledgerhq/live-env@0.3.1
  - @ledgerhq/hw-transport-http@6.28.0
  - @ledgerhq/native-ui@0.20.1
  - @ledgerhq/react-native-hw-transport-ble@6.29.2
  - @ledgerhq/coin-framework@0.3.7

## 3.26.0-next.4

### Patch Changes

- Updated dependencies [[`8df4c0a0dc`](https://github.com/LedgerHQ/ledger-live/commit/8df4c0a0dcf1e2ff51dc49403f3a3c377ae272a8)]:
  - @ledgerhq/live-common@31.2.0-next.2

## 3.26.0-next.3

### Patch Changes

- [#3871](https://github.com/LedgerHQ/ledger-live/pull/3871) [`2103cef1c8`](https://github.com/LedgerHQ/ledger-live/commit/2103cef1c8fc05d4ec31445dc44242d4534ca41c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Icons alignment on new Onboarding flow

## 3.26.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@31.2.0-next.1

## 3.26.0-next.1

### Patch Changes

- [#3846](https://github.com/LedgerHQ/ledger-live/pull/3846) [`85169ecac7`](https://github.com/LedgerHQ/ledger-live/commit/85169ecac7ac68ebe35dbb37e3679f68774c12c3) Thanks [@grsoares21](https://github.com/grsoares21)! - Make reloading of manager upon new connection specific to Bluetooth to USB transitions

## 3.26.0-next.0

### Minor Changes

- [#3708](https://github.com/LedgerHQ/ledger-live/pull/3708) [`bdd99894e6`](https://github.com/LedgerHQ/ledger-live/commit/bdd99894e6b4f746f3570b757c7c8da8818e1dbd) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change network fees label to max network fees for eth

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - New Onboarding UI/UX with new Device Selection flow

- [#3682](https://github.com/LedgerHQ/ledger-live/pull/3682) [`4f77456c28`](https://github.com/LedgerHQ/ledger-live/commit/4f77456c2841972e924dd9cc667abca4f31771b4) Thanks [@RamyEB](https://github.com/RamyEB)! - rewording llm discoverv2

### Patch Changes

- [#3700](https://github.com/LedgerHQ/ledger-live/pull/3700) [`0532575351`](https://github.com/LedgerHQ/ledger-live/commit/0532575351ac661442f1ae77f454bf2ef10e4b93) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Support token accounts in request account method on mobile

- [#3685](https://github.com/LedgerHQ/ledger-live/pull/3685) [`b9789822fb`](https://github.com/LedgerHQ/ledger-live/commit/b9789822fb4adbb0949aa02ce4fe40f4f3601881) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Tracking for new OS update flow on LLM

  - Implemented the preview of the restored custom lock screen picture in the OS update flow

- [#3663](https://github.com/LedgerHQ/ledger-live/pull/3663) [`db6988ce18`](https://github.com/LedgerHQ/ledger-live/commit/db6988ce185673a3c4764d613b0455e1ab0d902a) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: revert update of babel/core

  Reverting `babel/core` from v7.22.1 back to v7.21.0.
  This created issues on animations.
  For now a fixed version `babel/core` (`7.21.0`) is set.

- [#3665](https://github.com/LedgerHQ/ledger-live/pull/3665) [`553120a527`](https://github.com/LedgerHQ/ledger-live/commit/553120a52785ee7593c958850b59b56ba61d25d3) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Allows iOS to access discover screen via deeplink

- [#3694](https://github.com/LedgerHQ/ledger-live/pull/3694) [`67a937d143`](https://github.com/LedgerHQ/ledger-live/commit/67a937d1434afb59405ad41adf4f15ff6a493bcf) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: fix uncaught error in useCenteredImage
  Custom lock screen: fix NFT picture preview not loading

- [#3596](https://github.com/LedgerHQ/ledger-live/pull/3596) [`731f111e08`](https://github.com/LedgerHQ/ledger-live/commit/731f111e08bc9c07b664226dda1968b28ea59cee) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the manager redirection after the new firmware update flow

- [#3570](https://github.com/LedgerHQ/ledger-live/pull/3570) [`c50592bd22`](https://github.com/LedgerHQ/ledger-live/commit/c50592bd22a8c8a4fe026b83e2207c670ab38a1f) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix potential USB-only restriction bypass for firmware update on unsupported devices.

- [#3739](https://github.com/LedgerHQ/ledger-live/pull/3739) [`1d54060e13`](https://github.com/LedgerHQ/ledger-live/commit/1d54060e13c2d5e0e65e92c2563130119eb9b6ff) Thanks [@cksanders](https://github.com/cksanders)! - Fix flickering in header by removing buggy onLoadProgress hook

- [#3828](https://github.com/LedgerHQ/ledger-live/pull/3828) [`32e3d60144`](https://github.com/LedgerHQ/ledger-live/commit/32e3d60144d3e6afebcffd87400c6cb1c10aeb67) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Fix discover catalog visibility and ordering

- [#3621](https://github.com/LedgerHQ/ledger-live/pull/3621) [`113a694a0e`](https://github.com/LedgerHQ/ledger-live/commit/113a694a0ebe4dc18eb5fbfd4c80887d34abf953) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: added documentation on sync onboarding

- [#3693](https://github.com/LedgerHQ/ledger-live/pull/3693) [`bd2c412c30`](https://github.com/LedgerHQ/ledger-live/commit/bd2c412c3017170bed477cac5e667b923c3b786e) Thanks [@mderrick](https://github.com/mderrick)! - fix android crashing when using navigation on nft gallery page

- [#3593](https://github.com/LedgerHQ/ledger-live/pull/3593) [`2444f6f090`](https://github.com/LedgerHQ/ledger-live/commit/2444f6f09070f8346d6441de54b1ea00e41cc6fb) Thanks [@grsoares21](https://github.com/grsoares21)! - Add info drawer when users deny a settings restore step during the firmware update allowing them to retry or skip the restore step.

- [#3767](https://github.com/LedgerHQ/ledger-live/pull/3767) [`42f64359c5`](https://github.com/LedgerHQ/ledger-live/commit/42f64359c5554d66529091070185b7ab43d33d21) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove critical error on navigation

- [#3777](https://github.com/LedgerHQ/ledger-live/pull/3777) [`2e025f84d1`](https://github.com/LedgerHQ/ledger-live/commit/2e025f84d18d21a5cf1b9af1f3574230e2cdcdbb) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - hide referral banner when feature flag is disabled

- [#3696](https://github.com/LedgerHQ/ledger-live/pull/3696) [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow to enable listAppsV2 via feature flags instead of experimental settings

- [#3780](https://github.com/LedgerHQ/ledger-live/pull/3780) [`edbe50ccff`](https://github.com/LedgerHQ/ledger-live/commit/edbe50ccffe4f569d408818707dc3311d77cbb25) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Fix crash on selecting from account in swap form

- [#3739](https://github.com/LedgerHQ/ledger-live/pull/3739) [`1d54060e13`](https://github.com/LedgerHQ/ledger-live/commit/1d54060e13c2d5e0e65e92c2563130119eb9b6ff) Thanks [@cksanders](https://github.com/cksanders)! - Add loading spinner when navigating between web pages in WebPTXPLayer

- [#3759](https://github.com/LedgerHQ/ledger-live/pull/3759) [`2c8e294006`](https://github.com/LedgerHQ/ledger-live/commit/2c8e294006937ca0cbdb1b183f323870544c92b4) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - My Ledger: add tracking in device selection screen

- [#3659](https://github.com/LedgerHQ/ledger-live/pull/3659) [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Revamp Onboarding LLM

- [#3707](https://github.com/LedgerHQ/ledger-live/pull/3707) [`7ae4766e09`](https://github.com/LedgerHQ/ledger-live/commit/7ae4766e094d928f58e820319a33900b88a67502) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update the CLS icon for LLM

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9), [`32e3d60144`](https://github.com/LedgerHQ/ledger-live/commit/32e3d60144d3e6afebcffd87400c6cb1c10aeb67), [`e8b94aab79`](https://github.com/LedgerHQ/ledger-live/commit/e8b94aab79736d1ca4e81005ae9a8978e23cf0d5), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`e4bd3297cf`](https://github.com/LedgerHQ/ledger-live/commit/e4bd3297cf1064faa04935c2e35455e06ed88e9e), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39), [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`ea8e24732f`](https://github.com/LedgerHQ/ledger-live/commit/ea8e24732f44a9315eb5a27077cd9d34b6c408b4), [`500e36a789`](https://github.com/LedgerHQ/ledger-live/commit/500e36a789b34125164433fbd03c00305669ee4d), [`42d99e6c65`](https://github.com/LedgerHQ/ledger-live/commit/42d99e6c659845b4893173af2ccbad4b098e2c15), [`cc31fc9213`](https://github.com/LedgerHQ/ledger-live/commit/cc31fc9213dc2e3e751b63a7722207dc711bbe3d), [`88063df9d6`](https://github.com/LedgerHQ/ledger-live/commit/88063df9d6046c78c32258ea95cd527cda9214d5), [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312), [`7719cbf508`](https://github.com/LedgerHQ/ledger-live/commit/7719cbf5087a44aefa3fc66e7a28c69ba7687bcc), [`c7168de9e2`](https://github.com/LedgerHQ/ledger-live/commit/c7168de9e270c4ee9444c9eadefd6f5549fa0312)]:
  - @ledgerhq/live-common@31.2.0-next.0
  - @ledgerhq/domain-service@1.1.5-next.0
  - @ledgerhq/types-live@6.36.0-next.0
  - @ledgerhq/types-cryptoassets@7.3.0-next.0
  - @ledgerhq/live-env@0.3.1-next.0
  - @ledgerhq/hw-transport-http@6.28.0-next.0
  - @ledgerhq/native-ui@0.20.1-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.2-next.0
  - @ledgerhq/coin-framework@0.3.7-next.0

## 3.25.0

### Minor Changes

- [#3526](https://github.com/LedgerHQ/ledger-live/pull/3526) [`15f299aceb`](https://github.com/LedgerHQ/ledger-live/commit/15f299acebf1d6629b2cb91e0152f0d2f3fb4868) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Introduce eth staking modals on asset, market detail and account screens

### Patch Changes

- [#3528](https://github.com/LedgerHQ/ledger-live/pull/3528) [`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve the image removal flow for Stax

- [#3519](https://github.com/LedgerHQ/ledger-live/pull/3519) [`927201ec77`](https://github.com/LedgerHQ/ledger-live/commit/927201ec77da1daaca99872cc9812c7084381f83) Thanks [@mderrick](https://github.com/mderrick)! - LIVE-4142 added empty state and hide NFT Detox tests

- [#3601](https://github.com/LedgerHQ/ledger-live/pull/3601) [`c8a673c9e0`](https://github.com/LedgerHQ/ledger-live/commit/c8a673c9e069822cf59194b9b526aeebaf915d5a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Memoize requests for device actions to prevent rendering loops

- [#3572](https://github.com/LedgerHQ/ledger-live/pull/3572) [`9d8ba397f2`](https://github.com/LedgerHQ/ledger-live/commit/9d8ba397f27e58443cb8ea35bc95c97ec0e152d7) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add sol and cosmos staking_completed track

- [#3607](https://github.com/LedgerHQ/ledger-live/pull/3607) [`d7e9975868`](https://github.com/LedgerHQ/ledger-live/commit/d7e9975868b13f07a6b295df054fd0b79e696151) Thanks [@cksanders](https://github.com/cksanders)! - Fix regression on Select Account onSuccess LLM

- [#3497](https://github.com/LedgerHQ/ledger-live/pull/3497) [`aaa84e8d64`](https://github.com/LedgerHQ/ledger-live/commit/aaa84e8d64ad8b76c1fe791092e533054fc038ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new architecture for the sync onboarding with the early security check

  Implementing the new architecture on LLM for the sync onboarding:

  - a new SyncOnboardingCompanion component getting (almost) all the logic that existed directly in the screen
  - an empty EarlySecurityCheck component that directly notifies (for now) that everything is good
  - a screen that orchestrate which of the 2 components should be rendered by checking the onboarding state of the device, and calling the new device action toggleOnboardingEarlyCheckAction when needed

- [#3642](https://github.com/LedgerHQ/ledger-live/pull/3642) [`95f62f4af9`](https://github.com/LedgerHQ/ledger-live/commit/95f62f4af9668f8730f0b9431d81fd8949caceb2) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Add a property braze_external_user_id to identify events which is needed by braze with this exact name

- [#3483](https://github.com/LedgerHQ/ledger-live/pull/3483) [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e) Thanks [@gre](https://github.com/gre)! - use ledger currency id on Countervalues API usage.

- [#3543](https://github.com/LedgerHQ/ledger-live/pull/3543) [`870c838d57`](https://github.com/LedgerHQ/ledger-live/commit/870c838d57ecb829aae59eb46d17da8492eb6961) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add visual indicator of disabled state for flows while apps are being installed/uninstalled

- [#3498](https://github.com/LedgerHQ/ledger-live/pull/3498) [`1d39a6cbd4`](https://github.com/LedgerHQ/ledger-live/commit/1d39a6cbd4a5e1dcc848c4a3e33c68dd4b55c4c3) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Sync onboarding analytics: fix hardcoded event names

- [#3554](https://github.com/LedgerHQ/ledger-live/pull/3554) [`4cf8520b24`](https://github.com/LedgerHQ/ledger-live/commit/4cf8520b242c4510f4edc1fc668b9489313dec5e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: fix error handling in case of an error when loading an image from the phone gallery

- [#3538](https://github.com/LedgerHQ/ledger-live/pull/3538) [`8613959ec6`](https://github.com/LedgerHQ/ledger-live/commit/8613959ec64a6443329b0ad1712e5dc7f9bf0edc) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix non rendering lotties in CLS flows

- Updated dependencies [[`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492), [`81dd0c3ef3`](https://github.com/LedgerHQ/ledger-live/commit/81dd0c3ef38a3d6d69c27c65864bf1b41c52643c), [`b93f543a20`](https://github.com/LedgerHQ/ledger-live/commit/b93f543a207f35edbe25f3d609533120c9babbe1), [`3cf4397b60`](https://github.com/LedgerHQ/ledger-live/commit/3cf4397b60a2da5c1ee92cff42e9f979e30ad489), [`8f50c4d927`](https://github.com/LedgerHQ/ledger-live/commit/8f50c4d927f368fd869401b752a51ba7398e59e1), [`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`db1a6f92e1`](https://github.com/LedgerHQ/ledger-live/commit/db1a6f92e17dcd63b0c9fa6700496f5f4722f1e5), [`809065c571`](https://github.com/LedgerHQ/ledger-live/commit/809065c57198646a49adea112b9d799e35a57d25), [`66fdfef314`](https://github.com/LedgerHQ/ledger-live/commit/66fdfef314b6dd63cfd74f00c579138b900ee241), [`5bc987cd8f`](https://github.com/LedgerHQ/ledger-live/commit/5bc987cd8f850bb63e4ced62c28218d7c75744e8), [`42d8be7694`](https://github.com/LedgerHQ/ledger-live/commit/42d8be76949e258d6360a1fda3ca5a1df50c8bcb), [`ac205cce9f`](https://github.com/LedgerHQ/ledger-live/commit/ac205cce9f328165369c5c270681be1d7ba7d0f2)]:
  - @ledgerhq/live-common@31.1.0
  - @ledgerhq/errors@6.12.7
  - @ledgerhq/types-cryptoassets@7.2.1
  - @ledgerhq/types-live@6.35.1
  - @ledgerhq/coin-framework@0.3.6
  - @ledgerhq/domain-service@1.1.4
  - @ledgerhq/devices@8.0.4
  - @ledgerhq/hw-transport@6.28.5
  - @ledgerhq/hw-transport-http@6.27.16
  - @ledgerhq/react-native-hid@6.29.4
  - @ledgerhq/react-native-hw-transport-ble@6.29.1

## 3.25.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@31.1.0-next.1

## 3.25.0-next.0

### Minor Changes

- [#3526](https://github.com/LedgerHQ/ledger-live/pull/3526) [`15f299aceb`](https://github.com/LedgerHQ/ledger-live/commit/15f299acebf1d6629b2cb91e0152f0d2f3fb4868) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Introduce eth staking modals on asset, market detail and account screens

### Patch Changes

- [#3528](https://github.com/LedgerHQ/ledger-live/pull/3528) [`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve the image removal flow for Stax

- [#3519](https://github.com/LedgerHQ/ledger-live/pull/3519) [`927201ec77`](https://github.com/LedgerHQ/ledger-live/commit/927201ec77da1daaca99872cc9812c7084381f83) Thanks [@mderrick](https://github.com/mderrick)! - LIVE-4142 added empty state and hide NFT Detox tests

- [#3601](https://github.com/LedgerHQ/ledger-live/pull/3601) [`c8a673c9e0`](https://github.com/LedgerHQ/ledger-live/commit/c8a673c9e069822cf59194b9b526aeebaf915d5a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Memoize requests for device actions to prevent rendering loops

- [#3572](https://github.com/LedgerHQ/ledger-live/pull/3572) [`9d8ba397f2`](https://github.com/LedgerHQ/ledger-live/commit/9d8ba397f27e58443cb8ea35bc95c97ec0e152d7) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add sol and cosmos staking_completed track

- [#3607](https://github.com/LedgerHQ/ledger-live/pull/3607) [`d7e9975868`](https://github.com/LedgerHQ/ledger-live/commit/d7e9975868b13f07a6b295df054fd0b79e696151) Thanks [@cksanders](https://github.com/cksanders)! - Fix regression on Select Account onSuccess LLM

- [#3497](https://github.com/LedgerHQ/ledger-live/pull/3497) [`aaa84e8d64`](https://github.com/LedgerHQ/ledger-live/commit/aaa84e8d64ad8b76c1fe791092e533054fc038ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new architecture for the sync onboarding with the early security check

  Implementing the new architecture on LLM for the sync onboarding:

  - a new SyncOnboardingCompanion component getting (almost) all the logic that existed directly in the screen
  - an empty EarlySecurityCheck component that directly notifies (for now) that everything is good
  - a screen that orchestrate which of the 2 components should be rendered by checking the onboarding state of the device, and calling the new device action toggleOnboardingEarlyCheckAction when needed

- [#3642](https://github.com/LedgerHQ/ledger-live/pull/3642) [`95f62f4af9`](https://github.com/LedgerHQ/ledger-live/commit/95f62f4af9668f8730f0b9431d81fd8949caceb2) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Add a property braze_external_user_id to identify events which is needed by braze with this exact name

- [#3483](https://github.com/LedgerHQ/ledger-live/pull/3483) [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e) Thanks [@gre](https://github.com/gre)! - use ledger currency id on Countervalues API usage.

- [#3543](https://github.com/LedgerHQ/ledger-live/pull/3543) [`870c838d57`](https://github.com/LedgerHQ/ledger-live/commit/870c838d57ecb829aae59eb46d17da8492eb6961) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add visual indicator of disabled state for flows while apps are being installed/uninstalled

- [#3498](https://github.com/LedgerHQ/ledger-live/pull/3498) [`1d39a6cbd4`](https://github.com/LedgerHQ/ledger-live/commit/1d39a6cbd4a5e1dcc848c4a3e33c68dd4b55c4c3) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Sync onboarding analytics: fix hardcoded event names

- [#3554](https://github.com/LedgerHQ/ledger-live/pull/3554) [`4cf8520b24`](https://github.com/LedgerHQ/ledger-live/commit/4cf8520b242c4510f4edc1fc668b9489313dec5e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen: fix error handling in case of an error when loading an image from the phone gallery

- [#3538](https://github.com/LedgerHQ/ledger-live/pull/3538) [`8613959ec6`](https://github.com/LedgerHQ/ledger-live/commit/8613959ec64a6443329b0ad1712e5dc7f9bf0edc) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix non rendering lotties in CLS flows

- Updated dependencies [[`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492), [`81dd0c3ef3`](https://github.com/LedgerHQ/ledger-live/commit/81dd0c3ef38a3d6d69c27c65864bf1b41c52643c), [`b93f543a20`](https://github.com/LedgerHQ/ledger-live/commit/b93f543a207f35edbe25f3d609533120c9babbe1), [`3cf4397b60`](https://github.com/LedgerHQ/ledger-live/commit/3cf4397b60a2da5c1ee92cff42e9f979e30ad489), [`8f50c4d927`](https://github.com/LedgerHQ/ledger-live/commit/8f50c4d927f368fd869401b752a51ba7398e59e1), [`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`db1a6f92e1`](https://github.com/LedgerHQ/ledger-live/commit/db1a6f92e17dcd63b0c9fa6700496f5f4722f1e5), [`809065c571`](https://github.com/LedgerHQ/ledger-live/commit/809065c57198646a49adea112b9d799e35a57d25), [`66fdfef314`](https://github.com/LedgerHQ/ledger-live/commit/66fdfef314b6dd63cfd74f00c579138b900ee241), [`5bc987cd8f`](https://github.com/LedgerHQ/ledger-live/commit/5bc987cd8f850bb63e4ced62c28218d7c75744e8), [`42d8be7694`](https://github.com/LedgerHQ/ledger-live/commit/42d8be76949e258d6360a1fda3ca5a1df50c8bcb), [`ac205cce9f`](https://github.com/LedgerHQ/ledger-live/commit/ac205cce9f328165369c5c270681be1d7ba7d0f2)]:
  - @ledgerhq/live-common@31.1.0-next.0
  - @ledgerhq/errors@6.12.7-next.0
  - @ledgerhq/types-cryptoassets@7.2.1-next.0
  - @ledgerhq/types-live@6.35.1-next.0
  - @ledgerhq/coin-framework@0.3.6-next.0
  - @ledgerhq/domain-service@1.1.4-next.0
  - @ledgerhq/devices@8.0.4-next.0
  - @ledgerhq/hw-transport@6.28.5-next.0
  - @ledgerhq/hw-transport-http@6.27.16-next.0
  - @ledgerhq/react-native-hid@6.29.4-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.1-next.0

## 3.24.0

### Minor Changes

- [#3515](https://github.com/LedgerHQ/ledger-live/pull/3515) [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796) Thanks [@chabroA](https://github.com/chabroA)! - Use live-network package

- [#3468](https://github.com/LedgerHQ/ledger-live/pull/3468) [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c) Thanks [@RamyEB](https://github.com/RamyEB)! - Chnage api call + type

- [#3495](https://github.com/LedgerHQ/ledger-live/pull/3495) [`4d10718642`](https://github.com/LedgerHQ/ledger-live/commit/4d10718642799bfe665c28101942b1416231c898) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add network error view to WebPTXPlayer

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add restoration of apps step on the new firmware update UX

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add language restoration to the new firmware update UX

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add custom lock screen restore feature to the new firmware update UX

- [#3529](https://github.com/LedgerHQ/ledger-live/pull/3529) [`5d6aeab55c`](https://github.com/LedgerHQ/ledger-live/commit/5d6aeab55c275ab308b612a849ae2a758d64c83c) Thanks [@cpellizzari-ledger](https://github.com/cpellizzari-ledger)! - Fix: Binance.com redirection to browser perform authentication on iOS was not triggered

- [#3295](https://github.com/LedgerHQ/ledger-live/pull/3295) [`38d0d3cab9`](https://github.com/LedgerHQ/ledger-live/commit/38d0d3cab90d092580a8cca76b853dd0292d54c8) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Sign-in to Recover from LLM Welcome screen

- [#3477](https://github.com/LedgerHQ/ledger-live/pull/3477) [`53e6254926`](https://github.com/LedgerHQ/ledger-live/commit/53e62549269047a242985b5b000ab15372a7f2bd) Thanks [@marianasrv](https://github.com/marianasrv)! - update ui of modal "send function not available in ios"

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Implement new Firmware Update UX using the new DeviceSDK

### Patch Changes

- [#3397](https://github.com/LedgerHQ/ledger-live/pull/3397) [`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for more ESDT tokens

- [#3600](https://github.com/LedgerHQ/ledger-live/pull/3600) [`debf6215d0`](https://github.com/LedgerHQ/ledger-live/commit/debf6215d04c2337d9d2556ad123126a568f5c07) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Memoize requests for device actions to prevent rendering loops

- [#3441](https://github.com/LedgerHQ/ledger-live/pull/3441) [`499dee28bf`](https://github.com/LedgerHQ/ledger-live/commit/499dee28bf09c06d71cc9b5560ff6387edb04068) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed language switcher on Sync Onboardings (LLM & LLD)

- [#3478](https://github.com/LedgerHQ/ledger-live/pull/3478) [`9b68e8e543`](https://github.com/LedgerHQ/ledger-live/commit/9b68e8e5434e50c92dbd26590b6f10e0f8b21afb) Thanks [@YarnSh39](https://github.com/YarnSh39)! - updated the copy of the Success toast in NFT select. Also added by pass for connecting hardwallet device.

- [#3481](https://github.com/LedgerHQ/ledger-live/pull/3481) [`787c50f00e`](https://github.com/LedgerHQ/ledger-live/commit/787c50f00e12a2d5c46672243372bb2fde823e77) Thanks [@mderrick](https://github.com/mderrick)! - LIVE-5104 added receive nft flow Detox tests

- Updated dependencies [[`b574c30b2b`](https://github.com/LedgerHQ/ledger-live/commit/b574c30b2ba9ba49e12ab20ce1fd7c68c2220acf), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c), [`76699bc304`](https://github.com/LedgerHQ/ledger-live/commit/76699bc304204232b280984644a7c5709fdff063), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`eb258d57c2`](https://github.com/LedgerHQ/ledger-live/commit/eb258d57c2abd8d0db9154a82932e1fd83bfce9a), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`b40fa18379`](https://github.com/LedgerHQ/ledger-live/commit/b40fa18379bcadb56e8cbd902a299426d97e2345), [`f13bf2e2cc`](https://github.com/LedgerHQ/ledger-live/commit/f13bf2e2ccd1684692e1f641b66f0f3b4d457c2d), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`5c53afd2c2`](https://github.com/LedgerHQ/ledger-live/commit/5c53afd2c2a343c52f5bf36cc08f55c06f313eed)]:
  - @ledgerhq/live-common@31.0.0
  - @ledgerhq/native-ui@0.20.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.0
  - @ledgerhq/types-live@6.35.0
  - @ledgerhq/coin-framework@0.3.5
  - @ledgerhq/domain-service@1.1.3

## 3.24.0-next.3

### Patch Changes

- [#3600](https://github.com/LedgerHQ/ledger-live/pull/3600) [`debf6215d0`](https://github.com/LedgerHQ/ledger-live/commit/debf6215d04c2337d9d2556ad123126a568f5c07) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Memoize requests for device actions to prevent rendering loops

## 3.24.0-next.2

### Patch Changes

- Updated dependencies [[`5c53afd2c2`](https://github.com/LedgerHQ/ledger-live/commit/5c53afd2c2a343c52f5bf36cc08f55c06f313eed)]:
  - @ledgerhq/live-common@31.0.0-next.2

## 3.24.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.3.5-next.1
  - @ledgerhq/domain-service@1.1.3-next.1
  - @ledgerhq/live-common@31.0.0-next.1

## 3.24.0-next.0

### Minor Changes

- [#3515](https://github.com/LedgerHQ/ledger-live/pull/3515) [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796) Thanks [@chabroA](https://github.com/chabroA)! - Use live-network package

- [#3468](https://github.com/LedgerHQ/ledger-live/pull/3468) [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c) Thanks [@RamyEB](https://github.com/RamyEB)! - Chnage api call + type

- [#3495](https://github.com/LedgerHQ/ledger-live/pull/3495) [`4d10718642`](https://github.com/LedgerHQ/ledger-live/commit/4d10718642799bfe665c28101942b1416231c898) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add network error view to WebPTXPlayer

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add restoration of apps step on the new firmware update UX

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add language restoration to the new firmware update UX

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add custom lock screen restore feature to the new firmware update UX

- [#3529](https://github.com/LedgerHQ/ledger-live/pull/3529) [`5d6aeab55c`](https://github.com/LedgerHQ/ledger-live/commit/5d6aeab55c275ab308b612a849ae2a758d64c83c) Thanks [@cpellizzari-ledger](https://github.com/cpellizzari-ledger)! - Fix: Binance.com redirection to browser perform authentication on iOS was not triggered

- [#3295](https://github.com/LedgerHQ/ledger-live/pull/3295) [`38d0d3cab9`](https://github.com/LedgerHQ/ledger-live/commit/38d0d3cab90d092580a8cca76b853dd0292d54c8) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Sign-in to Recover from LLM Welcome screen

- [#3477](https://github.com/LedgerHQ/ledger-live/pull/3477) [`53e6254926`](https://github.com/LedgerHQ/ledger-live/commit/53e62549269047a242985b5b000ab15372a7f2bd) Thanks [@marianasrv](https://github.com/marianasrv)! - update ui of modal "send function not available in ios"

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Implement new Firmware Update UX using the new DeviceSDK

### Patch Changes

- [#3397](https://github.com/LedgerHQ/ledger-live/pull/3397) [`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for more ESDT tokens

- [#3441](https://github.com/LedgerHQ/ledger-live/pull/3441) [`499dee28bf`](https://github.com/LedgerHQ/ledger-live/commit/499dee28bf09c06d71cc9b5560ff6387edb04068) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed language switcher on Sync Onboardings (LLM & LLD)

- [#3478](https://github.com/LedgerHQ/ledger-live/pull/3478) [`9b68e8e543`](https://github.com/LedgerHQ/ledger-live/commit/9b68e8e5434e50c92dbd26590b6f10e0f8b21afb) Thanks [@YarnSh39](https://github.com/YarnSh39)! - updated the copy of the Success toast in NFT select. Also added by pass for connecting hardwallet device.

- [#3481](https://github.com/LedgerHQ/ledger-live/pull/3481) [`787c50f00e`](https://github.com/LedgerHQ/ledger-live/commit/787c50f00e12a2d5c46672243372bb2fde823e77) Thanks [@mderrick](https://github.com/mderrick)! - LIVE-5104 added receive nft flow Detox tests

- Updated dependencies [[`b574c30b2b`](https://github.com/LedgerHQ/ledger-live/commit/b574c30b2ba9ba49e12ab20ce1fd7c68c2220acf), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c), [`76699bc304`](https://github.com/LedgerHQ/ledger-live/commit/76699bc304204232b280984644a7c5709fdff063), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`eb258d57c2`](https://github.com/LedgerHQ/ledger-live/commit/eb258d57c2abd8d0db9154a82932e1fd83bfce9a), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`b40fa18379`](https://github.com/LedgerHQ/ledger-live/commit/b40fa18379bcadb56e8cbd902a299426d97e2345), [`f13bf2e2cc`](https://github.com/LedgerHQ/ledger-live/commit/f13bf2e2ccd1684692e1f641b66f0f3b4d457c2d), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500)]:
  - @ledgerhq/live-common@31.0.0-next.0
  - @ledgerhq/native-ui@0.20.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.29.0-next.0
  - @ledgerhq/types-live@6.35.0-next.0
  - @ledgerhq/coin-framework@0.3.5-next.0
  - @ledgerhq/domain-service@1.1.3-next.0

## 3.23.0

### Minor Changes

- [#3324](https://github.com/LedgerHQ/ledger-live/pull/3324) [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: bumped react-native-reanimated to v3.1.0

  Our usage of react-native-reanimated in v2.15 was creating freezing issues on iOS.

  - Bumped react-native-reanimated to v3.1.0.
  - Added necessary babel plugins to devDependencies that are needed for react-native-reanimated.
  - Also updated metro.config.js to stop forcing resolving react-native-reanimated from the LLM folder as it was creating import issues.
  - Bumped lottie-react-native to 6.0.0-rc.6
  - Needed because with Reanimated 3, Lottie from lottie-react-native v5.1.5 were not working correctly anymore

  Also adapted a bunch of components that were still using the v1 api of reanimated -> I wrote a plan for QA to double check them

  After adapting those components, removed the following unused components/libs:

  - react-native-redash dependency : unused
  - lottie-ios dependency: unneeded since lottie-react-native > 5.1.4
  - some components that were used by an old onboarding that cannot be reach anymore

- [#3338](https://github.com/LedgerHQ/ledger-live/pull/3338) [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0) Thanks [@chabroA](https://github.com/chabroA)! - Restore full network logs under env var and with experimental setting

### Patch Changes

- [#3438](https://github.com/LedgerHQ/ledger-live/pull/3438) [`1475eda0a0`](https://github.com/LedgerHQ/ledger-live/commit/1475eda0a03eeb0762e4981d7861554a26ef7697) Thanks [@grsoares21](https://github.com/grsoares21)! - Remove unnecessary reporting of errors to Sentry

- [#3456](https://github.com/LedgerHQ/ledger-live/pull/3456) [`36447d4a2e`](https://github.com/LedgerHQ/ledger-live/commit/36447d4a2e247edae32557106edc60d0b664e3e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix bad logic for ProviderWarning visibility

- [#3340](https://github.com/LedgerHQ/ledger-live/pull/3340) [`fd8941e1b2`](https://github.com/LedgerHQ/ledger-live/commit/fd8941e1b200180eaa75a285a5a7ef59b16e63e3) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Pixel polish on Pairing flow screens

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - implementation of cls removal on lld

- [#3424](https://github.com/LedgerHQ/ledger-live/pull/3424) [`cc93d9cbc3`](https://github.com/LedgerHQ/ledger-live/commit/cc93d9cbc3d91d894b9f51c0edb626e46f6b3300) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Bring the optimistic state to the LLM storage bar

- [#3445](https://github.com/LedgerHQ/ledger-live/pull/3445) [`2c7807ab3c`](https://github.com/LedgerHQ/ledger-live/commit/2c7807ab3c7a95136b62737566cc061d4cd18144) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - sync onboarding: analytics for seeding step (seeding type and number of words)
  analytics: small refactor of the screen tracking logic

- [#3405](https://github.com/LedgerHQ/ledger-live/pull/3405) [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2) Thanks [@Justkant](https://github.com/Justkant)! - feat: stax recover onboarding [PROTECT-1710]

- [#3341](https://github.com/LedgerHQ/ledger-live/pull/3341) [`b71717bade`](https://github.com/LedgerHQ/ledger-live/commit/b71717badef30a045418e79a5f7e355c07ec2dfb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added a better visual warning to LLM odd providers

- [#3457](https://github.com/LedgerHQ/ledger-live/pull/3457) [`a0e6b9281a`](https://github.com/LedgerHQ/ledger-live/commit/a0e6b9281aeb7d75cb1744ce180d3999088bb2ce) Thanks [@juan-cortes](https://github.com/juan-cortes)! - fix: allow closing modals if no blocking action is happening LLM

- [#3365](https://github.com/LedgerHQ/ledger-live/pull/3365) [`ff962bbe95`](https://github.com/LedgerHQ/ledger-live/commit/ff962bbe95ec68c6de09fbe4c76cb164f139936a) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated Vertical Timeline (fixed crash + pixel polish) + pixel polish of the Sync Onboarding including language selection (now used in welcome screen)

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0), [`6d09361b6b`](https://github.com/LedgerHQ/ledger-live/commit/6d09361b6b8de34c6b202e00c9bac8f4844eb105), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9), [`745fbf2a54`](https://github.com/LedgerHQ/ledger-live/commit/745fbf2a54cdc34aea938d7fbe4c8b198dc36b54), [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2), [`2b24af44c3`](https://github.com/LedgerHQ/ledger-live/commit/2b24af44c3f77f2bc46f7a2d9ebcf1ae3759ef80), [`034c68fe40`](https://github.com/LedgerHQ/ledger-live/commit/034c68fe40220dbb2c33a549a26bd0d67097eb45), [`6036036c92`](https://github.com/LedgerHQ/ledger-live/commit/6036036c92ff7236468e748a936d50b0feb65c92), [`ff962bbe95`](https://github.com/LedgerHQ/ledger-live/commit/ff962bbe95ec68c6de09fbe4c76cb164f139936a)]:
  - @ledgerhq/errors@6.12.6
  - @ledgerhq/live-common@30.0.0
  - @ledgerhq/coin-framework@0.3.4
  - @ledgerhq/live-env@0.3.0
  - @ledgerhq/native-ui@0.19.1
  - @ledgerhq/types-live@6.34.1
  - @ledgerhq/domain-service@1.1.2
  - @ledgerhq/devices@8.0.3
  - @ledgerhq/hw-transport@6.28.4
  - @ledgerhq/hw-transport-http@6.27.15
  - @ledgerhq/react-native-hid@6.29.3
  - @ledgerhq/react-native-hw-transport-ble@6.28.8

## 3.23.0-next.0

### Minor Changes

- [#3324](https://github.com/LedgerHQ/ledger-live/pull/3324) [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: bumped react-native-reanimated to v3.1.0

  Our usage of react-native-reanimated in v2.15 was creating freezing issues on iOS.

  - Bumped react-native-reanimated to v3.1.0.
  - Added necessary babel plugins to devDependencies that are needed for react-native-reanimated.
  - Also updated metro.config.js to stop forcing resolving react-native-reanimated from the LLM folder as it was creating import issues.
  - Bumped lottie-react-native to 6.0.0-rc.6
  - Needed because with Reanimated 3, Lottie from lottie-react-native v5.1.5 were not working correctly anymore

  Also adapted a bunch of components that were still using the v1 api of reanimated -> I wrote a plan for QA to double check them

  After adapting those components, removed the following unused components/libs:

  - react-native-redash dependency : unused
  - lottie-ios dependency: unneeded since lottie-react-native > 5.1.4
  - some components that were used by an old onboarding that cannot be reach anymore

- [#3338](https://github.com/LedgerHQ/ledger-live/pull/3338) [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0) Thanks [@chabroA](https://github.com/chabroA)! - Restore full network logs under env var and with experimental setting

### Patch Changes

- [#3438](https://github.com/LedgerHQ/ledger-live/pull/3438) [`1475eda0a0`](https://github.com/LedgerHQ/ledger-live/commit/1475eda0a03eeb0762e4981d7861554a26ef7697) Thanks [@grsoares21](https://github.com/grsoares21)! - Remove unnecessary reporting of errors to Sentry

- [#3456](https://github.com/LedgerHQ/ledger-live/pull/3456) [`36447d4a2e`](https://github.com/LedgerHQ/ledger-live/commit/36447d4a2e247edae32557106edc60d0b664e3e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix bad logic for ProviderWarning visibility

- [#3340](https://github.com/LedgerHQ/ledger-live/pull/3340) [`fd8941e1b2`](https://github.com/LedgerHQ/ledger-live/commit/fd8941e1b200180eaa75a285a5a7ef59b16e63e3) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Pixel polish on Pairing flow screens

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - implementation of cls removal on lld

- [#3424](https://github.com/LedgerHQ/ledger-live/pull/3424) [`cc93d9cbc3`](https://github.com/LedgerHQ/ledger-live/commit/cc93d9cbc3d91d894b9f51c0edb626e46f6b3300) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Bring the optimistic state to the LLM storage bar

- [#3445](https://github.com/LedgerHQ/ledger-live/pull/3445) [`2c7807ab3c`](https://github.com/LedgerHQ/ledger-live/commit/2c7807ab3c7a95136b62737566cc061d4cd18144) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - sync onboarding: analytics for seeding step (seeding type and number of words)
  analytics: small refactor of the screen tracking logic

- [#3405](https://github.com/LedgerHQ/ledger-live/pull/3405) [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2) Thanks [@Justkant](https://github.com/Justkant)! - feat: stax recover onboarding [PROTECT-1710]

- [#3341](https://github.com/LedgerHQ/ledger-live/pull/3341) [`b71717bade`](https://github.com/LedgerHQ/ledger-live/commit/b71717badef30a045418e79a5f7e355c07ec2dfb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added a better visual warning to LLM odd providers

- [#3457](https://github.com/LedgerHQ/ledger-live/pull/3457) [`a0e6b9281a`](https://github.com/LedgerHQ/ledger-live/commit/a0e6b9281aeb7d75cb1744ce180d3999088bb2ce) Thanks [@juan-cortes](https://github.com/juan-cortes)! - fix: allow closing modals if no blocking action is happening LLM

- [#3365](https://github.com/LedgerHQ/ledger-live/pull/3365) [`ff962bbe95`](https://github.com/LedgerHQ/ledger-live/commit/ff962bbe95ec68c6de09fbe4c76cb164f139936a) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated Vertical Timeline (fixed crash + pixel polish) + pixel polish of the Sync Onboarding including language selection (now used in welcome screen)

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0), [`6d09361b6b`](https://github.com/LedgerHQ/ledger-live/commit/6d09361b6b8de34c6b202e00c9bac8f4844eb105), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9), [`745fbf2a54`](https://github.com/LedgerHQ/ledger-live/commit/745fbf2a54cdc34aea938d7fbe4c8b198dc36b54), [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2), [`2b24af44c3`](https://github.com/LedgerHQ/ledger-live/commit/2b24af44c3f77f2bc46f7a2d9ebcf1ae3759ef80), [`034c68fe40`](https://github.com/LedgerHQ/ledger-live/commit/034c68fe40220dbb2c33a549a26bd0d67097eb45), [`6036036c92`](https://github.com/LedgerHQ/ledger-live/commit/6036036c92ff7236468e748a936d50b0feb65c92), [`ff962bbe95`](https://github.com/LedgerHQ/ledger-live/commit/ff962bbe95ec68c6de09fbe4c76cb164f139936a)]:
  - @ledgerhq/errors@6.12.6-next.0
  - @ledgerhq/live-common@30.0.0-next.0
  - @ledgerhq/coin-framework@0.3.4-next.0
  - @ledgerhq/live-env@0.3.0-next.0
  - @ledgerhq/native-ui@0.19.1-next.0
  - @ledgerhq/types-live@6.34.1-next.0
  - @ledgerhq/domain-service@1.1.2-next.0
  - @ledgerhq/devices@8.0.3-next.0
  - @ledgerhq/hw-transport@6.28.4-next.0
  - @ledgerhq/hw-transport-http@6.27.15-next.0
  - @ledgerhq/react-native-hid@6.29.3-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.8-next.0

## 3.22.0

### Minor Changes

- [#3360](https://github.com/LedgerHQ/ledger-live/pull/3360) [`130695325d`](https://github.com/LedgerHQ/ledger-live/commit/130695325d859e87157688071f1e8ea177a43a73) Thanks [@RamyEB](https://github.com/RamyEB)! - fix issue with discover android

### Patch Changes

- [#3381](https://github.com/LedgerHQ/ledger-live/pull/3381) [`d4befe5acf`](https://github.com/LedgerHQ/ledger-live/commit/d4befe5acf9e64458d38495e528cf813b4dd3faa) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Do not display the usual verifyAddress message on send ens

- [#3408](https://github.com/LedgerHQ/ledger-live/pull/3408) [`db8c4b3502`](https://github.com/LedgerHQ/ledger-live/commit/db8c4b350260cf667a77c38de8747c23808f8200) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix device name text wrapping issue in My Ledger
  Fix device renaming input focusing issue on iOS
- Updated dependencies [[`491b37f08d`](https://github.com/LedgerHQ/ledger-live/commit/491b37f08d9a17404eaf32c491628e65d2d8666a), [`05c4b20b3a`](https://github.com/LedgerHQ/ledger-live/commit/05c4b20b3a89a1fe0e851189b51a2b5fdf625f01), [`dfccb01b94`](https://github.com/LedgerHQ/ledger-live/commit/dfccb01b94d545af80ee5e77bf1d04d9d2fd0faa), [`30e28ef881`](https://github.com/LedgerHQ/ledger-live/commit/30e28ef8817018f4ff637bf38626c2da8cfd20b9), [`0e4f34fac2`](https://github.com/LedgerHQ/ledger-live/commit/0e4f34fac2ceebdece29d408e914b3664228db36)]:
  - @ledgerhq/live-common@29.6.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.7
  - @ledgerhq/types-live@6.34.0
  - @ledgerhq/coin-framework@0.3.3
  - @ledgerhq/domain-service@1.1.1

## 3.22.0-next.1

### Patch Changes

- [#3408](https://github.com/LedgerHQ/ledger-live/pull/3408) [`db8c4b3502`](https://github.com/LedgerHQ/ledger-live/commit/db8c4b350260cf667a77c38de8747c23808f8200) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix device name text wrapping issue in My Ledger
  Fix device renaming input focusing issue on iOS

## 3.22.0-next.0

### Minor Changes

- [#3360](https://github.com/LedgerHQ/ledger-live/pull/3360) [`130695325d`](https://github.com/LedgerHQ/ledger-live/commit/130695325d859e87157688071f1e8ea177a43a73) Thanks [@RamyEB](https://github.com/RamyEB)! - fix issue with discover android

### Patch Changes

- [#3381](https://github.com/LedgerHQ/ledger-live/pull/3381) [`d4befe5acf`](https://github.com/LedgerHQ/ledger-live/commit/d4befe5acf9e64458d38495e528cf813b4dd3faa) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Do not display the usual verifyAddress message on send ens

- Updated dependencies [[`491b37f08d`](https://github.com/LedgerHQ/ledger-live/commit/491b37f08d9a17404eaf32c491628e65d2d8666a), [`05c4b20b3a`](https://github.com/LedgerHQ/ledger-live/commit/05c4b20b3a89a1fe0e851189b51a2b5fdf625f01), [`dfccb01b94`](https://github.com/LedgerHQ/ledger-live/commit/dfccb01b94d545af80ee5e77bf1d04d9d2fd0faa), [`30e28ef881`](https://github.com/LedgerHQ/ledger-live/commit/30e28ef8817018f4ff637bf38626c2da8cfd20b9), [`0e4f34fac2`](https://github.com/LedgerHQ/ledger-live/commit/0e4f34fac2ceebdece29d408e914b3664228db36)]:
  - @ledgerhq/live-common@29.6.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.7-next.0
  - @ledgerhq/types-live@6.34.0-next.0
  - @ledgerhq/coin-framework@0.3.3-next.0
  - @ledgerhq/domain-service@1.1.1-next.0

## 3.21.0

### Minor Changes

- [#3315](https://github.com/LedgerHQ/ledger-live/pull/3315) [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add env & exerimental feature for the base fee multiplier used to compose the maxFeePerGas of an EIP1559 transaction

- [#3312](https://github.com/LedgerHQ/ledger-live/pull/3312) [`a0a4e2eb0e`](https://github.com/LedgerHQ/ledger-live/commit/a0a4e2eb0e84f5679ba5994f8d375054c8466c7e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update UIs for new @ledgerhq/domain-service errors

- [#3206](https://github.com/LedgerHQ/ledger-live/pull/3206) [`bb220c6a93`](https://github.com/LedgerHQ/ledger-live/commit/bb220c6a93d6526b51f6e5f01f0b82aa0cbf5c18) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add warning banner on dash receive flow

- [#3153](https://github.com/LedgerHQ/ledger-live/pull/3153) [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for new EVM chains, including Layer 2s like Optimism & Arbitrum

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

- [#3313](https://github.com/LedgerHQ/ledger-live/pull/3313) [`0f819df4b5`](https://github.com/LedgerHQ/ledger-live/commit/0f819df4b52e396766d0988da7ed126506eb74d5) Thanks [@RamyEB](https://github.com/RamyEB)! - Delete menu from discover tab

### Patch Changes

- [#3118](https://github.com/LedgerHQ/ledger-live/pull/3118) [`45288a1d80`](https://github.com/LedgerHQ/ledger-live/commit/45288a1d808866debff3f51c0382cbf71fac4c35) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - feat: refactor/homogenise headers

  Homogenize headers in navigators and in the main screens accessible from the Main navigator tab bar
  Prevent blocking state due to already paired device in Stax onboarding

- [#3281](https://github.com/LedgerHQ/ledger-live/pull/3281) [`0763b2a735`](https://github.com/LedgerHQ/ledger-live/commit/0763b2a735169c09ebe218830099386f9a6cdad5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: new device selection dynamic header issues

  This PR fixes the "double header" that could be rendered when using the new device selection + ble pairing flow and different screens on LLM.

  To do this, it introduces:

  a requestToSetHeaderOptions in BleDevicePairingFlow / SelectDevice2
  this callback notifies the screen consuming SelectDevice2/BleDevicePairingFlow that it needs to update its header AND notifies it when it can put back its initial header
  the consumer screen can decide to do nothing, and keep its header (case by case)
  It also makes the bottom tab/menu bar disappear during the ble pairing flow with the new device selection.

  Finally, it removes an unnecessary styles.header on ManagerNavigator that would, on iOS, create a thin visible line on the top header on the manager screen.

- [#3258](https://github.com/LedgerHQ/ledger-live/pull/3258) [`2bb99cc244`](https://github.com/LedgerHQ/ledger-live/commit/2bb99cc244dc4ecbcf140beed2f1ababf49f6438) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Fix Unable to Hide NFT collection on Detail Drawer

- [#3253](https://github.com/LedgerHQ/ledger-live/pull/3253) [`f1ed1d3bdd`](https://github.com/LedgerHQ/ledger-live/commit/f1ed1d3bddf25ad74cf04b8767ca2170fdbf75c8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Udpate Alert component with new design

- [#3247](https://github.com/LedgerHQ/ledger-live/pull/3247) [`cf66e6cc32`](https://github.com/LedgerHQ/ledger-live/commit/cf66e6cc3207b6daabb497f12dba20eaf9c17ffd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Swap NewsFeed Tab with Learn Tab in Discover section

- [#3301](https://github.com/LedgerHQ/ledger-live/pull/3301) [`3d4e20d950`](https://github.com/LedgerHQ/ledger-live/commit/3d4e20d95087b1976b8f28f467f95ec6ddc9c592) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: manager possible duplicated ble requirements error messages

  In the Manager: both the old (SelectDevice) and new (SelectDevice2)
  device selection components handle the bluetooth requirements with a hook

  - bottom drawer.

  The fix gives back the responsibilities to those select components to check for
  the bluetooth requirements and avoids a duplicated error drawers/messages.

  The only drawback: the user has to select again their device once the bluetooth
  requirements are respected.

- [#3311](https://github.com/LedgerHQ/ledger-live/pull/3311) [`a41832fe03`](https://github.com/LedgerHQ/ledger-live/commit/a41832fe03a20af2e4fc0897354d2718e728c26f) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed the disappointed typeform url on iOS

- [#3296](https://github.com/LedgerHQ/ledger-live/pull/3296) [`0ce82b0f45`](https://github.com/LedgerHQ/ledger-live/commit/0ce82b0f453fa0f25359f22a1ff66f378e32a593) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - New UI for Status Center

- [#3300](https://github.com/LedgerHQ/ledger-live/pull/3300) [`e5420a5fcb`](https://github.com/LedgerHQ/ledger-live/commit/e5420a5fcb59e6e18f6a64aefcd8156989f21f5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new entries for referral program

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling for broken pairing on iOS

- [#3105](https://github.com/LedgerHQ/ledger-live/pull/3105) [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor device action implementations unifying the logic

- [#3278](https://github.com/LedgerHQ/ledger-live/pull/3278) [`34e2621b9f`](https://github.com/LedgerHQ/ledger-live/commit/34e2621b9f24f6058e3f9c87219f978c40db3304) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Fixed LLM account staking tracking events from account pages

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

- Updated dependencies [[`45288a1d80`](https://github.com/LedgerHQ/ledger-live/commit/45288a1d808866debff3f51c0382cbf71fac4c35), [`07fc266a10`](https://github.com/LedgerHQ/ledger-live/commit/07fc266a10479f77044e36b9347b9a97e42f0566), [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d), [`f11d282bde`](https://github.com/LedgerHQ/ledger-live/commit/f11d282bded679dfcbb0bbffe88055d55995e03f), [`0ebfbbf596`](https://github.com/LedgerHQ/ledger-live/commit/0ebfbbf596ef3d690f1eb225698512f9a1108b59), [`f1ed1d3bdd`](https://github.com/LedgerHQ/ledger-live/commit/f1ed1d3bddf25ad74cf04b8767ca2170fdbf75c8), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e), [`835bfbaa45`](https://github.com/LedgerHQ/ledger-live/commit/835bfbaa45f2bee5416b40a34ae0bf150d780e2c), [`d67f7480f7`](https://github.com/LedgerHQ/ledger-live/commit/d67f7480f767ffceab82a43c37089948315a3fc4), [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3), [`164409ab4e`](https://github.com/LedgerHQ/ledger-live/commit/164409ab4e035bb6c941c2f5a0c4e26873c52270), [`a0a4e2eb0e`](https://github.com/LedgerHQ/ledger-live/commit/a0a4e2eb0e84f5679ba5994f8d375054c8466c7e), [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e), [`ec9426b354`](https://github.com/LedgerHQ/ledger-live/commit/ec9426b354156eb9362a74649a1f887a3aef7f8d), [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949), [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678), [`baa687a281`](https://github.com/LedgerHQ/ledger-live/commit/baa687a281b5f75cacd06b05b5438807874fa152)]:
  - @ledgerhq/native-ui@0.19.0
  - @ledgerhq/live-common@29.5.0
  - @ledgerhq/live-env@0.2.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.6
  - @ledgerhq/types-live@6.33.0
  - @ledgerhq/types-cryptoassets@7.2.0
  - @ledgerhq/domain-service@1.1.0
  - @ledgerhq/errors@6.12.5
  - @ledgerhq/coin-framework@0.3.2
  - @ledgerhq/devices@8.0.2
  - @ledgerhq/hw-transport@6.28.3
  - @ledgerhq/hw-transport-http@6.27.14
  - @ledgerhq/react-native-hid@6.29.2

## 3.21.0-next.2

### Patch Changes

- Updated dependencies [[`0ebfbbf596`](https://github.com/LedgerHQ/ledger-live/commit/0ebfbbf596ef3d690f1eb225698512f9a1108b59)]:
  - @ledgerhq/live-common@29.5.0-next.2

## 3.21.0-next.1

### Patch Changes

- Updated dependencies [[`164409ab4e`](https://github.com/LedgerHQ/ledger-live/commit/164409ab4e035bb6c941c2f5a0c4e26873c52270)]:
  - @ledgerhq/live-common@29.5.0-next.1

## 3.21.0-next.0

### Minor Changes

- [#3315](https://github.com/LedgerHQ/ledger-live/pull/3315) [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add env & exerimental feature for the base fee multiplier used to compose the maxFeePerGas of an EIP1559 transaction

- [#3312](https://github.com/LedgerHQ/ledger-live/pull/3312) [`a0a4e2eb0e`](https://github.com/LedgerHQ/ledger-live/commit/a0a4e2eb0e84f5679ba5994f8d375054c8466c7e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update UIs for new @ledgerhq/domain-service errors

- [#3206](https://github.com/LedgerHQ/ledger-live/pull/3206) [`bb220c6a93`](https://github.com/LedgerHQ/ledger-live/commit/bb220c6a93d6526b51f6e5f01f0b82aa0cbf5c18) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add warning banner on dash receive flow

- [#3153](https://github.com/LedgerHQ/ledger-live/pull/3153) [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for new EVM chains, including Layer 2s like Optimism & Arbitrum

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

- [#3313](https://github.com/LedgerHQ/ledger-live/pull/3313) [`0f819df4b5`](https://github.com/LedgerHQ/ledger-live/commit/0f819df4b52e396766d0988da7ed126506eb74d5) Thanks [@RamyEB](https://github.com/RamyEB)! - Delete menu from discover tab

### Patch Changes

- [#3118](https://github.com/LedgerHQ/ledger-live/pull/3118) [`45288a1d80`](https://github.com/LedgerHQ/ledger-live/commit/45288a1d808866debff3f51c0382cbf71fac4c35) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - feat: refactor/homogenise headers

  Homogenize headers in navigators and in the main screens accessible from the Main navigator tab bar
  Prevent blocking state due to already paired device in Stax onboarding

- [#3281](https://github.com/LedgerHQ/ledger-live/pull/3281) [`0763b2a735`](https://github.com/LedgerHQ/ledger-live/commit/0763b2a735169c09ebe218830099386f9a6cdad5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: new device selection dynamic header issues

  This PR fixes the "double header" that could be rendered when using the new device selection + ble pairing flow and different screens on LLM.

  To do this, it introduces:

  a requestToSetHeaderOptions in BleDevicePairingFlow / SelectDevice2
  this callback notifies the screen consuming SelectDevice2/BleDevicePairingFlow that it needs to update its header AND notifies it when it can put back its initial header
  the consumer screen can decide to do nothing, and keep its header (case by case)
  It also makes the bottom tab/menu bar disappear during the ble pairing flow with the new device selection.

  Finally, it removes an unnecessary styles.header on ManagerNavigator that would, on iOS, create a thin visible line on the top header on the manager screen.

- [#3258](https://github.com/LedgerHQ/ledger-live/pull/3258) [`2bb99cc244`](https://github.com/LedgerHQ/ledger-live/commit/2bb99cc244dc4ecbcf140beed2f1ababf49f6438) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Fix Unable to Hide NFT collection on Detail Drawer

- [#3253](https://github.com/LedgerHQ/ledger-live/pull/3253) [`f1ed1d3bdd`](https://github.com/LedgerHQ/ledger-live/commit/f1ed1d3bddf25ad74cf04b8767ca2170fdbf75c8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Udpate Alert component with new design

- [#3247](https://github.com/LedgerHQ/ledger-live/pull/3247) [`cf66e6cc32`](https://github.com/LedgerHQ/ledger-live/commit/cf66e6cc3207b6daabb497f12dba20eaf9c17ffd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Swap NewsFeed Tab with Learn Tab in Discover section

- [#3301](https://github.com/LedgerHQ/ledger-live/pull/3301) [`3d4e20d950`](https://github.com/LedgerHQ/ledger-live/commit/3d4e20d95087b1976b8f28f467f95ec6ddc9c592) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: manager possible duplicated ble requirements error messages

  In the Manager: both the old (SelectDevice) and new (SelectDevice2)
  device selection components handle the bluetooth requirements with a hook

  - bottom drawer.

  The fix gives back the responsibilities to those select components to check for
  the bluetooth requirements and avoids a duplicated error drawers/messages.

  The only drawback: the user has to select again their device once the bluetooth
  requirements are respected.

- [#3311](https://github.com/LedgerHQ/ledger-live/pull/3311) [`a41832fe03`](https://github.com/LedgerHQ/ledger-live/commit/a41832fe03a20af2e4fc0897354d2718e728c26f) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed the disappointed typeform url on iOS

- [#3296](https://github.com/LedgerHQ/ledger-live/pull/3296) [`0ce82b0f45`](https://github.com/LedgerHQ/ledger-live/commit/0ce82b0f453fa0f25359f22a1ff66f378e32a593) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - New UI for Status Center

- [#3300](https://github.com/LedgerHQ/ledger-live/pull/3300) [`e5420a5fcb`](https://github.com/LedgerHQ/ledger-live/commit/e5420a5fcb59e6e18f6a64aefcd8156989f21f5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new entries for referral program

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling for broken pairing on iOS

- [#3105](https://github.com/LedgerHQ/ledger-live/pull/3105) [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor device action implementations unifying the logic

- [#3278](https://github.com/LedgerHQ/ledger-live/pull/3278) [`34e2621b9f`](https://github.com/LedgerHQ/ledger-live/commit/34e2621b9f24f6058e3f9c87219f978c40db3304) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Fixed LLM account staking tracking events from account pages

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

- Updated dependencies [[`45288a1d80`](https://github.com/LedgerHQ/ledger-live/commit/45288a1d808866debff3f51c0382cbf71fac4c35), [`07fc266a10`](https://github.com/LedgerHQ/ledger-live/commit/07fc266a10479f77044e36b9347b9a97e42f0566), [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d), [`f11d282bde`](https://github.com/LedgerHQ/ledger-live/commit/f11d282bded679dfcbb0bbffe88055d55995e03f), [`f1ed1d3bdd`](https://github.com/LedgerHQ/ledger-live/commit/f1ed1d3bddf25ad74cf04b8767ca2170fdbf75c8), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e), [`835bfbaa45`](https://github.com/LedgerHQ/ledger-live/commit/835bfbaa45f2bee5416b40a34ae0bf150d780e2c), [`d67f7480f7`](https://github.com/LedgerHQ/ledger-live/commit/d67f7480f767ffceab82a43c37089948315a3fc4), [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3), [`a0a4e2eb0e`](https://github.com/LedgerHQ/ledger-live/commit/a0a4e2eb0e84f5679ba5994f8d375054c8466c7e), [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e), [`ec9426b354`](https://github.com/LedgerHQ/ledger-live/commit/ec9426b354156eb9362a74649a1f887a3aef7f8d), [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949), [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678), [`baa687a281`](https://github.com/LedgerHQ/ledger-live/commit/baa687a281b5f75cacd06b05b5438807874fa152)]:
  - @ledgerhq/native-ui@0.19.0-next.0
  - @ledgerhq/live-common@29.5.0-next.0
  - @ledgerhq/live-env@0.2.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.6-next.0
  - @ledgerhq/types-live@6.33.0-next.0
  - @ledgerhq/types-cryptoassets@7.2.0-next.0
  - @ledgerhq/domain-service@1.1.0-next.0
  - @ledgerhq/errors@6.12.5-next.0
  - @ledgerhq/coin-framework@0.3.2-next.0
  - @ledgerhq/devices@8.0.2-next.0
  - @ledgerhq/hw-transport@6.28.3-next.0
  - @ledgerhq/hw-transport-http@6.27.14-next.0
  - @ledgerhq/react-native-hid@6.29.2-next.0

## 3.20.1

### Patch Changes

- [#3304](https://github.com/LedgerHQ/ledger-live/pull/3304) [`c20a0d4284`](https://github.com/LedgerHQ/ledger-live/commit/c20a0d4284ede962e42540cd9ab3e3399ca89d8f) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Patch `asyncstorage-down` to import AsyncStorage from `@react-native-async-storage/async-storage`

  Ledger Live Mobile has been recently updated to 0.71. One side effect is that `AsyncStorage` was removed from the main `react-native` package and moved to `@react-native-async-storage/async-storage`.

  LLM relies on an `fs` polyfill using `asyncstorage-down` under the hood, but the latter is now broken because it contains one hardcoded require call:

  ```js
  require("react-native").AsyncStorage;
  ```

  Patching `asyncstorage-down` to import `AsyncStorage` from the right package should solve the issue.

## 3.20.1-hotfix.0

### Patch Changes

- [#3304](https://github.com/LedgerHQ/ledger-live/pull/3304) [`c20a0d4284`](https://github.com/LedgerHQ/ledger-live/commit/c20a0d4284ede962e42540cd9ab3e3399ca89d8f) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Patch `asyncstorage-down` to import AsyncStorage from `@react-native-async-storage/async-storage`

  Ledger Live Mobile has been recently updated to 0.71. One side effect is that `AsyncStorage` was removed from the main `react-native` package and moved to `@react-native-async-storage/async-storage`.

  LLM relies on an `fs` polyfill using `asyncstorage-down` under the hood, but the latter is now broken because it contains one hardcoded require call:

  ```js
  require("react-native").AsyncStorage;
  ```

  Patching `asyncstorage-down` to import `AsyncStorage` from the right package should solve the issue.

## 3.20.0

### Minor Changes

- [#2817](https://github.com/LedgerHQ/ledger-live/pull/2817) [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add support for Stax enabled NFTs by highlighting them to the user in the gallery and overriding the lockscreen edition with the special Stax metadata image

- [#3225](https://github.com/LedgerHQ/ledger-live/pull/3225) [`4b3c21c473`](https://github.com/LedgerHQ/ledger-live/commit/4b3c21c473a4f3183c3d3eb849e4c49f96ff81a9) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added additional data to the ratings typeform

- [#3270](https://github.com/LedgerHQ/ledger-live/pull/3270) [`294f5685df`](https://github.com/LedgerHQ/ledger-live/commit/294f5685df6bb8e414bba5d2463f327aaf5d3d23) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removed Promise.allSettled polyfill as it wasn't correctly shimmed on some devices

### Patch Changes

- [#3203](https://github.com/LedgerHQ/ledger-live/pull/3203) [`da25400ad8`](https://github.com/LedgerHQ/ledger-live/commit/da25400ad8fcf44cc6b0561d9319b25ed9ee64ab) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix the behavior of the close button in the sync onboarding

- [#2888](https://github.com/LedgerHQ/ledger-live/pull/2888) [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27) Thanks [@elbywan](https://github.com/elbywan)! - Upgrade react-native (to 0.71) as well as other dependencies

- [#3164](https://github.com/LedgerHQ/ledger-live/pull/3164) [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a 'feesCurrency' field to 'Account' type, and use it

- [#3169](https://github.com/LedgerHQ/ledger-live/pull/3169) [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow for model and version dependent max name length

- [#3014](https://github.com/LedgerHQ/ledger-live/pull/3014) [`579161ff68`](https://github.com/LedgerHQ/ledger-live/commit/579161ff68361e2b66cecfafc5cd35f05edb4451) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add possibility to deeplink to whitelisted live apps in a non-onboarded LLM

- [#3094](https://github.com/LedgerHQ/ledger-live/pull/3094) [`ebeb0ea7a3`](https://github.com/LedgerHQ/ledger-live/commit/ebeb0ea7a3bff80cd90721ff59681c5fbf788206) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - drop tron staking for LLM

- [#3165](https://github.com/LedgerHQ/ledger-live/pull/3165) [`447ed160e5`](https://github.com/LedgerHQ/ledger-live/commit/447ed160e5394bba07d1b1470b4d83d4e82f898f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Use backend provided support url for apps when available

- [#3125](https://github.com/LedgerHQ/ledger-live/pull/3125) [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed old icon weights (everything except Medium). Deprecated Weigth prop in Icon component

- [#3161](https://github.com/LedgerHQ/ledger-live/pull/3161) [`c6e6fc7269`](https://github.com/LedgerHQ/ledger-live/commit/c6e6fc72696d4d35105e2316c5d7e2d3bad5acae) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: correctly trigger software checks during sync onboarding on new firmware versions

- [#3200](https://github.com/LedgerHQ/ledger-live/pull/3200) [`9b387741db`](https://github.com/LedgerHQ/ledger-live/commit/9b387741db3c075fd48a5a122222d920155cf894) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: enable debug proxy device to bypass bluetooth requirement

- [#3115](https://github.com/LedgerHQ/ledger-live/pull/3115) [`9b1a77ffa1`](https://github.com/LedgerHQ/ledger-live/commit/9b1a77ffa1974f6b9d09bb4c277c576dd5d7234e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implement support of Adjust universal links on iOS

- [#3040](https://github.com/LedgerHQ/ledger-live/pull/3040) [`269b1c1027`](https://github.com/LedgerHQ/ledger-live/commit/269b1c1027d29b24df06bb6b5fa64c7403602090) Thanks [@sarneijim](https://github.com/sarneijim)! - Add stake flow to asset page

- Updated dependencies [[`9fec3a9b3a`](https://github.com/LedgerHQ/ledger-live/commit/9fec3a9b3a26bfce6ef7fdc4afb83e4f3c04cb69), [`294f5685df`](https://github.com/LedgerHQ/ledger-live/commit/294f5685df6bb8e414bba5d2463f327aaf5d3d23), [`530909c036`](https://github.com/LedgerHQ/ledger-live/commit/530909c0368d03aea1e5d0638adb027fa00ab897), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`29badd80d0`](https://github.com/LedgerHQ/ledger-live/commit/29badd80d062f76139ba3a056df22277858021bd), [`992351d66d`](https://github.com/LedgerHQ/ledger-live/commit/992351d66d44d978f069b3aa13f9baf23f9b4482), [`147af2b5e6`](https://github.com/LedgerHQ/ledger-live/commit/147af2b5e674a7020f101a081135c2b187356060), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d), [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9), [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27), [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5), [`42233141e8`](https://github.com/LedgerHQ/ledger-live/commit/42233141e853f2e9752268e5fa711416d460e0e3), [`5059c9584c`](https://github.com/LedgerHQ/ledger-live/commit/5059c9584ca70208a67e9d49025422d395637878), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`87d08d6d1c`](https://github.com/LedgerHQ/ledger-live/commit/87d08d6d1c6111b7f5fb15f3e1bbe85658686e4a)]:
  - @ledgerhq/live-common@29.4.0
  - @ledgerhq/domain-service@1.0.1
  - @ledgerhq/coin-framework@0.3.1
  - @ledgerhq/native-ui@0.18.1
  - @ledgerhq/types-live@6.32.1

## 3.20.0-next.2

### Minor Changes

- [#3270](https://github.com/LedgerHQ/ledger-live/pull/3270) [`294f5685df`](https://github.com/LedgerHQ/ledger-live/commit/294f5685df6bb8e414bba5d2463f327aaf5d3d23) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removed Promise.allSettled polyfill as it wasn't correctly shimmed on some devices

### Patch Changes

- Updated dependencies [[`294f5685df`](https://github.com/LedgerHQ/ledger-live/commit/294f5685df6bb8e414bba5d2463f327aaf5d3d23)]:
  - @ledgerhq/domain-service@1.0.1-next.1
  - @ledgerhq/live-common@29.4.0-next.2

## 3.20.0-next.1

### Patch Changes

- Updated dependencies [[`5059c9584c`](https://github.com/LedgerHQ/ledger-live/commit/5059c9584ca70208a67e9d49025422d395637878)]:
  - @ledgerhq/live-common@29.4.0-next.1

## 3.20.0-next.0

### Minor Changes

- [#2817](https://github.com/LedgerHQ/ledger-live/pull/2817) [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add support for Stax enabled NFTs by highlighting them to the user in the gallery and overriding the lockscreen edition with the special Stax metadata image

- [#3225](https://github.com/LedgerHQ/ledger-live/pull/3225) [`4b3c21c473`](https://github.com/LedgerHQ/ledger-live/commit/4b3c21c473a4f3183c3d3eb849e4c49f96ff81a9) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added additional data to the ratings typeform

### Patch Changes

- [#3203](https://github.com/LedgerHQ/ledger-live/pull/3203) [`da25400ad8`](https://github.com/LedgerHQ/ledger-live/commit/da25400ad8fcf44cc6b0561d9319b25ed9ee64ab) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix the behavior of the close button in the sync onboarding

- [#2888](https://github.com/LedgerHQ/ledger-live/pull/2888) [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27) Thanks [@elbywan](https://github.com/elbywan)! - Upgrade react-native (to 0.71) as well as other dependencies

- [#3164](https://github.com/LedgerHQ/ledger-live/pull/3164) [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a 'feesCurrency' field to 'Account' type, and use it

- [#3169](https://github.com/LedgerHQ/ledger-live/pull/3169) [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow for model and version dependent max name length

- [#3014](https://github.com/LedgerHQ/ledger-live/pull/3014) [`579161ff68`](https://github.com/LedgerHQ/ledger-live/commit/579161ff68361e2b66cecfafc5cd35f05edb4451) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add possibility to deeplink to whitelisted live apps in a non-onboarded LLM

- [#3094](https://github.com/LedgerHQ/ledger-live/pull/3094) [`ebeb0ea7a3`](https://github.com/LedgerHQ/ledger-live/commit/ebeb0ea7a3bff80cd90721ff59681c5fbf788206) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - drop tron staking for LLM

- [#3165](https://github.com/LedgerHQ/ledger-live/pull/3165) [`447ed160e5`](https://github.com/LedgerHQ/ledger-live/commit/447ed160e5394bba07d1b1470b4d83d4e82f898f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Use backend provided support url for apps when available

- [#3125](https://github.com/LedgerHQ/ledger-live/pull/3125) [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed old icon weights (everything except Medium). Deprecated Weigth prop in Icon component

- [#3161](https://github.com/LedgerHQ/ledger-live/pull/3161) [`c6e6fc7269`](https://github.com/LedgerHQ/ledger-live/commit/c6e6fc72696d4d35105e2316c5d7e2d3bad5acae) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: correctly trigger software checks during sync onboarding on new firmware versions

- [#3200](https://github.com/LedgerHQ/ledger-live/pull/3200) [`9b387741db`](https://github.com/LedgerHQ/ledger-live/commit/9b387741db3c075fd48a5a122222d920155cf894) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: enable debug proxy device to bypass bluetooth requirement

- [#3115](https://github.com/LedgerHQ/ledger-live/pull/3115) [`9b1a77ffa1`](https://github.com/LedgerHQ/ledger-live/commit/9b1a77ffa1974f6b9d09bb4c277c576dd5d7234e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implement support of Adjust universal links on iOS

- [#3040](https://github.com/LedgerHQ/ledger-live/pull/3040) [`269b1c1027`](https://github.com/LedgerHQ/ledger-live/commit/269b1c1027d29b24df06bb6b5fa64c7403602090) Thanks [@sarneijim](https://github.com/sarneijim)! - Add stake flow to asset page

- Updated dependencies [[`9fec3a9b3a`](https://github.com/LedgerHQ/ledger-live/commit/9fec3a9b3a26bfce6ef7fdc4afb83e4f3c04cb69), [`530909c036`](https://github.com/LedgerHQ/ledger-live/commit/530909c0368d03aea1e5d0638adb027fa00ab897), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`29badd80d0`](https://github.com/LedgerHQ/ledger-live/commit/29badd80d062f76139ba3a056df22277858021bd), [`992351d66d`](https://github.com/LedgerHQ/ledger-live/commit/992351d66d44d978f069b3aa13f9baf23f9b4482), [`147af2b5e6`](https://github.com/LedgerHQ/ledger-live/commit/147af2b5e674a7020f101a081135c2b187356060), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d), [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9), [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27), [`a8a992853b`](https://github.com/LedgerHQ/ledger-live/commit/a8a992853bfdf9fffc8ed1190e83dd37cd588cf5), [`42233141e8`](https://github.com/LedgerHQ/ledger-live/commit/42233141e853f2e9752268e5fa711416d460e0e3), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`87d08d6d1c`](https://github.com/LedgerHQ/ledger-live/commit/87d08d6d1c6111b7f5fb15f3e1bbe85658686e4a)]:
  - @ledgerhq/live-common@29.4.0-next.0
  - @ledgerhq/coin-framework@0.3.1-next.0
  - @ledgerhq/native-ui@0.18.1-next.0
  - @ledgerhq/types-live@6.32.1-next.0
  - @ledgerhq/domain-service@1.0.1-next.0

## 3.19.0

### Minor Changes

- [#3016](https://github.com/LedgerHQ/ledger-live/pull/3016) [`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - feat: ledger recover feature flag

* [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

- [#2891](https://github.com/LedgerHQ/ledger-live/pull/2891) [`04ad7f2de3`](https://github.com/LedgerHQ/ledger-live/commit/04ad7f2de35c5e5e3025f4db81815542af3816f8) Thanks [@IAmMorrow](https://github.com/IAmMorrow)! - Refactored Webviews;
  Added WebPTXPlayer;

* [#2969](https://github.com/LedgerHQ/ledger-live/pull/2969) [`44567eeb17`](https://github.com/LedgerHQ/ledger-live/commit/44567eeb17cb81b8a812d89316d3b66d67fe6aaf) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Domain service for LLM

- [#2861](https://github.com/LedgerHQ/ledger-live/pull/2861) [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a) Thanks [@cksanders](https://github.com/cksanders)! - - Update Kotlin version
  - Updated `wallet-api-server` and `wallet-api-core` version
  - Add Next storage & remove obsolete `AsyncStorage_db_size_in_MB`
  - Added wallet api storage support
  - Add stable & tested LLD storage support

* [#3075](https://github.com/LedgerHQ/ledger-live/pull/3075) [`eed4dcb2bd`](https://github.com/LedgerHQ/ledger-live/commit/eed4dcb2bd5d5a615686f0082f81f39e8739d55b) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Recover WebView

- [#3059](https://github.com/LedgerHQ/ledger-live/pull/3059) [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add domain support to Ledger Live apps and libs

* [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset the migrate accounts old mecanism

- [#3113](https://github.com/LedgerHQ/ledger-live/pull/3113) [`e486e56723`](https://github.com/LedgerHQ/ledger-live/commit/e486e56723c2e6fe6d299f53b38cb4b03a3ee3ea) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - remove currency under feature flag that has been release

### Patch Changes

- [#3120](https://github.com/LedgerHQ/ledger-live/pull/3120) [`76f4c19ce6`](https://github.com/LedgerHQ/ledger-live/commit/76f4c19ce67f2cf42c1b00add069b49863b7fe94) Thanks [@RamyEB](https://github.com/RamyEB)! - Remove the cancel button and make the top left arrow return user to Browse Web3.

* [#3111](https://github.com/LedgerHQ/ledger-live/pull/3111) [`e6e71dc909`](https://github.com/LedgerHQ/ledger-live/commit/e6e71dc909ff9382c7b1d1033ebdffde15ec847e) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix a bug on the firmware update making the app to be stuck in a single step of the update model while the device updated.

- [#3077](https://github.com/LedgerHQ/ledger-live/pull/3077) [`11badbc999`](https://github.com/LedgerHQ/ledger-live/commit/11badbc9991e26b220bcbdab256b55aa4b295a0d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed upsell triggering even if feature flag is off

* [#3104](https://github.com/LedgerHQ/ledger-live/pull/3104) [`1fdf8e7242`](https://github.com/LedgerHQ/ledger-live/commit/1fdf8e72427367e2082d6ecbbd8ae7b0bee45a7b) Thanks [@Justkant](https://github.com/Justkant)! - fix: recover deeplinks

- [#3087](https://github.com/LedgerHQ/ledger-live/pull/3087) [`9c5be7fa63`](https://github.com/LedgerHQ/ledger-live/commit/9c5be7fa63f9bf793c97ea40c0dbc23b5bf56f86) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Small improvement to the logs viewer debug tool

* [#3116](https://github.com/LedgerHQ/ledger-live/pull/3116) [`37b05b991d`](https://github.com/LedgerHQ/ledger-live/commit/37b05b991db519073a92ad5f4e7784006e8517d4) Thanks [@IAmMorrow](https://github.com/IAmMorrow)! - Fixed a regression on LLD live-app sdk exchange app; backported exchange app from live-app-sdk to wallet-api; added "allow debug apps" in LLM developers menu

- [#3177](https://github.com/LedgerHQ/ledger-live/pull/3177) [`193d69d72c`](https://github.com/LedgerHQ/ledger-live/commit/193d69d72c9887f020d8d01b24773ccaf84a77c9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - drop tron staking for LLM

* [#3129](https://github.com/LedgerHQ/ledger-live/pull/3129) [`7d0f4855de`](https://github.com/LedgerHQ/ledger-live/commit/7d0f4855de5d6e0c08df9693c957dfa1f09a4bd1) Thanks [@Justkant](https://github.com/Justkant)! - fix: navigation.pop in DeviceConnect

  As it can be used in the Onboarding base navigator now, if you pop by getting the parent, you will pop the BaseNavigator

- [#3099](https://github.com/LedgerHQ/ledger-live/pull/3099) [`e29f7c7bda`](https://github.com/LedgerHQ/ledger-live/commit/e29f7c7bda0444e5d592bd873c894b043eb22417) Thanks [@Justkant](https://github.com/Justkant)! - fix: react-native-webview target="\_blank" on iOS

  Also fix the html5 history.pushState navigation on android
  More infos on both issues below:

  - https://github.com/react-native-webview/react-native-webview/issues/2905
  - https://github.com/react-native-webview/react-native-webview/issues/2667
  - https://github.com/react-native-webview/react-native-webview/pull/2598

* [#3096](https://github.com/LedgerHQ/ledger-live/pull/3096) [`9133f2fa1c`](https://github.com/LedgerHQ/ledger-live/commit/9133f2fa1cfb61a3f00101d33abebfbf3c86d723) Thanks [@RamyEB](https://github.com/RamyEB)! - Remove recently used from search page Discovery 2

* Updated dependencies [[`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`a1e3f90e7f`](https://github.com/LedgerHQ/ledger-live/commit/a1e3f90e7f34303ab779e90c0e48642348d79280), [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4), [`c59bee8935`](https://github.com/LedgerHQ/ledger-live/commit/c59bee89357bb29097fb97ca67ece845630d982a), [`64ee0b2e03`](https://github.com/LedgerHQ/ledger-live/commit/64ee0b2e032187f5b742f594390a5b30d3850751), [`fb65760778`](https://github.com/LedgerHQ/ledger-live/commit/fb6576077854fb21541350a9f7c1cb528fba6e6d), [`a62be79a56`](https://github.com/LedgerHQ/ledger-live/commit/a62be79a56e7aaaf7712fe006d357e3517f1c4b9), [`282cad03fb`](https://github.com/LedgerHQ/ledger-live/commit/282cad03fb733cc71e767b641c53ee2d469b8295), [`5fa4697e8d`](https://github.com/LedgerHQ/ledger-live/commit/5fa4697e8d1cfd1dba0f942745d1bfc6984ae1c9), [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4), [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4)]:
  - @ledgerhq/live-common@29.3.0
  - @ledgerhq/types-cryptoassets@7.1.0
  - @ledgerhq/types-live@6.32.0
  - @ledgerhq/native-ui@0.18.0
  - @ledgerhq/coin-framework@0.3.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.5
  - @ledgerhq/domain-service@1.0.0

## 3.19.0-next.2

### Patch Changes

- Updated dependencies [[`a1e3f90e7f`](https://github.com/LedgerHQ/ledger-live/commit/a1e3f90e7f34303ab779e90c0e48642348d79280)]:
  - @ledgerhq/live-common@29.3.0-next.1

## 3.19.0-next.1

### Patch Changes

- [#3177](https://github.com/LedgerHQ/ledger-live/pull/3177) [`193d69d72c`](https://github.com/LedgerHQ/ledger-live/commit/193d69d72c9887f020d8d01b24773ccaf84a77c9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - drop tron staking for LLM

## 3.19.0-next.0

### Minor Changes

- [#3016](https://github.com/LedgerHQ/ledger-live/pull/3016) [`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - feat: ledger recover feature flag

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

- [#2891](https://github.com/LedgerHQ/ledger-live/pull/2891) [`04ad7f2de3`](https://github.com/LedgerHQ/ledger-live/commit/04ad7f2de35c5e5e3025f4db81815542af3816f8) Thanks [@IAmMorrow](https://github.com/IAmMorrow)! - Refactored Webviews;
  Added WebPTXPlayer;

- [#2969](https://github.com/LedgerHQ/ledger-live/pull/2969) [`44567eeb17`](https://github.com/LedgerHQ/ledger-live/commit/44567eeb17cb81b8a812d89316d3b66d67fe6aaf) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Domain service for LLM

- [#2861](https://github.com/LedgerHQ/ledger-live/pull/2861) [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a) Thanks [@cksanders](https://github.com/cksanders)! - - Update Kotlin version

  - Updated `wallet-api-server` and `wallet-api-core` version
  - Add Next storage & remove obsolete `AsyncStorage_db_size_in_MB`
  - Added wallet api storage support
  - Add stable & tested LLD storage support

- [#3075](https://github.com/LedgerHQ/ledger-live/pull/3075) [`eed4dcb2bd`](https://github.com/LedgerHQ/ledger-live/commit/eed4dcb2bd5d5a615686f0082f81f39e8739d55b) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Recover WebView

- [#3059](https://github.com/LedgerHQ/ledger-live/pull/3059) [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add domain support to Ledger Live apps and libs

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset the migrate accounts old mecanism

- [#3113](https://github.com/LedgerHQ/ledger-live/pull/3113) [`e486e56723`](https://github.com/LedgerHQ/ledger-live/commit/e486e56723c2e6fe6d299f53b38cb4b03a3ee3ea) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - remove currency under feature flag that has been release

### Patch Changes

- [#3120](https://github.com/LedgerHQ/ledger-live/pull/3120) [`76f4c19ce6`](https://github.com/LedgerHQ/ledger-live/commit/76f4c19ce67f2cf42c1b00add069b49863b7fe94) Thanks [@RamyEB](https://github.com/RamyEB)! - Remove the cancel button and make the top left arrow return user to Browse Web3.

- [#3111](https://github.com/LedgerHQ/ledger-live/pull/3111) [`e6e71dc909`](https://github.com/LedgerHQ/ledger-live/commit/e6e71dc909ff9382c7b1d1033ebdffde15ec847e) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix a bug on the firmware update making the app to be stuck in a single step of the update model while the device updated.

- [#3077](https://github.com/LedgerHQ/ledger-live/pull/3077) [`11badbc999`](https://github.com/LedgerHQ/ledger-live/commit/11badbc9991e26b220bcbdab256b55aa4b295a0d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed upsell triggering even if feature flag is off

- [#3104](https://github.com/LedgerHQ/ledger-live/pull/3104) [`1fdf8e7242`](https://github.com/LedgerHQ/ledger-live/commit/1fdf8e72427367e2082d6ecbbd8ae7b0bee45a7b) Thanks [@Justkant](https://github.com/Justkant)! - fix: recover deeplinks

- [#3087](https://github.com/LedgerHQ/ledger-live/pull/3087) [`9c5be7fa63`](https://github.com/LedgerHQ/ledger-live/commit/9c5be7fa63f9bf793c97ea40c0dbc23b5bf56f86) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Small improvement to the logs viewer debug tool

- [#3116](https://github.com/LedgerHQ/ledger-live/pull/3116) [`37b05b991d`](https://github.com/LedgerHQ/ledger-live/commit/37b05b991db519073a92ad5f4e7784006e8517d4) Thanks [@IAmMorrow](https://github.com/IAmMorrow)! - Fixed a regression on LLD live-app sdk exchange app; backported exchange app from live-app-sdk to wallet-api; added "allow debug apps" in LLM developers menu

- [#3129](https://github.com/LedgerHQ/ledger-live/pull/3129) [`7d0f4855de`](https://github.com/LedgerHQ/ledger-live/commit/7d0f4855de5d6e0c08df9693c957dfa1f09a4bd1) Thanks [@Justkant](https://github.com/Justkant)! - fix: navigation.pop in DeviceConnect

  As it can be used in the Onboarding base navigator now, if you pop by getting the parent, you will pop the BaseNavigator

- [#3099](https://github.com/LedgerHQ/ledger-live/pull/3099) [`e29f7c7bda`](https://github.com/LedgerHQ/ledger-live/commit/e29f7c7bda0444e5d592bd873c894b043eb22417) Thanks [@Justkant](https://github.com/Justkant)! - fix: react-native-webview target="\_blank" on iOS

  Also fix the html5 history.pushState navigation on android
  More infos on both issues below:

  - https://github.com/react-native-webview/react-native-webview/issues/2905
  - https://github.com/react-native-webview/react-native-webview/issues/2667
  - https://github.com/react-native-webview/react-native-webview/pull/2598

- [#3096](https://github.com/LedgerHQ/ledger-live/pull/3096) [`9133f2fa1c`](https://github.com/LedgerHQ/ledger-live/commit/9133f2fa1cfb61a3f00101d33abebfbf3c86d723) Thanks [@RamyEB](https://github.com/RamyEB)! - Remove recently used from search page Discovery 2

- Updated dependencies [[`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4), [`c59bee8935`](https://github.com/LedgerHQ/ledger-live/commit/c59bee89357bb29097fb97ca67ece845630d982a), [`64ee0b2e03`](https://github.com/LedgerHQ/ledger-live/commit/64ee0b2e032187f5b742f594390a5b30d3850751), [`fb65760778`](https://github.com/LedgerHQ/ledger-live/commit/fb6576077854fb21541350a9f7c1cb528fba6e6d), [`a62be79a56`](https://github.com/LedgerHQ/ledger-live/commit/a62be79a56e7aaaf7712fe006d357e3517f1c4b9), [`282cad03fb`](https://github.com/LedgerHQ/ledger-live/commit/282cad03fb733cc71e767b641c53ee2d469b8295), [`5fa4697e8d`](https://github.com/LedgerHQ/ledger-live/commit/5fa4697e8d1cfd1dba0f942745d1bfc6984ae1c9), [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4), [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4)]:
  - @ledgerhq/live-common@29.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.1.0-next.0
  - @ledgerhq/types-live@6.32.0-next.0
  - @ledgerhq/native-ui@0.18.0-next.0
  - @ledgerhq/coin-framework@0.3.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.5-next.0
  - @ledgerhq/domain-service@1.0.0-next.0

## 3.18.0

### Minor Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - feat: ledger recover feature flag

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`e32b1d1d88`](https://github.com/LedgerHQ/ledger-live/commit/e32b1d1d88167a21a555f603bc4983e69db1da20) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Refactored Webviews;
  Added WebPTXPlayer;

- [#2983](https://github.com/LedgerHQ/ledger-live/pull/2983) [`1650a9d074`](https://github.com/LedgerHQ/ledger-live/commit/1650a9d074313f7e966e781732abdc318c1cfb69) Thanks [@lvndry](https://github.com/lvndry)! - Introduce React Testing Library in LLM

- [#2943](https://github.com/LedgerHQ/ledger-live/pull/2943) [`9fdfe8e9ee`](https://github.com/LedgerHQ/ledger-live/commit/9fdfe8e9ee0b0362274311ddcd0e6a0991b47611) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new entry for Date format

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`3749c3d79a`](https://github.com/LedgerHQ/ledger-live/commit/3749c3d79a6a6fd76789880cd44ac32e7f6e8474) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Recover WebView

- [#2327](https://github.com/LedgerHQ/ledger-live/pull/2327) [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e) Thanks [@RamyEB](https://github.com/RamyEB)! - Add Discover v2 UI behind feature flag

### Patch Changes

- [#2935](https://github.com/LedgerHQ/ledger-live/pull/2935) [`2b770e6eb9`](https://github.com/LedgerHQ/ledger-live/commit/2b770e6eb9a0bee8cf5c5eef77f75ba49de8c17d) Thanks [@sarneijim](https://github.com/sarneijim)! - Move stake account button to main account buttons

- [#2996](https://github.com/LedgerHQ/ledger-live/pull/2996) [`ecffe19c8b`](https://github.com/LedgerHQ/ledger-live/commit/ecffe19c8be7a13da20ff909ff65322159e03575) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Hide recover webview header for prod env

- [#2980](https://github.com/LedgerHQ/ledger-live/pull/2980) [`8484021aac`](https://github.com/LedgerHQ/ledger-live/commit/8484021aac9cbbe6f12a162473824a9de9f33028) Thanks [@juan-cortes](https://github.com/juan-cortes)! - allow symbols in env override debug menu

- [#2816](https://github.com/LedgerHQ/ledger-live/pull/2816) [`10fb40d740`](https://github.com/LedgerHQ/ledger-live/commit/10fb40d74091d71543dee69641a7b36b4d823fe6) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add Custom lock screen welcome video on LLM

- [#2879](https://github.com/LedgerHQ/ledger-live/pull/2879) [`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve account generator to support delisted tokens

- [#2988](https://github.com/LedgerHQ/ledger-live/pull/2988) [`6d3814d8c3`](https://github.com/LedgerHQ/ledger-live/commit/6d3814d8c32647b04d82c9655a7ef99ce9f3d315) Thanks [@sarneijim](https://github.com/sarneijim)! - Add stake button as third button in main account actions

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`3ff4c9c3fb`](https://github.com/LedgerHQ/ledger-live/commit/3ff4c9c3fb4f9cf02199ff00364fc9e9464eab84) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix a bug on the firmware update making the app to be stuck in a single step of the update model while the device updated.

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`a2ba8c5c6a`](https://github.com/LedgerHQ/ledger-live/commit/a2ba8c5c6a1c60c625a964cf02f71d1f416c969d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixed upsell triggering even if feature flag is off

- [#3035](https://github.com/LedgerHQ/ledger-live/pull/3035) [`b9c14af6e1`](https://github.com/LedgerHQ/ledger-live/commit/b9c14af6e1d5dfcc105a85aa592d1f78cd7c9543) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Recover - New upsell modal at the end of onboarding for LLM - LNX

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`803fbee943`](https://github.com/LedgerHQ/ledger-live/commit/803fbee943d5cae2f99bd59a118546e3e978f9bd) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: recover deeplinks

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`475f7bea64`](https://github.com/LedgerHQ/ledger-live/commit/475f7bea647731757493535d65a6eb93b26a2634) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: Android native module for location services

  Location services are needed when BLE scanning.
  This Android Native module provides:

  - a method to check and enable if necessary the location service
  - a method to listen to the state (enabled/disabled) of the location service

  Also new hook useAndroidEnableLocation using this native module to simplify enabling location services

- [#2956](https://github.com/LedgerHQ/ledger-live/pull/2956) [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle new restore flags in sync onboarding

- [#2911](https://github.com/LedgerHQ/ledger-live/pull/2911) [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Provide QA with a way of destroying data without uninstalling

- [#3017](https://github.com/LedgerHQ/ledger-live/pull/3017) [`65134b090f`](https://github.com/LedgerHQ/ledger-live/commit/65134b090fb12cfe192134338c7d97f88bad5ebd) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated Lotties on recover flow in LLM

- [#3026](https://github.com/LedgerHQ/ledger-live/pull/3026) [`0b51a77c6c`](https://github.com/LedgerHQ/ledger-live/commit/0b51a77c6c92890d8338417bd388d1fa850a203d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Make exported logs formatted by default

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`af136336a2`](https://github.com/LedgerHQ/ledger-live/commit/af136336a229ef508f7a34e4e7f5368920961823) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new bluetooth requirements error views

  Components handling different requirements error views:

  - bluetooth permissions not granted
  - bluetooth disabled
  - location permissions nos granted (if needed)
  - location disabled (if needed)
    using a new GenericInformationalView component.

  Also some cleaning on error message handling and how some requirements checks were handled

- [#2944](https://github.com/LedgerHQ/ledger-live/pull/2944) [`1fff4d499c`](https://github.com/LedgerHQ/ledger-live/commit/1fff4d499c711b107531319ef69ead8f589d5783) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Drop importDatString from LLM

- [#3037](https://github.com/LedgerHQ/ledger-live/pull/3037) [`7bfd14cbce`](https://github.com/LedgerHQ/ledger-live/commit/7bfd14cbcec3c108737cb7256c3b5b7041d1227c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix e2e tests that broke during redux rework

- [#2963](https://github.com/LedgerHQ/ledger-live/pull/2963) [`40a27aa74c`](https://github.com/LedgerHQ/ledger-live/commit/40a27aa74c5a7d3698684ee5c80a9d29bfc409a5) Thanks [@sarneijim](https://github.com/sarneijim)! - Tezos no funds implementation & track stake account button

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`759f11851d`](https://github.com/LedgerHQ/ledger-live/commit/759f11851da44287873c6f33c4c9f0356ef944e6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: flexible bluetooth requirements check and request with drawer and hook

  Possible more fine-grained requirements check and request (only for BLE connecting, or also BLE scanning) with the usage of useRequireBluetooth + RequiresBluetoothDrawer

  Centralized the generic UI of the drawer content in GenericInformationalDrawerContent

  Implemented drawer + hook bluetooth requirements check and requests for:

  - current device selection component
  - new device selection component
  - SkipSelectDevice component which automatically select the last connected device

  Also added a debug screen for bluetooth requirements check and request

- [#2814](https://github.com/LedgerHQ/ledger-live/pull/2814) [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Adapt UX of install set of apps for missing dependencies

- [#3028](https://github.com/LedgerHQ/ledger-live/pull/3028) [`92a0a67e62`](https://github.com/LedgerHQ/ledger-live/commit/92a0a67e62f7eb56c409928f0898a3dfe4abdc18) Thanks [@RamyEB](https://github.com/RamyEB)! - Warning message when app not Found on DiscoverV2

- [#2978](https://github.com/LedgerHQ/ledger-live/pull/2978) [`c06ebd58f6`](https://github.com/LedgerHQ/ledger-live/commit/c06ebd58f60d90a9de3c332537bc4f99cba2c4f6) Thanks [@sarneijim](https://github.com/sarneijim)! - Add common stake flow to lld

- [#2903](https://github.com/LedgerHQ/ledger-live/pull/2903) [`ba7c9d40b8`](https://github.com/LedgerHQ/ledger-live/commit/ba7c9d40b890b8316b964949c0d0ac5beaa038f5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix UI for add account flow account list screen

- [#2843](https://github.com/LedgerHQ/ledger-live/pull/2843) [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - SyncOnboarding: adapt to changes in VerticalTimeline component
  SyncOnboarding: proper implementation of the "seed" step UI
  SyncOnboarding: add ContinueOnDevice UI element where needed
  StorylyStories: play icon and blurred thumbnail for story groups

- [#2928](https://github.com/LedgerHQ/ledger-live/pull/2928) [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handle failed cases on genuine check during sync onboarding

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`d5fc6ddcce`](https://github.com/LedgerHQ/ledger-live/commit/d5fc6ddcce745240bb7377eda27af984988434f5) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: react-native-webview target="\_blank" on iOS

  Also fix the html5 history.pushState navigation on android
  More infos on both issues below:

  - https://github.com/react-native-webview/react-native-webview/issues/2905
  - https://github.com/react-native-webview/react-native-webview/issues/2667
  - https://github.com/react-native-webview/react-native-webview/pull/2598

- [#2926](https://github.com/LedgerHQ/ledger-live/pull/2926) [`d1b455af86`](https://github.com/LedgerHQ/ledger-live/commit/d1b455af86efb61883251e4801cd808d200662f7) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handle closing sync onboarding after completion

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`7252ae6c8c`](https://github.com/LedgerHQ/ledger-live/commit/7252ae6c8c87c73e47b42e807885f1c575eaf140) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: re-work of bluetooth permissions and services requirements

  New hooks to simplify bluetooth requirements checks and requests
  Re-work of associated components using those hooks

- [#3023](https://github.com/LedgerHQ/ledger-live/pull/3023) [`bbb7d68222`](https://github.com/LedgerHQ/ledger-live/commit/bbb7d6822241ffff0748f1f1f923f3556418c31d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed unnecessary eq id reassignment during the onboarding

- [#2960](https://github.com/LedgerHQ/ledger-live/pull/2960) [`51a0ca9654`](https://github.com/LedgerHQ/ledger-live/commit/51a0ca9654c71efa6fee6ae341f750d91e11048d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent duplicated USB entries on old device selector.
  Fix broken device action modals caused by nanoFTS state hack.
  Fix UI for Android empty USB state, text overflowing.
  Fix add account flow undismissable modal (x/back drop) close.
- Updated dependencies [[`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784), [`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`8340016ef0`](https://github.com/LedgerHQ/ledger-live/commit/8340016ef051927a6701c731ac16842b7caf7023), [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637), [`3b5bd4f8e3`](https://github.com/LedgerHQ/ledger-live/commit/3b5bd4f8e32333eca7eb8c22d9a6cfda22c766f9), [`c60e8c4b86`](https://github.com/LedgerHQ/ledger-live/commit/c60e8c4b862177e5adab2bc5eeb74313a5c2b2a9), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`9d15eb2e2f`](https://github.com/LedgerHQ/ledger-live/commit/9d15eb2e2f6b72bf796b12daa88736b03873857b), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`57c52a9fca`](https://github.com/LedgerHQ/ledger-live/commit/57c52a9fca18595e5fe6b0a81fc7b5967b2ca74c), [`496df9da72`](https://github.com/LedgerHQ/ledger-live/commit/496df9da7216d792d74c7cc22be68fb30415325c), [`9f55124458`](https://github.com/LedgerHQ/ledger-live/commit/9f551244584c20638e1eec2d984dd725fe2688f6), [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3), [`9b22d499f2`](https://github.com/LedgerHQ/ledger-live/commit/9b22d499f2d0e62d78dbe178808d5fa392d22dda), [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625), [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2), [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b), [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e), [`ae211bda45`](https://github.com/LedgerHQ/ledger-live/commit/ae211bda45192e1575c6c7656dfad68c7dd93ffe), [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19), [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c)]:
  - @ledgerhq/live-common@29.2.0
  - @ledgerhq/coin-framework@0.2.1
  - @ledgerhq/errors@6.12.4
  - @ledgerhq/native-ui@0.17.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.4
  - @ledgerhq/devices@8.0.1
  - @ledgerhq/hw-transport@6.28.2
  - @ledgerhq/hw-transport-http@6.27.13
  - @ledgerhq/react-native-hid@6.29.1

## 3.18.0-next.7

### Patch Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`3ff4c9c3fb`](https://github.com/LedgerHQ/ledger-live/commit/3ff4c9c3fb4f9cf02199ff00364fc9e9464eab84) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix a bug on the firmware update making the app to be stuck in a single step of the update model while the device updated.

## 3.18.0-next.6

### Minor Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - feat: ledger recover feature flag

### Patch Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`803fbee943`](https://github.com/LedgerHQ/ledger-live/commit/803fbee943d5cae2f99bd59a118546e3e978f9bd) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: recover deeplinks

- Updated dependencies [[`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784)]:
  - @ledgerhq/live-common@29.2.0-next.1

## 3.18.0-next.5

### Patch Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`d5fc6ddcce`](https://github.com/LedgerHQ/ledger-live/commit/d5fc6ddcce745240bb7377eda27af984988434f5) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: react-native-webview target="\_blank" on iOS

  Also fix the html5 history.pushState navigation on android
  More infos on both issues below:

  - https://github.com/react-native-webview/react-native-webview/issues/2905
  - https://github.com/react-native-webview/react-native-webview/issues/2667
  - https://github.com/react-native-webview/react-native-webview/pull/2598

## 3.18.0-next.4

### Patch Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`a2ba8c5c6a`](https://github.com/LedgerHQ/ledger-live/commit/a2ba8c5c6a1c60c625a964cf02f71d1f416c969d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixed upsell triggering even if feature flag is off

## 3.18.0-next.3

### Patch Changes

- Updated dependencies [[`57c52a9fca`](https://github.com/LedgerHQ/ledger-live/commit/57c52a9fca18595e5fe6b0a81fc7b5967b2ca74c)]:
  - @ledgerhq/react-native-hw-transport-ble@6.28.4-next.1

## 3.18.0-next.2

### Minor Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`3749c3d79a`](https://github.com/LedgerHQ/ledger-live/commit/3749c3d79a6a6fd76789880cd44ac32e7f6e8474) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Recover WebView

## 3.18.0-next.1

### Minor Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`e32b1d1d88`](https://github.com/LedgerHQ/ledger-live/commit/e32b1d1d88167a21a555f603bc4983e69db1da20) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Refactored Webviews;
  Added WebPTXPlayer;

## 3.18.0-next.0

### Minor Changes

- [#2983](https://github.com/LedgerHQ/ledger-live/pull/2983) [`1650a9d074`](https://github.com/LedgerHQ/ledger-live/commit/1650a9d074313f7e966e781732abdc318c1cfb69) Thanks [@lvndry](https://github.com/lvndry)! - Introduce React Testing Library in LLM

- [#2943](https://github.com/LedgerHQ/ledger-live/pull/2943) [`9fdfe8e9ee`](https://github.com/LedgerHQ/ledger-live/commit/9fdfe8e9ee0b0362274311ddcd0e6a0991b47611) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new entry for Date format

- [#2327](https://github.com/LedgerHQ/ledger-live/pull/2327) [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e) Thanks [@RamyEB](https://github.com/RamyEB)! - Add Discover v2 UI behind feature flag

### Patch Changes

- [#2935](https://github.com/LedgerHQ/ledger-live/pull/2935) [`2b770e6eb9`](https://github.com/LedgerHQ/ledger-live/commit/2b770e6eb9a0bee8cf5c5eef77f75ba49de8c17d) Thanks [@sarneijim](https://github.com/sarneijim)! - Move stake account button to main account buttons

- [#2996](https://github.com/LedgerHQ/ledger-live/pull/2996) [`ecffe19c8b`](https://github.com/LedgerHQ/ledger-live/commit/ecffe19c8be7a13da20ff909ff65322159e03575) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Hide recover webview header for prod env

- [#2980](https://github.com/LedgerHQ/ledger-live/pull/2980) [`8484021aac`](https://github.com/LedgerHQ/ledger-live/commit/8484021aac9cbbe6f12a162473824a9de9f33028) Thanks [@juan-cortes](https://github.com/juan-cortes)! - allow symbols in env override debug menu

- [#2816](https://github.com/LedgerHQ/ledger-live/pull/2816) [`10fb40d740`](https://github.com/LedgerHQ/ledger-live/commit/10fb40d74091d71543dee69641a7b36b4d823fe6) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add Custom lock screen welcome video on LLM

- [#2879](https://github.com/LedgerHQ/ledger-live/pull/2879) [`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve account generator to support delisted tokens

- [#2988](https://github.com/LedgerHQ/ledger-live/pull/2988) [`6d3814d8c3`](https://github.com/LedgerHQ/ledger-live/commit/6d3814d8c32647b04d82c9655a7ef99ce9f3d315) Thanks [@sarneijim](https://github.com/sarneijim)! - Add stake button as third button in main account actions

- [#3035](https://github.com/LedgerHQ/ledger-live/pull/3035) [`b9c14af6e1`](https://github.com/LedgerHQ/ledger-live/commit/b9c14af6e1d5dfcc105a85aa592d1f78cd7c9543) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Recover - New upsell modal at the end of onboarding for LLM - LNX

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`475f7bea64`](https://github.com/LedgerHQ/ledger-live/commit/475f7bea647731757493535d65a6eb93b26a2634) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: Android native module for location services

  Location services are needed when BLE scanning.
  This Android Native module provides:

  - a method to check and enable if necessary the location service
  - a method to listen to the state (enabled/disabled) of the location service

  Also new hook useAndroidEnableLocation using this native module to simplify enabling location services

- [#2956](https://github.com/LedgerHQ/ledger-live/pull/2956) [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle new restore flags in sync onboarding

- [#2911](https://github.com/LedgerHQ/ledger-live/pull/2911) [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Provide QA with a way of destroying data without uninstalling

- [#3017](https://github.com/LedgerHQ/ledger-live/pull/3017) [`65134b090f`](https://github.com/LedgerHQ/ledger-live/commit/65134b090fb12cfe192134338c7d97f88bad5ebd) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated Lotties on recover flow in LLM

- [#3026](https://github.com/LedgerHQ/ledger-live/pull/3026) [`0b51a77c6c`](https://github.com/LedgerHQ/ledger-live/commit/0b51a77c6c92890d8338417bd388d1fa850a203d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Make exported logs formatted by default

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`af136336a2`](https://github.com/LedgerHQ/ledger-live/commit/af136336a229ef508f7a34e4e7f5368920961823) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new bluetooth requirements error views

  Components handling different requirements error views:

  - bluetooth permissions not granted
  - bluetooth disabled
  - location permissions nos granted (if needed)
  - location disabled (if needed)
    using a new GenericInformationalView component.

  Also some cleaning on error message handling and how some requirements checks were handled

- [#2944](https://github.com/LedgerHQ/ledger-live/pull/2944) [`1fff4d499c`](https://github.com/LedgerHQ/ledger-live/commit/1fff4d499c711b107531319ef69ead8f589d5783) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Drop importDatString from LLM

- [#3037](https://github.com/LedgerHQ/ledger-live/pull/3037) [`7bfd14cbce`](https://github.com/LedgerHQ/ledger-live/commit/7bfd14cbcec3c108737cb7256c3b5b7041d1227c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix e2e tests that broke during redux rework

- [#2963](https://github.com/LedgerHQ/ledger-live/pull/2963) [`40a27aa74c`](https://github.com/LedgerHQ/ledger-live/commit/40a27aa74c5a7d3698684ee5c80a9d29bfc409a5) Thanks [@sarneijim](https://github.com/sarneijim)! - Tezos no funds implementation & track stake account button

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`759f11851d`](https://github.com/LedgerHQ/ledger-live/commit/759f11851da44287873c6f33c4c9f0356ef944e6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: flexible bluetooth requirements check and request with drawer and hook

  Possible more fine-grained requirements check and request (only for BLE connecting, or also BLE scanning) with the usage of useRequireBluetooth + RequiresBluetoothDrawer

  Centralized the generic UI of the drawer content in GenericInformationalDrawerContent

  Implemented drawer + hook bluetooth requirements check and requests for:

  - current device selection component
  - new device selection component
  - SkipSelectDevice component which automatically select the last connected device

  Also added a debug screen for bluetooth requirements check and request

- [#2814](https://github.com/LedgerHQ/ledger-live/pull/2814) [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Adapt UX of install set of apps for missing dependencies

- [#3028](https://github.com/LedgerHQ/ledger-live/pull/3028) [`92a0a67e62`](https://github.com/LedgerHQ/ledger-live/commit/92a0a67e62f7eb56c409928f0898a3dfe4abdc18) Thanks [@RamyEB](https://github.com/RamyEB)! - Warning message when app not Found on DiscoverV2

- [#2978](https://github.com/LedgerHQ/ledger-live/pull/2978) [`c06ebd58f6`](https://github.com/LedgerHQ/ledger-live/commit/c06ebd58f60d90a9de3c332537bc4f99cba2c4f6) Thanks [@sarneijim](https://github.com/sarneijim)! - Add common stake flow to lld

- [#2903](https://github.com/LedgerHQ/ledger-live/pull/2903) [`ba7c9d40b8`](https://github.com/LedgerHQ/ledger-live/commit/ba7c9d40b890b8316b964949c0d0ac5beaa038f5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix UI for add account flow account list screen

- [#2843](https://github.com/LedgerHQ/ledger-live/pull/2843) [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - SyncOnboarding: adapt to changes in VerticalTimeline component
  SyncOnboarding: proper implementation of the "seed" step UI
  SyncOnboarding: add ContinueOnDevice UI element where needed
  StorylyStories: play icon and blurred thumbnail for story groups

- [#2928](https://github.com/LedgerHQ/ledger-live/pull/2928) [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handle failed cases on genuine check during sync onboarding

- [#2926](https://github.com/LedgerHQ/ledger-live/pull/2926) [`d1b455af86`](https://github.com/LedgerHQ/ledger-live/commit/d1b455af86efb61883251e4801cd808d200662f7) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handle closing sync onboarding after completion

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`7252ae6c8c`](https://github.com/LedgerHQ/ledger-live/commit/7252ae6c8c87c73e47b42e807885f1c575eaf140) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: re-work of bluetooth permissions and services requirements

  New hooks to simplify bluetooth requirements checks and requests
  Re-work of associated components using those hooks

- [#3023](https://github.com/LedgerHQ/ledger-live/pull/3023) [`bbb7d68222`](https://github.com/LedgerHQ/ledger-live/commit/bbb7d6822241ffff0748f1f1f923f3556418c31d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Fixed unnecessary eq id reassignment during the onboarding

- [#2960](https://github.com/LedgerHQ/ledger-live/pull/2960) [`51a0ca9654`](https://github.com/LedgerHQ/ledger-live/commit/51a0ca9654c71efa6fee6ae341f750d91e11048d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent duplicated USB entries on old device selector.
  Fix broken device action modals caused by nanoFTS state hack.
  Fix UI for Android empty USB state, text overflowing.
  Fix add account flow undismissable modal (x/back drop) close.
- Updated dependencies [[`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`8340016ef0`](https://github.com/LedgerHQ/ledger-live/commit/8340016ef051927a6701c731ac16842b7caf7023), [`61848df7ef`](https://github.com/LedgerHQ/ledger-live/commit/61848df7eff1abfef330585ca96b1688c858c637), [`3b5bd4f8e3`](https://github.com/LedgerHQ/ledger-live/commit/3b5bd4f8e32333eca7eb8c22d9a6cfda22c766f9), [`c60e8c4b86`](https://github.com/LedgerHQ/ledger-live/commit/c60e8c4b862177e5adab2bc5eeb74313a5c2b2a9), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`9d15eb2e2f`](https://github.com/LedgerHQ/ledger-live/commit/9d15eb2e2f6b72bf796b12daa88736b03873857b), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`496df9da72`](https://github.com/LedgerHQ/ledger-live/commit/496df9da7216d792d74c7cc22be68fb30415325c), [`9f55124458`](https://github.com/LedgerHQ/ledger-live/commit/9f551244584c20638e1eec2d984dd725fe2688f6), [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3), [`9b22d499f2`](https://github.com/LedgerHQ/ledger-live/commit/9b22d499f2d0e62d78dbe178808d5fa392d22dda), [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625), [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2), [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b), [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e), [`ae211bda45`](https://github.com/LedgerHQ/ledger-live/commit/ae211bda45192e1575c6c7656dfad68c7dd93ffe), [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19), [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c)]:
  - @ledgerhq/coin-framework@0.2.1-next.0
  - @ledgerhq/errors@6.12.4-next.0
  - @ledgerhq/live-common@29.2.0-next.0
  - @ledgerhq/native-ui@0.17.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.4-next.0
  - @ledgerhq/devices@8.0.1-next.0
  - @ledgerhq/hw-transport@6.28.2-next.0
  - @ledgerhq/hw-transport-http@6.27.13-next.0
  - @ledgerhq/react-native-hid@6.29.1-next.0

## 3.17.0

### Minor Changes

- [#2804](https://github.com/LedgerHQ/ledger-live/pull/2804) [`f0c83f37fc`](https://github.com/LedgerHQ/ledger-live/commit/f0c83f37fc0dc00d2cb78d0e977b3b401a92d3fc) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add dynamic content to the sync onboarding "Secret Recovery Phrase" step based on the user selection on the device

- [#2744](https://github.com/LedgerHQ/ledger-live/pull/2744) [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

- [#2192](https://github.com/LedgerHQ/ledger-live/pull/2192) [`6b224e1d2d`](https://github.com/LedgerHQ/ledger-live/commit/6b224e1d2d855d11d5bc8666fd6e2e08b6f88676) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - fix token not selectable in send flow

- [#2812](https://github.com/LedgerHQ/ledger-live/pull/2812) [`177eb29f7f`](https://github.com/LedgerHQ/ledger-live/commit/177eb29f7f002f0bb0ab7e9788e4125e88853479) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add floor price to nft gallery item

### Patch Changes

- [#2736](https://github.com/LedgerHQ/ledger-live/pull/2736) [`475b854946`](https://github.com/LedgerHQ/ledger-live/commit/475b85494698f94286c97b31bae37ce951480e22) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed detox E2E test after removing autolock-timeout

- [#2905](https://github.com/LedgerHQ/ledger-live/pull/2905) [`d9379f4730`](https://github.com/LedgerHQ/ledger-live/commit/d9379f4730099116b4f47822880f1e996896445b) Thanks [@sarneijim](https://github.com/sarneijim)! - Add noFunds modal to LLM

- [#2750](https://github.com/LedgerHQ/ledger-live/pull/2750) [`8b61e7638b`](https://github.com/LedgerHQ/ledger-live/commit/8b61e7638bf6355f8e62a5f89c6cbe6ecc1a2b9b) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed hierarchy issue causing Auth screen to render behind app in Android

- [#2833](https://github.com/LedgerHQ/ledger-live/pull/2833) [`552037fcec`](https://github.com/LedgerHQ/ledger-live/commit/552037fcec4fc09d7735e8aecd84f98ee4e0d1bf) Thanks [@grsoares21](https://github.com/grsoares21)! - Minor bug fix to prevent the ServiceWidget to appear below the new device selection screen when scanning and pairing in the My Ledger tab.

- [#2737](https://github.com/LedgerHQ/ledger-live/pull/2737) [`198e7203f6`](https://github.com/LedgerHQ/ledger-live/commit/198e7203f67edad003813ebd41bf6bc7034546e3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Implement UI for disabled install button on my ledger llm

- [#2778](https://github.com/LedgerHQ/ledger-live/pull/2778) [`76a03adae6`](https://github.com/LedgerHQ/ledger-live/commit/76a03adae69309d75031abecc6ef4c1878576e68) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Prevent WebView closure from OS back button if Ledger Recover

- [#2766](https://github.com/LedgerHQ/ledger-live/pull/2766) [`93ea7c84a0`](https://github.com/LedgerHQ/ledger-live/commit/93ea7c84a0b76de7cb2869b53d42158be0a21ce1) Thanks [@Justkant](https://github.com/Justkant)! - fix: android webview camera and audio

  Also updates the `react-native-webview` package

- [#2834](https://github.com/LedgerHQ/ledger-live/pull/2834) [`2b04ef7874`](https://github.com/LedgerHQ/ledger-live/commit/2b04ef7874232ecd044fc66342817f7d31fc53b6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix UI bug on NFT CLS device selector

- [#2914](https://github.com/LedgerHQ/ledger-live/pull/2914) [`56adbff8fb`](https://github.com/LedgerHQ/ledger-live/commit/56adbff8fbb102edcbdf35cf80dfdf3b7cd84f7f) Thanks [@sarneijim](https://github.com/sarneijim)! - Implement no funds modal in stake button

- [#2670](https://github.com/LedgerHQ/ledger-live/pull/2670) [`aa7f51af07`](https://github.com/LedgerHQ/ledger-live/commit/aa7f51af0771e39d9a6307d291549dc36ad4277f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix bug in device language prompt detection

- [#2823](https://github.com/LedgerHQ/ledger-live/pull/2823) [`e363d83a69`](https://github.com/LedgerHQ/ledger-live/commit/e363d83a696c6cae20d7fcff3f2da6eea168d98b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix the prompt loop on receive flow

- [#2740](https://github.com/LedgerHQ/ledger-live/pull/2740) [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a) Thanks [@Justkant](https://github.com/Justkant)! - fix(DeviceConnect): remove onError handler

  The error is already handled by the UI in `DeviceActionModal`
  Also adds a correct title to this screen and fixes the `SafeAreaView`

- [#2663](https://github.com/LedgerHQ/ledger-live/pull/2663) [`4c6912f679`](https://github.com/LedgerHQ/ledger-live/commit/4c6912f679bb90429de2f434eafe7aca22120cea) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add analytics to the sync onboarding, install/restore apps, claim NFT flow and generics

- [#2900](https://github.com/LedgerHQ/ledger-live/pull/2900) [`f21f62169e`](https://github.com/LedgerHQ/ledger-live/commit/f21f62169ee40e61f9105ac9666e9460bc9590e5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fixed illustration for Stax on language change prompt

- [#2733](https://github.com/LedgerHQ/ledger-live/pull/2733) [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix up some warnings at launch

- [#2849](https://github.com/LedgerHQ/ledger-live/pull/2849) [`292069c492`](https://github.com/LedgerHQ/ledger-live/commit/292069c49232777f5088ff9b7ddff5b41acf3c40) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - fix(StartupTimeMarker): catch error and prevent re-invocation of native method

- [#2885](https://github.com/LedgerHQ/ledger-live/pull/2885) [`da115c7416`](https://github.com/LedgerHQ/ledger-live/commit/da115c7416204177fab709623cd8f76f5c38c3f8) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - New deeplinks + refactoring of deeplinks wrapper in LLM

- [#2797](https://github.com/LedgerHQ/ledger-live/pull/2797) [`d7eee4ae34`](https://github.com/LedgerHQ/ledger-live/commit/d7eee4ae34f20f9d0a87558cc42788b93c8915f3) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - fix claim NFT "redirection after a timeout if no QR code scan" which was still effective outside of the QR code scan screen

- [#2742](https://github.com/LedgerHQ/ledger-live/pull/2742) [`67f6a47799`](https://github.com/LedgerHQ/ledger-live/commit/67f6a4779913f7c33c700aa4387c0dd2015e54fe) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve Firmware update banner logic on LLM

- [#2884](https://github.com/LedgerHQ/ledger-live/pull/2884) [`0495c5e791`](https://github.com/LedgerHQ/ledger-live/commit/0495c5e7915593da97a39af5c441075a87802853) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Renamed Portuguese to Portuguese Brazilian

- [#2735](https://github.com/LedgerHQ/ledger-live/pull/2735) [`d42eceaeae`](https://github.com/LedgerHQ/ledger-live/commit/d42eceaeae51a128b45aa70285f7c5b47013a4dd) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix the main transfer button animation on LLM

- [#2887](https://github.com/LedgerHQ/ledger-live/pull/2887) [`347e29c32f`](https://github.com/LedgerHQ/ledger-live/commit/347e29c32f6328b3edd2fb218b3cece6ce0d58d5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - LLM - Recover - Update support url (nanoX)

- [#2742](https://github.com/LedgerHQ/ledger-live/pull/2742) [`9a83fcd1cd`](https://github.com/LedgerHQ/ledger-live/commit/9a83fcd1cd534f4685f425369ec50a932d823d1d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow USB detection app wide on LLM

- [#2775](https://github.com/LedgerHQ/ledger-live/pull/2775) [`ed076170b7`](https://github.com/LedgerHQ/ledger-live/commit/ed076170b742125cf3b79c52606a5b5e5d8d9068) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Hide WebView header if it's Ledger Recover

- [#2906](https://github.com/LedgerHQ/ledger-live/pull/2906) [`bee4c7cafb`](https://github.com/LedgerHQ/ledger-live/commit/bee4c7cafb274637692a71c0aef13c275f1650b0) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - New Wallet Connect Entry point in LLM portfolio header. Protected with upsell modal when in reborn mode

- [#2767](https://github.com/LedgerHQ/ledger-live/pull/2767) [`f040f6d2c1`](https://github.com/LedgerHQ/ledger-live/commit/f040f6d2c181647da9c283fa92bae8252b07b6e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a lint rule to avoid untranslated strings

- [#2637](https://github.com/LedgerHQ/ledger-live/pull/2637) [`fdeb033800`](https://github.com/LedgerHQ/ledger-live/commit/fdeb033800d3f749ff992b9bffdcfabd1647d8d9) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Post onboarding analytics

- [#2788](https://github.com/LedgerHQ/ledger-live/pull/2788) [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4) Thanks [@Justkant](https://github.com/Justkant)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- Updated dependencies [[`3460d0908b`](https://github.com/LedgerHQ/ledger-live/commit/3460d0908b6a4fb0f1ff280545cc37644166b06b), [`47e3ef84ba`](https://github.com/LedgerHQ/ledger-live/commit/47e3ef84bad0e93d6f1d8f921b3fb2aa04240065), [`897f42df13`](https://github.com/LedgerHQ/ledger-live/commit/897f42df1389768f66882172341be600e09f1791), [`9ec0582d2a`](https://github.com/LedgerHQ/ledger-live/commit/9ec0582d2ae8ee57884531d4d104a3724735a2c2), [`b947934b68`](https://github.com/LedgerHQ/ledger-live/commit/b947934b68f351f81e3f7f8031bfe52743948fe6), [`24bc5674d2`](https://github.com/LedgerHQ/ledger-live/commit/24bc5674d28009a032bb421e20f7a480b0557e29), [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba), [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a), [`ab0781e7cb`](https://github.com/LedgerHQ/ledger-live/commit/ab0781e7cb0ab191519a4860ccc6c7f6a472b500), [`a87ee27900`](https://github.com/LedgerHQ/ledger-live/commit/a87ee27900ec062bccc0e4cf453b4d2112f83ada), [`ebe618881d`](https://github.com/LedgerHQ/ledger-live/commit/ebe618881d9e9c7159d7a9fe135e18b0cb2fde8f), [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb), [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef), [`ef5835035b`](https://github.com/LedgerHQ/ledger-live/commit/ef5835035b93bb06f9cfbbb9da74ec2b2a53c5a7), [`f2968d5706`](https://github.com/LedgerHQ/ledger-live/commit/f2968d57065bd0b5219f97029887a2f61390ac27), [`684c10d10a`](https://github.com/LedgerHQ/ledger-live/commit/684c10d10a51337e22b838e3ae6465721477c4de), [`0f99b5dc44`](https://github.com/LedgerHQ/ledger-live/commit/0f99b5dc44f0e4f44e4199e80d40fb1bc5a88853), [`8787e31a55`](https://github.com/LedgerHQ/ledger-live/commit/8787e31a5566f1291fc762eb4287bcc0e5f2b509), [`0840cfeab8`](https://github.com/LedgerHQ/ledger-live/commit/0840cfeab8d7d3a75def5de22285b913ad049d5a), [`0207d76b15`](https://github.com/LedgerHQ/ledger-live/commit/0207d76b15dca7128aea720b1663c58a12f42967), [`7daaa8f750`](https://github.com/LedgerHQ/ledger-live/commit/7daaa8f75029927459b8132befcd6a20b3ef8e17), [`01a33f58ba`](https://github.com/LedgerHQ/ledger-live/commit/01a33f58ba6c5518045546e8f38be3f05fc2a935), [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4), [`16cad60fb0`](https://github.com/LedgerHQ/ledger-live/commit/16cad60fb0d21752fae5e3db6d0100ef5396e0a4)]:
  - @ledgerhq/live-common@29.1.0
  - @ledgerhq/native-ui@0.16.0
  - @ledgerhq/react-native-hid@6.29.0

## 3.17.0-next.0

### Minor Changes

- [#2804](https://github.com/LedgerHQ/ledger-live/pull/2804) [`f0c83f37fc`](https://github.com/LedgerHQ/ledger-live/commit/f0c83f37fc0dc00d2cb78d0e977b3b401a92d3fc) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add dynamic content to the sync onboarding "Secret Recovery Phrase" step based on the user selection on the device

- [#2744](https://github.com/LedgerHQ/ledger-live/pull/2744) [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

- [#2192](https://github.com/LedgerHQ/ledger-live/pull/2192) [`6b224e1d2d`](https://github.com/LedgerHQ/ledger-live/commit/6b224e1d2d855d11d5bc8666fd6e2e08b6f88676) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - fix token not selectable in send flow

- [#2812](https://github.com/LedgerHQ/ledger-live/pull/2812) [`177eb29f7f`](https://github.com/LedgerHQ/ledger-live/commit/177eb29f7f002f0bb0ab7e9788e4125e88853479) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add floor price to nft gallery item

### Patch Changes

- [#2736](https://github.com/LedgerHQ/ledger-live/pull/2736) [`475b854946`](https://github.com/LedgerHQ/ledger-live/commit/475b85494698f94286c97b31bae37ce951480e22) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed detox E2E test after removing autolock-timeout

- [#2905](https://github.com/LedgerHQ/ledger-live/pull/2905) [`d9379f4730`](https://github.com/LedgerHQ/ledger-live/commit/d9379f4730099116b4f47822880f1e996896445b) Thanks [@sarneijim](https://github.com/sarneijim)! - Add noFunds modal to LLM

- [#2750](https://github.com/LedgerHQ/ledger-live/pull/2750) [`8b61e7638b`](https://github.com/LedgerHQ/ledger-live/commit/8b61e7638bf6355f8e62a5f89c6cbe6ecc1a2b9b) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed hierarchy issue causing Auth screen to render behind app in Android

- [#2833](https://github.com/LedgerHQ/ledger-live/pull/2833) [`552037fcec`](https://github.com/LedgerHQ/ledger-live/commit/552037fcec4fc09d7735e8aecd84f98ee4e0d1bf) Thanks [@grsoares21](https://github.com/grsoares21)! - Minor bug fix to prevent the ServiceWidget to appear below the new device selection screen when scanning and pairing in the My Ledger tab.

- [#2737](https://github.com/LedgerHQ/ledger-live/pull/2737) [`198e7203f6`](https://github.com/LedgerHQ/ledger-live/commit/198e7203f67edad003813ebd41bf6bc7034546e3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Implement UI for disabled install button on my ledger llm

- [#2778](https://github.com/LedgerHQ/ledger-live/pull/2778) [`76a03adae6`](https://github.com/LedgerHQ/ledger-live/commit/76a03adae69309d75031abecc6ef4c1878576e68) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Prevent WebView closure from OS back button if Ledger Recover

- [#2766](https://github.com/LedgerHQ/ledger-live/pull/2766) [`93ea7c84a0`](https://github.com/LedgerHQ/ledger-live/commit/93ea7c84a0b76de7cb2869b53d42158be0a21ce1) Thanks [@Justkant](https://github.com/Justkant)! - fix: android webview camera and audio

  Also updates the `react-native-webview` package

- [#2834](https://github.com/LedgerHQ/ledger-live/pull/2834) [`2b04ef7874`](https://github.com/LedgerHQ/ledger-live/commit/2b04ef7874232ecd044fc66342817f7d31fc53b6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix UI bug on NFT CLS device selector

- [#2914](https://github.com/LedgerHQ/ledger-live/pull/2914) [`56adbff8fb`](https://github.com/LedgerHQ/ledger-live/commit/56adbff8fbb102edcbdf35cf80dfdf3b7cd84f7f) Thanks [@sarneijim](https://github.com/sarneijim)! - Implement no funds modal in stake button

- [#2670](https://github.com/LedgerHQ/ledger-live/pull/2670) [`aa7f51af07`](https://github.com/LedgerHQ/ledger-live/commit/aa7f51af0771e39d9a6307d291549dc36ad4277f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix bug in device language prompt detection

- [#2823](https://github.com/LedgerHQ/ledger-live/pull/2823) [`e363d83a69`](https://github.com/LedgerHQ/ledger-live/commit/e363d83a696c6cae20d7fcff3f2da6eea168d98b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix the prompt loop on receive flow

- [#2740](https://github.com/LedgerHQ/ledger-live/pull/2740) [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a) Thanks [@Justkant](https://github.com/Justkant)! - fix(DeviceConnect): remove onError handler

  The error is already handled by the UI in `DeviceActionModal`
  Also adds a correct title to this screen and fixes the `SafeAreaView`

- [#2663](https://github.com/LedgerHQ/ledger-live/pull/2663) [`4c6912f679`](https://github.com/LedgerHQ/ledger-live/commit/4c6912f679bb90429de2f434eafe7aca22120cea) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add analytics to the sync onboarding, install/restore apps, claim NFT flow and generics

- [#2900](https://github.com/LedgerHQ/ledger-live/pull/2900) [`f21f62169e`](https://github.com/LedgerHQ/ledger-live/commit/f21f62169ee40e61f9105ac9666e9460bc9590e5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fixed illustration for Stax on language change prompt

- [#2733](https://github.com/LedgerHQ/ledger-live/pull/2733) [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix up some warnings at launch

- [#2849](https://github.com/LedgerHQ/ledger-live/pull/2849) [`292069c492`](https://github.com/LedgerHQ/ledger-live/commit/292069c49232777f5088ff9b7ddff5b41acf3c40) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - fix(StartupTimeMarker): catch error and prevent re-invocation of native method

- [#2885](https://github.com/LedgerHQ/ledger-live/pull/2885) [`da115c7416`](https://github.com/LedgerHQ/ledger-live/commit/da115c7416204177fab709623cd8f76f5c38c3f8) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - New deeplinks + refactoring of deeplinks wrapper in LLM

- [#2797](https://github.com/LedgerHQ/ledger-live/pull/2797) [`d7eee4ae34`](https://github.com/LedgerHQ/ledger-live/commit/d7eee4ae34f20f9d0a87558cc42788b93c8915f3) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - fix claim NFT "redirection after a timeout if no QR code scan" which was still effective outside of the QR code scan screen

- [#2742](https://github.com/LedgerHQ/ledger-live/pull/2742) [`67f6a47799`](https://github.com/LedgerHQ/ledger-live/commit/67f6a4779913f7c33c700aa4387c0dd2015e54fe) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve Firmware update banner logic on LLM

- [#2884](https://github.com/LedgerHQ/ledger-live/pull/2884) [`0495c5e791`](https://github.com/LedgerHQ/ledger-live/commit/0495c5e7915593da97a39af5c441075a87802853) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Renamed Portuguese to Portuguese Brazilian

- [#2735](https://github.com/LedgerHQ/ledger-live/pull/2735) [`d42eceaeae`](https://github.com/LedgerHQ/ledger-live/commit/d42eceaeae51a128b45aa70285f7c5b47013a4dd) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix the main transfer button animation on LLM

- [#2887](https://github.com/LedgerHQ/ledger-live/pull/2887) [`347e29c32f`](https://github.com/LedgerHQ/ledger-live/commit/347e29c32f6328b3edd2fb218b3cece6ce0d58d5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - LLM - Recover - Update support url (nanoX)

- [#2742](https://github.com/LedgerHQ/ledger-live/pull/2742) [`9a83fcd1cd`](https://github.com/LedgerHQ/ledger-live/commit/9a83fcd1cd534f4685f425369ec50a932d823d1d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow USB detection app wide on LLM

- [#2775](https://github.com/LedgerHQ/ledger-live/pull/2775) [`ed076170b7`](https://github.com/LedgerHQ/ledger-live/commit/ed076170b742125cf3b79c52606a5b5e5d8d9068) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Hide WebView header if it's Ledger Recover

- [#2906](https://github.com/LedgerHQ/ledger-live/pull/2906) [`bee4c7cafb`](https://github.com/LedgerHQ/ledger-live/commit/bee4c7cafb274637692a71c0aef13c275f1650b0) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - New Wallet Connect Entry point in LLM portfolio header. Protected with upsell modal when in reborn mode

- [#2767](https://github.com/LedgerHQ/ledger-live/pull/2767) [`f040f6d2c1`](https://github.com/LedgerHQ/ledger-live/commit/f040f6d2c181647da9c283fa92bae8252b07b6e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a lint rule to avoid untranslated strings

- [#2637](https://github.com/LedgerHQ/ledger-live/pull/2637) [`fdeb033800`](https://github.com/LedgerHQ/ledger-live/commit/fdeb033800d3f749ff992b9bffdcfabd1647d8d9) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Post onboarding analytics

- [#2788](https://github.com/LedgerHQ/ledger-live/pull/2788) [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4) Thanks [@Justkant](https://github.com/Justkant)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- Updated dependencies [[`3460d0908b`](https://github.com/LedgerHQ/ledger-live/commit/3460d0908b6a4fb0f1ff280545cc37644166b06b), [`47e3ef84ba`](https://github.com/LedgerHQ/ledger-live/commit/47e3ef84bad0e93d6f1d8f921b3fb2aa04240065), [`897f42df13`](https://github.com/LedgerHQ/ledger-live/commit/897f42df1389768f66882172341be600e09f1791), [`9ec0582d2a`](https://github.com/LedgerHQ/ledger-live/commit/9ec0582d2ae8ee57884531d4d104a3724735a2c2), [`b947934b68`](https://github.com/LedgerHQ/ledger-live/commit/b947934b68f351f81e3f7f8031bfe52743948fe6), [`24bc5674d2`](https://github.com/LedgerHQ/ledger-live/commit/24bc5674d28009a032bb421e20f7a480b0557e29), [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba), [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a), [`ab0781e7cb`](https://github.com/LedgerHQ/ledger-live/commit/ab0781e7cb0ab191519a4860ccc6c7f6a472b500), [`a87ee27900`](https://github.com/LedgerHQ/ledger-live/commit/a87ee27900ec062bccc0e4cf453b4d2112f83ada), [`ebe618881d`](https://github.com/LedgerHQ/ledger-live/commit/ebe618881d9e9c7159d7a9fe135e18b0cb2fde8f), [`0272d44dff`](https://github.com/LedgerHQ/ledger-live/commit/0272d44dff11e356858f666b962b65025d2029eb), [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef), [`ef5835035b`](https://github.com/LedgerHQ/ledger-live/commit/ef5835035b93bb06f9cfbbb9da74ec2b2a53c5a7), [`f2968d5706`](https://github.com/LedgerHQ/ledger-live/commit/f2968d57065bd0b5219f97029887a2f61390ac27), [`684c10d10a`](https://github.com/LedgerHQ/ledger-live/commit/684c10d10a51337e22b838e3ae6465721477c4de), [`0f99b5dc44`](https://github.com/LedgerHQ/ledger-live/commit/0f99b5dc44f0e4f44e4199e80d40fb1bc5a88853), [`8787e31a55`](https://github.com/LedgerHQ/ledger-live/commit/8787e31a5566f1291fc762eb4287bcc0e5f2b509), [`0840cfeab8`](https://github.com/LedgerHQ/ledger-live/commit/0840cfeab8d7d3a75def5de22285b913ad049d5a), [`0207d76b15`](https://github.com/LedgerHQ/ledger-live/commit/0207d76b15dca7128aea720b1663c58a12f42967), [`7daaa8f750`](https://github.com/LedgerHQ/ledger-live/commit/7daaa8f75029927459b8132befcd6a20b3ef8e17), [`01a33f58ba`](https://github.com/LedgerHQ/ledger-live/commit/01a33f58ba6c5518045546e8f38be3f05fc2a935), [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4), [`16cad60fb0`](https://github.com/LedgerHQ/ledger-live/commit/16cad60fb0d21752fae5e3db6d0100ef5396e0a4)]:
  - @ledgerhq/live-common@29.1.0-next.0
  - @ledgerhq/native-ui@0.16.0-next.0
  - @ledgerhq/react-native-hid@6.29.0-next.0

## 3.16.1

### Patch Changes

- [#2838](https://github.com/LedgerHQ/ledger-live/pull/2838) [`c52eb6d900`](https://github.com/LedgerHQ/ledger-live/commit/c52eb6d900b949457d76cbbbda23786dfbce04fa) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Bugfix : FaceId is triggered in loop.

## 3.16.1-hotfix.0

### Patch Changes

- [#2838](https://github.com/LedgerHQ/ledger-live/pull/2838) [`c52eb6d900`](https://github.com/LedgerHQ/ledger-live/commit/c52eb6d900b949457d76cbbbda23786dfbce04fa) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Bugfix : FaceId is triggered in loop.

## 3.16.0

### Minor Changes

- [#2408](https://github.com/LedgerHQ/ledger-live/pull/2408) [`85e6554751`](https://github.com/LedgerHQ/ledger-live/commit/85e65547512e792e9c933d59c577ce8273caf818) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add startup time to setting debug performance screen. Log time to app boot to first interactive screen.

- [#2745](https://github.com/LedgerHQ/ledger-live/pull/2745) [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

- [#2521](https://github.com/LedgerHQ/ledger-live/pull/2521) [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add a performance overlay to track navigation time between pages

- [#2371](https://github.com/LedgerHQ/ledger-live/pull/2371) [`d9a528f023`](https://github.com/LedgerHQ/ledger-live/commit/d9a528f023eec7aa37ed66ff065e4e5a40dabe48) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add an info modal to device connection screen from protect flow

- [#2328](https://github.com/LedgerHQ/ledger-live/pull/2328) [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add translations

### Patch Changes

- [#2604](https://github.com/LedgerHQ/ledger-live/pull/2604) [`8ec53c8307`](https://github.com/LedgerHQ/ledger-live/commit/8ec53c8307ac39ccceda243be774571c8d1800d4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: onClose called when forcefully cleaned only if drawer was trying to be opened

- [#2489](https://github.com/LedgerHQ/ledger-live/pull/2489) [`37295da9c4`](https://github.com/LedgerHQ/ledger-live/commit/37295da9c460ad8a67d4a60dc7ffa3d97db1caf7) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Second tentative to fix the analytics missing equipment id for some users

- [#2597](https://github.com/LedgerHQ/ledger-live/pull/2597) [`0c905a513d`](https://github.com/LedgerHQ/ledger-live/commit/0c905a513d19d9b8c566779647cda4da8f8b5867) Thanks [@Justkant](https://github.com/Justkant)! - fix: avoid resetting the result onModalHide

- [#2707](https://github.com/LedgerHQ/ledger-live/pull/2707) [`d7b6b3a78d`](https://github.com/LedgerHQ/ledger-live/commit/d7b6b3a78de8bb3a5c72e74586b09fc3f03753d0) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixed hierarchy issue causing Auth screen to render behind app in Android

- [#2519](https://github.com/LedgerHQ/ledger-live/pull/2519) [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: QueueDrawer to queue drawers that should be displayed

  `QueuedDrawer` replacing existing `BottomModal`. `QueuedDrawer` is a drawer taking into account the currently displayed drawer and other drawers waiting to be displayed.

  This is made possible thanks to a queue of drawers waiting to be displayed. Once the currently displayed drawer is not displayed anymore (hidden), the next drawer in the queue is notified, and it updates its state to be make itself visible.

  Also updated all the components consuming `BottomModal` and `BottomDrawer`

- [#2578](https://github.com/LedgerHQ/ledger-live/pull/2578) [`9a61df66e0`](https://github.com/LedgerHQ/ledger-live/commit/9a61df66e07a43859316d552f78c7913e57275eb) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): broken ble on LLM

  We had to remove the reset of the device to undefined
  It avoids starting the ble scanning again on success
  The ble scanning is disconnecting all device which was causing the issue

- [#2509](https://github.com/LedgerHQ/ledger-live/pull/2509) [`c666458ad2`](https://github.com/LedgerHQ/ledger-live/commit/c666458ad2ee16519551ad2cc384d6c2e44adc27) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - hasGenesisPass, hasInfinityPass and accountsWithFunds user properties added to analytics

- [#2683](https://github.com/LedgerHQ/ledger-live/pull/2683) [`a58441f3cf`](https://github.com/LedgerHQ/ledger-live/commit/a58441f3cf4c56558658967ebebccad6067d521c) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed timeout value when app goes into background

- [#2595](https://github.com/LedgerHQ/ledger-live/pull/2595) [`c40befb5eb`](https://github.com/LedgerHQ/ledger-live/commit/c40befb5eb1b58424a20bd0d7c35a164e802c4eb) Thanks [@Justkant](https://github.com/Justkant)! - fix: reset device on close instead of navigating back

- [#2161](https://github.com/LedgerHQ/ledger-live/pull/2161) [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Refactor by useWalletAPIServer

- [#2576](https://github.com/LedgerHQ/ledger-live/pull/2576) [`8e4b18ed85`](https://github.com/LedgerHQ/ledger-live/commit/8e4b18ed854e97a7222bdde8029b5e72d6d70434) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): cleanup the transport on unmount

- [#2552](https://github.com/LedgerHQ/ledger-live/pull/2552) [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add entry point for WallectConnect on Main Menu in LLM

- [#2631](https://github.com/LedgerHQ/ledger-live/pull/2631) [`df998cf4c7`](https://github.com/LedgerHQ/ledger-live/commit/df998cf4c7a41bfccca6ffadfcd721926b4196f5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Analytics console: add filtering of "Sync\*" events

- [#2566](https://github.com/LedgerHQ/ledger-live/pull/2566) [`309507ced0`](https://github.com/LedgerHQ/ledger-live/commit/309507ced092c49e8e8dd67acc3ce175d2c1d554) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: several bugs on new system of queued drawers

  On QueuedDrawer:

  - When loosing focus: all drawers are cleaned, and it now tries to call the onClose of the QueuedDrawer if it tried to be opened after the navigation occurred
  - When getting focus: we now check if the drawer was not added just before (drawerId) to avoid adding it several time, because useFocusEffect can be triggered several time in certain cases

  On other components:

  - For a consumer drawer: onClose needed even if noCloseButton was set to handle lost of screen focus or if other drawer forced it to close

- [#2691](https://github.com/LedgerHQ/ledger-live/pull/2691) [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857) Thanks [@Justkant](https://github.com/Justkant)! - fix: empty USER_ID on LLM

- [#2604](https://github.com/LedgerHQ/ledger-live/pull/2604) [`8ec53c8307`](https://github.com/LedgerHQ/ledger-live/commit/8ec53c8307ac39ccceda243be774571c8d1800d4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: explicitly close drawer on navigation to add new device

- [#2633](https://github.com/LedgerHQ/ledger-live/pull/2633) [`7435fc26fc`](https://github.com/LedgerHQ/ledger-live/commit/7435fc26fcd71ba6752349474cbc6fca69551754) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove Old Warning Sign when status is down

- [#2435](https://github.com/LedgerHQ/ledger-live/pull/2435) [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Optimise rendering logic of Portfolio screen, Asset screen and other components through use of improved selectors, improved memoisation of some expensive components and throttling of frequent expensive computations

- [#2488](https://github.com/LedgerHQ/ledger-live/pull/2488) [`9479a1d3f5`](https://github.com/LedgerHQ/ledger-live/commit/9479a1d3f58a2c3e0a3fb395f0e842721c205ce6) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Added tracking to NFT Hide Multiselect feature

- [#2707](https://github.com/LedgerHQ/ledger-live/pull/2707) [`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

- Updated dependencies [[`109f456ff9`](https://github.com/LedgerHQ/ledger-live/commit/109f456ff9e715de8916d5dd4e096fd085c65319), [`80e3090edc`](https://github.com/LedgerHQ/ledger-live/commit/80e3090edc91a4e8c2f95891ce2eea48ddb1d319), [`b5d8805bef`](https://github.com/LedgerHQ/ledger-live/commit/b5d8805bef1b35c85b2a8f0a7d1487345c65ec67), [`5b65ae6b04`](https://github.com/LedgerHQ/ledger-live/commit/5b65ae6b04f20534962b986fab4e3ed29ad2e273), [`a1a2220dfc`](https://github.com/LedgerHQ/ledger-live/commit/a1a2220dfce313ade4c0f055ff4c5b9427fa285d), [`86ab7eb1d4`](https://github.com/LedgerHQ/ledger-live/commit/86ab7eb1d4d234051bb30930787279ebcdae6ea6), [`3d29b9e7ff`](https://github.com/LedgerHQ/ledger-live/commit/3d29b9e7ff1536b4e5624437b0507c2556e371f3), [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1), [`72cc12fcdb`](https://github.com/LedgerHQ/ledger-live/commit/72cc12fcdbd452c78fab00a064a24de56db2d38c), [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09), [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c), [`7423309c87`](https://github.com/LedgerHQ/ledger-live/commit/7423309c87b95020354b147305ff40303d42c8a3), [`b003234bd5`](https://github.com/LedgerHQ/ledger-live/commit/b003234bd5db564b4ddf25139e41ea21c5e852fa), [`0469c82884`](https://github.com/LedgerHQ/ledger-live/commit/0469c8288405dc9a47927e19ccf8ddafb38783de), [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7), [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a), [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857), [`c7a709f224`](https://github.com/LedgerHQ/ledger-live/commit/c7a709f2246fa416513c39ffa9ef05a09488ecec), [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`aed44f43b2`](https://github.com/LedgerHQ/ledger-live/commit/aed44f43b26fa9b60822c0754ba384412b9b236a), [`5c46dfade6`](https://github.com/LedgerHQ/ledger-live/commit/5c46dfade659a4162e032e16b3a5b603dbc8bd66), [`6c075924c0`](https://github.com/LedgerHQ/ledger-live/commit/6c075924c0a0a589ff46cc6681618e6519ef974b), [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf), [`76e381ed73`](https://github.com/LedgerHQ/ledger-live/commit/76e381ed731de5e33a78aad6c3a2a956fb170be0), [`a767918b3b`](https://github.com/LedgerHQ/ledger-live/commit/a767918b3be17319f23e2bfa118135a3924d2ee0), [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b), [`6003fbc140`](https://github.com/LedgerHQ/ledger-live/commit/6003fbc1408243332ee2e4956322e1a53d70de27), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`2aa9b47db4`](https://github.com/LedgerHQ/ledger-live/commit/2aa9b47db42fa70050fa09d7479988bdd1bebaa9), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471), [`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149)]:
  - @ledgerhq/live-common@29.0.0
  - @ledgerhq/types-live@6.31.0
  - @ledgerhq/devices@8.0.0
  - @ledgerhq/native-ui@0.15.1
  - @ledgerhq/hw-transport@6.28.1
  - @ledgerhq/react-native-hid@6.28.14
  - @ledgerhq/react-native-hw-transport-ble@6.28.3
  - @ledgerhq/hw-transport-http@6.27.12

## 3.16.0-next.5

### Patch Changes

- [#2707](https://github.com/LedgerHQ/ledger-live/pull/2707) [`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- Updated dependencies [[`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149)]:
  - @ledgerhq/live-common@29.0.0-next.4

## 3.16.0-next.4

### Patch Changes

- Updated dependencies [[`b4aed3961f`](https://github.com/LedgerHQ/ledger-live/commit/b4aed3961f26ee560bb8f57f60c10112ee70bc28)]:
  - @ledgerhq/live-common@29.0.0-next.3

## 3.16.0-next.3

### Patch Changes

- [#2707](https://github.com/LedgerHQ/ledger-live/pull/2707) [`d7b6b3a78d`](https://github.com/LedgerHQ/ledger-live/commit/d7b6b3a78de8bb3a5c72e74586b09fc3f03753d0) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixed hierarchy issue causing Auth screen to render behind app in Android

## 3.16.0-next.2

### Minor Changes

- [#2745](https://github.com/LedgerHQ/ledger-live/pull/2745) [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

### Patch Changes

- Updated dependencies [[`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09)]:
  - @ledgerhq/live-common@29.0.0-next.2

## 3.16.0-next.1

### Patch Changes

- Updated dependencies [[`80e3090edc`](https://github.com/LedgerHQ/ledger-live/commit/80e3090edc91a4e8c2f95891ce2eea48ddb1d319)]:
  - @ledgerhq/live-common@29.0.0-next.1

## 3.16.0-next.0

### Minor Changes

- [#2408](https://github.com/LedgerHQ/ledger-live/pull/2408) [`85e6554751`](https://github.com/LedgerHQ/ledger-live/commit/85e65547512e792e9c933d59c577ce8273caf818) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add startup time to setting debug performance screen. Log time to app boot to first interactive screen.

- [#2521](https://github.com/LedgerHQ/ledger-live/pull/2521) [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add a performance overlay to track navigation time between pages

- [#2371](https://github.com/LedgerHQ/ledger-live/pull/2371) [`d9a528f023`](https://github.com/LedgerHQ/ledger-live/commit/d9a528f023eec7aa37ed66ff065e4e5a40dabe48) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add an info modal to device connection screen from protect flow

- [#2328](https://github.com/LedgerHQ/ledger-live/pull/2328) [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add translations

### Patch Changes

- [#2604](https://github.com/LedgerHQ/ledger-live/pull/2604) [`8ec53c8307`](https://github.com/LedgerHQ/ledger-live/commit/8ec53c8307ac39ccceda243be774571c8d1800d4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: onClose called when forcefully cleaned only if drawer was trying to be opened

- [#2489](https://github.com/LedgerHQ/ledger-live/pull/2489) [`37295da9c4`](https://github.com/LedgerHQ/ledger-live/commit/37295da9c460ad8a67d4a60dc7ffa3d97db1caf7) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Second tentative to fix the analytics missing equipment id for some users

- [#2597](https://github.com/LedgerHQ/ledger-live/pull/2597) [`0c905a513d`](https://github.com/LedgerHQ/ledger-live/commit/0c905a513d19d9b8c566779647cda4da8f8b5867) Thanks [@Justkant](https://github.com/Justkant)! - fix: avoid resetting the result onModalHide

- [#2519](https://github.com/LedgerHQ/ledger-live/pull/2519) [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: QueueDrawer to queue drawers that should be displayed

  `QueuedDrawer` replacing existing `BottomModal`. `QueuedDrawer` is a drawer taking into account the currently displayed drawer and other drawers waiting to be displayed.

  This is made possible thanks to a queue of drawers waiting to be displayed. Once the currently displayed drawer is not displayed anymore (hidden), the next drawer in the queue is notified, and it updates its state to be make itself visible.

  Also updated all the components consuming `BottomModal` and `BottomDrawer`

- [#2578](https://github.com/LedgerHQ/ledger-live/pull/2578) [`9a61df66e0`](https://github.com/LedgerHQ/ledger-live/commit/9a61df66e07a43859316d552f78c7913e57275eb) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): broken ble on LLM

  We had to remove the reset of the device to undefined
  It avoids starting the ble scanning again on success
  The ble scanning is disconnecting all device which was causing the issue

- [#2509](https://github.com/LedgerHQ/ledger-live/pull/2509) [`c666458ad2`](https://github.com/LedgerHQ/ledger-live/commit/c666458ad2ee16519551ad2cc384d6c2e44adc27) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - hasGenesisPass, hasInfinityPass and accountsWithFunds user properties added to analytics

- [#2683](https://github.com/LedgerHQ/ledger-live/pull/2683) [`a58441f3cf`](https://github.com/LedgerHQ/ledger-live/commit/a58441f3cf4c56558658967ebebccad6067d521c) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Removed timeout value when app goes into background

- [#2595](https://github.com/LedgerHQ/ledger-live/pull/2595) [`c40befb5eb`](https://github.com/LedgerHQ/ledger-live/commit/c40befb5eb1b58424a20bd0d7c35a164e802c4eb) Thanks [@Justkant](https://github.com/Justkant)! - fix: reset device on close instead of navigating back

- [#2161](https://github.com/LedgerHQ/ledger-live/pull/2161) [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Refactor by useWalletAPIServer

- [#2576](https://github.com/LedgerHQ/ledger-live/pull/2576) [`8e4b18ed85`](https://github.com/LedgerHQ/ledger-live/commit/8e4b18ed854e97a7222bdde8029b5e72d6d70434) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): cleanup the transport on unmount

- [#2552](https://github.com/LedgerHQ/ledger-live/pull/2552) [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add entry point for WallectConnect on Main Menu in LLM

- [#2631](https://github.com/LedgerHQ/ledger-live/pull/2631) [`df998cf4c7`](https://github.com/LedgerHQ/ledger-live/commit/df998cf4c7a41bfccca6ffadfcd721926b4196f5) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Analytics console: add filtering of "Sync\*" events

- [#2566](https://github.com/LedgerHQ/ledger-live/pull/2566) [`309507ced0`](https://github.com/LedgerHQ/ledger-live/commit/309507ced092c49e8e8dd67acc3ce175d2c1d554) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: several bugs on new system of queued drawers

  On QueuedDrawer:

  - When loosing focus: all drawers are cleaned, and it now tries to call the onClose of the QueuedDrawer if it tried to be opened after the navigation occurred
  - When getting focus: we now check if the drawer was not added just before (drawerId) to avoid adding it several time, because useFocusEffect can be triggered several time in certain cases

  On other components:

  - For a consumer drawer: onClose needed even if noCloseButton was set to handle lost of screen focus or if other drawer forced it to close

- [#2691](https://github.com/LedgerHQ/ledger-live/pull/2691) [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857) Thanks [@Justkant](https://github.com/Justkant)! - fix: empty USER_ID on LLM

- [#2604](https://github.com/LedgerHQ/ledger-live/pull/2604) [`8ec53c8307`](https://github.com/LedgerHQ/ledger-live/commit/8ec53c8307ac39ccceda243be774571c8d1800d4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: explicitly close drawer on navigation to add new device

- [#2633](https://github.com/LedgerHQ/ledger-live/pull/2633) [`7435fc26fc`](https://github.com/LedgerHQ/ledger-live/commit/7435fc26fcd71ba6752349474cbc6fca69551754) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove Old Warning Sign when status is down

- [#2435](https://github.com/LedgerHQ/ledger-live/pull/2435) [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Optimise rendering logic of Portfolio screen, Asset screen and other components through use of improved selectors, improved memoisation of some expensive components and throttling of frequent expensive computations

- [#2488](https://github.com/LedgerHQ/ledger-live/pull/2488) [`9479a1d3f5`](https://github.com/LedgerHQ/ledger-live/commit/9479a1d3f58a2c3e0a3fb395f0e842721c205ce6) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Added tracking to NFT Hide Multiselect feature

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

- Updated dependencies [[`109f456ff9`](https://github.com/LedgerHQ/ledger-live/commit/109f456ff9e715de8916d5dd4e096fd085c65319), [`b5d8805bef`](https://github.com/LedgerHQ/ledger-live/commit/b5d8805bef1b35c85b2a8f0a7d1487345c65ec67), [`5b65ae6b04`](https://github.com/LedgerHQ/ledger-live/commit/5b65ae6b04f20534962b986fab4e3ed29ad2e273), [`a1a2220dfc`](https://github.com/LedgerHQ/ledger-live/commit/a1a2220dfce313ade4c0f055ff4c5b9427fa285d), [`86ab7eb1d4`](https://github.com/LedgerHQ/ledger-live/commit/86ab7eb1d4d234051bb30930787279ebcdae6ea6), [`3d29b9e7ff`](https://github.com/LedgerHQ/ledger-live/commit/3d29b9e7ff1536b4e5624437b0507c2556e371f3), [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1), [`72cc12fcdb`](https://github.com/LedgerHQ/ledger-live/commit/72cc12fcdbd452c78fab00a064a24de56db2d38c), [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c), [`7423309c87`](https://github.com/LedgerHQ/ledger-live/commit/7423309c87b95020354b147305ff40303d42c8a3), [`b003234bd5`](https://github.com/LedgerHQ/ledger-live/commit/b003234bd5db564b4ddf25139e41ea21c5e852fa), [`0469c82884`](https://github.com/LedgerHQ/ledger-live/commit/0469c8288405dc9a47927e19ccf8ddafb38783de), [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7), [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a), [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857), [`c7a709f224`](https://github.com/LedgerHQ/ledger-live/commit/c7a709f2246fa416513c39ffa9ef05a09488ecec), [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`b4aed3961f`](https://github.com/LedgerHQ/ledger-live/commit/b4aed3961f26ee560bb8f57f60c10112ee70bc28), [`aed44f43b2`](https://github.com/LedgerHQ/ledger-live/commit/aed44f43b26fa9b60822c0754ba384412b9b236a), [`5c46dfade6`](https://github.com/LedgerHQ/ledger-live/commit/5c46dfade659a4162e032e16b3a5b603dbc8bd66), [`6c075924c0`](https://github.com/LedgerHQ/ledger-live/commit/6c075924c0a0a589ff46cc6681618e6519ef974b), [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf), [`76e381ed73`](https://github.com/LedgerHQ/ledger-live/commit/76e381ed731de5e33a78aad6c3a2a956fb170be0), [`a767918b3b`](https://github.com/LedgerHQ/ledger-live/commit/a767918b3be17319f23e2bfa118135a3924d2ee0), [`68c0a2a2ac`](https://github.com/LedgerHQ/ledger-live/commit/68c0a2a2ac2080ec7de069ceb2053737f44f2a4b), [`6003fbc140`](https://github.com/LedgerHQ/ledger-live/commit/6003fbc1408243332ee2e4956322e1a53d70de27), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`2aa9b47db4`](https://github.com/LedgerHQ/ledger-live/commit/2aa9b47db42fa70050fa09d7479988bdd1bebaa9), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471)]:
  - @ledgerhq/live-common@29.0.0-next.0
  - @ledgerhq/types-live@6.31.0-next.0
  - @ledgerhq/devices@8.0.0-next.0
  - @ledgerhq/native-ui@0.15.1-next.0
  - @ledgerhq/hw-transport@6.28.1-next.0
  - @ledgerhq/react-native-hid@6.28.14-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.3-next.0
  - @ledgerhq/hw-transport-http@6.27.12-next.0

## 3.15.2

### Patch Changes

- Updated dependencies [[`090c6c8d8f`](https://github.com/LedgerHQ/ledger-live/commit/090c6c8d8f15bc13995851abc9eb35c649f6b678)]:
  - @ledgerhq/live-common@28.0.2

## 3.15.2-hotfix.0

### Patch Changes

- Updated dependencies [[`090c6c8d8f`](https://github.com/LedgerHQ/ledger-live/commit/090c6c8d8f15bc13995851abc9eb35c649f6b678)]:
  - @ledgerhq/live-common@28.0.2-hotfix.0

## 3.15.1

### Patch Changes

- Updated dependencies [[`61c7aafb21`](https://github.com/LedgerHQ/ledger-live/commit/61c7aafb216099692fad27621fff167f1ba4c840), [`31f13e8ac2`](https://github.com/LedgerHQ/ledger-live/commit/31f13e8ac2272c54621d2b83f8b17ab5350ce918)]:
  - @ledgerhq/live-common@28.0.1

## 3.15.1-hotfix.1

### Patch Changes

- Updated dependencies [[`61c7aafb21`](https://github.com/LedgerHQ/ledger-live/commit/61c7aafb216099692fad27621fff167f1ba4c840)]:
  - @ledgerhq/live-common@28.0.1-hotfix.1

## 3.15.1-hotfix.0

### Patch Changes

- Updated dependencies [[`31f13e8ac2`](https://github.com/LedgerHQ/ledger-live/commit/31f13e8ac2272c54621d2b83f8b17ab5350ce918)]:
  - @ledgerhq/live-common@28.0.1-hotfix.0

## 3.15.0

### Minor Changes

- [#1782](https://github.com/LedgerHQ/ledger-live/pull/1782) [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - merge cosmos and osmosis

### Patch Changes

- [#2492](https://github.com/LedgerHQ/ledger-live/pull/2492) [`eca1fc0a76`](https://github.com/LedgerHQ/ledger-live/commit/eca1fc0a764e3895a392a1a0bd09d52987524351) Thanks [@chabroA](https://github.com/chabroA)! - Second tentative to fix the analytics missing equipment id for some users

* [#2290](https://github.com/LedgerHQ/ledger-live/pull/2290) [`8e690ef8ac`](https://github.com/LedgerHQ/ledger-live/commit/8e690ef8acd66d67642c95fd918ef9c3386765aa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Multi Select mode allowing hide unwanted collections in NFT GAllery

- [#2350](https://github.com/LedgerHQ/ledger-live/pull/2350) [`de1bf99157`](https://github.com/LedgerHQ/ledger-live/commit/de1bf99157b069f8ae6746172cf0a929c2764d3c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implementation of analytics for Custom Lock Screen

* [#2427](https://github.com/LedgerHQ/ledger-live/pull/2427) [`b192ed6b24`](https://github.com/LedgerHQ/ledger-live/commit/b192ed6b24220acd52f4500e664ebbdf735953ee) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - We now add a parameter apptracking=false to our webviews in LLM redirecting to the shop and to the academy websites in order to not display the cookie prompt (to comply with apple rules)

- [#2475](https://github.com/LedgerHQ/ledger-live/pull/2475) [`4b81270e26`](https://github.com/LedgerHQ/ledger-live/commit/4b81270e26c683240945ecf6867b47f1272db474) Thanks [@Justkant](https://github.com/Justkant)! - fix: remove skip select device on DeviceConnect

* [#2350](https://github.com/LedgerHQ/ledger-live/pull/2350) [`de1bf99157`](https://github.com/LedgerHQ/ledger-live/commit/de1bf99157b069f8ae6746172cf0a929c2764d3c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Improvements to the UX of the in-app analytics console

- [#2464](https://github.com/LedgerHQ/ledger-live/pull/2464) [`59eb2b4874`](https://github.com/LedgerHQ/ledger-live/commit/59eb2b487488fd14cd40ff7157349f42ad8b6107) Thanks [@alexandremgo](https://github.com/alexandremgo)! - ignore HwTransportError for Sentry on LLM

* [#2492](https://github.com/LedgerHQ/ledger-live/pull/2492) [`eca1fc0a76`](https://github.com/LedgerHQ/ledger-live/commit/eca1fc0a764e3895a392a1a0bd09d52987524351) Thanks [@chabroA](https://github.com/chabroA)! - Added tracking to NFT Hide Multiselect feature

* Updated dependencies [[`ebdb20d071`](https://github.com/LedgerHQ/ledger-live/commit/ebdb20d071290c6d4565d64bc77e26ce8191edea), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`6214ac0412`](https://github.com/LedgerHQ/ledger-live/commit/6214ac0412f5d67ffc9ed965e21ffda44c30ae21), [`36c1a33638`](https://github.com/LedgerHQ/ledger-live/commit/36c1a33638dd889173f1caf263563c27aebc521f), [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f), [`0e3dadacce`](https://github.com/LedgerHQ/ledger-live/commit/0e3dadacce1292b85ae028289301b7a84631a8fa), [`8ff8e433ed`](https://github.com/LedgerHQ/ledger-live/commit/8ff8e433edb6e95693dc21f83c958f6c4a65f056), [`61ff754c0c`](https://github.com/LedgerHQ/ledger-live/commit/61ff754c0cfcacb564e6c6e0497c23cee17f1eb8), [`db03ee7a28`](https://github.com/LedgerHQ/ledger-live/commit/db03ee7a28e832582111eb5ab31ce73694cfb957), [`0839f0886f`](https://github.com/LedgerHQ/ledger-live/commit/0839f0886f3acd544ae21d3c9c3c7a607662303b), [`de69b7f2ba`](https://github.com/LedgerHQ/ledger-live/commit/de69b7f2baa614726167e97e4fb4bbe741aafbfb), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`315c0ba0f4`](https://github.com/LedgerHQ/ledger-live/commit/315c0ba0f4e407927bd7a2ba5cc03006e24ff94d), [`de3b0da314`](https://github.com/LedgerHQ/ledger-live/commit/de3b0da31428487e025548abcfa26c0d4dac33f1)]:
  - @ledgerhq/live-common@28.0.0
  - @ledgerhq/types-cryptoassets@7.0.0
  - @ledgerhq/hw-transport@6.28.0
  - @ledgerhq/types-live@6.30.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.2
  - @ledgerhq/hw-transport-http@6.27.11
  - @ledgerhq/react-native-hid@6.28.13

## 3.15.0-next.2

### Patch Changes

- Updated dependencies [[`0e3dadacce`](https://github.com/LedgerHQ/ledger-live/commit/0e3dadacce1292b85ae028289301b7a84631a8fa)]:
  - @ledgerhq/live-common@28.0.0-next.1

## 3.15.0-next.1

### Patch Changes

- [#2492](https://github.com/LedgerHQ/ledger-live/pull/2492) [`eca1fc0a76`](https://github.com/LedgerHQ/ledger-live/commit/eca1fc0a764e3895a392a1a0bd09d52987524351) Thanks [@chabroA](https://github.com/chabroA)! - Second tentative to fix the analytics missing equipment id for some users

* [#2492](https://github.com/LedgerHQ/ledger-live/pull/2492) [`eca1fc0a76`](https://github.com/LedgerHQ/ledger-live/commit/eca1fc0a764e3895a392a1a0bd09d52987524351) Thanks [@chabroA](https://github.com/chabroA)! - Added tracking to NFT Hide Multiselect feature

## 3.15.0-next.0

### Minor Changes

- [#1782](https://github.com/LedgerHQ/ledger-live/pull/1782) [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - merge cosmos and osmosis

### Patch Changes

- [#2290](https://github.com/LedgerHQ/ledger-live/pull/2290) [`8e690ef8ac`](https://github.com/LedgerHQ/ledger-live/commit/8e690ef8acd66d67642c95fd918ef9c3386765aa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Multi Select mode allowing hide unwanted collections in NFT GAllery

* [#2350](https://github.com/LedgerHQ/ledger-live/pull/2350) [`de1bf99157`](https://github.com/LedgerHQ/ledger-live/commit/de1bf99157b069f8ae6746172cf0a929c2764d3c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implementation of analytics for Custom Lock Screen

- [#2427](https://github.com/LedgerHQ/ledger-live/pull/2427) [`b192ed6b24`](https://github.com/LedgerHQ/ledger-live/commit/b192ed6b24220acd52f4500e664ebbdf735953ee) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - We now add a parameter apptracking=false to our webviews in LLM redirecting to the shop and to the academy websites in order to not display the cookie prompt (to comply with apple rules)

* [#2475](https://github.com/LedgerHQ/ledger-live/pull/2475) [`4b81270e26`](https://github.com/LedgerHQ/ledger-live/commit/4b81270e26c683240945ecf6867b47f1272db474) Thanks [@Justkant](https://github.com/Justkant)! - fix: remove skip select device on DeviceConnect

- [#2350](https://github.com/LedgerHQ/ledger-live/pull/2350) [`de1bf99157`](https://github.com/LedgerHQ/ledger-live/commit/de1bf99157b069f8ae6746172cf0a929c2764d3c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Improvements to the UX of the in-app analytics console

* [#2464](https://github.com/LedgerHQ/ledger-live/pull/2464) [`59eb2b4874`](https://github.com/LedgerHQ/ledger-live/commit/59eb2b487488fd14cd40ff7157349f42ad8b6107) Thanks [@alexandremgo](https://github.com/alexandremgo)! - ignore HwTransportError for Sentry on LLM

* Updated dependencies [[`ebdb20d071`](https://github.com/LedgerHQ/ledger-live/commit/ebdb20d071290c6d4565d64bc77e26ce8191edea), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`6214ac0412`](https://github.com/LedgerHQ/ledger-live/commit/6214ac0412f5d67ffc9ed965e21ffda44c30ae21), [`36c1a33638`](https://github.com/LedgerHQ/ledger-live/commit/36c1a33638dd889173f1caf263563c27aebc521f), [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f), [`8ff8e433ed`](https://github.com/LedgerHQ/ledger-live/commit/8ff8e433edb6e95693dc21f83c958f6c4a65f056), [`61ff754c0c`](https://github.com/LedgerHQ/ledger-live/commit/61ff754c0cfcacb564e6c6e0497c23cee17f1eb8), [`db03ee7a28`](https://github.com/LedgerHQ/ledger-live/commit/db03ee7a28e832582111eb5ab31ce73694cfb957), [`0839f0886f`](https://github.com/LedgerHQ/ledger-live/commit/0839f0886f3acd544ae21d3c9c3c7a607662303b), [`de69b7f2ba`](https://github.com/LedgerHQ/ledger-live/commit/de69b7f2baa614726167e97e4fb4bbe741aafbfb), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`315c0ba0f4`](https://github.com/LedgerHQ/ledger-live/commit/315c0ba0f4e407927bd7a2ba5cc03006e24ff94d), [`de3b0da314`](https://github.com/LedgerHQ/ledger-live/commit/de3b0da31428487e025548abcfa26c0d4dac33f1)]:
  - @ledgerhq/live-common@28.0.0-next.0
  - @ledgerhq/types-cryptoassets@7.0.0-next.0
  - @ledgerhq/hw-transport@6.28.0-next.0
  - @ledgerhq/types-live@6.30.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.2-next.0
  - @ledgerhq/hw-transport-http@6.27.11-next.0
  - @ledgerhq/react-native-hid@6.28.13-next.0

## 3.14.0

### Minor Changes

- [#2159](https://github.com/LedgerHQ/ledger-live/pull/2159) [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Changes swap kyc alert copy for changelly

* [#2338](https://github.com/LedgerHQ/ledger-live/pull/2338) [`70e9db3892`](https://github.com/LedgerHQ/ledger-live/commit/70e9db3892413c7f825cd3eb258e1577e365d6b6) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Large Mover category added in the notifications settings

- [#2130](https://github.com/LedgerHQ/ledger-live/pull/2130) [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a restore from previous device option when installing apps during the sync onboarding

* [#1978](https://github.com/LedgerHQ/ledger-live/pull/1978) [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72) Thanks [@RamyEB](https://github.com/RamyEB)! - Deletion of an old logic concerning the manifest fetch and filter, and replacement by a new one + added the possibility to give a custom Provider

- [#1661](https://github.com/LedgerHQ/ledger-live/pull/1661) [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add elrond staking and token

### Patch Changes

- [#2283](https://github.com/LedgerHQ/ledger-live/pull/2283) [`e4d5c90b53`](https://github.com/LedgerHQ/ledger-live/commit/e4d5c90b532bfa9945a0cb3edecf0178ab0d80ed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix issue on the NFT claim flow on iOS: camera not displaying right after granting the permission

* [#2275](https://github.com/LedgerHQ/ledger-live/pull/2275) [`a1e5c4bf49`](https://github.com/LedgerHQ/ledger-live/commit/a1e5c4bf49eb7e7a6c7eba069dedbfc64ffc59f1) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds more analytics to LLM for swap.

- [#2245](https://github.com/LedgerHQ/ledger-live/pull/2245) [`cf7cb5978f`](https://github.com/LedgerHQ/ledger-live/commit/cf7cb5978f161ca628e6805f6b3a309f765d65de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Convert all video assets to HEVC. Remove unused assets.

* [#2191](https://github.com/LedgerHQ/ledger-live/pull/2191) [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Refactors swap screen on mobile to remove max loading state.

- [#2283](https://github.com/LedgerHQ/ledger-live/pull/2283) [`e4d5c90b53`](https://github.com/LedgerHQ/ledger-live/commit/e4d5c90b532bfa9945a0cb3edecf0178ab0d80ed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Replace the FallbackCameraScreen logic by a simple easy to reuse RequiresCameraPermission component

* [#2268](https://github.com/LedgerHQ/ledger-live/pull/2268) [`0c479704f5`](https://github.com/LedgerHQ/ledger-live/commit/0c479704f5bcd1a00b4bf5370da32d92f4165e87) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): use the newDeviceSelectionFeature on mobile

- [#2270](https://github.com/LedgerHQ/ledger-live/pull/2270) [`b3ca8bff8c`](https://github.com/LedgerHQ/ledger-live/commit/b3ca8bff8c90400b302ddf0345df1b83d9ceb3c3) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add new Infinity Pass assets and debug screen for claim NFT flow

* [#2245](https://github.com/LedgerHQ/ledger-live/pull/2245) [`cf7cb5978f`](https://github.com/LedgerHQ/ledger-live/commit/cf7cb5978f161ca628e6805f6b3a309f765d65de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implement a video index file to reference all the sources of video assets. Implement a "Debug Videos" screen in the debug menu.

* Updated dependencies [[`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496), [`dcad1bcbdc`](https://github.com/LedgerHQ/ledger-live/commit/dcad1bcbdc6f1674a175f2bca12c85edbdd179e1), [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c), [`97c9cb43a4`](https://github.com/LedgerHQ/ledger-live/commit/97c9cb43a4a4dc2c6369d76f12b4a0c48fe3990a), [`75fbe7f3b1`](https://github.com/LedgerHQ/ledger-live/commit/75fbe7f3b1058e6eb6906c0d5fac3fb10eefc3eb), [`befe0e224a`](https://github.com/LedgerHQ/ledger-live/commit/befe0e224a93fbc3598f4d03b769b9d9e1af721e), [`ea6e557506`](https://github.com/LedgerHQ/ledger-live/commit/ea6e5575069f7ce4c9f9ce4983671aa465740fc5), [`789bfc0fad`](https://github.com/LedgerHQ/ledger-live/commit/789bfc0fadd53c8209a2ad8aa8df6bbf9a2891ab), [`4e9378d63b`](https://github.com/LedgerHQ/ledger-live/commit/4e9378d63b048fef131ee574220c428456ef42d4), [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659), [`7fef128ffb`](https://github.com/LedgerHQ/ledger-live/commit/7fef128ffba226dd675935c7464db60894f327bb), [`53b526847d`](https://github.com/LedgerHQ/ledger-live/commit/53b526847d5478e271e216c7a98d650915b7cb6a), [`16195a130e`](https://github.com/LedgerHQ/ledger-live/commit/16195a130e24b06528b6c2c2551e58be253f94f1), [`7af03d772a`](https://github.com/LedgerHQ/ledger-live/commit/7af03d772a16822024e456224951c48c5e09e45d), [`7399cdba96`](https://github.com/LedgerHQ/ledger-live/commit/7399cdba96c5a39be5018dcff2906fbc11200ba2), [`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496), [`b7df09bbc9`](https://github.com/LedgerHQ/ledger-live/commit/b7df09bbc9a07602b326fbbe434c13ec61f276e7), [`5b4aa38421`](https://github.com/LedgerHQ/ledger-live/commit/5b4aa38421380512fb96ef66e1f3149ce8bfd018), [`d0919b03f4`](https://github.com/LedgerHQ/ledger-live/commit/d0919b03f49d2cfd13e0f476f7b94c54e34be872), [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2), [`63e63e5fc5`](https://github.com/LedgerHQ/ledger-live/commit/63e63e5fc562c029f1372f664d1a45dc1fda5047), [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72), [`9bba7fd8bd`](https://github.com/LedgerHQ/ledger-live/commit/9bba7fd8bd9b55be569fb57367e7debc442af789), [`88d6de464b`](https://github.com/LedgerHQ/ledger-live/commit/88d6de464b475b049aaf1724b28d8a592bfd4676), [`0b827ad97a`](https://github.com/LedgerHQ/ledger-live/commit/0b827ad97afb5e12ae0c8d0d1cf3952a6d02ec7c), [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145)]:
  - @ledgerhq/types-live@6.29.0
  - @ledgerhq/live-common@27.12.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.1

## 3.14.0-next.0

### Minor Changes

- [#2159](https://github.com/LedgerHQ/ledger-live/pull/2159) [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Changes swap kyc alert copy for changelly

* [#2338](https://github.com/LedgerHQ/ledger-live/pull/2338) [`70e9db3892`](https://github.com/LedgerHQ/ledger-live/commit/70e9db3892413c7f825cd3eb258e1577e365d6b6) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Large Mover category added in the notifications settings

- [#2130](https://github.com/LedgerHQ/ledger-live/pull/2130) [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add a restore from previous device option when installing apps during the sync onboarding

* [#1978](https://github.com/LedgerHQ/ledger-live/pull/1978) [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72) Thanks [@RamyEB](https://github.com/RamyEB)! - Deletion of an old logic concerning the manifest fetch and filter, and replacement by a new one + added the possibility to give a custom Provider

- [#1661](https://github.com/LedgerHQ/ledger-live/pull/1661) [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add elrond staking and token

### Patch Changes

- [#2283](https://github.com/LedgerHQ/ledger-live/pull/2283) [`e4d5c90b53`](https://github.com/LedgerHQ/ledger-live/commit/e4d5c90b532bfa9945a0cb3edecf0178ab0d80ed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix issue on the NFT claim flow on iOS: camera not displaying right after granting the permission

* [#2275](https://github.com/LedgerHQ/ledger-live/pull/2275) [`a1e5c4bf49`](https://github.com/LedgerHQ/ledger-live/commit/a1e5c4bf49eb7e7a6c7eba069dedbfc64ffc59f1) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds more analytics to LLM for swap.

- [#2245](https://github.com/LedgerHQ/ledger-live/pull/2245) [`cf7cb5978f`](https://github.com/LedgerHQ/ledger-live/commit/cf7cb5978f161ca628e6805f6b3a309f765d65de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Convert all video assets to HEVC. Remove unused assets.

* [#2191](https://github.com/LedgerHQ/ledger-live/pull/2191) [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Refactors swap screen on mobile to remove max loading state.

- [#2283](https://github.com/LedgerHQ/ledger-live/pull/2283) [`e4d5c90b53`](https://github.com/LedgerHQ/ledger-live/commit/e4d5c90b532bfa9945a0cb3edecf0178ab0d80ed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Replace the FallbackCameraScreen logic by a simple easy to reuse RequiresCameraPermission component

* [#2268](https://github.com/LedgerHQ/ledger-live/pull/2268) [`0c479704f5`](https://github.com/LedgerHQ/ledger-live/commit/0c479704f5bcd1a00b4bf5370da32d92f4165e87) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): use the newDeviceSelectionFeature on mobile

- [#2270](https://github.com/LedgerHQ/ledger-live/pull/2270) [`b3ca8bff8c`](https://github.com/LedgerHQ/ledger-live/commit/b3ca8bff8c90400b302ddf0345df1b83d9ceb3c3) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add new Infinity Pass assets and debug screen for claim NFT flow

* [#2245](https://github.com/LedgerHQ/ledger-live/pull/2245) [`cf7cb5978f`](https://github.com/LedgerHQ/ledger-live/commit/cf7cb5978f161ca628e6805f6b3a309f765d65de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implement a video index file to reference all the sources of video assets. Implement a "Debug Videos" screen in the debug menu.

* Updated dependencies [[`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496), [`dcad1bcbdc`](https://github.com/LedgerHQ/ledger-live/commit/dcad1bcbdc6f1674a175f2bca12c85edbdd179e1), [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c), [`97c9cb43a4`](https://github.com/LedgerHQ/ledger-live/commit/97c9cb43a4a4dc2c6369d76f12b4a0c48fe3990a), [`75fbe7f3b1`](https://github.com/LedgerHQ/ledger-live/commit/75fbe7f3b1058e6eb6906c0d5fac3fb10eefc3eb), [`befe0e224a`](https://github.com/LedgerHQ/ledger-live/commit/befe0e224a93fbc3598f4d03b769b9d9e1af721e), [`ea6e557506`](https://github.com/LedgerHQ/ledger-live/commit/ea6e5575069f7ce4c9f9ce4983671aa465740fc5), [`789bfc0fad`](https://github.com/LedgerHQ/ledger-live/commit/789bfc0fadd53c8209a2ad8aa8df6bbf9a2891ab), [`4e9378d63b`](https://github.com/LedgerHQ/ledger-live/commit/4e9378d63b048fef131ee574220c428456ef42d4), [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659), [`7fef128ffb`](https://github.com/LedgerHQ/ledger-live/commit/7fef128ffba226dd675935c7464db60894f327bb), [`53b526847d`](https://github.com/LedgerHQ/ledger-live/commit/53b526847d5478e271e216c7a98d650915b7cb6a), [`16195a130e`](https://github.com/LedgerHQ/ledger-live/commit/16195a130e24b06528b6c2c2551e58be253f94f1), [`7af03d772a`](https://github.com/LedgerHQ/ledger-live/commit/7af03d772a16822024e456224951c48c5e09e45d), [`7399cdba96`](https://github.com/LedgerHQ/ledger-live/commit/7399cdba96c5a39be5018dcff2906fbc11200ba2), [`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496), [`b7df09bbc9`](https://github.com/LedgerHQ/ledger-live/commit/b7df09bbc9a07602b326fbbe434c13ec61f276e7), [`5b4aa38421`](https://github.com/LedgerHQ/ledger-live/commit/5b4aa38421380512fb96ef66e1f3149ce8bfd018), [`d0919b03f4`](https://github.com/LedgerHQ/ledger-live/commit/d0919b03f49d2cfd13e0f476f7b94c54e34be872), [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2), [`63e63e5fc5`](https://github.com/LedgerHQ/ledger-live/commit/63e63e5fc562c029f1372f664d1a45dc1fda5047), [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72), [`9bba7fd8bd`](https://github.com/LedgerHQ/ledger-live/commit/9bba7fd8bd9b55be569fb57367e7debc442af789), [`88d6de464b`](https://github.com/LedgerHQ/ledger-live/commit/88d6de464b475b049aaf1724b28d8a592bfd4676), [`0b827ad97a`](https://github.com/LedgerHQ/ledger-live/commit/0b827ad97afb5e12ae0c8d0d1cf3952a6d02ec7c), [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145)]:
  - @ledgerhq/types-live@6.29.0-next.0
  - @ledgerhq/live-common@27.12.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.1-next.0

## 3.13.1

### Patch Changes

- Updated dependencies [[`e7bf251ba4`](https://github.com/LedgerHQ/ledger-live/commit/e7bf251ba488a9f38731db58b1d2d69d8fc802ea)]:
  - @ledgerhq/react-native-hw-transport-ble@6.28.1

## 3.13.1-hotfix.0

### Patch Changes

- Updated dependencies [[`e7bf251ba4`](https://github.com/LedgerHQ/ledger-live/commit/e7bf251ba488a9f38731db58b1d2d69d8fc802ea)]:
  - @ledgerhq/react-native-hw-transport-ble@6.28.1-hotfix.0

## 3.13.0

### Minor Changes

- [#2037](https://github.com/LedgerHQ/ledger-live/pull/2037) [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - use new parameter from formatCurrencyUnit, dynamicSignificantDigits, in all related display value components/utils. Increased this value for the display of the account crypto value in Account page so more digits are shown.

* [#2121](https://github.com/LedgerHQ/ledger-live/pull/2121) [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea) Thanks [@lvndry](https://github.com/lvndry)! - Delist Stakenet (XSN) coin

- [#2080](https://github.com/LedgerHQ/ledger-live/pull/2080) [`2200448b70`](https://github.com/LedgerHQ/ledger-live/commit/2200448b70697df875fc03d72f7cfbec3572e875) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - bugfix: llm - fixes issue where From account was being displayed as target account on swap screen"

* [#2154](https://github.com/LedgerHQ/ledger-live/pull/2154) [`1f7f19294f`](https://github.com/LedgerHQ/ledger-live/commit/1f7f19294f5c989a0e29ea1833a73575cb2f595d) Thanks [@grsoares21](https://github.com/grsoares21)! - Small fix on the margins on MyLedger screen for Frimware and Apps update banners

- [#1805](https://github.com/LedgerHQ/ledger-live/pull/1805) [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - NEAR sync, send and stake

* [#2190](https://github.com/LedgerHQ/ledger-live/pull/2190) [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405) Thanks [@chabroA](https://github.com/chabroA)! - Handle bitcoin.getXPpub wallet api method

- [#1932](https://github.com/LedgerHQ/ledger-live/pull/1932) [`fe21b6e0b3`](https://github.com/LedgerHQ/ledger-live/commit/fe21b6e0b34b048046668915b83a5a833ffc3206) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - This PR add the post onboarding claim NFT flow

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): device.transport LLD & LLM integration [LIVE-4293]

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - PRotect - Add Manager entry feature flagged configurable

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): LLM server implementation [LIVE-4394]

- [#2066](https://github.com/LedgerHQ/ledger-live/pull/2066) [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of Ledger Stax related assets and pixel polish (includes changes on the welcome screens of the app)

* [#2214](https://github.com/LedgerHQ/ledger-live/pull/2214) [`3f853fe836`](https://github.com/LedgerHQ/ledger-live/commit/3f853fe83643ad10d7efd4b140fd3d815c29bb08) Thanks [@grsoares21](https://github.com/grsoares21)! - Integrate the new device selection screen everywhere in the app

- [#2081](https://github.com/LedgerHQ/ledger-live/pull/2081) [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Notification Center revamped and now displaying content cards using braze capabilities

### Patch Changes

- [#2225](https://github.com/LedgerHQ/ledger-live/pull/2225) [`a30a2594af`](https://github.com/LedgerHQ/ledger-live/commit/a30a2594afc597b4de936c08e8367d08dd99054d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve access to debug screens

* [#1997](https://github.com/LedgerHQ/ledger-live/pull/1997) [`35b2cbc2f1`](https://github.com/LedgerHQ/ledger-live/commit/35b2cbc2f1dead863de1507c1e40595ec0431eeb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - LLM React to custom image loading and reflect the space taken by it

- [#2255](https://github.com/LedgerHQ/ledger-live/pull/2255) [`e09a545cb0`](https://github.com/LedgerHQ/ledger-live/commit/e09a545cb04a0ae56681eb1acd9deb73fb56dfee) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds in analytics to swap screens on mobile

* [#2219](https://github.com/LedgerHQ/ledger-live/pull/2219) [`f052a64843`](https://github.com/LedgerHQ/ledger-live/commit/f052a648439ccf5be250f6f7c4bc22084569dd43) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve debug theme tool

- [#2126](https://github.com/LedgerHQ/ledger-live/pull/2126) [`3b858335f4`](https://github.com/LedgerHQ/ledger-live/commit/3b858335f412ad6f10ce32148992b117df969182) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix UI for Fallback Camera screen, import accounts/scan

* [#2227](https://github.com/LedgerHQ/ledger-live/pull/2227) [`7ed4cb7f10`](https://github.com/LedgerHQ/ledger-live/commit/7ed4cb7f109d8fe474050cad2567aa1e04100a6f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improvements to the App state debugging tool

- [#1961](https://github.com/LedgerHQ/ledger-live/pull/1961) [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove isFirmwareUpdateVersionSupported logic from LLM

* [#2203](https://github.com/LedgerHQ/ledger-live/pull/2203) [`0b57f91c4e`](https://github.com/LedgerHQ/ledger-live/commit/0b57f91c4ed02cb8e22d6b55b07de6960f5b0a87) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 'Terms of Use Update' pop-up issue in some languages

- [#2149](https://github.com/LedgerHQ/ledger-live/pull/2149) [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Reworked the debug menu and inner tools

* [#2165](https://github.com/LedgerHQ/ledger-live/pull/2165) [`6ae49b03bc`](https://github.com/LedgerHQ/ledger-live/commit/6ae49b03bc5b9c4c262f81654d7f37a20d5ed287) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Fix the back navigation when entering the error screen in the custom lockscreen flow

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701) Thanks [@github-actions](https://github.com/apps/github-actions)! - Handle unseeded Stax error

* [#2071](https://github.com/LedgerHQ/ledger-live/pull/2071) [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - fix ratings modal close behavior

- [#2086](https://github.com/LedgerHQ/ledger-live/pull/2086) [`fabdfbddd5`](https://github.com/LedgerHQ/ledger-live/commit/fabdfbddd59bb17a61ee4a889178cce53dfabc24) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix all cosmos delegation flow with an amount of 0

* [#2143](https://github.com/LedgerHQ/ledger-live/pull/2143) [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flags overriding persistency over app restarts + UX improvements (feature groups, banner, reset all)

- [#2150](https://github.com/LedgerHQ/ledger-live/pull/2150) [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle locked device during genuine check and get latest available firmware update

* [#204](https://github.com/LedgerHQ/ledger-live/pull/204) [`41747ad079`](https://github.com/LedgerHQ/ledger-live/commit/41747ad0796201bacdfb6b95e4d4c43ebd9e4bd0) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Bump Android target & compile SDK to API 32

- [#2089](https://github.com/LedgerHQ/ledger-live/pull/2089) [`301ac48e80`](https://github.com/LedgerHQ/ledger-live/commit/301ac48e80eac24a7c9430fee2bc341129c52e94) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - bugfix - llm - centers t&c link on swap confirmation modal

* [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: BLE pairing flow as components

- [#1852](https://github.com/LedgerHQ/ledger-live/pull/1852) [`01c3025d3b`](https://github.com/LedgerHQ/ledger-live/commit/01c3025d3b742447388f92be66c7b17438168102) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add custom image deeplink

* [#2041](https://github.com/LedgerHQ/ledger-live/pull/2041) [`9189737e0b`](https://github.com/LedgerHQ/ledger-live/commit/9189737e0b137a6455f0fcd8739bf14be8d0a924) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix blank screen when refused camera permissions on iOS scanning recipient for the send flow

- [#2157](https://github.com/LedgerHQ/ledger-live/pull/2157) [`55685e3fb7`](https://github.com/LedgerHQ/ledger-live/commit/55685e3fb77db9bde9b4c52f6f093cb32632ce44) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent crash with reference to nanoFTS in app data

* [#2058](https://github.com/LedgerHQ/ledger-live/pull/2058) [`aee5dd361f`](https://github.com/LedgerHQ/ledger-live/commit/aee5dd361fae6aacb8b7320107417185c90f9b8b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add translation key

- [#2019](https://github.com/LedgerHQ/ledger-live/pull/2019) [`08b0445a5f`](https://github.com/LedgerHQ/ledger-live/commit/08b0445a5f8431042ddffe9abf01e1319d677ad8) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Ethereum custom fees CSS for Ethereum

* [#2120](https://github.com/LedgerHQ/ledger-live/pull/2120) [`432e7fd7f9`](https://github.com/LedgerHQ/ledger-live/commit/432e7fd7f9cb229d9dfef47ceffcefeb94a5cb77) Thanks [@github-actions](https://github.com/apps/github-actions)! - Made the exported logs on LLM larger and configurable via ENV vars.

- [#2140](https://github.com/LedgerHQ/ledger-live/pull/2140) [`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor the last DeviceJob into a DeviceAction (device rename)

* [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`bcf6ba2ab8`](https://github.com/LedgerHQ/ledger-live/commit/bcf6ba2ab8408e03a0524c3bed5a613ec4415bec) Thanks [@github-actions](https://github.com/apps/github-actions)! - Sentry: ignore HederaAddAccountError

- [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`f6dc733dd4`](https://github.com/LedgerHQ/ledger-live/commit/f6dc733dd447856c7ff6dff2eeaceadd992a0efb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - LLM - rename nano fts to stax

* [#2156](https://github.com/LedgerHQ/ledger-live/pull/2156) [`a078503879`](https://github.com/LedgerHQ/ledger-live/commit/a078503879b9c948439340c7cb6502d5b24e0460) Thanks [@juan-cortes](https://github.com/juan-cortes)! - 670pixel instead of 672 for custom lockscreen images

- [#2174](https://github.com/LedgerHQ/ledger-live/pull/2174) [`4208982cd9`](https://github.com/LedgerHQ/ledger-live/commit/4208982cd96f5e6b2ff9e5222e62279edf01fa95) Thanks [@chabroA](https://github.com/chabroA)! - Fix app crash in case requestAccount currencies array param contains non string values

* [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Protect - Onboarding - add protect entry feature flagged

- [#2123](https://github.com/LedgerHQ/ledger-live/pull/2123) [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Fetches CEX quotes with updated common SDK

* [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`0cfcc2decc`](https://github.com/LedgerHQ/ledger-live/commit/0cfcc2decca13b6533485a5840ba6eb1c97356a9) Thanks [@github-actions](https://github.com/apps/github-actions)! - discover learn section navigation fixed

- [#2128](https://github.com/LedgerHQ/ledger-live/pull/2128) [`98d787335b`](https://github.com/LedgerHQ/ledger-live/commit/98d787335bb62735448b325ff5decd34fef574a3) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix broken scroll UI in MyLedger when "protectServicesMobile" is enabled

* [#2248](https://github.com/LedgerHQ/ledger-live/pull/2248) [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): filter currencies families

* Updated dependencies [[`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d), [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076), [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9), [`fc37600223`](https://github.com/LedgerHQ/ledger-live/commit/fc3760022341a90b51e4d836f38657ffef74040b), [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128), [`a711a20ae8`](https://github.com/LedgerHQ/ledger-live/commit/a711a20ae82c84885705aab7fc6c97f373e973f2), [`7025af53de`](https://github.com/LedgerHQ/ledger-live/commit/7025af53dec8b4ec06cbf57e93515af2bca58645), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`f9b6ff9d5a`](https://github.com/LedgerHQ/ledger-live/commit/f9b6ff9d5a61cd052855260fe94ac48ce54d41e8), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`ae891a166e`](https://github.com/LedgerHQ/ledger-live/commit/ae891a166e5de9947781af3630b1accca42da1a6), [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7), [`7f0ac99dd9`](https://github.com/LedgerHQ/ledger-live/commit/7f0ac99dd9129c2e0833300a3055b90528669485), [`57e7afeff1`](https://github.com/LedgerHQ/ledger-live/commit/57e7afeff1035a89caa696449c6d62cf482fac72), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4), [`b83ff5509c`](https://github.com/LedgerHQ/ledger-live/commit/b83ff5509cf7b66b39642d300b0d7ec5e8582ea7), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405), [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4), [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f), [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7), [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200), [`bcd7c9fd5b`](https://github.com/LedgerHQ/ledger-live/commit/bcd7c9fd5b2a1e2d1b661df6a2004fc201ae99bf), [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701), [`f6947ccc8f`](https://github.com/LedgerHQ/ledger-live/commit/f6947ccc8faceef656929e5fdde1fa6f52619efb), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`9a9c5d700c`](https://github.com/LedgerHQ/ledger-live/commit/9a9c5d700cb0231facd1d29df7024cd9bca5da9d), [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9), [`5cf73f5ce6`](https://github.com/LedgerHQ/ledger-live/commit/5cf73f5ce673bc1e9552ad46bcc7f25c40a92960), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475), [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce), [`13078a0825`](https://github.com/LedgerHQ/ledger-live/commit/13078a08256e3d74eb89dd0be4f0dda57611b68c), [`9bbc36ac05`](https://github.com/LedgerHQ/ledger-live/commit/9bbc36ac05f818ff67553d33f4d1e36df93e5848), [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c), [`22f514abe1`](https://github.com/LedgerHQ/ledger-live/commit/22f514abe1def1c385262a4cd7519d922b633f10), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/live-common@27.11.0
  - @ledgerhq/native-ui@0.15.0
  - @ledgerhq/devices@7.0.7
  - @ledgerhq/react-native-hw-transport-ble@6.28.0
  - @ledgerhq/errors@6.12.3
  - @ledgerhq/types-devices@6.22.4
  - @ledgerhq/types-live@6.28.1
  - @ledgerhq/hw-transport@6.27.10
  - @ledgerhq/react-native-hid@6.28.12
  - @ledgerhq/hw-transport-http@6.27.10

## 3.13.0-next.4

### Patch Changes

- Updated dependencies [[`9bbc36ac05`](https://github.com/LedgerHQ/ledger-live/commit/9bbc36ac05f818ff67553d33f4d1e36df93e5848)]:
  - @ledgerhq/live-common@27.11.0-next.2

## 3.13.0-next.3

### Patch Changes

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`0cfcc2decc`](https://github.com/LedgerHQ/ledger-live/commit/0cfcc2decca13b6533485a5840ba6eb1c97356a9) Thanks [@github-actions](https://github.com/apps/github-actions)! - discover learn section navigation fixed

## 3.13.0-next.2

### Patch Changes

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`bcf6ba2ab8`](https://github.com/LedgerHQ/ledger-live/commit/bcf6ba2ab8408e03a0524c3bed5a613ec4415bec) Thanks [@github-actions](https://github.com/apps/github-actions)! - Sentry: ignore HederaAddAccountError

## 3.13.0-next.1

### Patch Changes

- Updated dependencies [[`a711a20ae8`](https://github.com/LedgerHQ/ledger-live/commit/a711a20ae82c84885705aab7fc6c97f373e973f2)]:
  - @ledgerhq/live-common@27.11.0-next.1

## 3.13.0-next.0

### Minor Changes

- [#2037](https://github.com/LedgerHQ/ledger-live/pull/2037) [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - use new parameter from formatCurrencyUnit, dynamicSignificantDigits, in all related display value components/utils. Increased this value for the display of the account crypto value in Account page so more digits are shown.

* [#2121](https://github.com/LedgerHQ/ledger-live/pull/2121) [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea) Thanks [@lvndry](https://github.com/lvndry)! - Delist Stakenet (XSN) coin

- [#2080](https://github.com/LedgerHQ/ledger-live/pull/2080) [`2200448b70`](https://github.com/LedgerHQ/ledger-live/commit/2200448b70697df875fc03d72f7cfbec3572e875) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - bugfix: llm - fixes issue where From account was being displayed as target account on swap screen"

* [#2154](https://github.com/LedgerHQ/ledger-live/pull/2154) [`1f7f19294f`](https://github.com/LedgerHQ/ledger-live/commit/1f7f19294f5c989a0e29ea1833a73575cb2f595d) Thanks [@grsoares21](https://github.com/grsoares21)! - Small fix on the margins on MyLedger screen for Frimware and Apps update banners

- [#1805](https://github.com/LedgerHQ/ledger-live/pull/1805) [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - NEAR sync, send and stake

* [#2190](https://github.com/LedgerHQ/ledger-live/pull/2190) [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405) Thanks [@chabroA](https://github.com/chabroA)! - Handle bitcoin.getXPpub wallet api method

- [#1932](https://github.com/LedgerHQ/ledger-live/pull/1932) [`fe21b6e0b3`](https://github.com/LedgerHQ/ledger-live/commit/fe21b6e0b34b048046668915b83a5a833ffc3206) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - This PR add the post onboarding claim NFT flow

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): device.transport LLD & LLM integration [LIVE-4293]

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - PRotect - Add Manager entry feature flagged configurable

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): LLM server implementation [LIVE-4394]

- [#2066](https://github.com/LedgerHQ/ledger-live/pull/2066) [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of Ledger Stax related assets and pixel polish (includes changes on the welcome screens of the app)

* [#2214](https://github.com/LedgerHQ/ledger-live/pull/2214) [`3f853fe836`](https://github.com/LedgerHQ/ledger-live/commit/3f853fe83643ad10d7efd4b140fd3d815c29bb08) Thanks [@grsoares21](https://github.com/grsoares21)! - Integrate the new device selection screen everywhere in the app

- [#2081](https://github.com/LedgerHQ/ledger-live/pull/2081) [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Notification Center revamped and now displaying content cards using braze capabilities

### Patch Changes

- [#2225](https://github.com/LedgerHQ/ledger-live/pull/2225) [`a30a2594af`](https://github.com/LedgerHQ/ledger-live/commit/a30a2594afc597b4de936c08e8367d08dd99054d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve access to debug screens

* [#1997](https://github.com/LedgerHQ/ledger-live/pull/1997) [`35b2cbc2f1`](https://github.com/LedgerHQ/ledger-live/commit/35b2cbc2f1dead863de1507c1e40595ec0431eeb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - LLM React to custom image loading and reflect the space taken by it

- [#2255](https://github.com/LedgerHQ/ledger-live/pull/2255) [`e09a545cb0`](https://github.com/LedgerHQ/ledger-live/commit/e09a545cb04a0ae56681eb1acd9deb73fb56dfee) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds in analytics to swap screens on mobile

* [#2219](https://github.com/LedgerHQ/ledger-live/pull/2219) [`f052a64843`](https://github.com/LedgerHQ/ledger-live/commit/f052a648439ccf5be250f6f7c4bc22084569dd43) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve debug theme tool

- [#2126](https://github.com/LedgerHQ/ledger-live/pull/2126) [`3b858335f4`](https://github.com/LedgerHQ/ledger-live/commit/3b858335f412ad6f10ce32148992b117df969182) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix UI for Fallback Camera screen, import accounts/scan

* [#2227](https://github.com/LedgerHQ/ledger-live/pull/2227) [`7ed4cb7f10`](https://github.com/LedgerHQ/ledger-live/commit/7ed4cb7f109d8fe474050cad2567aa1e04100a6f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improvements to the App state debugging tool

- [#1961](https://github.com/LedgerHQ/ledger-live/pull/1961) [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove isFirmwareUpdateVersionSupported logic from LLM

* [#2203](https://github.com/LedgerHQ/ledger-live/pull/2203) [`0b57f91c4e`](https://github.com/LedgerHQ/ledger-live/commit/0b57f91c4ed02cb8e22d6b55b07de6960f5b0a87) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 'Terms of Use Update' pop-up issue in some languages

- [#2149](https://github.com/LedgerHQ/ledger-live/pull/2149) [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Reworked the debug menu and inner tools

* [#2165](https://github.com/LedgerHQ/ledger-live/pull/2165) [`6ae49b03bc`](https://github.com/LedgerHQ/ledger-live/commit/6ae49b03bc5b9c4c262f81654d7f37a20d5ed287) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Fix the back navigation when entering the error screen in the custom lockscreen flow

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701) Thanks [@github-actions](https://github.com/apps/github-actions)! - Handle unseeded Stax error

* [#2071](https://github.com/LedgerHQ/ledger-live/pull/2071) [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - fix ratings modal close behavior

- [#2086](https://github.com/LedgerHQ/ledger-live/pull/2086) [`fabdfbddd5`](https://github.com/LedgerHQ/ledger-live/commit/fabdfbddd59bb17a61ee4a889178cce53dfabc24) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix all cosmos delegation flow with an amount of 0

* [#2143](https://github.com/LedgerHQ/ledger-live/pull/2143) [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flags overriding persistency over app restarts + UX improvements (feature groups, banner, reset all)

- [#2150](https://github.com/LedgerHQ/ledger-live/pull/2150) [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle locked device during genuine check and get latest available firmware update

* [#204](https://github.com/LedgerHQ/ledger-live/pull/204) [`41747ad079`](https://github.com/LedgerHQ/ledger-live/commit/41747ad0796201bacdfb6b95e4d4c43ebd9e4bd0) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Bump Android target & compile SDK to API 32

- [#2089](https://github.com/LedgerHQ/ledger-live/pull/2089) [`301ac48e80`](https://github.com/LedgerHQ/ledger-live/commit/301ac48e80eac24a7c9430fee2bc341129c52e94) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - bugfix - llm - centers t&c link on swap confirmation modal

* [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: BLE pairing flow as components

- [#1852](https://github.com/LedgerHQ/ledger-live/pull/1852) [`01c3025d3b`](https://github.com/LedgerHQ/ledger-live/commit/01c3025d3b742447388f92be66c7b17438168102) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add custom image deeplink

* [#2041](https://github.com/LedgerHQ/ledger-live/pull/2041) [`9189737e0b`](https://github.com/LedgerHQ/ledger-live/commit/9189737e0b137a6455f0fcd8739bf14be8d0a924) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix blank screen when refused camera permissions on iOS scanning recipient for the send flow

- [#2157](https://github.com/LedgerHQ/ledger-live/pull/2157) [`55685e3fb7`](https://github.com/LedgerHQ/ledger-live/commit/55685e3fb77db9bde9b4c52f6f093cb32632ce44) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent crash with reference to nanoFTS in app data

* [#2058](https://github.com/LedgerHQ/ledger-live/pull/2058) [`aee5dd361f`](https://github.com/LedgerHQ/ledger-live/commit/aee5dd361fae6aacb8b7320107417185c90f9b8b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add translation key

- [#2019](https://github.com/LedgerHQ/ledger-live/pull/2019) [`08b0445a5f`](https://github.com/LedgerHQ/ledger-live/commit/08b0445a5f8431042ddffe9abf01e1319d677ad8) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Ethereum custom fees CSS for Ethereum

* [#2120](https://github.com/LedgerHQ/ledger-live/pull/2120) [`432e7fd7f9`](https://github.com/LedgerHQ/ledger-live/commit/432e7fd7f9cb229d9dfef47ceffcefeb94a5cb77) Thanks [@github-actions](https://github.com/apps/github-actions)! - Made the exported logs on LLM larger and configurable via ENV vars.

- [#2140](https://github.com/LedgerHQ/ledger-live/pull/2140) [`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor the last DeviceJob into a DeviceAction (device rename)

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`f6dc733dd4`](https://github.com/LedgerHQ/ledger-live/commit/f6dc733dd447856c7ff6dff2eeaceadd992a0efb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - LLM - rename nano fts to stax

- [#2156](https://github.com/LedgerHQ/ledger-live/pull/2156) [`a078503879`](https://github.com/LedgerHQ/ledger-live/commit/a078503879b9c948439340c7cb6502d5b24e0460) Thanks [@juan-cortes](https://github.com/juan-cortes)! - 670pixel instead of 672 for custom lockscreen images

* [#2174](https://github.com/LedgerHQ/ledger-live/pull/2174) [`4208982cd9`](https://github.com/LedgerHQ/ledger-live/commit/4208982cd96f5e6b2ff9e5222e62279edf01fa95) Thanks [@chabroA](https://github.com/chabroA)! - Fix app crash in case requestAccount currencies array param contains non string values

- [#1802](https://github.com/LedgerHQ/ledger-live/pull/1802) [`b01f9f5c02`](https://github.com/LedgerHQ/ledger-live/commit/b01f9f5c02ef255738b557daba38c1d9f13ee8fe) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Protect - Onboarding - add protect entry feature flagged

* [#2123](https://github.com/LedgerHQ/ledger-live/pull/2123) [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Fetches CEX quotes with updated common SDK

- [#2128](https://github.com/LedgerHQ/ledger-live/pull/2128) [`98d787335b`](https://github.com/LedgerHQ/ledger-live/commit/98d787335bb62735448b325ff5decd34fef574a3) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix broken scroll UI in MyLedger when "protectServicesMobile" is enabled

* [#2248](https://github.com/LedgerHQ/ledger-live/pull/2248) [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): filter currencies families

* Updated dependencies [[`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d), [`87826dce62`](https://github.com/LedgerHQ/ledger-live/commit/87826dce627602cef94cf4831c17251069b92076), [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9), [`fc37600223`](https://github.com/LedgerHQ/ledger-live/commit/fc3760022341a90b51e4d836f38657ffef74040b), [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128), [`7025af53de`](https://github.com/LedgerHQ/ledger-live/commit/7025af53dec8b4ec06cbf57e93515af2bca58645), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`f9b6ff9d5a`](https://github.com/LedgerHQ/ledger-live/commit/f9b6ff9d5a61cd052855260fe94ac48ce54d41e8), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`ae891a166e`](https://github.com/LedgerHQ/ledger-live/commit/ae891a166e5de9947781af3630b1accca42da1a6), [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7), [`7f0ac99dd9`](https://github.com/LedgerHQ/ledger-live/commit/7f0ac99dd9129c2e0833300a3055b90528669485), [`57e7afeff1`](https://github.com/LedgerHQ/ledger-live/commit/57e7afeff1035a89caa696449c6d62cf482fac72), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4), [`b83ff5509c`](https://github.com/LedgerHQ/ledger-live/commit/b83ff5509cf7b66b39642d300b0d7ec5e8582ea7), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405), [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4), [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f), [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7), [`cc3c591bdc`](https://github.com/LedgerHQ/ledger-live/commit/cc3c591bdcb31df5882210fa43928603c2bcb200), [`bcd7c9fd5b`](https://github.com/LedgerHQ/ledger-live/commit/bcd7c9fd5b2a1e2d1b661df6a2004fc201ae99bf), [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701), [`f6947ccc8f`](https://github.com/LedgerHQ/ledger-live/commit/f6947ccc8faceef656929e5fdde1fa6f52619efb), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`9a9c5d700c`](https://github.com/LedgerHQ/ledger-live/commit/9a9c5d700cb0231facd1d29df7024cd9bca5da9d), [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9), [`5cf73f5ce6`](https://github.com/LedgerHQ/ledger-live/commit/5cf73f5ce673bc1e9552ad46bcc7f25c40a92960), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475), [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce), [`13078a0825`](https://github.com/LedgerHQ/ledger-live/commit/13078a08256e3d74eb89dd0be4f0dda57611b68c), [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c), [`22f514abe1`](https://github.com/LedgerHQ/ledger-live/commit/22f514abe1def1c385262a4cd7519d922b633f10), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/live-common@27.11.0-next.0
  - @ledgerhq/native-ui@0.15.0-next.0
  - @ledgerhq/devices@7.0.7-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.28.0-next.0
  - @ledgerhq/errors@6.12.3-next.0
  - @ledgerhq/types-devices@6.22.4-next.0
  - @ledgerhq/types-live@6.28.1-next.0
  - @ledgerhq/hw-transport@6.27.10-next.0
  - @ledgerhq/react-native-hid@6.28.12-next.0
  - @ledgerhq/hw-transport-http@6.27.10-next.0

## 3.12.0

### Minor Changes

- [#1831](https://github.com/LedgerHQ/ledger-live/pull/1831) [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - The Carousel section of the wallet page has been replaced by Braze Content Cards which allows us to add or remove them remotely. We also added Content Cards on the Asset page

* [#1817](https://github.com/LedgerHQ/ledger-live/pull/1817) [`57b82ad735`](https://github.com/LedgerHQ/ledger-live/commit/57b82ad7350c6368b2d6a731d7b1c52b759516b0) Thanks [@sarneijim](https://github.com/sarneijim)! - CIC swap integration

- [#1775](https://github.com/LedgerHQ/ledger-live/pull/1775) [`d10c727430`](https://github.com/LedgerHQ/ledger-live/commit/d10c727430ffece743bbb7e703aaff61f97dacc1) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add NFT Gallery

* [#1774](https://github.com/LedgerHQ/ledger-live/pull/1774) [`033cfa3611`](https://github.com/LedgerHQ/ledger-live/commit/033cfa3611cb2ee17a71b152fc21475379229055) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Update the custom image flow to include previews and default processing shortcuts

- [#1983](https://github.com/LedgerHQ/ledger-live/pull/1983) [`6eb5e8277c`](https://github.com/LedgerHQ/ledger-live/commit/6eb5e8277cc8a5b4c42293a981952e37fac39682) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Revert mobile usemax key to original

* [#1962](https://github.com/LedgerHQ/ledger-live/pull/1962) [`d96bcf101d`](https://github.com/LedgerHQ/ledger-live/commit/d96bcf101d5f023fd75e8ee6e0bcaebc83cad07d) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - add more explicit error for tron trc20

- [#1746](https://github.com/LedgerHQ/ledger-live/pull/1746) [`b7107fad4d`](https://github.com/LedgerHQ/ledger-live/commit/b7107fad4d62e60377d015e5591728121c64bb38) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Allow custom images to be sourced from an NFT from the users' gallery

* [#1911](https://github.com/LedgerHQ/ledger-live/pull/1911) [`5000d826fb`](https://github.com/LedgerHQ/ledger-live/commit/5000d826fb8bd38e729489ece2c36240a6a69091) Thanks [@grsoares21](https://github.com/grsoares21)! - Auto-select the last connected device for CLS if it is a Nano FTS

### Patch Changes

- [#1859](https://github.com/LedgerHQ/ledger-live/pull/1859) [`a6693e4f69`](https://github.com/LedgerHQ/ledger-live/commit/a6693e4f699a694d555a35e807a2fdbaab0d0d94) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix debug http transport screen

* [#1904](https://github.com/LedgerHQ/ledger-live/pull/1904) [`159b3f8b05`](https://github.com/LedgerHQ/ledger-live/commit/159b3f8b054b9d2715e36db68e68c0eaec66c270) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix rendering crash in new device selection screen

- [#1801](https://github.com/LedgerHQ/ledger-live/pull/1801) [`c2663f2f05`](https://github.com/LedgerHQ/ledger-live/commit/c2663f2f05b027f20ea5e9e80ee00111bf204ecb) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flag settings: fixed an annoying UI issue when the keyboard is opened. The info box at the bottom would cover most of the screen, making it very unpractical to search/add flags.

* [#1809](https://github.com/LedgerHQ/ledger-live/pull/1809) [`682342a210`](https://github.com/LedgerHQ/ledger-live/commit/682342a2106e841890140c5f6bd4a2df7cefcee8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix Podfile to disable signing on pods

- [#1801](https://github.com/LedgerHQ/ledger-live/pull/1801) [`c2663f2f05`](https://github.com/LedgerHQ/ledger-live/commit/c2663f2f05b027f20ea5e9e80ee00111bf204ecb) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Adding a flag that allows to easily know which Firebase project/environment is targeted (for that the flag needs to be configured appropriately on the Firebase project, for now this is done for all our existing Firebase projects.). Also adding a UI element to easily visualize this in the Feature Flag settings.

* [#1741](https://github.com/LedgerHQ/ledger-live/pull/1741) [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix for locked device error

- [#1975](https://github.com/LedgerHQ/ledger-live/pull/1975) [`ac8bdb8dcf`](https://github.com/LedgerHQ/ledger-live/commit/ac8bdb8dcf19103eea0b881930eef43aacc4e5e7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Device actions: remove unnecessary padding & replace huge text by smaller text

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native library

- [#1834](https://github.com/LedgerHQ/ledger-live/pull/1834) [`c5bd929921`](https://github.com/LedgerHQ/ledger-live/commit/c5bd929921661469b86374a4fa72e9df575d4d08) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Redirection CLS from MyLedger

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of a storyly story in the sync onboarding step "secret recovery phrase"

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce debug screen for custom image backup

* [#1803](https://github.com/LedgerHQ/ledger-live/pull/1803) [`5f71360167`](https://github.com/LedgerHQ/ledger-live/commit/5f71360167f820446fd5f56132e887767aca9905) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix crash at the install apps step of the synchronous onboarding

- [#1803](https://github.com/LedgerHQ/ledger-live/pull/1803) [`5f71360167`](https://github.com/LedgerHQ/ledger-live/commit/5f71360167f820446fd5f56132e887767aca9905) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add a way to activate multiple Feature Flags at once

* [#1833](https://github.com/LedgerHQ/ledger-live/pull/1833) [`447353c463`](https://github.com/LedgerHQ/ledger-live/commit/447353c463caebb94f28775cd24c279a6e463a05) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Android: use StagingRelease buildType for :apk and :apk_local builds

- [#1985](https://github.com/LedgerHQ/ledger-live/pull/1985) [`f268bf4bda`](https://github.com/LedgerHQ/ledger-live/commit/f268bf4bdaf3d3c16ae8f3c06fb202999c5e9491) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improve Analytics for NFT Gallery

* [#1871](https://github.com/LedgerHQ/ledger-live/pull/1871) [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Enabled BLE background capabilities again

- [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implementation of a debug screen for storyly stories

* [#2009](https://github.com/LedgerHQ/ledger-live/pull/2009) [`ef13f615d6`](https://github.com/LedgerHQ/ledger-live/commit/ef13f615d663a7d2e37ad70e46ebe5d826d99c09) Thanks [@gre](https://github.com/gre)! - Solve crash when entering token receive flow

- [#1809](https://github.com/LedgerHQ/ledger-live/pull/1809) [`682342a210`](https://github.com/LedgerHQ/ledger-live/commit/682342a2106e841890140c5f6bd4a2df7cefcee8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix sync onboarding logic when "install set of apps" step is disabled via feature flag.

* [#1840](https://github.com/LedgerHQ/ledger-live/pull/1840) [`601c35ff2e`](https://github.com/LedgerHQ/ledger-live/commit/601c35ff2e9905c1d7869f531d85898436e2e86d) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: improvement on BLE scanning and polling mechanism

- [#1812](https://github.com/LedgerHQ/ledger-live/pull/1812) [`f94772354e`](https://github.com/LedgerHQ/ledger-live/commit/f94772354e18e84dfee20fbb5260f543a1b302b0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - The push notifications feature flag's key has been modified

* [#1827](https://github.com/LedgerHQ/ledger-live/pull/1827) [`04013a766a`](https://github.com/LedgerHQ/ledger-live/commit/04013a766ae0b1e872a84ebfc8f5a28602a2ee11) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix navigation lock bug after (un)installing apps, top arrow

- [#1956](https://github.com/LedgerHQ/ledger-live/pull/1956) [`587853bb30`](https://github.com/LedgerHQ/ledger-live/commit/587853bb30232efb0ff9e5b112969b6293a35ad6) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix support link llm

- Updated dependencies [[`627b46b58e`](https://github.com/LedgerHQ/ledger-live/commit/627b46b58ed83970c69d621303af7a3a7e51850b), [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71), [`eef8038f61`](https://github.com/LedgerHQ/ledger-live/commit/eef8038f611820efffd3b4834e124be0c29acd39), [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71), [`a00544e8de`](https://github.com/LedgerHQ/ledger-live/commit/a00544e8de135285609e9aabc2d4ca354f8ebc2a), [`f29d3d9384`](https://github.com/LedgerHQ/ledger-live/commit/f29d3d9384f57c99c228749673d4f5d840b4bf06), [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248), [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129), [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129), [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b)]:
  - @ledgerhq/react-native-hw-transport-ble@6.27.11
  - @ledgerhq/live-common@27.9.0
  - @ledgerhq/native-ui@0.13.0
  - @ledgerhq/types-live@6.27.1

## 3.12.0-next.2

### Patch Changes

- [#2009](https://github.com/LedgerHQ/ledger-live/pull/2009) [`ef13f615d6`](https://github.com/LedgerHQ/ledger-live/commit/ef13f615d663a7d2e37ad70e46ebe5d826d99c09) Thanks [@gre](https://github.com/gre)! - Solve crash when entering token receive flow

## 3.12.0-next.1

### Patch Changes

- Updated dependencies [[`627b46b58e`](https://github.com/LedgerHQ/ledger-live/commit/627b46b58ed83970c69d621303af7a3a7e51850b)]:
  - @ledgerhq/react-native-hw-transport-ble@6.27.11-next.1

## 3.12.0-next.0

### Minor Changes

- [#1831](https://github.com/LedgerHQ/ledger-live/pull/1831) [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - The Carousel section of the wallet page has been replaced by Braze Content Cards which allows us to add or remove them remotely. We also added Content Cards on the Asset page

* [#1817](https://github.com/LedgerHQ/ledger-live/pull/1817) [`57b82ad735`](https://github.com/LedgerHQ/ledger-live/commit/57b82ad7350c6368b2d6a731d7b1c52b759516b0) Thanks [@sarneijim](https://github.com/sarneijim)! - CIC swap integration

- [#1775](https://github.com/LedgerHQ/ledger-live/pull/1775) [`d10c727430`](https://github.com/LedgerHQ/ledger-live/commit/d10c727430ffece743bbb7e703aaff61f97dacc1) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add NFT Gallery

* [#1774](https://github.com/LedgerHQ/ledger-live/pull/1774) [`033cfa3611`](https://github.com/LedgerHQ/ledger-live/commit/033cfa3611cb2ee17a71b152fc21475379229055) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Update the custom image flow to include previews and default processing shortcuts

- [#1983](https://github.com/LedgerHQ/ledger-live/pull/1983) [`6eb5e8277c`](https://github.com/LedgerHQ/ledger-live/commit/6eb5e8277cc8a5b4c42293a981952e37fac39682) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Revert mobile usemax key to original

* [#1962](https://github.com/LedgerHQ/ledger-live/pull/1962) [`d96bcf101d`](https://github.com/LedgerHQ/ledger-live/commit/d96bcf101d5f023fd75e8ee6e0bcaebc83cad07d) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - add more explicit error for tron trc20

- [#1746](https://github.com/LedgerHQ/ledger-live/pull/1746) [`b7107fad4d`](https://github.com/LedgerHQ/ledger-live/commit/b7107fad4d62e60377d015e5591728121c64bb38) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Allow custom images to be sourced from an NFT from the users' gallery

* [#1911](https://github.com/LedgerHQ/ledger-live/pull/1911) [`5000d826fb`](https://github.com/LedgerHQ/ledger-live/commit/5000d826fb8bd38e729489ece2c36240a6a69091) Thanks [@grsoares21](https://github.com/grsoares21)! - Auto-select the last connected device for CLS if it is a Nano FTS

### Patch Changes

- [#1859](https://github.com/LedgerHQ/ledger-live/pull/1859) [`a6693e4f69`](https://github.com/LedgerHQ/ledger-live/commit/a6693e4f699a694d555a35e807a2fdbaab0d0d94) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix debug http transport screen

* [#1904](https://github.com/LedgerHQ/ledger-live/pull/1904) [`159b3f8b05`](https://github.com/LedgerHQ/ledger-live/commit/159b3f8b054b9d2715e36db68e68c0eaec66c270) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix rendering crash in new device selection screen

- [#1801](https://github.com/LedgerHQ/ledger-live/pull/1801) [`c2663f2f05`](https://github.com/LedgerHQ/ledger-live/commit/c2663f2f05b027f20ea5e9e80ee00111bf204ecb) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flag settings: fixed an annoying UI issue when the keyboard is opened. The info box at the bottom would cover most of the screen, making it very unpractical to search/add flags.

* [#1809](https://github.com/LedgerHQ/ledger-live/pull/1809) [`682342a210`](https://github.com/LedgerHQ/ledger-live/commit/682342a2106e841890140c5f6bd4a2df7cefcee8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix Podfile to disable signing on pods

- [#1801](https://github.com/LedgerHQ/ledger-live/pull/1801) [`c2663f2f05`](https://github.com/LedgerHQ/ledger-live/commit/c2663f2f05b027f20ea5e9e80ee00111bf204ecb) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Adding a flag that allows to easily know which Firebase project/environment is targeted (for that the flag needs to be configured appropriately on the Firebase project, for now this is done for all our existing Firebase projects.). Also adding a UI element to easily visualize this in the Feature Flag settings.

* [#1741](https://github.com/LedgerHQ/ledger-live/pull/1741) [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix for locked device error

- [#1975](https://github.com/LedgerHQ/ledger-live/pull/1975) [`ac8bdb8dcf`](https://github.com/LedgerHQ/ledger-live/commit/ac8bdb8dcf19103eea0b881930eef43aacc4e5e7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Device actions: remove unnecessary padding & replace huge text by smaller text

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native library

- [#1834](https://github.com/LedgerHQ/ledger-live/pull/1834) [`c5bd929921`](https://github.com/LedgerHQ/ledger-live/commit/c5bd929921661469b86374a4fa72e9df575d4d08) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Redirection CLS from MyLedger

* [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of a storyly story in the sync onboarding step "secret recovery phrase"

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce debug screen for custom image backup

* [#1803](https://github.com/LedgerHQ/ledger-live/pull/1803) [`5f71360167`](https://github.com/LedgerHQ/ledger-live/commit/5f71360167f820446fd5f56132e887767aca9905) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix crash at the install apps step of the synchronous onboarding

- [#1803](https://github.com/LedgerHQ/ledger-live/pull/1803) [`5f71360167`](https://github.com/LedgerHQ/ledger-live/commit/5f71360167f820446fd5f56132e887767aca9905) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add a way to activate multiple Feature Flags at once

* [#1833](https://github.com/LedgerHQ/ledger-live/pull/1833) [`447353c463`](https://github.com/LedgerHQ/ledger-live/commit/447353c463caebb94f28775cd24c279a6e463a05) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Android: use StagingRelease buildType for :apk and :apk_local builds

- [#1985](https://github.com/LedgerHQ/ledger-live/pull/1985) [`f268bf4bda`](https://github.com/LedgerHQ/ledger-live/commit/f268bf4bdaf3d3c16ae8f3c06fb202999c5e9491) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improve Analytics for NFT Gallery

* [#1871](https://github.com/LedgerHQ/ledger-live/pull/1871) [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Enabled BLE background capabilities again

- [#1759](https://github.com/LedgerHQ/ledger-live/pull/1759) [`77622be003`](https://github.com/LedgerHQ/ledger-live/commit/77622be0033cb7af6ac1284b302ac62e4825652b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implementation of a debug screen for storyly stories

* [#1809](https://github.com/LedgerHQ/ledger-live/pull/1809) [`682342a210`](https://github.com/LedgerHQ/ledger-live/commit/682342a2106e841890140c5f6bd4a2df7cefcee8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix sync onboarding logic when "install set of apps" step is disabled via feature flag.

- [#1840](https://github.com/LedgerHQ/ledger-live/pull/1840) [`601c35ff2e`](https://github.com/LedgerHQ/ledger-live/commit/601c35ff2e9905c1d7869f531d85898436e2e86d) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: improvement on BLE scanning and polling mechanism

* [#1812](https://github.com/LedgerHQ/ledger-live/pull/1812) [`f94772354e`](https://github.com/LedgerHQ/ledger-live/commit/f94772354e18e84dfee20fbb5260f543a1b302b0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - The push notifications feature flag's key has been modified

- [#1827](https://github.com/LedgerHQ/ledger-live/pull/1827) [`04013a766a`](https://github.com/LedgerHQ/ledger-live/commit/04013a766ae0b1e872a84ebfc8f5a28602a2ee11) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix navigation lock bug after (un)installing apps, top arrow

* [#1956](https://github.com/LedgerHQ/ledger-live/pull/1956) [`587853bb30`](https://github.com/LedgerHQ/ledger-live/commit/587853bb30232efb0ff9e5b112969b6293a35ad6) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix support link llm

* Updated dependencies [[`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71), [`eef8038f61`](https://github.com/LedgerHQ/ledger-live/commit/eef8038f611820efffd3b4834e124be0c29acd39), [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71), [`a00544e8de`](https://github.com/LedgerHQ/ledger-live/commit/a00544e8de135285609e9aabc2d4ca354f8ebc2a), [`f29d3d9384`](https://github.com/LedgerHQ/ledger-live/commit/f29d3d9384f57c99c228749673d4f5d840b4bf06), [`8ac70e5cca`](https://github.com/LedgerHQ/ledger-live/commit/8ac70e5ccab58159c646f23694c1da13ebc00248), [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129), [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129), [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b)]:
  - @ledgerhq/live-common@27.9.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.11-next.0
  - @ledgerhq/native-ui@0.13.0-next.0
  - @ledgerhq/types-live@6.27.1-next.0

## 3.11.2

### Patch Changes

- Updated dependencies [[`bdf55e0411`](https://github.com/LedgerHQ/ledger-live/commit/bdf55e0411d46c0bf68d42b7f96b75d49ba81a67)]:
  - @ledgerhq/live-common@27.7.2

## 3.11.2-hotfix.0

### Patch Changes

- Updated dependencies [[`bdf55e0411`](https://github.com/LedgerHQ/ledger-live/commit/bdf55e0411d46c0bf68d42b7f96b75d49ba81a67)]:
  - @ledgerhq/live-common@27.7.2-hotfix.0

## 3.11.1

### Patch Changes

- Updated dependencies [[`f7aa25417a`](https://github.com/LedgerHQ/ledger-live/commit/f7aa25417a953a6e4768e0b5d500cab566369a0a), [`e3a796b0a0`](https://github.com/LedgerHQ/ledger-live/commit/e3a796b0a021b19ff01061a019657cea26cc46de)]:
  - @ledgerhq/live-common@27.7.1

## 3.11.1-hotfix.1

### Patch Changes

- Updated dependencies [[`e3a796b0a0`](https://github.com/LedgerHQ/ledger-live/commit/e3a796b0a021b19ff01061a019657cea26cc46de)]:
  - @ledgerhq/live-common@27.7.1-hotfix.1

## 3.11.1-hotfix.0

### Patch Changes

- Updated dependencies [[`f7aa25417a`](https://github.com/LedgerHQ/ledger-live/commit/f7aa25417a953a6e4768e0b5d500cab566369a0a)]:
  - @ledgerhq/live-common@27.7.1-hotfix.0

## 3.11.0

### Minor Changes

- [#1842](https://github.com/LedgerHQ/ledger-live/pull/1842) [`32633f700a`](https://github.com/LedgerHQ/ledger-live/commit/32633f700ae4be9ede37c4bef3ed228c0ffc87be) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Fix redelegation cosmos previous screen bug

* [#1757](https://github.com/LedgerHQ/ledger-live/pull/1757) [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - disable nft on ios with feature flag

- [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - New UI parsing for signMessage flow, supporting EIP712 filtering

* [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - EIP1559 support for Ethereum transactions

- [#1455](https://github.com/LedgerHQ/ledger-live/pull/1455) [`61240d25a1`](https://github.com/LedgerHQ/ledger-live/commit/61240d25a13cea07b08ee09fa76f31127928a8c6) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add deeplink to open the sync onboarding flow

* [#1288](https://github.com/LedgerHQ/ledger-live/pull/1288) [`f5f4db47d2`](https://github.com/LedgerHQ/ledger-live/commit/f5f4db47d214bc30390b7be91d3bab4814c5fb45) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Dynamic cal for erc20

- [#1667](https://github.com/LedgerHQ/ledger-live/pull/1667) [`654253f1a1`](https://github.com/LedgerHQ/ledger-live/commit/654253f1a17dfc09037a1ec8f25c6eae8c0081af) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add install set of apps step in sync onboarding

* [#1467](https://github.com/LedgerHQ/ledger-live/pull/1467) [`7556612769`](https://github.com/LedgerHQ/ledger-live/commit/7556612769ba0a41c1dd903da25e74262e883358) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Braze Integration added to add push notifications and content cards to LLM

### Patch Changes

- [#1728](https://github.com/LedgerHQ/ledger-live/pull/1728) [`135838d354`](https://github.com/LedgerHQ/ledger-live/commit/135838d35439aae1565959ead31944f7a5c7a6fa) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Migrate from expo-image-picker to react-native-image-picker to kill a JCenter dependency

* [#1639](https://github.com/LedgerHQ/ledger-live/pull/1639) [`4ebe39596e`](https://github.com/LedgerHQ/ledger-live/commit/4ebe39596e23662e878395d16282d003db745b57) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Replaced a deprecated biometrics lib by a newer one

- [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: Buy Ledger button direct redirection

* [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`cf9fde64bc`](https://github.com/LedgerHQ/ledger-live/commit/cf9fde64bca7f3265c354a3fddfdbce7b89949cd) Thanks [@github-actions](https://github.com/apps/github-actions)! - removing duplicated permissions from merged manifest

- [#1663](https://github.com/LedgerHQ/ledger-live/pull/1663) [`a141256f0f`](https://github.com/LedgerHQ/ledger-live/commit/a141256f0f4fff91fb811eaf081f7138f91ff251) Thanks [@lvndry](https://github.com/lvndry)! - When removing a token from the list of hidden tokens, it will be redisplayed in the app'

* [#1763](https://github.com/LedgerHQ/ledger-live/pull/1763) [`4cc023d011`](https://github.com/LedgerHQ/ledger-live/commit/4cc023d0112e9b0629d883ba5e15b216a64ea3a1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - react-native updated from version 0.68.2 to version 0.68.5 to fix android builds

- [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: invert 2 options "Connect an existing Ledger" and "Set up a new Ledger"

* [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: pixel polish

- [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: change banner wording

* [#1870](https://github.com/LedgerHQ/ledger-live/pull/1870) [`984e4a7130`](https://github.com/LedgerHQ/ledger-live/commit/984e4a7130ccdebee2c2c3fa725e81040053ed18) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Every notifications categories are enabled by default even when updating LL to 3.11

- [#1750](https://github.com/LedgerHQ/ledger-live/pull/1750) [`1617b46f24`](https://github.com/LedgerHQ/ledger-live/commit/1617b46f24001762c94c471610257f457b485e66) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - OTG Banner for Android on Device Selection

* [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Fixed all typescript/eslint errors/warnings.

- [#1320](https://github.com/LedgerHQ/ledger-live/pull/1320) [`bc892dc3ef`](https://github.com/LedgerHQ/ledger-live/commit/bc892dc3ef0671c049c650bf05e71c254e688bf7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add account flow: Testnet currencies shouldn't be available by default

* [#1818](https://github.com/LedgerHQ/ledger-live/pull/1818) [`9d811641ae`](https://github.com/LedgerHQ/ledger-live/commit/9d811641ae0224df7592021d22ca41107ab905e6) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Bump Android target & compile SDK to API 32

- [#1731](https://github.com/LedgerHQ/ledger-live/pull/1731) [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Fix the post onboarding redirection if there is no action

* [#1675](https://github.com/LedgerHQ/ledger-live/pull/1675) [`565b3f16df`](https://github.com/LedgerHQ/ledger-live/commit/565b3f16df664ddb0e487fa737445f96dec7f953) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Fix lotties for LNX new Bluetooth pairing flow

- [#1808](https://github.com/LedgerHQ/ledger-live/pull/1808) [`deeaa61fe1`](https://github.com/LedgerHQ/ledger-live/commit/deeaa61fe1bb4427057f8577f7235cf4f6ada5b0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Typo on warning message in Advanced account settings

* [#1513](https://github.com/LedgerHQ/ledger-live/pull/1513) [`ffc377ddf0`](https://github.com/LedgerHQ/ledger-live/commit/ffc377ddf0c354f450e3790bd221e8d57f58e9e1) Thanks [@lvndry](https://github.com/lvndry)! - Addition of a dust limit for bitcoin transactions

- [#1352](https://github.com/LedgerHQ/ledger-live/pull/1352) [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Moved custom image errors from ledger-live-mobile to live-common

* [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`d786362784`](https://github.com/LedgerHQ/ledger-live/commit/d786362784337663626da8c75b100c7e379e7f67) Thanks [@github-actions](https://github.com/apps/github-actions)! - Every notifications categories are enabled by default even when updating LL to 3.11

- [#1761](https://github.com/LedgerHQ/ledger-live/pull/1761) [`7be1afc65b`](https://github.com/LedgerHQ/ledger-live/commit/7be1afc65b33081f8a4ab0eb725d5153a92271ad) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Analytics - added firstConnectHasDeviceUpdated property

* [#1615](https://github.com/LedgerHQ/ledger-live/pull/1615) [`34546edc55`](https://github.com/LedgerHQ/ledger-live/commit/34546edc55674e49b22c6d3be08777ee13d306f9) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add hidden button in Welcome screen to access the settings.

- [#1685](https://github.com/LedgerHQ/ledger-live/pull/1685) [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Handle 0x5515 response for allow manager and connect app device actions on LLM

* [#1867](https://github.com/LedgerHQ/ledger-live/pull/1867) [`5f2f6ead06`](https://github.com/LedgerHQ/ledger-live/commit/5f2f6ead061261daee7da73fdb7761c4e3d86ffd) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix crash on Android 12+ during Firmware Update

- [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`1dc29a7017`](https://github.com/LedgerHQ/ledger-live/commit/1dc29a7017a5ed63429c86e1dbaf4bfb844a0efa) Thanks [@github-actions](https://github.com/apps/github-actions)! - The push notifications feature flag's key has been modified

* [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`eaa3184ef1`](https://github.com/LedgerHQ/ledger-live/commit/eaa3184ef15fd7c6249f84bf4501bcb734cbd589) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix navigation lock bug after (un)installing apps, top arrow

* Updated dependencies [[`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`4aa4d42cb1`](https://github.com/LedgerHQ/ledger-live/commit/4aa4d42cb103612c130b01f36100eb6fdd87e8b1), [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305), [`9f8c9be0ae`](https://github.com/LedgerHQ/ledger-live/commit/9f8c9be0aead9eb4101aa9d14e4ee3b560d88792), [`3f516ea41e`](https://github.com/LedgerHQ/ledger-live/commit/3f516ea41e6e1a485be452872c91bd4a315eb167), [`2660f2993c`](https://github.com/LedgerHQ/ledger-live/commit/2660f2993cc815f10a8e8ffea18fb761d869fc36), [`f7b27a97f6`](https://github.com/LedgerHQ/ledger-live/commit/f7b27a97f6cd2b2c553cbe83d008e4ce907c9ad2), [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`914c5fb377`](https://github.com/LedgerHQ/ledger-live/commit/914c5fb377b8b541f5f645fe26ab80faaa33d478), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3), [`57699a19fa`](https://github.com/LedgerHQ/ledger-live/commit/57699a19fa545ba359e457deb7ba0632b15342b5), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`f521bf7ef1`](https://github.com/LedgerHQ/ledger-live/commit/f521bf7ef1afa3afe1a03cbf65bd36ebee6d0768), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd), [`1dc29a7017`](https://github.com/LedgerHQ/ledger-live/commit/1dc29a7017a5ed63429c86e1dbaf4bfb844a0efa), [`90a9fbb75b`](https://github.com/LedgerHQ/ledger-live/commit/90a9fbb75b3b3960655d601a6c7c987689ef19be)]:
  - @ledgerhq/live-common@27.7.0
  - @ledgerhq/errors@6.12.0
  - @ledgerhq/types-live@6.26.0
  - @ledgerhq/hw-transport@6.27.7
  - @ledgerhq/hw-transport-http@6.27.7
  - @ledgerhq/types-cryptoassets@6.23.3
  - @ledgerhq/native-ui@0.12.1
  - @ledgerhq/devices@7.0.4
  - @ledgerhq/react-native-hid@6.28.9
  - @ledgerhq/react-native-hw-transport-ble@6.27.9

## 3.11.0-next.10

### Patch Changes

- [#1867](https://github.com/LedgerHQ/ledger-live/pull/1867) [`5f2f6ead06`](https://github.com/LedgerHQ/ledger-live/commit/5f2f6ead061261daee7da73fdb7761c4e3d86ffd) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix crash on Android 12+ during Firmware Update

## 3.11.0-next.9

### Patch Changes

- [#1870](https://github.com/LedgerHQ/ledger-live/pull/1870) [`984e4a7130`](https://github.com/LedgerHQ/ledger-live/commit/984e4a7130ccdebee2c2c3fa725e81040053ed18) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Every notifications categories are enabled by default even when updating LL to 3.11

## 3.11.0-next.8

### Minor Changes

- [#1842](https://github.com/LedgerHQ/ledger-live/pull/1842) [`32633f700a`](https://github.com/LedgerHQ/ledger-live/commit/32633f700ae4be9ede37c4bef3ed228c0ffc87be) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Fix redelegation cosmos previous screen bug

### Patch Changes

- Updated dependencies [[`2660f2993c`](https://github.com/LedgerHQ/ledger-live/commit/2660f2993cc815f10a8e8ffea18fb761d869fc36)]:
  - @ledgerhq/live-common@27.7.0-next.3

## 3.11.0-next.7

### Patch Changes

- Updated dependencies [[`9f8c9be0ae`](https://github.com/LedgerHQ/ledger-live/commit/9f8c9be0aead9eb4101aa9d14e4ee3b560d88792)]:
  - @ledgerhq/live-common@27.7.0-next.2

## 3.11.0-next.6

### Patch Changes

- [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`d786362784`](https://github.com/LedgerHQ/ledger-live/commit/d786362784337663626da8c75b100c7e379e7f67) Thanks [@github-actions](https://github.com/apps/github-actions)! - Every notifications categories are enabled by default even when updating LL to 3.11

## 3.11.0-next.5

### Patch Changes

- [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`eaa3184ef1`](https://github.com/LedgerHQ/ledger-live/commit/eaa3184ef15fd7c6249f84bf4501bcb734cbd589) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix navigation lock bug after (un)installing apps, top arrow

## 3.11.0-next.4

### Patch Changes

- [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`cf9fde64bc`](https://github.com/LedgerHQ/ledger-live/commit/cf9fde64bca7f3265c354a3fddfdbce7b89949cd) Thanks [@github-actions](https://github.com/apps/github-actions)! - removing duplicated permissions from merged manifest

## 3.11.0-next.3

### Patch Changes

- [#1818](https://github.com/LedgerHQ/ledger-live/pull/1818) [`9d811641ae`](https://github.com/LedgerHQ/ledger-live/commit/9d811641ae0224df7592021d22ca41107ab905e6) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Bump Android target & compile SDK to API 32

## 3.11.0-next.2

### Patch Changes

- [#1806](https://github.com/LedgerHQ/ledger-live/pull/1806) [`1dc29a7017`](https://github.com/LedgerHQ/ledger-live/commit/1dc29a7017a5ed63429c86e1dbaf4bfb844a0efa) Thanks [@github-actions](https://github.com/apps/github-actions)! - The push notifications feature flag's key has been modified

- Updated dependencies [[`1dc29a7017`](https://github.com/LedgerHQ/ledger-live/commit/1dc29a7017a5ed63429c86e1dbaf4bfb844a0efa)]:
  - @ledgerhq/types-live@6.26.0-next.1
  - @ledgerhq/live-common@27.7.0-next.1

## 3.11.0-next.1

### Patch Changes

- Updated dependencies [[`f521bf7ef1`](https://github.com/LedgerHQ/ledger-live/commit/f521bf7ef1afa3afe1a03cbf65bd36ebee6d0768)]:
  - @ledgerhq/live-common@27.7.0-next.1

## 3.11.0-next.0

### Minor Changes

- [#1757](https://github.com/LedgerHQ/ledger-live/pull/1757) [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - disable nft on ios with feature flag

* [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - New UI parsing for signMessage flow, supporting EIP712 filtering

- [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - EIP1559 support for Ethereum transactions

* [#1455](https://github.com/LedgerHQ/ledger-live/pull/1455) [`61240d25a1`](https://github.com/LedgerHQ/ledger-live/commit/61240d25a13cea07b08ee09fa76f31127928a8c6) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add deeplink to open the sync onboarding flow

- [#1288](https://github.com/LedgerHQ/ledger-live/pull/1288) [`f5f4db47d2`](https://github.com/LedgerHQ/ledger-live/commit/f5f4db47d214bc30390b7be91d3bab4814c5fb45) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Dynamic cal for erc20

* [#1667](https://github.com/LedgerHQ/ledger-live/pull/1667) [`654253f1a1`](https://github.com/LedgerHQ/ledger-live/commit/654253f1a17dfc09037a1ec8f25c6eae8c0081af) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Add install set of apps step in sync onboarding

- [#1467](https://github.com/LedgerHQ/ledger-live/pull/1467) [`7556612769`](https://github.com/LedgerHQ/ledger-live/commit/7556612769ba0a41c1dd903da25e74262e883358) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Braze Integration added to add push notifications and content cards to LLM

### Patch Changes

- [#1728](https://github.com/LedgerHQ/ledger-live/pull/1728) [`135838d354`](https://github.com/LedgerHQ/ledger-live/commit/135838d35439aae1565959ead31944f7a5c7a6fa) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Migrate from expo-image-picker to react-native-image-picker to kill a JCenter dependency

* [#1639](https://github.com/LedgerHQ/ledger-live/pull/1639) [`4ebe39596e`](https://github.com/LedgerHQ/ledger-live/commit/4ebe39596e23662e878395d16282d003db745b57) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Replaced a deprecated biometrics lib by a newer one

- [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: Buy Ledger button direct redirection

* [#1663](https://github.com/LedgerHQ/ledger-live/pull/1663) [`a141256f0f`](https://github.com/LedgerHQ/ledger-live/commit/a141256f0f4fff91fb811eaf081f7138f91ff251) Thanks [@lvndry](https://github.com/lvndry)! - When removing a token from the list of hidden tokens, it will be redisplayed in the app'

- [#1763](https://github.com/LedgerHQ/ledger-live/pull/1763) [`4cc023d011`](https://github.com/LedgerHQ/ledger-live/commit/4cc023d0112e9b0629d883ba5e15b216a64ea3a1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - react-native updated from version 0.68.2 to version 0.68.5 to fix android builds

* [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: invert 2 options "Connect an existing Ledger" and "Set up a new Ledger"

- [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: pixel polish

* [#1720](https://github.com/LedgerHQ/ledger-live/pull/1720) [`25a4e5caac`](https://github.com/LedgerHQ/ledger-live/commit/25a4e5caac0230c6e08aac262ad37a55218b659d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New device selection screen: change banner wording

- [#1750](https://github.com/LedgerHQ/ledger-live/pull/1750) [`1617b46f24`](https://github.com/LedgerHQ/ledger-live/commit/1617b46f24001762c94c471610257f457b485e66) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - OTG Banner for Android on Device Selection

* [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Fixed all typescript/eslint errors/warnings.

- [#1320](https://github.com/LedgerHQ/ledger-live/pull/1320) [`bc892dc3ef`](https://github.com/LedgerHQ/ledger-live/commit/bc892dc3ef0671c049c650bf05e71c254e688bf7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add account flow: Testnet currencies shouldn't be available by default

* [#1731](https://github.com/LedgerHQ/ledger-live/pull/1731) [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Fix the post onboarding redirection if there is no action

- [#1675](https://github.com/LedgerHQ/ledger-live/pull/1675) [`565b3f16df`](https://github.com/LedgerHQ/ledger-live/commit/565b3f16df664ddb0e487fa737445f96dec7f953) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Fix lotties for LNX new Bluetooth pairing flow

* [#1808](https://github.com/LedgerHQ/ledger-live/pull/1808) [`deeaa61fe1`](https://github.com/LedgerHQ/ledger-live/commit/deeaa61fe1bb4427057f8577f7235cf4f6ada5b0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Typo on warning message in Advanced account settings

- [#1513](https://github.com/LedgerHQ/ledger-live/pull/1513) [`ffc377ddf0`](https://github.com/LedgerHQ/ledger-live/commit/ffc377ddf0c354f450e3790bd221e8d57f58e9e1) Thanks [@lvndry](https://github.com/lvndry)! - Addition of a dust limit for bitcoin transactions

* [#1352](https://github.com/LedgerHQ/ledger-live/pull/1352) [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Moved custom image errors from ledger-live-mobile to live-common

- [#1761](https://github.com/LedgerHQ/ledger-live/pull/1761) [`7be1afc65b`](https://github.com/LedgerHQ/ledger-live/commit/7be1afc65b33081f8a4ab0eb725d5153a92271ad) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Analytics - added firstConnectHasDeviceUpdated property

* [#1615](https://github.com/LedgerHQ/ledger-live/pull/1615) [`34546edc55`](https://github.com/LedgerHQ/ledger-live/commit/34546edc55674e49b22c6d3be08777ee13d306f9) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add hidden button in Welcome screen to access the settings.

- [#1685](https://github.com/LedgerHQ/ledger-live/pull/1685) [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Handle 0x5515 response for allow manager and connect app device actions on LLM

- Updated dependencies [[`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`4aa4d42cb1`](https://github.com/LedgerHQ/ledger-live/commit/4aa4d42cb103612c130b01f36100eb6fdd87e8b1), [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305), [`3f516ea41e`](https://github.com/LedgerHQ/ledger-live/commit/3f516ea41e6e1a485be452872c91bd4a315eb167), [`f7b27a97f6`](https://github.com/LedgerHQ/ledger-live/commit/f7b27a97f6cd2b2c553cbe83d008e4ce907c9ad2), [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`914c5fb377`](https://github.com/LedgerHQ/ledger-live/commit/914c5fb377b8b541f5f645fe26ab80faaa33d478), [`658303322b`](https://github.com/LedgerHQ/ledger-live/commit/658303322b767f5ed3821def8384b5342ab03089), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3), [`57699a19fa`](https://github.com/LedgerHQ/ledger-live/commit/57699a19fa545ba359e457deb7ba0632b15342b5), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd), [`90a9fbb75b`](https://github.com/LedgerHQ/ledger-live/commit/90a9fbb75b3b3960655d601a6c7c987689ef19be)]:
  - @ledgerhq/live-common@27.7.0-next.0
  - @ledgerhq/errors@6.12.0-next.0
  - @ledgerhq/types-live@6.26.0-next.0
  - @ledgerhq/hw-transport@6.27.7-next.0
  - @ledgerhq/hw-transport-http@6.27.7-next.0
  - @ledgerhq/types-cryptoassets@6.23.3-next.0
  - @ledgerhq/native-ui@0.12.1-next.0
  - @ledgerhq/devices@7.0.4-next.0
  - @ledgerhq/react-native-hid@6.28.9-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.9-next.0

## 3.10.0

### Minor Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add synchronous onboarding UI to mobile app

* [#1478](https://github.com/LedgerHQ/ledger-live/pull/1478) [`12b1ab3a75`](https://github.com/LedgerHQ/ledger-live/commit/12b1ab3a75de17662ce8bfa6d77ee8166b69a5fd) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix redelegate cosmos banner

- [#1279](https://github.com/LedgerHQ/ledger-live/pull/1279) [`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da) Thanks [@grsoares21](https://github.com/grsoares21)! - Adaptations to My Ledger screen and Device Selection screen rebuild

* [#1369](https://github.com/LedgerHQ/ledger-live/pull/1369) [`4ea4df0b75`](https://github.com/LedgerHQ/ledger-live/commit/4ea4df0b7544fc0302e7ae7a8e40eb91752aff9f) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Add prompt to change device language when live language is changed

### Patch Changes

- [#1486](https://github.com/LedgerHQ/ledger-live/pull/1486) [`10984d0adc`](https://github.com/LedgerHQ/ledger-live/commit/10984d0adc3b6f2b9867c0fb816075b5c11f8e6e) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Small visual fixes on the new sync onboarding flow

* [#1499](https://github.com/LedgerHQ/ledger-live/pull/1499) [`fffd15218c`](https://github.com/LedgerHQ/ledger-live/commit/fffd15218c6422f1e73032768a64e12cc3708ba8) Thanks [@Justkant](https://github.com/Justkant)! - fix: custom manifest open button

- [#1369](https://github.com/LedgerHQ/ledger-live/pull/1369) [`4ea4df0b75`](https://github.com/LedgerHQ/ledger-live/commit/4ea4df0b7544fc0302e7ae7a8e40eb91752aff9f) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Error message when trying to send a NFT from LNS is wrong

* [#1308](https://github.com/LedgerHQ/ledger-live/pull/1308) [`0fd20dff04`](https://github.com/LedgerHQ/ledger-live/commit/0fd20dff0440f932426c618640ac519c06b2d477) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - UI issue on Sync modal

- [#1329](https://github.com/LedgerHQ/ledger-live/pull/1329) [`66158fa9b5`](https://github.com/LedgerHQ/ledger-live/commit/66158fa9b571662f614debe211b297201abc11f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Accents are cropped on the Onboarding carousel

* [#1490](https://github.com/LedgerHQ/ledger-live/pull/1490) [`26fbd9513f`](https://github.com/LedgerHQ/ledger-live/commit/26fbd9513fad4cd20b74968d8a9707093a968aed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added benchmark view on manager for app installs

- [#1414](https://github.com/LedgerHQ/ledger-live/pull/1414) [`d843b441f4`](https://github.com/LedgerHQ/ledger-live/commit/d843b441f43eb774bb9e5300c74f33bfcf2d293a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Fixed the lastSeenDevice apps property that wasn't set properly in some cases

* [#1492](https://github.com/LedgerHQ/ledger-live/pull/1492) [`bdda4ebf98`](https://github.com/LedgerHQ/ledger-live/commit/bdda4ebf98709e95ef2801bb0e398e7f2bdc871e) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated lottie animations for PlugAndPinCode BLE LLM

- [#1482](https://github.com/LedgerHQ/ledger-live/pull/1482) [`6c174071cf`](https://github.com/LedgerHQ/ledger-live/commit/6c174071cf96629fd1aa1e8582eb262a3ff3795f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - bug fix - issue in transfer drawer text spacing

* [#1380](https://github.com/LedgerHQ/ledger-live/pull/1380) [`c88f557e3e`](https://github.com/LedgerHQ/ledger-live/commit/c88f557e3e1965ebe8a01950c0f49d521c35e2fc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Onboarding - Terms and Privacy urls should not overflow screen in the small screen

- [#1335](https://github.com/LedgerHQ/ledger-live/pull/1335) [`c356580f1c`](https://github.com/LedgerHQ/ledger-live/commit/c356580f1c7f54bb39af3bb89c217ff8c2a6edc4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - iOS/Android - Market General Layout polish

* [#1439](https://github.com/LedgerHQ/ledger-live/pull/1439) [`c33c82cd32`](https://github.com/LedgerHQ/ledger-live/commit/c33c82cd3291b651238659a8b9eababe6f953ece) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Add discover card for referral program

- [#1406](https://github.com/LedgerHQ/ledger-live/pull/1406) [`10a662a295`](https://github.com/LedgerHQ/ledger-live/commit/10a662a295c3bf8a04559a6e36c8f584b363df8f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM- Asset Receive Quick action Improvement

* [#1397](https://github.com/LedgerHQ/ledger-live/pull/1397) [`860027ad76`](https://github.com/LedgerHQ/ledger-live/commit/860027ad76a444cb21fa1fc5b804859869114748) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated share library (fixes export logs and ops)

- [#1369](https://github.com/LedgerHQ/ledger-live/pull/1369) [`4ea4df0b75`](https://github.com/LedgerHQ/ledger-live/commit/4ea4df0b7544fc0302e7ae7a8e40eb91752aff9f) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update error message when trying to send NFTs with LNS

* [#1372](https://github.com/LedgerHQ/ledger-live/pull/1372) [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flags: take into account env variable FEATURE_FLAGS to override feature flags

- [#1307](https://github.com/LedgerHQ/ledger-live/pull/1307) [`1592d5e00d`](https://github.com/LedgerHQ/ledger-live/commit/1592d5e00da3c8433401ae23d8144329f18b8163) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Layout issue with the error message if Bluetooth is disabled when user pairs device

* [#1474](https://github.com/LedgerHQ/ledger-live/pull/1474) [`2802e2d684`](https://github.com/LedgerHQ/ledger-live/commit/2802e2d6844a7e17127ea7d103fe0d1a45afa032) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow for DeviceAction UI overrides in custom implementations + Debug tool

- [#1402](https://github.com/LedgerHQ/ledger-live/pull/1402) [`fdc072dcf4`](https://github.com/LedgerHQ/ledger-live/commit/fdc072dcf4044df03923adc67df71396388998de) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Onboarding quizz pixel polish LLM

* [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Remove double selection screen in sync onboarding flow and polish header UI

- [#1384](https://github.com/LedgerHQ/ledger-live/pull/1384) [`b3a787f49d`](https://github.com/LedgerHQ/ledger-live/commit/b3a787f49dc02119026fc04b997117f9e41b7db9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - The text "Fingerprint" should be translated

* [#1533](https://github.com/LedgerHQ/ledger-live/pull/1533) [`107e9cfb3d`](https://github.com/LedgerHQ/ledger-live/commit/107e9cfb3df84d74b738150b379355e4615e6034) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Swap buttons not available on Currency and account screens

- [#1623](https://github.com/LedgerHQ/ledger-live/pull/1623) [`9d90943e38`](https://github.com/LedgerHQ/ledger-live/commit/9d90943e38f359b0a6ab6276af437d133990f6ca) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix device localization button layout in My Ledger

* [#1359](https://github.com/LedgerHQ/ledger-live/pull/1359) [`32daa009f7`](https://github.com/LedgerHQ/ledger-live/commit/32daa009f7851fe1421cb007e0a819326c5d6514) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - UI Improvment Sync from Desktop Screen - LLM

- [#1577](https://github.com/LedgerHQ/ledger-live/pull/1577) [`aa6abeeb2c`](https://github.com/LedgerHQ/ledger-live/commit/aa6abeeb2cc9e5c871e62d4490fe82c6015c3730) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - analytics update for reborn

* [#1648](https://github.com/LedgerHQ/ledger-live/pull/1648) [`6ee6bfd41a`](https://github.com/LedgerHQ/ledger-live/commit/6ee6bfd41a363962caba2e56c3470726db24d76e) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: new rendering in the case of a LatestFirmwareVersionRequired error

- [#1633](https://github.com/LedgerHQ/ledger-live/pull/1633) [`269185cddf`](https://github.com/LedgerHQ/ledger-live/commit/269185cddf354b5ca4dcf710f5df4dc2524bcaf9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix MyLedger dot display condition

* [#1569](https://github.com/LedgerHQ/ledger-live/pull/1569) [`459e02d258`](https://github.com/LedgerHQ/ledger-live/commit/459e02d258e1aa0e3d946e951b104da7ca6ab275) Thanks [@alexandremgo](https://github.com/alexandremgo)! - eslint rule on live-common import path

- [#1322](https://github.com/LedgerHQ/ledger-live/pull/1322) [`28a6afaf2c`](https://github.com/LedgerHQ/ledger-live/commit/28a6afaf2c8359b00d881c793d957f363f00cbd1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Fixed a bug causing a freeze on ios when the ratings modal opened at the same time as the notifications one

* [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding BLE pairing and Scanning UI

  - Use of types-devices package

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

* [#1281](https://github.com/LedgerHQ/ledger-live/pull/1281) [`b8f28d388c`](https://github.com/LedgerHQ/ledger-live/commit/b8f28d388c04ef1ea91960eb126490954f98f75c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add warning on Advanced logs for xpub sharing

- [#1498](https://github.com/LedgerHQ/ledger-live/pull/1498) [`f5182b21d1`](https://github.com/LedgerHQ/ledger-live/commit/f5182b21d1ad69f2749e730af055cb6055e4fc2c) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Firmware update banner issue

* [#1373](https://github.com/LedgerHQ/ledger-live/pull/1373) [`40cc80114c`](https://github.com/LedgerHQ/ledger-live/commit/40cc80114c347f305ea1aaeefc79a0620f04f3ff) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Replace manager deeplink with myledger

- [#1702](https://github.com/LedgerHQ/ledger-live/pull/1702) [`fe339a8d05`](https://github.com/LedgerHQ/ledger-live/commit/fe339a8d0571ca6a502bb8f7a4c1c1250085d83c) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Fix update firmware notif breaking layout

- Updated dependencies [[`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da), [`24cdfe3869`](https://github.com/LedgerHQ/ledger-live/commit/24cdfe38695b60c7f3bc4827ea46893c8062dbad), [`cbcc0c1989`](https://github.com/LedgerHQ/ledger-live/commit/cbcc0c19899ffecbdbeda2e4b230a130d0fe1899), [`2f615db01b`](https://github.com/LedgerHQ/ledger-live/commit/2f615db01be43e7c21b5654b28bd122dab140252), [`6bcbd3967a`](https://github.com/LedgerHQ/ledger-live/commit/6bcbd3967a9841779a60708eab4b70144af880d7), [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed), [`2c3d6b53ea`](https://github.com/LedgerHQ/ledger-live/commit/2c3d6b53eaaefc0f2ab766addf8584d2f83a5eb9), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53), [`b49a269bb2`](https://github.com/LedgerHQ/ledger-live/commit/b49a269bb2d3ff1cdaae5e74d85fb8e1c33da978), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53)]:
  - @ledgerhq/live-common@27.6.0
  - @ledgerhq/types-live@6.25.1
  - @ledgerhq/native-ui@0.12.0
  - @ledgerhq/types-devices@6.22.3

## 3.10.0-next.4

### Patch Changes

- [#1702](https://github.com/LedgerHQ/ledger-live/pull/1702) [`fe339a8d05`](https://github.com/LedgerHQ/ledger-live/commit/fe339a8d0571ca6a502bb8f7a4c1c1250085d83c) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Fix update firmware notif breaking layout

## 3.10.0-next.3

### Patch Changes

- [#1648](https://github.com/LedgerHQ/ledger-live/pull/1648) [`6ee6bfd41a`](https://github.com/LedgerHQ/ledger-live/commit/6ee6bfd41a363962caba2e56c3470726db24d76e) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: new rendering in the case of a LatestFirmwareVersionRequired error

## 3.10.0-next.2

### Patch Changes

- [#1633](https://github.com/LedgerHQ/ledger-live/pull/1633) [`269185cddf`](https://github.com/LedgerHQ/ledger-live/commit/269185cddf354b5ca4dcf710f5df4dc2524bcaf9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix MyLedger dot display condition

## 3.10.0-next.1

### Patch Changes

- [#1623](https://github.com/LedgerHQ/ledger-live/pull/1623) [`9d90943e38`](https://github.com/LedgerHQ/ledger-live/commit/9d90943e38f359b0a6ab6276af437d133990f6ca) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix device localization button layout in My Ledger

## 3.10.0-next.0

### Minor Changes

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add synchronous onboarding UI to mobile app

* [#1478](https://github.com/LedgerHQ/ledger-live/pull/1478) [`12b1ab3a75`](https://github.com/LedgerHQ/ledger-live/commit/12b1ab3a75de17662ce8bfa6d77ee8166b69a5fd) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix redelegate cosmos banner

- [#1279](https://github.com/LedgerHQ/ledger-live/pull/1279) [`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da) Thanks [@grsoares21](https://github.com/grsoares21)! - Adaptations to My Ledger screen and Device Selection screen rebuild

* [#1369](https://github.com/LedgerHQ/ledger-live/pull/1369) [`4ea4df0b75`](https://github.com/LedgerHQ/ledger-live/commit/4ea4df0b7544fc0302e7ae7a8e40eb91752aff9f) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Add prompt to change device language when live language is changed

### Patch Changes

- [#1486](https://github.com/LedgerHQ/ledger-live/pull/1486) [`10984d0adc`](https://github.com/LedgerHQ/ledger-live/commit/10984d0adc3b6f2b9867c0fb816075b5c11f8e6e) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Small visual fixes on the new sync onboarding flow

* [#1499](https://github.com/LedgerHQ/ledger-live/pull/1499) [`fffd15218c`](https://github.com/LedgerHQ/ledger-live/commit/fffd15218c6422f1e73032768a64e12cc3708ba8) Thanks [@Justkant](https://github.com/Justkant)! - fix: custom manifest open button

- [#1369](https://github.com/LedgerHQ/ledger-live/pull/1369) [`4ea4df0b75`](https://github.com/LedgerHQ/ledger-live/commit/4ea4df0b7544fc0302e7ae7a8e40eb91752aff9f) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Error message when trying to send a NFT from LNS is wrong

* [#1308](https://github.com/LedgerHQ/ledger-live/pull/1308) [`0fd20dff04`](https://github.com/LedgerHQ/ledger-live/commit/0fd20dff0440f932426c618640ac519c06b2d477) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - UI issue on Sync modal

- [#1329](https://github.com/LedgerHQ/ledger-live/pull/1329) [`66158fa9b5`](https://github.com/LedgerHQ/ledger-live/commit/66158fa9b571662f614debe211b297201abc11f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Accents are cropped on the Onboarding carousel

* [#1490](https://github.com/LedgerHQ/ledger-live/pull/1490) [`26fbd9513f`](https://github.com/LedgerHQ/ledger-live/commit/26fbd9513fad4cd20b74968d8a9707093a968aed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added benchmark view on manager for app installs

- [#1414](https://github.com/LedgerHQ/ledger-live/pull/1414) [`d843b441f4`](https://github.com/LedgerHQ/ledger-live/commit/d843b441f43eb774bb9e5300c74f33bfcf2d293a) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Fixed the lastSeenDevice apps property that wasn't set properly in some cases

* [#1492](https://github.com/LedgerHQ/ledger-live/pull/1492) [`bdda4ebf98`](https://github.com/LedgerHQ/ledger-live/commit/bdda4ebf98709e95ef2801bb0e398e7f2bdc871e) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated lottie animations for PlugAndPinCode BLE LLM

- [#1482](https://github.com/LedgerHQ/ledger-live/pull/1482) [`6c174071cf`](https://github.com/LedgerHQ/ledger-live/commit/6c174071cf96629fd1aa1e8582eb262a3ff3795f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - bug fix - issue in transfer drawer text spacing

* [#1380](https://github.com/LedgerHQ/ledger-live/pull/1380) [`c88f557e3e`](https://github.com/LedgerHQ/ledger-live/commit/c88f557e3e1965ebe8a01950c0f49d521c35e2fc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Onboarding - Terms and Privacy urls should not overflow screen in the small screen

- [#1335](https://github.com/LedgerHQ/ledger-live/pull/1335) [`c356580f1c`](https://github.com/LedgerHQ/ledger-live/commit/c356580f1c7f54bb39af3bb89c217ff8c2a6edc4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - iOS/Android - Market General Layout polish

* [#1439](https://github.com/LedgerHQ/ledger-live/pull/1439) [`c33c82cd32`](https://github.com/LedgerHQ/ledger-live/commit/c33c82cd3291b651238659a8b9eababe6f953ece) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Add discover card for referral program

- [#1406](https://github.com/LedgerHQ/ledger-live/pull/1406) [`10a662a295`](https://github.com/LedgerHQ/ledger-live/commit/10a662a295c3bf8a04559a6e36c8f584b363df8f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM- Asset Receive Quick action Improvement

* [#1397](https://github.com/LedgerHQ/ledger-live/pull/1397) [`860027ad76`](https://github.com/LedgerHQ/ledger-live/commit/860027ad76a444cb21fa1fc5b804859869114748) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated share library (fixes export logs and ops)

- [#1369](https://github.com/LedgerHQ/ledger-live/pull/1369) [`4ea4df0b75`](https://github.com/LedgerHQ/ledger-live/commit/4ea4df0b7544fc0302e7ae7a8e40eb91752aff9f) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update error message when trying to send NFTs with LNS

* [#1372](https://github.com/LedgerHQ/ledger-live/pull/1372) [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flags: take into account env variable FEATURE_FLAGS to override feature flags

- [#1307](https://github.com/LedgerHQ/ledger-live/pull/1307) [`1592d5e00d`](https://github.com/LedgerHQ/ledger-live/commit/1592d5e00da3c8433401ae23d8144329f18b8163) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Layout issue with the error message if Bluetooth is disabled when user pairs device

* [#1474](https://github.com/LedgerHQ/ledger-live/pull/1474) [`2802e2d684`](https://github.com/LedgerHQ/ledger-live/commit/2802e2d6844a7e17127ea7d103fe0d1a45afa032) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow for DeviceAction UI overrides in custom implementations + Debug tool

- [#1402](https://github.com/LedgerHQ/ledger-live/pull/1402) [`fdc072dcf4`](https://github.com/LedgerHQ/ledger-live/commit/fdc072dcf4044df03923adc67df71396388998de) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Onboarding quizz pixel polish LLM

* [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Remove double selection screen in sync onboarding flow and polish header UI

- [#1384](https://github.com/LedgerHQ/ledger-live/pull/1384) [`b3a787f49d`](https://github.com/LedgerHQ/ledger-live/commit/b3a787f49dc02119026fc04b997117f9e41b7db9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - The text "Fingerprint" should be translated

* [#1533](https://github.com/LedgerHQ/ledger-live/pull/1533) [`107e9cfb3d`](https://github.com/LedgerHQ/ledger-live/commit/107e9cfb3df84d74b738150b379355e4615e6034) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Swap buttons not available on Currency and account screens

- [#1359](https://github.com/LedgerHQ/ledger-live/pull/1359) [`32daa009f7`](https://github.com/LedgerHQ/ledger-live/commit/32daa009f7851fe1421cb007e0a819326c5d6514) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - UI Improvment Sync from Desktop Screen - LLM

* [#1577](https://github.com/LedgerHQ/ledger-live/pull/1577) [`aa6abeeb2c`](https://github.com/LedgerHQ/ledger-live/commit/aa6abeeb2cc9e5c871e62d4490fe82c6015c3730) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - analytics update for reborn

- [#1569](https://github.com/LedgerHQ/ledger-live/pull/1569) [`459e02d258`](https://github.com/LedgerHQ/ledger-live/commit/459e02d258e1aa0e3d946e951b104da7ca6ab275) Thanks [@alexandremgo](https://github.com/alexandremgo)! - eslint rule on live-common import path

* [#1322](https://github.com/LedgerHQ/ledger-live/pull/1322) [`28a6afaf2c`](https://github.com/LedgerHQ/ledger-live/commit/28a6afaf2c8359b00d881c793d957f363f00cbd1) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Fixed a bug causing a freeze on ios when the ratings modal opened at the same time as the notifications one

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding BLE pairing and Scanning UI

  - Use of types-devices package

* [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

- [#1281](https://github.com/LedgerHQ/ledger-live/pull/1281) [`b8f28d388c`](https://github.com/LedgerHQ/ledger-live/commit/b8f28d388c04ef1ea91960eb126490954f98f75c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add warning on Advanced logs for xpub sharing

* [#1498](https://github.com/LedgerHQ/ledger-live/pull/1498) [`f5182b21d1`](https://github.com/LedgerHQ/ledger-live/commit/f5182b21d1ad69f2749e730af055cb6055e4fc2c) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Firmware update banner issue

- [#1373](https://github.com/LedgerHQ/ledger-live/pull/1373) [`40cc80114c`](https://github.com/LedgerHQ/ledger-live/commit/40cc80114c347f305ea1aaeefc79a0620f04f3ff) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Replace manager deeplink with myledger

- Updated dependencies [[`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da), [`24cdfe3869`](https://github.com/LedgerHQ/ledger-live/commit/24cdfe38695b60c7f3bc4827ea46893c8062dbad), [`cbcc0c1989`](https://github.com/LedgerHQ/ledger-live/commit/cbcc0c19899ffecbdbeda2e4b230a130d0fe1899), [`2f615db01b`](https://github.com/LedgerHQ/ledger-live/commit/2f615db01be43e7c21b5654b28bd122dab140252), [`6bcbd3967a`](https://github.com/LedgerHQ/ledger-live/commit/6bcbd3967a9841779a60708eab4b70144af880d7), [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed), [`2c3d6b53ea`](https://github.com/LedgerHQ/ledger-live/commit/2c3d6b53eaaefc0f2ab766addf8584d2f83a5eb9), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53), [`b49a269bb2`](https://github.com/LedgerHQ/ledger-live/commit/b49a269bb2d3ff1cdaae5e74d85fb8e1c33da978), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53)]:
  - @ledgerhq/live-common@27.5.0-next.0
  - @ledgerhq/types-live@6.25.1-next.0
  - @ledgerhq/native-ui@0.12.0-next.0
  - @ledgerhq/types-devices@6.22.3-next.0

## 3.9.2

### Patch Changes

- [#1518](https://github.com/LedgerHQ/ledger-live/pull/1518) [`f255b258a9`](https://github.com/LedgerHQ/ledger-live/commit/f255b258a9c79c5eb89ec65d6647e52b90a9c52c) Thanks [@desirendr](https://github.com/desirendr)! - LLM - Add discover card for referral program

- Updated dependencies [[`f255b258a9`](https://github.com/LedgerHQ/ledger-live/commit/f255b258a9c79c5eb89ec65d6647e52b90a9c52c)]:
  - @ledgerhq/types-live@6.24.3
  - @ledgerhq/live-common@27.3.2

## 3.9.2-hotfix.0

### Patch Changes

- [#1518](https://github.com/LedgerHQ/ledger-live/pull/1518) [`f255b258a9`](https://github.com/LedgerHQ/ledger-live/commit/f255b258a9c79c5eb89ec65d6647e52b90a9c52c) Thanks [@desirendr](https://github.com/desirendr)! - LLM - Add discover card for referral program

- Updated dependencies [[`f255b258a9`](https://github.com/LedgerHQ/ledger-live/commit/f255b258a9c79c5eb89ec65d6647e52b90a9c52c)]:
  - @ledgerhq/types-live@6.24.3-hotfix.0
  - @ledgerhq/live-common@27.3.2

## 3.9.1

### Patch Changes

- [#687](https://github.com/LedgerHQ/ledger-live/pull/687) [`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - add FTX as a swap provider in mobile

- Updated dependencies [[`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110)]:
  - @ledgerhq/live-common@27.3.2

## 3.9.1-hotfix.0

### Patch Changes

- [#687](https://github.com/LedgerHQ/ledger-live/pull/687) [`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - add FTX as a swap provider in mobile

- Updated dependencies [[`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110)]:
  - @ledgerhq/live-common@27.3.2-hotfix.0

## 3.9.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds a device language change feature under feature flag

* [#1134](https://github.com/LedgerHQ/ledger-live/pull/1134) [`13696ed5d3`](https://github.com/LedgerHQ/ledger-live/commit/13696ed5d3c56399f84dcdcd9615e7f4259ca5f6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Adds support for staking operations in Celo LLM, no breaking changes.

- [#1326](https://github.com/LedgerHQ/ledger-live/pull/1326) [`95cb5649b9`](https://github.com/LedgerHQ/ledger-live/commit/95cb5649b9395ff1ad845043101116007f3f85c0) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add prompt to change device language when live language is changed

* [#1134](https://github.com/LedgerHQ/ledger-live/pull/1134) [`13696ed5d3`](https://github.com/LedgerHQ/ledger-live/commit/13696ed5d3c56399f84dcdcd9615e7f4259ca5f6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Adds functionality to withdraw unlocked funds in Celo LLM

### Patch Changes

- [#1258](https://github.com/LedgerHQ/ledger-live/pull/1258) [`8f64d0983a`](https://github.com/LedgerHQ/ledger-live/commit/8f64d0983adaf210cad688dfcc98ad8fc83859b7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Capitalize P for Português language in settings

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add post-onboarding hub (not used for any device model so far)

- [#1326](https://github.com/LedgerHQ/ledger-live/pull/1326) [`c3831633cd`](https://github.com/LedgerHQ/ledger-live/commit/c3831633cddc7bff9792246e6078b75a6f0c01ce) Thanks [@github-actions](https://github.com/apps/github-actions)! - Error message when trying to send a NFT from LNS is wrong

* [#1247](https://github.com/LedgerHQ/ledger-live/pull/1247) [`198d93418a`](https://github.com/LedgerHQ/ledger-live/commit/198d93418a9a82c854175ac32c71a0e340901af1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Deeplink for Add Account and Accounts page

- [`fb0128bb89`](https://github.com/LedgerHQ/ledger-live/commit/fb0128bb898adb5cf11a0337e180ea537e9fca9b) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Inconsistency in languages display names

* [#1259](https://github.com/LedgerHQ/ledger-live/pull/1259) [`134ec2ab52`](https://github.com/LedgerHQ/ledger-live/commit/134ec2ab520f331df9251ac80ba4f89a633f8e62) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Added translation for Settings and experimental features

- [#1250](https://github.com/LedgerHQ/ledger-live/pull/1250) [`d4fe263704`](https://github.com/LedgerHQ/ledger-live/commit/d4fe2637049b98453ac12ac965d945d59044ab54) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Update gpg doc

* [#1328](https://github.com/LedgerHQ/ledger-live/pull/1328) [`877dc46b5f`](https://github.com/LedgerHQ/ledger-live/commit/877dc46b5f7ebffeff618449884cb5f923bb7932) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Bump hermes-engine dependency to 0.11.0

- [#1243](https://github.com/LedgerHQ/ledger-live/pull/1243) [`3ab7ed642f`](https://github.com/LedgerHQ/ledger-live/commit/3ab7ed642fe9d8a6e9c914c8d87a732e1f9b911c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Change the navigation header font variant from h3 (Alpha) to h5 (Inter)

* [#1265](https://github.com/LedgerHQ/ledger-live/pull/1265) [`e11d177678`](https://github.com/LedgerHQ/ledger-live/commit/e11d17767822c292e066e9c99e821114a55b7928) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wrap text when is too long in TabBar Tansfer

- [#1326](https://github.com/LedgerHQ/ledger-live/pull/1326) [`e9166620ec`](https://github.com/LedgerHQ/ledger-live/commit/e9166620ec195be7c2803ebeb83508be39d5563d) Thanks [@github-actions](https://github.com/apps/github-actions)! - Update error message when trying to send NFTs with LNS

* [#1365](https://github.com/LedgerHQ/ledger-live/pull/1365) [`6af4a22c54`](https://github.com/LedgerHQ/ledger-live/commit/6af4a22c5484499e112f21249f1c28ae146c78af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Terms and Privacy Policy urls to update

- [#1316](https://github.com/LedgerHQ/ledger-live/pull/1316) [`d3be8877e3`](https://github.com/LedgerHQ/ledger-live/commit/d3be8877e30eb48943942a7dfd31c19085b4f89e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wrong message when LNX storage is full

* [#1297](https://github.com/LedgerHQ/ledger-live/pull/1297) [`e315e556ae`](https://github.com/LedgerHQ/ledger-live/commit/e315e556ae714b0f8780fd691987b90f241b7fda) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - UX and functional fixes in custom image flow

- [#1332](https://github.com/LedgerHQ/ledger-live/pull/1332) [`768abf264a`](https://github.com/LedgerHQ/ledger-live/commit/768abf264a50d151661267b029a6d56c471de2b6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Close individual NFT drawer should back to Gallery/Collection screen

* [#1277](https://github.com/LedgerHQ/ledger-live/pull/1277) [`11d59178fe`](https://github.com/LedgerHQ/ledger-live/commit/11d59178fe11787b2a7209723eaef4713bfcd7ef) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update text and ui for Add Account modal

* Updated dependencies [[`1a23c232fa`](https://github.com/LedgerHQ/ledger-live/commit/1a23c232fa21557ccd48568f4f577263bd6fc6e6), [`2f473b2fdf`](https://github.com/LedgerHQ/ledger-live/commit/2f473b2fdffbbe8641a90aa9ada5ad1dd048460f), [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/live-common@27.3.1
  - @ledgerhq/devices@7.0.3
  - @ledgerhq/errors@6.11.1
  - @ledgerhq/hw-transport-http@6.27.6
  - @ledgerhq/hw-transport@6.27.6
  - @ledgerhq/logs@6.10.1
  - @ledgerhq/react-native-hid@6.28.8
  - @ledgerhq/react-native-hw-transport-ble@6.27.8
  - @ledgerhq/types-cryptoassets@6.23.2
  - @ledgerhq/types-devices@6.22.2
  - @ledgerhq/types-live@6.24.2

## 3.9.0-next.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds a device language change feature under feature flag

* [#1134](https://github.com/LedgerHQ/ledger-live/pull/1134) [`13696ed5d3`](https://github.com/LedgerHQ/ledger-live/commit/13696ed5d3c56399f84dcdcd9615e7f4259ca5f6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Adds support for staking operations in Celo LLM, no breaking changes.

- [#1326](https://github.com/LedgerHQ/ledger-live/pull/1326) [`95cb5649b9`](https://github.com/LedgerHQ/ledger-live/commit/95cb5649b9395ff1ad845043101116007f3f85c0) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add prompt to change device language when live language is changed

* [#1134](https://github.com/LedgerHQ/ledger-live/pull/1134) [`13696ed5d3`](https://github.com/LedgerHQ/ledger-live/commit/13696ed5d3c56399f84dcdcd9615e7f4259ca5f6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Adds functionality to withdraw unlocked funds in Celo LLM

### Patch Changes

- [#1258](https://github.com/LedgerHQ/ledger-live/pull/1258) [`8f64d0983a`](https://github.com/LedgerHQ/ledger-live/commit/8f64d0983adaf210cad688dfcc98ad8fc83859b7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Capitalize P for Português language in settings

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add post-onboarding hub (not used for any device model so far)

- [#1326](https://github.com/LedgerHQ/ledger-live/pull/1326) [`c3831633cd`](https://github.com/LedgerHQ/ledger-live/commit/c3831633cddc7bff9792246e6078b75a6f0c01ce) Thanks [@github-actions](https://github.com/apps/github-actions)! - Error message when trying to send a NFT from LNS is wrong

* [#1247](https://github.com/LedgerHQ/ledger-live/pull/1247) [`198d93418a`](https://github.com/LedgerHQ/ledger-live/commit/198d93418a9a82c854175ac32c71a0e340901af1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Deeplink for Add Account and Accounts page

- [`fb0128bb89`](https://github.com/LedgerHQ/ledger-live/commit/fb0128bb898adb5cf11a0337e180ea537e9fca9b) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - Inconsistency in languages display names

* [#1259](https://github.com/LedgerHQ/ledger-live/pull/1259) [`134ec2ab52`](https://github.com/LedgerHQ/ledger-live/commit/134ec2ab520f331df9251ac80ba4f89a633f8e62) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Added translation for Settings and experimental features

- [#1250](https://github.com/LedgerHQ/ledger-live/pull/1250) [`d4fe263704`](https://github.com/LedgerHQ/ledger-live/commit/d4fe2637049b98453ac12ac965d945d59044ab54) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Update gpg doc

* [#1328](https://github.com/LedgerHQ/ledger-live/pull/1328) [`877dc46b5f`](https://github.com/LedgerHQ/ledger-live/commit/877dc46b5f7ebffeff618449884cb5f923bb7932) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Bump hermes-engine dependency to 0.11.0

- [#1243](https://github.com/LedgerHQ/ledger-live/pull/1243) [`3ab7ed642f`](https://github.com/LedgerHQ/ledger-live/commit/3ab7ed642fe9d8a6e9c914c8d87a732e1f9b911c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Change the navigation header font variant from h3 (Alpha) to h5 (Inter)

* [#1265](https://github.com/LedgerHQ/ledger-live/pull/1265) [`e11d177678`](https://github.com/LedgerHQ/ledger-live/commit/e11d17767822c292e066e9c99e821114a55b7928) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wrap text when is too long in TabBar Tansfer

- [#1326](https://github.com/LedgerHQ/ledger-live/pull/1326) [`e9166620ec`](https://github.com/LedgerHQ/ledger-live/commit/e9166620ec195be7c2803ebeb83508be39d5563d) Thanks [@github-actions](https://github.com/apps/github-actions)! - Update error message when trying to send NFTs with LNS

* [#1365](https://github.com/LedgerHQ/ledger-live/pull/1365) [`6af4a22c54`](https://github.com/LedgerHQ/ledger-live/commit/6af4a22c5484499e112f21249f1c28ae146c78af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLM - Terms and Privacy Policy urls to update

- [#1316](https://github.com/LedgerHQ/ledger-live/pull/1316) [`d3be8877e3`](https://github.com/LedgerHQ/ledger-live/commit/d3be8877e30eb48943942a7dfd31c19085b4f89e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wrong message when LNX storage is full

* [#1297](https://github.com/LedgerHQ/ledger-live/pull/1297) [`e315e556ae`](https://github.com/LedgerHQ/ledger-live/commit/e315e556ae714b0f8780fd691987b90f241b7fda) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - UX and functional fixes in custom image flow

- [#1332](https://github.com/LedgerHQ/ledger-live/pull/1332) [`768abf264a`](https://github.com/LedgerHQ/ledger-live/commit/768abf264a50d151661267b029a6d56c471de2b6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Close individual NFT drawer should back to Gallery/Collection screen

* [#1277](https://github.com/LedgerHQ/ledger-live/pull/1277) [`11d59178fe`](https://github.com/LedgerHQ/ledger-live/commit/11d59178fe11787b2a7209723eaef4713bfcd7ef) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update text and ui for Add Account modal

* Updated dependencies [[`1a23c232fa`](https://github.com/LedgerHQ/ledger-live/commit/1a23c232fa21557ccd48568f4f577263bd6fc6e6), [`2f473b2fdf`](https://github.com/LedgerHQ/ledger-live/commit/2f473b2fdffbbe8641a90aa9ada5ad1dd048460f), [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/live-common@27.3.1-next.0
  - @ledgerhq/devices@7.0.3-next.0
  - @ledgerhq/errors@6.11.1-next.0
  - @ledgerhq/hw-transport-http@6.27.6-next.0
  - @ledgerhq/hw-transport@6.27.6-next.0
  - @ledgerhq/logs@6.10.1-next.0
  - @ledgerhq/react-native-hid@6.28.8-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.8-next.0
  - @ledgerhq/types-cryptoassets@6.23.2-next.0
  - @ledgerhq/types-devices@6.22.2-next.0
  - @ledgerhq/types-live@6.24.2-next.0

## 3.8.0

### Minor Changes

- [`c14ed5a942`](https://github.com/LedgerHQ/ledger-live/commit/c14ed5a942d65c92da96b0f6ad84b709a0884f25) Thanks [@Justkant](https://github.com/Justkant)! - Add Celo Staking

* [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`80aa008719`](https://github.com/LedgerHQ/ledger-live/commit/80aa00871943788d730cc8bb95a6d57ea2e9be96) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Enable Filecoin integration on LLM

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner in LLM

* [#899](https://github.com/LedgerHQ/ledger-live/pull/899) [`6d48688498`](https://github.com/LedgerHQ/ledger-live/commit/6d48688498bb825aab1fab86739894ebe9ae4110) Thanks [@LFBarreto](https://github.com/LFBarreto)! - feat(LLM): Wallet connect as live app feature flag [LIVE-3254]

### Patch Changes

- [#1105](https://github.com/LedgerHQ/ledger-live/pull/1105) [`8186d2efce`](https://github.com/LedgerHQ/ledger-live/commit/8186d2efcea2b270b162bd80f660bd64a76b837c) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Deeplinks updated for buy sell flows with live apps

* [#743](https://github.com/LedgerHQ/ledger-live/pull/743) [`a089100d37`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add custom image tool

- [#1112](https://github.com/LedgerHQ/ledger-live/pull/1112) [`44516bce9f`](https://github.com/LedgerHQ/ledger-live/commit/44516bce9f2faae54989e508371785b50189399e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support: LLM eslint rule no-unused-vars only from TS

* [#1136](https://github.com/LedgerHQ/ledger-live/pull/1136) [`d66472e571`](https://github.com/LedgerHQ/ledger-live/commit/d66472e5716b2465835bfd332f895229acdc6b40) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix several issues regarding analytics

- [#1143](https://github.com/LedgerHQ/ledger-live/pull/1143) [`5f15da1746`](https://github.com/LedgerHQ/ledger-live/commit/5f15da174652ebc39ec8f07a0671ab265317214c) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix new BLE pairing flow, with more flexible options

* [#1097](https://github.com/LedgerHQ/ledger-live/pull/1097) [`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

- [#1239](https://github.com/LedgerHQ/ledger-live/pull/1239) [`691ef324ff`](https://github.com/LedgerHQ/ledger-live/commit/691ef324ff02c3341b72c7dc9754537bd9f8b73a) Thanks [@ThomasLaforge](https://github.com/ThomasLaforge)! - use brazilian portuguese smartling translation and add some missing keys for system language available popup

* [#1222](https://github.com/LedgerHQ/ledger-live/pull/1222) [`5df97cb448`](https://github.com/LedgerHQ/ledger-live/commit/5df97cb44863834fa16b28ffd20849500c92b652) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue on lottie animations for nanoS nanoSP and blue

- [#1000](https://github.com/LedgerHQ/ledger-live/pull/1000) [`dc3fd1841e`](https://github.com/LedgerHQ/ledger-live/commit/dc3fd1841e3e8b164f047fe84efd3776e16f8ff1) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Migration from JavaScript to TypeScript for LLM

* [#1070](https://github.com/LedgerHQ/ledger-live/pull/1070) [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix crash when scanning for bluetooth devices

- [#1244](https://github.com/LedgerHQ/ledger-live/pull/1244) [`34eb4e7e29`](https://github.com/LedgerHQ/ledger-live/commit/34eb4e7e295c882574938791c828fe64a2dd329d) Thanks [@ThomasLaforge](https://github.com/ThomasLaforge)! - Adding Japanese, Korean, Turkish and Deutcsh to fully supported languages

- Updated dependencies [[`a089100d37`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668), [`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7), [`d70bb7042a`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887)]:
  - @ledgerhq/live-common@27.2.0
  - @ledgerhq/errors@6.10.2
  - @ledgerhq/devices@7.0.1
  - @ledgerhq/hw-transport@6.27.4
  - @ledgerhq/hw-transport-http@6.27.4
  - @ledgerhq/react-native-hid@6.28.6
  - @ledgerhq/react-native-hw-transport-ble@6.27.6

## 3.8.0-next.10

### Patch Changes

- [#1244](https://github.com/LedgerHQ/ledger-live/pull/1244) [`34eb4e7e29`](https://github.com/LedgerHQ/ledger-live/commit/34eb4e7e295c882574938791c828fe64a2dd329d) Thanks [@ThomasLaforge](https://github.com/ThomasLaforge)! - Adding Japanese, Korean, Turkish and Deutcsh to fully supported languages

## 3.8.0-next.9

### Patch Changes

- [#1239](https://github.com/LedgerHQ/ledger-live/pull/1239) [`691ef324f`](https://github.com/LedgerHQ/ledger-live/commit/691ef324ff02c3341b72c7dc9754537bd9f8b73a) Thanks [@ThomasLaforge](https://github.com/ThomasLaforge)! - use brazilian portuguese smartling translation and add some missing keys for system language available popup

## 3.8.0-next.8

### Patch Changes

- [#1222](https://github.com/LedgerHQ/ledger-live/pull/1222) [`5df97cb44`](https://github.com/LedgerHQ/ledger-live/commit/5df97cb44863834fa16b28ffd20849500c92b652) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue on lottie animations for nanoS nanoSP and blue

## 3.8.0-next.7

### Minor Changes

- [`c14ed5a94`](https://github.com/LedgerHQ/ledger-live/commit/c14ed5a942d65c92da96b0f6ad84b709a0884f25) Thanks [@Justkant](https://github.com/Justkant)! - Add Celo Staking

* [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`80aa00871`](https://github.com/LedgerHQ/ledger-live/commit/80aa00871943788d730cc8bb95a6d57ea2e9be96) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Enable Filecoin integration on LLM

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd52`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner in LLM

* [#899](https://github.com/LedgerHQ/ledger-live/pull/899) [`6d4868849`](https://github.com/LedgerHQ/ledger-live/commit/6d48688498bb825aab1fab86739894ebe9ae4110) Thanks [@LFBarreto](https://github.com/LFBarreto)! - feat(LLM): Wallet connect as live app feature flag [LIVE-3254]

### Patch Changes

- [#1105](https://github.com/LedgerHQ/ledger-live/pull/1105) [`8186d2efc`](https://github.com/LedgerHQ/ledger-live/commit/8186d2efcea2b270b162bd80f660bd64a76b837c) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Deeplinks updated for buy sell flows with live apps

* [#743](https://github.com/LedgerHQ/ledger-live/pull/743) [`a089100d3`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add custom image tool

- [#1112](https://github.com/LedgerHQ/ledger-live/pull/1112) [`44516bce9`](https://github.com/LedgerHQ/ledger-live/commit/44516bce9f2faae54989e508371785b50189399e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support: LLM eslint rule no-unused-vars only from TS

* [#1136](https://github.com/LedgerHQ/ledger-live/pull/1136) [`d66472e57`](https://github.com/LedgerHQ/ledger-live/commit/d66472e5716b2465835bfd332f895229acdc6b40) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix several issues regarding analytics

- [#1143](https://github.com/LedgerHQ/ledger-live/pull/1143) [`5f15da174`](https://github.com/LedgerHQ/ledger-live/commit/5f15da174652ebc39ec8f07a0671ab265317214c) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix new BLE pairing flow, with more flexible options

* [#1097](https://github.com/LedgerHQ/ledger-live/pull/1097) [`936b6dc54`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

- [#1000](https://github.com/LedgerHQ/ledger-live/pull/1000) [`dc3fd1841`](https://github.com/LedgerHQ/ledger-live/commit/dc3fd1841e3e8b164f047fe84efd3776e16f8ff1) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Migration from JavaScript to TypeScript for LLM

* [#1070](https://github.com/LedgerHQ/ledger-live/pull/1070) [`533e658dc`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix crash when scanning for bluetooth devices

* Updated dependencies [[`a089100d3`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668), [`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7), [`d70bb7042`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887)]:
  - @ledgerhq/live-common@27.2.0-next.0
  - @ledgerhq/errors@6.10.2-next.0
  - @ledgerhq/devices@7.0.1-next.0
  - @ledgerhq/hw-transport@6.27.4-next.0
  - @ledgerhq/hw-transport-http@6.27.4-next.0
  - @ledgerhq/react-native-hid@6.28.6-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.6-next.0

## 3.8.0-next.6

### Patch Changes

- [#756](https://github.com/LedgerHQ/ledger-live/pull/756) [`708f647d88`](https://github.com/LedgerHQ/ledger-live/commit/708f647d88ae484b5f1829fcab64139561bbd21f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent navigation without user confirmation with ongoing installs/uninstalls
- Updated dependencies [[`3849ee3f30`](https://github.com/LedmgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f)]:
  - @ledgerhq/live-common@27.1.0-next.6

## 3.8.0-next.5

### Patch Changes

- [#1097](https://github.com/LedgerHQ/ledger-live/pull/1097) [`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

- Updated dependencies [[`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912)]:
  - @ledgerhq/live-common@27.1.0-next.5

## 3.8.0-next.4

### Patch Changes

- Updated dependencies [[`0ebdec50bf`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc)]:
  - @ledgerhq/live-common@27.1.0-next.4

## 3.8.0-next.3

### Minor Changes

- [#961](https://github.com/LedgerHQ/ledger-live/pull/961) [`b06c9fdf5c`](https://github.com/LedgerHQ/ledger-live/commit/b06c9fdf5ccbbc68283dd73ea4c3ea0e380c1539) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Minor wording changes
- [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`80aa008719`](https://github.com/LedgerHQ/ledger-live/commit/80aa00871943788d730cc8bb95a6d57ea2e9be96) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Enable Filecoin integration on LLM

### Patch Changes

- Updated dependencies [[`685348dd35`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e), [`dd538c3723`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd), [`0601b6541f`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa)]:
  - @ledgerhq/live-common@27.1.0-next.3

## 3.8.0-next.2

### Minor Changes

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner in LLM

### Patch Changes

- Updated dependencies [[`8fe44e12d7`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6), [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300)]:
  - @ledgerhq/live-common@27.1.0-next.2

## 3.8.0-next.1

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

### Patch Changes

- Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754), [`336eb879a8`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97), [`3615a06f19`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a)]:
  - @ledgerhq/live-common@27.1.0-next.1

## 3.7.1-next.0

### Patch Changes

- [#1112](https://github.com/LedgerHQ/ledger-live/pull/1112) [`44516bce9f`](https://github.com/LedgerHQ/ledger-live/commit/44516bce9f2faae54989e508371785b50189399e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support: LLM eslint rule no-unused-vars only from TS

* [#1000](https://github.com/LedgerHQ/ledger-live/pull/1000) [`dc3fd1841e`](https://github.com/LedgerHQ/ledger-live/commit/dc3fd1841e3e8b164f047fe84efd3776e16f8ff1) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Migration from JavaScript to TypeScript for LLM

- [#1070](https://github.com/LedgerHQ/ledger-live/pull/1070) [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix crash when scanning for bluetooth devices

- Updated dependencies [[`7e812a738d`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f), [`058a1af7ff`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b), [`d6634bc0b7`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968), [`5da717c523`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4), [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26)]:
  - @ledgerhq/live-common@27.0.1-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.5-next.0

## 3.7.0

### Minor Changes

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add banner to external integrations

### Patch Changes

- [#798](https://github.com/LedgerHQ/ledger-live/pull/798) [`222335854d`](https://github.com/LedgerHQ/ledger-live/commit/222335854d412cd748c0add73b5f0bb93e02ba42) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - bug fix issue on storyly package version

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add Analytics 'reason' field in context of sync events

* [#815](https://github.com/LedgerHQ/ledger-live/pull/815) [`152339dcee`](https://github.com/LedgerHQ/ledger-live/commit/152339dceeaca4b4b7656aad1c690589189900a8) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generics lotties animations

## 3.7.0-hotfix.0

### Minor Changes

- [#921](https://github.com/LedgerHQ/ledger-live/pull/921) [`cce2e7a4e7`](https://github.com/LedgerHQ/ledger-live/commit/cce2e7a4e76445921066593a07964ed7d0875f54) Thanks [@github-actions](https://github.com/apps/github-actions)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8e`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

### Patch Changes

- Updated dependencies [[`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/live-common@27.0.0-next.2

## 3.7.0-next.2

### Patch Changes

- [#1013](https://github.com/LedgerHQ/ledger-live/pull/1013) [`7d7b38fa6c`](https://github.com/LedgerHQ/ledger-live/commit/7d7b38fa6c6089e60194b536131777d2035ef892) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix rendering of last app item in manager

## 3.7.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds a device language change feature under feature flag

### Patch Changes

- Updated dependencies [[`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2), [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2)]:
  - @ledgerhq/native-ui@0.9.0-next.1
  - @ledgerhq/live-common@26.1.0-next.1

## 3.7.0-next.0

### Minor Changes

- [#756](https://github.com/LedgerHQ/ledger-live/pull/756) [`708f647d8`](https://github.com/LedgerHQ/ledger-live/commit/708f647d88ae484b5f1829fcab64139561bbd21f) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent navigation without user confirmation with ongoing installs/uninstalls

* [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Type libraries usage in LLC, LLD, LLM, CLI

- [#814](https://github.com/LedgerHQ/ledger-live/pull/814) [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development/QA tool for feature flags [mobile]

* [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#961](https://github.com/LedgerHQ/ledger-live/pull/961) [`b06c9fdf5`](https://github.com/LedgerHQ/ledger-live/commit/b06c9fdf5ccbbc68283dd73ea4c3ea0e380c1539) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Minor wording changes

* [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`e1173f5f4`](https://github.com/LedgerHQ/ledger-live/commit/e1173f5f4c521bdf50c9c1be431f63ae17aa2793) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Redirect buy sell in app links to live app implementation if feature flag is activated

- [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add banner to external integrations

### Patch Changes

- [#958](https://github.com/LedgerHQ/ledger-live/pull/958) [`68c50cd94`](https://github.com/LedgerHQ/ledger-live/commit/68c50cd94bbe50a1bf284a2e9e5aed3781788754) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix getFeature being a hook and getting called outside of React

* [#798](https://github.com/LedgerHQ/ledger-live/pull/798) [`222335854d`](https://github.com/LedgerHQ/ledger-live/commit/222335854d412cd748c0add73b5f0bb93e02ba42) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - bug fix issue on storyly package version

- [#808](https://github.com/LedgerHQ/ledger-live/pull/808) [`706081054`](https://github.com/LedgerHQ/ledger-live/commit/70608105451e29cbb543ee98d2a8a4cf5ada38df) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Fix redirection to stories from device selection screen

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#965](https://github.com/LedgerHQ/ledger-live/pull/965) [`186256aba`](https://github.com/LedgerHQ/ledger-live/commit/186256abac2ff3992a37ce15424bd1a3251e0c89) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Display more of the essential information in Feature Flags debugging screen

* [#751](https://github.com/LedgerHQ/ledger-live/pull/751) [`be4ad4860`](https://github.com/LedgerHQ/ledger-live/commit/be4ad4860c3954549c8ac955e1971f52cdb99679) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Fix redirection from upsell screen

- [`2a3013359`](https://github.com/LedgerHQ/ledger-live/commit/2a301335985cadf937a7acfc661d55572eb73301) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Add Analytics 'reason' field in context of sync events

* [#815](https://github.com/LedgerHQ/ledger-live/pull/815) [`152339dcee`](https://github.com/LedgerHQ/ledger-live/commit/152339dceeaca4b4b7656aad1c690589189900a8) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generics lotties animations

- [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4) Thanks [@LFBarreto](https://github.com/LFBarreto)! - update ptx smart routing feature flag and live app web player undefined uri params

- Updated dependencies [[`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418), [`68c50cd94`](https://github.com/LedgerHQ/ledger-live/commit/68c50cd94bbe50a1bf284a2e9e5aed3781788754), [`092a887af`](https://github.com/LedgerHQ/ledger-live/commit/092a887af5a1405a1de3704bc5954c761cd53457), [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb), [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2), [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4), [`f28d40354`](https://github.com/LedgerHQ/ledger-live/commit/f28d4035426e741822108daf172f4509ce030751), [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311), [`2fd6f6244`](https://github.com/LedgerHQ/ledger-live/commit/2fd6f6244c41158883ca44accf9cbda4fd8d3418)]:
  - @ledgerhq/native-ui@0.9.0-next.0
  - @ledgerhq/types-live@6.24.0-next.0
  - @ledgerhq/live-common@26.1.0-next.0
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.4-next.0
  - @ledgerhq/hw-transport-http@6.27.3-next.0
  - @ledgerhq/react-native-hid@6.28.5-next.0

## 3.6.0-next.3

### Minor Changes

- [#855](https://github.com/LedgerHQ/ledger-live/pull/855) [`2258f1ae8`](https://github.com/LedgerHQ/ledger-live/commit/2258f1ae8e052761003d2c92efd2e5d00198439e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add banner to external integrations

## 3.6.0-next.2

### Patch Changes

- Updated dependencies [[`a36d1de86`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100)]:
  - @ledgerhq/live-common@26.0.0-next.2

## 3.6.0-next.1

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- Updated dependencies [[`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/live-common@25.2.0-next.1

## 3.6.0-next.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

### Patch Changes

- [#798](https://github.com/LedgerHQ/ledger-live/pull/798) [`222335854`](https://github.com/LedgerHQ/ledger-live/commit/222335854d412cd748c0add73b5f0bb93e02ba42) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - bug fix issue on storyly package version

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#859](https://github.com/LedgerHQ/ledger-live/pull/859) [`f66e547cb`](https://github.com/LedgerHQ/ledger-live/commit/f66e547cb9f9c6403f3046c08c8c14789fc47bfd) Thanks [@gre](https://github.com/gre)! - Add Analytics 'reason' field in context of sync events

* [#815](https://github.com/LedgerHQ/ledger-live/pull/815) [`152339dce`](https://github.com/LedgerHQ/ledger-live/commit/152339dceeaca4b4b7656aad1c690589189900a8) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add generics lotties animations

* Updated dependencies [[`37159cbb9`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e), [`ebe1adfb7`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6), [`3dbd4d078`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f), [`1a33d8641`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5), [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8), [`3cc45438a`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525), [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`f4b789442`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466), [`97eab434d`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9)]:
  - @ledgerhq/live-common@25.2.0-next.0
  - @ledgerhq/types-live@6.23.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.3-next.0
  - @ledgerhq/types-cryptoassets@6.23.0-next.0

## 3.5.1

### Patch Changes

- [#972](https://github.com/LedgerHQ/ledger-live/pull/972) [`d39efbb170`](https://github.com/LedgerHQ/ledger-live/commit/d39efbb170d78d8d0289ba3972532d0c5a9fa75b) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue during receive flow causing crash

* [#972](https://github.com/LedgerHQ/ledger-live/pull/972) [`bbb229a824`](https://github.com/LedgerHQ/ledger-live/commit/bbb229a824f1006f4d0eaebd4363c01cb60cdbf3) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - analytics reborn issue

- [#972](https://github.com/LedgerHQ/ledger-live/pull/972) [`d7e8766dbd`](https://github.com/LedgerHQ/ledger-live/commit/d7e8766dbdbe2172ff1004fcbeb9724c5e76ec38) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix undefined issue on some accounts during receive flow

## 3.5.0

### Minor Changes

- [#740](https://github.com/LedgerHQ/ledger-live/pull/740) [`709020dd7`](https://github.com/LedgerHQ/ledger-live/commit/709020dd74a228afca1d592264d42cfb7469e746) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fixed incorrect value for used space in Manager

* [#389](https://github.com/LedgerHQ/ledger-live/pull/389) [`d4a71a6d8`](https://github.com/LedgerHQ/ledger-live/commit/d4a71a6d890d85f1ff36641949e3a8396d0a8eb9) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Fix wrong gas Price Polygon

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of memo for Hedera on LLM

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - feat: add ERC20 token support to the Platform API

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - LIVE-1004 Hedera integration on LLM

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add Searching bar for validators list of ATOM and SOL

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add support of Stellar assets (tokens)

* [#703](https://github.com/LedgerHQ/ledger-live/pull/703) [`aabfe4950`](https://github.com/LedgerHQ/ledger-live/commit/aabfe495061dbf7169945e77c7adb5fdccef6114) Thanks [@mehulcs](https://github.com/mehulcs)! - Rewards balance info banner for Cardanno currency

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

* [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

- [#728](https://github.com/LedgerHQ/ledger-live/pull/728) [`b0053cced`](https://github.com/LedgerHQ/ledger-live/commit/b0053cced9accefe8ecbf0983934e18fcc75bad6) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Learn page add a close button to allow back navigation

### Patch Changes

- [#718](https://github.com/LedgerHQ/ledger-live/pull/718) [`14245392b`](https://github.com/LedgerHQ/ledger-live/commit/14245392b30d6ece427bdcbe5bce3aab6ec80dd4) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the error wording for users trying to update the firmware via bluetooth

* [#374](https://github.com/LedgerHQ/ledger-live/pull/374) [`111160df7`](https://github.com/LedgerHQ/ledger-live/commit/111160df73e426a4a659f0717fcd976dea8f2e94) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix 2 firmware update banners being displayed on the wallet screen

- [#767](https://github.com/LedgerHQ/ledger-live/pull/767) [`b80857e94`](https://github.com/LedgerHQ/ledger-live/commit/b80857e94c8050be2443d2d53525a920fa74b74e) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Disable ftx ftxus temporary as a swap provider before official mobile release

* [#811](https://github.com/LedgerHQ/ledger-live/pull/811) [`0872e6688`](https://github.com/LedgerHQ/ledger-live/commit/0872e6688d34b6711a7043b24dfb765f72fe9e5d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - add microphone permission to LLM for live apps

- [#792](https://github.com/LedgerHQ/ledger-live/pull/792) [`555c334eb`](https://github.com/LedgerHQ/ledger-live/commit/555c334ebf9f25271a810bc487abce03acf30fc5) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue related to navigation on receive flow

* [#897](https://github.com/LedgerHQ/ledger-live/pull/897) [`bb92400cf`](https://github.com/LedgerHQ/ledger-live/commit/bb92400cf8243ec1df89a08810bd5b6788e25575) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow fix issue on receive token accounts from market page

- [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).

* [#586](https://github.com/LedgerHQ/ledger-live/pull/586) [`37598e481`](https://github.com/LedgerHQ/ledger-live/commit/37598e4816139a280236437e3b8c001c05fcbcd3) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

- [#821](https://github.com/LedgerHQ/ledger-live/pull/821) [`7e46d2828`](https://github.com/LedgerHQ/ledger-live/commit/7e46d28284b6d1700a36bb776dbd3708233cfc61) Thanks [@LFBarreto](https://github.com/LFBarreto)! - revert storyly

* [#711](https://github.com/LedgerHQ/ledger-live/pull/711) [`afa1ca628`](https://github.com/LedgerHQ/ledger-live/commit/afa1ca628003b6df3f922b6cc9bdb0293e0fffd5) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount to show all accounts

- [#699](https://github.com/LedgerHQ/ledger-live/pull/699) [`957d942a4`](https://github.com/LedgerHQ/ledger-live/commit/957d942a48e98a4f834a2d566cf75e658d6f8c29) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Reborn analytics

* [#804](https://github.com/LedgerHQ/ledger-live/pull/804) [`10aba54ba`](https://github.com/LedgerHQ/ledger-live/commit/10aba54ba8a14853a5d50d0cebf1e2af965b6320) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Keyboard avoiding view fixed on Send Coin Amount page

- [#794](https://github.com/LedgerHQ/ledger-live/pull/794) [`661719e15`](https://github.com/LedgerHQ/ledger-live/commit/661719e159666b140246079107e8cf09d452268f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fic issue on redirection after account deletion

* [#823](https://github.com/LedgerHQ/ledger-live/pull/823) [`4df8aed2e`](https://github.com/LedgerHQ/ledger-live/commit/4df8aed2e865f1e7ef15f45780673cf5c26fbfec) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - market receive flow redirection issue

- [#796](https://github.com/LedgerHQ/ledger-live/pull/796) [`078665b95`](https://github.com/LedgerHQ/ledger-live/commit/078665b952d7d8b26e98687e5d6275466353e31d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Send Flow navigation issue

* [#847](https://github.com/LedgerHQ/ledger-live/pull/847) [`03c90eebe`](https://github.com/LedgerHQ/ledger-live/commit/03c90eebebd87cb58c796fd422657b8a0ace8ab3) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow prevent creation of multiple accounts at the same time

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Log experimental and feature flags in Sentry error reports.

* [#833](https://github.com/LedgerHQ/ledger-live/pull/833) [`91cfea6e2`](https://github.com/LedgerHQ/ledger-live/commit/91cfea6e250574b6e21982509b4630066c7816bf) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow copy address button overflow issue

- [#883](https://github.com/LedgerHQ/ledger-live/pull/883) [`7101ca25c`](https://github.com/LedgerHQ/ledger-live/commit/7101ca25cb38490ae9697be2122aa2a42e734d21) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - prevent double modal to pop during verification of address

* [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fixes issue on market header button touch highlight color

- [#797](https://github.com/LedgerHQ/ledger-live/pull/797) [`b2eb19311`](https://github.com/LedgerHQ/ledger-live/commit/b2eb19311711bf3a1cc4ca095af495da0988caca) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - fix issue on token account creation name

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- [#737](https://github.com/LedgerHQ/ledger-live/pull/737) [`8ee5ab993`](https://github.com/LedgerHQ/ledger-live/commit/8ee5ab9937b2abba6837684933dde266a09811cd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix missing import in NFTViewer

- Updated dependencies [[`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b), [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c), [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f), [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86), [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed), [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c), [`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b), [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@25.1.0
  - @ledgerhq/native-ui@0.8.3

## 3.5.0-next.28

### Patch Changes

- [#897](https://github.com/LedgerHQ/ledger-live/pull/897) [`bb92400cf`](https://github.com/LedgerHQ/ledger-live/commit/bb92400cf8243ec1df89a08810bd5b6788e25575) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow fix issue on receive token accounts from market page

## 3.5.0-next.27

### Patch Changes

- [#883](https://github.com/LedgerHQ/ledger-live/pull/883) [`7101ca25c`](https://github.com/LedgerHQ/ledger-live/commit/7101ca25cb38490ae9697be2122aa2a42e734d21) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - prevent double modal to pop during verification of address

## 3.5.0-next.26

### Patch Changes

- [#847](https://github.com/LedgerHQ/ledger-live/pull/847) [`03c90eebe`](https://github.com/LedgerHQ/ledger-live/commit/03c90eebebd87cb58c796fd422657b8a0ace8ab3) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow prevent creation of multiple accounts at the same time

## 3.5.0-next.25

### Patch Changes

- [#834](https://github.com/LedgerHQ/ledger-live/pull/834) [`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fixes issue on market header button touch highlight color

- Updated dependencies [[`7aa93b8b2`](https://github.com/LedgerHQ/ledger-live/commit/7aa93b8b260a48d236b33181e1500f96962b3d86)]:
  - @ledgerhq/native-ui@0.8.3-next.1

## 3.5.0-next.24

### Patch Changes

- [#833](https://github.com/LedgerHQ/ledger-live/pull/833) [`91cfea6e2`](https://github.com/LedgerHQ/ledger-live/commit/91cfea6e250574b6e21982509b4630066c7816bf) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow copy address button overflow issue

## 3.5.0-next.23

### Patch Changes

- [#823](https://github.com/LedgerHQ/ledger-live/pull/823) [`4df8aed2e`](https://github.com/LedgerHQ/ledger-live/commit/4df8aed2e865f1e7ef15f45780673cf5c26fbfec) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - market receive flow redirection issue

## 3.5.0-next.22

### Patch Changes

- [#821](https://github.com/LedgerHQ/ledger-live/pull/821) [`7e46d2828`](https://github.com/LedgerHQ/ledger-live/commit/7e46d28284b6d1700a36bb776dbd3708233cfc61) Thanks [@LFBarreto](https://github.com/LFBarreto)! - revert storyly

## 3.5.0-next.21

### Patch Changes

- [#811](https://github.com/LedgerHQ/ledger-live/pull/811) [`0872e6688`](https://github.com/LedgerHQ/ledger-live/commit/0872e6688d34b6711a7043b24dfb765f72fe9e5d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - add microphone permission to LLM for live apps

## 3.5.0-next.20

### Patch Changes

- [#804](https://github.com/LedgerHQ/ledger-live/pull/804) [`10aba54ba`](https://github.com/LedgerHQ/ledger-live/commit/10aba54ba8a14853a5d50d0cebf1e2af965b6320) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Keyboard avoiding view fixed on Send Coin Amount page

## 3.5.0-next.19

### Patch Changes

- [#797](https://github.com/LedgerHQ/ledger-live/pull/797) [`b2eb19311`](https://github.com/LedgerHQ/ledger-live/commit/b2eb19311711bf3a1cc4ca095af495da0988caca) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Receive flow - fix issue on token account creation name

## 3.5.0-next.18

### Patch Changes

- [#794](https://github.com/LedgerHQ/ledger-live/pull/794) [`661719e15`](https://github.com/LedgerHQ/ledger-live/commit/661719e159666b140246079107e8cf09d452268f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fic issue on redirection after account deletion

## 3.5.0-next.17

### Patch Changes

- [#792](https://github.com/LedgerHQ/ledger-live/pull/792) [`555c334eb`](https://github.com/LedgerHQ/ledger-live/commit/555c334ebf9f25271a810bc487abce03acf30fc5) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - fix issue related to navigation on receive flow

## 3.5.0-next.16

### Patch Changes

- [#796](https://github.com/LedgerHQ/ledger-live/pull/796) [`078665b95`](https://github.com/LedgerHQ/ledger-live/commit/078665b952d7d8b26e98687e5d6275466353e31d) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Send Flow navigation issue

## 3.5.0-next.15

### Minor Changes

- [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

### Patch Changes

- Updated dependencies [[`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c)]:
  - @ledgerhq/live-common@25.1.0-next.2

## 3.5.0-next.14

### Patch Changes

- Updated dependencies [[`858898d63`](https://github.com/LedgerHQ/ledger-live/commit/858898d63b3d70dc0be4cefbeaba5770c389660b)]:
  - @ledgerhq/native-ui@0.8.3-next.0

## 3.5.0-next.13

### Patch Changes

- [#699](https://github.com/LedgerHQ/ledger-live/pull/699) [`957d942a4`](https://github.com/LedgerHQ/ledger-live/commit/957d942a48e98a4f834a2d566cf75e658d6f8c29) Thanks [@LFBarreto](https://github.com/LFBarreto)! - Reborn analytics

## 3.5.0-next.12

### Minor Changes

- [#728](https://github.com/LedgerHQ/ledger-live/pull/728) [`b0053cced`](https://github.com/LedgerHQ/ledger-live/commit/b0053cced9accefe8ecbf0983934e18fcc75bad6) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLM - Learn page add a close button to allow back navigation

## 3.5.0-next.11

### Minor Changes

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

### Patch Changes

- Updated dependencies [[`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed)]:
  - @ledgerhq/live-common@25.1.0-next.1

## 3.5.0-next.10

### Patch Changes

- [#767](https://github.com/LedgerHQ/ledger-live/pull/767) [`b80857e94`](https://github.com/LedgerHQ/ledger-live/commit/b80857e94c8050be2443d2d53525a920fa74b74e) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Disable ftx ftxus temporary as a swap provider before official mobile release

## 3.5.0-next.9

### Minor Changes

- [#740](https://github.com/LedgerHQ/ledger-live/pull/740) [`709020dd7`](https://github.com/LedgerHQ/ledger-live/commit/709020dd74a228afca1d592264d42cfb7469e746) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fixed incorrect value for used space in Manager

## 3.5.0-next.8

### Minor Changes

- [#389](https://github.com/LedgerHQ/ledger-live/pull/389) [`d4a71a6d8`](https://github.com/LedgerHQ/ledger-live/commit/d4a71a6d890d85f1ff36641949e3a8396d0a8eb9) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Fix wrong gas Price Polygon

* [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of memo for Hedera on LLM

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - feat: add ERC20 token support to the Platform API

* [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - LIVE-1004 Hedera integration on LLM

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add Searching bar for validators list of ATOM and SOL

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Add support of Stellar assets (tokens)

- [#703](https://github.com/LedgerHQ/ledger-live/pull/703) [`aabfe4950`](https://github.com/LedgerHQ/ledger-live/commit/aabfe495061dbf7169945e77c7adb5fdccef6114) Thanks [@mehulcs](https://github.com/mehulcs)! - Rewards balance info banner for Cardanno currency

### Patch Changes

- [#633](https://github.com/LedgerHQ/ledger-live/pull/633) [`50fd2243e`](https://github.com/LedgerHQ/ledger-live/commit/50fd2243e0c867c71da2b51387de2f9dc0b32f18) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native (Storyly SDK)

* [#718](https://github.com/LedgerHQ/ledger-live/pull/718) [`14245392b`](https://github.com/LedgerHQ/ledger-live/commit/14245392b30d6ece427bdcbe5bce3aab6ec80dd4) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the error wording for users trying to update the firmware via bluetooth

- [#374](https://github.com/LedgerHQ/ledger-live/pull/374) [`111160df7`](https://github.com/LedgerHQ/ledger-live/commit/111160df73e426a4a659f0717fcd976dea8f2e94) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix 2 firmware update banners being displayed on the wallet screen

* [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).

- [#586](https://github.com/LedgerHQ/ledger-live/pull/586) [`37598e481`](https://github.com/LedgerHQ/ledger-live/commit/37598e4816139a280236437e3b8c001c05fcbcd3) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

* [#711](https://github.com/LedgerHQ/ledger-live/pull/711) [`afa1ca628`](https://github.com/LedgerHQ/ledger-live/commit/afa1ca628003b6df3f922b6cc9bdb0293e0fffd5) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount to show all accounts

- [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - Log experimental and feature flags in Sentry error reports.

* [`8d0dc4733`](https://github.com/LedgerHQ/ledger-live/commit/8d0dc4733143af138de9b1db2fb20d6aab78f1c0) Thanks [@Justkant](https://github.com/Justkant)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- [#737](https://github.com/LedgerHQ/ledger-live/pull/737) [`8ee5ab993`](https://github.com/LedgerHQ/ledger-live/commit/8ee5ab9937b2abba6837684933dde266a09811cd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix missing import in NFTViewer

- Updated dependencies [[`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b), [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c), [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f), [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@25.0.1-next.0

## 3.5.0-next.7

### Patch Changes

- [#711](https://github.com/LedgerHQ/ledger-live/pull/711) [`afa1ca628`](https://github.com/LedgerHQ/ledger-live/commit/afa1ca628003b6df3f922b6cc9bdb0293e0fffd5) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount to show all accounts

## 3.5.0-next.6

### Minor Changes

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

### Patch Changes

- Updated dependencies [[`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67)]:
  - @ledgerhq/live-common@25.0.0-next.6

## 3.5.0-next.5

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/live-common@25.0.0-next.5

## 3.5.0-next.4

### Minor Changes

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of memo for Hedera on LLM

* [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - LIVE-1004 Hedera integration on LLM

### Patch Changes

- Updated dependencies [[`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf)]:
  - @ledgerhq/live-common@25.0.0-next.4

## 3.5.0-next.3

### Minor Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

### Patch Changes

- Updated dependencies [[`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db)]:
  - @ledgerhq/live-common@25.0.0-next.3

## 3.5.0-next.2

### Patch Changes

- Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84)]:
  - @ledgerhq/live-common@25.0.0-next.2

## 3.5.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/live-common@25.0.0-next.1

## 3.5.0-next.0

### Minor Changes

- [#389](https://github.com/LedgerHQ/ledger-live/pull/389) [`d4a71a6d8`](https://github.com/LedgerHQ/ledger-live/commit/d4a71a6d890d85f1ff36641949e3a8396d0a8eb9) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Fix wrong gas Price Polygon

### Patch Changes

- [#633](https://github.com/LedgerHQ/ledger-live/pull/633) [`50fd2243e`](https://github.com/LedgerHQ/ledger-live/commit/50fd2243e0c867c71da2b51387de2f9dc0b32f18) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native (Storyly SDK)

* [#374](https://github.com/LedgerHQ/ledger-live/pull/374) [`111160df7`](https://github.com/LedgerHQ/ledger-live/commit/111160df73e426a4a659f0717fcd976dea8f2e94) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix 2 firmware update banners being displayed on the wallet screen

- [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).

* [#586](https://github.com/LedgerHQ/ledger-live/pull/586) [`37598e481`](https://github.com/LedgerHQ/ledger-live/commit/37598e4816139a280236437e3b8c001c05fcbcd3) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

- [#386](https://github.com/LedgerHQ/ledger-live/pull/386) [`8917ca143`](https://github.com/LedgerHQ/ledger-live/commit/8917ca1436e780e3a52f66f968f8224ad35362b4) Thanks [@gre](https://github.com/gre)! - Log experimental and feature flags in Sentry error reports.

* [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

* Updated dependencies [[`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/react-native-hw-transport-ble@6.27.2-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-http@6.27.2-next.0
  - @ledgerhq/react-native-hid@6.28.4-next.0
  - @ledgerhq/native-ui@0.8.2-next.0

## 3.4.1

### Patch Changes

- [#642](https://github.com/LedgerHQ/ledger-live/pull/642) [`fbb61657d`](https://github.com/LedgerHQ/ledger-live/commit/fbb61657d1204174c31dc37c716e5c837617b60f) Thanks [@porenes](https://github.com/porenes)! - Adding [ L ] Market to the Mobile Discover Landing

## 3.4.1-hotfix.0

### Patch Changes

- [#642](https://github.com/LedgerHQ/ledger-live/pull/642) [`fbb61657d`](https://github.com/LedgerHQ/ledger-live/commit/fbb61657d1204174c31dc37c716e5c837617b60f) Thanks [@porenes](https://github.com/porenes)! - Adding [ L ] Market to the Mobile Discover Landing

## 3.4.0

### Minor Changes

- [#582](https://github.com/LedgerHQ/ledger-live/pull/582) [`8aefbac63`](https://github.com/LedgerHQ/ledger-live/commit/8aefbac63188f72e8c3f6655b2f91fc45bf16004) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Refresh segment identify to take in account satisfaction user property change

### Patch Changes

- [#574](https://github.com/LedgerHQ/ledger-live/pull/574) [`6a5c9caf4`](https://github.com/LedgerHQ/ledger-live/commit/6a5c9caf4ff5b16830fff254be2b01e427073375) Thanks [@github-actions](https://github.com/apps/github-actions)! - Merge hotfix - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

* [#562](https://github.com/LedgerHQ/ledger-live/pull/562) [`41aa44fde`](https://github.com/LedgerHQ/ledger-live/commit/41aa44fde2ca4e0d127f82e622c4cdb3e96cfa90) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Empty analytics overlay when activating it

- [#592](https://github.com/LedgerHQ/ledger-live/pull/592) [`593cd6bc1`](https://github.com/LedgerHQ/ledger-live/commit/593cd6bc1dd146e99c7966aa03a9a20cac5af46a) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

* [#391](https://github.com/LedgerHQ/ledger-live/pull/391) [`d9689451e`](https://github.com/LedgerHQ/ledger-live/commit/d9689451efe39fd7333aafb9aff12df1702e88db) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix bug when navigating to the Manager screen without params

- [#568](https://github.com/LedgerHQ/ledger-live/pull/568) [`2f0f22075`](https://github.com/LedgerHQ/ledger-live/commit/2f0f220756e1c014cb8a8ecf1d62f1a4ddccb1b0) Thanks [@Justkant](https://github.com/Justkant)! - fix: imports should use /lib and not /src

* [#466](https://github.com/LedgerHQ/ledger-live/pull/466) [`026d923ee`](https://github.com/LedgerHQ/ledger-live/commit/026d923ee078169845026a9ab8abbf7cf235599d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update on Ledger Card CTA's (removed some, created one in the portfolio header)

- [#315](https://github.com/LedgerHQ/ledger-live/pull/315) [`093792ebb`](https://github.com/LedgerHQ/ledger-live/commit/093792ebb70704cfcba7f12f1511930d0cd33a05) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Reborn analytics

* [#373](https://github.com/LedgerHQ/ledger-live/pull/373) [`da3320c0a`](https://github.com/LedgerHQ/ledger-live/commit/da3320c0a65d6c5479eacf14e3a93ce85a42766c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Changing the architecture of NftMedia component

* Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860), [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0

## 3.4.0-next.7

### Patch Changes

- [#574](https://github.com/LedgerHQ/ledger-live/pull/574) [`6a5c9caf4`](https://github.com/LedgerHQ/ledger-live/commit/6a5c9caf4ff5b16830fff254be2b01e427073375) Thanks [@github-actions](https://github.com/apps/github-actions)! - Merge hotfix - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.4.0-next.6

### Patch Changes

- [#315](https://github.com/LedgerHQ/ledger-live/pull/315) [`093792ebb`](https://github.com/LedgerHQ/ledger-live/commit/093792ebb70704cfcba7f12f1511930d0cd33a05) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Reborn analytics

## 3.5.0-next.5

### Patch Changes

- [#592](https://github.com/LedgerHQ/ledger-live/pull/592) [`593cd6bc1`](https://github.com/LedgerHQ/ledger-live/commit/593cd6bc1dd146e99c7966aa03a9a20cac5af46a) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

## 3.5.0-next.4

### Patch Changes

- [#562](https://github.com/LedgerHQ/ledger-live/pull/562) [`41aa44fde`](https://github.com/LedgerHQ/ledger-live/commit/41aa44fde2ca4e0d127f82e622c4cdb3e96cfa90) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Empty analytics overlay when activating it

## 3.5.0-next.3

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1

## 3.5.0-next.2

### Patch Changes

- [#373](https://github.com/LedgerHQ/ledger-live/pull/373) [`da3320c0a`](https://github.com/LedgerHQ/ledger-live/commit/da3320c0a65d6c5479eacf14e3a93ce85a42766c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Changing the architecture of NftMedia component

## 3.5.0-next.1

### Minor Changes

- [#582](https://github.com/LedgerHQ/ledger-live/pull/582) [`8aefbac63`](https://github.com/LedgerHQ/ledger-live/commit/8aefbac63188f72e8c3f6655b2f91fc45bf16004) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Refresh segment identify to take in account satisfaction user property change

## 3.4.1-next.0

### Patch Changes

- [#391](https://github.com/LedgerHQ/ledger-live/pull/391) [`d9689451e`](https://github.com/LedgerHQ/ledger-live/commit/d9689451efe39fd7333aafb9aff12df1702e88db) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix bug when navigating to the Manager screen without params

* [#568](https://github.com/LedgerHQ/ledger-live/pull/568) [`2f0f22075`](https://github.com/LedgerHQ/ledger-live/commit/2f0f220756e1c014cb8a8ecf1d62f1a4ddccb1b0) Thanks [@Justkant](https://github.com/Justkant)! - fix: imports should use /lib and not /src

- [#466](https://github.com/LedgerHQ/ledger-live/pull/466) [`026d923ee`](https://github.com/LedgerHQ/ledger-live/commit/026d923ee078169845026a9ab8abbf7cf235599d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update on Ledger Card CTA's (removed some, created one in the portfolio header)

- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 3.3.2

### Patch Changes

- [#609](https://github.com/LedgerHQ/ledger-live/pull/609) [`0139d05ab`](https://github.com/LedgerHQ/ledger-live/commit/0139d05ab2adf83f49690e3b6cd93e87707f82d7) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.3.2-hotfix.0

### Patch Changes

- [#609](https://github.com/LedgerHQ/ledger-live/pull/609) [`0139d05ab`](https://github.com/LedgerHQ/ledger-live/commit/0139d05ab2adf83f49690e3b6cd93e87707f82d7) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.4.0

### Minor Changes

- [#385](https://github.com/LedgerHQ/ledger-live/pull/385) [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Handle all non final (i.e: non OK nor KO) status as pending

* [#412](https://github.com/LedgerHQ/ledger-live/pull/412) [`fbc32d3e2`](https://github.com/LedgerHQ/ledger-live/commit/fbc32d3e2e229e7a3dbe71bbd8c36ed203c61e34) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - AccountGraphCard : Add rounding when using counter value (to prevent too many decimals in crypto-value)

- [#371](https://github.com/LedgerHQ/ledger-live/pull/371) [`4f43ac0e5`](https://github.com/LedgerHQ/ledger-live/commit/4f43ac0e53e090239dcdc11ae3840cf5abbf401b) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Add back navigation to NftViewer and fixed style issues on the view

* [#336](https://github.com/LedgerHQ/ledger-live/pull/336) [`6bf75fa20`](https://github.com/LedgerHQ/ledger-live/commit/6bf75fa20e1991964948bf48c01a530a43ba03e1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated naming for last operations to last transactions

- [#337](https://github.com/LedgerHQ/ledger-live/pull/337) [`7bdf0091f`](https://github.com/LedgerHQ/ledger-live/commit/7bdf0091fef18d6b10e54a74a765f76798640100) Thanks [@gre](https://github.com/gre)! - (internal) Filtering more errors to NOT be reported to Sentry – typically to ignore users-specific cases

- Updated dependencies [[`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957), [`c5714333b`](https://github.com/LedgerHQ/ledger-live/commit/c5714333bdb1c90a29c20c7e5793184d89967142), [`d22452817`](https://github.com/LedgerHQ/ledger-live/commit/d224528174313bc4975e62d015adf928d4315620), [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e), [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062), [`2012b5477`](https://github.com/LedgerHQ/ledger-live/commit/2012b54773b6391f353903564a247ad02be1a296), [`10440ec3c`](https://github.com/LedgerHQ/ledger-live/commit/10440ec3c2bffa7ce8636a7838680bb3501ffe0d), [`e1f2f07a2`](https://github.com/LedgerHQ/ledger-live/commit/e1f2f07a2ba1de5eab6fa10c4c800b7097c8037d), [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`1e4a5647b`](https://github.com/LedgerHQ/ledger-live/commit/1e4a5647b39c0f806bc311383b49a246fbe453eb), [`508e4c23b`](https://github.com/LedgerHQ/ledger-live/commit/508e4c23babd04c48e7b626ef4004fb55f3c1ba9), [`b1e396dd8`](https://github.com/LedgerHQ/ledger-live/commit/b1e396dd89ca2787978dc7e53b7ca865133a1961), [`e9decc277`](https://github.com/LedgerHQ/ledger-live/commit/e9decc27785fb07972460494c8ef39e92b0127a1)]:
  - @ledgerhq/live-common@24.0.0
  - @ledgerhq/native-ui@0.8.1

## 3.4.0-next.4

### Patch Changes

- Updated dependencies [[`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062)]:
  - @ledgerhq/live-common@24.0.0-next.4

## 3.4.0-next.3

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- Updated dependencies [5145781e5]
  - @ledgerhq/live-common@24.0.0-next.3

## 3.3.1

### Patch Changes

- c3079243d: Exit readonly mode in multiple places where the user interacts with a device and therefore should have exited readonly mode. Fix a bug where user in "old" readonly mode would crash when pressing an account in MarketPage.
- bda266fc4: Fix an edge case where the readonly example portfolio would show up instead of the real one

## 3.3.1-hotfix.1

### Patch Changes

- bb592ab1d: Exit readonly mode in multiple places where the user interacts with a device and therefore should have exited readonly mode. Fix a bug where user in "old" readonly mode would crash when pressing an account in MarketPage.

## 3.3.1-hotfix.0

### Patch Changes

- b8dad7183: Fix an edge case where the readonly example portfolio would show up instead of the real one

## 3.3.1-next.2

### Patch Changes

- Updated dependencies [c5714333b]
  - @ledgerhq/live-common@24.0.0-next.2

## 3.3.1-next.1

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- Updated dependencies [99cc5bbc1]
- Updated dependencies [99cc5bbc1]
  - @ledgerhq/live-common@24.0.0-next.1

## 3.3.1-next.0

### Patch Changes

- fbc32d3e2: AccountGraphCard : Add rounding when using counter value (to prevent too many decimals in crypto-value)
- 4f43ac0e5: Add back navigation to NftViewer and fixed style issues on the view
- 6bf75fa20: Updated naming for last operations to last transactions
- 7bdf0091f: (internal) Filtering more errors to NOT be reported to Sentry – typically to ignore users-specific cases
- Updated dependencies [22531f3c3]
- Updated dependencies [d22452817]
- Updated dependencies [2012b5477]
- Updated dependencies [10440ec3c]
- Updated dependencies [e1f2f07a2]
- Updated dependencies [1e4a5647b]
- Updated dependencies [508e4c23b]
- Updated dependencies [b1e396dd8]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-next.0
  - @ledgerhq/native-ui@0.8.1-next.0

## 3.3.0

### Minor Changes

- 09f79c7b4: Add Cardano to mobile
- 7ba2346a5: feat(LLM): multibuy 1.5 [LIVE-1710]
- 4db0f58ca: Updated learn feature url to be remote configurable
- bf12e0f65: feat: sell and fund flow [LIVE-784]
- d2576ef46: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1196]
- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.
- fe3c7a39c: Add Earn Rewards btn on Solana

### Patch Changes

- 3d71946fb: Fix deep linking logic for platform apps
- 27c947ba4: fix(multibuy): remove fiat filter
- 35737e057: fix(LLM): can't open custom loaded manifest on iOS [LIVE-2481]
- 95b4c2854: Fix hasOrderedNano state with Buy Nano screen
- 3d1ab8511: Behavior fixed when clicking on the "My Ledger" button on the tab bar when on read only mode
- 46994ebfd: Wording - small typos fixed
- 8a973ad0e: fix(LLM): platform manifest can be undefined when no network [LIVE-2571]
- 5bae58815: bugfix - webview reload crash issue related to ui rendering layout shift bugs
- Updated dependencies [8323d2eaa]
- Updated dependencies [bf12e0f65]
- Updated dependencies [8861c4fe0]
- Updated dependencies [592ad2f7b]
- Updated dependencies [ec5c4fa3d]
- Updated dependencies [dd6a12c9b]
- Updated dependencies [608010c9d]
- Updated dependencies [78a64769d]
- Updated dependencies [0c2c6682b]
  - @ledgerhq/live-common@23.1.0
  - @ledgerhq/native-ui@0.8.0

## 3.3.0-next.14

### Patch Changes

- 95b4c2854: Fix hasOrderedNano state with Buy Nano screen

## 3.3.0-next.13

### Patch Changes

- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0-next.4

## 3.3.0-next.12

### Patch Changes

- 5bae58815: bugfix - webview reload crash issue related to ui rendering layout shift bugs
- Updated dependencies [0c2c6682b]
  - @ledgerhq/native-ui@0.8.0-next.2

## 3.3.0-next.11

### Patch Changes

- 46994ebfd: Wording - small typos fixed

## 3.3.0-next.10

### Patch Changes

- 3d1ab8511: Behavior fixed when clicking on the "My Ledger" button on the tab bar when on read only mode

## 3.3.0-next.9

### Patch Changes

- Updated dependencies [ec5c4fa3d]
  - @ledgerhq/live-common@23.1.0-next.3

## 3.3.0-next.8

### Patch Changes

- 27c947ba4: fix(multibuy): remove fiat filter

## 3.3.0-next.7

### Minor Changes

- 7ba2346a5: feat(LLM): multibuy 1.5 [LIVE-1710]

## 3.3.0-next.6

### Minor Changes

- bf12e0f65: feat: sell and fund flow [LIVE-784]
- d2576ef46: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1196]

## 3.2.1

### Patch Changes

- fea7a4aa1: Fix bug of a conditionally called hook in the firmware retrieval

## 3.2.1-hotfix.0

### Patch Changes

- Updated dependencies [bf12e0f65]
  - @ledgerhq/live-common@23.1.0-next.2

## 3.3.0-next.5

### Patch Changes

- 3d71946fb: Fix deep linking logic for platform apps

## 3.3.0-next.4

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable

## 3.3.0-next.3

### Minor Changes

- fe3c7a39c: Add Earn Rewards btn on Solana

## 3.3.0-next.2

### Minor Changes

- 09f79c7b4: Add Cardano to mobile

## 3.3.0-next.1

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.

### Patch Changes

- Updated dependencies [592ad2f7b]
- Updated dependencies [608010c9d]
  - @ledgerhq/native-ui@0.8.0-next.1
  - @ledgerhq/live-common@23.1.0-next.1

## 3.2.1-next.0

### Patch Changes

- 35737e057: fix(LLM): can't open custom loaded manifest on iOS [LIVE-2481]
- 8a973ad0e: fix(LLM): platform manifest can be undefined when no network [LIVE-2571]
- Updated dependencies [8323d2eaa]
- Updated dependencies [8861c4fe0]
- Updated dependencies [dd6a12c9b]
  - @ledgerhq/live-common@23.1.0-next.0
  - @ledgerhq/native-ui@0.7.19-next.0

## 3.2.0

### Minor Changes

- becfc06f9: LIVE-1751 Solana staking on LLM
- d63570a38: Rework Cosmos delegation flow
- c6c127630: We now prompt a modal to ask the user what he thinks of the app at key moments (for example when receiving crypto or claiming rewards) based on some conditions (installed the app for at least x days, has at least x accounts, ...) The purpose of this feature is to increase the ratings of the app on the stores
- 8ea9c2deb: LLM: increase to iOS 13 minimum
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- 61116f39f: Disable React Navigation Sentry integration
- a26ee3f54: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- cb5814f38: Temporarily remove some device action error tracking due to it causing a crash on iOS while offline
- 3cd734f86: Add firmware update feature for Android via OTG USB
- 54dbab04f: Fix Ledger logo glitch
- Updated dependencies [09648db7f]
- Updated dependencies [a66fbe852]
- Updated dependencies [0f59cfc10]
- Updated dependencies [8ee9c5568]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [98ecc6272]
- Updated dependencies [9a86fe231]
- Updated dependencies [8b2e24b6c]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0
  - @ledgerhq/native-ui@0.7.18
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [3cd734f86]
- Updated dependencies [16be6e5c0]
- Updated dependencies [a26ee3f54]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]

  - @ledgerhq/live-common@22.2.0
  - @ledgerhq/react-native-hid@6.28.3

## 3.2.0-llmnext.6

### Patch Changes

- Updated dependencies [16be6e5c0]
  - @ledgerhq/live-common@22.2.0-llmnext.2

## 3.2.0-llmnext.5

### Patch Changes

- a26ee3f54: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- Updated dependencies [a26ee3f54]
  - @ledgerhq/live-common@22.2.0-llmnext.1

## 3.2.0-llmnext.4

### Patch Changes

- cb5814f3: Temporarily remove some device action error tracking due to it causing a crash on iOS while offline

## 3.2.0-llmnext.3

### Minor Changes

- c6c12763: We now prompt a modal to ask the user what he thinks of the app at key moments (for example when receiving crypto or claiming rewards) based on some conditions (installed the app for at least x days, has at least x accounts, ...) The purpose of this feature is to increase the ratings of the app on the stores

## 3.2.0-llmnext.2

### Minor Changes

- becfc06f: LIVE-1751 Solana staking on LLM
- d63570a3: Rework Cosmos delegation flow

## 3.1.3

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1

## 3.1.3-hotfix.0

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1-hotfix.0

## 3.2.0-next.4

### Patch Changes

- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 3.2.0-next.3

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 3.2.0-next.2

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 3.2.0-next.1

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 3.2.0-next.0

### Minor Changes

- 8ea9c2deb: LLM: increase to iOS 13 minimum
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- 61116f39f: Disable React Navigation Sentry integration
- Updated dependencies [09648db7f]
- Updated dependencies [0f59cfc10]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0-next.0
  - @ledgerhq/native-ui@0.7.18-next.0

## 3.1.3

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1

## 3.1.3-hotfix.0

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1-hotfix.0

## 3.1.2

### Patch Changes

- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [9dadffa88]
- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0

## 3.1.2-next.2

### Patch Changes

- Updated dependencies [9dadffa88]
  - @ledgerhq/live-common@22.2.0-next.2

## 3.1.2-next.1

### Patch Changes

- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0-next.1

## 3.1.2-next.0

### Patch Changes

- Updated dependencies [e0c18707]
- Updated dependencies [ee44ffb1]
- Updated dependencies [0252fab7]
- Updated dependencies [3f816efb]
- Updated dependencies [f2574d25]
- Updated dependencies [f913f6fd]
  - @ledgerhq/live-common@22.2.0-next.0

## 3.1.2-llmnext.1

### Patch Changes

- 3cd734f8: Add firmware update feature for Android via OTG USB
- Updated dependencies [3cd734f8]
  - @ledgerhq/react-native-hid@6.28.3-llmnext.0

## 3.1.2-llmnext.0

### Patch Changes

- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0-llmnext.0
