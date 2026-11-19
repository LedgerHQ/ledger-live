import { useCallback, useMemo, useState } from "react";
import invariant from "invariant";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { XrpAddTokenFlowParamList } from "./types";
import { useTokenOptions } from "./useTokenOptions";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSelectToken>
>;

export type TokenItem = Readonly<{ token: TokenCurrency; hasSharedTicker: boolean }>;

function isMatchingSearch(token: TokenCurrency, search: string) {
  return [token.name, token.ticker].some(field => field.toLowerCase().includes(search));
}

export function useSelectTokenViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);
  const [search, setSearch] = useState("");

  const items = useMemo<TokenItem[]>(() => {
    const query = search.trim().toLowerCase();
    const tickers = options.map(token => token.ticker);

    return options
      .filter(token => isMatchingSearch(token, query))
      .map(token => {
        const hasSharedTicker = tickers.indexOf(token.ticker) !== tickers.lastIndexOf(token.ticker);

        return { token, hasSharedTicker };
      });
  }, [options, search]);

  const onSelectToken = useCallback(
    (token: TokenCurrency) => {
      navigation.navigate(ScreenName.XrpAddTokenReview, { token, accountId: account.id });
    },
    [account.id, navigation],
  );

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const isListSettled = !isLoading && !isError;

  return {
    items,
    search,
    isLoading,
    isError,
    onClose,
    onSelectToken,
    onChangeSearch: setSearch,
    onRetry: () => void retry(),
    onEndReached: () => void loadNext?.(),
    isEmpty: isListSettled && options.length === 0,
  };
}
