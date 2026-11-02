# @features/flow-account-detail-settings

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Contents of the Account Detail settings, shared by Ledger Wallet desktop and mobile. Only the
container differs per app (Lumen `Dialog` on LWD, bottom sheet / screen on LWM): each container is
a platform entry (`./web`, `./native`), while Redux and navigation stay in the apps.

## Exports

| Entry | Export | Description |
| --- | --- | --- |
| `.` | `AccountSettingsMenu` | Change name (current name on the right) · View advanced logs · Remove account from portfolio (destructive) |
| `.` | `AdvancedLogsContent` | Takes the app's formatting `locale` (not the translation language) for the sync date · derivation tip banner (when `derivationTag` is passed) · sync date · logs JSON · "Copy logs" (`@shared/clipboard`, result through `onCopied`) |
| `.` | `RemoveAccountContent` | Error spot · "Remove account?" · "Yes, remove" / "Keep" |
| `.` | `buildAdvancedLogs(input, locale)` | Pure: picks `{ xpub, index, freshAddressPath, id, blockHeight }` as pretty JSON and formats the sync date |
| `./web` | `AccountSettings` | LWD settings `Dialog` for one account: menu, change name, advanced logs and remove steps, driven by an `AccountSettingsAdapter` |
| `./native` | `AccountSettingsSheet` | LWM settings bottom sheet: menu and remove steps; change name and advanced logs are app screens opened through `onChangeName` / `onViewAdvancedLogs` |

`.` works on both platforms. Import `./web` only from web code and `./native` only from native code.

Inputs are primitives: the apps map their account to `AdvancedLogsInput` and compute the derivation
tag themselves (`getTagDerivationMode` lives in `libs/`).

## Usage

```tsx
import { AccountSettingsMenu, AdvancedLogsContent } from "@features/flow-account-detail-settings";

<AccountSettingsMenu
  accountName={accountName}
  onChangeName={openRename}
  onViewAdvancedLogs={openAdvancedLogs}
  onRemoveAccount={openRemove}
/>;

<AdvancedLogsContent
  input={{ xpub, index, freshAddressPath, id, blockHeight, lastSyncDate }}
  locale={locale}
  derivationTag={tag}
  onCopied={copied => copied && showToast()}
/>;
```

## Events

The contents tell what the user did through one optional callback, `onEvent`, and the apps decide
what to do with it (analytics). The package knows nothing about tracking.

`AccountSettings` (web) and `AccountSettingsSheet` (native) take `onEvent`, and so do the contents
they are made of (`AccountSettingsMenu`, `RemoveAccountContent`, `AdvancedLogsContent`, and
`ChangeNameContent` on web). The events (`AccountSettingsEvent`) are `changeName`,
`validateChangeName`, `viewLogs`, `copyLogs`, `viewExplorer`, `removeFromPortfolio`,
`validateRemove` and `cancelRemove`. The settings being opened is not an event: the app that opens
them knows it.

```tsx
<AccountSettings account={account} adapter={adapter} isOpen onClose={close} onEvent={onSettingsEvent} />
```

## i18n

Copy lives under `accountDetailSettings.*` in each app's English catalog (LWD `app.json`, LWM
`common.json`). The container titles ("Account settings", "Advanced logs") belong to the app
containers.
