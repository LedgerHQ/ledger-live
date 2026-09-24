import { MODULAR_DIALOG_STEP, type ModularDialogStep } from "../types";

type ShouldAwaitAccountAutoSkipParams = Readonly<{
  areCurrenciesFiltered: boolean | undefined;
  currencyIds: ReadonlyArray<string> | undefined;
  currentStep: ModularDialogStep;
  hasError: boolean | undefined;
  assetsSorted: ReadonlyArray<unknown> | undefined;
}>;

export function shouldAwaitAccountAutoSkip({
  areCurrenciesFiltered,
  currencyIds,
  currentStep,
  hasError,
  assetsSorted,
}: ShouldAwaitAccountAutoSkipParams): boolean {
  return (
    Boolean(areCurrenciesFiltered) &&
    currencyIds?.length === 1 &&
    currentStep === MODULAR_DIALOG_STEP.ASSET_SELECTION &&
    !hasError &&
    (assetsSorted === undefined || assetsSorted.length === 1)
  );
}
