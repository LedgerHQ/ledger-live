import React, { useMemo } from "react";
import { InscriptionsItemProps } from "LLD/features/Collectibles/types/Inscriptions";
import TableRow from "LLD/features/Collectibles/components/Collection/TableRow";
import { GroupedNftOrdinals } from "@ledgerhq/live-nft-react/index";
import { findCorrespondingSat } from "LLD/features/Collectibles/utils/findCorrespondingSat";
import { processRareSat } from "../helpers";

type ItemProps = {
  isLoading: boolean;
  inscriptionsGroupedWithRareSats: GroupedNftOrdinals[];
} & InscriptionsItemProps;

const Item: React.FC<ItemProps> = ({
  isLoading,
  tokenName,
  collectionName,
  media,
  nftId,
  inscriptionsGroupedWithRareSats,
  onClick,
}) => {
  const correspondingRareSat = findCorrespondingSat(inscriptionsGroupedWithRareSats, nftId);
  const rareSat = useMemo(() => {
    if (correspondingRareSat) return processRareSat(correspondingRareSat.rareSat);
  }, [correspondingRareSat]);

  return (
    <TableRow
      isLoading={isLoading}
      tokenName={tokenName}
      collectionName={collectionName}
      tokenIcons={rareSat?.icons || []}
      media={media}
      rareSatName={rareSat?.names || []}
      onClick={onClick}
    />
  );
};

export default Item;
