import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import { createAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import { createAction as txCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceActionModal from "../../../components/DeviceActionModal";
import { useBroadcast } from "../../../components/useBroadcast";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { PlatformExchangeNavigatorParamList } from "../../../components/RootNavigator/types/PlatformExchangeNavigator";
import { ScreenName } from "../../../const";

type Props = StackNavigatorProps<
  PlatformExchangeNavigatorParamList,
  ScreenName.PlatformCompleteExchange
>;

const PlatformCompleteExchange: React.FC<Props> = ({
  route: {
    params: { request, onResult, device },
  },
  navigation,
}) => {
  const { fromAccount: account, fromParentAccount: parentAccount } =
    request.exchange;
  let tokenCurrency;
  if (account.type === "TokenAccount") tokenCurrency = account.token;

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState();
  const [signedOperation, setSignedOperation] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    if (signedOperation) {
      broadcast(signedOperation).then(operation => {
        onResult({ operation });
      }, setError);
    }
  }, [broadcast, onResult, signedOperation]);

  useEffect(() => {
    if (error) {
      onResult({ error });
    }
  }, [onResult, error]);

  const onClose = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  const onCompleteExchange = useCallback(
    ({ completeExchangeResult, completeExchangeError }) => {
      if (completeExchangeError) {
        setError(completeExchangeError);
      } else {
        setTransaction(completeExchangeResult);
      }
    },
    [],
  );

  const onSign = useCallback(({ signedOperation, transactionSignError }) => {
    if (transactionSignError) {
      setError(transactionSignError);
    } else {
      setSignedOperation(signedOperation);
    }
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {!transaction ? (
        <DeviceActionModal
          key="completeExchange"
          device={device}
          action={exchangeAction}
          onClose={onClose}
          onResult={onCompleteExchange}
          // @ts-expect-error Wrong types?
          request={request}
        />
      ) : (
        <DeviceActionModal
          key="sign"
          device={device}
          action={sendAction}
          onClose={onClose}
          onResult={onSign}
          // @ts-expect-error Wrong types?
          request={{
            tokenCurrency,
            parentAccount,
            account,
            transaction,
            appName: "Exchange",
          }}
        />
      )}
    </SafeAreaView>
  );
};

const exchangeAction = createAction(completeExchange);
const sendAction = txCreateAction(connectApp);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 32,
  },
});

export default PlatformCompleteExchange;
