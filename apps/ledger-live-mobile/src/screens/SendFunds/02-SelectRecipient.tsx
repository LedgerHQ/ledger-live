import { isConfirmedOperation } from "@ledgerhq/coin-framework/operation";
import { RecipientRequired } from "@ledgerhq/errors";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  SyncOneAccountOnMount,
  SyncSkipUnderPriority,
} from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { isNftTransaction } from "@ledgerhq/live-common/nft/index";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import { Operation } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { useSelector } from "react-redux";
import { TrackScreen, track } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import CancelButton from "~/components/CancelButton";
import { EditOperationCard } from "~/components/EditOperationCard";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import KeyboardView from "~/components/KeyboardView";
import LText from "~/components/LText";
import NavigationScrollView from "~/components/NavigationScrollView";
import RetryButton from "~/components/RetryButton";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { currencySettingsForAccountSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import DomainServiceRecipientRow from "./DomainServiceRecipientRow";
import RecipientRow from "./RecipientRow";

const withoutHiddenError = (error: Error): Error | null =>
  error instanceof RecipientRequired ? null : error;

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSelectRecipient>
>;

export default function SendSelectRecipient({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is missing");

  const mainAccount = getMainAccount(account, parentAccount);
  const currencySettings = useSelector((s: State) =>
    currencySettingsForAccountSelector(s, {
      account: mainAccount,
    }),
  );
  const { enabled: isDomainResolutionEnabled, params } = useFeature("domainInputResolution") ?? {};
  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => ({
      account,
      parentAccount,
    }),
  );

  invariant(transaction, `couldn't get transaction from ${mainAccount.currency.name} bridge`);

  const [value, setValue] = useState<string>("");

  const shouldSkipAmount = useMemo(() => {
    if (transaction?.family === "evm") {
      return transaction.mode === "erc721";
    }

    return false;
  }, [transaction]);

  const isNftSend = isNftTransaction(transaction);

  // handle changes from camera qr code
  const initialTransaction = useRef(transaction);
  const navigationTransaction = route.params?.transaction;

  useEffect(() => {
    if (initialTransaction.current !== navigationTransaction && navigationTransaction) {
      setTransaction(navigationTransaction);
      setValue(navigationTransaction.recipient);
    }
  }, [setTransaction, navigationTransaction]);

  useEffect(() => {
    if (!value && transaction.recipient) {
      setValue(transaction.recipient);
    }
  }, [transaction.recipient, value]);

  const onRecipientFieldFocus = useCallback(() => {
    track("SendRecipientFieldFocused");
  }, []);

  const onPressScan = useCallback(() => {
    setValue("");
    return navigation.navigate(ScreenName.ScanRecipient, {
      ...route.params,
      accountId: route.params?.accountId,
      parentId: route.params?.parentId,
      transaction,
    });
  }, [navigation, transaction, route.params]);

  const onChangeText = useCallback(
    (recipient: string) => {
      if (!account) return;
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          recipient,
        }),
      );
      setValue(recipient);
    },
    [account, parentAccount, setTransaction, transaction, setValue],
  );

  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);

  const currency = getAccountCurrency(account);

  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.getParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);

  const onPressContinue = useCallback(async () => {
    // ERC721 transactions are always sending 1 NFT, so amount step is unecessary
    if (shouldSkipAmount) {
      return navigation.navigate(ScreenName.SendSummary, {
        ...route.params,
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        currentNavigation: ScreenName.SendSummary,
        nextNavigation: ScreenName.SendSelectDevice,
      });
    }

    if (isNftSend) {
      return navigation.navigate(ScreenName.SendAmountNft, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
      });
    }

    return navigation.navigate(ScreenName.SendAmountCoin, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
    });
  }, [
    account,
    transaction,
    shouldSkipAmount,
    isNftSend,
    navigation,
    parentAccount?.id,
    route.params,
  ]);

  if (!account || !transaction) return null;

  const error = withoutHiddenError(status.errors.recipient);
  const warning = status.warnings.recipient;
  const isSomeIncomingTxPending = account.operations?.some(
    (op: Operation) =>
      (op.type === "IN" || op.type === "NFT_IN") &&
      !isConfirmedOperation(op, mainAccount, currencySettings.confirmationsNb),
  );

  const stuckAccountAndOperation = getStuckAccountAndOperation(account, mainAccount);

  return (
    <>
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <TrackScreen category="SendFunds" name="SelectRecipient" currencyName={currency.name} />
        <SyncSkipUnderPriority priority={100} />
        <SyncOneAccountOnMount
          reason="transaction-flow-init"
          priority={100}
          accountId={account.id}
        />
        <KeyboardView
          style={{
            flex: 1,
          }}
        >
          {stuckAccountAndOperation?.operation ? (
            <EditOperationCard
              isOperationStuck
              oldestEditableOperation={stuckAccountAndOperation.operation}
              account={stuckAccountAndOperation.account}
              parentAccount={stuckAccountAndOperation.parentAccount}
            />
          ) : null}
          <NavigationScrollView
            style={[
              styles.container,
              {
                flex: 1,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Button
              event="SendRecipientQR"
              type="tertiary"
              title={<Trans i18nKey="send.recipient.scan" />}
              IconLeft={IconQRCode}
              onPress={onPressScan}
            />
            <View style={styles.separatorContainer}>
              <View
                style={[
                  styles.separatorLine,
                  {
                    borderBottomColor: colors.lightFog,
                  },
                ]}
              />
              <LText color="grey">{<Trans i18nKey="common.or" />}</LText>
              <View
                style={[
                  styles.separatorLine,
                  {
                    borderBottomColor: colors.lightFog,
                  },
                ]}
              />
            </View>
            {isDomainResolutionEnabled && isCurrencySupported ? (
              <DomainServiceRecipientRow
                onChangeText={onChangeText}
                value={value}
                onRecipientFieldFocus={onRecipientFieldFocus}
                account={account}
                parentAccount={parentAccount}
                transaction={transaction}
                setTransaction={setTransaction}
                error={error}
                warning={warning}
              />
            ) : (
              <RecipientRow
                onChangeText={onChangeText}
                onRecipientFieldFocus={onRecipientFieldFocus}
                transaction={transaction}
                warning={warning}
                error={error}
              />
            )}
            {isSomeIncomingTxPending ? (
              <View style={styles.pendingIncomingTxWarning}>
                <Alert type="warning">{t("send.pendingTxWarning")}</Alert>
              </View>
            ) : null}
          </NavigationScrollView>
          <View style={styles.container}>
            {(!isDomainResolutionEnabled || !isCurrencySupported) &&
            transaction.recipient &&
            !(error || warning) ? (
              <View style={styles.infoBox}>
                <Alert type="primary">{t("send.recipient.verifyAddress")}</Alert>
              </View>
            ) : null}
            <Button
              testID="recipient-continue-button"
              event="SendRecipientContinue"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              disabled={bridgePending || !!status.errors.recipient}
              pending={bridgePending}
              onPress={onPressContinue}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>

      <GenericErrorBottomModal
        error={bridgeErr}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton containerStyle={styles.button} onPress={onBridgeErrorCancel} />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </>
  );
}

const IconQRCode = ({ size = 16, color }: { size?: number; color?: string }) => (
  <Icon name="qrcode" size={size} color={color} />
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  a: {},
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  infoBox: {
    marginBottom: 24,
  },
  pendingIncomingTxWarning: {
    marginBottom: 8,
    marginTop: 8,
  },
  separatorContainer: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  separatorLine: {
    flex: 1,
    borderBottomWidth: 1,
    marginHorizontal: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});
