import React, { useMemo } from "react";
import { Box } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/lib/account/";
import { Account, Operation, ProtoNFT } from "@ledgerhq/types-live";
import { NftList } from "../../../components/Nft/NftList";
import { accountsSelector } from "../../../reducers/accounts";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";

const getNFTById = (tokenId?: string, nfts?: ProtoNFT[]) =>
  nfts?.find(nft => nft.tokenId === tokenId);

function orderByLastReceived(accounts: Account[], nfts: ProtoNFT[]) {
  const orderedNFTs: ProtoNFT[] = [];
  let operationMapping: Operation[] = [];

  const res = groupAccountsOperationsByDay(accounts, {
    count: Infinity,
  });

  // Sections are sorted by Date, the most recent being the first
  res.sections.forEach(section => {
    // Get all operation linked to the reception of an NFT
    const operations = section.data.filter(
      d => d.type === "NFT_IN" && d.contract && d.tokenId,
    );
    console.log(operations);
    operationMapping = operationMapping.concat(operations);
  });

  operationMapping.forEach(operation => {
    // Prevent multiple occurences due to Exchange Send/Receive same NFT several times
    const isAlreadyIn = orderedNFTs.find(
      nft => nft.tokenId === operation.tokenId,
    );

    if (!isAlreadyIn) {
      const nft = getNFTById(operation.tokenId, nfts);
      if (nft) orderedNFTs.push(nft);
    }
  });

  return orderedNFTs;
}

const WalletNftGallery = () => {
  const accounts = useSelector(accountsSelector);
  const nfts = accounts.map(a => a.nfts ?? []).flat();

  const nftsOrdered = useMemo(
    () => orderByLastReceived(accounts, nfts),
    [accounts, nfts],
  );
  const hasNFTs = nftsOrdered.length > 0;
  return (
    <Box mx={6} mt={6} mb={12} flex={1}>
      {hasNFTs ? <NftList data={nftsOrdered} /> : <NftGalleryEmptyState />}
    </Box>
  );
};

export default WalletNftGallery;
