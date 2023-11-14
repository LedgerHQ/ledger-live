import React from "react";
import Modal from "~/renderer/components/Modal";
import ModalBody from "./ModalBody";

const CompleteExchange = () => {
  return (
    <Modal
      name="MODAL_PLATFORM_EXCHANGE_COMPLETE"
      centered
      preventBackdropClick
      render={({ data, onClose }) => <ModalBody onClose={onClose} data={data} />}
    />
  );
};
export default CompleteExchange;
