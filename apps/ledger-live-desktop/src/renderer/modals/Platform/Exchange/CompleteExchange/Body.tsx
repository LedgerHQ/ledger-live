import React, { useEffect, useState } from "react";
import { Exchange } from "@ledgerhq/live-common/exchange/platform/types";
import { Operation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import { createAction as txCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import BigSpinner from "~/renderer/components/BigSpinner";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
const exchangeAction = createAction(completeExchange);
const sendAction = txCreateAction(connectApp);
const Body = ({
  data,
  onClose,
}: {
  data: {
    provider: string;
    exchange: Exchange;
    transaction: Transaction;
    binaryPayload: string;
    signature: string;
    onResult: (a: Operation) => void;
    onCancel: (a: Error) => void;
    exchangeType: number;
  };
  onClose: () => void;
}) => {
  const { onResult, onCancel, ...exchangeParams } = data;

  const { fromAccount: account, fromParentAccount: parentAccount } = exchangeParams.exchange;
  let tokenCurrency;
  if (account.type === "TokenAccount") tokenCurrency = account.token;
  const request = {
    ...exchangeParams,
  };

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState();
  const [signedOperation, setSignedOperation] = useState();
  const [error, setError] = useState();
  useEffect(() => {
    if (signedOperation) {
      broadcast(signedOperation).then(operation => {
        onResult(operation);
        onClose();
      }, setError);
    }
  }, [broadcast, onClose, onResult, signedOperation]);
  useEffect(() => {
    if (error) {
      onCancel(error);
    }
  }, [onCancel, error]);
  return (
    <ModalBody
      onClose={() => {
        onCancel(new Error("Interrupted by user"));
        onClose();
      }}
      render={() => {
        return (
          <Box alignItems={"center"} justifyContent={"center"} px={32}>
            {error ? (
              <ErrorDisplay error={error} />
            ) : signedOperation ? (
              <BigSpinner size={40} />
            ) : !transaction ? (
              <DeviceAction
                key="completeExchange"
                action={exchangeAction}
                request={request}
                onResult={({ completeExchangeResult, completeExchangeError }) => {
                  if (completeExchangeError) {
                    setError(completeExchangeError);
                  } else {
                    setTransaction(completeExchangeResult);
                  }
                }}
              />
            ) : (
              <DeviceAction
                key="sign"
                action={sendAction}
                request={{
                  tokenCurrency,
                  parentAccount,
                  account,
                  transaction,
                  appName: "Exchange",
                }}
                onResult={({ signedOperation, transactionSignError }) => {
                  if (transactionSignError) {
                    setError(transactionSignError);
                  } else {
                    setSignedOperation(signedOperation);
                  }
                }}
              />
            )}
          </Box>
        );
      }}
    />
  );
};
export default Body;
