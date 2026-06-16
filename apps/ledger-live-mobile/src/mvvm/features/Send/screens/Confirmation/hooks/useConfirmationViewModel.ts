import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { getConcernedOperation } from "@ledgerhq/live-common/flows/send/utils";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../../types";

export function useConfirmationViewModel() {
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { close } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const concernedOperation = useMemo(
    () => getConcernedOperation(state.operation.optimisticOperation),
    [state.operation.optimisticOperation],
  );

  const onViewTransaction = useCallback(() => {
    if (!account || !concernedOperation) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id ?? undefined,
      operation: concernedOperation,
    });
  }, [account, parentAccount, concernedOperation, navigation]);

  return {
    canViewTransaction: Boolean(account && concernedOperation),
    onViewTransaction,
    onClose: close,
  };
}
