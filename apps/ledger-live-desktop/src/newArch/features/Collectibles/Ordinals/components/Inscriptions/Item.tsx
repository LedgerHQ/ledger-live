import { InscriptionsItemProps } from "LLD/features/Collectibles/types/Inscriptions";
import TableRow from "LLD/features/Collectibles/components/Collection/TableRow";
import React from "react";

type ItemProps = {
  isLoading: boolean;
} & InscriptionsItemProps;

const Item: React.FC<ItemProps> = ({
  isLoading,
  tokenName,
  collectionName,
  tokenIcons,
  media,
  rareSatName,
  onClick,
}) => (
  <TableRow
    isLoading={isLoading}
    tokenName={tokenName}
    collectionName={collectionName}
    tokenIcons={tokenIcons}
    media={media}
    rareSatName={rareSatName || []}
    onClick={onClick}
  />
);

export default Item;
