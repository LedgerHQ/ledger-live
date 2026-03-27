import { handlers as perpsHandlers, PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";

export function usePerpsHandlers(accounts: AccountLike[]) {
  const dispatch = useDispatch();

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
      dispatch(
        openModal("MODAL_PERPS_SIGNING", {
          appName,
          appOptions,
          signFactory,
          onSuccess,
          onError,
          onCancel,
        }),
      );
    },
    [dispatch],
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
