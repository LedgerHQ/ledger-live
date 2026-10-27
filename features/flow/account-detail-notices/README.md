# @features/flow-account-detail-notices

> **Status: UNSTABLE**: API still being designed for the Account Detail page.

Notices shown on the Account Detail page, above the coin-specific family blocks: currency status
(migration, upcoming deprecation, remote custom banner), the Robinhood chain disclaimer and the
Perps account banner.

## What it owns

- `resolveAccountNotices(signals)`: the rule. Each app passes plain facts about the account
  (`AccountNoticeSignals`) and gets the notices to show, in a fixed order, so LWD and LWM show the
  same notices.
- `AccountNotices`: renders the notices with the package's own copy, as a fragment so an account
  without notices adds no space to the page. One view for both platforms: its view model
  (`useAccountNoticesViewModel`) turns each notice into a banner with `noticeContent` and
  `noticeAction`.
- `AccountStatusBanner` (web and native): the Lumen info banner used for each notice, with an
  optional "Learn more" or "Open Perps" action.

## What the apps own

Reading the signals (remote currency config, feature flags) and handling the
actions (opening a link, navigating to Perps).

## Adding a notice

A notice is a banner about the account's currency. Adding one means: a new member in the model, a
line in the rule, its copy, and the signal each app has to provide. TypeScript points at most
missing pieces: `noticeContent` switches over every notice id, so a new id without copy does not
compile.

1. **Model**: in `src/model/types.ts`, add a member to the `AccountNotice` union with its `id`, the
   values its copy needs (for example `currencyName`) and, if it has a button, an `action`
   (`LearnMoreAction` or `OpenPerpsAction`).
2. **Signal**: if the rule needs a fact it does not have yet, add it to `AccountNoticeSignals` as a
   plain value (string, boolean). Never pass an app type, a config object or a translated string;
   keep the decision in the rule.
3. **Rule**: in `src/logic/resolveAccountNotices.ts`, return the notice from a small function and
   place it in the list returned by `resolveAccountNotices`. The list order is the display order.
   Constants that identify currencies (like `ROBINHOOD_CHAIN_IDS`) live in this file.
4. **Rule tests**: in `src/logic/resolveAccountNotices.test.ts`, add the default for the new signal
   to `signals()`, a case where the notice shows, a case where it does not, and update the ordering
   test.
5. **Copy**: in `src/components/AccountNotices/noticeContent.ts`, add a `case` with literal keys
   `accountDetailNotices.<id>.title` and, optionally, `.description`. Add the English strings under
   `accountDetailNotices` in both catalogs, `apps/ledger-live-desktop/static/i18n/en/app.json` and
   `apps/ledger-live-mobile/src/locales/en/common.json`, and in `src/__tests__/i18nWrapper.tsx`.
   Remote text (like the custom banner) is passed as a value instead of a key.
6. **Action** (only for a new kind of button): add the action type to the model, its kind to
   `AccountStatusBannerAction` with a label under `accountDetailNotices.actions.<kind>`, map it in
   `noticeAction.ts`, and add a handler prop to `AccountNoticesProps`. Each app then implements the
   handler. Reuse `learnMore` whenever the button opens a link.
7. **View tests**: add a case to `AccountNotices.web.test.tsx` and `AccountNotices.native.test.tsx`
   (copy rendered, action called).
8. **Apps**: fill the new signal where each app builds `AccountNoticeSignals`, and pass any new
   handler:
   - LWM: `apps/ledger-live-mobile/src/mvvm/features/AccountDetail/screens/AccountDetail/components/FamilySection/useAccountNotices.ts`
     (config mapping in `toAccountNoticeSignals.ts`), with a case in
     `apps/ledger-live-mobile/src/mvvm/features/AccountDetail/__integrations__/accountDetailNotices.integration.test.tsx`.
   - LWD: the family section of the Account Detail page, the same way.
9. **Checks**, from the package folder: `tsc --noEmit -p tsconfig.web.json`, the same for
   `tsconfig.native.json` and `tsconfig.test.json` with the repo-root `tsc`, `jest`,
   `pnpm unimported`; from the repo root: `node tools/nx-plugins/enforce-i18n-keys/validate.js`
   and `node tools/nx-plugins/enforce-package-structure/validate.js features/flow/account-detail-notices`.
