// @flow
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { WrongDeviceForAccount, UnexpectedBootloader } from "@ledgerhq/errors";
import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type { AppRequest } from "@ledgerhq/live-common/lib/hw/actions/app";
import { urls } from "../../config/urls";
import LText from "../LText";
import Alert from "../Alert";
import getWindowDimensions from "../../logic/getWindowDimensions";
import Spinning from "../Spinning";
import BigSpinner from "../../icons/BigSpinner";
import { lighten } from "../../colors";
import Button from "../Button";
import { NavigatorName, ScreenName } from "../../const";
import Animation from "../Animation";
import getDeviceAnimation from "./getDeviceAnimation";
import GenericErrorView from "../GenericErrorView";
import Circle from "../Circle";
import { MANAGER_TABS } from "../../screens/Manager/Manager";
import ExternalLink from "../ExternalLink";
import { track } from "../../analytics";

type RawProps = {
  t: (key: string, options?: { [key: string]: string | number }) => string,
  colors?: *,
  theme?: "light" | "dark",
};

export function renderRequestQuitApp({
  t,
  device,
  theme,
}: {
  ...RawProps,
  device: Device,
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.animationContainer}>
        <Animation
          source={getDeviceAnimation({ device, key: "quitApp", theme })}
        />
      </View>
      <LText style={styles.text} semiBold>
        {t("DeviceAction.quitApp")}
      </LText>
    </View>
  );
}

export function renderRequiresAppInstallation({
  t,
  navigation,
  appNames,
}: {
  ...RawProps,
  navigation: any,
  appNames: string[],
}) {
  const appNamesCSV = appNames.join(", ");

  return (
    <View style={styles.wrapper}>
      <LText style={styles.text} semiBold>
        {t("DeviceAction.appNotInstalled", {
          appName: appNamesCSV,
          count: appNames.length,
        })}
      </LText>
      <View style={styles.actionContainer}>
        <Button
          event="DeviceActionRequiresAppInstallationOpenManager"
          type="primary"
          title={t("DeviceAction.button.openManager")}
          onPress={() =>
            navigation.navigate(NavigatorName.Manager, {
              screen: ScreenName.Manager,
              params: { searchQuery: appNamesCSV },
            })
          }
          containerStyle={styles.button}
        />
      </View>
    </View>
  );
}

export function renderVerifyAddress({
  t,
  device,
  currencyName,
  onPress,
  address,
  theme,
}: {
  ...RawProps,
  device: Device,
  currencyName: string,
  onPress?: () => void,
  address?: string,
}) {
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.animationContainer,
          device.modelId !== "blue" ? styles.verifyAddress : undefined,
        ]}
      >
        <Animation
          source={getDeviceAnimation({ device, key: "validate", theme })}
        />
      </View>
      <LText style={[styles.text, styles.title]} semiBold>
        {t("DeviceAction.verifyAddress.title")}
      </LText>
      <LText style={[styles.text, styles.description]} color="grey">
        {t("DeviceAction.verifyAddress.description", { currencyName })}
      </LText>
      <View style={styles.actionContainer}>
        {onPress && (
          <Button
            event="DeviceActionVerifyAddress"
            type="primary"
            title={t("common.continue")}
            onPress={onPress}
            containerStyle={styles.button}
          />
        )}
        {address && (
          <View>
            <LText bold style={[styles.text, styles.title]}>
              {address}
            </LText>
          </View>
        )}
      </View>
    </View>
  );
}

export function renderConfirmSwap({
  t,
  device,
  theme,
}: {
  ...RawProps,
  device: Device,
}) {
  return (
    <View style={[styles.wrapper, { width: "100%" }]}>
      <Alert type="primary" learnMoreUrl={urls.swap.learnMore}>
        {t("DeviceAction.confirmSwap.alert")}
      </Alert>
      <View
        style={[
          { marginTop: 16 },
          styles.animationContainer,
          device.modelId !== "blue" ? styles.verifyAddress : undefined,
        ]}
      >
        <Animation
          source={getDeviceAnimation({ device, key: "validate", theme })}
        />
      </View>
      <LText style={[styles.text, styles.title]} semiBold>
        {t("DeviceAction.confirmSwap.title")}
      </LText>
    </View>
  );
}

export function renderConfirmSell({
  t,
  device,
}: {
  ...RawProps,
  device: Device,
}) {
  return (
    <View style={styles.wrapper}>
      <Alert type="primary" learnMoreUrl={urls.swap.learnMore}>
        {t("DeviceAction.confirmSell.alert")}
      </Alert>
      <View
        style={[
          { marginTop: 16 },
          styles.animationContainer,
          device.modelId !== "blue" ? styles.verifyAddress : undefined,
        ]}
      >
        <Animation source={getDeviceAnimation({ device, key: "validate" })} />
      </View>
      <LText style={[styles.text, styles.title]} semiBold>
        {t("DeviceAction.confirmSell.title")}
      </LText>
    </View>
  );
}

export function renderAllowManager({
  t,
  wording,
  device,
  theme,
}: {
  ...RawProps,
  wording: string,
  device: Device,
}) {
  // TODO: disable gesture, modal close, hide header buttons
  return (
    <View style={styles.wrapper}>
      <View style={styles.animationContainer}>
        <Animation
          source={getDeviceAnimation({ device, key: "allowManager", theme })}
        />
      </View>
      <LText style={styles.text} semiBold>
        {t("DeviceAction.allowManagerPermission", { wording })}
      </LText>
    </View>
  );
}

const AllowOpeningApp = ({
  t,
  navigation,
  wording,
  tokenContext,
  isDeviceBlocker,
  device,
  theme,
}: {
  ...RawProps,
  navigation: any,
  wording: string,
  tokenContext?: ?TokenCurrency,
  isDeviceBlocker?: boolean,
  device: Device,
}) => {
  useEffect(() => {
    if (isDeviceBlocker) {
      // TODO: disable gesture, modal close, hide header buttons
      navigation.setOptions({
        gestureEnabled: false,
      });
    }
  }, [isDeviceBlocker, navigation]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.animationContainer}>
        <Animation
          source={getDeviceAnimation({ device, key: "openApp", theme })}
        />
      </View>
      <LText style={styles.text} semiBold>
        {t("DeviceAction.allowAppPermission", { wording })}
      </LText>
      {tokenContext ? (
        <LText style={styles.text} semiBold>
          {t("DeviceAction.allowAppPermissionSubtitleToken", {
            token: tokenContext.name,
          })}
        </LText>
      ) : null}
    </View>
  );
};

export function renderAllowOpeningApp({
  t,
  navigation,
  wording,
  tokenContext,
  isDeviceBlocker,
  device,
  theme,
}: {
  ...RawProps,
  navigation: any,
  wording: string,
  tokenContext?: ?TokenCurrency,
  isDeviceBlocker?: boolean,
  device: Device,
}) {
  return (
    <AllowOpeningApp
      t={t}
      navigation={navigation}
      wording={wording}
      tokenContext={tokenContext}
      isDeviceBlocker={isDeviceBlocker}
      device={device}
      theme={theme}
    />
  );
}

export function renderInWrongAppForAccount({
  t,
  onRetry,
  colors,
  theme,
}: {
  ...RawProps,
  onRetry?: () => void,
}) {
  return renderError({
    t,
    error: new WrongDeviceForAccount(),
    onRetry,
    colors,
    theme,
  });
}

export function renderError({
  t,
  error,
  onRetry,
  managerAppName,
  navigation,
}: {
  ...RawProps,
  navigation?: any,
  error: Error,
  onRetry?: () => void,
  managerAppName?: string,
}) {
  const onPress = () => {
    if (managerAppName && navigation) {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.Manager,
        params: {
          tab: MANAGER_TABS.INSTALLED_APPS,
          updateModalOpened: true,
        },
      });
    } else if (onRetry) {
      onRetry();
    }
  };
  return (
    <View style={styles.wrapper}>
      <GenericErrorView error={error} withDescription withIcon />
      {onRetry || managerAppName ? (
        <View style={styles.actionContainer}>
          <Button
            event="DeviceActionErrorRetry"
            type="primary"
            title={
              managerAppName
                ? t("DeviceAction.button.openManager")
                : t("common.retry")
            }
            onPress={onPress}
            containerStyle={styles.button}
          />
        </View>
      ) : null}
    </View>
  );
}

export function renderConnectYourDevice({
  t,
  unresponsive,
  device,
  theme,
  onSelectDeviceLink,
}: {
  ...RawProps,
  unresponsive: boolean,
  device: Device,
  onSelectDeviceLink?: () => void,
}) {
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.animationContainer,
          device.modelId !== "blue" ? styles.connectDeviceContainer : undefined,
        ]}
      >
        <Animation
          source={getDeviceAnimation({
            device,
            key: unresponsive ? "enterPinCode" : "plugAndPinCode",
            theme,
          })}
        />
      </View>
      {device.deviceName && (
        <LText style={[styles.text, styles.connectDeviceName]} semiBold>
          {device.deviceName}
        </LText>
      )}
      <LText style={[styles.text, styles.connectDeviceLabel]} semiBold>
        {t(
          unresponsive
            ? "DeviceAction.unlockDevice"
            : device.wired
            ? "DeviceAction.connectAndUnlockDevice"
            : "DeviceAction.turnOnAndUnlockDevice",
        )}
      </LText>
      {onSelectDeviceLink ? (
        <View style={styles.connectDeviceExtraContentWrapper}>
          <ExternalLink
            text={t("DeviceAction.useAnotherDevice")}
            onPress={onSelectDeviceLink}
          />
        </View>
      ) : null}
    </View>
  );
}

export function renderLoading({
  t,
  description,
}: {
  ...RawProps,
  description?: string,
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.spinnerContainer}>
        <Spinning clockwise>
          <BigSpinner />
        </Spinning>
      </View>
      <LText semiBold style={styles.text}>
        {description ?? t("DeviceAction.loading")}
      </LText>
    </View>
  );
}

export function LoadingAppInstall({
  analyticsPropertyFlow = "unknown",
  request,
  ...props
}: {
  ...RawProps,
  analyticsPropertyFlow: string,
  description?: string,
  request?: AppRequest,
}) {
  const currency = request?.currency || request?.account?.currency;
  const appName = request?.appName || currency?.managerAppName;
  useEffect(() => {
    const trackingArgs = [
      "In-line app install",
      { appName, flow: analyticsPropertyFlow },
    ];
    track(...trackingArgs);
  }, [appName, analyticsPropertyFlow]);
  return renderLoading(props);
}

type WarningOutdatedProps = {
  ...RawProps,
  colors: *,
  navigation: any,
  appName: string,
  passWarning: () => void,
};

export function renderWarningOutdated({
  t,
  navigation,
  appName,
  passWarning,
  colors,
}: WarningOutdatedProps) {
  function onOpenManager() {
    navigation.navigate(NavigatorName.Manager);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.iconContainer}>
        <Circle size={60} bg={lighten(colors.yellow, 0.4)}>
          <Icon size={28} name="alert-triangle" color={colors.yellow} />
        </Circle>
      </View>

      <LText style={[styles.text, styles.title]} bold>
        {t("DeviceAction.outdated")}
      </LText>
      <LText style={[styles.text, styles.description]} semiBold color="grey">
        {t("DeviceAction.outdatedDesc", { appName })}
      </LText>
      <View style={styles.actionContainer}>
        <Button
          event="DeviceActionWarningOutdatedOpenManager"
          type="primary"
          title={t("DeviceAction.button.openManager")}
          onPress={onOpenManager}
          containerStyle={styles.button}
        />
        <Button
          event="DeviceActionWarningOutdatedContinue"
          type="secondary"
          title={t("common.continue")}
          onPress={passWarning}
          outline={false}
          containerStyle={styles.button}
        />
      </View>
    </View>
  );
}

export function renderBootloaderStep({ t, colors, theme }: RawProps) {
  return renderError({
    t,
    error: new UnexpectedBootloader(),
    colors,
    theme,
  });
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  anim: {
    width: getWindowDimensions().width - 2 * 16,
  },
  text: {
    textAlign: "center",
  },
  iconContainer: {
    margin: 16,
  },
  title: {
    padding: 8,
    fontSize: 16,
  },
  description: {
    padding: 8,
  },
  spinnerContainer: {
    padding: 24,
  },
  button: {
    margin: 8,
  },
  actionContainer: {
    alignSelf: "stretch",
  },
  animationContainer: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  connectDeviceContainer: {
    height: 100,
  },
  connectDeviceName: {
    marginBottom: 8,
    fontSize: 15,
  },
  connectDeviceLabel: {
    fontSize: 20,
  },
  verifyAddress: {
    height: 72,
  },
  connectDeviceExtraContentWrapper: {
    marginTop: 36,
  },
});
