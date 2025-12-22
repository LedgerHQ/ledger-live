import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "~/context/store";
import { SafeAreaView } from "react-native-safe-area-context";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import DeviceActionModal from "~/components/DeviceActionModal";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PlatformExchangeNavigatorParamList } from "~/components/RootNavigator/types/PlatformExchangeNavigator";
import { ScreenName } from "~/const";
import { useTransactionDeviceAction, useCompleteExchangeDeviceAction } from "~/hooks/deviceActions";
import { mevProtectionSelector } from "~/reducers/settings";
import { SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import LoadingIndicator from "LLM/features/Web3Hub/components/ManifestsList/LoadingIndicator";

type Props = StackNavigatorProps<
  PlatformExchangeNavigatorParamList,
  ScreenName.PlatformCompleteExchange
>;

const PlatformCompleteExchange: React.FC<Props> = ({
  route: {
    params: { request, onResult, device, onClose },
  },
  navigation,
}) => {
  const mevProtected = useSelector(mevProtectionSelector);
  const { fromAccount: account, fromParentAccount: parentAccount } = request.exchange;
  let tokenCurrency: TokenCurrency | undefined;

  if (account.type === "TokenAccount") tokenCurrency = account.token;

  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig: { mevProtected, sponsored: request.sponsored },
  });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();
  const hasPopped = useRef(false);

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

  const onCloseHandler = useCallback(() => {
    // Prevent onClose being called twice
    if (!hasPopped.current) {
      navigation.pop();
    }
    hasPopped.current = true;
    onClose?.();
  }, [navigation, onClose]);

  const onCompleteExchange = useCallback(
    (res: { completeExchangeResult: Transaction } | { completeExchangeError: Error }) => {
      if ("completeExchangeError" in res) {
        setError(res.completeExchangeError);
      } else if ("completeExchangeResult" in res) {
        setTransaction(res.completeExchangeResult);
      }
    },
    [],
  );

  const onSign = useCallback(
    (res: { signedOperation: SignedOperation } | { transactionSignError?: Error }) => {
      if ("transactionSignError" in res) {
        setError(res.transactionSignError);
      } else if ("signedOperation" in res) {
        setSignedOperation(res.signedOperation);
      }
    },
    [],
  );

  const signRequest = useMemo(() => {
    if (transaction) {
      return {
        tokenCurrency,
        parentAccount,
        account,
        transaction,
        appName: "Exchange",
      };
    }
    return null;
  }, [account, parentAccount, tokenCurrency, transaction]);

  const sendAction = useTransactionDeviceAction();
  const exchangeAction = useCompleteExchangeDeviceAction();

  return (
    <SafeAreaView style={styles.root}>
      <LoadingIndicator />
      {!signRequest ? (
        <DeviceActionModal
          key="completeExchange"
          device={device}
          action={exchangeAction}
          onClose={onCloseHandler}
          onResult={onCompleteExchange}
          request={request}
          location={HOOKS_TRACKING_LOCATIONS.swapFlow}
          noCloseButton={true}
          preventBackdropClick={true}
        />
      ) : (
        <DeviceActionModal
          key="sign"
          device={device}
          action={sendAction}
          onClose={onCloseHandler}
          onResult={onSign}
          request={signRequest}
          location={HOOKS_TRACKING_LOCATIONS.swapFlow}
          noCloseButton={true}
          preventBackdropClick={true}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 32,
  },
});

export default PlatformCompleteExchange;
