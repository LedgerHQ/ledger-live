// @flow
import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/completeExchange";
import { createAction as txCreateAction } from "@ledgerhq/live-common/lib/hw/actions/transaction";
import completeExchange from "@ledgerhq/live-common/lib/exchange/platform/completeExchange";
import type {
  Account,
  Transaction,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useBroadcast } from "../../../components/useBroadcast";
import DeviceActionModal from "../../../components/DeviceActionModal";

type Result = {
  operation?: Operation,
  error?: Error,
};

export default function PlatformCompleteExchange({
  route: {
    params: { request, onResult, device },
  },
  navigation,
}: {
  navigation: *,
  route: {
    params: {
      request: {
        exchangeType: number,
        provider: string,
        exchange: {
          fromAccount: Account,
          fromParentAccount: Account,
          toAccount: Account,
          toParentAccount: Account,
        },
        transaction: Transaction,
        binaryPayload: string,
        signature: string,
        feesStrategy: string,
      },
      device: Device,
      onResult: (result: Result) => void,
    },
  },
}) {
  const {
    fromAccount: account,
    fromParentAccount: parentAccount,
  } = request.exchange;
  let tokenCurrency;
  if (account.type === "TokenAccount") tokenCurrency = account.token;

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState();
  const [signedOperation, setSignedOperation] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    if (signedOperation) {
      broadcast(signedOperation).then(operation => {
        onResult({ operation });
      }, setError);
    }
  }, [broadcast, onResult, signedOperation]);

  useEffect(() => {
    if (error) {
      onResult({ error });
    }
  }, [onResult, error]);

  return (
    <SafeAreaView style={styles.root}>
      {!transaction ? (
        <DeviceActionModal
          key="completeExchange"
          device={device}
          action={exchangeAction}
          onClose={() => navigation.pop()}
          onResult={({ completeExchangeResult, completeExchangeError }) => {
            if (completeExchangeError) {
              setError(completeExchangeError);
            } else {
              setTransaction(completeExchangeResult);
            }
          }}
          request={request}
        />
      ) : (
        <DeviceActionModal
          key="sign"
          device={device}
          action={sendAction}
          onClose={() => navigation.pop()}
          onResult={({ signedOperation, transactionSignError }) => {
            if (transactionSignError) {
              setError(transactionSignError);
            } else {
              setSignedOperation(signedOperation);
            }
          }}
          request={{
            tokenCurrency,
            parentAccount,
            account,
            transaction,
            appName: "Exchange",
          }}
        />
      )}
    </SafeAreaView>
  );
}

const exchangeAction = createAction(completeExchange);
const sendAction = txCreateAction(connectApp);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 32,
  },
});
