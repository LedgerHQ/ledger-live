import {
  handlers as perpsHandlers,
  type PerpsDepositUiParams,
  type PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { PerpsMigrationUiParams } from "@ledgerhq/live-common/wallet-api/Perps/migration";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setDrawer } from "~/renderer/drawers/Provider";
import { PerpsMigrationDiscovery } from "../components/PerpsMigrationDiscovery";
import { CloseButton } from "LLD/features/ModularDialog/components/CloseButton";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import { useDispatch } from "LLD/hooks/redux";
import { closeDialog, openDialog } from "~/renderer/reducers/modularDialog";
import { useCallback, useEffect, useMemo } from "react";
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

function openMigrationDiscovery(requestId: string | null) {
  const settle = (accounts: Account[]) => settleMigrationRequest(requestId, accounts);

  setDrawer(
    PerpsMigrationDiscovery,
    {
      requestId,
      currency: getCryptoCurrencyById(HYPERCORE_CURRENCY_ID),
      autoSelect: false,
      // Settle on add, so leaving the success step any other way than Done stays a success.
      onAccountsAdded: settle,
      onDone: settle,
    },
    { closeButtonComponent: CloseButton, onRequestClose: () => setDrawer() },
  );
}

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

  const uiMigrationExecute = useCallback(
    ({ existingAccounts }: PerpsMigrationUiParams) => {
      const request = beginMigrationRequest();
      const requestId = getMigrationRequestId();

      if (existingAccounts.length === 0) {
        openMigrationDiscovery(requestId);
        return request;
      }

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
              cancelMigrationRequest();
            }
          },
          onAddAccount: () => {
            dispatch(closeDialog());
            openMigrationDiscovery(requestId);
          },
          onClose: () => cancelMigrationRequest(),
        }),
      );

      return request;
    },
    [dispatch],
  );

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
