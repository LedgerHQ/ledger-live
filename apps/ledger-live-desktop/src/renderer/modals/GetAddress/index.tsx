import React, { useCallback, useMemo } from "react";
import { firstValueFrom } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { AppResult, createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import type { Result } from "@ledgerhq/coin-framework/lib/derivation";
import type { Account } from "@ledgerhq/types-live";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";

const appAction = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

export type Data = {
  path: string;
  account: Account;
  onResult: (result: Result) => void;
  onCancel: (error: Error) => void;
};

export default function GetAddress({ account, path, onResult, onCancel }: Data) {
  const getAddress = useCallback(
    (device: Device) => {
      return new Promise<Result>((resolve, reject) => {
        if (getEnv("MOCK")) {
          window.mock.events.subject.subscribe({
            complete() {
              resolve({ address: "", publicKey: "", path });
            },
          });
        } else {
          firstValueFrom(
            getAccountBridge(account).receive(account, {
              deviceId: device.deviceId,
              path,
            }),
          ).then(resolve, reject);
        }
      });
    },
    [account, path],
  );

  const handleResult = useCallback(
    ({ device }: AppResult) => {
      getAddress(device).then(onResult, onCancel);
    },
    [getAddress, onCancel, onResult],
  );

  const request = useMemo(() => {
    return {
      account,
    };
  }, [account]);

  return (
    <Modal
      name="MODAL_GET_ADDRESS"
      centered
      preventBackdropClick
      render={({ data, onClose }) => (
        <ModalBody
          onClose={() => {
            data.onCancel(new Error("Interrupted by user"));
            onClose();
          }}
          render={() => (
            <Box alignItems={"center"} px={32}>
              <DeviceAction
                action={appAction}
                request={request}
                onResult={res => {
                  handleResult(res);
                  onClose();
                }}
              />
            </Box>
          )}
        />
      )}
    />
  );
}
