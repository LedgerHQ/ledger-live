import React from "react";
import Modal from "~/renderer/components/Modal";
import StyleProvider from "~/renderer/styles/StyleProvider";
import ProtectDiscoverBody from "./ProtectDiscoverBody";
import LedgerRecoverBackground from "./images/background.png";

const ProtectDiscoverModal = () => (
  <StyleProvider selectedPalette="dark">
    <Modal
      name="MODAL_PROTECT_DISCOVER"
      centered
      render={({ onClose }) => <ProtectDiscoverBody onClose={onClose} />}
      bodyStyle={{
        backgroundImage: `url(${LedgerRecoverBackground})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        borderRadius: "8px",
      }}
    />
  </StyleProvider>
);

export default ProtectDiscoverModal;
