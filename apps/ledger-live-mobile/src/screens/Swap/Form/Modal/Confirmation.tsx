import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  Exchange,
  ExchangeRate,
  SwapTransaction,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/hw/actions/initSwap";
import initSwap from "@ledgerhq/live-common/exchange/swap/initSwap";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import addToSwapHistory from "@ledgerhq/live-common/exchange/swap/addToSwapHistory";
import {
  addPendingOperation,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { AccountLike, DeviceInfo } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  postSwapAccepted,
  postSwapCancelled,
} from "@ledgerhq/live-common/exchange/swap/index";
import { getEnv } from "@ledgerhq/live-common/env";
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
  exchangeRate: ExchangeRate;
  deviceMeta: DeviceMeta;
  onError: (_error: { error: Error; swapId: string }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function Confirmation({
  swapTx: swapTxProp,
  exchangeRate: exchangeRateProp,
  onError,
  onCancel,
  deviceMeta,
  isOpen,
}: Props) {
  // tx should not change once user enter device action flow.
  const swapTx = useRef(swapTxProp);
  const exchangeRate = useRef(exchangeRateProp);
  const provider = exchangeRate.current.provider;

  const {
    from: { account: fromAccount, parentAccount: fromParentAccount },
    to: { account: toAccount, parentAccount: toParentAccount },
  } = swapTx.current.swap;

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
  const navigation = useNavigation();

  const onComplete = useCallback(
    result => {
      const { operation, swapId } = result;
      /**
       * If transaction broadcast are disabled, consider the swap as cancelled
       * since the partner will never receive the funds
       */
      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        postSwapCancelled({ provider, swapId });
      } else {
        postSwapAccepted({
          provider,
          swapId,
          transactionId: operation.hash,
        });
      }

      const mainAccount = getMainAccount(fromAccount, fromParentAccount);

      if (!mainAccount || !exchangeRate) return;
      dispatch(
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(
            addToSwapHistory({
              account,
              operation,
              transaction: swapTx.current.transaction as Transaction,
              swap: {
                exchange,
                exchangeRate: exchangeRate.current,
              },
              swapId,
            }),
            operation,
          ),
        ),
      );

      // @ts-expect-error navigation type is only partially declared
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
          fromAmount: swapTx.current.swap.from.amount,
          toAmount: exchangeRate.current.toAmount,
        },
      });
    },
    [
      toAccount,
      fromAccount,
      fromParentAccount,
      dispatch,
      navigation,
      exchange,
      toParentAccount,
      provider,
    ],
  );

  useEffect(() => {
    if (swapData && signedOperation) {
      const { swapId } = swapData;
      broadcast(signedOperation).then(
        operation => {
          onComplete({ operation, swapId });
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
              renderLoading({ t, description: t("transfer.swap.broadcasting") })
            ) : !swapData ? (
              <DeviceAction
                key={"initSwap"}
                action={swapAction}
                device={deviceMeta.device}
                onError={onError}
                request={{
                  exchange,
                  exchangeRate: exchangeRate.current,
                  transaction: swapTx.current.transaction as SwapTransaction,
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
                  status: swapTx.current.status,
                  tokenCurrency,
                  parentAccount: fromParentAccount,
                  account: fromAccount as AccountLike,
                  // @ts-expect-error type for swapData is unknwon for some reason
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
