// @flow

import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import type {
  Exchange,
  ExchangeRate,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/lib/bridge/react";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/transaction";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/lib/hw/actions/initSwap";
import initSwap from "@ledgerhq/live-common/lib/exchange/swap/initSwap";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import { useDispatch } from "react-redux";
import {
  addPendingOperation,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import addToSwapHistory from "@ledgerhq/live-common/lib/exchange/swap/addToSwapHistory";
import { useNavigation } from "@react-navigation/native";
import { renderLoading } from "../../components/DeviceAction/rendering";
import { ScreenName } from "../../const";
import { updateAccountWithUpdater } from "../../actions/accounts";
import DeviceAction from "../../components/DeviceAction";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";
import { useBroadcast } from "../../components/useBroadcast";

import type { DeviceMeta } from "./Form";

const silentSigningAction = createAction(connectApp);
const swapAction = initSwapCreateAction(connectApp, initSwap);

type Props = {
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  transaction: Transaction,
  deviceMeta: DeviceMeta,
  onError: (error: Error) => void,
  onCancel: () => void,
  status: TransactionStatus,
};
const Confirmation = ({
  exchange,
  exchangeRate,
  transaction,
  onError,
  onCancel,
  deviceMeta,
  status,
}: Props) => {
  const { fromAccount, fromParentAccount } = exchange;
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
      const mainAccount = getMainAccount(fromAccount, fromParentAccount);

      if (!mainAccount) return;
      dispatch(
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(
            addToSwapHistory({
              account,
              operation,
              transaction,
              swap: { exchange, exchangeRate },
              swapId,
            }),
            operation,
          ),
        ),
      );
      navigation.replace(ScreenName.SwapPendingOperation, {
        swapId,
        provider: exchangeRate.provider,
      });
    },
    [
      dispatch,
      exchange,
      exchangeRate,
      fromAccount,
      fromParentAccount,
      navigation,
      transaction,
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
                  exchangeRate,
                  transaction,
                }}
                onResult={({ initSwapResult, initSwapError }) => {
                  if (initSwapError) {
                    onError(initSwapError);
                  } else {
                    setSwapData(initSwapResult);
                  }
                }}
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
