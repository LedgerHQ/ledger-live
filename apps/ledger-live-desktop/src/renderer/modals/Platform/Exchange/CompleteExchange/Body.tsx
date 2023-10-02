import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Exchange, ExchangeSwap } from "@ledgerhq/live-common/exchange/platform/types";
import { Exchange as SwapExchange } from "@ledgerhq/live-common/exchange/swap/types";
import { setBroadcastTransaction } from "@ledgerhq/live-common/exchange/swap/setBroadcastTransaction";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { convertParametersToValidFormat } from "@ledgerhq/live-common/exchange/swap/webApp/index";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { BodyContent } from "./BodyContent";

export type Data = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  onResult: (a: Operation) => void;
  onCancel: (a: Error) => void;
  exchangeType: number;
  rateType?: number;
  swapId?: string;
  rate?: number;
};

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const dispatch = useDispatch();
  const { onResult, onCancel, swapId, rate, ...exchangeParams } = data;
  const { exchange, provider, transaction: transactionParams } = exchangeParams;
  const {
    fromAccount: account,
    fromParentAccount: parentAccount,
    toAccount,
  } = exchange as ExchangeSwap;
  const request = { ...exchangeParams };

  const tokenCurrency: TokenCurrency | undefined =
    account.type === "TokenAccount" ? account.token : undefined;

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();

  const signRequest = useMemo(
    () =>
      transaction
        ? {
            tokenCurrency,
            parentAccount,
            account,
            transaction,
            appName: "Exchange",
          }
        : null,
    [account, parentAccount, tokenCurrency, transaction],
  );

  useEffect(() => {
    if (error) {
      onCancel(error);
    }
  }, [onCancel, error]);

  useEffect(() => {
    if (signedOperation) {
      broadcast(signedOperation).then(operation => {
        // Save swap history
        if (swapId && rate && toAccount) {
          const { result, magnitudeAwareRate } = convertParametersToValidFormat({
            operation,
            swapId,
            fromAccount: account,
            toAccount,
            rate,
          });
          setBroadcastTransaction({
            result,
            provider,
          });
          const params = getUpdateAccountWithUpdaterParams({
            result,
            exchange: exchange as SwapExchange,
            transaction: transactionParams,
            magnitudeAwareRate,
            provider,
          });
          if (!params.length) return;
          const dispatchAction = updateAccountWithUpdater(...params);
          dispatch(dispatchAction);
        }
        onResult(operation);
        onClose?.();
      }, setError);
    }
  }, [
    account,
    dispatch,
    exchange,
    provider,
    rate,
    swapId,
    toAccount,
    transactionParams,
    broadcast,
    onClose,
    onResult,
    signedOperation,
    transaction,
  ]);

  return (
    <ModalBody
      onClose={() => {
        onCancel(new Error("Interrupted by user"));
        onClose?.();
      }}
      render={() => (
        <Box alignItems={"center"} justifyContent={"center"} px={32}>
          <BodyContent
            error={error}
            signRequest={signRequest}
            signedOperation={signedOperation}
            request={request}
            onError={setError}
            onOperationSigned={setSignedOperation}
            onTransactionComplete={setTransaction}
          />
        </Box>
      )}
    />
  );
};

export default Body;
