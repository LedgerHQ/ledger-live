// @flow

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/types/index";
import type {
  Exchange,
  ExchangeRate,
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

import type { DeviceInfo } from "@ledgerhq/live-common/types/manager";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

import { renderLoading } from "../../components/DeviceAction/rendering";
import { ScreenName } from "../../const";
import { updateAccountWithUpdater } from "../../actions/accounts";
import DeviceAction from "../../components/DeviceAction";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";
import { useBroadcast } from "../../components/useBroadcast";
import { swapKYCSelector } from "../../reducers/settings";

const silentSigningAction = createAction(connectApp);
const swapAction = initSwapCreateAction(connectApp, initSwap);

export type DeviceMeta = {
  result: { installed: any },
  device: Device,
  deviceInfo: DeviceInfo,
};

type Props = {
  swap: Exchange,
  rate: ExchangeRate,
  provider: string,
  transaction: Transaction,
  deviceMeta: DeviceMeta,
  onError: (error: Error) => void,
  onCancel: () => void,
  status: TransactionStatus,
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
  const targetCurrency = getAccountCurrency(toAccount);
  const navigation = useNavigation();

  const onComplete = useCallback(
    result => {
      const { operation, swapId } = result;
      const mainAccount = getMainAccount(fromAccount, fromParentAccount);

      if (!mainAccount) return;
      dispatch(
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(
            addToSwapHistory({
              account,
              operation,
              transaction,
              swap: {
                exchange,
                exchangeRate: rate,
              },
              swapId,
            }),
            operation,
          ),
        ),
      );
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
      targetCurrency.name,
      transaction,
      exchange,
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
      isOpened={true}
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
                onClose={() => undefined}
                key={"initSwap"}
                action={swapAction}
                device={deviceMeta.device}
                onError={onError}
                request={{
                  exchange,
                  exchangeRate: rate,
                  transaction,
                  userId: providerKYC?.id,
                }}
                onResult={({ initSwapResult, initSwapError }) => {
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
                  account: fromAccount,
                  transaction: swapData.transaction,
                  appName: "Exchange",
                }}
                onResult={({ transactionSignError, signedOperation }) => {
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
