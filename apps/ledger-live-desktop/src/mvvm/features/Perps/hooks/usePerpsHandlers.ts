import {
  handlers as perpsHandlers,
  type PerpsDepositUiParams,
  type PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { context as drawerContext } from "~/renderer/drawers/Provider";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  closeDialog,
  modularDialogIsOpenSelector,
  openDialog,
} from "~/renderer/reducers/modularDialog";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { openPerpsSign } from "../screens/PerpsSign/PerpsSignDialog";
import { openPerpsDeposit } from "../screens/PerpsDeposit/PerpsDepositDialog";
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

export function usePerpsHandlers(accounts: AccountLike[]) {
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
      openPerpsSign({ appName, appOptions, signFactory, onSuccess, onError, onCancel });
    },
    [],
  );

  const uiDepositExecute = useCallback((params: PerpsDepositUiParams) => {
    const request = beginDepositRequest();
    openPerpsDeposit(params);
    return request;
  }, []);

  useEffect(() => cancelDepositRequest, []);

  const dispatch = useDispatch();

  // Same selector as the account.request of the discover apps: pick a Hyperliquid account, or add
  // one through its Add account step, which hands the added account back to onAccountSelected.
  const migrationRequestId = useRef<string | null>(null);
  const uiMigrationExecute = useCallback(() => {
    const request = beginMigrationRequest();
    const requestId = getMigrationRequestId();
    migrationRequestId.current = requestId;

    dispatch(
      openDialog({
        currencies: [HYPERCORE_CURRENCY_ID],
        areCurrenciesFiltered: true,
        dialogConfiguration: createModularDrawerConfiguration(),
        uiUseCase: PERPS_UI_USE_CASE.receive,
        onAccountSelected: account => {
          dispatch(closeDialog());
          if (account.type === "Account") {
            settleMigrationRequest(requestId, [account]);
          } else {
            cancelMigrationRequest(requestId);
          }
        },
        onClose: () => cancelMigrationRequest(requestId),
      }),
    );

    return request;
  }, [dispatch]);

  // Add account replaces the selector with the add account drawer, and closing that drawer reports
  // nothing back. Once neither is open, a request that is still pending was abandoned.
  const { state: drawerState } = useContext(drawerContext);
  const isDialogOpen = useSelector(modularDialogIsOpenSelector);
  const isFlowOpen = isDialogOpen || drawerState.open;
  const wasFlowOpen = useRef(false);
  useEffect(() => {
    if (wasFlowOpen.current && !isFlowOpen) cancelMigrationRequest(migrationRequestId.current);
    wasFlowOpen.current = isFlowOpen;
  }, [isFlowOpen]);

  useEffect(() => () => cancelMigrationRequest(), []);

  return useMemo<WalletAPICustomHandlers>(() => {
    return perpsHandlers({
      accounts,
      uiHooks: {
        "signing.execute": uiSigningExecute,
        "deposit.execute": uiDepositExecute,
        "migration.execute": uiMigrationExecute,
      },
    });
  }, [accounts, uiSigningExecute, uiDepositExecute, uiMigrationExecute]);
}
