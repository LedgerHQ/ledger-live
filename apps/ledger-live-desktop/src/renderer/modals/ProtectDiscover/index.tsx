import React, { useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import StyleProvider from "~/renderer/styles/StyleProvider";
import ProtectDiscoverBody from "./ProtectDiscoverBody";
import LedgerRecoverBackground from "./images/background.png";

const bodyStyle = {
  backgroundImage: `url(${LedgerRecoverBackground})`,
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  borderRadius: "8px",
};

const ProtectDiscoverModal = () => {
  const renderBody = useCallback(({ onClose }) => <ProtectDiscoverBody onClose={onClose} />, []);

  return (
    <StyleProvider selectedPalette="dark">
      <Modal name="MODAL_PROTECT_DISCOVER" centered render={renderBody} bodyStyle={bodyStyle} />
    </StyleProvider>
  );
};

export default ProtectDiscoverModal;
