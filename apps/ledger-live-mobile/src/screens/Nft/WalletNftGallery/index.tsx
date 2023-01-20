import React, { useEffect, useMemo } from "react";
import { Box } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { orderByLastReceived } from "@ledgerhq/live-common/nft/helpers";
import { decodeNftId } from "@ledgerhq/live-common/nft/nftId";
import { NftList } from "../../../components/Nft/NftList";
import { accountsSelector } from "../../../reducers/accounts";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "../../../components/WalletTab/CollapsibleHeaderScrollView";
import { hiddenNftCollectionsSelector } from "../../../reducers/settings";
import { updateMainNavigatorVisibility } from "../../../actions/settings";

const WalletNftGallery = () => {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const nfts = accounts.map(a => a.nfts ?? []).flat();

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

  useEffect(() => {
    dispatch(updateMainNavigatorVisibility(true));
  }, [dispatch]);

  return (
    <>
      <Box>
        {hasNFTs ? (
          <NftList data={nftsOrdered} />
        ) : (
          <CollapsibleHeaderScrollView
            contentContainerStyle={{ paddingTop: 0, marginHorizontal: 18 }}
          >
            <NftGalleryEmptyState />
          </CollapsibleHeaderScrollView>
        )}
      </Box>
    </>
  );
};

export default WalletNftGallery;
