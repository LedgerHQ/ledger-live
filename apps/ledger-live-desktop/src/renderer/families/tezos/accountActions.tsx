import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useDelegation } from "@ledgerhq/live-common/families/tezos/bakers";
import { SubAccount } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import {
  SendActionDefault,
  ReceiveActionDefault,
} from "~/renderer/screens/account/AccountActionsDefault";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
type Props = {
  account: TezosAccount | SubAccount;
  parentAccount: TezosAccount | undefined | null;
  onClick: () => void;
};
const SendAction = ({ account, parentAccount, onClick }: Props) => {
  const delegation = useDelegation(account);
  const dispatch = useDispatch();
  const sendShouldWarnDelegation = delegation && delegation.sendShouldWarnDelegation;
  const onClickDecorated = useCallback(() => {
    if (sendShouldWarnDelegation) {
      dispatch(
        openModal("MODAL_SEND", {
          parentAccount,
          account,
          startWithWarning: sendShouldWarnDelegation,
        }),
      );
    } else {
      onClick();
    }
  }, [sendShouldWarnDelegation, dispatch, parentAccount, account, onClick]);
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
