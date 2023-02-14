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
import { useCryptopanicPosts } from "../../hooks/newsfeed/useCryptopanicPosts";

const keyExtractor = (item: CryptopanicNewsWithMetadata) => item.slug;

function NewsfeedPage() {
  const theme = useTheme();
  const { colors } = theme;
  const inApppBrowserParams = inAppBrowserDefaultParams(theme);
  const { posts, hasMore, isLoading, loadMore, refresh } = useCryptopanicPosts({
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
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        onEndReached={hasMore ? loadMore : () => {}}
        onRefresh={refresh}
        refreshing={isLoading}
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
