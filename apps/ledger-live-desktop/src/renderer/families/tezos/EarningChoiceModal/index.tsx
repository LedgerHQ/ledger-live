import React from "react";
import Modal from "~/renderer/components/Modal";
import Body, { Data } from "./Body";

const EarningChoiceModal = () => (
  <Modal
    name="MODAL_TEZOS_EARNING_CHOICE"
    centered
    width={700}
    render={({ onClose, data }) => <Body onClose={onClose} params={data || ({} as Data)} />}
  />
);

export default EarningChoiceModal;
