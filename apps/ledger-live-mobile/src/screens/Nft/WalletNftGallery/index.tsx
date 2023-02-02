import React, { useMemo } from "react";
import { Box } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { orderByLastReceived } from "@ledgerhq/live-common/nft/helpers";
import { decodeNftId } from "@ledgerhq/live-common/nft/nftId";
import { useTheme } from "styled-components/native";
import { NftList } from "../../../components/Nft/NftList";
import { accountsSelector } from "../../../reducers/accounts";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "../../../components/WalletTab/CollapsibleHeaderScrollView";
import { hiddenNftCollectionsSelector } from "../../../reducers/settings";

const WalletNftGallery = () => {
  const accounts = useSelector(accountsSelector);
  const nfts = accounts.map(a => a.nfts ?? []).flat();
  const { space } = useTheme();
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const nftsOrdered = useMemo(() => {
    const visibleNfts = nfts.filter(
      nft =>
        !hiddenNftCollections.includes(
          `${decodeNftId(nft.id).accountId}|${nft.contract}`,
        ),
    );
    return orderByLastReceived(accounts, visibleNfts);
  }, [accounts, hiddenNftCollections, nfts]);

  const hasNFTs = nftsOrdered.length > 0;

  return (
    <>
      <Box>
        {hasNFTs ? (
          <NftList data={nftsOrdered} />
        ) : (
          <CollapsibleHeaderScrollView
            contentContainerStyle={{
              paddingTop: 0,
              marginHorizontal: space[6],
            }}
          >
            <NftGalleryEmptyState />
          </CollapsibleHeaderScrollView>
        )}
      </Box>
    </>
  );
};

export default WalletNftGallery;
