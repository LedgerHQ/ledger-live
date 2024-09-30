import React from "react";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { DetailDrawer } from "LLD/features/Collectibles/components";
import { CollectibleTypeEnum } from "LLD/features/Collectibles/types/enum/Collectibles";
import useInscriptionDetailDrawer from "./useInscriptionDetailDrawer";
import Actions from "./Actions";
import SubTitle from "./SubTitle";

type ViewProps = ReturnType<typeof useInscriptionDetailDrawer> & {
  onClose: () => void;
};

type Props = {
  inscription: SimpleHashNft;
  correspondingRareSat: SimpleHashNft | null | undefined;
  isLoading: boolean;
  onClose: () => void;
};

const View: React.FC<ViewProps> = ({ data, rareSat, onClose }) => (
  <DetailDrawer
    collectibleType={CollectibleTypeEnum.NFT}
    areFieldsLoading={data.areFieldsLoading}
    collectibleName={data.collectibleName}
    contentType={data.contentType}
    collectionName={data.collectionName}
    details={data.details}
    previewUri={data.previewUri}
    originalUri={data.originalUri}
    isPanAndZoomOpen={data.isPanAndZoomOpen}
    mediaType={data.mediaType}
    tags={data.tags}
    useFallback={data.useFallback}
    tokenId={data.tokenId}
    isOpened={true}
    closeCollectiblesPanAndZoom={data.closeCollectiblesPanAndZoom}
    handleRequestClose={onClose}
    openCollectiblesPanAndZoom={data.openCollectiblesPanAndZoom}
    setUseFallback={data.setUseFallback}
  >
    {rareSat?.icons && (
      <DetailDrawer.Subtitle>
        <SubTitle icons={Object.values(rareSat.icons)} names={rareSat.names} />
      </DetailDrawer.Subtitle>
    )}
    <DetailDrawer.Actions>
      <Actions />
    </DetailDrawer.Actions>
  </DetailDrawer>
);

const InscriptionDetailDrawer = ({
  inscription,
  isLoading,
  correspondingRareSat,
  onClose,
}: Props) => {
  return (
    <View
      onClose={onClose}
      {...useInscriptionDetailDrawer({ isLoading, inscription, correspondingRareSat })}
    />
  );
};

export default InscriptionDetailDrawer;
