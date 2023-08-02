import React from "react";
import { Button, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import NftList from "../../../components/Nft/NftGallery/NftList";

import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "../../../components/WalletTab/CollapsibleHeaderScrollView";
import { useNftsByWallet } from "../../../hooks/useNftGalleryList";
import { useSelector } from "react-redux";
import { nftsSelector } from "../../../reducers/accounts";
import { ActivityIndicator } from "react-native";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";

const WalletNftGallery = () => {
  const { space } = useTheme();
  const { isLoading, parsedData, hasNextPage, error, fetchNextPage, refetch } = useNftsByWallet();
  const protoNfts = useSelector(nftsSelector);
  const { t } = useTranslation();

  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        <Text>{t("errors.NFtGalleryRequest.title")}</Text>
        <Button onPress={() => refetch()}>{t("errors.NFtGalleryRequest.button")}</Button>
      </Flex>
    );
  }

  if (isLoading && protoNfts.length) {
    return (
      <Flex flex={1} justifyContent="center">
        <ActivityIndicator />
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="wallet-nft-gallery-screen">
      {protoNfts.length ? (
        <NftList
          data={parsedData}
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
