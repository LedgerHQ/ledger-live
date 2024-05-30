import React, { useCallback } from "react";
import { NFTMetadata } from "@ledgerhq/types-live";
import { DetailDrawer } from "LLD/Collectibles/components/DetailDrawer";
import useNftDetailDrawer from "LLD/Collectibles/hooks/useNftDetailDrawer";
import useCollectibles from "LLD/Collectibles/hooks/useCollectibles";
import { NftsDetailDrawerProps } from "LLD/Collectibles/types/Nfts";
import { CollectibleTypeEnum } from "LLD/Collectibles/types/Collectibles";
import Ctas from "./Ctas";

const NftDetailDrawer = ({ account, tokenId, isOpened, setIsOpened }: NftsDetailDrawerProps) => {
  const {
    collectionName,
    nftName,
    tags,
    isLoading,
    details,
    metadata,
    contentType,
    protoNft,
    imageUri,
    useFallback,
    mediaType,
    setUseFallback,
    onNFTSend,
  } = useNftDetailDrawer(account, tokenId);

  const { isPanAndZoomOpen, openCollectiblesPanAndZoom, closeCollectiblesPanAndZoom } =
    useCollectibles();

  const handleRequestClose = useCallback(() => setIsOpened(false), [setIsOpened]);

  return (
    <DetailDrawer
      collectibleType={CollectibleTypeEnum.NFT}
      areFieldsLoading={isLoading}
      collectibleName={nftName}
      contentType={contentType}
      collectionName={collectionName}
      details={details}
      imageUri={imageUri}
      isPanAndZoomOpen={isPanAndZoomOpen}
      mediaType={mediaType}
      tags={tags}
      useFallback={useFallback}
      tokenId={tokenId}
      isOpened={isOpened}
      closeCollectiblesPanAndZoom={closeCollectiblesPanAndZoom}
      handleRequestClose={handleRequestClose}
      openCollectiblesPanAndZoom={openCollectiblesPanAndZoom}
      setUseFallback={setUseFallback}
    >
      <DetailDrawer.Ctas>
        <Ctas
          protoNft={protoNft}
          metadata={metadata as NFTMetadata}
          account={account}
          onNFTSend={onNFTSend}
        />
      </DetailDrawer.Ctas>
    </DetailDrawer>
  );
};

export default NftDetailDrawer;
