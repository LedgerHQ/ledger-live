import React from "react";
import { getEnv } from "@ledgerhq/live-common/env";
import { AppResult, createAction } from "@ledgerhq/live-common/hw/actions/app";
import Modal, { ModalBody, RenderProps } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
const appAction = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
export default function ConnectDevice() {
  return (
    <Modal
      name="MODAL_CONNECT_DEVICE"
      centered
      preventBackdropClick
      render={({
        data,
        onClose,
      }: RenderProps<{
        onCancel?: (reason: string) => void;
        appName?: string;
        onResult: (result: AppResult) => void;
      }>) => (
        <ModalBody
          onClose={() => {
            if (data?.onCancel) {
              data.onCancel("Interrupted by user");
            }
            onClose && onClose();
          }}
          render={() => (
            <Box alignItems={"center"} px={32}>
              <DeviceAction
                action={appAction}
                request={{
                  appName: data?.appName || "BOLOS",
                }}
                onResult={res => {
                  data?.onResult(res);
                  onClose && onClose();
                }}
              />
            </Box>
          )}
        />
      )}
    />
  );
}
