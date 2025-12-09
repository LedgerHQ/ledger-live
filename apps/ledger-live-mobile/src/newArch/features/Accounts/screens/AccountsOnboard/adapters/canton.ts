import { isCantonCurrencyBridge, type CantonCurrencyBridge } from "@ledgerhq/coin-canton";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { urls } from "~/utils/urls";
import StepFinish from "../components/StepFinish";
import StepOnboard from "../components/StepOnboard";
import { StepFinishFooter, StepOnboardFooter } from "../footers";
import { OnboardingConfig, StepId, TranslationKeys, UrlConfig } from "../types";

export function getCantonBridge(
  currency: CryptoCurrency | TokenCurrency,
): CantonCurrencyBridge | null {
  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const bridge = getCurrencyBridge(cryptoCurrency);

  if (!bridge) {
    return null;
  }

  if (isCantonCurrencyBridge(bridge)) {
    return bridge;
  }
  return null;
}

export const cantonTranslationKeys: TranslationKeys = {
  title: "canton.onboard.title",
  reonboardTitle: "canton.onboard.reonboard.title",
  init: "canton.onboard.init",
  reonboardInit: "canton.onboard.reonboard.init",
  success: "canton.onboard.success",
  reonboardSuccess: "canton.onboard.reonboard.success",
  error: "canton.onboard.error",
  error429: "canton.onboard.error429",
  onboarded: "canton.onboard.onboarded",
  account: "canton.onboard.reonboard.account",
  newAccount: "canton.onboard.account",
  statusPrepare: "canton.onboard.status.prepare",
  statusSubmit: "canton.onboard.status.submit",
  statusDefault: "canton.onboard.status.default",
};

const cantonUrls: UrlConfig = {
  learnMore: urls.canton.learnMore,
};

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
};
