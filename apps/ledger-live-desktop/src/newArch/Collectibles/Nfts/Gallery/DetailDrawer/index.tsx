import React from "react";
import { NFTMetadata } from "@ledgerhq/types-live";
import { DetailDrawer } from "LLD/Collectibles/components/DetailDrawer";
import useNftDetailDrawer from "LLD/Collectibles/hooks/useNftDetailDrawer";
import useCollectibles from "LLD/Collectibles/hooks/useCollectibles";
import { NftsDetailDrawerProps } from "LLD/Collectibles/types/Nfts";
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

  return (
    <DetailDrawer
      collectionName={collectionName}
      collectibleName={nftName}
      title={nftName}
      tags={tags}
      details={details}
      isOpened={isOpened}
      areFieldsLoading={isLoading}
      metadata={metadata as NFTMetadata}
      tokenId={tokenId}
      contentType={contentType}
      isPanAndZoomOpen={isPanAndZoomOpen}
      imageUri={imageUri}
      useFallback={useFallback}
      mediaType={mediaType}
      setUseFallback={setUseFallback}
      openCollectiblesPanAndZoom={openCollectiblesPanAndZoom}
      closeCollectiblesPanAndZoom={closeCollectiblesPanAndZoom}
      handleRequestClose={() => setIsOpened(false)}
    >
      <DetailDrawer.Ctas>
        <Ctas
          protoNft={protoNft}
          account={account}
          metadata={metadata as NFTMetadata}
          onNFTSend={onNFTSend}
        />
      </DetailDrawer.Ctas>
    </DetailDrawer>
  );
};

export default NftDetailDrawer;
