import React from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
const TroubleshootModal = () => (
  <Modal
    name="MODAL_TROUBLESHOOT_NETWORK"
    centered
    render={({ onClose }) => <Body onClose={onClose} />}
  />
);
export default TroubleshootModal;
