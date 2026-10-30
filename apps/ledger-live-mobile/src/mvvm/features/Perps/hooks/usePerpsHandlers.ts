import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { AccountLike } from "@ledgerhq/types-live";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  handlers as perpsHandlers,
  type PerpsDepositUiParams,
  type PerpsSignResult,
  type PerpsWithdrawUiParams,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { ScreenName } from "~/const";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { useOpenSelectDevice } from "LLM/features/DeviceSelection/hooks/useOpenSelectDevice";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  beginDepositRequest,
  cancelDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import {
  beginMigrationRequest,
  cancelMigrationRequest,
  getMigrationRequestId,
  settleMigrationRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import { HYPERCORE_CURRENCY_ID } from "@ledgerhq/live-common/wallet-api/Perps/constants";
import {
  beginWithdrawRequest,
  cancelWithdrawRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";

export function usePerpsHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const openSelectDevice = useOpenSelectDevice();

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

  const uiWithdrawExecute = useCallback(
    (params: PerpsWithdrawUiParams) => {
      const request = beginWithdrawRequest();
      navigation.navigate(ScreenName.PerpsWithdraw, params);
      return request;
    },
    [navigation],
  );

  useEffect(() => cancelDepositRequest, []);
  useEffect(() => cancelWithdrawRequest, []);

  // Only called when the wallet has no Hyperliquid account at the legacy address: runs the standard
  // add account flow inline and hands back every added account, the server picks the matching one.
  const uiMigrationExecute = useCallback(() => {
    const request = beginMigrationRequest();
    const id = getMigrationRequestId();

    // Coming back to Perps without added accounts (X, back, device error) abandons the migration.
    const unsubscribe = navigation.addListener("focus", () => cancelMigrationRequest(id));
    request.then(unsubscribe, unsubscribe);

    openSelectDevice({
      currency: getCryptoCurrencyById(HYPERCORE_CURRENCY_ID),
      context: AddAccountContexts.AddAccounts,
      inline: true,
      // SelectDevice + the add account screens
      navigationDepth: 2,
      onCloseNavigation: () => cancelMigrationRequest(id),
      onSuccess: res => settleMigrationRequest(id, res?.selected ?? []),
    });

    return request;
  }, [navigation, openSelectDevice]);

  useEffect(() => () => cancelMigrationRequest(), []);

  return useMemo<WalletAPICustomHandlers>(
    () =>
      perpsHandlers({
        accounts,
        uiHooks: {
          "signing.execute": uiSigningExecute,
          "deposit.execute": uiDepositExecute,
          "withdraw.execute": uiWithdrawExecute,
          "migration.execute": uiMigrationExecute,
        },
      }),
    [accounts, uiSigningExecute, uiDepositExecute, uiWithdrawExecute, uiMigrationExecute],
  );
}
