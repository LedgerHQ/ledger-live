import React, { useMemo, useEffect, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { decodeNftId } from "@ledgerhq/live-common/nft/nftId";
import { orderByLastReceived } from "@ledgerhq/live-common/nft/helpers";
import { useSelector } from "react-redux";

import { accountsSelector } from "../../reducers/accounts";
import { hiddenNftCollectionsSelector } from "../../reducers/settings";
import NftCard from "~/renderer/screens/nft/Gallery/TokensList/Item.jsx";
import { NFTMetadata } from "@ledgerhq/types-live";
import NftGalleryEmptyState from "./NftGalleryEmptyState";
import { FixedSizeGrid as Grid } from "react-window";

type Props = {
  handlePickNft: (nftMetadata: NFTMetadata) => void;
};

const NFTGallerySelector = ({ handlePickNft }: Props) => {
  const [gridHeight, setGridHeight] = useState<number>(window.innerHeight - 280);

  const accounts = useSelector(accountsSelector);
  const nfts = accounts.map(a => a.nfts ?? []).flat();

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const nftsOrdered = useMemo(() => {
    const visibleNfts = nfts.filter(
      nft => !hiddenNftCollections.includes(`${decodeNftId(nft.id).accountId}|${nft.contract}`),
    );
    return orderByLastReceived(accounts, visibleNfts);
  }, [accounts, hiddenNftCollections, nfts]);

  const hasNFTs = nftsOrdered.length > 0;

  useEffect(() => {
    const handleResize = () => {
      setGridHeight(window.innerHeight - 280);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Flex flex={1} flexWrap="wrap" justifyContent={"center"} alignItems={"center"}>
      {hasNFTs ? (
        <Grid
          columnCount={2}
          columnWidth={200}
          height={gridHeight}
          rowCount={Math.floor(nftsOrdered.length / 2)}
          rowHeight={250}
          width={415}
        >
          {({
            columnIndex,
            rowIndex,
            style,
          }: {
            columnIndex: number;
            rowIndex: number;
            style: object;
          }) => {
            return (
              <div style={style}>
                <NftCard
                  key={nftsOrdered[rowIndex * 2 + columnIndex].id}
                  mode={"grid"}
                  id={nftsOrdered[rowIndex * 2 + columnIndex].id}
                  account={accounts[0]}
                  overloadOnItemClick={handlePickNft}
                />
              </div>
            );
          }}
        </Grid>
      ) : (
        <NftGalleryEmptyState />
      )}
    </Flex>
  );
};

export default NFTGallerySelector;
