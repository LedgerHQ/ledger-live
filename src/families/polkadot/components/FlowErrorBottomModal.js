import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import GenericErrorBottomModal from "../../../components/GenericErrorBottomModal";
import RetryButton from "../../../components/RetryButton";
import CancelButton from "../../../components/CancelButton";

type Props = {
  navigation: any,
  transaction?: Transaction,
  account: any,
  parentAccount: any,
  setTransaction: (t: Transaction) => void,
  bridgeError?: Error,
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
    const parent = navigation.dangerouslyGetParent();
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
          <CancelButton
            containerStyle={styles.button}
            onPress={onBridgeErrorCancel}
          />
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
