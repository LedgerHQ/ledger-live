import { InformativeCard, Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, FlatList } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import { LearnContentCard } from "../../dynamicContent/types";

const keyExtractor = (item: LearnContentCard) => item.slug;

function NewsfeedPage() {
  const news = [
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
      published_at: "2023-02-08T14:00:00Z",
      slug: "Decouvrez-le-nouveau-reseau-de-paiements-Web3-de-Fuse-Network",
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
      created_at: "2023-02-08T14:00:00Z",
    },
  ];

  const navigation = useNavigation();
  const { colors, space, radii } = useTheme();

  const onClickItem = useCallback(
    (card: LearnContentCard) => {
      console.log("card", card);
      navigation.navigate(ScreenName.LearnWebView, {
        uri: card.url,
      });
    },
    [navigation],
  );

  const renderItem = ({ item: news }: { item: any }) => {
    return (
      <Container
        underlayColor={colors.neutral.c30}
        onPress={() => onClickItem(news)}
      >
        <InformativeCard
          imageUrl={"https://risibank.fr/cache/medias/0/0/2/224/full.png"}
          tag={news.domain}
          title={news.title}
        />
      </Container>
    );
  };

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
