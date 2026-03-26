import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as perpsHandlers, PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export function usePerpsHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const uiDeviceSelect = useCallback(
    ({
      appName,
      appOptions,
      onSuccess,
      onCancel,
    }: {
      appName: string | undefined;
      appOptions?: {
        requireLatestFirmware: boolean;
        allowPartialDependencies: boolean;
        skipAppInstallIfNotFound: boolean;
      };
      onSuccess: (result: AppResult) => void;
      onCancel: () => void;
    }) => {
      navigation.navigate(ScreenName.DeviceConnect, {
        appName,
        requireLatestFirmware: appOptions?.requireLatestFirmware,
        allowPartialDependencies: appOptions?.allowPartialDependencies,
        skipAppInstallIfNotFound: appOptions?.skipAppInstallIfNotFound,
        onSuccess,
        onClose: onCancel,
      });
    },
    [navigation],
  );

  const uiSigningExecute = useCallback(
    ({
      device,
      sign,
      onSuccess,
      onError,
      onCancel,
    }: {
      device: Device;
      sign: () => Promise<PerpsSignResult>;
      onSuccess: (result: PerpsSignResult) => void;
      onError: (error: Error) => void;
      onCancel: () => void;
    }) => {
      navigation.navigate(ScreenName.PerpsSign, {
        device,
        sign,
        onSuccess,
        onError,
        onCancel,
      });
    },
    [navigation],
  );

  return useMemo<WalletAPICustomHandlers>(
    () =>
      perpsHandlers({
        accounts,
        uiHooks: {
          "device.select": uiDeviceSelect,
          "signing.execute": uiSigningExecute,
        },
      }),
    [accounts, uiDeviceSelect, uiSigningExecute],
  );
}
