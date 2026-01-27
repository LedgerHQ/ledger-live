import { isCantonCurrencyBridge, type CantonCurrencyBridge } from "@ledgerhq/coin-canton";
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { urls } from "~/config/urls";
import { StepFinishFooter, StepOnboardFooter } from "../footers";
import StepFinish from "../StepFinish";
import StepOnboard from "../StepOnboard";
import TransactionConfirm from "../TransactionConfirm";
import { OnboardingConfig, StepId, TranslationKeys, UrlConfig } from "../types";

export function getCantonBridge(currency: CryptoCurrency): CantonCurrencyBridge | null {
  const bridge = getCurrencyBridge(currency);
  if (!bridge) {
    return null;
  }

  if (isCantonCurrencyBridge(bridge)) {
    return bridge;
  }
  return null;
}

const cantonTranslationKeys: TranslationKeys = {
  title: "families.canton.addAccount.onboard.title",
  reonboardTitle: "families.canton.addAccount.reonboard.title",
  init: "families.canton.addAccount.onboard.init",
  reonboardInit: "families.canton.addAccount.reonboard.init",
  success: "families.canton.addAccount.onboard.success",
  reonboardSuccess: "families.canton.addAccount.reonboard.success",
  error: "families.canton.addAccount.onboard.error",
  error429: "families.canton.addAccount.onboard.error429",
  onboarded: "families.canton.addAccount.onboard.onboarded",
  account: "families.canton.addAccount.onboard.account",
  newAccount: "families.canton.addAccount.onboard.newAccount",
  statusPrepare: "families.canton.addAccount.onboard.status.prepare",
  statusSubmit: "families.canton.addAccount.onboard.status.submit",
  statusDefault: "families.canton.addAccount.onboard.status.default",
};

const cantonUrls: UrlConfig = {
  learnMore: urls.canton.learnMore,
};

/**
 * Family-specific function to check if there are creatable Canton accounts.
 * A Canton account is creatable if it's a Canton account that is not onboarded.
 */
function hasCantonCreatableAccounts(accounts: Account[]): boolean {
  return accounts.some(account => isCantonAccount(account) && !account.cantonResources.isOnboarded);
}

export const cantonOnboardingConfig: OnboardingConfig = {
  stepComponents: {
    [StepId.ONBOARD]: StepOnboard,
    [StepId.FINISH]: StepFinish,
  },
  footerComponents: {
    [StepId.ONBOARD]: StepOnboardFooter,
    [StepId.FINISH]: StepFinishFooter,
  },
  translationKeys: cantonTranslationKeys,
  urls: cantonUrls,
  stepFlow: [StepId.ONBOARD, StepId.FINISH],
  transactionConfirmComponent: TransactionConfirm,
  hasCreatableAccounts: hasCantonCreatableAccounts,
};
