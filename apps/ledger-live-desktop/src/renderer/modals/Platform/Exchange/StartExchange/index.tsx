import React from "react";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/startExchange";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
const action = createAction(connectApp, startExchange);
const StartExchange = () => {
  return (
    <Modal
      name="MODAL_PLATFORM_EXCHANGE_START"
      centered
      preventBackdropClick
      render={({ data, onClose }) => (
        <ModalBody
          onClose={() => {
            if (data.onCancel) {
              data.onCancel("Interrupted by user");
            }
            onClose();
          }}
          render={() => (
            <Box alignItems={"center"} px={32}>
              <DeviceAction
                action={action}
                request={{
                  exchangeType: data.exchangeType,
                }}
                onResult={({ startExchangeResult }) => {
                  data.onResult(startExchangeResult);
                  onClose();
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
