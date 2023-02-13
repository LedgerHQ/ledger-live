import { InformativeCard, Flex } from "@ledgerhq/native-ui";
import React, { memo, useCallback } from "react";
import { FlatList, Linking, Platform } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { TrackScreen } from "../../analytics";
import { CryptopanicNewsWithMetadata } from "../../hooks/newsfeed/cryptopanicApi";
import FormatDate from "../../components/FormatDate";
import { inAppBrowserDefaultParams } from "../../components/InAppBrowser";

const keyExtractor = (item: CryptopanicNewsWithMetadata) => item.slug;

function NewsfeedPage() {
  const news: CryptopanicNewsWithMetadata[] = [
    {
      kind: "news",
      domain: "journalducoin.com",
      source: {
        title: "journalducoin",
        region: "fr",
        domain: "journalducoin.com",
        path: null,
      },
      title:
        "Gagner du bitcoin (BTC) sur les réseaux sociaux ? Le pari fou de Damus",
      published_at: "2023-02-08T14:00:00Z",
      slug: "Gagner-du-bitcoin-BTC-sur-les-reseaux-sociaux-Le-pari-fou-de-Damus",
      description: "test",
      image:
        "https://journalducoin-com.exactdn.com/app/uploads/2021/10/BTC-BitcoinFeu-brule-1.jpg?strip=all&lossy=1&quality=66&resize=1160%2C653&ssl=1",
      currencies: [
        {
          code: "BTC",
          title: "Bitcoin",
          slug: "bitcoin",
          url: "https://cryptopanic.com/news/bitcoin/",
        },
      ],
      id: 17586453,
      url: "https://cryptopanic.com/news/17586453/Gagner-du-bitcoin-BTC-sur-les-reseaux-sociaux-Le-pari-fou-de-Damus",
      created_at: "2023-02-08T14:00:00Z",
    },
    {
      kind: "news",
      domain: "cointribune.com",
      source: {
        title: "Cointribune FR",
        region: "fr",
        domain: "cointribune.com",
        path: null,
      },
      title: "Découvrez le nouveau réseau de paiements Web3 de Fuse Network",
      published_at: "2023-02-08T13:00:00Z",
      slug: "Decouvrez-le-nouveau-reseau-de-paiements-Web3-de-Fuse-Network",
      description: "test",
      image:
        "https://journalducoin-com.exactdn.com/app/uploads/2022/10/uniswap-1.jpg?strip=all&lossy=1&quality=66&resize=1160%2C653&ssl=1",
      currencies: [
        {
          code: "ETH",
          title: "Ethereum",
          slug: "ethereum",
          url: "https://cryptopanic.com/news/ethereum/",
        },
      ],
      id: 17586444,
      url: "https://cryptopanic.com/news/17586444/Decouvrez-le-nouveau-reseau-de-paiements-Web3-de-Fuse-Network",
      created_at: "2023-02-08T13:00:00Z",
    },
  ];

  const theme = useTheme();
  const { colors } = theme;
  const inApppBrowserParams = inAppBrowserDefaultParams(theme);

  // logic to move to the hook
  const onClickItem = useCallback(
    async (news: CryptopanicNewsWithMetadata) => {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(news.url, {
          ...inApppBrowserParams,
        });
      } else {
        Linking.openURL(news.url);
      }
    },
    [inApppBrowserParams],
  );

  const renderItem = useCallback(
    ({ item }: { item: CryptopanicNewsWithMetadata }) => (
      <Container
        underlayColor={colors.neutral.c30}
        onPress={() => onClickItem(item)}
      >
        <InformativeCard
          imageUrl={item.image}
          tag={
            <>
              {item.source.title} •{" "}
              <FormatDate date={new Date(item.published_at)} withHoursMinutes />
            </>
          }
          title={item.title}
          imageProps={{
            style: { width: 90, height: 75 },
          }}
        />
      </Container>
    ),
    [colors.neutral.c30, onClickItem],
  );

  return (
    <Flex>
      <TrackScreen category="Newsfeed" />
      <FlatList
        data={news}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </Flex>
  );
}

const Container = styled(TouchableHighlight)`
  padding-left: ${props => props.theme.space[6]};
  padding-right: ${props => props.theme.space[6]};
  padding-top: ${props => props.theme.space[3]};
  padding-bottom: ${props => props.theme.space[3]};
`;

export default memo(NewsfeedPage);
