import React, { useCallback } from "react";
import { Linking, Platform } from "react-native";
import { IconBox, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";
import ServiceDisabledView from "../ServiceDisabledView";
import GenericDrawerContent from "../GenericDrawerContent";

export type Props = {
  hasBackButton?: boolean;
  onRetry?: (() => void) | null;
  openSettings?: boolean;
  componentType?: "drawer" | "view";
};

/**
 * Renders a component that informs the user that they have disabled their bluetooth service.
 *
 * @param onRetry A callback for the user to retry enabling the service. If undefined or if openSettings is true,
 *   the user will be prompted to open the native settings.
 * @param hasBackButton If true, a back button will be displayed in the header. Default to false.
 * @param openSettings Used for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 * @returns
 */
const BluetoothDisabled: React.FC<Props> = ({
  onRetry,
  hasBackButton = false,
  openSettings = false,
  componentType = "view",
}) => {
  const { t } = useTranslation();

  const openNativeBluetoothServiceSettings = useCallback(() => {
    Platform.OS === "ios"
      ? Linking.openURL("App-Prefs:Bluetooth")
      : Linking.sendIntent("android.settings.BLUETOOTH_SETTINGS");
  }, []);

  let onButtonPress;
  let ButtonIcon;
  let buttonLabel;
  let buttonEvent;

  if (!onRetry || openSettings) {
    onButtonPress = openNativeBluetoothServiceSettings;
    ButtonIcon = Icons.SettingsMedium;
    buttonLabel = t("bluetooth.openSettings");
    buttonEvent = "BluetoothServiceDisabledOpenSettings";
  } else {
    onButtonPress = onRetry;
    buttonLabel = t("bluetooth.tryEnablingAgain");
    buttonEvent = "BluetoothServiceDisabledRetryAuthorize";
  }

  if (componentType === "drawer") {
    return (
      <GenericDrawerContent
        iconType="error"
        title={t("bluetooth.required")}
        description={t("bluetooth.checkEnabled")}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <ServiceDisabledView
      title={t("bluetooth.required")}
      TitleIcon={<IconBox Icon={BluetoothMedium} iconSize={24} boxSize={64} />}
      description={t("bluetooth.checkEnabled")}
      hasBackButton={hasBackButton}
      ButtonIcon={ButtonIcon}
      buttonLabel={buttonLabel}
      onButtonPress={onButtonPress}
      buttonEvent={buttonEvent}
    />
  );
};

export default BluetoothDisabled;
