import { CollectibleType } from "LLD/features/Collectibles/types/Collectibles";
import { CollectibleTypeEnum } from "LLD/features/Collectibles/types/enum/Collectibles";
import { PanAndZoomProps, DetailDrawerProps } from "LLD/features/Collectibles/types/DetailDrawer";
import { MediaProps } from "LLD/features/Collectibles/types/Media";
import { NftComponentData } from "LLD/features/Collectibles/types/Nfts";
import { satisfies } from "semver";

function isNftData(data: unknown): data is NftComponentData {
  return Boolean(data) && typeof (data as NftComponentData).collectionName === "string";
}

export function createCollectibleObject(type: CollectibleType, data: unknown) {
  if (type === CollectibleTypeEnum.NFT) {
    if (isNftData(data)) {
      return {
        type: CollectibleTypeEnum.NFT,
        mediaProps: {
          collectibleName: data.nftName,
          contentType: data.contentType,
          mediaType: data.mediaType,
          tokenId: data.tokenId,
          uri: data.imageUri,
          useFallback: data.useFallback,
          squareWithDefault: false,
          setUseFallback: data.setUseFallback,
          isLoading: data.isLoading,
        } as MediaProps,
        panAndZoomProps: {
          collectibleName: data.nftName ?? null,
          contentType: data.contentType,
          imageUri: data.imageUri,
          mediaType: data.mediaType,
          tokenId: data.tokenId,
          useFallback: data.useFallback,
          onClose: data.closeCollectiblesPanAndZoom,
          setUseFallback: data.setUseFallback,
        } as PanAndZoomProps,
        other: {},
      };
    } else {
      throw new Error("Invalid data for NFT");
    }
  }

  if (type === CollectibleTypeEnum.Ordinal) {
    return {
      detailDrawerProps: {
        isOpened: false,
      } as DetailDrawerProps,
      mediaProps: {} as MediaProps,
      panAndZoomProps: {} as PanAndZoomProps,
    };
  }

  return {
    detailDrawerProps: {
      isOpened: false,
    } as DetailDrawerProps,
    mediaProps: {} as MediaProps,
    panAndZoomProps: {} as PanAndZoomProps,
  };
}
