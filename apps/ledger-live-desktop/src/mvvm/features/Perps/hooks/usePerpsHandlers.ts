import { handlers as perpsHandlers, PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";

export function usePerpsHandlers(accounts: AccountLike[]) {
  const dispatch = useDispatch();

  const uiDeviceSelect = useCallback(
    ({
      appName,
      appOptions,
      onSuccess,
      onCancel,
    }: {
      appName: string | undefined;
      appOptions?: {
        requireLatestFirmware: boolean;
        allowPartialDependencies: boolean;
        skipAppInstallIfNotFound: boolean;
      };
      onSuccess: (result: AppResult) => void;
      onCancel: () => void;
    }) => {
      dispatch(
        openModal("MODAL_CONNECT_DEVICE", {
          appName,
          requireLatestFirmware: appOptions?.requireLatestFirmware,
          allowPartialDependencies: appOptions?.allowPartialDependencies,
          skipAppInstallIfNotFound: appOptions?.skipAppInstallIfNotFound,
          onResult: onSuccess,
          onCancel,
        }),
      );
    },
    [dispatch],
  );

  const uiSigningExecute = useCallback(
    ({
      device,
      sign,
      onSuccess,
      onError,
      onCancel,
    }: {
      device: Device;
      sign: () => Promise<PerpsSignResult>;
      onSuccess: (result: PerpsSignResult) => void;
      onError: (error: Error) => void;
      onCancel: () => void;
    }) => {
      dispatch(
        openModal("MODAL_PERPS_SIGNING", {
          device,
          sign,
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
        "device.select": uiDeviceSelect,
        "signing.execute": uiSigningExecute,
      },
    });
  }, [accounts, uiDeviceSelect, uiSigningExecute]);
}
