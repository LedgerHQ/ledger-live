import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { AccountLike } from "@ledgerhq/types-live";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  handlers as perpsHandlers,
  type PerpsDepositUiParams,
  type PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  beginDepositRequest,
  cancelDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import {
  beginMigrationRequest,
  cancelMigrationRequest,
  settleMigrationRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import { HYPERCORE_CURRENCY_ID } from "@ledgerhq/live-common/wallet-api/Perps/constants";

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
      });
    },
    [navigation],
  );

  const uiDepositExecute = useCallback(
    (params: PerpsDepositUiParams) => {
      const request = beginDepositRequest();
      navigation.navigate(ScreenName.PerpsDeposit, params);
      return request;
    },
    [navigation],
  );

  useEffect(() => cancelDepositRequest, []);

  // Only called when the wallet has no Hyperliquid account at the legacy address: runs the standard
  // add account flow inline and hands back every added account, the server picks the matching one.
  const uiMigrationExecute = useCallback(() => {
    const { id, promise } = beginMigrationRequest();

    // Coming back to Perps without added accounts (X, back, device error) abandons the migration.
    const unsubscribe = navigation.addListener("focus", () => cancelMigrationRequest(id));
    promise.then(unsubscribe, unsubscribe);

    navigation.navigate(NavigatorName.DeviceSelection, {
      screen: ScreenName.SelectDevice,
      params: {
        currency: getCryptoCurrencyById(HYPERCORE_CURRENCY_ID),
        context: AddAccountContexts.AddAccounts,
        inline: true,
        // SelectDevice + the add account screens
        navigationDepth: 2,
        onCloseNavigation: () => cancelMigrationRequest(id),
        onSuccess: res => settleMigrationRequest(id, res?.selected ?? []),
      },
    });

    return promise;
  }, [navigation]);

  useEffect(() => () => cancelMigrationRequest(), []);

  return useMemo<WalletAPICustomHandlers>(
    () =>
      perpsHandlers({
        accounts,
        uiHooks: {
          "signing.execute": uiSigningExecute,
          "deposit.execute": uiDepositExecute,
          "migration.execute": uiMigrationExecute,
        },
      }),
    [accounts, uiSigningExecute, uiDepositExecute, uiMigrationExecute],
  );
}
