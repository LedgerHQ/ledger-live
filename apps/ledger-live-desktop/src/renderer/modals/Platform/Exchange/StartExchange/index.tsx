import React from "react";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/startExchange";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import {
  StartExchangeErrorResult,
  StartExchangeSuccessResult,
} from "@ledgerhq/live-common/hw/actions/startExchange";

export type Data = {
  onCancel?: (error: StartExchangeErrorResult) => void;
  exchangeType: ExchangeType;
  onResult: (startExchangeResult: StartExchangeSuccessResult) => void;
};

const action = createAction(connectApp, startExchange);

const StartExchange = () => {
  return (
    <Modal
      name="MODAL_PLATFORM_EXCHANGE_START"
      centered
      preventBackdropClick
      render={({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => (
        <ModalBody
          onClose={() => {
            if (data.onCancel) {
              data.onCancel({
                error: new Error("Interrupted by user"),
              });
            }
            onClose?.();
          }}
          render={() => (
            <Box alignItems={"center"} px={32}>
              <DeviceAction
                action={action}
                request={{
                  exchangeType: data.exchangeType,
                }}
                onResult={result => {
                  if ("startExchangeResult" in result) {
                    data.onResult(result.startExchangeResult);
                  }
                  if ("startExchangeError" in result) {
                    data.onCancel?.(result.startExchangeError);
                  }
                  onClose?.();
                }}
              />
            </Box>
          )}
        />
      )}
    />
  );
};
export default StartExchange;
