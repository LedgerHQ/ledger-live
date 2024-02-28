import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { BodyContent, BodyContentProps } from "./BodyContent";
import { getMagnitudeAwareRate } from "@ledgerhq/live-common/exchange/swap/webApp/index";
import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { NotEnoughBalance, WrongDeviceForAccount } from "@ledgerhq/errors";
import { useRedirectToSwapHistory } from "~/renderer/screens/exchange/Swap2/utils";

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

  const redirectToHistory = useRedirectToSwapHistory();
  const onViewDetails = useCallback(
    (id: string) => {
      onClose?.();
      redirectToHistory({
        swapId: id,
      });
    },
    [onClose, redirectToHistory],
  );

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

  const getCurrencyByAccount = useCallback((account: AccountLike) => {
    switch (account.type) {
      case "Account":
      case "ChildAccount":
        return account.currency;
      case "TokenAccount":
        return account.token;
      default:
        return null;
    }
  }, []);

  const sourceCurrency = useMemo(() => {
    if ("fromAccount" in exchange) {
      return getCurrencyByAccount(exchange.fromAccount);
    }
    return null;
  }, [exchange, getCurrencyByAccount]);

  const targetCurrency = useMemo(() => {
    if ("toAccount" in exchange) {
      return getCurrencyByAccount(exchange.toAccount);
    }
    return null;
  }, [exchange, getCurrencyByAccount]);

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();
  const [result, setResult] = useState<BodyContentProps["result"]>();

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

  const updateAccount = useCallback(
    (inputs: {
      magnitudeAwareRate: BigNumber;
      result: {
        operation: Operation;
        swapId: string;
      };
    }) => {
      const params = getUpdateAccountWithUpdaterParams({
        result: inputs.result,
        exchange: exchange as SwapExchange,
        transaction: transactionParams,
        magnitudeAwareRate: inputs.magnitudeAwareRate,
        provider,
      });
      if (!params.length) return;
      const dispatchAction = updateAccountWithUpdater(...params);
      dispatch(dispatchAction);
    },
    [dispatch, exchange, transactionParams, provider],
  );

  const onBroadcastSuccess = useCallback(
    (operation: Operation) => {
      // Save swap history
      if (swapId && rate && toAccount && magnitudeAwareRate && sourceCurrency && targetCurrency) {
        const newResult = {
          operation,
          swapId,
        };
        setBroadcastTransaction({
          result: newResult,
          provider,
        });
        updateAccount({
          result: newResult,
          magnitudeAwareRate,
        });
        setResult({
          swapId,
          provider,
          sourceCurrency,
          targetCurrency,
        });
      }
      onResult(operation);
    },
    [
      setResult,
      onResult,
      updateAccount,
      magnitudeAwareRate,
      provider,
      rate,
      sourceCurrency,
      targetCurrency,
      swapId,
      toAccount,
    ],
  );

  useEffect(() => {
    if (error) {
      onCancel(error);
      if (
        ![error instanceof WrongDeviceForAccount, error instanceof NotEnoughBalance].some(Boolean)
      ) {
        onClose?.();
      }
    }
  }, [onCancel, error, onClose]);

  useEffect(() => {
    if (!signedOperation) return;
    broadcast(signedOperation).then(onBroadcastSuccess, setError);
  }, [signedOperation, broadcast, onBroadcastSuccess, setError]);

  return (
    <Box alignItems={"center"} justifyContent={"center"} px={32} height={"100%"}>
      <BodyContent
        error={error}
        signRequest={signRequest}
        signedOperation={signedOperation}
        request={request}
        result={result}
        onError={setError}
        onOperationSigned={setSignedOperation}
        onTransactionComplete={setTransaction}
        onViewDetails={onViewDetails}
      />
    </Box>
  );
};

export default Body;
