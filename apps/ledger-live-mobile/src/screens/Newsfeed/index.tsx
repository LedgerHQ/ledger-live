import { InformativeCard, Flex, Text } from "@ledgerhq/native-ui";
import React, { memo, useCallback, useMemo } from "react";
import { FlatList, Linking, TouchableOpacity } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { useTranslation } from "react-i18next";
import { track, TrackScreen } from "~/analytics";
import { CryptopanicNewsWithMetadata } from "~/hooks/newsfeed/cryptopanicApi";
import { inAppBrowserDefaultParams } from "~/components/InAppBrowser";
import { useCryptopanicPosts } from "~/hooks/newsfeed/useCryptopanicPosts";
import CryptopanicIcon from "~/icons/Cryptopanic";
import Button from "~/components/wrappedUi/Button";
import Skeleton from "~/components/Skeleton";
import { ScreenName } from "~/const";
import FormatRelativeTime from "~/components/DateFormat/FormatRelativeTime";

const keyExtractor = (item: CryptopanicNewsWithMetadata) => item.id.toString();

const imageNewsProps = {
  style: { width: 90, height: 75 },
};

const CRYPTOPANIC_URL = "https://cryptopanic.com";
const CRYPTOPANIC_DEFAULT_PARAMS = {
  metadata: true,
  approved: true,
  public: true,
};

function NewsfeedPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, space, radii } = theme;
  const inAppBrowserParams = inAppBrowserDefaultParams(theme);
  const { posts, hasMore, loadingState, ready, loadMore, refresh, lastDataLoadingDate } =
    useCryptopanicPosts({
      ...CRYPTOPANIC_DEFAULT_PARAMS,
    });

  const onClickItem = useCallback(
    async (news: CryptopanicNewsWithMetadata) => {
      const url = news?.source?.url || news.url;
      track("card_clicked", {
        url,
        page: ScreenName.Newsfeed,
      });
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          ...inAppBrowserParams,
        });
      } else {
        Linking.openURL(url);
      }
    },
    [inAppBrowserParams],
  );

  const onPressCryptopanic = () => {
    Linking.openURL(CRYPTOPANIC_URL);
  };

  const renderItem = useCallback(
    ({ item }: { item: CryptopanicNewsWithMetadata }) => (
      <Skeleton
        loading={loadingState === "initial"}
        height="85px"
        mx={`${space[6]}px`}
        my={`${space[3]}px`}
        borderRadius={`${radii[2]}px`}
      >
        <Container underlayColor={colors.neutral.c30} onPress={() => onClickItem(item)}>
          <InformativeCard
            imageUrl={item?.metadata?.image || undefined}
            tag={
              <>
                {item.source.title} •{" "}
                <FormatRelativeTime
                  date={new Date(item.published_at)}
                  baseDate={lastDataLoadingDate}
                />
              </>
            }
            title={item.title}
            imageProps={imageNewsProps}
          />
        </Container>
      </Skeleton>
    ),
    [colors.neutral.c30, lastDataLoadingDate, loadingState, onClickItem, radii, space],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <TouchableOpacity onPress={onPressCryptopanic}>
        <Flex mx={6} flexDirection={"row"} alignItems="center">
          <Text variant={"tiny"} color={"neutral.c60"} mr={3}>
            {t("newsfeed.poweredByCryptopanic")}
          </Text>
          <CryptopanicIcon size={12} />
        </Flex>
      </TouchableOpacity>
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

  const EmptyState = () => (
    <Flex height="60%" justifyContent="center" alignItems="center">
      <Text variant={"body"} color={"neutral.c100"} mr={3}>
        {t("newsfeed.noPosts")}
      </Text>
    </Flex>
  );

  return posts.length === 0 && ready ? (
    <EmptyState />
  ) : (
    <Flex>
      <TrackScreen category="NewsFeed" />
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
