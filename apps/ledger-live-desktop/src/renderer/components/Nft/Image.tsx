import React from "react";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { NFTMetadata } from "@ledgerhq/types-live";
import Skeleton from "./Skeleton";
import Placeholder from "./Placeholder";

/**
 * Nb: This image component can be used for small listings, large gallery rendering,
 * and even tokens without an image where it will fallback to a generative image
 * based on the token metadata and some hue changes.
 *
 * The text in the fallback image is only visible if we are in `full` mode, since list
 * mode is not large enough for the text to be readable.
 */
const Wrapper: ThemedComponent<{
  full?: boolean;
  size?: number;
  loaded: boolean;
  square: boolean;
  maxHeight?: number;
  maxWidth?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}> = styled.div`
  width: ${({ full, size }) => (full ? "100%" : `${size}px`)};
  height: ${({ full }) => full && "100%"};
  aspect-ratio: ${({ square }) => (square ? "1 / 1" : "initial")};
  max-width: ${({ maxWidth }) => maxWidth && `${maxWidth}px`};
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
type Props = {
  uri: string;
  mediaType: string;
  metadata: NFTMetadata;
  tokenId: string;
  full?: boolean;
  size?: number;
  maxHeight?: number;
  maxWidth?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  square?: boolean;
  onClick?: (e: Event) => void;
  setUseFallback: (a: boolean) => void;
  isFallback: boolean;
};
type State = {
  loaded: boolean;
  error: boolean;
};
class Image extends React.PureComponent<Props, State> {
  static defaultProps = {
    full: false,
    size: 32,
    mediaFormat: "preview",
  };

  state = {
    loaded: false,
    error: false,
  };

  render() {
    const {
      uri,
      metadata,
      full,
      size,
      tokenId,
      maxHeight,
      onClick,
      square = true,
      objectFit = "cover",
      setUseFallback,
      isFallback,
    } = this.props;
    const { loaded, error } = this.state;
    return (
      <Wrapper
        full={full}
        size={size}
        loaded={loaded}
        error={error || !uri}
        square={square}
        maxHeight={maxHeight}
        objectFit={objectFit}
      >
        <Skeleton full />
        {uri && !error ? (
          <img
            // This prevent a bug where the change of props from isFallback
            // would not unbind onError and would not trigger it again in case of error
            key={isFallback?.toString()}
            onClick={onClick}
            onLoad={() =>
              this.setState({
                loaded: true,
              })
            }
            onError={() => {
              if (isFallback) {
                this.setState({
                  error: true,
                });
              } else {
                setUseFallback(true);
              }
            }}
            src={uri}
          />
        ) : (
          <Placeholder tokenId={tokenId} metadata={metadata} full={full} />
        )}
      </Wrapper>
    );
  }
}
export default Image;
