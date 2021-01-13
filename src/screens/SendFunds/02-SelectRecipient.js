/* @flow */
import { RecipientRequired } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  SyncOneAccountOnMount,
  SyncSkipUnderPriority,
} from "@ledgerhq/live-common/lib/bridge/react";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Platform, StyleSheet, View, TouchableOpacity } from "react-native";
import Clipboard from "@react-native-community/clipboard";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import Paste from "../../icons/Paste";
import { track, TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";
import LText, { getFontStyle } from "../../components/LText";
import TextInput from "../../components/TextInput";
import InfoBox from "../../components/InfoBox";
import TranslatedError from "../../components/TranslatedError";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import NavigationScrollView from "../../components/NavigationScrollView";

const withoutHiddenError = error =>
  error instanceof RecipientRequired ? null : error;

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: string,
  transaction: Transaction,
  justScanned?: boolean,
};

export default function SendSelectRecipient({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => ({ account, parentAccount }));

  // handle changes from camera qr code
  const initialTransaction = useRef(transaction);
  const navigationTransaction = route.params?.transaction;
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
    navigation.navigate(ScreenName.ScanRecipient, {
      accountId: route.params?.accountId,
      parentId: route.params?.parentId,
      transaction,
    });
  }, [navigation, transaction, route.params]);

  const onChangeText = useCallback(
    recipient => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(bridge.updateTransaction(transaction, { recipient }));
    },
    [account, parentAccount, setTransaction, transaction],
  );
  const clear = useCallback(() => onChangeText(""), [onChangeText]);

  const [bridgeErr, setBridgeErr] = useState(bridgeError);

  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);

  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    if (!transaction) return;
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);

  const onPressContinue = useCallback(async () => {
    if (!account) return;

    navigation.navigate(ScreenName.SendAmount, {
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
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <TrackScreen category="SendFunds" name="SelectRecipient" />
        <SyncSkipUnderPriority priority={100} />
        <SyncOneAccountOnMount priority={100} accountId={account.id} />
        <KeyboardView style={{ flex: 1 }}>
          <NavigationScrollView
            style={[styles.container, { flex: 1 }]}
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
                  { borderBottomColor: colors.lightFog },
                ]}
              />
              <LText color="grey">{<Trans i18nKey="common.or" />}</LText>
              <View
                style={[
                  styles.separatorLine,
                  { borderBottomColor: colors.lightFog },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.pasteContainer}
              onPress={async () => {
                const text = await Clipboard.getString();
                onChangeText(text);
              }}
            >
              <Paste size={16} color={colors.live} />
              <LText style={styles.pasteTitle} semiBold color="live">
                <Trans i18nKey="common.paste" />
              </LText>
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              {/* make this a recipient component */}
              <TextInput
                placeholder={t("send.recipient.input")}
                placeholderTextColor={colors.fog}
                style={[
                  styles.addressInput,
                  { color: colors.darkBlue },
                  error && { color: colors.alert },
                  warning && { color: colors.orange },
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
                style={[styles.warningBox]}
                color={error ? "alert" : warning ? "orange" : "darkBlue"}
              >
                <TranslatedError error={error || warning} />
              </LText>
            )}
          </NavigationScrollView>
          <View style={styles.container}>
            {transaction.recipient && !(error || warning) ? (
              <View style={styles.infoBox}>
                <InfoBox>{t("send.recipient.verifyAddress")}</InfoBox>
              </View>
            ) : null}
            <Button
              event="SendRecipientContinue"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              disabled={bridgePending || !!status.errors.recipient}
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
}

const IconQRCode = ({ size, color }: { size: number, color: string }) => (
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
  pasteContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
    marginTop: 32,
  },
  pasteTitle: {
    marginLeft: 8,
  },
  infoBox: {
    marginBottom: 24,
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
  addressInput: {
    flex: 1,
    ...getFontStyle({ semiBold: true }),
    fontSize: 20,
    paddingVertical: 16,
  },
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
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
