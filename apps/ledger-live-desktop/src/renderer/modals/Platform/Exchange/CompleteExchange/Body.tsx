import { DisabledTransactionBroadcastError, MissingSwapPayloadParamaters } from "@ledgerhq/errors";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { Exchange } from "@ledgerhq/live-common/exchange/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoOrTokenCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import styled from "styled-components";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

import { useRedirectToSwapHistory } from "~/renderer/screens/exchange/Swap2/utils";
import { BodyContent } from "./BodyContent";

export enum ExchangeModeEnum {
  Sell = "sell",
  Swap = "swap",
  Fund = "fund",
}

export type ExchangeMode = "sell" | "swap" | "fund" | "legacy";

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
  refundAddress?: string;
  payoutAddress?: string;
  sponsored?: boolean;
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

function getExchangeMode({
  exchangeType,
  swapId,
  toAccount,
  magnitudeAwareRate,
  sourceCurrency,
  targetCurrency,
}: {
  exchangeType: ExchangeType;
  swapId?: string;
  toAccount?: AccountLike;
  magnitudeAwareRate?: BigNumber;
  sourceCurrency: CryptoOrTokenCurrency | null;
  targetCurrency: CryptoOrTokenCurrency | null;
}): ExchangeMode {
  if (swapId && toAccount && magnitudeAwareRate && sourceCurrency && targetCurrency) {
    return "swap";
  }

  if (
    (exchangeType === ExchangeType.SELL || exchangeType === ExchangeType.SELL_NG) &&
    sourceCurrency
  ) {
    return "sell";
  }

  if (exchangeType === ExchangeType.FUND && sourceCurrency) {
    return "fund";
  }

  return "legacy"; // Fallback for old platform exchange flow
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
  const {
    onResult,
    onCancel,
    swapId,
    magnitudeAwareRate,
    refundAddress,
    payoutAddress,
    ...exchangeParams
  } = data;
  const { exchange, provider, transaction: transactionParams, sponsored } = exchangeParams;
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
  const broadcastConfig = useMemo(
    () => ({ mevProtected, sponsored: !!sponsored }),
    [mevProtected, sponsored],
  );

  const broadcast = useBroadcast({ account, parentAccount, broadcastConfig });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();
  const [result, setResult] = useState<ResultsState>();

  useEffect(() => {
    if (data.exchangeType === ExchangeType.SWAP) {
      const missingParams = [];
      if (!refundAddress) {
        missingParams.push("refundAddress");
      }
      if (!payoutAddress) {
        missingParams.push("payoutAddress");
      }
      if (missingParams.length > 0) {
        // error message is only for DataDog not displayed to the user
        const err = new MissingSwapPayloadParamaters(
          `Partner payload issue - missing ${missingParams.join(" and ")}`,
        );
        setError(err);
      }
    }
  }, [refundAddress, payoutAddress, data.exchangeType]);

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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

  const getResultByTransactionType = (isSwapTransaction: boolean, mode: ExchangeMode) => {
    return isSwapTransaction
      ? {
          swapId,
          mode,
          provider,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          sourceCurrency: sourceCurrency as Currency,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          targetCurrency: targetCurrency as Currency,
        }
      : {
          provider,
          mode,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      swapId: swapId as string,
    };

    updateAccount({
      result: newResult,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      magnitudeAwareRate: magnitudeAwareRate as BigNumber,
    });

    handleTransactionResult(result, operation);
  };

  const onBroadcastSuccess = useCallback(
    (operation: Operation) => {
      const exchangeMode = getExchangeMode({
        exchangeType: data.exchangeType,
        swapId,
        toAccount,
        magnitudeAwareRate,
        sourceCurrency,
        targetCurrency,
      });

      const isSwapTransaction = exchangeMode === "swap";
      const isSellTransaction = exchangeMode === "sell";
      const isFundTransaction = exchangeMode === "fund";

      const result = getResultByTransactionType(isSwapTransaction, exchangeMode);

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
      } else if (isSellTransaction || isFundTransaction) {
        handleTransactionResult(result, operation);
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
