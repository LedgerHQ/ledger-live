import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Linking,
  TouchableHighlight,
  View,
  RefreshControl,
  type ViewToken,
} from "react-native";

import { NotificationCard, Box, Flex, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Swipeable } from "react-native-gesture-handler";
import { TrashMedium } from "@ledgerhq/native-ui/assets/icons";
import { LNSUpsellBanner, useLNSUpsellBannerState } from "LLM/features/LNSUpsell";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { NotificationContentCard } from "~/dynamicContent/types";
import { getTime } from "./helper";
import { setDynamicContentNotificationCards } from "~/actions/dynamicContent";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";
import getWindowDimensions from "~/logic/getWindowDimensions";

const { height } = getWindowDimensions();

const Container = styled(SettingsNavigationScrollView)``;
const AnimatedView = Animated.createAnimatedComponent(View);
const RemoveContainer = styled(TouchableHighlight)`
  background-color: ${p => p.theme.colors.neutral.c30};
  justify-content: center;
  display: flex;
  align-items: center;
  height: 100%;
  width: 90px;
`;

export default function NotificationCenter() {
  const rowRefs = new Map();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const {
    notificationCards,
    logImpressionCard,
    logDismissCard,
    logClickCard,
    trackContentCardEvent,
  } = useDynamicContent();
  const { fetchData, refreshDynamicContent } = useDynamicContentLogic();
  const [isDynamicContentLoading, setIsDynamicContentLoading] = useState(false);

  const dispatchCards = useCallback(() => {
    const cards = notificationCards.map(n => ({
      ...n,
      viewed: true,
    }));

    dispatch(setDynamicContentNotificationCards(cards));
  }, [notificationCards, dispatch]);

  const refreshNotifications = useCallback(async () => {
    setIsDynamicContentLoading(true);
    refreshDynamicContent();
    await fetchData();
    setIsDynamicContentLoading(false);

    dispatchCards();
  }, [refreshDynamicContent, fetchData, dispatchCards]);

  useEffect(() => {
    dispatchCards();
    // Need to refresh just one time when coming in the Page
    refreshNotifications();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Utils Functions ----------
  const onPress = useCallback(
    (item: NotificationContentCard) => {
      if (!item) return;

      trackContentCardEvent("contentcard_clicked", {
        screen: item.location,
        link: item.link || "",
        campaign: item.id,
        contentcard: item.title,
      });

      if (!item.link) return;

      // Notify Braze that the card has been clicked by the user
      logClickCard(item.id);
      Linking.openURL(item.link);
    },
    [logClickCard, trackContentCardEvent],
  );

  const deleteNotification = useCallback(
    (item: NotificationContentCard) => {
      if (!item) return;

      logDismissCard(item.id);

      trackContentCardEvent("contentcard_dismissed", {
        screen: item.location,
        link: item.link || "",
        campaign: item.id,
        contentcard: item.title,
      });

      dispatch(setDynamicContentNotificationCards(notificationCards.filter(n => n.id !== item.id)));
    },
    [dispatch, logDismissCard, notificationCards, trackContentCardEvent],
  );

  const onClickCard = useCallback(
    (item: NotificationContentCard) => {
      onPress(item);
    },
    [onPress],
  );

  // ---------------

  // ----- Render functions --------
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<string | number>,
    dragX: Animated.AnimatedInterpolation<string | number>,
    item: NotificationContentCard,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    return (
      <RemoveContainer onPress={() => deleteNotification(item)} underlayColor={colors.primary.c20}>
        <AnimatedView style={{ transform: [{ scale }] }}>
          <TrashMedium color="neutral.c100" size={20} />
        </AnimatedView>
      </RemoveContainer>
    );
  };

  const isLNSUpsellBannerShown = useLNSUpsellBannerState("notification_center").isShown;

  const ListItem = (card: NotificationContentCard) => {
    const time = getTime(card.createdAt);
    const hasLink = !!card.link && !!card.cta;

    return (
      <Swipeable
        key={card.id}
        renderRightActions={(_progress, dragX) => renderRightActions(_progress, dragX, card)}
        ref={ref => {
          if (ref && !rowRefs.get(card.id)) {
            rowRefs.set(card.id, ref);
          }
        }}
        onBegan={() => {
          // Close row when starting swipe another
          [...rowRefs.entries()].forEach(([id, ref]) => {
            if (id !== card.id && ref) ref.close();
          });
        }}
      >
        <Box py={7} px={6} zIndex={4} bg="background.main">
          <NotificationCard
            onClickCard={() => onClickCard(card)}
            time={t(`notificationCenter.news.time.${time[1]}`, {
              count: time[0],
            })}
            showLinkCta={hasLink}
            {...card}
          />
        </Box>
      </Swipeable>
    );
  };
  // -------------------------------

  const visibleCardsRef = useRef<string[]>([]);
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<NotificationContentCard>[] }) => {
      const visibleCards = viewableItems.map(({ item }) => item.id);
      const newlyVisibleCards = visibleCards.filter(id => !visibleCardsRef.current.includes(id));
      visibleCardsRef.current = visibleCards;
      newlyVisibleCards.forEach(logImpressionCard);
    },
    [logImpressionCard],
  );

  return (
    <Container
      refreshControl={
        <RefreshControl
          refreshing={isDynamicContentLoading}
          colors={[colors.primary.c80]}
          tintColor={colors.primary.c80}
          onRefresh={refreshNotifications}
        />
      }
    >
      <FlatList
        data={notificationCards}
        keyExtractor={({ id }) => id}
        renderItem={elem => ListItem(elem.item)}
        ListHeaderComponent={<LNSUpsellBanner location="notification_center" mx={6} my={5} />}
        ItemSeparatorComponent={() => <Box height={1} width="100%" backgroundColor="neutral.c30" />}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onViewableItemsChanged={handleViewableItemsChanged}
        ListEmptyComponent={isLNSUpsellBannerShown ? null : <EmptyComponent />}
      />
    </Container>
  );
}

function EmptyComponent() {
  const { t } = useTranslation();
  return (
    <Flex alignItems="center" justifyContent="center" height={height * 0.7} px={6}>
      <Text variant="large" fontWeight="semiBold" color="neutral.c100" mb={3} textAlign="center">
        {t("notificationCenter.news.emptyState.title")}
      </Text>
      <Text variant="paragraph" fontWeight="medium" color="neutral.c70" textAlign="center">
        {t("notificationCenter.news.emptyState.desc")}
      </Text>
    </Flex>
  );
}
