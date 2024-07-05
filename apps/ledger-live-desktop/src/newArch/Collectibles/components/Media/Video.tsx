import React, { useState } from "react";
import { VideoProps } from "LLD/Collectibles/types/Media";
import { Skeleton } from "LLD/Collectibles/components";
import styled from "styled-components";

const Wrapper = styled.div<{
  full?: VideoProps["full"];
  size?: VideoProps["size"];
  loaded: boolean;
  squareWithDefault: VideoProps["squareWithDefault"];
  maxHeight?: VideoProps["maxHeight"];
  objectFit?: VideoProps["objectFit"];
  error?: boolean;
}>`
  width: ${({ full, size }) => (full ? "100%" : `${size}px`)};
  height: ${({ full }) => full && "100%"};
  aspect-ratio: ${({ squareWithDefault, error }) =>
    squareWithDefault || error ? "1 / 1" : "initial"};
  max-height: ${({ maxHeight }) => maxHeight && `${maxHeight}px`};
  border-radius: 4px;
  overflow: hidden;
  background-size: contain;
  display: flex;
  align-items: center;
  justify-content: center;

  & > *:nth-child(1) {
    display: ${({ loaded, error }) => (loaded || error ? "none" : "block")};
  }

  & > video {
    display: ${({ loaded, error }) => (loaded || error ? "block" : "none")};
    ${({ objectFit }) =>
      objectFit === "cover"
        ? `width: 100%;
          height: 100%;`
        : `max-width: 100%;
        max-height: 100%;`}
    object-fit: ${p => p.objectFit ?? "contain"};
    border-radius: 4px;
    user-select: none;
    position: relative;
    z-index: 10;
  }
`;

const VideoComponent: React.FC<VideoProps> = ({
  uri,
  mediaType,
  full = false,
  size = 32,
  maxHeight,
  squareWithDefault = true,
  objectFit = "contain",
  setUseFallback,
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Wrapper
      full={full}
      size={size}
      loaded={loaded}
      squareWithDefault={squareWithDefault}
      maxHeight={maxHeight}
      objectFit={objectFit}
    >
      <Skeleton full />
      <video
        onError={() => {
          setUseFallback?.(true);
        }}
        onLoadedData={() => setLoaded(true)}
        autoPlay
        loop
        controls
        disablePictureInPicture
      >
        <source src={uri} type={mediaType} />
      </video>
    </Wrapper>
  );
};

export const Video: React.ComponentType<VideoProps> = VideoComponent;
