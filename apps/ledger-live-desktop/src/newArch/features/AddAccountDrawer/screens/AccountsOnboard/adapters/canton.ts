import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { CantonOnboardProgress, CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { map } from "rxjs/operators";
import { urls } from "~/config/urls";
import { StepFinishFooter, StepOnboardFooter } from "../footers";
import StepFinish from "../StepFinish";
import StepOnboard from "../StepOnboard";
import TransactionConfirm from "../TransactionConfirm";
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

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const bridgeWithProperty = bridge as { onboardAccount: unknown };
  return typeof bridgeWithProperty.onboardAccount === "function";
}

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
};
