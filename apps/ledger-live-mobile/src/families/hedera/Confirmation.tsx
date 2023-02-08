import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { Trans } from "react-i18next";
import ReactNativeModal from "react-native-modal";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import PreventNativeBack from "../../components/PreventNativeBack";
import LText from "../../components/LText/index";
import DisplayAddress from "../../components/DisplayAddress";
import Alert from "../../components/Alert";
import QueuedDrawer from "../../components/QueuedDrawer";
import Close from "../../icons/Close";
import QRcodeZoom from "../../icons/QRcodeZoom";
import Touchable from "../../components/Touchable";
import Button from "../../components/Button";
import CurrencyIcon from "../../components/CurrencyIcon";
import CopyLink from "../../components/CopyLink";
import ShareLink from "../../components/ShareLink";
import NavigationScrollView from "../../components/NavigationScrollView";
import SkipLock from "../../components/behaviour/SkipLock";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import GenericErrorView from "../../components/GenericErrorView";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "../../const";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";

type ScreenProps = CompositeScreenProps<
  StackNavigatorProps<
    ReceiveFundsStackParamList,
    ScreenName.ReceiveConfirmation | ScreenName.ReceiveVerificationConfirmation
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  readOnlyModeEnabled?: boolean;
} & ScreenProps;

export default function ReceiveConfirmation({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const [verified] = useState(false);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const onModalHide = useRef(() => {
    /* ignore */
  });
  const [error] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [allowNavigation] = useState(true);

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
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      ?.pop();
  }

  useEffect(() => {
    if (!allowNavigation) {
      navigation.setOptions({
        headerLeft: undefined,
        headerRight: () => null,
        gestureEnabled: false,
      });
      return;
    }

    const { headerRight } = getStackNavigatorConfig(colors, true);
    navigation.setOptions({
      headerLeft: undefined,
      headerRight,
      gestureEnabled: Platform.OS === "ios",
    });
  }, [allowNavigation, colors, navigation]);
  if (!account) return null;
  const { width } = getWindowDimensions();
  const unsafe = !route.params.device?.deviceId;
  const QRSize = Math.round(width / 1.8 - 16);
  const mainAccount = getMainAccount(account, parentAccount);
  const address = mainAccount.freshAddress;
  const currency = getAccountCurrency(account);
  const name = mainAccount.name;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
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
      <NavigationScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={styles.root}
      >
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
                  {
                    borderColor: colors.lightFog,
                  },
                  dark
                    ? {
                        backgroundColor: "white",
                      }
                    : {},
                ]}
              >
                <QRCode size={QRSize} value={address} ecl="H" />
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
            <DisplayAddress address={address} verified={verified} />
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
              string={address}
              replacement={<Trans i18nKey="transfer.receive.addressCopied" />}
            >
              <Trans i18nKey="transfer.receive.copyAddress" />
            </CopyLink>
            <View style={styles.copyShare}>
              <ShareLink value={address}>
                <Trans i18nKey="transfer.receive.shareAddress" />
              </ShareLink>
            </View>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          {/* warning message for unverified address */}
          {
            <Alert type="security">
              <Trans
                i18nKey="hedera.currentAddress.messageIfVirtual"
                values={{
                  name,
                }}
              />
            </Alert>
          }
        </View>
      </NavigationScrollView>
      <ReactNativeModal
        isVisible={zoom}
        onBackdropPress={onZoom}
        onBackButtonPress={onZoom}
        useNativeDriver
        hideModalContentWhileAnimating
      >
        <View
          style={[
            styles.qrZoomWrapper,
            {
              backgroundColor: "#FFF",
            },
          ]}
        >
          <QRCode size={width - 66} value={address} ecl="H" />
        </View>
      </ReactNativeModal>
      <QueuedDrawer
        isRequestingToBeOpened={isModalOpened}
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
        <Touchable
          event="ReceiveClose"
          style={styles.close}
          onPress={onModalClose}
        >
          <Close color={colors.fog} size={20} />
        </Touchable>
      </QueuedDrawer>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
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
      width: 0,
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
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  learnmore: {
    paddingLeft: 8,
    paddingTop: 4,
  },
});
