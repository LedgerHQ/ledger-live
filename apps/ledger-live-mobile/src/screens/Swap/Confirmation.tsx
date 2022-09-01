import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import type {
  ExchangeRate,
  InitSwapResult,
  SwapTransaction,
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
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { DeviceInfo, SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SwapDataType } from "@ledgerhq/live-common/exchange/swap/hooks/useSwapTransaction";
import { renderLoading } from "../../components/DeviceAction/rendering";
import { ScreenName } from "../../const";
import { updateAccountWithUpdater } from "../../actions/accounts";
import DeviceAction from "../../components/DeviceAction";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";
import { useBroadcast } from "../../components/useBroadcast";
import { swapKYCSelector } from "../../reducers/settings";
import { UnionToIntersection } from "../../types/helpers";

const silentSigningAction = createAction(connectApp);
const swapAction = initSwapCreateAction(connectApp, initSwap);
export type DeviceMeta = {
  result: {
    installed: any;
  };
  device: Device;
  deviceInfo: DeviceInfo;
};
type Props = {
  swap: SwapDataType;
  rate: ExchangeRate;
  provider: string;
  transaction: Transaction;
  deviceMeta: DeviceMeta;
  onError: (_: Error) => void;
  onCancel: () => void;
  status: TransactionStatus;
};

const Confirmation = ({
  swap,
  rate,
  provider,
  transaction,
  onError,
  onCancel,
  deviceMeta,
  status,
}: Props) => {
  const {
    from: { account: fromAccount, parentAccount: fromParentAccount },
    to: { account: toAccount, parentAccount: toParentAccount },
  } = swap;
  const exchange = useMemo(
    () => ({
      fromAccount,
      fromParentAccount,
      toAccount,
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
  const targetCurrency = toAccount && getAccountCurrency(toAccount);
  const navigation = useNavigation();
  const onComplete = useCallback(
    result => {
      const { operation, swapId } = result;
      const mainAccount =
        fromAccount && getMainAccount(fromAccount, fromParentAccount);
      if (!mainAccount) return;
      dispatch(
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(
            addToSwapHistory({
              account,
              operation,
              transaction,
              swap: {
                exchange: {
                  ...exchange,
                  fromAccount: exchange.fromAccount!,
                  toAccount: exchange.toAccount!,
                },
                exchangeRate: rate,
              },
              swapId,
            }),
            operation,
          ),
        ),
      );
      targetCurrency?.name &&
        navigation.replace(ScreenName.SwapPendingOperation, {
          swapId,
          provider: rate.provider,
          targetCurrency: targetCurrency.name,
          operation,
          fromAccount,
          fromParentAccount,
        });
    },
    [
      fromAccount,
      fromParentAccount,
      dispatch,
      navigation,
      rate,
      targetCurrency?.name,
      transaction,
      exchange,
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
    <BottomModal isOpened={true} preventBackdropClick onClose={onCancel}>
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
                  exchange: {
                    ...exchange,
                    fromAccount: exchange.fromAccount!,
                    toAccount: exchange.toAccount!,
                  },
                  exchangeRate: rate,
                  transaction: transaction as SwapTransaction,
                  userId: providerKYC?.id,
                }}
                onResult={result => {
                  const { initSwapResult, initSwapError } =
                    result as UnionToIntersection<typeof result>;
                  if (initSwapError) {
                    onError(initSwapError);
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
                  status,
                  tokenCurrency,
                  parentAccount: fromParentAccount,
                  account: fromAccount!,
                  transaction: swapData.transaction,
                  appName: "Exchange",
                }}
                onResult={result => {
                  const { transactionSignError, signedOperation } =
                    result as UnionToIntersection<typeof result>;
                  if (transactionSignError) {
                    onError(transactionSignError);
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
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
});
export default Confirmation;
