import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export function usePerpsHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const uiDeviceSelect = useCallback(
    ({
      appName,
      onSuccess,
      onCancel,
    }: {
      appName: string | undefined;
      onSuccess: (result: AppResult) => void;
      onCancel: () => void;
    }) => {
      navigation.navigate(ScreenName.DeviceConnect, {
        appName,
        onSuccess,
        onClose: onCancel,
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
        },
      }),
    [accounts, uiDeviceSelect],
  );
}
