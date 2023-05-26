import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Bridge from "./Bridge";
const BridgeModal = () => (
  <Modal
    name="MODAL_WEBSOCKET_BRIDGE"
    centered
    preventBackdropClick
    render={({ data, onClose }: RenderProps<React.ComponentProps<typeof Bridge>>) => (
      <Bridge {...data} onClose={onClose} />
    )}
  />
);
export default BridgeModal;
