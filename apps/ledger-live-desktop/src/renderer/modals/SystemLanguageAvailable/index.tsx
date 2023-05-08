import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import SystemLanguageAvailableBody, { Props as BodyProps } from "./SystemLanguageAvailableBody";
const SystemLanguageAvailableModal = () => (
  <Modal
    name="MODAL_SYSTEM_LANGUAGE_AVAILABLE"
    centered
    render={({ data, onClose }: RenderProps<BodyProps["data"]>) => (
      <SystemLanguageAvailableBody data={data} onClose={onClose} />
    )}
  />
);
export default SystemLanguageAvailableModal;
