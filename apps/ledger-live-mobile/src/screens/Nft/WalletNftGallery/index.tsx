import React, { useMemo } from "react";
import { Box } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import {
  nftsByCollections,
  orderByLastReceived,
} from "@ledgerhq/live-common/lib/nft/helpers";
import { ProtoNFT } from "@ledgerhq/types-live";
import { decodeNftId } from "@ledgerhq/live-common/lib/nft/nftId";
import { NftList } from "../../../components/Nft/NftList";
import { accountsSelector } from "../../../reducers/accounts";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import { hiddenNftCollectionsSelector } from "../../../reducers/settings";

const WalletNftGallery = () => {
  const accounts = useSelector(accountsSelector);
  const nfts = accounts.map(a => a.nfts ?? []).flat();

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const nftCollections = useMemo(
    () =>
      Object.entries(nftsByCollections(nfts)).filter(
        ([id, contract]) =>
          !hiddenNftCollections.includes(`${decodeNftId(id)}|${contract}`),
      ),
    [hiddenNftCollections, nfts],
  ) as [string, ProtoNFT[]][];

  const visibleNfts = Object.values(nftCollections)
    .map(object => object[1])
    .flat();

  const nftsOrdered = useMemo(
    () => orderByLastReceived(accounts, visibleNfts),
    [accounts, visibleNfts],
  );
  const hasNFTs = nftsOrdered.length > 0;
  return (
    <Box mx={6} mt={6} mb={12} flex={1}>
      {hasNFTs ? <NftList data={nftsOrdered} /> : <NftGalleryEmptyState />}
    </Box>
  );
};

export default WalletNftGallery;
