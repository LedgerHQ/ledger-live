import React from "react";
import { Trans } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ModalBody as BrazeModalBody } from "./Body";

const BrazeToolsGenerator = () => (
  <Modal
    name="MODAL_BRAZE_TOOLS"
    centered
    width={800}
    render={({ onClose }) => (
      <ModalBody
        onClose={onClose}
        onBack={undefined}
        title={<Trans i18nKey="settings.developer.brazeTools.modal.title" />}
        noScroll
        render={() => <BrazeModalBody />}
      />
    )}
  />
);

export default BrazeToolsGenerator;
