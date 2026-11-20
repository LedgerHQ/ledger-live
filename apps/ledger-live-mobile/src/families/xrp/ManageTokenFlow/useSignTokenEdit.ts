import { useCallback, useRef } from "react";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useSignAndBroadcast } from "../components/SignAndBroadcast/useSignAndBroadcast";
import { applyTrustLineEdit } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

type Navigation = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>["navigation"];

type Props = Readonly<{
  navigation: Navigation;
  parentAccount: Account;
  tokenAccount: XrpTokenAccount;
  transaction: Transaction | null | undefined;
}>;

export function useSignTokenEdit(props: Props) {
  const { navigation, parentAccount, tokenAccount, transaction } = props;

  const exitToDetailsRef = useRef(false);

  // A sync right now would read the ledger before it validates the edit: show the signed values instead
  const patchAccount = useCallback(
    (account: Account, signedTransaction: Transaction) => {
      const edit = { limit: signedTransaction.amount, isRippling: !signedTransaction.noRipple };

      return applyTrustLineEdit(account, tokenAccount.id, edit);
    },
    [tokenAccount.id],
  );

  const onExit = useCallback(
    (operation: Operation | undefined) => {
      if (!operation) return;

      navigation.popTo(ScreenName.XrpManageTokenList, { accountId: parentAccount.id });
      if (exitToDetailsRef.current) {
        exitToDetailsRef.current = false;
        navigation.navigate(ScreenName.OperationDetails, {
          accountId: parentAccount.id,
          operation,
        });
      }
    },
    [navigation, parentAccount.id],
  );

  const signAndBroadcast = useSignAndBroadcast({
    tokenAccount,
    transaction,
    patchAccount,
    onExit,
    action: "edit",
    account: parentAccount,
  });

  const { onClose } = signAndBroadcast;

  const onViewDetails = useCallback(() => {
    exitToDetailsRef.current = true;
    onClose();
  }, [onClose]);

  return { ...signAndBroadcast, onViewDetails };
}
