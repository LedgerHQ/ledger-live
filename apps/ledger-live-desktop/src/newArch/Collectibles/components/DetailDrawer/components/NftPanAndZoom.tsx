import React, { memo } from "react";
import { createPortal } from "react-dom";
import { NftPanAndZoomProps, NftPanAndZoomBodyProps } from "LLD/Collectibles/types/DetailDrawer";
import { Media } from "LLD/Collectibles/components/index";
import PrismaZoom from "react-prismazoom";
import IconCross from "~/renderer/icons/Cross";
import styled from "styled-components";

const Container = styled.div`
  background-color: rgba(0, 0, 0, 0.4);
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

const NFTImageContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CloseButton = styled.button`
  border: none;
  background-color: rgba(0, 0, 0, 0);
  position: absolute;
  top: 48px;
  right: 48px;
  color: white;
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

const NftPanAndZoomBody = memo<NftPanAndZoomBodyProps>(
  ({ tokenId, collectibleName, useFallback, setUseFallback, mediaType, contentType, imageUri }) => (
    <NFTImageContainer>
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
        />
      </PrismaZoom>
    </NFTImageContainer>
  ),
);

const NftPanAndZoomComponent: React.FC<NftPanAndZoomProps> = ({ onClose, tokenId, ...props }) => {
  const modal = (
    <Container onClick={onClose}>
      <CloseButton onClick={onClose} className="sidedrawer-close">
        <IconCross size={32} />
      </CloseButton>
      <NftPanAndZoomBody {...props} tokenId={tokenId} />
    </Container>
  );

  // we use the same portal as modals but don't use the modal component itself because we need
  // to handle the size of the model differently
  return domNode ? createPortal(modal, domNode) : null;
};

NftPanAndZoomBody.displayName = "NftPanAndZoomBody";
NftPanAndZoomComponent.displayName = "NftPanAndZoom";

export const NftPanAndZoom = memo<NftPanAndZoomProps>(NftPanAndZoomComponent);
