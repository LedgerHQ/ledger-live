import { isCustomLockScreenSupported } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { NFTMetadata, NFTMedias } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getMetadataMediaTypes } from "~/helpers/nft";
import { setDrawer } from "~/renderer/drawers/Provider";
import { devicesModelListSelector } from "~/renderer/reducers/settings";
import { isNFTMetadata } from "LLD/features/Collectibles/utils/typeGuardsChecker";
import CustomImage from "~/renderer/screens/customImage";

export const useCustomImage = (
  t: TFunction,
  metadata: NFTMetadata | SimpleHashNft["extra_metadata"],
  inscription?: SimpleHashNft,
) => {
  const devicesModelList = useSelector(devicesModelListSelector);
  const customImageUri = useMemo(() => {
    if (!isNFTMetadata(metadata))
      return inscription?.previews?.image_large_url || inscription?.image_url;

    const mediaTypes = metadata ? getMetadataMediaTypes(metadata) : null;
    const mediaSizeForCustomImage = mediaTypes
      ? ["original", "big", "preview"].find(size => mediaTypes[size] === "image")
      : null;
    return mediaSizeForCustomImage
      ? metadata?.medias?.[mediaSizeForCustomImage as keyof NFTMedias]?.uri
      : null;
  }, [inscription?.image_url, inscription?.previews?.image_large_url, metadata]);

  const customImageDeviceModelIds = devicesModelList.filter(isCustomLockScreenSupported);
  const customImageDeviceModelId =
    customImageDeviceModelIds.length === 1 ? customImageDeviceModelIds[0] : null;
  const showCustomImageButton = Boolean(customImageUri) && customImageDeviceModelIds.length > 0;

  return useMemo(
    () => ({
      customImageUri,
      customImageDeviceModelId,
      showCustomImageButton,
      customImage: {
        id: "custom-image",
        label: t("customImage.cta"),
        Icon: IconsLegacy.PhotographMedium,
        callback: () => {
          if (customImageUri)
            setDrawer(CustomImage, {
              imageUri: customImageUri,
              deviceModelId: customImageDeviceModelId,
              isFromNFTEntryPoint: true,
            });
        },
      },
    }),
    [customImageDeviceModelId, customImageUri, showCustomImageButton, t],
  );
};
