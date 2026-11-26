import { useCallback, useMemo, useRef, useState } from "react";
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
import type { ScreenName } from "~/const";
import { getTokenFirstScreen } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSelectToken>
>;

function isMatchingSearch(token: TokenCurrency, search: string) {
  return [token.name, token.ticker].some(field => field.toLowerCase().includes(search));
}

function getTokenLabel(token: TokenCurrency) {
  return `${token.name}\n${token.ticker}`.toLowerCase();
}

function getIdsSharingNameAndTicker(tokens: TokenCurrency[]): ReadonlySet<string> {
  const labelCounts = new Map<string, number>();

  for (const token of tokens) {
    const label = getTokenLabel(token);
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }

  const sharingTokens = tokens.filter(token => (labelCounts.get(getTokenLabel(token)) ?? 0) > 1);

  return new Set(sharingTokens.map(token => token.id));
}

export function useSelectTokenViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);
  const [search, setSearch] = useState("");

  const idsSharingNameAndTicker = useMemo(() => getIdsSharingNameAndTicker(options), [options]);

  const tokens = useMemo(() => {
    const query = search.trim().toLowerCase();

    return options.filter(token => isMatchingSearch(token, query));
  }, [options, search]);

  const onSelectToken = useCallback(
    (token: TokenCurrency) => {
      navigation.navigate(getTokenFirstScreen(token), { token, accountId: account.id });
    },
    [account.id, navigation],
  );

  const isClosingRef = useRef(false);
  const onClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const isListLoaded = !isLoading && !isError;

  return {
    tokens,
    idsSharingNameAndTicker,
    search,
    isLoading,
    isError,
    onClose,
    onSelectToken,
    onChangeSearch: setSearch,
    onRetry: () => void retry(),
    onEndReached: () => void loadNext?.(),
    isEmpty: isListLoaded && options.length === 0,
  };
}
