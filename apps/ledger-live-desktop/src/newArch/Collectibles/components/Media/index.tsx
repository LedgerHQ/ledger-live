import React from "react";
import { MediaProps } from "LLD/Collectibles/types/Media";
import useMedia from "LLD/Collectibles/hooks/useMedia";
import { Placeholder, Image, Video } from "LLD/Collectibles/components";

const MediaComponent: React.FC<MediaProps> = props => {
  const { useFallback, contentType, uri, mediaType, squareWithDefault, setUseFallback } =
    useMedia(props);
  const Component = contentType === "video" && !useFallback ? Video : Image;

  return uri ? (
    <Component
      {...props}
      uri={uri}
      mediaType={mediaType}
      square={squareWithDefault}
      isFallback={useFallback}
      setUseFallback={setUseFallback}
    />
  ) : (
    <Placeholder metadata={props.metadata} tokenId={props.tokenId} />
  );
};

export const Media = MediaComponent;
