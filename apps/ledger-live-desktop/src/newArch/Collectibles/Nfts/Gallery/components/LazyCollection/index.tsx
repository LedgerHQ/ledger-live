import React, { useCallback, useMemo } from "react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { Box, Text } from "@ledgerhq/react-ui";
import { CollectionName } from "LLD/Collectibles/components/CollectionName";
import NftTokensList from "../TokensList";
import styled from "styled-components";

type LazyCollectionProps = {
  collections: Record<string, ProtoNFT[]>;
  maxVisibleNFTs: number;
  account: Account;
  onSelectCollection: (contract: string) => void;
};

const ClickableCollectionName = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`;

const LazyCollection = ({
  collections,
  maxVisibleNFTs,
  account,
  onSelectCollection,
}: LazyCollectionProps) => {
  const renderCollection = useCallback(
    (contract: string, nfts: ProtoNFT[], displayedNFTs: number) => {
      const nftsToDisplay = nfts.slice(0, Math.max(0, maxVisibleNFTs - displayedNFTs));
      return (
        <div key={contract}>
          <ClickableCollectionName mb={2} onClick={() => onSelectCollection(contract)}>
            <Text ff="Inter|Medium" fontSize={6} color="palette.text.shade100">
              <CollectionName nft={nfts[0]} fallback={contract} account={account} showHideMenu />
            </Text>
          </ClickableCollectionName>
          {account && <NftTokensList account={account} nfts={nftsToDisplay} />}
        </div>
      );
    },
    [maxVisibleNFTs, account, onSelectCollection],
  );

  const [collectionsRender, isLoading] = useMemo(() => {
    const collectionsRender: JSX.Element[] = [];
    let displayedNFTs = 0;
    Object.entries(collections).forEach(([contract, nfts]) => {
      if (displayedNFTs >= maxVisibleNFTs) return;
      collectionsRender.push(renderCollection(contract, nfts, displayedNFTs));
      displayedNFTs += nfts.length;
    });
    return [collectionsRender, displayedNFTs > maxVisibleNFTs];
  }, [collections, maxVisibleNFTs, renderCollection]);

  return <div>{isLoading ? <div>Loading...</div> : collectionsRender}</div>;
};

export default LazyCollection;
