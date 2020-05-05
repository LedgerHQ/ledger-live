// @flow

import React, { useCallback, useEffect, useRef, useState } from "react";
import { from, of } from "rxjs";
import { delay } from "rxjs/operators";
import { View, StyleSheet, Linking, Platform } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { Trans } from "react-i18next";
import ReactNativeModal from "react-native-modal";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import type { DeviceModelId } from "@ledgerhq/devices";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import PreventNativeBack from "../../components/PreventNativeBack";
import LText from "../../components/LText/index";
import DisplayAddress from "../../components/DisplayAddress";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";
import BottomModal from "../../components/BottomModal";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import Close from "../../icons/Close";
import QRcodeZoom from "../../icons/QRcodeZoom";
import Touchable from "../../components/Touchable";
import TranslatedError from "../../components/TranslatedError";
import Button from "../../components/Button";
import CurrencyIcon from "../../components/CurrencyIcon";
import CopyLink from "../../components/CopyLink";
import ShareLink from "../../components/ShareLink";
import NavigationScrollView from "../../components/NavigationScrollView";
import { urls } from "../../config/urls";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";
import { rejectionOp } from "../../components/DebugRejectSwitch";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";

const forceInset = { bottom: "always" };

type Props = {
  account: ?(TokenAccount | Account),
  parentAccount: ?Account,
  navigation: any,
  route: { params: RouteParams },
  readOnlyModeEnabled: boolean,
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  modelId: DeviceModelId,
  wired: boolean,
};

export default function ReceiveConfirmation({ navigation, route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const [verified, setVerified] = useState(false);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [onModalHide, setOnModalHide] = useState(() => {});
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(true);

  const sub = useRef();

  const verifyOnDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);

      sub.current = withDevice(deviceId)(transport =>
        mainAccount.id.startsWith("mock")
          ? // $FlowFixMe
            of({}).pipe(delay(1000), rejectionOp())
          : from(
              getAddress(transport, {
                derivationMode: mainAccount.derivationMode,
                currency: mainAccount.currency,
                path: mainAccount.freshAddressPath,
                verify: true,
              }),
            ),
      ).subscribe({
        complete: () => {
          setVerified(true);
          setAllowNavigation(true);
        },
        error: error => {
          if (error && error.name !== "UserRefusedAddress") {
            logger.critical(error);
          }
          setError(error);
          setIsModalOpened(true);
          setAllowNavigation(true);
        },
      });
    },
    [account, parentAccount],
  );

  function contactUs(): void {
    Linking.openURL(urls.contact);
  }

  function onRetry(): void {
    if (isModalOpened) {
      setIsModalOpened(false);
      setOnModalHide(navigation.goBack);
    } else {
      navigation.goBack();
    }
  }

  function onModalClose(): void {
    setIsModalOpened(false);
    setOnModalHide(onDone);
  }

  function onZoom(): void {
    setZoom(!zoom);
  }

  function onDone(): void {
    const n = navigation.dangerouslyGetParent();
    if (n) {
      n.pop();
    }
  }

  useEffect(() => {
    if (!allowNavigation) {
      navigation.setOptions({
        headerLeft: null,
        headerRight: () => null,
        gestureEnabled: false,
      });
      return;
    }

    const { headerLeft, headerRight } = closableStackNavigatorConfig;
    navigation.setOptions({
      headerLeft,
      headerRight,
      gestureEnabled: Platform.OS === "ios",
    });
  }, [allowNavigation, navigation]);

  useEffect(() => {
    const deviceId = route.params?.deviceId;

    if (deviceId) {
      setAllowNavigation(false);
      verifyOnDevice(deviceId);
    } else {
      setAllowNavigation(true);
    }

    return () => {
      if (sub.current) {
        sub.current.unsubscribe();
      }
    };
  }, [route.params, account, parentAccount, verifyOnDevice]);

  if (!account) return null;
  const { width } = getWindowDimensions();
  const unsafe = !route.params?.deviceId;
  const QRSize = Math.round(width / 1.8 - 16);
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(account);

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen
        category="ReceiveFunds"
        name="Confirmation"
        unsafe={unsafe}
        verified={verified}
      />
      {allowNavigation ? null : (
        <>
          <PreventNativeBack />
          <SkipLock />
        </>
      )}
      <NavigationScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.root}
      >
        <View style={styles.container}>
          <Touchable event="QRZoom" onPress={onZoom}>
            {width < 350 ? (
              <View style={[styles.qrWrapper, styles.qrWrapperSmall]}>
                <QRcodeZoom size={72} />
              </View>
            ) : (
              <View style={styles.qrWrapper}>
                <QRCode
                  size={QRSize}
                  value={mainAccount.freshAddress}
                  ecl="H"
                />
              </View>
            )}
          </Touchable>
          <View>
            <LText style={styles.addressTitle}>
              <Trans i18nKey="transfer.receive.address" />
            </LText>
          </View>
          <View style={styles.addressWrapper}>
            <CurrencyIcon currency={currency} size={20} />
            <LText semiBold style={styles.addressTitleBold}>
              {getAccountName(account)}
            </LText>
          </View>
          <View style={styles.address}>
            <DisplayAddress
              address={mainAccount.freshAddress}
              verified={verified}
            />
          </View>
          <View style={styles.copyLink}>
            <CopyLink
              style={styles.copyShare}
              string={mainAccount.freshAddress}
              replacement={<Trans i18nKey="transfer.receive.addressCopied" />}
            >
              <Trans i18nKey="transfer.receive.copyAddress" />
            </CopyLink>
            <View style={styles.copyShare}>
              <ShareLink value={mainAccount.freshAddress}>
                <Trans i18nKey="transfer.receive.shareAddress" />
              </ShareLink>
            </View>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <VerifyAddressDisclaimer
            unsafe={unsafe}
            verified={verified}
            action={
              verified ? (
                <Touchable
                  event="ReceiveVerifyTransactionHelp"
                  onPress={() => Linking.openURL(urls.verifyTransactionDetails)}
                >
                  <LText semiBold style={styles.learnmore}>
                    <Trans i18nKey="common.learnMore" />
                  </LText>
                </Touchable>
              ) : null
            }
            text={
              unsafe ? (
                <Trans
                  i18nKey={
                    readOnlyModeEnabled
                      ? "transfer.receive.readOnly.verify"
                      : "transfer.receive.verifySkipped"
                  }
                  values={{
                    accountType: mainAccount.currency.managerAppName,
                  }}
                />
              ) : verified ? (
                <Trans i18nKey="transfer.receive.verified" />
              ) : (
                <Trans
                  i18nKey="transfer.receive.verifyPending"
                  values={{
                    currencyName: mainAccount.currency.managerAppName,
                  }}
                />
              )
            }
          />
        </View>
      </NavigationScrollView>
      {verified && (
        <View style={styles.footer}>
          <Button
            event="ReceiveDone"
            containerStyle={styles.button}
            onPress={onDone}
            type="secondary"
            title={<Trans i18nKey="common.close" />}
          />
          <Button
            event="ReceiveVerifyAgain"
            containerStyle={styles.bigButton}
            type="primary"
            title={<Trans i18nKey="transfer.receive.verifyAgain" />}
            onPress={onRetry}
          />
        </View>
      )}
      <ReactNativeModal
        isVisible={zoom}
        onBackdropPress={onZoom}
        onBackButtonPress={onZoom}
        useNativeDriver
        hideModalContentWhileAnimating
      >
        <View style={styles.qrZoomWrapper}>
          <QRCode size={width - 66} value={mainAccount.freshAddress} ecl="H" />
        </View>
      </ReactNativeModal>
      <BottomModal
        id="ReceiveConfirmationModal"
        isOpened={isModalOpened}
        onClose={onModalClose}
        onModalHide={onModalHide}
      >
        {error ? (
          <View style={styles.modal}>
            <View style={styles.modalBody}>
              <View style={styles.modalIcon}>
                <DeviceNanoAction
                  modelId={route.params?.modelId}
                  wired={route.params?.wired}
                  error={error}
                />
              </View>
              <LText secondary semiBold style={styles.modalTitle}>
                <TranslatedError error={error} />
              </LText>
              <LText style={styles.modalDescription}>
                <TranslatedError error={error} field="description" />
              </LText>
            </View>
            <View style={styles.buttonsContainer}>
              <Button
                event="ReceiveContactUs"
                type="secondary"
                title={<Trans i18nKey="common.contactUs" />}
                containerStyle={styles.button}
                onPress={contactUs}
              />
              <Button
                event="ReceiveRetry"
                type="primary"
                title={<Trans i18nKey="common.retry" />}
                containerStyle={styles.bigButton}
                onPress={onRetry}
              />
            </View>
          </View>
        ) : null}
        <Touchable
          event="ReceiveClose"
          style={styles.close}
          onPress={onModalClose}
        >
          <Close color={colors.fog} size={20} />
        </Touchable>
      </BottomModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 32,
  },
  qrWrapper: {
    borderWidth: 1,
    borderColor: colors.lightFog,
    padding: 16,
    borderRadius: 4,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: 4,
    },
  },
  qrWrapperSmall: {
    padding: 8,
  },
  qrZoomWrapper: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  addressTitle: {
    paddingTop: 16,
    fontSize: 14,
    color: colors.grey,
  },
  addressTitleBold: {
    paddingLeft: 8,
    fontSize: 16,
    color: colors.darkBlue,
  },
  addressWrapper: {
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  address: {
    paddingTop: 24,
  },
  copyLink: {
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  copyShare: {
    paddingHorizontal: 12,
  },
  modal: {
    flexDirection: "column",
  },
  modalBody: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalIcon: {
    paddingTop: 20,
  },
  modalTitle: {
    paddingTop: 40,
    fontSize: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
  modalDescription: {
    paddingTop: 16,
    marginBottom: 40,
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "flex-end",
    flexGrow: 1,
  },
  button: {
    flexGrow: 1,
    marginHorizontal: 8,
  },
  bigButton: {
    flexGrow: 2,
    marginHorizontal: 8,
  },
  footer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopColor: colors.lightFog,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  learnmore: {
    color: colors.live,
    paddingLeft: 8,
    paddingTop: 4,
  },
});
