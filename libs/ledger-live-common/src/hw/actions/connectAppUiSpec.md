# Connect App UI Spec (Legacy DeviceAction)

## Scope

This document specifies all UI states for the connect-app action built by:

- `libs/ledger-live-common/src/hw/actions/app.ts` (`createAction`, `State`, `AppState`, `mapResult`)

and rendered by:

- Desktop: `apps/ledger-live-desktop/src/renderer/components/DeviceAction/index.tsx`
- Mobile: `apps/ledger-live-mobile/src/components/DeviceAction/index.tsx`

This spec is intentionally about **screen content** (text, animations, CTAs, links, callbacks), not layout/styling.

Out of scope:

- transaction/raw/sign-message/exchange-specific views from other action families
- manager/rename/custom lockscreen/install-language dedicated action flows

## Code Sources Used

- State ownership and migration framing:
  - `libs/ledger-live-common/src/hw/actions/migration.md`
- Connect-app state and reducer:
  - `libs/ledger-live-common/src/hw/actions/app.ts`
- Connect-app event emitters:
  - `libs/ledger-live-common/src/hw/connectApp.ts`
  - `libs/ledger-live-common/src/hw/connectAppEventMapper.ts`
  - `libs/live-dmk-shared/src/device-action/ConnectApp/ConnectAppDeviceAction.ts`
  - `libs/live-dmk-shared/src/device-action/ConnectApp/deprecation.ts`
- Desktop rendering:
  - `apps/ledger-live-desktop/src/renderer/components/DeviceAction/index.tsx`
  - `apps/ledger-live-desktop/src/renderer/components/DeviceAction/rendering.tsx`
  - `apps/ledger-live-desktop/src/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen.tsx`
  - `apps/ledger-live-desktop/src/renderer/components/DeviceAction/utils.ts`
- Mobile rendering:
  - `apps/ledger-live-mobile/src/components/DeviceAction/index.tsx`
  - `apps/ledger-live-mobile/src/components/DeviceAction/rendering.tsx`
  - `apps/ledger-live-mobile/src/components/DeviceAction/Screen/DeviceDeprecationScreen.tsx`
  - `apps/ledger-live-mobile/src/components/DeviceAction/utils.ts`
  - shared helpers: `libs/ledger-live-common/src/device-action/utils.ts`

## Important Model Notes

- The connect-app reducer in `app.ts` is the real state source; Desktop/Mobile types are UI supersets.
- `app.ts` stops the stream after `requiresAppInstallation` or `error` (`takeWhile(..., true)`), so those are terminal until `onRetry`.
- `allowOpeningRequestedWording` exists in state type but is never set by `app.ts` reducer today. In practice, open-app wording comes from `requestOpenApp`.
- Success payload is produced only by `mapResult`:
  - `opened && device && !displayUpgradeWarning`
- During `inline-install`, `app.ts` rebuilds state from `getInitialState(...)`, which clears `requestOpenApp`. Desktop inline-install rendering also requires `requestOpenApp`, so this dedicated Desktop inline-install screen is effectively not reached by current connect-app reducer output.

## Renderer Precedence (State Priority)

If multiple flags are set, the first matching branch wins.

### Desktop branch order (connect-app relevant branches only)

1. Deprecation gate (`deviceDeprecationRules`)
2. Outdated app warning (`displayUpgradeWarning`)
3. Request quit app (`requestQuitApp`)
4. Inline install progress (`installingApp && requestOpenApp && request`)
5. Requires app installation (`requiresAppInstallation`)
6. Manager permission (`allowManagerRequested`)
7. Listing apps (`listingApps`)
8. Request open app (`allowOpeningRequestedWording || requestOpenApp`)
9. Wrong device for account (`inWrongDeviceForAccount`)
10. Unresponsive shortcut (`unresponsive || error instanceof TransportRaceCondition`)
11. Generic error (`!isLoading && error`)
12. Locked device (`isLocked`)
13. Connect/unlock (`!isLoading && !device`)
14. Generic loading (`isLoading || (allowOpeningGranted && !appAndVersion)`)
15. Success result/callback (`payload`)

### Mobile branch order (connect-app relevant branches only)

1. Deprecation gate (`deviceDeprecationRules`)
2. Temporary Nano S hardcoded deprecation (Aptos/Hedera rule)
3. Outdated app warning (`displayUpgradeWarning`)
4. Request quit app (`requestQuitApp`)
5. Inline install progress (`installingApp`)
6. Requires app installation (`requiresAppInstallation`)
7. Manager permission (`allowManagerRequested`)
8. Listing apps (`listingApps`)
9. Request open app (`allowOpeningRequestedWording || requestOpenApp`)
10. Wrong device for account (`inWrongDeviceForAccount`)
11. Generic error (`!isLoading && error`)
12. Connect/unlock/locked/unresponsive merged branch
13. Generic loading (`isLoading || (allowOpeningGranted && !appAndVersion)`)
14. Success callback/render (`payload`)

## State Catalog

### S00 - `deprecation.auto-skip` (No Screen)

- One-line summary: Deprecation rules are evaluated silently, and the flow continues without showing a warning screen.

- Trigger:
  - `deviceDeprecationRules` exists, but no deprecation screen is returned by the current branch logic.
  - Skip conditions come from flow/coin rules, and partially from dismissal state.
  - Platform nuance:
    - warning dismissal can skip warning screen on both Desktop and Mobile;
    - Desktop does not use dismissal to skip clear-signing in the same way Mobile does.
- Params:
  - `deviceDeprecationRules.warningScreenRules`, `.clearSigningScreenRules`, `.errorScreenRules`
  - `request`-derived `currencyName`, `currentFlow`
  - settings dismissal list (`deprecationDoNotRemind`)
- Screen content:
  - No dedicated screen.
- Behavior:
  - Renderer calls `deviceDeprecationRules.onContinue(false)` immediately when no warning/clear-signing UI is returned.
  - In error-screen-visible path, renderer first calls `onContinue(!skipErrorScreen)` and then still falls through to a final `onContinue(false)` call in current implementation.
- Sources:
  - Desktop and Mobile `DeviceAction/index.tsx` deprecation block.

### S01 - `deprecation.warning`

- One-line summary: A non-blocking deprecation warning is shown, with update, learn-more, and continue paths.

- Trigger:
  - `deviceDeprecationRules.warningScreenVisible === true`
  - warning is not skipped by rule filters/dismissal.
- Params:
  - `coinName` from request (`tokenCurrency.name` or `account.currency.name`)
  - `productName` from `modelId`
  - `date`
  - `displayClearSigningWarning` (whether clear-signing warning is next)
- Screen content:
  - Info icon.
  - Warning title and subtitle:
    - `deviceDeprecation.info.title` -> `"As of {{date}}, {{coinName}} support on {{device}}™ via Ledger Live™ will end"` (Desktop `app.json` / Mobile `common.json`, same EN text).
    - `deviceDeprecation.info.subtitle` -> `"Upgrade to a more recent Ledger device today to ensure access to all Ledger Live service providers and optimal customer support"` (Desktop `app.json` / Mobile `common.json`, same EN text).
  - Main CTA: `deviceDeprecation.update` (current EN label: `"Discover your Upgrade Program"`).
  - Secondary CTA: `Continue`.
  - Link: `Learn more`.
  - Checkbox/remember option:
    - `deviceDeprecation.info.reminder` -> `"Do not remind me again"` (Desktop `app.json` / Mobile `common.json`, same EN text).
- CTA behavior:
  - `Update`: opens localized deprecation shop URL.
  - `Learn more`: opens localized deprecation learn-more URL.
  - `Continue`:
    - if clear-signing warning must be displayed, switches to clear-signing sub-screen first;
    - otherwise calls `onContinue` -> `deviceDeprecationRules.onContinue(false)`.
  - If checkbox is checked, persists dismissal in settings for this coin.
- Sources:
  - `Screen/DeviceDeprecationScreen.tsx` (desktop/mobile)
  - deprecation routing in `DeviceAction/index.tsx` (desktop/mobile)

### S02 - `deprecation.clear-signing-warning`

- One-line summary: A clear-signing risk warning is shown before allowing the user to continue.

- Trigger:
  - `deviceDeprecationRules.clearSigningScreenVisible === true` and not skipped, or warning screen internally transitions to clear-signing.
  - Skip behavior differs by platform:
    - Desktop clear-signing skip uses flow/coin rules and local "already displayed" flag;
    - Mobile clear-signing skip uses flow/coin rules and dismissal list.
- Params:
  - `productName`, `coinName`, `date`
- Screen content:
  - Warning icon.
  - Clear-signing warning title/subtitle:
    - `deviceDeprecation.warning.title` -> `"{{device}}™ can not Clear Sign this transaction"` (Desktop `app.json` / Mobile `common.json`, same EN text).
    - `deviceDeprecation.warning.subtitle` -> `"Use any other Ledger device to verify this transaction’s details before signing. Without Clear Signing, you risk losing all your assets."` (Desktop `app.json` / Mobile `common.json`, same EN text).
  - Main CTA: `deviceDeprecation.update` (current EN label: `"Discover your Upgrade Program"`).
  - Secondary CTA: warning-specific continue label:
    - `deviceDeprecation.warning.continue` -> `"Proceed at your own risk"` (Desktop `app.json` / Mobile `common.json`, same EN text).
  - Link: `Learn more`.
  - No dismissal checkbox.
- CTA behavior:
  - `Continue` confirms and calls `deviceDeprecationRules.onContinue(false)`.
  - `Update` and `Learn more` behave like S01.
- Sources:
  - `Screen/DeviceDeprecationScreen.tsx` (desktop/mobile)
  - deprecation block in `DeviceAction/index.tsx` (desktop/mobile)

### S03 - `deprecation.blocking-error`

- One-line summary: The flow is blocked by deprecation, and the user is redirected to upgrade-oriented actions.

- Trigger (path A):
  - `deviceDeprecationRules.errorScreenVisible === true`
  - renderer calls `deviceDeprecationRules.onContinue(!skipErrorScreen)`
  - if `!skipErrorScreen`, connect-app fails with `DeviceDeprecationError`.
- Trigger (path B, mobile only):
  - temporary hardcoded Nano S + Aptos/Hedera + flow in send/receive/staking branch, gated by `llmNanoSDeprecation?.enabled`.
- Params:
  - `productName`, `coinName`.
- Screen content:
  - Error icon.
  - Blocking deprecation title/subtitle:
    - `deviceDeprecation.error.title` -> `"{{device}}™ does not support this feature"` (Desktop `app.json` / Mobile `common.json`, same EN text).
    - `deviceDeprecation.error.subtitle` -> `"Upgrade to a more recent Ledger device today to ensure access to all the latest Ledger Live features."` (Desktop `app.json` / Mobile `common.json`, same EN text).
  - CTA: `deviceDeprecation.update` (current EN label: `"Discover your Upgrade Program"`).
  - Link: `Learn more`.
  - No `Continue` CTA.
- Rendering path:
  - no warning/error deprecation UI is returned directly from the initial deprecation branch;
  - blocking screen is rendered later by the generic error branch when `DeviceDeprecationError` reaches `renderError`.
- CTA behavior:
  - `Update` opens shop URL.
  - `Learn more` opens deprecation info URL.
- Sources:
  - `ConnectAppDeviceAction.ts` (`waitForDeprecationAcknowledgment`, `DeviceDeprecationError`)
  - `connectAppEventMapper.ts` (`type: "deprecation"`)
  - error handling in Desktop/Mobile `renderError`
  - mobile temp rule in `apps/ledger-live-mobile/src/components/DeviceAction/index.tsx`

### S04 - `outdated-app-warning`

- One-line summary: The app on device is outdated, and the user can update now or continue.

- Trigger:
  - `displayUpgradeWarning === true` and `appAndVersion` exists.
- Params:
  - `appAndVersion.name`
  - `passWarning` callback.
- Screen content:
  - Warning icon.
  - Title: app outdated.
  - Description mentioning app name.
  - CTAs:
    - Desktop: `Continue`, `Open Manager`.
    - Mobile: `Open Manager`, `Continue`.
- CTA behavior:
  - `Continue`: calls `passWarning()` and lets flow continue.
  - `Open Manager`: navigates to Manager/My Ledger update path.
- Sources:
  - `renderWarningOutdated` in Desktop/Mobile `rendering.tsx`
  - branch in Desktop/Mobile `DeviceAction/index.tsx`

### S05 - `request-quit-app`

- One-line summary: The user is asked to quit the currently opened app on the Ledger.

- Trigger:
  - `requestQuitApp === true`.
- Params:
  - Device model and theme for animation.
- Screen content:
  - Quit-app device animation.
  - Text prompting user to quit current app on device.
  - No CTA in-app.
- Sources:
  - `renderRequestQuitApp` in Desktop/Mobile `rendering.tsx`
  - branch in Desktop/Mobile `DeviceAction/index.tsx`

### S06 - `inline-app-install-progress`

- One-line summary: The UI shows in-progress installation for required app dependencies on the device.

- Trigger:
  - `installingApp === true`.
  - Desktop additionally checks `requestOpenApp` and `request`.
  - Connect-app nuance: reducer case `"inline-install"` in `app.ts` currently clears `requestOpenApp`, so this Desktop branch is effectively not reached for current connect-app state transitions.
- Params:
  - `requestOpenApp` (target app name), `progress`, request context.
- Screen content:
  - Desktop:
    - when branch conditions are met, install-loading device animation;
    - title `install app {appName}`;
    - install description text;
    - progress percentage text when available.
  - Mobile:
    - generic loading spinner screen;
    - description containing app name and percentage;
    - modal lock.
- CTA behavior:
  - No screen CTA; user waits while installation progresses.
- Sources:
  - Desktop `InstallingApp` and Mobile `LoadingAppInstall`
  - `inline-install` reducer case in `app.ts`

### S07 - `requires-app-installation`

- One-line summary: Required apps are missing and the user is sent to My Ledger to install them.

- Trigger:
  - `requiresAppInstallation` is non-null.
- Params:
  - `appName`, `appNames[]`.
- Screen content:
  - Message that required app(s) are not installed (uses app list).
  - CTA `Open Manager`.
  - Desktop includes dedicated error icon/title+description.
  - Mobile uses centered explanatory text + primary CTA.
- CTA behavior:
  - Navigates to Manager/My Ledger with search query for required app(s).
- Sources:
  - `renderRequiresAppInstallation` in Desktop/Mobile `rendering.tsx`
  - `app-not-installed` reducer case in `app.ts`

### S08 - `request-manager-permission`

- One-line summary: The device asks the user to approve Ledger Manager secure connection permissions.

- Trigger:
  - `allowManagerRequested === true`.
- Params:
  - Device model/product name.
- Screen content:
  - Allow-manager device animation.
  - Text asking user to allow manager permission on device.
  - No in-app CTA.
- Sources:
  - `renderAllowManager` in Desktop/Mobile `rendering.tsx`
  - `device-permission-requested` reducer case in `app.ts`

### S09 - `listing-apps`

- One-line summary: The flow pauses while Ledger Live checks installed app dependencies.

- Trigger:
  - `listingApps === true`.
- Params:
  - none.
- Screen content:
  - Desktop: spinner/progress animation + `list apps` title and description.
  - Mobile: loading spinner + `list apps` description text from:
    - `DeviceAction.listApps` -> `"Checking App dependencies"` (Desktop `app.json` / Mobile `common.json`, same EN text).
  - No CTA.
- Sources:
  - Desktop `renderListingApps`
  - Mobile `renderLoading({ description: t("DeviceAction.listApps") })`
  - `listing-apps` reducer case in `app.ts`

### S10 - `request-open-app`

- One-line summary: The user must open the requested app on device before the flow can continue.

- Trigger:
  - `allowOpeningRequestedWording || requestOpenApp`.
- Params:
  - `wording` (currently effectively `requestOpenApp`)
  - optional `tokenCurrency` subtitle context.
- Screen content:
  - Open-app device animation.
  - Text asking user to open a specific app on device.
  - Optional token subtitle when token context exists.
  - Mobile screen includes `ModalLock` while this state is rendered.
- CTA behavior:
  - No CTA; action continues when user opens app on device.
- Sources:
  - Desktop/Mobile `renderAllowOpeningApp`
  - branch in Desktop/Mobile `DeviceAction/index.tsx`
  - `ask-open-app` reducer case in `app.ts`

### S11 - `wrong-device-for-account`

- One-line summary: The connected Ledger does not match the selected account derivation expectations.

- Trigger:
  - `inWrongDeviceForAccount` is non-null (derived address does not match account identity).
- Params:
  - computed account metadata (`accountName`), `onRetry`.
- Screen content:
  - Error view for wrong-device-for-account condition.
  - Title/description from translated error.
  - Retry-style affordance (platform error renderer specific).
- CTA behavior:
  - Retry callback (`onRetry`) reinitializes connect-app action.
- Sources:
  - derivation mismatch logic in `app.ts` (`inWrongDeviceForAccount`)
  - `renderInWrongAppForAccount` in Desktop/Mobile `rendering.tsx`

### S12 - `device-not-ready` (connect/unlock/locked family)

- One-line summary: The user must connect, unlock, or reselect a responsive device to proceed.

- Trigger variants:
  - Desktop:
    - no device connected: `!isLoading && !device`
    - locked: `isLocked === true`
  - Mobile:
    - no device connected, locked, or unresponsive are merged into one branch:
      - `(!isLoading && !device) || unresponsive || isLocked`
- Params:
  - device model/device name, optional repair/select-device callbacks.
- Screen content:
  - Desktop:
    - locked variant: dedicated locked-error content (icon, title, description, optional retry).
    - no-device variant: connect/unlock animation + connect/unlock text + troubleshooting entry when available.
  - Mobile:
    - no-device, locked, and unresponsive are merged into `ConnectYourDevice` content:
      - device animation (`enterPinCode` or `plugAndPinCode`);
      - connect/unlock/power-on text;
      - optional "use another device" external link.
- CTA behavior:
  - desktop locked may expose retry;
  - desktop no-device may expose troubleshooting action;
  - mobile may expose "use another device" link.
- Sources:
  - Desktop/Mobile `DeviceAction/index.tsx` branch conditions
  - Desktop/Mobile `ConnectYourDevice` and `renderLockedDeviceError`

### S13 - `generic-loading`

- One-line summary: A transient waiting state while connect-app progression continues in the background.

- Trigger:
  - `isLoading === true`, or
  - `allowOpeningGranted && !appAndVersion`.
- Params:
  - optional custom loading text (streaming uses other actions, not connect-app).
- Screen content:
  - Spinner/infinite loader.
  - Generic loading text:
    - `DeviceAction.loading` -> `"Loading..."` (Desktop `app.json` / Mobile `common.json`, same EN text), unless custom text is provided.
  - Mobile may include `ModalLock` in specific loading subflows.
- CTA behavior:
  - none.
- Sources:
  - `renderLoading` in Desktop/Mobile `rendering.tsx`
  - branch in Desktop/Mobile `DeviceAction/index.tsx`

### S14 - `error`

- One-line summary: An error screen is shown with recovery actions like retry, support, or update.

- Trigger:
  - `!isLoading && error` (after higher-priority branches).
  - Desktop-only shortcut: `unresponsive || error instanceof TransportRaceCondition` maps to unresponsive error content before generic `!isLoading && error`.
- Params:
  - `error`, `onRetry`, optional `managerAppName`, `currencyName`, current device.
- Screen content:
  - Error icon/title/description from translated error classes.
  - Platform-specific specialized screens for specific classes.
  - Optional helper content (support links, logs export, onboarding CTA, etc.).
- CTA behavior (depends on error class):
  - `Retry` -> `onRetry`.
  - `Open Manager` -> manager navigation.
  - `Get support` / `Learn more` external links.
  - `Export logs`.
  - onboarding/support special CTAs in dedicated components.
- Connect-app-relevant error classes reachable from emitters/mappers include:
  - `LatestFirmwareVersionRequired`
  - `UpdateYourApp`
  - `NoSuchAppOnProvider`
  - `UnsupportedFeatureError`
  - `UserRefusedOnDevice` / `UserRefusedAllowManager`
  - `DeviceDeprecationError` (through DMK deprecation path)
  - other transport or unknown errors
- Sources:
  - Desktop/Mobile `renderError` implementations
  - emitters in `connectApp.ts` and `connectAppEventMapper.ts`

### S15 - `success`

- One-line summary: Connect-app reached ready state and hands control to caller result handling.

- Trigger:
  - `mapResult` returns payload: `opened && device && !displayUpgradeWarning`.
- Params:
  - payload includes `device`, `appAndVersion`.
- Screen content:
  - No default success view in common renderer.
  - If caller provides `Result`, it is rendered.
  - If caller provides `onResult`, callback is invoked once.
  - Mobile also supports `renderOnResult`.
- Sources:
  - `mapResult` in `app.ts`
  - terminal rendering in Desktop/Mobile `DeviceAction/index.tsx`

## Connect-App State Fields With No Dedicated Screen

These fields/events affect behavior or side effects but do not map to their own screen:

- `deviceId`: persisted in identities store.
- `deviceInfo`: persisted as last-seen device info.
- `latestFirmware`: persisted alongside last-seen device info in Desktop flow; mobile `setLastSeenDeviceInfo` dispatch for this screen path does not include latest-firmware payload.
- `allowManagerGranted`: contributes to loading/opening progression.
- `listedApps`, `installQueue`, `currentAppOp`, `itemProgress`, `skippedAppOps`: internal/install bookkeeping.
- `deviceChange` / `disconnected(expected)`: mostly reset/restart control.

Sources:

- `app.ts` reducer
- Desktop/Mobile `DeviceAction/index.tsx` side-effect hooks

## Exhaustiveness Checklist

This spec covers all connect-app branches reachable from:

- reducer state in `app.ts`
- branch ordering in Desktop/Mobile `DeviceAction/index.tsx`
- render helper content in Desktop/Mobile `rendering.tsx`
- deprecation specifics in `Screen/DeviceDeprecationScreen.tsx`
- DMK deprecation flow and callback contract in `ConnectAppDeviceAction.ts`

