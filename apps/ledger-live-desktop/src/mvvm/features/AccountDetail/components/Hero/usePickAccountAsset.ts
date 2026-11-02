import { useCallback, useMemo, useState } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { sortAssetsByValue } from "@features/platform-quick-actions";
import type {
  AccountAssetPickerProps,
  AccountAssetPickerRow,
} from "@features/flow-account-detail-hero";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import type { AccountAsset } from "./types";

export type PickAccountAsset = (
  assets: readonly AccountAsset[],
  onPicked: (asset: AccountAsset) => void,
) => void;

type Pending = Readonly<{
  assets: readonly AccountAsset[];
  onPicked: (asset: AccountAsset) => void;
}>;

export type AccountAssetPicker = Readonly<{
  pickAsset: PickAccountAsset;
  pickerProps: AccountAssetPickerProps;
}>;

function useAssetRows(assets: readonly AccountAsset[]): readonly AccountAssetPickerRow[] {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueUnit = useSelector(counterValueCurrencySelector).units[0];
  const calculateCountervalue = useCalculateCountervalueCallback();

  return useMemo(() => {
    const options = { locale, discreet, showCode: true };
    const rows = assets.map(({ currency, account }) => {
      const countervalue = calculateCountervalue(currency, account.balance);
      return {
        value: countervalue?.toNumber() ?? 0,
        row: {
          id: currency.id,
          ledgerId: currency.id,
          name: currency.name,
          ticker: currency.ticker,
          cryptoAmount: formatCurrencyUnit(currency.units[0], account.balance, options),
          countervalue: countervalue
            ? formatCurrencyUnit(counterValueUnit, countervalue, options)
            : undefined,
        },
      };
    });
    return sortAssetsByValue(rows, ({ value }) => value).map(({ row }) => row);
  }, [assets, calculateCountervalue, counterValueUnit, discreet, locale]);
}

export function usePickAccountAsset(): AccountAssetPicker {
  const [pending, setPending] = useState<Pending>();
  const rows = useAssetRows(pending?.assets ?? []);

  const pickAsset = useCallback<PickAccountAsset>((assets, onPicked) => {
    if (assets.length === 1) {
      onPicked(assets[0]);
      return;
    }
    if (assets.length > 1) setPending({ assets, onPicked });
  }, []);

  const onClose = useCallback(() => setPending(undefined), []);

  const onSelect = useCallback(
    (id: string) => {
      const picked = pending?.assets.find(({ currency }) => currency.id === id);
      setPending(undefined);
      if (picked) pending?.onPicked(picked);
    },
    [pending],
  );

  return {
    pickAsset,
    pickerProps: {
      open: pending !== undefined,
      rows,
      onSelect,
      onClose,
      testID: "account-detail-asset-picker",
    },
  };
}
