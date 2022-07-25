// @flow

import React, { useCallback, useEffect, useRef, useState } from "react";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import { View, StyleSheet, Platform } from "react-native";
import { useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { Trans } from "react-i18next";
import ReactNativeModal from "react-native-modal";
import type {
  Account,
  TokenAccount,
  AccountLike,
} from "@ledgerhq/live-common/types/index";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import PreventNativeBack from "../../components/PreventNativeBack";
import LText from "../../components/LText/index";
import DisplayAddress from "../../components/DisplayAddress";
import Alert from "../../components/Alert";
import BottomModal from "../../components/BottomModal";
import QRcodeZoom from "../../icons/QRcodeZoom";
import Touchable from "../../components/Touchable";
import Button from "../../components/Button";
import CurrencyIcon from "../../components/CurrencyIcon";
import CopyLink from "../../components/CopyLink";
import ShareLink from "../../components/ShareLink";
import NavigationScrollView from "../../components/NavigationScrollView";
import { urls } from "../../config/urls";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";
import { rejectionOp } from "../../logic/debugReject";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import GenericErrorView from "../../components/GenericErrorView";

type Props = {
  account: ?(TokenAccount | Account),
  parentAccount: ?Account,
  navigation: any,
  route: { params: RouteParams },
  readOnlyModeEnabled: boolean,
};

type RouteParams = {
  account?: AccountLike,
  accountId: string,
  modelId: DeviceModelId,
  wired: boolean,
  device?: Device,
  onSuccess?: (address?: string) => void,
  onError?: () => void,
};

export default function ReceiveConfirmation({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const [verified, setVerified] = useState(false);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const onModalHide = useRef(() => {});
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(true);
  const sub = useRef();

  const { onSuccess, onError } = route.params;

  const verifyOnDevice = useCallback(
    async (device: Device): Promise<void> => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);

      sub.current = (mainAccount.id.startsWith("mock")
        ? // $FlowFixMe
          of({}).pipe(delay(1000), rejectionOp())
        : getAccountBridge(mainAccount).receive(mainAccount, {
            deviceId: device.deviceId,
            verify: true,
          })
      ).subscribe({
        complete: () => {
          setVerified(true);
          setAllowNavigation(true);
          onSuccess && onSuccess(mainAccount.freshAddress);
        },
        error: error => {
          if (error && error.name !== "UserRefusedAddress") {
            logger.critical(error);
          }
          setError(error);
          setIsModalOpened(true);
          setAllowNavigation(true);
          onError && onError();
        },
      });
    },
    [account, onError, onSuccess, parentAccount],
  );

  function onRetry(): void {
    if (isModalOpened) {
      setIsModalOpened(false);
      onModalHide.current = navigation.goBack;
    } else {
      navigation.goBack();
    }
  }

  function onModalClose(): void {
    setIsModalOpened(false);
    onModalHide.current = onDone;
  }

  function onZoom(): void {
    setZoom(!zoom);
  }

  function onDone(): void {
    const n = navigation.getParent();
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

    const { headerRight } = getStackNavigatorConfig(colors, true);
    navigation.setOptions({
      headerLeft: null,
      headerRight,
      gestureEnabled: Platform.OS === "ios",
    });
  }, [allowNavigation, colors, navigation]);

  useEffect(() => {
    const device = route.params.device;

    if (device && !verified) {
      verifyOnDevice(device);
    }
    setAllowNavigation(true);
  }, [route.params, verified, verifyOnDevice]);

  if (!account) return null;
  const { width } = getWindowDimensions();
  const unsafe = !route.params.device?.deviceId;
  const QRSize = Math.round(width / 1.8 - 16);
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(account);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ReceiveFunds"
        name="Confirmation"
        unsafe={unsafe}
        verified={verified}
        currencyName={currency.name}
      />
      {allowNavigation ? null : (
        <>
          <PreventNativeBack />
          <SkipLock />
        </>
      )}
      <NavigationScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Touchable event="QRZoom" onPress={onZoom}>
            {width < 350 ? (
              <View style={[styles.qrWrapper, styles.qrWrapperSmall]}>
                <QRcodeZoom size={72} />
              </View>
            ) : (
              <View
                style={[
                  styles.qrWrapper,
                  { borderColor: colors.lightFog },
                  dark ? { backgroundColor: "white" } : {},
                ]}
              >
                <QRCode
                  size={QRSize}
                  value={mainAccount.freshAddress}
                  ecl="H"
                />
              </View>
            )}
          </Touchable>
          <View>
            <LText style={styles.addressTitle} color="grey">
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
          {mainAccount.derivationMode === "taproot" ? (
            <View style={styles.taprootWarning}>
              <Alert type="warning">
                <Trans i18nKey="transfer.receive.taprootWarning" />
              </Alert>
            </View>
          ) : null}

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
          {unsafe ? (
            <Alert type="warning">
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
            </Alert>
          ) : verified ? (
            <Alert type="help" learnMoreUrl={urls.verifyTransactionDetails}>
              <Trans i18nKey="transfer.receive.verified" />
            </Alert>
          ) : (
            <Alert type="help">
              <Trans
                i18nKey="transfer.receive.verifyPending"
                values={{
                  currencyName: mainAccount.currency.managerAppName,
                }}
              />
            </Alert>
          )}
        </View>
      </NavigationScrollView>
      {verified && (
        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.lightFog,
              backgroundColor: colors.background,
            },
          ]}
        >
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
        <View style={[styles.qrZoomWrapper, { backgroundColor: "#FFF" }]}>
          <QRCode size={width - 66} value={mainAccount.freshAddress} ecl="H" />
        </View>
      </ReactNativeModal>
      <BottomModal
        id="ReceiveConfirmationModal"
        isOpened={isModalOpened}
        onClose={onModalClose}
        onModalHide={onModalHide.current}
      >
        {error ? (
          <View style={styles.modal}>
            <GenericErrorView error={error} />
            <View style={styles.buttonsContainer}>
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
      </BottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  addressTitle: {
    paddingTop: 16,
    fontSize: 14,
  },
  addressTitleBold: {
    paddingLeft: 8,
    fontSize: 16,
  },
  addressWrapper: {
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  address: {
    paddingTop: 24,
  },
  taprootWarning: {
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
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
    textAlign: "center",
  },
  modalDescription: {
    paddingTop: 16,
    marginBottom: 40,
    fontSize: 14,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "flex-end",
    flexGrow: 1,
  },
  button: {
    flexGrow: 1,
    marginHorizontal: 8,
  },
  bigButton: {
    flexGrow: 2,
  },
  footer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  learnmore: {
    paddingLeft: 8,
    paddingTop: 4,
  },
});
