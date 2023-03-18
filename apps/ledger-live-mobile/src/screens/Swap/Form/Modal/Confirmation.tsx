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
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  Exchange,
  ExchangeRate,
  InitSwapResult,
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
import { AccountLike, DeviceInfo, SignedOperation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  postSwapAccepted,
  postSwapCancelled,
} from "@ledgerhq/live-common/exchange/swap/index";
import { getEnv } from "@ledgerhq/live-common/env";
import { InstalledItem } from "@ledgerhq/live-common/apps/types";
import { renderLoading } from "../../../../components/DeviceAction/rendering";
import { updateAccountWithUpdater } from "../../../../actions/accounts";
import DeviceAction from "../../../../components/DeviceAction";
import QueuedDrawer from "../../../../components/QueuedDrawer";
import ModalBottomAction from "../../../../components/ModalBottomAction";
import { useBroadcast } from "../../../../components/useBroadcast";
import { swapKYCSelector } from "../../../../reducers/settings";
import { UnionToIntersection } from "../../../../types/helpers";
import type { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../../const";
import type { SwapNavigatorParamList } from "../../../../components/RootNavigator/types/SwapNavigator";

const silentSigningAction = createAction(connectApp);
const swapAction = initSwapCreateAction(connectApp, initSwap);

export type DeviceMeta = {
  result: { installed: InstalledItem[] } | null | undefined;
  device: Device;
  deviceInfo: DeviceInfo;
};

interface Props {
  swapTx: SwapTransactionType;
  exchangeRate: ExchangeRate;
  deviceMeta: DeviceMeta;
  onError: (_error: { error: Error; swapId?: string }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

type NavigationProp = StackNavigatorNavigation<SwapNavigatorParamList>;

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

  const [swapData, setSwapData] = useState<InitSwapResult | null>(null);
  const [signedOperation, setSignedOperation] =
    useState<SignedOperation | null>(null);
  const dispatch = useDispatch();
  const broadcast = useBroadcast({
    account: fromAccount,
    parentAccount: fromParentAccount,
  });
  const tokenCurrency =
    fromAccount && fromAccount.type === "TokenAccount"
      ? fromAccount.token
      : null;
  const navigation = useNavigation<NavigationProp>();

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

      const mainAccount =
        fromAccount && getMainAccount(fromAccount, fromParentAccount);

      if (!mainAccount || !exchangeRate) return;
      dispatch(
        updateAccountWithUpdater({
          accountId: mainAccount.id,
          updater: account =>
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
        }),
      );

      if (typeof swapTx.current.swap.from.amount !== "undefined") {
        navigation.replace(ScreenName.SwapPendingOperation, {
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
      }
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
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
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
                request={{
                  exchange,
                  exchangeRate: exchangeRate.current,
                  transaction: swapTx.current.transaction as SwapTransaction,
                  userId: providerKYC?.id,
                }}
                onResult={result => {
                  const { initSwapResult, initSwapError, swapId } =
                    result as UnionToIntersection<typeof result>;
                  if (initSwapError) {
                    onError({ error: initSwapError, swapId });
                  } else {
                    setSwapData(initSwapResult);
                  }
                }}
                onError={error => onError({ error })}
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
                  transaction: swapData.transaction,
                  appName: "Exchange",
                }}
                onResult={result => {
                  const { transactionSignError, signedOperation, swapId } =
                    result as UnionToIntersection<typeof result>;
                  if (transactionSignError) {
                    onError({ error: transactionSignError, swapId });
                  } else {
                    setSignedOperation(signedOperation);
                  }
                }}
                onError={error => onError({ error })}
                analyticsPropertyFlow="swap"
              />
            )}
          </View>
        }
      />
    </QueuedDrawer>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
});
