import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { CantonOnboardProgress, CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { map } from "rxjs/operators";
import { urls } from "~/utils/urls";
import StepFinish from "../components/StepFinish";
import StepOnboard from "../components/StepOnboard";
import { StepFinishFooter, StepOnboardFooter } from "../footers";
import {
  OnboardingBridge,
  OnboardingConfig,
  OnboardProgress,
  OnboardResult,
  StepId,
  TranslationKeys,
  UrlConfig,
} from "../types";

function isCantonCurrencyBridge(bridge: unknown): bridge is CantonCurrencyBridge {
  if (!bridge || typeof bridge !== "object") {
    return false;
  }

  if (!("onboardAccount" in bridge)) {
    return false;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const bridgeWithProperty = bridge as any;
  return typeof bridgeWithProperty.onboardAccount === "function";
}

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

export function createCantonOnboardingBridge(cantonBridge: CantonCurrencyBridge): OnboardingBridge {
  return {
    onboardAccount: (currency, deviceId, creatableAccount) => {
      return cantonBridge.onboardAccount(currency, deviceId, creatableAccount).pipe(
        map(
          (data: CantonOnboardProgress | CantonOnboardResult): OnboardProgress | OnboardResult => {
            if ("status" in data) {
              return { status: data.status };
            }
            if ("account" in data && "partyId" in data) {
              return {
                account: data.account,
                metadata: { partyId: data.partyId },
              };
            }
            throw new Error("Invalid Canton onboarding result");
          },
        ),
      );
    },
  };
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
