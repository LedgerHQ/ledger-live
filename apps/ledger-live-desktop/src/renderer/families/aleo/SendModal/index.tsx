import React from "react";
import { AleoCustomModal } from "../constants";
import type { ModalProps } from "../modals/send/types";
import AleoSendModal from "../modals/send";

const SendModal = (props: ModalProps) => {
  return <AleoSendModal name={AleoCustomModal.SEND} {...props} />;
};

export default SendModal;
