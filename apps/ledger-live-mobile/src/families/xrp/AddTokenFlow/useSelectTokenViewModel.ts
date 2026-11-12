import { useCallback, useMemo, useState } from "react";
import invariant from "invariant";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { TokenAccount } from "@ledgerhq/types-live";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { findHeldTokenAccount, getTokenFirstScreen } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";
import { useTokenOptions } from "./useTokenOptions";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSelectToken>
>;

export type TokenItem = Readonly<{ token: TokenCurrency; isHeld: boolean }>;

function isMatchingSearch(token: TokenCurrency, search: string) {
  return [token.name, token.ticker, token.contractAddress].some(field => {
    return field.toLowerCase().includes(search);
  });
}

export function useSelectTokenViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);
  const [search, setSearch] = useState("");
  const [heldTokenAccount, setHeldTokenAccount] = useState<TokenAccount>();

  const items = useMemo<TokenItem[]>(() => {
    const query = search.trim().toLowerCase();

    return options
      .filter(token => isMatchingSearch(token, query))
      .map(token => ({ token, isHeld: !!findHeldTokenAccount(account, token) }));
  }, [options, search, account]);

  const onSelectToken = useCallback(
    (token: TokenCurrency) => {
      const held = findHeldTokenAccount(account, token);
      if (held) {
        setHeldTokenAccount(held);
        return;
      }

      navigation.navigate(getTokenFirstScreen(token), { token, accountId: account.id });
    },
    [account, navigation],
  );

  const onOpenTokenPage = useCallback(() => {
    if (!heldTokenAccount) return;

    navigation.navigate(ScreenName.Account, {
      accountId: heldTokenAccount.id,
      parentId: account.id,
    });
  }, [account.id, heldTokenAccount, navigation]);

  const onDismissHeldToken = useCallback(() => setHeldTokenAccount(undefined), []);

  return {
    items,
    search,
    isLoading,
    isError,
    onSelectToken,
    onOpenTokenPage,
    onDismissHeldToken,
    onChangeSearch: setSearch,
    onRetry: () => void retry(),
    onEndReached: () => void loadNext?.(),
    isHeldTokenWarningVisible: !!heldTokenAccount,
  };
}
