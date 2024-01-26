import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import NftList from "~/components/Nft/NftGallery/NftList";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "~/components/WalletTab/CollapsibleHeaderScrollView";
import { hasNftsSelector } from "~/reducers/accounts";
import { useNftGallery } from "~/hooks/useNftGallery";

const WalletNftGallery = () => {
  const { space } = useTheme();
  const hasNFTs = useSelector(hasNftsSelector);

  const { isLoading, hasNextPage, error, fetchNextPage, refetch, parsedData } = useNftGallery();

  return (
    <Flex flex={1} testID="wallet-nft-gallery-screen">
      {hasNFTs ? (
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
            marginTop: 0,
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
