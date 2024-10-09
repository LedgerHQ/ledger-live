import React from "react";
import { MediaProps } from "LLD/features/Collectibles/types/Media";
import { Placeholder, Image, Video } from "LLD/features/Collectibles/components";

const MediaComponent: React.FC<MediaProps> = props => {
  const Component = props.contentType === "video" && !props.useFallback ? Video : Image;

  return props.uri || props.isLoading ? (
    <Component
      {...props}
      uri={props.uri}
      mediaType={props.mediaType}
      squareWithDefault={props.squareWithDefault}
      isFallback={props.useFallback}
      setUseFallback={props.setUseFallback}
    />
  ) : (
    <Placeholder size={props.size} backgroundSize={props.backgroundSize} />
  );
};

export const Media = MediaComponent;
