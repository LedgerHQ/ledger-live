import {
  handlers as perpsHandlers,
  type PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { openPerpsSign } from "../screens/PerpsSign/PerpsSignDialog";

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

  return useMemo<WalletAPICustomHandlers>(() => {
    return perpsHandlers({
      accounts,
      uiHooks: {
        "signing.execute": uiSigningExecute,
      },
    });
  }, [accounts, uiSigningExecute]);
}
