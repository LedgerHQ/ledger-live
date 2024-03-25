import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { Exchange } from "@ledgerhq/live-common/exchange/types";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import Box from "~/renderer/components/Box";
import { BodyContent, BodyContentProps } from "./BodyContent";
import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { useRedirectToSwapHistory } from "~/renderer/screens/exchange/Swap2/utils";
import { getEnv } from "@ledgerhq/live-env";

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
  amountExpectedTo?: number;
  magnitudeAwareRate?: BigNumber;
};

export function isCompleteExchangeData(data: unknown): data is Data {
  if (data === null || typeof data !== "object") {
    return false;
  }
  return "signature" in data && "binaryPayload" in data;
}

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const dispatch = useDispatch();
  const { onResult, onCancel, swapId, magnitudeAwareRate, ...exchangeParams } = data;
  const { exchange, provider, transaction: transactionParams } = exchangeParams;

  const { fromAccount: account, fromParentAccount: parentAccount } = exchange;

  // toAccount exists only in swap mode
  const toAccount = "toAccount" in exchange ? exchange.toAccount : undefined;

  const broadcastRef = useRef(false);
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
    if (toAccount) {
      return getCurrencyByAccount(toAccount);
    }
    return null;
  }, [toAccount, getCurrencyByAccount]);

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
        exchange: exchange as ExchangeSwap,
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
      if (swapId && toAccount && magnitudeAwareRate && sourceCurrency && targetCurrency) {
        const newResult = {
          operation,
          swapId,
        };
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

        if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
          return onCancel(new UserRefusedOnDevice());
        }
      }
      onResult(operation);
    },
    [
      setResult,
      onResult,
      onCancel,
      updateAccount,
      magnitudeAwareRate,
      provider,
      sourceCurrency,
      targetCurrency,
      swapId,
      toAccount,
    ],
  );

  // useEffect(() => {
  //   /**
  //    * If we want to close the drawer automatically, we need to ensure onCancel is also called
  //    * this will gives the "control" back to live app.
  //    *
  //    * On drawer manually closed, we send an error back ("Interrupted by user")
  //    */
  //   if ([error instanceof SOME_ERROR_WE_WANT_LIVE_APP_TO_HANDLE]) {
  //     onCancel(error);
  //     onClose(error)
  //   }
  // }, [onCancel, error]);

  useEffect(() => {
    if (broadcastRef.current || !signedOperation) return;
    broadcast(signedOperation)
      .then(onBroadcastSuccess, setError)
      .finally(() => (broadcastRef.current = true));
  }, [signedOperation, broadcast, onBroadcastSuccess, setError, broadcastRef]);

  return (
    <Box alignItems={"center"} justifyContent={"center"} px={32} height={"100%"}>
      <BodyContent
        error={error}
        signRequest={signRequest}
        signedOperation={signedOperation}
        request={{ ...exchangeParams }}
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
