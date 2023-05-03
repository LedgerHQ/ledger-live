import React, { useEffect, useState } from "react";
import { Exchange } from "@ledgerhq/live-common/exchange/platform/types";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
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
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
const exchangeAction = createAction(completeExchange);
const sendAction = txCreateAction(connectApp);

export type Data = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  onResult: (a: Operation) => void;
  onCancel: (a: Error) => void;
  exchangeType: number;
};

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const { onResult, onCancel, ...exchangeParams } = data;

  const { fromAccount: account, fromParentAccount: parentAccount } = exchangeParams.exchange;
  let tokenCurrency: TokenCurrency | undefined;
  if (account.type === "TokenAccount") tokenCurrency = account.token;
  const request = {
    ...exchangeParams,
  };

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();
  useEffect(() => {
    if (signedOperation) {
      broadcast(signedOperation).then(operation => {
        onResult(operation);
        onClose?.();
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
        onClose?.();
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
                // TODO: the proper team should investigate why the types mismatch
                // @ts-expect-error This type is not compatible with the one expected by the action
                request={request}
                onResult={result => {
                  if ("completeExchangeError" in result) {
                    setError(result.completeExchangeError);
                  } else {
                    setTransaction(result.completeExchangeResult);
                  }
                }}
              />
            ) : (
              <DeviceAction
                key="sign"
                action={sendAction}
                // TODO: the proper team should investigate why the types mismatch
                request={{
                  tokenCurrency,
                  parentAccount,
                  account,
                  transaction,
                  appName: "Exchange",
                }}
                onResult={result => {
                  if ("transactionSignError" in result) {
                    setError(result.transactionSignError);
                  } else {
                    setSignedOperation(result.signedOperation);
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
