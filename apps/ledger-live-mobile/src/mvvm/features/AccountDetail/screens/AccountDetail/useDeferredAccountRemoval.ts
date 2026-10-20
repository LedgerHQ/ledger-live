import { useCallback, useContext, useEffect, useRef } from "react";
import {
  NavigationContainerRefContext,
  useNavigation,
  type NavigationState,
} from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { deleteAccount } from "~/actions/accounts";
import { pruneAccountRoutes } from "../../utils/pruneAccountRoutes";

export function useDeferredAccountRemoval(account: Account | undefined) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const container = useContext(NavigationContainerRefContext);
  const accountToDeleteOnUnmount = useRef<Account | undefined>(undefined);

  useEffect(
    () => () => {
      if (accountToDeleteOnUnmount.current)
        dispatch(deleteAccount(accountToDeleteOnUnmount.current));
    },
    [dispatch],
  );

  return useCallback(() => {
    if (!account) return;
    accountToDeleteOnUnmount.current = account;
    const rootState = container?.getRootState();
    const prunedState = rootState && pruneAccountRoutes<NavigationState>(rootState, account.id);
    if (container && prunedState && prunedState !== rootState) {
      container.resetRoot(prunedState);
      return;
    }
    navigation.goBack();
  }, [account, container, navigation]);
}
