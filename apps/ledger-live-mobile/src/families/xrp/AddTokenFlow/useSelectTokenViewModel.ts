import { useCallback, useMemo, useState } from "react";
import invariant from "invariant";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useTokenOptions } from "@ledgerhq/live-common/families/xrp/react";
import { isMatchingTokenSearch } from "@ledgerhq/live-common/families/xrp/tokens";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import { getTokenFirstScreen } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSelectToken>
>;

export function useSelectTokenViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);
  const [search, setSearch] = useState("");

  const tokens = useMemo(() => {
    const query = search.trim().toLowerCase();

    return options.filter(token => isMatchingTokenSearch(token, query));
  }, [options, search]);

  const onSelectToken = useCallback(
    (token: TokenCurrency) => {
      navigation.navigate(getTokenFirstScreen(token), { token, accountId: account.id });
    },
    [account.id, navigation],
  );

  return {
    tokens,
    search,
    isLoading,
    isError,
    onSelectToken,
    onChangeSearch: setSearch,
    onRetry: () => void retry(),
    onEndReached: () => void loadNext?.(),
  };
}
