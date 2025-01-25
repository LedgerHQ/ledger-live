import React from "react";
import styled from "styled-components";
import ZoomInIcon from "~/renderer/icons/ZoomIn";
import { Skeleton } from "LLD/features/Collectibles/components";

const ImageContainer = styled.div`
  position: relative;
  cursor: ${({ contentType }: { contentType: string | undefined }) =>
    contentType === "image" ? "pointer" : "initial"};
`;

const ImageOverlay = styled.div`
  opacity: 0;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  &:hover {
    opacity: 1;
  }
`;

type MediaContainerProps = {
  children: React.ReactNode;
  contentType: string | undefined;
  isMediaLoaded: boolean;
  openPanAndZoom: React.MouseEventHandler<HTMLDivElement> | undefined;
};

const MediaContainerComponent: React.FC<MediaContainerProps> = ({
  children,
  contentType,
  isMediaLoaded,
  openPanAndZoom,
}) => {
  return (
    <>
      <Skeleton show={isMediaLoaded} width={420} barHeight={200}>
        <ImageContainer
          contentType={contentType}
          onClick={contentType === "image" ? openPanAndZoom : undefined}
        >
          {children}
          {contentType === "image" ? (
            <ImageOverlay>
              <ZoomInIcon color="white" />
            </ImageOverlay>
          ) : null}
        </ImageContainer>
      </Skeleton>
    </>
  );
};

export const MediaContainer = MediaContainerComponent;
