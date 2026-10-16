import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  handlers as perpsHandlers,
  type PerpsDepositUiParams,
  type PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { PerpsMigrationUiParams } from "@ledgerhq/live-common/wallet-api/Perps/migration";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  beginDepositRequest,
  cancelDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/depositRequest";
import {
  beginMigrationRequest,
  cancelMigrationRequest,
  getMigrationRequestId,
  settleMigrationRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";

const HYPERCORE_CURRENCY_ID = "hypercore";

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

  const { openDrawer } = useModularDrawerController();

  const uiMigrationExecute = useCallback(
    ({ existingAccounts }: PerpsMigrationUiParams) => {
      const request = beginMigrationRequest();
      const requestId = getMigrationRequestId();

      const openDiscovery = () =>
        navigation.navigate(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency: getCryptoCurrencyById(HYPERCORE_CURRENCY_ID),
            context: AddAccountContexts.AddAccounts,
            sourceScreenName: ScreenName.PerpsTab,
            autoSelect: false,
            // Settle on add, so leaving the success screen any other way than Done stays a success.
            onAccountsAdded: (accountsToAdd: Account[]) =>
              settleMigrationRequest(requestId, accountsToAdd),
            onDone: (accountsToAdd: Account[]) => settleMigrationRequest(requestId, accountsToAdd),
          },
        });

      if (existingAccounts.length === 0) {
        openDiscovery();
      } else {
        openDrawer({
          currencies: [HYPERCORE_CURRENCY_ID],
          areCurrenciesFiltered: true,
          enableAccountSelection: true,
          uiUseCase: PERPS_UI_USE_CASE.receive,
          flow: PERPS_UI_USE_CASE.receive,
          onAccountSelected: account => {
            if (account.type === "Account") {
              settleMigrationRequest(requestId, [account]);
            } else {
              cancelMigrationRequest();
            }
          },
          onAddAccount: openDiscovery,
          onCancel: () => cancelMigrationRequest(),
        });
      }

      return request;
    },
    [navigation, openDrawer],
  );

  // Coming back to Perps without Done (X, back, device error) abandons the migration.
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => cancelMigrationRequest());
    return () => {
      unsubscribe();
      cancelMigrationRequest();
    };
  }, [navigation]);

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
