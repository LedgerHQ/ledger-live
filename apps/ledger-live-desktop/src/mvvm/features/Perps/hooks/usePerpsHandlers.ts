import {
  handlers as perpsHandlers,
  type PerpsDepositUiParams,
  type PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { context as drawerContext, setDrawer } from "~/renderer/drawers/Provider";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useStore } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { openPerpsSign } from "../screens/PerpsSign/PerpsSignDialog";
import { openPerpsDeposit } from "../screens/PerpsDeposit/PerpsDepositDialog";
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

  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "perps",
  );

  const store = useStore();

  // Only called when the wallet has no Hyperliquid account at the legacy address. Hands back the
  // account the user continues with and the wallet accounts, so the server finds the one at the
  // legacy address even when the user added several and continued with another one. The flow
  // saves the accounts on Confirm, so the store has them by then.
  const uiMigrationExecute = useCallback(() => {
    const request = beginMigrationRequest();
    const id = getMigrationRequestId();

    openAddAccountFlow(getCryptoCurrencyById(HYPERCORE_CURRENCY_ID), account => {
      setDrawer();
      if (account.type === "Account") {
        settleMigrationRequest(id, [account, ...accountsSelector(store.getState())]);
      } else {
        cancelMigrationRequest(id);
      }
    });

    return request;
  }, [openAddAccountFlow, store]);

  // Closing the add account drawer reports nothing back, so a request still pending once the
  // drawer is closed was abandoned. Only one runs at a time: starting one cancels the previous.
  const { state: drawerState } = useContext(drawerContext);
  const wasDrawerOpen = useRef(false);
  useEffect(() => {
    if (wasDrawerOpen.current && !drawerState.open) {
      cancelMigrationRequest();
    }
    wasDrawerOpen.current = drawerState.open;
  }, [drawerState.open]);

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
