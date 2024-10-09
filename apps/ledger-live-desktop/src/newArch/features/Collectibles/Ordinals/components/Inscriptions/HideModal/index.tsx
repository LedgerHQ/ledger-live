import React from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";

const HideNftCollectionModal = () => (
  <Modal
    name="MODAL_HIDE_INSCRIPTION"
    centered
    render={({ data, onClose }) => (
      <Body
        inscriptionName={data.inscriptionName}
        inscriptionId={data.inscriptionId}
        onClose={() => {
          onClose?.();
          data?.onClose?.();
        }}
      />
    )}
  />
);
export default HideNftCollectionModal;
