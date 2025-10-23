import { isConfirmedOperation } from "@ledgerhq/coin-framework/operation";
import { RecipientRequired } from "@ledgerhq/errors";
import { Text } from "@ledgerhq/native-ui";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  SyncOneAccountOnMount,
  SyncSkipUnderPriority,
} from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import { Operation } from "@ledgerhq/types-live";
import QrCode from "@ledgerhq/icons-ui/native/QrCode";
import { useNavigation, useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Linking, Platform, StyleSheet, View } from "react-native";
import SafeAreaView from "~/components/SafeAreaView";
import { useSelector } from "react-redux";
import { TrackScreen, track } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import CancelButton from "~/components/CancelButton";
import { EditOperationCard } from "~/components/EditOperationCard";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import KeyboardView from "~/components/KeyboardView";
import NavigationScrollView from "~/components/NavigationScrollView";
import RetryButton from "~/components/RetryButton";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { currencySettingsForAccountSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { MemoTagDrawer } from "LLM/features/MemoTag/components/MemoTagDrawer";
import { useMemoTagInput } from "LLM/features/MemoTag/hooks/useMemoTagInput";
import { hasMemoDisclaimer } from "LLM/features/MemoTag/utils/hasMemoTag";
import DomainServiceRecipientRow from "./DomainServiceRecipientRow";
import RecipientRow from "./RecipientRow";
import perFamilySendSelectRecipient from "../../generated/SendSelectRecipient";
import {
  getTokenExtensions,
  hasProblematicExtension,
} from "@ledgerhq/live-common/families/solana/token";
import { urls } from "~/utils/urls";
import LText from "~/components/LText";
import SupportLinkError from "~/components/SupportLinkError";

const withoutHiddenError = (error: Error): Error | null =>
  error instanceof RecipientRequired ? null : error;

type Navigation = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSelectRecipient>
>;
type Props = Pick<Navigation, "route">;

const openSplTokenExtensionsArticle = () => Linking.openURL(urls.solana.splTokenExtensions);

export default function SendSelectRecipient({ route }: Props) {
  const navigation = useNavigation<Navigation["navigation"]>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is missing");

  const mainAccount = getMainAccount(account, parentAccount);
  const currencySettings = useSelector((s: State) =>
    currencySettingsForAccountSelector(s.settings, {
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

  const debouncedBridgePending = useDebounce(bridgePending, 200);
  invariant(transaction, `couldn't get transaction from ${mainAccount.currency.name} bridge`);

  const [value, setValue] = useState<string>("");

  const shouldSkipAmount = useMemo(() => {
    if (transaction?.family === "evm") {
      return transaction.mode === "erc721";
    }

    return false;
  }, [transaction]);

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
    [account, parentAccount, setTransaction, transaction],
  );

  const memoTag = useMemoTagInput(
    mainAccount.currency.family,
    useCallback(
      patch => {
        const bridge = getAccountBridge(account, parentAccount);
        setTransaction(bridge.updateTransaction(transaction, patch(transaction)));
      },
      [account, parentAccount, setTransaction, transaction],
    ),
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

  const [memoTagDrawerState, setMemoTagDrawerState] = useState<MemoTagDrawerState>(
    MemoTagDrawerState.INITIAL,
  );
  const [focusMemoInput, setFocusMemoInput] = useState(false);

  const handleMemoTagDrawerClose = useCallback(
    () => setMemoTagDrawerState(MemoTagDrawerState.SHOWN),
    [],
  );

  const onPressContinue = useCallback(() => {
    if (
      memoTag?.isEmpty &&
      memoTagDrawerState === MemoTagDrawerState.INITIAL &&
      hasMemoDisclaimer(currency)
    ) {
      return setMemoTagDrawerState(MemoTagDrawerState.SHOWING);
    }

    track("SendRecipientContinue");

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

    return navigation.navigate(ScreenName.SendAmountCoin, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
    });
  }, [
    account,
    transaction,
    shouldSkipAmount,
    navigation,
    parentAccount?.id,
    route.params,
    memoTag?.isEmpty,
    memoTagDrawerState,
    currency,
  ]);

  if (!account || !transaction) return null;

  const error = withoutHiddenError(status.errors.recipient);
  const warning = status.warnings.recipient;
  const isSomeIncomingTxPending = account.operations?.some(
    (op: Operation) =>
      op.type === "IN" && !isConfirmedOperation(op, mainAccount, currencySettings.confirmationsNb),
  );

  const specific =
    perFamilySendSelectRecipient[
      mainAccount.currency.family as keyof typeof perFamilySendSelectRecipient
    ];
  const CustomRecipientAlert =
    specific && "StepRecipientCustomAlert" in specific ? specific.StepRecipientCustomAlert : null;
  const customSendRecipientCanNext =
    specific && "sendRecipientCanNext" in specific ? specific.sendRecipientCanNext : null;

  const customValidationSuccess = customSendRecipientCanNext?.(status) ?? true;
  const isContinueDisabled =
    !customValidationSuccess ||
    debouncedBridgePending ||
    !!status.errors.recipient ||
    memoTag?.isDebouncePending ||
    !!memoTag?.error ||
    !!status.errors.sender;

  const stuckAccountAndOperation = getStuckAccountAndOperation(account, mainAccount);
  const extensions = getTokenExtensions(account);

  return (
    <>
      <SafeAreaView
        isFlex
        edges={["left", "right", "bottom"]}
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
                paddingVertical: 32,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {status.errors.sender ? (
              <View style={[styles.senderErrorBox]}>
                <LText testID="send-sender-error-title" color="alert">
                  <TranslatedError error={status.errors.sender} field="title" />
                </LText>
                <LText
                  testID="send-sender-error-description"
                  style={[styles.warningBox]}
                  color="alert"
                >
                  <TranslatedError error={status.errors.sender} field="description" />
                </LText>
                <View style={[styles.senderLinkErrorBox]}>
                  <SupportLinkError error={status.errors.sender} type="alert" />
                </View>
              </View>
            ) : null}

            <Button
              event="SendRecipientQR"
              type="tertiary"
              title={<Trans i18nKey="send.recipient.scan" />}
              IconLeft={() => <QrCode />}
              onPress={onPressScan}
              outline
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
              <Text color="neutral.c70">{t("common.or")}</Text>
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

            {CustomRecipientAlert && (
              <View style={styles.customRecipientAlertContainer}>
                <CustomRecipientAlert status={status} account={mainAccount} />
              </View>
            )}

            {memoTag?.Input && (
              <View style={styles.memoTagInputContainer}>
                <memoTag.Input
                  testID="memo-tag-input"
                  placeholder={t("send.summary.memo.title")}
                  autoFocus={focusMemoInput}
                  onChange={memoTag.handleChange}
                />
                <Text mt={4} pl={2} color="alert">
                  <TranslatedError error={memoTag.error} />
                </Text>
              </View>
            )}

            {isSomeIncomingTxPending ? (
              <View style={styles.pendingIncomingTxWarning}>
                <Alert type="warning">{t("send.pendingTxWarning")}</Alert>
              </View>
            ) : null}
            {
              <View style={styles.infoBox}>
                <Alert type="primary">{t("send.recipient.verifyAddress")}</Alert>
              </View>
            }
            {extensions && hasProblematicExtension(extensions) ? (
              <Alert testID="spl-2022-problematic-extension" type="warning">
                <Trans i18nKey="send.spl2022.splExtensionsWarning">
                  <Text
                    onPress={openSplTokenExtensionsArticle}
                    style={styles.spl2022LinkLabel}
                    variant="bodyLineHeight"
                    fontWeight="semiBold"
                  />
                </Trans>
              </Alert>
            ) : null}
          </NavigationScrollView>
          <View style={styles.container}>
            <Button
              testID="recipient-continue-button"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              disabled={isContinueDisabled}
              pending={debouncedBridgePending}
              onPress={onPressContinue}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>

      <MemoTagDrawer
        open={memoTagDrawerState === MemoTagDrawerState.SHOWING}
        onClose={handleMemoTagDrawerClose}
        onModalHide={
          () => requestAnimationFrame(() => setFocusMemoInput(true)) // Focus memo input after drawer finishes animating
        }
        onNext={onPressContinue}
      />

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

const styles = StyleSheet.create({
  senderErrorBox: {
    marginTop: 8,
    marginBottom: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
        marginBottom: 6,
      },
    }),
  },
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  senderLinkErrorBox: {
    display: "flex",
    alignItems: "flex-start",
  },
  root: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: "transparent",
  },
  customRecipientAlertContainer: {
    marginTop: 8,
  },
  memoTagInputContainer: {
    marginTop: 32,
  },
  infoBox: {
    marginTop: 24,
    paddingBottom: 24,
  },
  pendingIncomingTxWarning: {
    marginBottom: 8,
    marginTop: 24,
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
  spl2022LinkLabel: {
    textDecorationLine: "underline",
  },
});

enum MemoTagDrawerState {
  INITIAL,
  SHOWING,
  SHOWN,
}
