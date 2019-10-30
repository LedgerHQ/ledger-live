/* @flow */
import { RecipientRequired } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import type {
  Account,
  AccountLike,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import i18next from "i18next";
import React, { useCallback, useRef, useEffect } from "react";
import { Trans, translate } from "react-i18next";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { NavigationScreenProp } from "react-navigation";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { track, TrackScreen } from "../../analytics";
import SyncOneAccountOnMount from "../../bridge/SyncOneAccountOnMount";
import SyncSkipUnderPriority from "../../bridge/SyncSkipUnderPriority";
import colors from "../../colors";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";
import LText, { getFontStyle } from "../../components/LText";
import StepHeader from "../../components/StepHeader";
import TextInput from "../../components/TextInput";
import TranslatedError from "../../components/TranslatedError";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";

const withoutHiddenError = error =>
  error instanceof RecipientRequired ? null : error;

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      parentId: string,
      transaction: Transaction,
      justScanned?: boolean,
    },
  }>,
  t: T,
};

const SendSelectRecipient = ({
  account,
  parentAccount,
  navigation,
  t,
}: Props) => {
  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => ({ account, parentAccount }));

  // handle changes from camera qr code
  const initialTransaction = useRef(transaction);
  const navigationTransaction = navigation.getParam("transaction");
  useEffect(() => {
    if (
      initialTransaction.current !== navigationTransaction &&
      navigationTransaction
    ) {
      setTransaction(navigationTransaction);
    }
  }, [setTransaction, navigationTransaction]);

  const onRecipientFieldFocus = useCallback(() => {
    track("SendRecipientFieldFocused");
  }, []);

  const onPressScan = useCallback(() => {
    navigation.navigate("ScanRecipient", {
      accountId: navigation.getParam("accountId"),
      parentId: navigation.getParam("parentId"),
      transaction,
    });
  }, [navigation, transaction]);

  const onChangeText = useCallback(
    recipient => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(bridge.updateTransaction(transaction, { recipient }));
    },
    [account, parentAccount, setTransaction, transaction],
  );
  const clear = useCallback(() => onChangeText(""), [onChangeText]);

  const onBridgeErrorCancel = useCallback(() => {
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    if (!transaction) return;
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);

  const onPressContinue = useCallback(async () => {
    if (!account) return;

    navigation.navigate("SendAmount", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [account, parentAccount, navigation, transaction]);

  const input = React.createRef();

  if (!account || !transaction) return null;

  const error = withoutHiddenError(status.errors.recipient);
  const warning = status.warnings.recipient;

  return (
    <>
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <TrackScreen category="SendFunds" name="SelectRecipient" />
        <SyncSkipUnderPriority priority={100} />
        <SyncOneAccountOnMount priority={100} accountId={account.id} />
        <KeyboardView style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
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
              <View style={styles.separatorLine} />
              <LText style={styles.separatorText}>
                {<Trans i18nKey="common.or" />}
              </LText>
              <View style={styles.separatorLine} />
            </View>
            <View style={styles.inputWrapper}>
              {/* make this a recipient component */}
              <TextInput
                placeholder={t("send.recipient.input")}
                placeholderTextColor={colors.fog}
                style={[
                  styles.addressInput,
                  error && styles.invalidAddressInput,
                  warning && styles.warning,
                ]}
                onFocus={onRecipientFieldFocus}
                onChangeText={onChangeText}
                onInputCleared={clear}
                value={transaction.recipient}
                ref={input}
                multiline
                blurOnSubmit
                autoCapitalize="none"
                clearButtonMode="always"
              />
            </View>
            {(error || warning) && (
              <LText
                style={[
                  styles.warningBox,
                  error ? styles.error : styles.warning,
                ]}
              >
                <TranslatedError error={error || warning} />
              </LText>
            )}
          </ScrollView>
          <View style={[styles.container, styles.containerFlexEnd]}>
            <Button
              event="SendRecipientContinue"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              disabled={bridgePending || !!error}
              pending={bridgePending}
              onPress={onPressContinue}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>

      <GenericErrorBottomModal
        error={bridgeError}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton
              containerStyle={styles.button}
              onPress={onBridgeErrorCancel}
            />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </>
  );
};

SendSelectRecipient.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("send.stepperHeader.recipientAddress")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "2",
        totalSteps: "6",
      })}
    />
  ),
};

const IconQRCode = ({ size, color }: { size: number, color: string }) => (
  <Icon name="qrcode" size={size} color={color} />
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  a: {},
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  separatorContainer: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  separatorLine: {
    flex: 1,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
    marginHorizontal: 8,
  },
  separatorText: {
    color: colors.grey,
  },
  containerFlexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  addressInput: {
    flex: 1,
    color: colors.darkBlue,
    ...getFontStyle({ semiBold: true }),
    fontSize: 20,
    paddingVertical: 16,
  },
  invalidAddressInput: {
    color: colors.alert,
  },
  warning: {
    color: colors.orange,
  },
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  error: {
    color: colors.alert,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});

export default compose(
  translate(),
  connect(accountAndParentScreenSelector),
)(SendSelectRecipient);
