import React from "react";
import styled from "@ledgerhq/react-ui/components/styled";
import Modal from "~/renderer/components/Modal";
import StyleProvider from "~/renderer/styles/StyleProvider";
import ProtectDiscoverBody from "./ProtectDiscoverBody";
import LedgerRecoverBackground from "./images/background.png";

const StyledWrapper = styled.div`
  background-image: url(${LedgerRecoverBackground});
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 8px;
`;

const ProtectDiscoverModal = () => (
  <StyleProvider selectedPalette="dark">
    <StyledWrapper>
      <Modal
        name="MODAL_PROTECT_DISCOVER"
        centered
        render={({ data, onClose }) => <ProtectDiscoverBody version={data} onClose={onClose} />}
        customBackground={LedgerRecoverBackground}
        bodyStyle={{
          backgroundImage: `url(${LedgerRecoverBackground})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          borderRadius: "8px",
        }}
      />
    </StyledWrapper>
  </StyleProvider>
);

export default ProtectDiscoverModal;
