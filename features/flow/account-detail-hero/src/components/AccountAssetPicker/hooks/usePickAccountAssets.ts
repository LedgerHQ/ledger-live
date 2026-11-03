import { useCallback, useMemo } from "react";
import type {
  AccountAssetPickerProps,
  AccountAssetPickerSource,
} from "../AccountAssetPicker.types";
import { useAccountAssetPicker } from "./useAccountAssetPicker";

type Countervalue = Readonly<{ toNumber: () => number }>;

type FormatAmountOptions = Readonly<{
  locale: string;
  discreet: boolean;
  showCode: boolean;
}>;

export type PickerAsset = Readonly<{
  currency: Readonly<{
    id: string;
    name: string;
    ticker: string;
    units: readonly unknown[];
  }>;
  account: Readonly<{ balance: Countervalue }>;
}>;

export type AccountAssetPickerFormatting<T extends PickerAsset> = Readonly<{
  locale: string;
  discreet: boolean;
  counterValueUnit: T["currency"]["units"][number];
  calculateCountervalue: (
    currency: T["currency"],
    amount: T["account"]["balance"],
  ) => T["account"]["balance"] | null | undefined;
  formatAmount: (
    unit: T["currency"]["units"][number],
    amount: T["account"]["balance"],
    options: FormatAmountOptions,
  ) => string;
  testID?: string;
}>;

export function toAccountAssetPickerSources<T extends PickerAsset>(
  assets: readonly T[],
  {
    locale,
    discreet,
    counterValueUnit,
    calculateCountervalue,
    formatAmount,
  }: AccountAssetPickerFormatting<T>,
): readonly AccountAssetPickerSource<T>[] {
  const options = { locale, discreet, showCode: true };
  return assets.map(asset => {
    const countervalue = calculateCountervalue(asset.currency, asset.account.balance);
    return {
      item: asset,
      sortValue: countervalue?.toNumber() ?? 0,
      row: {
        id: asset.currency.id,
        ledgerId: asset.currency.id,
        name: asset.currency.name,
        ticker: asset.currency.ticker,
        cryptoAmount: formatAmount(asset.currency.units[0], asset.account.balance, options),
        countervalue: countervalue
          ? formatAmount(counterValueUnit, countervalue, options)
          : undefined,
      },
    };
  });
}

export function usePickAccountAssets<T extends PickerAsset>(
  formatting: AccountAssetPickerFormatting<T>,
): Readonly<{
  pickAsset: (assets: readonly T[], onPicked: (asset: T) => void) => void;
  pickerProps: AccountAssetPickerProps;
}> {
  const { locale, discreet, counterValueUnit, calculateCountervalue, formatAmount, testID } =
    formatting;

  const toSources = useCallback(
    (assets: readonly T[]) =>
      toAccountAssetPickerSources(assets, {
        locale,
        discreet,
        counterValueUnit,
        calculateCountervalue,
        formatAmount,
      }),
    [calculateCountervalue, counterValueUnit, discreet, formatAmount, locale],
  );

  const { pickAsset, pickerProps } = useAccountAssetPicker(toSources);

  const props = useMemo(
    () => (testID === undefined ? pickerProps : { ...pickerProps, testID }),
    [pickerProps, testID],
  );

  return { pickAsset, pickerProps: props };
}
