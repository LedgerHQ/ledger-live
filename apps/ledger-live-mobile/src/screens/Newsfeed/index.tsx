import { InformativeCard, Flex, Text } from "@ledgerhq/native-ui";
import React, { memo, useCallback, useMemo } from "react";
import { FlatList, Linking } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "../../analytics";
import { CryptopanicNewsWithMetadata } from "../../hooks/newsfeed/cryptopanicApi";
import { inAppBrowserDefaultParams } from "../../components/InAppBrowser";
import { useCryptopanicPosts } from "../../hooks/newsfeed/useCryptopanicPosts";
import CryptopanicIcon from "../../icons/Cryptopanic";
import Button from "../../components/wrappedUi/Button";
import FormatRelativeTime from "../../components/FormatRelativeTime";

const keyExtractor = (item: CryptopanicNewsWithMetadata) => item.slug;

const imageNewsProps = {
  style: { width: 90, height: 75 },
};

function NewsfeedPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const inApppBrowserParams = inAppBrowserDefaultParams(theme);
  const { posts, hasMore, loadingState, ready, loadMore, refresh } =
    useCryptopanicPosts({
      metadata: true,
      approved: true,
      public: true,
    });

  // logic to move to the hook
  const onClickItem = useCallback(
    async (news: CryptopanicNewsWithMetadata) => {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(news?.source?.url || news.url, {
          ...inApppBrowserParams,
        });
      } else {
        Linking.openURL(news?.source?.url || news.url);
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
          imageUrl={item?.metadata?.image || undefined}
          tag={
            <>
              {item.source.title} •{" "}
              <FormatRelativeTime date={new Date(item.published_at)} />
            </>
          }
          title={item.title}
          imageProps={imageNewsProps}
        />
      </Container>
    ),
    [colors.neutral.c30, onClickItem],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <Flex mx={6} flexDirection={"row"}>
        <Text variant={"small"} color={"neutral.c80"} mr={3}>
          {t("newsfeed.poweredByCryptopanic")}
        </Text>
        <CryptopanicIcon size={14} />
      </Flex>
    ),
    [t],
  );

  const ListFooterComponent = useMemo(
    () => (
      <Flex mx={6} pt={6} pb={8}>
        <Button
          type={"shade"}
          size={"small"}
          outline
          onPress={loadMore}
          pending={loadingState === "loadingMore"}
          displayContentWhenPending
        >
          {t("common.loadMore")}
        </Button>
      </Flex>
    ),
    [loadMore, loadingState, t],
  );

  return (
    <Flex>
      <TrackScreen category="Newsfeed" />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ready && hasMore ? ListFooterComponent : undefined}
        onRefresh={refresh}
        refreshing={loadingState === "refreshing"}
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
