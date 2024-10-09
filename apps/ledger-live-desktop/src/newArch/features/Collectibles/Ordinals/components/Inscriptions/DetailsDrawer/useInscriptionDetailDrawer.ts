import { useMemo, useState } from "react";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import useCollectibles from "LLD/features/Collectibles/hooks/useCollectibles";
import { createDetails } from "LLD/features/Collectibles/utils/createInscriptionDetailsArrays";
import { useCalendarFormatted } from "~/renderer/hooks/useDateFormatter";
import { Tag } from "LLD/features/Collectibles/types/DetailDrawer";
import { processRareSat } from "../helpers";

type Props = {
  isLoading: boolean;
  inscription: SimpleHashNft;
  correspondingRareSat: SimpleHashNft | null | undefined;
};

const useInscriptionDetailDrawer = ({ isLoading, inscription, correspondingRareSat }: Props) => {
  const [useFallback, setUseFallback] = useState(false);
  const imageUri =
    inscription.video_url || inscription.previews?.image_large_url || inscription.image_url;

  const isVideo = !!inscription.video_url;

  const contentType = isVideo ? "video" : imageUri ? "image" : "";

  const { isPanAndZoomOpen, openCollectiblesPanAndZoom, closeCollectiblesPanAndZoom } =
    useCollectibles();

  const createdDateFromTimestamp = new Date(inscription.first_created?.timestamp || 0);
  const formattedCreatedDate = useCalendarFormatted(createdDateFromTimestamp);
  const createdDate = createdDateFromTimestamp === new Date(0) ? "" : formattedCreatedDate;
  const details = createDetails(inscription, createdDate);

  const tags: Tag[] =
    inscription.extra_metadata?.attributes?.map(attr => ({
      key: attr.trait_type,
      value: attr.value,
    })) || [];

  const rareSat = useMemo(() => {
    if (correspondingRareSat) return processRareSat(correspondingRareSat);
  }, [correspondingRareSat]);

  const data = {
    areFieldsLoading: isLoading,
    collectibleName: inscription.name || inscription.contract.name || "",
    contentType,
    collectionName: inscription.collection.name || "",
    details: details,
    previewUri: imageUri,
    originalUri: imageUri,
    isPanAndZoomOpen,
    mediaType: inscription.video_properties?.mime_type || "image",
    tags: tags,
    useFallback: useFallback,
    tokenId: inscription.nft_id,
    isOpened: true,
    closeCollectiblesPanAndZoom,
    openCollectiblesPanAndZoom,
    setUseFallback: setUseFallback,
  };

  return { inscription, data, rareSat };
};

export default useInscriptionDetailDrawer;
