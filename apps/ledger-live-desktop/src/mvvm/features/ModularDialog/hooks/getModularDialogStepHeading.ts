import {
  getPerpsUiUseCase,
  PERPS_UI_USE_CASE,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { MODULAR_DIALOG_STEP, PAY_ACCOUNT_UI_USE_CASE, type ModularDialogStep } from "../types";

const TRANSLATION_KEYS: Record<ModularDialogStep, string> = {
  [MODULAR_DIALOG_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

export type ModularDialogStepHeading = {
  titleKey: string;
  descriptionKey?: string;
};

export function getModularDialogStepHeading(
  step: ModularDialogStep,
  uiUseCase: string | undefined,
  hasAccounts: boolean,
): ModularDialogStepHeading {
  const perpsUseCase = getPerpsUiUseCase(uiUseCase);

  if (step === MODULAR_DIALOG_STEP.ASSET_SELECTION && perpsUseCase === PERPS_UI_USE_CASE.fund) {
    return {
      titleKey: "modularAssetDrawer.selectDepositCurrencyTitle",
      descriptionKey: "modularAssetDrawer.selectDepositCurrencyDescription",
    };
  }

  if (
    step === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION &&
    perpsUseCase === PERPS_UI_USE_CASE.receive
  ) {
    return {
      titleKey: "modularAssetDrawer.selectAccountPerpsTitle",
      descriptionKey: hasAccounts
        ? "modularAssetDrawer.selectAccountPerpsDescription"
        : "modularAssetDrawer.selectAccountPerpsEmptyDescription",
    };
  }

  if (step === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION && uiUseCase === PAY_ACCOUNT_UI_USE_CASE) {
    return { titleKey: "modularAssetDrawer.selectAccountToPayFrom" };
  }

  return { titleKey: TRANSLATION_KEYS[step] };
}
