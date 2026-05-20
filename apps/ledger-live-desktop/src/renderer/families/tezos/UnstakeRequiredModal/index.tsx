import React from "react";
import Modal from "~/renderer/components/Modal";
import Body, { MODAL_NAME } from "./Body";

export type { Data, UnstakeRequiredReason } from "./Body";

const UnstakeRequiredModal = () => (
  <Modal
    name={MODAL_NAME}
    centered
    render={({ onClose, data }) => (data ? <Body onClose={onClose} params={data} /> : null)}
  />
);

export default UnstakeRequiredModal;
