# ledger-live-mobile-e2e-tests

## 0.39.0

### Minor Changes

- [#21716](https://github.com/LedgerHQ/ledger-live/pull/21716) [`641fdb7`](https://github.com/LedgerHQ/ledger-live/commit/641fdb7b392aff50d4bfa206e2435f75cb610227) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Let the mobile Ledger Sync e2e suites run against the PROD trustchain during a release validation. The environment now reaches the app as a Detox launch arg, which the e2e bridge applies before the app tree mounts — the only point where the trustchain SDK singleton can still be pinned — so it no longer has to be refused outright.

- [#21413](https://github.com/LedgerHQ/ledger-live/pull/21413) [`bd3d8c4`](https://github.com/LedgerHQ/ledger-live/commit/bd3d8c40fed36706147c9aede6d2618776ffd53c) Thanks [@jeportie](https://github.com/jeportie)! - Stop the Allure test description from repeating the `SPECULOS App: <name> (<version>)` block once
  per Speculos (re)launch. `jest-allure2-reporter`'s `allure.description()` appends rather than
  replaces — each call pushes a paragraph that the reporter joins with a blank line — and
  `launchSpeculos()` emits one on every invocation, so a test whose setup retried three times printed
  the same block four times. The mobile reporter config now drops verbatim-duplicate paragraphs before
  joining, keeping the first of each; blocks for genuinely different apps (a swap lists one per
  currency plus Exchange and its dependencies) all differ, so they are untouched. `descriptionHtml` is
  deduplicated the same way, since it appends identically.

  Also stops `executeCliCommands` from tearing down and relaunching Speculos after its _final_ failed
  attempt. Its two siblings, `executeCliCommandsOnApp` and `setupMainSpeculosApp`, already guard that
  re-setup with `attempt < maxRetries`; without the guard the loop pays for one more
  acquire/release cycle it will never use, and a failure inside that re-setup escapes the retry loop
  and replaces the real `lastError` in the reported message.

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

- [#21595](https://github.com/LedgerHQ/ledger-live/pull/21595) [`a18539e`](https://github.com/LedgerHQ/ledger-live/commit/a18539e885fdfe379c77623a448256fb4602b6c0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Read the sub-account id from the screen in `navigateToSubAccount` instead of rebuilding it. Rebuilding meant hardcoding one of the two id formats in the wild: an account synced before the generic coin framework keeps the format it was stored under, a newer one gets `encodeTokenAccountId`. The helper now opens the sub-account from the flat accounts list and returns the id the app gave it, with an identity assertion that does not depend on the id it just read.

  `navigateToTokenInAccount` expands the token list when the "see more" button is present. The list shows three tokens while collapsed, so a fourth one was never on screen to scroll to. Adds a `testID` to that button in `SubAccountsList`.

- [#21702](https://github.com/LedgerHQ/ledger-live/pull/21702) [`654199a`](https://github.com/LedgerHQ/ledger-live/commit/654199ad52f8dce63fc46cd826d11f90c533b804) Thanks [@jeportie](https://github.com/jeportie)! - Surface the swap-init root cause on mobile E2E failures

  When the device stalls on "Exchange app is ready", `waitForReviewTransaction` appends a hint telling
  the reader to open the "⚠️ Swap-init error" attachment. That hint lives in shared code and is
  emitted on both platforms, but the attachment was produced by the desktop harness only, so on
  mobile it pointed at something that never existed.

  The extraction now lives in `@ledgerhq/live-e2e-shared/swapInitError` and both harnesses use it.
  Mobile attaches the result first, scanning the app logs and the webview console together, because
  the failure can surface on either side of the wallet-api call. Desktop delegates to the shared
  function and keeps its previous output.

- [#21807](https://github.com/LedgerHQ/ledger-live/pull/21807) [`96d6c1a`](https://github.com/LedgerHQ/ledger-live/commit/96d6c1af0048108952ac2a5183127816baa478bc) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Give the receive verify-address tests back to Coin-integration (QAA-1500)

  `1d62665e5e9` moved `receive.address.spec.ts` off Wallet XP but carved XRP and
  Tezos out to `Team.BST` — on desktop through two `teamOwner` overrides, on mobile
  through `BST_VERIFY_ADDRESS_CURRENCIES`. Every test split from B2CQA-249 and
  B2CQA-651 belongs to Coin-integration, so both carve-outs go, and with them the
  now-dead `teamOwner?` field on `ReceiveTestCase`.

  Ownership feeds Allure's `owner`/`parentSuite`/`feature` and the `team` CI
  dropdown, which `e2e/tooling/filter/teamSpecs.mjs` resolves by grepping
  `Team.<MEMBER>` per spec _file_ — so a single `Team.BST` line pulled the whole
  file into `team=bst`. `--list-teams` now reports `bst` at 9 desktop spec files
  instead of 10 and 120 mobile instead of 130, with `coin-integration` unchanged.

  Mobile also linked only the B2CQA-249-family key for eight of the ten currencies
  while desktop linked both families. The missing B2CQA-651-family keys (2687, 2688,
  2689, 2690, 2691, 2693, 2694, 2696) are added so both suites report the same Xray
  tests.

- [#21878](https://github.com/LedgerHQ/ledger-live/pull/21878) [`c2d5d6a`](https://github.com/LedgerHQ/ledger-live/commit/c2d5d6ae477d616cd9ef61d45595ffa62cdfb126) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Scroll the portfolio hero back into view before asserting on it (QAA-1571)

  Android detaches off-screen FlatList rows from the native view hierarchy, so once
  the portfolio list is scrolled past its first row the balance and the quick-action
  CTAs are absent rather than under-visible, and no wait recovers them. The nightly
  hierarchy dumps show the list arriving ~1194px down — the exact height of that row
  — with `market-banner-container` as the first attached child at y=54 instead of
  y=1248, which is why `quick-actions-ctas` and `portfolio-balance-normal` timed out
  on Android while iOS stayed green.

  Every portfolio accessor that targets the balance or the quick actions now scrolls
  the list up to its own target first, via `scrollToId(target, list, undefined, "up")`.
  Visibility thresholds and timeouts are unchanged. Detox's `scrollTo("top")` is not
  usable here: the list's pull-to-refresh control means the action never reports a top
  edge and force-breaks its loop.

## 0.39.0-next.0

### Minor Changes

- [#21716](https://github.com/LedgerHQ/ledger-live/pull/21716) [`641fdb7`](https://github.com/LedgerHQ/ledger-live/commit/641fdb7b392aff50d4bfa206e2435f75cb610227) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Let the mobile Ledger Sync e2e suites run against the PROD trustchain during a release validation. The environment now reaches the app as a Detox launch arg, which the e2e bridge applies before the app tree mounts — the only point where the trustchain SDK singleton can still be pinned — so it no longer has to be refused outright.

- [#21413](https://github.com/LedgerHQ/ledger-live/pull/21413) [`bd3d8c4`](https://github.com/LedgerHQ/ledger-live/commit/bd3d8c40fed36706147c9aede6d2618776ffd53c) Thanks [@jeportie](https://github.com/jeportie)! - Stop the Allure test description from repeating the `SPECULOS App: <name> (<version>)` block once
  per Speculos (re)launch. `jest-allure2-reporter`'s `allure.description()` appends rather than
  replaces — each call pushes a paragraph that the reporter joins with a blank line — and
  `launchSpeculos()` emits one on every invocation, so a test whose setup retried three times printed
  the same block four times. The mobile reporter config now drops verbatim-duplicate paragraphs before
  joining, keeping the first of each; blocks for genuinely different apps (a swap lists one per
  currency plus Exchange and its dependencies) all differ, so they are untouched. `descriptionHtml` is
  deduplicated the same way, since it appends identically.

  Also stops `executeCliCommands` from tearing down and relaunching Speculos after its _final_ failed
  attempt. Its two siblings, `executeCliCommandsOnApp` and `setupMainSpeculosApp`, already guard that
  re-setup with `attempt < maxRetries`; without the guard the loop pays for one more
  acquire/release cycle it will never use, and a failure inside that re-setup escapes the retry loop
  and replaces the real `lastError` in the reported message.

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

- [#21595](https://github.com/LedgerHQ/ledger-live/pull/21595) [`a18539e`](https://github.com/LedgerHQ/ledger-live/commit/a18539e885fdfe379c77623a448256fb4602b6c0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Read the sub-account id from the screen in `navigateToSubAccount` instead of rebuilding it. Rebuilding meant hardcoding one of the two id formats in the wild: an account synced before the generic coin framework keeps the format it was stored under, a newer one gets `encodeTokenAccountId`. The helper now opens the sub-account from the flat accounts list and returns the id the app gave it, with an identity assertion that does not depend on the id it just read.

  `navigateToTokenInAccount` expands the token list when the "see more" button is present. The list shows three tokens while collapsed, so a fourth one was never on screen to scroll to. Adds a `testID` to that button in `SubAccountsList`.

- [#21702](https://github.com/LedgerHQ/ledger-live/pull/21702) [`654199a`](https://github.com/LedgerHQ/ledger-live/commit/654199ad52f8dce63fc46cd826d11f90c533b804) Thanks [@jeportie](https://github.com/jeportie)! - Surface the swap-init root cause on mobile E2E failures

  When the device stalls on "Exchange app is ready", `waitForReviewTransaction` appends a hint telling
  the reader to open the "⚠️ Swap-init error" attachment. That hint lives in shared code and is
  emitted on both platforms, but the attachment was produced by the desktop harness only, so on
  mobile it pointed at something that never existed.

  The extraction now lives in `@ledgerhq/live-e2e-shared/swapInitError` and both harnesses use it.
  Mobile attaches the result first, scanning the app logs and the webview console together, because
  the failure can surface on either side of the wallet-api call. Desktop delegates to the shared
  function and keeps its previous output.

- [#21807](https://github.com/LedgerHQ/ledger-live/pull/21807) [`96d6c1a`](https://github.com/LedgerHQ/ledger-live/commit/96d6c1af0048108952ac2a5183127816baa478bc) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Give the receive verify-address tests back to Coin-integration (QAA-1500)

  `1d62665e5e9` moved `receive.address.spec.ts` off Wallet XP but carved XRP and
  Tezos out to `Team.BST` — on desktop through two `teamOwner` overrides, on mobile
  through `BST_VERIFY_ADDRESS_CURRENCIES`. Every test split from B2CQA-249 and
  B2CQA-651 belongs to Coin-integration, so both carve-outs go, and with them the
  now-dead `teamOwner?` field on `ReceiveTestCase`.

  Ownership feeds Allure's `owner`/`parentSuite`/`feature` and the `team` CI
  dropdown, which `e2e/tooling/filter/teamSpecs.mjs` resolves by grepping
  `Team.<MEMBER>` per spec _file_ — so a single `Team.BST` line pulled the whole
  file into `team=bst`. `--list-teams` now reports `bst` at 9 desktop spec files
  instead of 10 and 120 mobile instead of 130, with `coin-integration` unchanged.

  Mobile also linked only the B2CQA-249-family key for eight of the ten currencies
  while desktop linked both families. The missing B2CQA-651-family keys (2687, 2688,
  2689, 2690, 2691, 2693, 2694, 2696) are added so both suites report the same Xray
  tests.

- [#21878](https://github.com/LedgerHQ/ledger-live/pull/21878) [`c2d5d6a`](https://github.com/LedgerHQ/ledger-live/commit/c2d5d6ae477d616cd9ef61d45595ffa62cdfb126) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Scroll the portfolio hero back into view before asserting on it (QAA-1571)

  Android detaches off-screen FlatList rows from the native view hierarchy, so once
  the portfolio list is scrolled past its first row the balance and the quick-action
  CTAs are absent rather than under-visible, and no wait recovers them. The nightly
  hierarchy dumps show the list arriving ~1194px down — the exact height of that row
  — with `market-banner-container` as the first attached child at y=54 instead of
  y=1248, which is why `quick-actions-ctas` and `portfolio-balance-normal` timed out
  on Android while iOS stayed green.

  Every portfolio accessor that targets the balance or the quick actions now scrolls
  the list up to its own target first, via `scrollToId(target, list, undefined, "up")`.
  Visibility thresholds and timeouts are unchanged. Detox's `scrollTo("top")` is not
  usable here: the list's pull-to-refresh control means the action never reports a top
  edge and force-breaks its loop.

## 0.38.0

### Minor Changes

- [#21206](https://github.com/LedgerHQ/ledger-live/pull/21206) [`750bdd4`](https://github.com/LedgerHQ/ledger-live/commit/750bdd4bbaaf7a1c591c8a8f21479f6c64fc9c95) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add mobile E2E for the post-onboarding hub mock flow (LIVE-31323).

- [#21332](https://github.com/LedgerHQ/ledger-live/pull/21332) [`08201e0`](https://github.com/LedgerHQ/ledger-live/commit/08201e0c9e14ed5436972d544bffc7484fad3703) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): open the MAD for the new send flow on LWM

- [#21312](https://github.com/LedgerHQ/ledger-live/pull/21312) [`a6db426`](https://github.com/LedgerHQ/ledger-live/commit/a6db4268cedf2523669ba946a683e1680ea4033e) Thanks [@jeportie](https://github.com/jeportie)! - Wait for the transfer bottom sheet to settle before tapping it (QAA-1522)

  `tapById` does not wait, and `openReceiveDrawer` tapped the sheet's receive button
  immediately after asking the sheet to open. `toBeVisible()` is satisfied at 75%,
  which a bottom sheet meets while still sliding, so on Android CI the tap landed
  either on a moving view — Espresso refusing the action with `target view does not
match one or more of the following constraints` — or before the button had
  mounted at all. 3/5 nightlies, still failing in the latest.

  Each of the three sheet taps now waits for the sheet's own container
  (`transfer-drawer`) at 100% visibility, per `e2e/mobile/docs/add-or-update-e2e.md` rules 11
  and 12: anchor on the state that proves the sheet is at rest rather than adding a
  retry or lengthening a timeout.

- [#21328](https://github.com/LedgerHQ/ledger-live/pull/21328) [`e9bdc14`](https://github.com/LedgerHQ/ledger-live/commit/e9bdc141bf251f0b94cdf58024386f1842adb7c7) Thanks [@jeportie](https://github.com/jeportie)! - Wait for the portfolio balance to resolve before reading it (QAA-1523)

  `expectTotalBalanceCounterValue` read `portfolio-balance-amount` with no prior
  wait. The balance section renders a skeleton in place of that element until the
  counter values resolve, so straight after a counter-value change the element does
  not exist. `getLabelOfElement` wraps its read in `retryUntilTimeout`, which
  retries on throw — so it polled a missing element for 60s and failed with
  `❌ [retryUntilTimeout] Timed out after 60000ms`, naming neither the element nor
  the reason. 3/5 nightlies on Android.

  The assertion now waits for `portfolio-balance-normal`, which the section carries
  only once the balance is available, before reading the amount. That puts the
  budget on the step that is actually slow and separates "the balance never
  resolved" from "it resolved in the wrong currency".

- [#21313](https://github.com/LedgerHQ/ledger-live/pull/21313) [`42f8610`](https://github.com/LedgerHQ/ledger-live/commit/42f86106adef416c279d7306508d1e454311d565) Thanks [@jeportie](https://github.com/jeportie)! - Wait for the portfolio quick-action row to settle before tapping it (QAA-1524)

  `tapById` does not wait, so the quick-action taps were issued as soon as the
  portfolio rendered. The row mounts after the portfolio's own data resolves, so on
  Android CI the tap could land before it existed — `No views in hierarchy found
matching ... quick-action-buy ... VISIBLE`, 3/5 nightlies.

  Each press now waits for the row's own container at 100% visibility, which proves
  the row is mounted and laid out. Anchoring the wait rather than lengthening a
  timeout or adding a retry, per `e2e/mobile/docs/add-or-update-e2e.md` rules 11 and 12.

- [#21412](https://github.com/LedgerHQ/ledger-live/pull/21412) [`3acaa6d`](https://github.com/LedgerHQ/ledger-live/commit/3acaa6d3038d086d0011100c8695724726bfa029) Thanks [@jeportie](https://github.com/jeportie)! - Make `CommonPage.successViewDetails()` fail on the app's error modal instead of waiting out its full
  60s budget on a success screen that can no longer appear. The step is shared by every mobile
  send/delegate/stake spec, and it waited on `validate-success-screen` with a bare `toBeVisible`. When
  the signing job fails, the flow renders `GenericErrorView` in place of the success screen, so the
  wait could only ever time out — and reported "success screen never appears", which hid the real
  error and mis-attributed QAA-1540 for four nightlies.

  The wait now passes `errorElementId: generic-error-modal`, the fail-fast option `waitForElement`
  already offers and that `swap.page.ts` already uses, so the failure is raised within ~1s of the
  error modal appearing and names it.

  This does not make the underlying NEAR/Stax delegate failure less frequent — see QAA-1540 for the
  30s `GeneralDmkError` it exposes.

- [#21449](https://github.com/LedgerHQ/ledger-live/pull/21449) [`b08a530`](https://github.com/LedgerHQ/ledger-live/commit/b08a5308ccad03cdfc95a8f18230a2bc13f80a55) Thanks [@jeportie](https://github.com/jeportie)! - Trim the portfolio page object comments to one line each

  The two settle helpers carried four comment blocks, 15 lines, restating the root
  cause already recorded in the QAA-1522 and QAA-1524 pull requests. Long comments
  go stale and the analysis is easier to correct where people look for it.

  The two container id fields lose their comments entirely — the field names already
  say they are containers. Each settle helper keeps one line, holding only the fact a
  future reader needs to not remove the wait, plus its ticket reference.

## 0.38.0-next.0

### Minor Changes

- [#21206](https://github.com/LedgerHQ/ledger-live/pull/21206) [`750bdd4`](https://github.com/LedgerHQ/ledger-live/commit/750bdd4bbaaf7a1c591c8a8f21479f6c64fc9c95) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add mobile E2E for the post-onboarding hub mock flow (LIVE-31323).

- [#21332](https://github.com/LedgerHQ/ledger-live/pull/21332) [`08201e0`](https://github.com/LedgerHQ/ledger-live/commit/08201e0c9e14ed5436972d544bffc7484fad3703) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): open the MAD for the new send flow on LWM

- [#21312](https://github.com/LedgerHQ/ledger-live/pull/21312) [`a6db426`](https://github.com/LedgerHQ/ledger-live/commit/a6db4268cedf2523669ba946a683e1680ea4033e) Thanks [@jeportie](https://github.com/jeportie)! - Wait for the transfer bottom sheet to settle before tapping it (QAA-1522)

  `tapById` does not wait, and `openReceiveDrawer` tapped the sheet's receive button
  immediately after asking the sheet to open. `toBeVisible()` is satisfied at 75%,
  which a bottom sheet meets while still sliding, so on Android CI the tap landed
  either on a moving view — Espresso refusing the action with `target view does not
match one or more of the following constraints` — or before the button had
  mounted at all. 3/5 nightlies, still failing in the latest.

  Each of the three sheet taps now waits for the sheet's own container
  (`transfer-drawer`) at 100% visibility, per `e2e/mobile/docs/add-or-update-e2e.md` rules 11
  and 12: anchor on the state that proves the sheet is at rest rather than adding a
  retry or lengthening a timeout.

- [#21328](https://github.com/LedgerHQ/ledger-live/pull/21328) [`e9bdc14`](https://github.com/LedgerHQ/ledger-live/commit/e9bdc141bf251f0b94cdf58024386f1842adb7c7) Thanks [@jeportie](https://github.com/jeportie)! - Wait for the portfolio balance to resolve before reading it (QAA-1523)

  `expectTotalBalanceCounterValue` read `portfolio-balance-amount` with no prior
  wait. The balance section renders a skeleton in place of that element until the
  counter values resolve, so straight after a counter-value change the element does
  not exist. `getLabelOfElement` wraps its read in `retryUntilTimeout`, which
  retries on throw — so it polled a missing element for 60s and failed with
  `❌ [retryUntilTimeout] Timed out after 60000ms`, naming neither the element nor
  the reason. 3/5 nightlies on Android.

  The assertion now waits for `portfolio-balance-normal`, which the section carries
  only once the balance is available, before reading the amount. That puts the
  budget on the step that is actually slow and separates "the balance never
  resolved" from "it resolved in the wrong currency".

- [#21313](https://github.com/LedgerHQ/ledger-live/pull/21313) [`42f8610`](https://github.com/LedgerHQ/ledger-live/commit/42f86106adef416c279d7306508d1e454311d565) Thanks [@jeportie](https://github.com/jeportie)! - Wait for the portfolio quick-action row to settle before tapping it (QAA-1524)

  `tapById` does not wait, so the quick-action taps were issued as soon as the
  portfolio rendered. The row mounts after the portfolio's own data resolves, so on
  Android CI the tap could land before it existed — `No views in hierarchy found
matching ... quick-action-buy ... VISIBLE`, 3/5 nightlies.

  Each press now waits for the row's own container at 100% visibility, which proves
  the row is mounted and laid out. Anchoring the wait rather than lengthening a
  timeout or adding a retry, per `e2e/mobile/docs/add-or-update-e2e.md` rules 11 and 12.

- [#21412](https://github.com/LedgerHQ/ledger-live/pull/21412) [`3acaa6d`](https://github.com/LedgerHQ/ledger-live/commit/3acaa6d3038d086d0011100c8695724726bfa029) Thanks [@jeportie](https://github.com/jeportie)! - Make `CommonPage.successViewDetails()` fail on the app's error modal instead of waiting out its full
  60s budget on a success screen that can no longer appear. The step is shared by every mobile
  send/delegate/stake spec, and it waited on `validate-success-screen` with a bare `toBeVisible`. When
  the signing job fails, the flow renders `GenericErrorView` in place of the success screen, so the
  wait could only ever time out — and reported "success screen never appears", which hid the real
  error and mis-attributed QAA-1540 for four nightlies.

  The wait now passes `errorElementId: generic-error-modal`, the fail-fast option `waitForElement`
  already offers and that `swap.page.ts` already uses, so the failure is raised within ~1s of the
  error modal appearing and names it.

  This does not make the underlying NEAR/Stax delegate failure less frequent — see QAA-1540 for the
  30s `GeneralDmkError` it exposes.

- [#21449](https://github.com/LedgerHQ/ledger-live/pull/21449) [`b08a530`](https://github.com/LedgerHQ/ledger-live/commit/b08a5308ccad03cdfc95a8f18230a2bc13f80a55) Thanks [@jeportie](https://github.com/jeportie)! - Trim the portfolio page object comments to one line each

  The two settle helpers carried four comment blocks, 15 lines, restating the root
  cause already recorded in the QAA-1522 and QAA-1524 pull requests. Long comments
  go stale and the analysis is easier to correct where people look for it.

  The two container id fields lose their comments entirely — the field names already
  say they are containers. Each settle helper keeps one line, holding only the fact a
  future reader needs to not remove the wait, plus its ticket reference.

## 0.37.0

### Minor Changes

- [#21331](https://github.com/LedgerHQ/ledger-live/pull/21331) [`7e9416b`](https://github.com/LedgerHQ/ledger-live/commit/7e9416b629ae3cf4cf6da97b5a50e1197a2a101c) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Remove dead code from the e2e test suites: page-object methods and locators with no callers are deleted, members used only inside their own class are made `private`, and symbols exported but only referenced in their own file lose the `export`. Two empty page classes left behind by the sweep (`portfolioEmptyState.page.ts`, `transferMenu.drawer.ts`) are removed along with their `Application` wiring.

  Also fixes `e2e/mobile/scripts/typecheck.js`, which passed the raw `tsconfig.json` to `parseJsonConfigFileContent` and so never resolved the `extends` chain. It reported 466 phantom errors on a clean tree, which hid real ones — including the `app.<page>.<method>()` calls that break at runtime with `TypeError: ... is not a function` when a page-object method is deleted while a caller in `e2e/mobile/models/` remains. It now uses `getParsedCommandLineOfConfigFile` and reports clean.

- [#20931](https://github.com/LedgerHQ/ledger-live/pull/20931) [`75711a2`](https://github.com/LedgerHQ/ledger-live/commit/75711a26b6a6e23a8ee1e9e34e3e574a08f76a95) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Split the Ledger Wallet Mobile Ledger Sync E2E test into five suites, one per Xray ticket, each
  booting the app already a member of a freshly created trustchain and destroying it afterwards. The
  mobile suite now shares the Ledger Sync CLI layer from `live-e2e-shared` instead of keeping a
  near-verbatim copy, and a `TrustchainPage` asserts trustchain contents through the CLI. On the app
  side this adds a Detox-only `importTrustchain` bridge message so a test can pre-seed the trustchain,
  and testIDs on the `TinyCard` CTA and the manage-instances row so the synchronized instances list is
  reachable from tests — the card's testID sat on a non-touchable container, so taps on it did nothing.

  Also fixes `addAccountAtIndex`, which cleared the selection whenever exactly one account was
  discovered: it tapped "deselect all" only for multiple accounts but tapped the account row
  unconditionally, and a lone account arrives already selected, so Confirm was disabled and account
  discovery timed out.

## 0.37.0-next.0

### Minor Changes

- [#21331](https://github.com/LedgerHQ/ledger-live/pull/21331) [`7e9416b`](https://github.com/LedgerHQ/ledger-live/commit/7e9416b629ae3cf4cf6da97b5a50e1197a2a101c) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Remove dead code from the e2e test suites: page-object methods and locators with no callers are deleted, members used only inside their own class are made `private`, and symbols exported but only referenced in their own file lose the `export`. Two empty page classes left behind by the sweep (`portfolioEmptyState.page.ts`, `transferMenu.drawer.ts`) are removed along with their `Application` wiring.

  Also fixes `e2e/mobile/scripts/typecheck.js`, which passed the raw `tsconfig.json` to `parseJsonConfigFileContent` and so never resolved the `extends` chain. It reported 466 phantom errors on a clean tree, which hid real ones — including the `app.<page>.<method>()` calls that break at runtime with `TypeError: ... is not a function` when a page-object method is deleted while a caller in `e2e/mobile/models/` remains. It now uses `getParsedCommandLineOfConfigFile` and reports clean.

- [#20931](https://github.com/LedgerHQ/ledger-live/pull/20931) [`75711a2`](https://github.com/LedgerHQ/ledger-live/commit/75711a26b6a6e23a8ee1e9e34e3e574a08f76a95) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Split the Ledger Wallet Mobile Ledger Sync E2E test into five suites, one per Xray ticket, each
  booting the app already a member of a freshly created trustchain and destroying it afterwards. The
  mobile suite now shares the Ledger Sync CLI layer from `live-e2e-shared` instead of keeping a
  near-verbatim copy, and a `TrustchainPage` asserts trustchain contents through the CLI. On the app
  side this adds a Detox-only `importTrustchain` bridge message so a test can pre-seed the trustchain,
  and testIDs on the `TinyCard` CTA and the manage-instances row so the synchronized instances list is
  reachable from tests — the card's testID sat on a non-touchable container, so taps on it did nothing.

  Also fixes `addAccountAtIndex`, which cleared the selection whenever exactly one account was
  discovered: it tapped "deselect all" only for multiple accounts but tapped the account row
  unconditionally, and a lone account arrives already selected, so Confirm was disabled and account
  discovery timed out.

## 0.36.0

### Minor Changes

- [#20991](https://github.com/LedgerHQ/ledger-live/pull/20991) [`3bea41d`](https://github.com/LedgerHQ/ledger-live/commit/3bea41dcb6a5ef8d26547be31dee94bc42448e46) Thanks [@jeportie](https://github.com/jeportie)! - Assert the mobile Buy/Sell handoff instead of the partner's checkout page, matching what
  `e2e/desktop` already does. The app records the `WebPTXPlayer` handoff URL in a
  `Config.DETOX`-guarded store and exposes it over the e2e bridge as `getPtxHandoff`, so the
  specs verify the provider and query parameters without ever loading Transak's or MoonPay's
  site — removing a dependency on a third party's uptime, and the ~70s per test spent waiting
  on it. Parsing lives in `libs/live-e2e-shared/src/buySellHandoff.ts` and handles the
  double-encoded URL that made `new URL()` throw, plus provider aliases such as Mercuryo's
  `mrcr`. Also fixes the sell flow asserting a minimum amount the flow never types, since it
  taps the 75% button, and makes the "Buy and sell query parameters" test actually assert
  query parameters.

- [#20964](https://github.com/LedgerHQ/ledger-live/pull/20964) [`183706d`](https://github.com/LedgerHQ/ledger-live/commit/183706d1664336ef9798e3bebc06551803fe00bd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Disable the large-screen upsell modal in E2E defaults so "Spot scams before signing" cannot cover Wallet 4.0 navigation.

- [#20992](https://github.com/LedgerHQ/ledger-live/pull/20992) [`4fc5ef0`](https://github.com/LedgerHQ/ledger-live/commit/4fc5ef09554a541cbf6a497f227df4373bb06470) Thanks [@jeportie](https://github.com/jeportie)! - Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
  every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
  summary with peak concurrency so a fan-out is legible without reading several hundred
  entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
  recorded, and no bodies or headers are captured.

- [#20959](https://github.com/LedgerHQ/ledger-live/pull/20959) [`6bbb468`](https://github.com/LedgerHQ/ledger-live/commit/6bbb4682ec313ea2d4b8fba2261a05e84386ba7d) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add the Borrow cold-start E2E test to the Ledger Wallet Mobile suite (B2CQA-6062): the portfolio
  entry point opens the Borrow live app and shows the "Introducing Crypto Loan" modal. Broadcasts
  nothing and runs on an isolated seed, so it needs no device and is safe to run in parallel.
  Verified on Android and iOS. The portfolio entry point taps the card that was scrolled into view
  rather than the CTA nested inside it — both share the same `onPress`, but only the card is
  guaranteed on screen after the scroll.

## 0.36.0-next.0

### Minor Changes

- [#20991](https://github.com/LedgerHQ/ledger-live/pull/20991) [`3bea41d`](https://github.com/LedgerHQ/ledger-live/commit/3bea41dcb6a5ef8d26547be31dee94bc42448e46) Thanks [@jeportie](https://github.com/jeportie)! - Assert the mobile Buy/Sell handoff instead of the partner's checkout page, matching what
  `e2e/desktop` already does. The app records the `WebPTXPlayer` handoff URL in a
  `Config.DETOX`-guarded store and exposes it over the e2e bridge as `getPtxHandoff`, so the
  specs verify the provider and query parameters without ever loading Transak's or MoonPay's
  site — removing a dependency on a third party's uptime, and the ~70s per test spent waiting
  on it. Parsing lives in `libs/live-e2e-shared/src/buySellHandoff.ts` and handles the
  double-encoded URL that made `new URL()` throw, plus provider aliases such as Mercuryo's
  `mrcr`. Also fixes the sell flow asserting a minimum amount the flow never types, since it
  taps the 75% button, and makes the "Buy and sell query parameters" test actually assert
  query parameters.

- [#20964](https://github.com/LedgerHQ/ledger-live/pull/20964) [`183706d`](https://github.com/LedgerHQ/ledger-live/commit/183706d1664336ef9798e3bebc06551803fe00bd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Disable the large-screen upsell modal in E2E defaults so "Spot scams before signing" cannot cover Wallet 4.0 navigation.

- [#20992](https://github.com/LedgerHQ/ledger-live/pull/20992) [`4fc5ef0`](https://github.com/LedgerHQ/ledger-live/commit/4fc5ef09554a541cbf6a497f227df4373bb06470) Thanks [@jeportie](https://github.com/jeportie)! - Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
  every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
  summary with peak concurrency so a fan-out is legible without reading several hundred
  entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
  recorded, and no bodies or headers are captured.

- [#20959](https://github.com/LedgerHQ/ledger-live/pull/20959) [`6bbb468`](https://github.com/LedgerHQ/ledger-live/commit/6bbb4682ec313ea2d4b8fba2261a05e84386ba7d) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add the Borrow cold-start E2E test to the Ledger Wallet Mobile suite (B2CQA-6062): the portfolio
  entry point opens the Borrow live app and shows the "Introducing Crypto Loan" modal. Broadcasts
  nothing and runs on an isolated seed, so it needs no device and is safe to run in parallel.
  Verified on Android and iOS. The portfolio entry point taps the card that was scrolled into view
  rather than the CTA nested inside it — both share the same `onPress`, but only the card is
  guaranteed on screen after the scroll.

## 0.35.0

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20743](https://github.com/LedgerHQ/ledger-live/pull/20743) [`ac097e6`](https://github.com/LedgerHQ/ledger-live/commit/ac097e6a452e747c4fde117da38da22e9da85ed7) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
  instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
  `visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
  call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
  count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
  used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
  probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
  suite previously only proved an element existed in the tree. On the app side, the accounts list
  scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.

- [#20716](https://github.com/LedgerHQ/ledger-live/pull/20716) [`7277426`](https://github.com/LedgerHQ/ledger-live/commit/7277426ab6387ba6faff6d06eefa1a25125f3734) Thanks [@jeportie](https://github.com/jeportie)! - Fix mobile swap cross-account warning E2E: pin the send account (Ethereum 1) so it can't collapse onto the receive account when the drawer re-orders USDT accounts by balance

- [#19909](https://github.com/LedgerHQ/ledger-live/pull/19909) [`311e79f`](https://github.com/LedgerHQ/ledger-live/commit/311e79f15f334f2a7b0499dbbfe57fa835e8b0b2) Thanks [@henri-ly](https://github.com/henri-ly)! - add new send flow tokens test, and type the amount in crypto (the step opens in fiat) by tagging
  the amount fiat/crypto toggle with a `amount-mode-toggle` testID

## 0.35.0-next.0

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20743](https://github.com/LedgerHQ/ledger-live/pull/20743) [`ac097e6`](https://github.com/LedgerHQ/ledger-live/commit/ac097e6a452e747c4fde117da38da22e9da85ed7) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
  instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
  `visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
  call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
  count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
  used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
  probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
  suite previously only proved an element existed in the tree. On the app side, the accounts list
  scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.

- [#20716](https://github.com/LedgerHQ/ledger-live/pull/20716) [`7277426`](https://github.com/LedgerHQ/ledger-live/commit/7277426ab6387ba6faff6d06eefa1a25125f3734) Thanks [@jeportie](https://github.com/jeportie)! - Fix mobile swap cross-account warning E2E: pin the send account (Ethereum 1) so it can't collapse onto the receive account when the drawer re-orders USDT accounts by balance

- [#19909](https://github.com/LedgerHQ/ledger-live/pull/19909) [`311e79f`](https://github.com/LedgerHQ/ledger-live/commit/311e79f15f334f2a7b0499dbbfe57fa835e8b0b2) Thanks [@henri-ly](https://github.com/henri-ly)! - add new send flow tokens test, and type the amount in crypto (the step opens in fiat) by tagging
  the amount fiat/crypto toggle with a `amount-mode-toggle` testID

## 0.34.0

### Minor Changes

- [#20619](https://github.com/LedgerHQ/ledger-live/pull/20619) [`0175f1f`](https://github.com/LedgerHQ/ledger-live/commit/0175f1ffab7a31fe882b3538d5a87619c331bf54) Thanks [@qperrot](https://github.com/qperrot)! - Chore: add tests for memo on the new send flow

## 0.34.0-next.0

### Minor Changes

- [#20619](https://github.com/LedgerHQ/ledger-live/pull/20619) [`0175f1f`](https://github.com/LedgerHQ/ledger-live/commit/0175f1ffab7a31fe882b3538d5a87619c331bf54) Thanks [@qperrot](https://github.com/qperrot)! - Chore: add tests for memo on the new send flow

## 0.33.0

### Minor Changes

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20273](https://github.com/LedgerHQ/ledger-live/pull/20273) [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): harmonize LWD and LWM test names for Allure reports

- [#20214](https://github.com/LedgerHQ/ledger-live/pull/20214) [`be5e007`](https://github.com/LedgerHQ/ledger-live/commit/be5e007ce64443de9a139e304f005d507dc34f0b) Thanks [@kentoforik](https://github.com/kentoforik)! - Revert temporary hardcoded HBAR to XRP swap amount workaround (LIVE-33611); provider-side minimum amount bug is now fixed.

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

## 0.33.0-next.0

### Minor Changes

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20273](https://github.com/LedgerHQ/ledger-live/pull/20273) [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): harmonize LWD and LWM test names for Allure reports

- [#20214](https://github.com/LedgerHQ/ledger-live/pull/20214) [`be5e007`](https://github.com/LedgerHQ/ledger-live/commit/be5e007ce64443de9a139e304f005d507dc34f0b) Thanks [@kentoforik](https://github.com/kentoforik)! - Revert temporary hardcoded HBAR to XRP swap amount workaround (LIVE-33611); provider-side minimum amount bug is now fixed.

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

## 0.32.0

### Minor Changes

- [#19828](https://github.com/LedgerHQ/ledger-live/pull/19828) [`f08cad1`](https://github.com/LedgerHQ/ledger-live/commit/f08cad15e523a210054d9a10f0bbb69bf42a963a) Thanks [@henri-ly](https://github.com/henri-ly)! - new send flow e2e mobile native send

## 0.32.0-next.0

### Minor Changes

- [#19828](https://github.com/LedgerHQ/ledger-live/pull/19828) [`f08cad1`](https://github.com/LedgerHQ/ledger-live/commit/f08cad15e523a210054d9a10f0bbb69bf42a963a) Thanks [@henri-ly](https://github.com/henri-ly)! - new send flow e2e mobile native send

## 0.31.0

### Minor Changes

- [#19888](https://github.com/LedgerHQ/ledger-live/pull/19888) [`f8a6ef6`](https://github.com/LedgerHQ/ledger-live/commit/f8a6ef66a6548c3d729e6db985cc05067013b962) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): hardcode the HBAR to XRP swap amount to 500 as a temporary workaround for LIVE-33611; revert once the swap "min amount for quotes" bug is fixed.

- [#19724](https://github.com/LedgerHQ/ledger-live/pull/19724) [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.

## 0.31.0-next.0

### Minor Changes

- [#19888](https://github.com/LedgerHQ/ledger-live/pull/19888) [`f8a6ef6`](https://github.com/LedgerHQ/ledger-live/commit/f8a6ef66a6548c3d729e6db985cc05067013b962) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): hardcode the HBAR to XRP swap amount to 500 as a temporary workaround for LIVE-33611; revert once the swap "min amount for quotes" bug is fixed.

- [#19724](https://github.com/LedgerHQ/ledger-live/pull/19724) [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.

## 0.30.0

### Minor Changes

- [#19393](https://github.com/LedgerHQ/ledger-live/pull/19393) [`4a9eade`](https://github.com/LedgerHQ/ledger-live/commit/4a9eade8c74c948acab3955eca83c734d13776a1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: e2e test aleo add account flow on mobile

- [#19281](https://github.com/LedgerHQ/ledger-live/pull/19281) [`35ab018`](https://github.com/LedgerHQ/ledger-live/commit/35ab0186be129e4366e9b07197c26b6c6c1b596c) Thanks [@jeportie](https://github.com/jeportie)! - Clean up Wallet 4.0 E2E feature flags: remove the shared `WALLET_40_FEATURE_FLAGS` constant and have each spec rely on the merged e2e defaults, the canonical `FF_LWM_WALLET_40_Q2` preset, or an explicit per-spec flag set. Widen the `featureFlags` init option from `PartialFeatures` to `OptionalFeatureMap`.

- [#19315](https://github.com/LedgerHQ/ledger-live/pull/19315) [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd) Thanks [@jeportie](https://github.com/jeportie)! - Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#18831](https://github.com/LedgerHQ/ledger-live/pull/18831) [`17a58a8`](https://github.com/LedgerHQ/ledger-live/commit/17a58a8589b703a956f867f8cdcddba4a7d3d867) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Wallet 4.0 asset aggregation and detail mobile E2E coverage.

## 0.30.0-next.0

### Minor Changes

- [#19393](https://github.com/LedgerHQ/ledger-live/pull/19393) [`4a9eade`](https://github.com/LedgerHQ/ledger-live/commit/4a9eade8c74c948acab3955eca83c734d13776a1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: e2e test aleo add account flow on mobile

- [#19281](https://github.com/LedgerHQ/ledger-live/pull/19281) [`35ab018`](https://github.com/LedgerHQ/ledger-live/commit/35ab0186be129e4366e9b07197c26b6c6c1b596c) Thanks [@jeportie](https://github.com/jeportie)! - Clean up Wallet 4.0 E2E feature flags: remove the shared `WALLET_40_FEATURE_FLAGS` constant and have each spec rely on the merged e2e defaults, the canonical `FF_LWM_WALLET_40_Q2` preset, or an explicit per-spec flag set. Widen the `featureFlags` init option from `PartialFeatures` to `OptionalFeatureMap`.

- [#19315](https://github.com/LedgerHQ/ledger-live/pull/19315) [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd) Thanks [@jeportie](https://github.com/jeportie)! - Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#18831](https://github.com/LedgerHQ/ledger-live/pull/18831) [`17a58a8`](https://github.com/LedgerHQ/ledger-live/commit/17a58a8589b703a956f867f8cdcddba4a7d3d867) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Wallet 4.0 asset aggregation and detail mobile E2E coverage.

## 0.29.0

### Minor Changes

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

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#19084](https://github.com/LedgerHQ/ledger-live/pull/19084) [`01034a2`](https://github.com/LedgerHQ/ledger-live/commit/01034a299c997d6696af00d28a8a485ea9e089ca) Thanks [@VicAlbr](https://github.com/VicAlbr)! - E2E Allure report overview now reflects the feature flags actually applied at runtime (e2e defaults + workflow `E2E_FEATURE_FLAGS_JSON` overrides, with JSON taking precedence), instead of Firebase-only values. FF resolution is centralised per platform via a shared `getMergedFeatureFlags()` used by both the test setup and the report teardown, so the overview and per-test data share one source of truth.

- [#18760](https://github.com/LedgerHQ/ledger-live/pull/18760) [`a286589`](https://github.com/LedgerHQ/ledger-live/commit/a286589723c65406c33b8f4a964a6d9d23cb725f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add mobile E2E coverage for Wallet 4.0 asset discoverability: stocks empty-discovery and holdings sections on the portfolio, and the global search categories and result ranking.

- [#18889](https://github.com/LedgerHQ/ledger-live/pull/18889) [`487f2f2`](https://github.com/LedgerHQ/ledger-live/commit/487f2f25505c304a71fd7a42072c3f492ea98f67) Thanks [@semeano](https://github.com/semeano)! - Disable TON E2E tests

## 0.29.0-next.0

### Minor Changes

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

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#19084](https://github.com/LedgerHQ/ledger-live/pull/19084) [`01034a2`](https://github.com/LedgerHQ/ledger-live/commit/01034a299c997d6696af00d28a8a485ea9e089ca) Thanks [@VicAlbr](https://github.com/VicAlbr)! - E2E Allure report overview now reflects the feature flags actually applied at runtime (e2e defaults + workflow `E2E_FEATURE_FLAGS_JSON` overrides, with JSON taking precedence), instead of Firebase-only values. FF resolution is centralised per platform via a shared `getMergedFeatureFlags()` used by both the test setup and the report teardown, so the overview and per-test data share one source of truth.

- [#18760](https://github.com/LedgerHQ/ledger-live/pull/18760) [`a286589`](https://github.com/LedgerHQ/ledger-live/commit/a286589723c65406c33b8f4a964a6d9d23cb725f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add mobile E2E coverage for Wallet 4.0 asset discoverability: stocks empty-discovery and holdings sections on the portfolio, and the global search categories and result ranking.

- [#18889](https://github.com/LedgerHQ/ledger-live/pull/18889) [`487f2f2`](https://github.com/LedgerHQ/ledger-live/commit/487f2f25505c304a71fd7a42072c3f492ea98f67) Thanks [@semeano](https://github.com/semeano)! - Disable TON E2E tests

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
