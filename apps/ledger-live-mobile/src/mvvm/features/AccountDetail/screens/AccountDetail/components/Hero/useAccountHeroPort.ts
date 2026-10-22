import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { canReceive, isSendDisabledForFamily } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { AccountHeroAvailability, AccountHeroPort } from "@features/flow-account-detail-hero";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import {
  useAccountAssetPicker,
  type AccountAssetPickerSheetProps,
} from "LLM/components/AccountAssetPickerSheet/useAccountAssetPicker";
import { hasAnyFunds } from "@features/platform-quick-actions";
import { useAccountHeroActions } from "./useAccountHeroActions";
import { useAccountCountervalue, useAccountHeroAssets } from "./useAccountHeroAssets";
import { useAssetsByAction } from "./useAssetsByAction";

export type AccountHeroPortResult = Readonly<{
  port: AccountHeroPort;
  assetPicker: AccountAssetPickerSheetProps;
}>;

function hasAccountActivity(account: Account): boolean {
  const accounts = [account, ...(account.subAccounts ?? [])];
  return accounts.some(
    ({ operations, pendingOperations }) => operations.length > 0 || pendingOperations.length > 0,
  );
}

function useBalanceFormatter(): (value: number) => FormattedValue {
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  return useCallback(
    (value: number) =>
      formatCurrencyUnitFragment(counterValueCurrency.units[0], new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [counterValueCurrency, locale],
  );
}

export function useAccountHeroPort(account: Account): AccountHeroPortResult {
  const discreet = useSelector(discreetModeSelector);
  const formatter = useBalanceFormatter();
  const assets = useAccountHeroAssets(account);
  const countervalue = useAccountCountervalue(assets);
  const { byAction, deactivatedCurrencyIds } = useAssetsByAction(assets);
  const { pickAsset, sheetProps: assetPicker } = useAccountAssetPicker();
  const onAction = useAccountHeroActions(account, assets, byAction, pickAsset);

  const availability = useMemo(
    (): AccountHeroAvailability => ({
      isCurrencySupported: !deactivatedCurrencyIds.has(account.currency.id),
      isBuyAvailable: byAction.buy.length > 0,
      isSellAvailable: byAction.sell.length > 0,
      isSwapAvailable: byAction.swap.length > 0,
      isEarnAvailable: byAction.earn.length > 0,
      isSendSupported: !isSendDisabledForFamily(account.currency.family),
      isReceiveSupported: canReceive(account, undefined),
    }),
    [account, byAction, deactivatedCurrencyIds],
  );

  return {
    port: {
      platform: "mobile",
      balance: { countervalue, formatter, discreet, isLoading: false },
      availability,
      hasFunds: hasAnyFunds(assets),
      hasActivity: hasAccountActivity(account),
      onAction,
    },
    assetPicker,
  };
}
