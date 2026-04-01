import {
  handlers as perpsHandlers,
  PerpsSignResult,
} from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { usePerpsSignState } from "../screens/PerpsSign/perpsSignDialog";

export function usePerpsHandlers(accounts: AccountLike[]) {
  const { openPerpsSign } = usePerpsSignState();

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
    [openPerpsSign],
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
