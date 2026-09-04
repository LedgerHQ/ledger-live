import { useMemo } from "react";
import VersionNumber from "react-native-version-number";
import useEnv from "@features/platform-env";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  useStablecoinTickers,
  useDefaultStablecoins,
  type DefaultStablecoin,
} from "@features/platform-aggregated-assets";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import {
  buildStablecoinHoldings,
  type HeldAccount,
  type StablecoinItem,
} from "@features/flow-pay-balance";
import { useDistribution } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

export type PayStablecoins = Readonly<{
  stablecoins: StablecoinItem[];
  defaultStablecoins: DefaultStablecoin[];
  isLoading: boolean;
  isError: boolean;
}>;

function toHeldAccount(account: AccountLike): HeldAccount {
  const currency = getAccountCurrency(account);
  return {
    type: account.type,
    balance: account.balance.toNumber(),
    currency: {
      id: currency.id,
      name: currency.name,
      ticker: currency.ticker,
      units: currency.units.map(unit => ({
        name: unit.name,
        code: unit.code,
        magnitude: unit.magnitude,
      })),
    },
  };
}

export function usePayStablecoins(): PayStablecoins {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const heldAccounts = useSelector(flattenAccountsSelector);
  const version = VersionNumber.appVersion ?? "";

  // groupBy: "asset" aggregates each ticker across chains into one row.
  // This path does not read the aggregatedAssets wallet flag.
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: "asset",
  });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("llm", version);

  const {
    defaultStablecoins,
    isLoading: isLoadingDefaultStablecoins,
    isError: isDefaultStablecoinsError,
  } = useDefaultStablecoins("llm", version);

  const { stablecoins: catalogStablecoins } = useCategorizedAssets(distribution, stablecoinTickers);

  const stablecoins = useMemo(
    () =>
      buildStablecoinHoldings({
        catalog: catalogStablecoins,
        heldAccounts: heldAccounts.map(toHeldAccount),
        blacklistedTokenIds,
        stablecoinTickers,
        isLoadingStablecoinTickers,
      }),
    [
      catalogStablecoins,
      heldAccounts,
      blacklistedTokenIds,
      stablecoinTickers,
      isLoadingStablecoinTickers,
    ],
  );

  return {
    stablecoins,
    defaultStablecoins,
    isLoading: isLoadingStablecoinTickers || isLoadingDefaultStablecoins || distribution.isLoading,
    isError: isStablecoinTickersError || isDefaultStablecoinsError,
  };
}
