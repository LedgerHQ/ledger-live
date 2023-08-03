import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import NftList from "../../../components/Nft/NftGallery/NftList";

import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "../../../components/WalletTab/CollapsibleHeaderScrollView";
import { useNftsByWallet } from "../../../hooks/useNftGalleryList";
import { useSelector } from "react-redux";
import { nftsSelector } from "../../../reducers/accounts";

const WalletNftGallery = () => {
  const { space } = useTheme();
  const { isLoading, parsedData, hasNextPage, error, fetchNextPage, refetch } = useNftsByWallet();
  const protoNfts = useSelector(nftsSelector);

  return (
    <Flex flex={1} testID="wallet-nft-gallery-screen">
      {protoNfts.length ? (
        <NftList
          data={parsedData}
          isLoading={isLoading}
          error={error}
          refetch={refetch}
          hasNextPage={!!hasNextPage}
          fetchNextPage={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
        />
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
