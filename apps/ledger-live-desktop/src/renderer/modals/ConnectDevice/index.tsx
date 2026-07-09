import React, { useMemo } from "react";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { managerResultToAppResult } from "@ledgerhq/live-common/wallet-api/helpers";
import useConnectAppAction, { useConnectManagerAction } from "~/renderer/hooks/useConnectAppAction";

const MANAGER_REQUEST = {} as const;

export type Data = {
  appName?: string;
  allowManager?: boolean;
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
  skipAppInstallIfNotFound?: boolean;
  onCancel?: (reason: string) => void;
  onResult: (result: AppResult) => void;
};

export default function ConnectDevice({
  appName = "BOLOS",
  allowManager,
  requireLatestFirmware,
  allowPartialDependencies,
  skipAppInstallIfNotFound,
}: Data) {
  const connectAppAction = useConnectAppAction();
  const connectManagerAction = useConnectManagerAction();
  const request = useMemo(
    () => ({
      appName,
      requireLatestFirmware,
      allowPartialDependencies,
      skipAppInstallIfNotFound,
    }),
    [appName, requireLatestFirmware, allowPartialDependencies, skipAppInstallIfNotFound],
  );

  return (
    <Modal
      name="MODAL_CONNECT_DEVICE"
      centered
      preventBackdropClick
      render={({ data, onClose }) => (
        <ModalBody
          onClose={() => {
            if (data?.onCancel) {
              data.onCancel("Interrupted by user");
            }
            onClose?.();
          }}
          render={() => (
            <Box alignItems={"center"} px={32}>
              {allowManager ? (
                <DeviceAction
                  key="connect-manager"
                  action={connectManagerAction}
                  request={MANAGER_REQUEST}
                  onResult={res => {
                    data?.onResult(managerResultToAppResult(res));
                    onClose?.();
                  }}
                />
              ) : (
                <DeviceAction
                  key="connect-app"
                  action={connectAppAction}
                  request={request}
                  onResult={res => {
                    data?.onResult(res);
                    onClose?.();
                  }}
                />
              )}
            </Box>
          )}
        />
      )}
    />
  );
}
