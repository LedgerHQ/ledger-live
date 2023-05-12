import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import TermOfUseUpdateBody from "./TermOfUseUpdateBody";

const TermOfUseUpdateModal = () => (
  <Modal
    name="MODAL_TERM_OF_USE_UPDATE"
    centered
    preventBackdropClick={true}
    render={({ data, onClose }: RenderProps<{ acceptTerms: () => void }>) => (
      <TermOfUseUpdateBody
        onClose={() => {
          data.acceptTerms();
          onClose?.();
        }}
      />
    )}
  />
);

export default TermOfUseUpdateModal;
