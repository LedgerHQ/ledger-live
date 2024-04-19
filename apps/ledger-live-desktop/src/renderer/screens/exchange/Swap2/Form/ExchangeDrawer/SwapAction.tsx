import { getEnv } from "@ledgerhq/live-env";
import {
  ExchangeSwap,
  ExchangeRate,
  InitSwapResult,
  SwapTransaction,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/hw/actions/initSwap";
import { createAction as transactionCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";
import Text from "~/renderer/components/Text";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import initSwap from "@ledgerhq/live-common/exchange/swap/initSwap";
import { Device } from "@ledgerhq/types-devices";
import { BigNumber } from "bignumber.js";

const transactionAction = transactionCreateAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
const initAction = initSwapCreateAction(
  getEnv("MOCK") ? mockedEventEmitter : connectApp,
  getEnv("MOCK") ? mockedEventEmitter : initSwap,
);

const TransactionResult = (
  props:
    | { signedOperation: SignedOperation; device?: Device; swapId?: string | undefined }
    | { transactionSignError?: Error },
) => {
  if (!("signedOperation" in props) || !props.signedOperation) return null;
  return (
    <Box
      alignItems={"center"}
      justifyContent={"center"}
      flex={1}
      style={{
        gap: "28px",
      }}
    >
      <BigSpinner size={40} />
      <Text ff="Inter|SemiBold" fontSize={5}>
        <Trans i18nKey="send.steps.confirmation.pending.title" />
      </Text>
    </Box>
  );
};

type Props = {
  swapTransaction: SwapTransactionType;
  exchangeRate: ExchangeRate;
  onCompletion: (a: {
    operation: Operation;
    swapId: string;
    magnitudeAwareRate: BigNumber;
  }) => void;
  onError: (a: { error: Error; swapId?: string }) => void;
};

export default function SwapAction({
  swapTransaction,
  exchangeRate,
  onCompletion,
  onError,
}: Props) {
  const [initData, setInitData] = useState<InitSwapResult | null>(null);
  const [signedOperation, setSignedOperation] = useState<SignedOperation | null>(null);
  const device = useSelector(getCurrentDevice);
  const deviceRef = useRef(device);
  const { account: fromAccount, parentAccount: fromParentAccount } = swapTransaction.swap.from;
  const { account: toAccount, parentAccount: toParentAccount } = swapTransaction.swap.to;
  const { transaction, status } = swapTransaction;
  const tokenCurrency =
    fromAccount && fromAccount.type === "TokenAccount" ? fromAccount.token : null;

  const broadcast = useBroadcast({
    account: fromAccount,
    parentAccount: fromParentAccount,
  });

  const exchange = useMemo(
    () => ({
      fromParentAccount,
      fromAccount,
      toParentAccount,
      toAccount,
    }),
    [fromAccount, fromParentAccount, toAccount, toParentAccount],
  );

  useEffect(() => {
    if (initData && signedOperation) {
      const { swapId, magnitudeAwareRate } = initData;
      broadcast(signedOperation).then(
        operation => {
          onCompletion({
            operation,
            swapId,
            magnitudeAwareRate,
          });
        },
        error => {
          onError({
            error,
            swapId,
          });
        },
      );
    }
  }, [broadcast, onCompletion, onError, initData, signedOperation]);

  const request = useMemo(
    () => ({
      exchange: exchange as ExchangeSwap,
      exchangeRate,
      transaction: transaction as SwapTransaction,
      status,
      device: deviceRef,
    }),
    [exchange, exchangeRate, status, transaction],
  );

  const signRequest = useMemo(
    () => ({
      tokenCurrency,
      parentAccount: fromParentAccount,
      account: fromAccount!,
      transaction: initData?.transaction,
      appName: "Exchange",
    }),
    [fromAccount, fromParentAccount, initData?.transaction, tokenCurrency],
  );

  return !initData || !transaction ? (
    <DeviceAction
      key={"initSwap"}
      action={initAction}
      request={request}
      onResult={result => {
        if ("initSwapError" in result && result.initSwapError) {
          onError({
            error: result.initSwapError,
            swapId: result.swapId,
          });
        } else if ("initSwapResult" in result) {
          setInitData(result.initSwapResult);
        }
      }}
      analyticsPropertyFlow="swap"
    />
  ) : !signedOperation ? (
    <DeviceAction
      key={"send"}
      action={transactionAction}
      // @ts-expect-error This type is not compatible with the one expected by the action
      request={signRequest}
      Result={TransactionResult}
      onResult={result => {
        if ("transactionSignError" in result) {
          onError({
            error: result.transactionSignError,
            swapId: initData.swapId,
          });
        } else {
          setSignedOperation(result.signedOperation);
        }
      }}
      analyticsPropertyFlow="swap"
    />
  ) : (
    <TransactionResult signedOperation={signedOperation} />
  );
}
