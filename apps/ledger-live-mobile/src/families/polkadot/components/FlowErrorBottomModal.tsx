import React, { useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/live-common/families/polkadot/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigationProp } from "@react-navigation/native";
import GenericErrorBottomModal from "../../../components/GenericErrorBottomModal";

type Props = {
  navigation: NavigationProp<Record<string, object | undefined>>;
  transaction?: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: (_: Transaction) => void;
  bridgeError?: Error | null;
};

const FlowErrorBottomModal = ({
  transaction,
  setTransaction,
  account,
  parentAccount,
  bridgeError,
}: Props) => {
  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);
  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    if (!transaction) return;
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);
  return (
    <GenericErrorBottomModal
      error={bridgeErr}
      onClose={onBridgeErrorRetry}
      onPrimaryPress={onBridgeErrorRetry}
    />
  );
};

export default FlowErrorBottomModal;
