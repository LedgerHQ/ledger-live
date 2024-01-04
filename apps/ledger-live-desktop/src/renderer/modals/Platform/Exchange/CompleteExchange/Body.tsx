import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { Exchange } from "@ledgerhq/live-common/exchange/platform/types";
import { Exchange as SwapExchange } from "@ledgerhq/live-common/exchange/swap/types";
import { setBroadcastTransaction } from "@ledgerhq/live-common/exchange/swap/setBroadcastTransaction";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import Box from "~/renderer/components/Box";
import { BodyContent } from "./BodyContent";
import { getMagnitudeAwareRate } from "@ledgerhq/live-common/exchange/swap/webApp/index";
import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";

export type Data = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  onResult: (operation: Operation) => void;
  onCancel: (a: Error) => void;
  exchangeType: number;
  rateType?: number;
  swapId?: string;
  rate?: number;
  amountExpectedTo?: number;
};

export function isCompleteExchangeData(data: unknown): data is Data {
  if (data === null || typeof data !== "object") {
    return false;
  }
  return "signature" in data && "binaryPayload" in data;
}

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const dispatch = useDispatch();
  const { onResult, onCancel, swapId, rate, ...exchangeParams } = data;
  const { exchange, provider, transaction: transactionParams } = exchangeParams;
  const { amount } = transactionParams;
  const { fromAccount: account, fromParentAccount: parentAccount } = exchange;
  let request = { ...exchangeParams };
  let amountExpectedTo: number | undefined = undefined;
  let toAccount: AccountLike | undefined = undefined;
  let magnitudeAwareRate: BigNumber | undefined = undefined;
  if ("toAccount" in exchange) {
    toAccount = exchange.toAccount;
    if (account && toAccount && rate) {
      magnitudeAwareRate = getMagnitudeAwareRate({
        fromAccount: account,
        toAccount,
        rate,
      });
      amountExpectedTo = +amount * +magnitudeAwareRate;

      request = { ...request, amountExpectedTo };
    }
  }

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
        if (swapId && rate && toAccount && magnitudeAwareRate) {
          const result = {
            operation,
            swapId,
          };
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
    transactionParams,
    broadcast,
    onClose,
    onResult,
    signedOperation,
    transaction,
    magnitudeAwareRate,
    toAccount,
  ]);

  return (
    <Box alignItems={"center"} justifyContent={"center"} px={32} height={"100%"}>
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
  );
};

export default Body;
