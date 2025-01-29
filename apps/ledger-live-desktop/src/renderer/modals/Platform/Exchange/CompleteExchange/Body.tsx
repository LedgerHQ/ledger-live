import { DisabledTransactionBroadcastError } from "@ledgerhq/errors";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { Exchange } from "@ledgerhq/live-common/exchange/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoOrTokenCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

import { useRedirectToSwapHistory } from "~/renderer/screens/exchange/Swap2/utils";
import { BodyContent } from "./BodyContent";

export enum ExchangeModeEnum {
  Sell = "sell",
  Swap = "swap",
}

export type ExchangeMode = "sell" | "swap";

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

type ResultsState = {
  mode: ExchangeMode;
  swapId?: string;
  provider: string;
  sourceCurrency: Currency;
  targetCurrency?: Currency;
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
  const toCurrency = "toCurrency" in exchange ? exchange.toCurrency : undefined;

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

  const sourceCurrency = useMemo(() => {
    if ("fromAccount" in exchange) {
      return exchange.fromCurrency;
    }
    return null;
  }, [exchange]);

  const targetCurrency = useMemo(() => {
    if (toCurrency) {
      return toCurrency;
    }
    return null;
  }, [toCurrency]);

  const mevProtected = useSelector(mevProtectionSelector);
  const broadcastConfig = useMemo(() => ({ mevProtected }), [mevProtected]);
  const broadcast = useBroadcast({ account, parentAccount, broadcastConfig });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();
  const [result, setResult] = useState<ResultsState>();

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

  const getResultByTransactionType = (
    isSwapTransaction: "" | CryptoOrTokenCurrency | null | undefined,
  ) => {
    return isSwapTransaction
      ? {
          swapId,
          mode: ExchangeModeEnum.Swap,
          provider,
          sourceCurrency: sourceCurrency as Currency,
          targetCurrency: targetCurrency as Currency,
        }
      : {
          provider,
          mode: ExchangeModeEnum.Sell,
          sourceCurrency: sourceCurrency as Currency,
        };
  };

  const handleTransactionResult = (result: ResultsState, operation: Operation) => {
    setResult(result);

    onResult(operation);
  };

  const handleSwapTransaction = (operation: Operation, result: ResultsState) => {
    const newResult = {
      operation,
      swapId: swapId as string,
    };

    updateAccount({
      result: newResult,
      magnitudeAwareRate: magnitudeAwareRate as BigNumber,
    });

    handleTransactionResult(result, operation);
  };

  const handleSellTransaction = (operation: Operation, result: ResultsState) => {
    handleTransactionResult(result, operation);
  };

  const onBroadcastSuccess = useCallback(
    (operation: Operation) => {
      const isSwapTransaction =
        swapId && toAccount && magnitudeAwareRate && sourceCurrency && targetCurrency;

      const isSellTransaction =
        (data.exchangeType === ExchangeType.SELL || data.exchangeType === ExchangeType.SELL_NG) &&
        sourceCurrency;

      const result = getResultByTransactionType(isSwapTransaction);

      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        if (!isSwapTransaction) {
          const error = new DisabledTransactionBroadcastError();
          setError(error);
          onCancel(error);
          return onClose?.();
        } else {
          return handleTransactionResult(result, operation);
        }
      }

      if (isSwapTransaction) {
        handleSwapTransaction(operation, result);
      } else if (isSellTransaction) {
        handleSellTransaction(operation, result);
      } else {
        // old platform exchange flow
        onResult(operation);
        onClose?.();
      }
    },
    // Disabling exhaustive-deps because adding handleSellTransaction and handleSwapTransaction would make it change on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      swapId,
      toAccount,
      magnitudeAwareRate,
      sourceCurrency,
      targetCurrency,
      data.exchangeType,
      updateAccount,
      provider,
      onResult,
      onCancel,
      onClose,
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
