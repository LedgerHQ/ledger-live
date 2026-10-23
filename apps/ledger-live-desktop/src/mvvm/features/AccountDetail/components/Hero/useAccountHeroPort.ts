import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { canReceive, isSendDisabledForFamily } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { AccountHeroAvailability, AccountHeroPort } from "@features/flow-account-detail-hero";
import { hasAnyFunds } from "@features/platform-quick-actions";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useAccountHeroActions } from "./useAccountHeroActions";
import { usePickAccountAsset, type AccountAssetPicker } from "./usePickAccountAsset";
import { useAccountCountervalue, useAccountHeroAssets } from "./useAccountHeroAssets";
import { useAssetsByAction } from "./useAssetsByAction";

function hasAccountActivity(account: Account): boolean {
  const accounts = [account, ...(account.subAccounts ?? [])];
  return accounts.some(
    ({ operations, pendingOperations }) => operations.length > 0 || pendingOperations.length > 0,
  );
}

function useBalanceFormatter(): AccountHeroPort["balance"]["formatter"] {
  const locale = useSelector(localeSelector);
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

export type AccountHeroPortResult = Readonly<{
  port: AccountHeroPort;
  assetPicker: AccountAssetPicker["pickerProps"];
}>;

export function useAccountHeroPort(account: Account): AccountHeroPortResult {
  const discreet = useSelector(discreetModeSelector);
  const formatter = useBalanceFormatter();
  const assets = useAccountHeroAssets(account);
  const countervalue = useAccountCountervalue(assets);
  const { byAction, deactivatedCurrencyIds } = useAssetsByAction(assets);
  const { pickAsset, pickerProps } = usePickAccountAsset();
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
      platform: "desktop",
      balance: { countervalue, formatter, discreet, isLoading: false },
      availability,
      hasFunds: hasAnyFunds(assets),
      hasActivity: hasAccountActivity(account),
      onAction,
    },
    assetPicker: pickerProps,
  };
}
