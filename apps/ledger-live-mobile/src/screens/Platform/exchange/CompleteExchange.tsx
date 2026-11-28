import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "~/context/hooks";
import SafeAreaView from "~/components/SafeAreaView";
import { TokenCurrency } from "@domain/entity-currency-token";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { addSellOperation } from "@ledgerhq/live-common/exchange/sell/sellOperations";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { broadcastLogger } from "~/datadog";
import DeviceActionModal from "~/components/DeviceActionModal";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PlatformExchangeNavigatorParamList } from "~/components/RootNavigator/types/PlatformExchangeNavigator";
import { ScreenName } from "~/const";
import { useTransactionDeviceAction, useCompleteExchangeDeviceAction } from "~/hooks/deviceActions";
import { mevProtectionSelector } from "~/reducers/settings";
import { BroadcastConfig, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import LoadingIndicator from "LLM/features/Web3Hub/components/ManifestsList/LoadingIndicator";

type Props = StackNavigatorProps<
  PlatformExchangeNavigatorParamList,
  ScreenName.PlatformCompleteExchange
>;

const shouldRestartFlow = (error: Error) => error.name === "InvalidTransactionError";

const PlatformCompleteExchange: React.FC<Props> = ({
  route: {
    params: { request, onResult, device, onClose },
  },
  navigation,
}) => {
  const dispatch = useDispatch();
  const mevProtected = useSelector(mevProtectionSelector);
  const { fromAccount: account, fromParentAccount: parentAccount } = request.exchange;
  let tokenCurrency: TokenCurrency | undefined;

  if (account.type === "TokenAccount") tokenCurrency = account.token;

  const broadcastConfig = useMemo<BroadcastConfig>(
    () => ({
      mevProtected,
      sponsored: request.sponsored,
      source: { type: "swap", name: request.provider },
    }),
    [mevProtected, request.sponsored, request.provider],
  );

  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig,
    logger: broadcastLogger,
  });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();
  const hasPopped = useRef(false);
  const hasBroadcastedTransaction = useRef(false);

  useEffect(() => {
    if (signedOperation && !hasBroadcastedTransaction.current) {
      hasBroadcastedTransaction.current = true;
      broadcast(signedOperation).then(
        operation => {
          if (
            request.exchangeType === ExchangeType.SELL ||
            request.exchangeType === ExchangeType.SELL_NG
          ) {
            const mainAccount = getMainAccount(account, parentAccount);
            dispatch(
              updateAccountWithUpdater({
                accountId: mainAccount.id,
                updater: a => addSellOperation(a, operation),
              }),
            );
          }
          onResult({ operation });
        },
        error => {
          const shouldRestart = shouldRestartFlow(error);

          if (shouldRestart) {
            onResult({ error });
            return;
          }
          setError(error);
        },
      );
    }
  }, [
    broadcast,
    onResult,
    signedOperation,
    request.exchangeType,
    account,
    parentAccount,
    dispatch,
  ]);

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
