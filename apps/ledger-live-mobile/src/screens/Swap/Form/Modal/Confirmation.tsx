import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import {
  Exchange,
  ExchangeRate,
  SwapTransaction,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { getSwapOperationMap } from "@ledgerhq/live-common/exchange/swap/getCompleteSwapHistory";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/hw/actions/initSwap";
import initSwap from "@ledgerhq/live-common/exchange/swap/initSwap";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import addToSwapHistory from "@ledgerhq/live-common/exchange/swap/addToSwapHistory";
import {
  addPendingOperation,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { AccountLike, DeviceInfo } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  postSwapAccepted,
  postSwapCancelled,
} from "@ledgerhq/live-common/exchange/swap/index";
import { getEnv } from "@ledgerhq/live-common/env";
import { MappedSwapOperation } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { renderLoading } from "../../../../components/DeviceAction/rendering";
import { updateAccountWithUpdater } from "../../../../actions/accounts";
import DeviceAction from "../../../../components/DeviceAction";
import BottomModal from "../../../../components/BottomModal";
import ModalBottomAction from "../../../../components/ModalBottomAction";
import { useBroadcast } from "../../../../components/useBroadcast";
import { swapKYCSelector } from "../../../../reducers/settings";

const silentSigningAction = createAction(connectApp);
const swapAction = initSwapCreateAction(connectApp, initSwap);
export type DeviceMeta = {
  result: { installed: any };
  device: Device;
  deviceInfo: DeviceInfo;
};

interface Props {
  swapTx: SwapTransactionType;
  exchangeRate?: ExchangeRate;
  provider: string;
  deviceMeta: DeviceMeta;
  onError: (error: { error: Error; swapId: string }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function Confirmation({
  swapTx,
  exchangeRate,
  provider,
  onError,
  onCancel,
  deviceMeta,
  isOpen,
}: Props) {
  const {
    from: { account: fromAccount, parentAccount: fromParentAccount },
    to: { account: toAccount, parentAccount: toParentAccount },
  } = swapTx.swap;

  const exchange = useMemo<Exchange>(
    () => ({
      fromAccount: fromAccount as AccountLike,
      fromParentAccount,
      toAccount: toAccount as AccountLike,
      toParentAccount,
    }),
    [fromAccount, fromParentAccount, toAccount, toParentAccount],
  );
  const swapKYC = useSelector(swapKYCSelector);
  const providerKYC = swapKYC[provider];
  const [swapData, setSwapData] = useState(null);
  const [signedOperation, setSignedOperation] = useState(null);
  const dispatch = useDispatch();
  const broadcast = useBroadcast({
    account: fromAccount,
    parentAccount: fromParentAccount,
  });
  const tokenCurrency =
    fromAccount && fromAccount.type === "TokenAccount"
      ? fromAccount.token
      : null;
  const targetCurrency = useMemo(
    () => toAccount && getAccountCurrency(toAccount),
    [toAccount],
  );
  const navigation = useNavigation();
  const onComplete = useCallback(
    result => {
      if (!fromAccount || !targetCurrency || !exchangeRate) {
        return;
      }
      const { operation, swapId } = result;
      /**
       * If transaction broadcast are disabled, consider the swap as cancelled
       * since the partner will never receive the funds
       */
      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        postSwapCancelled({ provider: exchangeRate.provider, swapId });
      } else {
        postSwapAccepted({
          provider: exchangeRate.provider,
          swapId,
          transactionId: operation.hash,
        });
      }

      const mainAccount = getMainAccount(fromAccount, fromParentAccount);

      if (!mainAccount || !exchangeRate) return;
      dispatch(
        // @ts-expect-error
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(
            addToSwapHistory({
              account,
              operation,
              transaction: swapTx.transaction as Transaction,
              swap: {
                exchange,
                exchangeRate,
              },
              swapId,
            }),
            operation,
          ),
        ),
      );

      // @ts-expect-error
      navigation.replace("PendingOperation", {
        swapOperation: {
          fromAccountId: fromAccount.id,
          fromParentAccount,
          toAccountId: toAccount!.id,
          toParentAccount,
          toExists: false,
          operation,
          provider,
          swapId,
          status: "pending",
          fromAmount: swapTx.swap.from.amount,
          toAmount: exchangeRate.toAmount,
        },
      });
    },
    [
      fromAccount,
      fromParentAccount,
      dispatch,
      navigation,
      exchangeRate,
      targetCurrency,
      swapTx.transaction,
      swapTx.swap,
      exchange,
      provider,
      toAccount,
      toParentAccount,
    ],
  );
  useEffect(() => {
    if (swapData && signedOperation) {
      const { swapId } = swapData;
      broadcast(signedOperation).then(
        operation => {
          onComplete({
            operation,
            swapId,
          });
        },
        error => {
          onError(error);
        },
      );
    }
  }, [broadcast, onComplete, onError, signedOperation, swapData]);
  const { t } = useTranslation();
  return (
    <BottomModal
      id="SwapConfirmationFeedback"
      isOpened={isOpen}
      preventBackdropClick
      onClose={onCancel}
    >
      <SyncSkipUnderPriority priority={100} />
      <ModalBottomAction
        footer={
          <View style={styles.footerContainer}>
            {signedOperation ? (
              renderLoading({
                t,
                description: t("transfer.swap.broadcasting"),
              })
            ) : !swapData ? (
              <DeviceAction
                key={"initSwap"}
                action={swapAction}
                device={deviceMeta.device}
                onError={onError}
                request={{
                  exchange,
                  exchangeRate: exchangeRate as ExchangeRate,
                  transaction: swapTx.transaction as SwapTransaction,
                  userId: providerKYC?.id,
                }}
                onResult={({ initSwapResult, initSwapError, swapId }) => {
                  if (initSwapError) {
                    onError({ error: initSwapError, swapId });
                  } else {
                    setSwapData(initSwapResult);
                  }
                }}
                analyticsPropertyFlow="swap"
              />
            ) : (
              <DeviceAction
                action={silentSigningAction}
                device={deviceMeta.device}
                request={{
                  status: swapTx.status,
                  tokenCurrency,
                  parentAccount: fromParentAccount,
                  account: fromAccount as AccountLike,
                  // @ts-expect-error
                  transaction: swapData.transaction as Transaction,
                  appName: "Exchange",
                }}
                onResult={({
                  transactionSignError,
                  signedOperation,
                  swapId,
                }) => {
                  if (transactionSignError) {
                    onError({ error: transactionSignError, swapId });
                  } else {
                    setSignedOperation(signedOperation);
                  }
                }}
                analyticsPropertyFlow="swap"
              />
            )}
          </View>
        }
      />
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
});
