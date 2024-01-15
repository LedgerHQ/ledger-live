import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/live-common/families/polkadot/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigationProp } from "@react-navigation/native";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";

type Props = {
  navigation: NavigationProp<Record<string, object | undefined>>;
  transaction?: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: (_: Transaction) => void;
  bridgeError?: Error | null;
};

const FlowErrorBottomModal = ({
  navigation,
  transaction,
  setTransaction,
  account,
  parentAccount,
  bridgeError,
}: Props) => {
  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);
  const onBridgeErrorCancel = useCallback(() => {
    const parent = navigation.getParent();
    if (parent) parent.goBack();
    setBridgeErr(null);
  }, [navigation]);
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
      footerButtons={
        <>
          <CancelButton containerStyle={styles.button} onPress={onBridgeErrorCancel} />
          <RetryButton
            containerStyle={[styles.button, styles.buttonRight]}
            onPress={onBridgeErrorRetry}
          />
        </>
      }
    />
  );
};

export default FlowErrorBottomModal;
const styles = StyleSheet.create({
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});
