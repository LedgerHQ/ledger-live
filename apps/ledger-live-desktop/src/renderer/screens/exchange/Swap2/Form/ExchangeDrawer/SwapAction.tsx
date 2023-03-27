import { getEnv } from "@ledgerhq/live-common/env";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/hw/actions/initSwap";
import { createAction as transactionCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { SignedOperation } from "@ledgerhq/types-live";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";
import Text from "~/renderer/components/Text";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { swapKYCSelector } from "~/renderer/reducers/settings";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import initSwap from "@ledgerhq/live-common/exchange/swap/initSwap";
const transactionAction = transactionCreateAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
const initAction = initSwapCreateAction(
  getEnv("MOCK") ? mockedEventEmitter : connectApp,
  getEnv("MOCK") ? mockedEventEmitter : initSwap,
);
const TransactionResult = ({
  signedOperation,
}: {
  signedOperation: SignedOperation | undefined | null;
}) => {
  if (!signedOperation) return null;
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
  onCompletion: (a: { operation: Operation; swapId: string }) => void;
  onError: (a: { error: Error; swapId: string }) => void;
};
export default function SwapAction({
  swapTransaction,
  exchangeRate,
  onCompletion,
  onError,
}: Props) {
  const [initData, setInitData] = useState(null);
  const [signedOperation, setSignedOperation] = useState(null);
  const device = useSelector(getCurrentDevice);
  const deviceRef = useRef(device);
  const swapKYC = useSelector(swapKYCSelector);
  const { account: fromAccount, parentAccount: fromParentAccount } = swapTransaction.swap.from;
  const { account: toAccount, parentAccount: toParentAccount } = swapTransaction.swap.to;
  const { transaction, status } = swapTransaction;
  const provider = exchangeRate?.provider;
  const providerKYC = swapKYC?.[provider];
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
      const { swapId } = initData;
      broadcast(signedOperation).then(
        operation => {
          onCompletion({
            operation,
            swapId,
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
  return !initData ? (
    <DeviceAction
      key={"initSwap"}
      action={initAction}
      request={{
        exchange,
        exchangeRate,
        transaction,
        status,
        device: deviceRef,
        userId: providerKYC?.id,
      }}
      onResult={({ initSwapResult, initSwapError, swapId, ...rest }) => {
        if (initSwapError) {
          onError({
            error: initSwapError,
            swapId,
          });
        } else {
          setInitData(initSwapResult);
        }
      }}
      analyticsPropertyFlow="swap"
    />
  ) : !signedOperation ? (
    <DeviceAction
      key={"send"}
      action={transactionAction}
      request={{
        tokenCurrency,
        parentAccount: fromParentAccount,
        account: fromAccount,
        transaction: initData.transaction,
        appName: "Exchange",
      }}
      Result={TransactionResult}
      onResult={({ signedOperation, transactionSignError }) => {
        if (transactionSignError) {
          onError({
            error: transactionSignError,
            swapId: initData.swapId,
          });
        } else {
          setSignedOperation(signedOperation);
        }
      }}
      analyticsPropertyFlow="swap"
    />
  ) : (
    <TransactionResult signedOperation={signedOperation} />
  );
}
