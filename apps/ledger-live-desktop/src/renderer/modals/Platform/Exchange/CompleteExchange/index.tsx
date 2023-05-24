import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body, { Data } from "./Body";

const CompleteExchange = () => {
  return (
    <Modal
      name="MODAL_PLATFORM_EXCHANGE_COMPLETE"
      centered
      preventBackdropClick
      render={({ data, onClose }: RenderProps<Data>) => <Body onClose={onClose} data={data} />}
    />
  );
};
export default CompleteExchange;
