"use strict";

// Waivers for INTERMEDIATE_BARREL (rules.js), keyed by posix path from the repo root: the debt
// found when the check landed. The list only shrinks: a test fails on an entry whose file is gone
// or no longer intermediate.

const { INTERMEDIATE_BARREL: RULE } = require("./rules");

const INTERMEDIATE_BARREL = `TEMPORARY. ${RULE.rule}. Exit condition: ${RULE.fix}, then delete this entry.`;

/** @type {Record<string, string>} */
const INTERMEDIATE_BARREL_WAIVERS = {
  "domain/api/currency-fiat/src/fixtures/index.ts": INTERMEDIATE_BARREL,
  "domain/api/currency-token/src/fixtures/index.ts": INTERMEDIATE_BARREL,
  "domain/api/currency-token/src/internals/index.ts": INTERMEDIATE_BARREL,
  "domain/entity/client-identity/src/ids/index.ts": INTERMEDIATE_BARREL,
  "domain/entity/currency-crypto/src/currencies/index.ts": INTERMEDIATE_BARREL,
  "domain/entity/currency-fiat/src/currencies/index.ts": INTERMEDIATE_BARREL,
  "features/flow/account-detail-settings/src/components/AccountSettings/index.web.ts":
    INTERMEDIATE_BARREL,
  "features/flow/account-detail-settings/src/components/AccountSettingsDialog/index.web.ts":
    INTERMEDIATE_BARREL,
  "features/flow/account-detail-settings/src/components/AccountSettingsMenu/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/account-detail-settings/src/components/AccountSettingsSheet/index.native.ts":
    INTERMEDIATE_BARREL,
  "features/flow/account-detail-settings/src/components/AdvancedLogsContent/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/account-detail-settings/src/components/RemoveAccountContent/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/account-detail/src/components/AccountDetailLayout/index.ts": INTERMEDIATE_BARREL,
  "features/flow/app-longer-password/src/components/ChangePasswordSheet/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/app-longer-password/src/components/PasswordChangedSheet/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/app-longer-password/src/steps/LongerPassword/index.ts": INTERMEDIATE_BARREL,
  "features/flow/app-password-removal/src/components/KeepProtectionSheet/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/app-password-removal/src/steps/DeactivatePassword/index.ts": INTERMEDIATE_BARREL,
  "features/flow/app-password-setup/src/steps/ConfirmPassword/index.ts": INTERMEDIATE_BARREL,
  "features/flow/app-password-setup/src/steps/SetupPassword/index.ts": INTERMEDIATE_BARREL,
  "features/flow/app-protection-prompt/src/components/EnableProtectionSheet/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/app-protection-prompt/src/components/ProtectionEnabledSheet/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/app-protection-prompt/src/steps/ProtectionPrompt/index.ts": INTERMEDIATE_BARREL,
  "features/flow/app-unlock/src/steps/Unlock/components/ForgotPasswordSheet/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/app-unlock/src/steps/Unlock/index.ts": INTERMEDIATE_BARREL,
  "features/flow/contacts/src/analytics/index.ts": INTERMEDIATE_BARREL,
  "features/flow/contacts/src/components/ContactsButton/index.ts": INTERMEDIATE_BARREL,
  "features/flow/contacts/src/components/index.ts": INTERMEDIATE_BARREL,
  "features/flow/contacts/src/hooks/index.ts": INTERMEDIATE_BARREL,
  "features/flow/contacts/src/ledgerSync/index.ts": INTERMEDIATE_BARREL,
  "features/flow/fear-and-greed/src/components/Card/index.ts": INTERMEDIATE_BARREL,
  "features/flow/fear-and-greed/src/components/Definition/index.ts": INTERMEDIATE_BARREL,
  "features/flow/fear-and-greed/src/components/ExpandedCard/index.ts": INTERMEDIATE_BARREL,
  "features/flow/fear-and-greed/src/components/Indicator/index.ts": INTERMEDIATE_BARREL,
  "features/flow/flow-contacts-add-address/src/screens/Review/index.ts": INTERMEDIATE_BARREL,
  "features/flow/flow-contacts-add-contact/src/screens/AddContact/index.ts": INTERMEDIATE_BARREL,
  "features/flow/flow-contacts-detail/src/editDelete/index.ts": INTERMEDIATE_BARREL,
  "features/flow/flow-contacts-list/src/utils/index.ts": INTERMEDIATE_BARREL,
  "features/flow/market-banner/src/components/MarketBanner/index.ts": INTERMEDIATE_BARREL,
  "features/flow/pay-balance/src/components/ActionTiles/index.ts": INTERMEDIATE_BARREL,
  "features/flow/pay-bank-transfer/src/components/BankTransferIntro/index.ts": INTERMEDIATE_BARREL,
  "features/flow/pay-card-details/src/components/CardPrimaryAction/index.web.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-details/src/components/CardTopUp/index.native.ts": INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactionHistory/components/StatusMessage/index.native.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactionHistory/components/StatusMessage/index.web.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactions/components/Detail/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactions/components/DetailRow/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactions/components/List/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactions/components/ListItem/index.ts":
    INTERMEDIATE_BARREL,
  "features/flow/pay-card-transactions/src/CardTransactions/index.ts": INTERMEDIATE_BARREL,
  "features/flow/pay-feature-tour/src/components/FeatureTour/index.ts": INTERMEDIATE_BARREL,
  "features/platform/app-lock/src/passwordDraft/index.ts": INTERMEDIATE_BARREL,
  "features/platform/app-lock/src/PasswordField/index.ts": INTERMEDIATE_BARREL,
  "features/platform/app-lock/src/verifier/index.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/analytics/index.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactAvatar/index.native.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactAvatar/index.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactConfirmationBottomSheet/index.native.ts":
    INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactConfirmationDialog/index.ts":
    INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactNameDisclaimer/index.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactNameInput/index.native.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/components/ContactNameInput/index.ts": INTERMEDIATE_BARREL,
  "features/platform/contacts/src/contactOperations/index.ts": INTERMEDIATE_BARREL,
  "features/platform/currencies/src/fixtures/index.ts": INTERMEDIATE_BARREL,
  "features/platform/currencies/src/hooks/index.ts": INTERMEDIATE_BARREL,
  "features/platform/currencies/src/legacy/store/index.ts": INTERMEDIATE_BARREL,
  "features/platform/feature-flags/src/components/index.ts": INTERMEDIATE_BARREL,
  "features/platform/feature-flags/src/hooks/index.ts": INTERMEDIATE_BARREL,
  "features/platform/style/src/components/index.ts": INTERMEDIATE_BARREL,
  "features/platform/style/src/hoc/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/cal/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/card/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/coinmarketcap/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/countervalues/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/dada/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/push-devices/index.ts": INTERMEDIATE_BARREL,
  "shared/api-services/src/services/swap/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/data/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-coin-integration/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-engagement/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-live-devices/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-platform/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-ptx/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-recover-software/index.ts": INTERMEDIATE_BARREL,
  "shared/feature-flags/src/flags/team-wallet-xp/index.ts": INTERMEDIATE_BARREL,
  "shared/ui-info-state/src/background/index.web.ts": INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/components/index.ts": INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/components/QueuedBottomSheet/index.ts": INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/components/QueuedBottomSheetsProvider/index.ts":
    INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/contexts/BottomSheetBackgroundContext/index.ts":
    INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/contexts/BottomSheetBottomInsetContext/index.ts":
    INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/contexts/BottomSheetFooterInsetContext/index.ts":
    INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/contexts/index.ts": INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/contexts/IsInBottomSheetContext/index.ts": INTERMEDIATE_BARREL,
  "shared/ui-queued-bottom-sheet/src/hooks/index.ts": INTERMEDIATE_BARREL,
};

module.exports = { INTERMEDIATE_BARREL_WAIVERS };
