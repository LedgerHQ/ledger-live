import React, { useState } from "react";
import { ImageProps } from "LLD/Collectibles/types/Media";
import styled from "styled-components";
import { Skeleton, Placeholder } from "LLD/Collectibles/components";
/**
 * Nb: This image component can be used for small listings, large gallery rendering,
 * and even tokens without an image where it will fallback to a generative image
 * based on the token metadata and some hue changes.
 *
 * The text in the fallback image is only visible if we are in `full` mode, since list
 * mode is not large enough for the text to be readable.
 */

const Wrapper = styled.div<{
  full?: ImageProps["full"];
  size?: ImageProps["size"];
  loaded: boolean;
  squareWithDefault: ImageProps["squareWithDefault"];
  maxHeight?: ImageProps["maxHeight"];
  objectFit?: ImageProps["objectFit"];
  error?: boolean;
}>`
  width: ${({ full, size }) => (full ? "100%" : `${size}px`)};
  height: ${({ full }) => full && "100%"};
  aspect-ratio: ${({ squareWithDefault }) => (squareWithDefault ? "1 / 1" : "initial")};
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

  & > img {
    display: ${({ loaded, error }) => (loaded || error ? "block" : "none")};
    ${({ objectFit }) =>
      objectFit === "cover"
        ? `width: 100%;
        height: 100%;`
        : `max-width: 100%;
        max-height: 100%;`}
    object-fit: ${p => p.objectFit ?? "cover"};
    border-radius: 4px;
    user-select: none;
  }
`;

const ImageComponent: React.FC<ImageProps> = ({
  uri,
  full = false,
  size = 32,
  maxHeight,
  onClick,
  squareWithDefault = true,
  objectFit = "cover",
  setUseFallback,
  isFallback,
  isLoading,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isImageReady = uri && !isLoading && !error;

  return (
    <Wrapper
      full={full}
      size={size}
      loaded={loaded}
      error={error || !uri}
      squareWithDefault={squareWithDefault}
      maxHeight={maxHeight}
      objectFit={objectFit}
    >
      <Skeleton full />
      {isImageReady ? (
        <img
          // This prevent a bug where the change of props from isFallback
          // would not unbind onError and would not trigger it again in case of error
          key={isFallback?.toString()}
          onClick={onClick}
          onLoad={() => setLoaded(true)}
          onError={() => (isFallback ? setError(true) : setUseFallback?.(true))}
          src={uri}
        />
      ) : (
        <Placeholder />
      )}
    </Wrapper>
  );
};

export const Image = ImageComponent;
