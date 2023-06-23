import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import { isEqual } from "lodash";
import { NftList } from "../../../components/Nft/NftGallery/NftList";

import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "../../../components/WalletTab/CollapsibleHeaderScrollView";
import { orderedVisibleNftsSelector } from "../../../reducers/accounts";

const WalletNftGallery = () => {
  const { space } = useTheme();
  const nftsOrdered = useSelector(orderedVisibleNftsSelector, isEqual);

  const hasNFTs = nftsOrdered.length > 0;

  return (
    <Flex flex={1} testID="wallet-nft-gallery-screen">
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
    </Flex>
  );
};

export default WalletNftGallery;
