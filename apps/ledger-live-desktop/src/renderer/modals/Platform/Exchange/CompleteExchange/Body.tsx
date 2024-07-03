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
import { BodyContent, BodyContentProps } from "./BodyContent";
import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { DisabledTransactionBroadcastError } from "@ledgerhq/errors";
import { useRedirectToSwapHistory } from "~/renderer/screens/exchange/Swap2/utils";
import { getEnv } from "@ledgerhq/live-env";
import styled from "styled-components";

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

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  flex-grow: 1;
  overflow: hidden;
`;

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
      // If swap we save to swap history and keep open the drawer
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
          return onCancel(new DisabledTransactionBroadcastError());
        }
        onResult(operation);
        // else not swap i.e card and sell we close the drawer
      } else {
        onResult(operation);
        onClose?.();
      }
    },
    [
      setResult,
      onResult,
      onCancel,
      onClose,
      updateAccount,
      magnitudeAwareRate,
      provider,
      sourceCurrency,
      targetCurrency,
      swapId,
      toAccount,
    ],
  );

  useEffect(() => {
    if (error) {
      onCancel(error);
    }
  }, [onCancel, error]);

  useEffect(() => {
    if (broadcastRef.current || !signedOperation) return;
    broadcast(signedOperation)
      .then(onBroadcastSuccess, setError)
      .finally(() => (broadcastRef.current = true));
  }, [signedOperation, broadcast, onBroadcastSuccess, setError, broadcastRef]);

  return (
    <Root>
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
    </Root>
  );
};

export default Body;
