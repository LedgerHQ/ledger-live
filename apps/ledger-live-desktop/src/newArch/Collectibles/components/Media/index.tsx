import React from "react";
import { MediaProps } from "LLD/Collectibles/types/Media";
import { Placeholder, Image, Video } from "LLD/Collectibles/components";

const MediaComponent: React.FC<MediaProps> = props => {
  const Component = props.contentType === "video" && !props.useFallback ? Video : Image;
  console.log(props);
  return props.uri ? (
    <Component
      {...props}
      uri={props.uri}
      mediaType={props.mediaType}
      squareWithDefault={props.squareWithDefault}
      isFallback={props.useFallback}
      setUseFallback={props.setUseFallback}
    />
  ) : (
    <Placeholder />
  );
};

export const Media = MediaComponent;
