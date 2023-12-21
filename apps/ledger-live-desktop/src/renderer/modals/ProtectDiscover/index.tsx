import React, { useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import StyleProviderV2 from "~/renderer/styles/StyleProviderV2";
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
  const renderBody = useCallback(
    ({ onClose }: { onClose: () => void }) => <ProtectDiscoverBody onClose={onClose} />,
    [],
  );

  return (
    <StyleProviderV2 selectedPalette="dark">
      <Modal name="MODAL_PROTECT_DISCOVER" centered render={renderBody} bodyStyle={bodyStyle} />
    </StyleProviderV2>
  );
};

export default ProtectDiscoverModal;
