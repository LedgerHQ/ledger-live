import { Icons } from "@ledgerhq/native-ui";
import { StyleProp, ViewStyle } from "react-native";
import {
  UserRefusedFirmwareUpdate,
  ManagerDeviceLockedError,
  LockedDeviceError,
  UserRefusedDeviceNameChange,
  UpdateYourApp,
} from "@ledgerhq/errors";

import {
  BluetoothNotSupportedError,
  DeviceNotOnboarded,
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
} from "@ledgerhq/live-common/errors";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";
import { NavigatorName, ScreenName } from "../const";
import { MANAGER_TABS } from "../const/manager";

type Props = {
  size?: number | string;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

type ErrorRenderData = {
  Icon: (p: Props) => JSX.Element;
  iconColor: string;
  hasExportLogs: boolean;
  onPrimaryPressOverride: (() => void) | undefined;
};

export type LedgerError =
  | LedgerErrorConstructor<{ [key: string]: unknown }>
  | LedgerErrorConstructor<{ currencyName: string }>;

/**
 * Nb If you are adding an override to a specific error class, please update
 * the array below too. It's used by the DebugErrors screen to indicate errors
 * that currently have overriden values such as a different icon, color, cta, etc.
 */
export const errorsWithOverrides: LedgerError[] = [
  UserRefusedFirmwareUpdate,
  ManagerDeviceLockedError,
  LockedDeviceError,
  UserRefusedDeviceNameChange,
  UpdateYourApp,
  BluetoothNotSupportedError,
  DeviceNotOnboarded,
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
];

/**
 * The rendering of the error will follow a specific layout.
 * The wording for the title, description and CTA button are defined on the
 * language files under the errors.ErrorClass path.
 */
const useErrorRenderData: (error: Error) => ErrorRenderData = error => {
  const navigation: StackNavigationProp<ParamListBase> = useNavigation();

  // Declare a default configuration that applies to any error we don't override.
  const data: ErrorRenderData = {
    Icon: Icons.CloseMedium,
    iconColor: "error.c60",
    hasExportLogs: true,
    onPrimaryPressOverride: undefined,
  };

  // Specify the configuration for an error.
  switch (true) {
    case error instanceof UpdateYourApp:
      data.onPrimaryPressOverride = () => {
        navigation.navigate(NavigatorName.Manager, {
          screen: ScreenName.Manager,
          params: {
            tab: MANAGER_TABS.INSTALLED_APPS,
            updateModalOpened: true,
          },
        });
      };
      break;
    case error instanceof ImageLoadRefusedOnDevice:
    case error instanceof ImageCommitRefusedOnDevice:
      data.Icon = Icons.CircledAlertMedium;
      data.iconColor = "warning.c100";
      break;

    case error instanceof LockedDeviceError:
      data.Icon = Icons.LockAltMedium;
      data.iconColor = "neutral.c100";
      data.hasExportLogs = false;
      break;

    case error instanceof BluetoothNotSupportedError:
      data.Icon = Icons.UsbMedium;
      data.iconColor = "neutral.c100";
      data.hasExportLogs = false;
      break;

    case error instanceof UserRefusedDeviceNameChange:
      data.Icon = Icons.WarningSolidMedium;
      data.iconColor = "warning.c80";
      break;

    case error instanceof DeviceNotOnboarded:
      data.Icon = Icons.InfoAltFillMedium;
      data.hasExportLogs = false;
      break;

    case error instanceof UserRefusedFirmwareUpdate:
      data.Icon = Icons.WarningMedium;
      break;

    case error instanceof ManagerDeviceLockedError:
      data.Icon = Icons.LockAltMedium;
      data.iconColor = "warning.c80";
      data.hasExportLogs = false;
      break;

    default:
      // Yaiza
      break;
  }

  return data;
};

export default useErrorRenderData;
