import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  handlers as perpsHandlers,
  PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export function usePerpsHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const uiSigningExecute = useCallback(
    ({
      appName,
      appOptions,
      signFactory,
      onSuccess,
      onError,
      onCancel,
    }: {
      appName: string | undefined;
      appOptions?: {
        requireLatestFirmware: boolean;
        allowPartialDependencies: boolean;
        skipAppInstallIfNotFound: boolean;
      };
      signFactory: (device: Device) => Promise<PerpsSignResult>;
      onSuccess: (result: PerpsSignResult) => void;
      onError: (error: Error) => void;
      onCancel: () => void;
    }) => {
      navigation.navigate(ScreenName.PerpsSign, {
        appName,
        appOptions,
        signFactory,
        onSuccess,
        onError,
        onCancel,
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
          "signing.execute": uiSigningExecute,
        },
      }),
    [accounts, uiSigningExecute],
  );
}
