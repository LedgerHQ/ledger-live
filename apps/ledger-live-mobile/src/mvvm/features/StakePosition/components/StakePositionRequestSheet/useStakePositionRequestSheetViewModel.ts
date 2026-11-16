import { useCallback, useEffect, useState, type ComponentType } from "react";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import {
  dismissStakePosition,
  settleStakePosition,
  settleStakePositionUnavailable,
  type ShownStakePositionRequest,
} from "@features/flow-stake-position";
import { useStakingDrawer } from "~/components/Stake/useStakingDrawer";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { useStakePositionAccountSync } from "../../hooks/useStakePositionAccountSync";
import type { StakePositionSheetProps } from "../../types";
import { stakePositionSheetOf } from "../../utils/stakePositionSheetOf";

export type StakePositionRequestSheetProps = Readonly<{
  request: ShownStakePositionRequest;
  isOpen: boolean;
}>;

export type StakePositionRequestSheetViewModel = Omit<StakePositionSheetProps, "account"> &
  Readonly<{
    Sheet: ComponentType<StakePositionSheetProps> | undefined;
    account: Account | undefined;
  }>;

export function useStakePositionRequestSheetViewModel({
  request,
  isOpen,
}: StakePositionRequestSheetProps): StakePositionRequestSheetViewModel {
  const storedAccount = useSelector(state =>
    accountsSelector(state).find(({ id }) => id === request.accountId),
  );
  // Kept so an account removed while the request is shown still renders its sheet, which then
  // says the position is gone.
  const [requestedAccount] = useState(storedAccount);
  const account = storedAccount ?? requestedAccount;
  const Sheet = account ? stakePositionSheetOf(account.currency.family) : undefined;
  const isSyncing = useStakePositionAccountSync(storedAccount, isOpen);

  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const openStakingDrawer = useStakingDrawer({
    navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  useEffect(() => {
    if (isOpen && !Sheet) settleStakePositionUnavailable(request.id, "notFound");
  }, [isOpen, Sheet, request.id]);

  const onEarnMore = useCallback(() => {
    if (!account) return;
    settleStakePosition(request.id, "earnMore");
    dismissStakePosition(request.id);
    void openStakingDrawer(account, undefined, account.currency.id);
  }, [account, openStakingDrawer, request.id]);

  return {
    Sheet,
    account,
    isAccountRemoved: storedAccount === undefined,
    request,
    isOpen,
    isSyncing: isSyncing && storedAccount !== undefined,
    onEarnMore,
  };
}
