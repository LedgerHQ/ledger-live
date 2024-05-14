import { useState } from "react";
import { getMetadataMediaType } from "~/helpers/nft";
import { MediaProps } from "LLD/Collectibles/types/Media";

const useMedia = (props: MediaProps) => {
  const [useFallback, setUseFallback] = useState(false);
  const { mediaFormat, metadata } = props;
  const contentType = getMetadataMediaType(metadata, mediaFormat);
  const { uri, mediaType } =
    metadata?.medias[
      useFallback ? "preview" : (mediaFormat as keyof (typeof metadata)["medias"])
    ] || {};
  const squareWithDefault = props.square !== undefined ? props.square : contentType !== "video";

  return {
    useFallback,
    contentType,
    uri,
    mediaType,
    squareWithDefault,
    setUseFallback,
  };
};

export default useMedia;
