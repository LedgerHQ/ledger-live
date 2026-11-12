import { useCallback } from "react";
import { track } from "@shared/analytics";
import { ACCOUNT_DETAIL_EVENTS, quickActionClickedProps } from "@features/flow-account-detail";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { canReceive, isSendDisabledForFamily } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import {
  useAccountCountervalue,
  useAccountHeroStatus,
  type AccountAssetPickerProps,
  type AccountHeroPort,
} from "@features/flow-account-detail-hero";
import { useSelector } from "~/context/hooks";
import { getAccountTag } from "LLM/utils/getAccountTag";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { usePickAccountAsset } from "LLM/hooks/usePickAccountAsset";
import { useCalculateCountervalueCallback } from "~/actions/general";
import { getAccountTrackingFacts } from "../../../../utils/accountTracking";
import { useAccountHeroActions } from "./useAccountHeroActions";
import { useAccountHeroAssets } from "./useAccountHeroAssets";
import { useAssetsByAction } from "./useAssetsByAction";

export type AccountHeroPortResult = Readonly<{
  port: AccountHeroPort;
  assetPicker: AccountAssetPickerProps;
}>;

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
  const countervalue = useAccountCountervalue(assets, useCalculateCountervalueCallback());
  const { byAction, deactivatedCurrencyIds } = useAssetsByAction(assets);
  const { pickAsset, pickerProps: assetPicker } = usePickAccountAsset();
  const onAction = useAccountHeroActions(account, assets, byAction, pickAsset);
  const onOpenMore = useCallback(
    () =>
      track(
        ACCOUNT_DETAIL_EVENTS.buttonClicked,
        quickActionClickedProps(getAccountTrackingFacts(account), "More"),
      ),
    [account],
  );

  const status = useAccountHeroStatus(account, assets, byAction, {
    isCurrencySupported: !deactivatedCurrencyIds.has(account.currency.id),
    isSendSupported: !isSendDisabledForFamily(account.currency.family),
    isReceiveSupported: canReceive(account, undefined),
  });

  return {
    port: {
      platform: "mobile",
      balance: { countervalue, formatter, discreet, isLoading: false },
      tag: getAccountTag(account),
      ...status,
      onAction,
      onOpenMore,
    },
    assetPicker,
  };
}
