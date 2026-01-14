import React, { useMemo } from "react";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

export type Data = {
  onCancel?: (reason: string) => void;
  appName?: string;
  onResult: (result: AppResult) => void;
};

export default function ConnectDevice({ appName = "BOLOS" }: Data) {
  const action = useConnectAppAction();
  const request = useMemo(() => {
    return {
      appName,
    };
  }, [appName]);

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
              <DeviceAction
                action={action}
                request={request}
                onResult={res => {
                  data?.onResult(res);
                  onClose?.();
                }}
              />
            </Box>
          )}
        />
      )}
    />
  );
}
