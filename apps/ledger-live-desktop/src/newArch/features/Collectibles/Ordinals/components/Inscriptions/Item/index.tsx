import React, { useMemo } from "react";
import { InscriptionsItemProps } from "LLD/features/Collectibles/types/Inscriptions";
import TableRow from "LLD/features/Collectibles/components/Collection/TableRow";
import { GroupedNftOrdinals } from "@ledgerhq/live-nft-react/index";
import { findCorrespondingSat } from "LLD/features/Collectibles/utils/findCorrespondingSat";
import { processRareSat } from "../helpers";
import { CollectibleTypeEnum } from "LLD/features/Collectibles/types/enum/Collectibles";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import CollectionContextMenu from "LLD/components/ContextMenu/CollectibleContextMenu";

type ItemProps = {
  isLoading: boolean;
  inscriptionsGroupedWithRareSats: GroupedNftOrdinals[];
  account: BitcoinAccount;
} & InscriptionsItemProps;

const Item: React.FC<ItemProps> = ({
  isLoading,
  tokenName,
  collectionName,
  media,
  nftId,
  inscriptionsGroupedWithRareSats,
  account,
  onClick,
}) => {
  const correspondingRareSat = findCorrespondingSat(inscriptionsGroupedWithRareSats, nftId);
  const rareSat = useMemo(() => {
    if (correspondingRareSat) return processRareSat(correspondingRareSat.rareSat);
  }, [correspondingRareSat]);

  return (
    <CollectionContextMenu
      account={account}
      collectionAddress={nftId}
      typeOfCollectible={CollectibleTypeEnum.Inscriptions}
      inscriptionId={nftId}
      inscriptionName={tokenName}
    >
      <TableRow
        isLoading={isLoading}
        tokenName={tokenName}
        collectionName={collectionName}
        tokenIcons={rareSat?.icons || []}
        media={media}
        rareSatName={rareSat?.names || []}
        onClick={onClick}
      />
    </CollectionContextMenu>
  );
};

export default Item;
