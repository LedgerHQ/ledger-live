import { useState } from "react";
import { useTokenOptions } from "@ledgerhq/live-common/families/xrp/react";
import { isMatchingTokenSearch } from "@ledgerhq/live-common/families/xrp/tokens";
import type { Account } from "@ledgerhq/types-live";
import type { AssetType } from "LLD/features/ModularDialog/types";

export function useSelectAssetViewModel(account: Account) {
  const [search, setSearch] = useState("");
  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);

  const query = search.trim().toLowerCase();
  const tokens = options.filter(token => isMatchingTokenSearch(token, query));
  const isLoaded = !isLoading && !isError;

  return {
    search,
    query,
    isLoading,
    isError,
    onChangeSearch: setSearch,
    onRetry: () => void retry(),
    onLoadNext: () => void loadNext?.(),
    findToken: (asset: AssetType) => tokens.find(token => token.id === asset.id),
    assets: tokens.map(token => ({ id: token.id, name: token.name, ticker: token.ticker })),
    hasNextPage: Boolean(loadNext),
    isEmpty: isLoaded && options.length === 0,
  };
}

export type SelectAssetViewModel = ReturnType<typeof useSelectAssetViewModel>;
