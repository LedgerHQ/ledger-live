import React, { useCallback, useContext } from "react";
import { Icon } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import GenericInformationalDrawerContent from "../GenericInformationalDrawerContent";
import GenericInformationalView from "../GenericInformationalView";
import IsInDrawerContext from "~/context/IsInDrawerContext";

type Props = {
  onRetry?: (() => void) | null;
  neverAskAgain?: boolean;
  forceOpenSettings?: boolean;
};

/**
 * Renders a component that informs the user that they have denied the app permissions to use Bluetooth.
 *
 * If the user has selected/triggered "Don't ask again", the user will be prompted to open the native settings
 *
 * @param onRetry A callback for the user to retry allowing the permissions, if neverAskAgain and forceOpenSettings are false.
 *   Otherwise, the user will be prompted to open the native settings.
 * @param neverAskAgain If true, the user has denied the app permission to use Bluetooth and has selected "Don't ask again". Default to true.
 * @param forceOpenSettings Used mainly for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 */
const BluetoothPermissionsDenied: React.FC<Props> = ({
  onRetry,
  neverAskAgain = true,
  forceOpenSettings = false,
}) => {
  const { t } = useTranslation();
  const { isInDrawer } = useContext(IsInDrawerContext);
  const openNativeSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  let description;
  let buttonLabel;
  let onButtonPress;
  let buttonEvent;

  if (neverAskAgain || !onRetry || forceOpenSettings) {
    description = t("permissions.bluetooth.modalDescriptionSettingsVariant");
    buttonLabel = t("permissions.bluetooth.modalButtonLabelSettingsVariant");
    onButtonPress = openNativeSettings;
    buttonEvent = "BluetoothPermissionDeniedOpenSettings";
  } else {
    onButtonPress = onRetry;
    description = t("permissions.bluetooth.modalDescriptionBase");
    buttonLabel = t("permissions.bluetooth.modalButtonLabelBase");
    buttonEvent = "BluetoothPermissionDeniedRetryAuthorize";
  }

  if (isInDrawer) {
    return (
      <GenericInformationalDrawerContent
        icon={<Icon name="Bluetooth" size={30} color="neutral.c100" />}
        title={t("permissions.bluetooth.modalTitle")}
        description={description}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <GenericInformationalView
      title={t("permissions.bluetooth.modalTitle")}
      icon={<Icon name="Bluetooth" size={30} color="neutral.c100" />}
      description={t("bluetooth.checkEnabled")}
      primaryButtonLabel={buttonLabel}
      onPrimaryButtonPress={onButtonPress}
      primaryButtonEvent={buttonEvent}
    />
  );
};

export default BluetoothPermissionsDenied;
