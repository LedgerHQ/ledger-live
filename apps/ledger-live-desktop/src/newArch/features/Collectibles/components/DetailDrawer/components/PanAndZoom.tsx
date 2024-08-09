import React, { memo } from "react";
import { createPortal } from "react-dom";
import { PanAndZoomProps, PanAndZoomBodyProps } from "LLD/features/Collectibles/types/DetailDrawer";
import { Media } from "LLD/features/Collectibles/components/index";
import PrismaZoom from "react-prismazoom";
import IconCross from "~/renderer/icons/Cross";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

const Container = styled.div`
  background-color: ${({ theme }) => rgba(theme.colors.neutral.c00, 0.2)};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 32px 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ImageContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CloseButton = styled.button`
  border: none;
  background-color: ${({ theme }) => rgba(theme.colors.neutral.c00, 0.2)};
  position: absolute;
  top: 48px;
  right: 48px;
  color: ${({ theme }) => theme.colors.neutral.c100};
  cursor: pointer;
  z-index: 1;
`;

const domNode = document.getElementById("modals");

const prismaZoomStyle = {
  height: "100%",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const PanAndZoomBody = memo<PanAndZoomBodyProps>(
  ({ tokenId, collectibleName, useFallback, setUseFallback, mediaType, contentType, imageUri }) => (
    <ImageContainer>
      <PrismaZoom style={prismaZoomStyle}>
        <Media
          collectibleName={collectibleName}
          tokenId={tokenId}
          mediaFormat="original"
          full
          squareWithDefault={false}
          objectFit="scale-down"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          useFallback={useFallback}
          setUseFallback={setUseFallback}
          uri={imageUri}
          mediaType={mediaType}
          contentType={contentType}
          isLoading={false}
        />
      </PrismaZoom>
    </ImageContainer>
  ),
);

const PanAndZoomComponent: React.FC<PanAndZoomProps> = ({ onClose, tokenId, ...props }) => {
  const modal = (
    <Container onClick={onClose}>
      <CloseButton onClick={onClose} className="sidedrawer-close">
        <IconCross size={32} />
      </CloseButton>
      <PanAndZoomBody {...props} tokenId={tokenId} onClose={onClose} />
    </Container>
  );

  // we use the same portal as modals but don't use the modal component itself because we need
  // to handle the size of the model differently
  return domNode ? createPortal(modal, domNode) : null;
};

PanAndZoomBody.displayName = "PanAndZoomBody";
PanAndZoomComponent.displayName = "PanAndZoom";

export const PanAndZoom = memo<PanAndZoomProps>(PanAndZoomComponent);
