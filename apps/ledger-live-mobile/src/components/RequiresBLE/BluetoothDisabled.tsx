import React, { useCallback, useContext } from "react";
import { Linking, Platform } from "react-native";
import { Icon } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import GenericInformationalDrawerContent from "../GenericInformationalDrawerContent";
import GenericInformationalView from "../GenericInformationalView";
import IsInDrawerContext from "~/context/IsInDrawerContext";

export type Props = {
  onRetry?: (() => void) | null;
  forceOpenSettings?: boolean;
};

/**
 * Renders a component that informs the user that they have disabled their bluetooth service.
 *
 * @param onRetry A callback for the user to retry enabling the service. If undefined or if forceOpenSettings is true,
 *   the user will be prompted to open the native settings.
 * @param forceOpenSettings Used mainly for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 */
const BluetoothDisabled: React.FC<Props> = ({ onRetry, forceOpenSettings = false }) => {
  const { t } = useTranslation();
  const { isInDrawer } = useContext(IsInDrawerContext);

  const openNativeBluetoothServiceSettings = useCallback(() => {
    Platform.OS === "ios"
      ? Linking.openURL("App-Prefs:Bluetooth")
      : Linking.sendIntent("android.settings.BLUETOOTH_SETTINGS");
  }, []);

  let onButtonPress;
  let buttonLabel;
  let buttonEvent;

  if (!onRetry || forceOpenSettings) {
    onButtonPress = openNativeBluetoothServiceSettings;
    buttonLabel = t("bluetooth.openSettings");
    buttonEvent = "BluetoothServiceDisabledOpenSettings";
  } else {
    onButtonPress = onRetry;
    buttonLabel = t("bluetooth.tryEnablingAgain");
    buttonEvent = "BluetoothServiceDisabledRetryAuthorize";
  }

  if (isInDrawer) {
    return (
      <GenericInformationalDrawerContent
        icon={<Icon name="Bluetooth" size={30} color="neutral.c100" />}
        title={t("bluetooth.required")}
        description={t("bluetooth.checkEnabled")}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <GenericInformationalView
      title={t("bluetooth.required")}
      icon={<Icon name="Bluetooth" size={30} color="neutral.c100" />}
      description={t("bluetooth.checkEnabled")}
      primaryButtonLabel={buttonLabel}
      onPrimaryButtonPress={onButtonPress}
      primaryButtonEvent={buttonEvent}
    />
  );
};

export default BluetoothDisabled;
