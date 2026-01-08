import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useDelegation } from "@ledgerhq/live-common/families/tezos/react";
import { TokenAccount } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/reducers/modals";
import {
  SendActionDefault,
  ReceiveActionDefault,
} from "~/renderer/screens/account/AccountActionsDefault";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
type Props = {
  account: TezosAccount | TokenAccount;
  parentAccount: TezosAccount | undefined | null;
  onClick: () => void;
};
const SendAction = ({ account, parentAccount, onClick }: Props) => {
  const delegation = useDelegation(account);
  const sendShouldWarnDelegation = delegation && delegation.sendShouldWarnDelegation;
  const openSendFlow = useOpenSendFlow();
  const onClickDecorated = useCallback(() => {
    if (sendShouldWarnDelegation) {
      openSendFlow({
        parentAccount: parentAccount ?? undefined,
        account,
        startWithWarning: sendShouldWarnDelegation,
      });
    } else {
      onClick();
    }
  }, [sendShouldWarnDelegation, openSendFlow, parentAccount, account, onClick]);
  return <SendActionDefault onClick={onClickDecorated} />;
};
const ReceiveAction = ({ account, parentAccount, onClick }: Props) => {
  const delegation = useDelegation(account);
  const dispatch = useDispatch();
  const receiveShouldWarnDelegation = delegation && delegation.receiveShouldWarnDelegation;
  const onClickDecorated = useCallback(() => {
    if (receiveShouldWarnDelegation) {
      dispatch(
        openModal("MODAL_RECEIVE", {
          parentAccount,
          account,
          startWithWarning: receiveShouldWarnDelegation,
        }),
      );
    } else {
      onClick();
    }
  }, [receiveShouldWarnDelegation, dispatch, parentAccount, account, onClick]);
  return <ReceiveActionDefault onClick={onClickDecorated} />;
};
export default {
  SendAction,
  ReceiveAction,
};
