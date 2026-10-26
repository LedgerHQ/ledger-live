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
import { ScreenName } from "~/const";
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

  // Same drawer as the account.request of the discover apps: pick a Hyperliquid account, or add
  // one through its Add account step, which hands the added account back to onAccountSelected.
  const uiMigrationExecute = useCallback(() => {
    const request = beginMigrationRequest();
    const requestId = getMigrationRequestId();

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
          cancelMigrationRequest(requestId);
        }
      },
      onCancel: () => cancelMigrationRequest(requestId),
    });

    return request;
  }, [openDrawer]);

  // Coming back to Perps without a selected account (X, back, device error) abandons the migration.
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
