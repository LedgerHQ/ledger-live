import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { getAccountSelfTransferTarget } from "../../../utils/selfTransferTarget";
import type { SendFlowNavigationProp } from "../../../types";

export type SelfTransferSectionViewModel = Readonly<{
  target: BalanceTypeSelfTransferTarget;
  title: string;
  actionLabel: string;
  onSelfTransfer: () => void;
}> | null;

export function useSelfTransferSectionViewModel(): SelfTransferSectionViewModel {
  const { t } = useTranslation();
  const { state, recipientSearch } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

  const account = state.account.account;

  const target = useMemo(
    () => (account ? getAccountSelfTransferTarget(account, state.transaction.transaction) : null),
    [account, state.transaction.transaction],
  );

  const onSelfTransfer = useCallback(() => {
    if (!target) return;
    transaction.setRecipient({
      ...state.recipient,
      address: target.address,
      displayLabel: t(`send.newSendFlow.${target.translationKey}.label`),
      ensName: undefined,
      isSelfTransfer: true,
    });
    recipientSearch.clear();

    const { routes, index } = navigation.getState();
    if (routes[index - 1]?.name === ScreenName.SendFlowAmount) {
      navigation.goBack();
      return;
    }
    navigation.navigate(ScreenName.SendFlowAmount);
  }, [target, transaction, state.recipient, t, recipientSearch, navigation]);

  if (!target) return null;

  return {
    target,
    title: t("send.newSendFlow.recipient.selfTransfer.title"),
    actionLabel: t(`send.newSendFlow.${target.translationKey}.action`),
    onSelfTransfer,
  };
}
