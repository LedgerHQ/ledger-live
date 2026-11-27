import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import {
  answerStakePositionUnavailable,
  dismissStakePosition,
  settleStakePosition,
  type ShownStakePosition,
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
  phase: ShownStakePosition["phase"];
}>;

export type StakePositionRequestSheetViewModel = Omit<StakePositionSheetProps, "account"> &
  Readonly<{
    Sheet: ComponentType<StakePositionSheetProps> | undefined;
    account: Account | undefined;
  }>;

export function useStakePositionRequestSheetViewModel({
  request,
  phase,
}: StakePositionRequestSheetProps): StakePositionRequestSheetViewModel {
  const storedAccount = useSelector(state =>
    accountsSelector(state).find(({ id }) => id === request.accountId),
  );
  // Kept so an account removed while the request is shown still renders its sheet, which then
  // says the position is gone, or lets a signed exit finish.
  const [requestedAccount] = useState(storedAccount);
  const account = storedAccount ?? requestedAccount;
  const Sheet = account ? stakePositionSheetOf(account.currency.family) : undefined;
  // A request on the device step is still unsigned: the sheet only steps aside for it.
  const isOpen = phase === "open" || phase === "signing";
  const isSyncing = useStakePositionAccountSync(storedAccount, isOpen);

  // The sheet lives above the navigators: the stake flow opens from the root navigation.
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const openStakingDrawer = useStakingDrawer({
    navigation,
    parentRoute: undefined,
    alwaysShowNoFunds: false,
  });

  useEffect(() => {
    if (isOpen && !Sheet) answerStakePositionUnavailable(request.id);
  }, [isOpen, Sheet, request.id]);

  // The Earn live app opens its own deposit flow from the answer; a wallet screen has the host do it.
  const onEarnMore = useCallback(() => {
    if (!account) return;
    settleStakePosition(request.id, "earnMore");
    dismissStakePosition(request.id);
    if (request.origin !== "earn") void openStakingDrawer(account, undefined, account.currency.id);
  }, [account, openStakingDrawer, request.id, request.origin]);

  return {
    Sheet,
    account,
    isAccountRemoved: storedAccount === undefined,
    request,
    phase,
    isSyncing: isSyncing && storedAccount !== undefined,
    onEarnMore,
  };
}
