import React, { useCallback } from "react";
import { IconBox, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";
import ServicePermissionDeniedView from "../ServicePermissionDeniedView";
import InformationalMessageDrawerContent from "../InformationalMessageDrawerContent";

type Props = {
  onRetry?: (() => void) | null;
  neverAskAgain?: boolean;
  hasBackButton?: boolean;
  openSettings?: boolean;
  componentType?: "drawer" | "view";
};

/**
 * Renders a component that informs the user that they have denied the app permission to use Bluetooth.
 *
 * If the user has selected/triggered "Don't ask again", the user will be prompted to open the native settings
 *
 * @param onRetry A callback for the user to retry allowing the permission, if neverAskAgain and openSettings are false.
 *   Otherwise, the user will be prompted to open the native settings.
 * @param hasBackButton If true, a back button will be displayed in the header. Default to false.
 * @param neverAskAgain If true, the user has denied the app permission to use Bluetooth and has selected "Don't ask again". Default to true.
 * @param openSettings Used for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 * @param componentType If "drawer", the component will be rendered as a content to be rendered in a drawer.
 *   If "view", the component will be rendered as a view. Defaults to "view".
 */
const BluetoothPermissionDenied: React.FC<Props> = ({
  onRetry,
  neverAskAgain = true,
  hasBackButton = false,
  openSettings = false,
  componentType = "view",
}) => {
  const { t } = useTranslation();
  const openNativeSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  let description;
  let buttonLabel;
  let ButtonIcon;
  let onButtonPress;
  let buttonEvent;

  if (neverAskAgain || !onRetry || openSettings) {
    description = t("permissions.bluetooth.modalDescriptionSettingsVariant");
    buttonLabel = t("permissions.bluetooth.modalButtonLabelSettingsVariant");
    ButtonIcon = Icons.SettingsMedium;
    onButtonPress = openNativeSettings;
    buttonEvent = "BluetoothPermissionDeniedOpenSettings";
  } else {
    onButtonPress = onRetry;
    description = t("permissions.bluetooth.modalDescriptionBase");
    buttonLabel = t("permissions.bluetooth.modalButtonLabelBase");
    buttonEvent = "BluetoothPermissionDeniedRetryAuthorize";
  }

  if (componentType === "drawer") {
    return (
      <InformationalMessageDrawerContent
        iconType="error"
        title={t("permissions.bluetooth.modalTitle")}
        description={description}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <ServicePermissionDeniedView
      title={t("permissions.bluetooth.modalTitle")}
      TitleIcon={<IconBox Icon={BluetoothMedium} iconSize={24} boxSize={64} />}
      description={description}
      hasBackButton={hasBackButton}
      ButtonIcon={ButtonIcon}
      buttonLabel={buttonLabel}
      onButtonPress={onButtonPress}
      buttonEvent={buttonEvent}
    />
  );
};

export default BluetoothPermissionDenied;
