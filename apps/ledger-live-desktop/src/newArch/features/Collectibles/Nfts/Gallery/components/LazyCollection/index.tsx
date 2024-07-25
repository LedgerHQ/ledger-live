import React, { memo, useEffect, useMemo } from "react";
import { Box, Text } from "@ledgerhq/react-ui";
import { CollectionName } from "LLD/features/Collectibles/components";
import TokenList from "LLD/features/Collectibles/Nfts/components/TokensList";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import styled from "styled-components";

type LazyCollectionProps = {
  account: Account;
  collections: [string, ProtoNFT[]][];
  maxVisibleNFTs: number;
  onSelectCollection: (contract: string) => void;
  setIsLoading: (isLoading: boolean) => void;
};

const ClickableCollectionName = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`;

const LazyCollection: React.FC<LazyCollectionProps> = ({
  account,
  collections,
  maxVisibleNFTs,
  onSelectCollection,
  setIsLoading,
}) => {
  const renderedCollections = useMemo(() => {
    const renderedCollections: JSX.Element[] = [];
    let displayedNFTs = 0;
    collections.forEach(([contract, nfts]: [string, ProtoNFT[]]) => {
      if (displayedNFTs > maxVisibleNFTs) return;
      renderedCollections.push(
        <div key={contract}>
          <ClickableCollectionName mb={2} onClick={() => onSelectCollection(contract)}>
            <Text ff="Inter|Medium" fontSize={6} color="palette.text.shade100">
              <CollectionName
                collectiblesNumber={nfts.length}
                nft={nfts[0]}
                fallback={contract}
                account={account}
                showHideMenu
              />
            </Text>
          </ClickableCollectionName>
          {account && (
            <>
              <TokenList account={account} nfts={nfts.slice(0, maxVisibleNFTs - displayedNFTs)} />
            </>
          )}
        </div>,
      );
      displayedNFTs += nfts.length;
    });
    return renderedCollections;
  }, [collections, maxVisibleNFTs, account, onSelectCollection]);

  useEffect(() => {
    const isLoading = renderedCollections.length < collections.length;
    setIsLoading(isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderedCollections]);

  return <>{renderedCollections}</>;
};

export default memo(LazyCollection);
