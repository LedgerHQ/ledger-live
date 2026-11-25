import { useCallback, useMemo, useState } from "react";
import invariant from "invariant";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useTokenOptions } from "@ledgerhq/live-common/families/xrp/react";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSelectToken>
>;

function isMatchingSearch(token: TokenCurrency, search: string) {
  return [token.name, token.ticker].some(field => field.toLowerCase().includes(search));
}

export function useSelectTokenViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);
  const [search, setSearch] = useState("");

  const tokens = useMemo(() => {
    const query = search.trim().toLowerCase();

    return options.filter(token => isMatchingSearch(token, query));
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
    tokens,
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
