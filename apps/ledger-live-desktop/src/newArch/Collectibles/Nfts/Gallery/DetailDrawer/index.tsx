import React, { useCallback } from "react";
import { NFTMetadata } from "@ledgerhq/types-live";
import { DetailDrawer } from "LLD/Collectibles/components/DetailDrawer";
import useNftDetailDrawer from "LLD/Collectibles/hooks/useNftDetailDrawer";
import useCollectibles from "LLD/Collectibles/hooks/useCollectibles";
import { NftsDetailDrawerProps } from "LLD/Collectibles/types/Nfts";
import { CollectibleTypeEnum } from "LLD/Collectibles/types/Collectibles";
import Actions from "./Actions";

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
    previewUri,
    originalUri,
    useFallback,
    mediaType,
    doNotOpenDrawer,
    setUseFallback,
    onNFTSend,
  } = useNftDetailDrawer(account, tokenId);

  const { isPanAndZoomOpen, openCollectiblesPanAndZoom, closeCollectiblesPanAndZoom } =
    useCollectibles();

  const handleRequestClose = useCallback(() => setIsOpened(false), [setIsOpened]);

  if (doNotOpenDrawer) return null;

  return (
    <DetailDrawer
      collectibleType={CollectibleTypeEnum.NFT}
      areFieldsLoading={isLoading}
      collectibleName={nftName}
      contentType={contentType}
      collectionName={collectionName}
      details={details}
      previewUri={previewUri}
      originalUri={originalUri}
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
      <DetailDrawer.Actions>
        <Actions
          protoNft={protoNft}
          metadata={metadata as NFTMetadata}
          account={account}
          onNFTSend={onNFTSend}
        />
      </DetailDrawer.Actions>
    </DetailDrawer>
  );
};

export default NftDetailDrawer;
