import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  TouchableHighlight,
  RefreshControl,
  type ViewToken,
} from "react-native";

import { NotificationCard, Box, Flex, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { TrashMedium } from "@ledgerhq/native-ui/assets/icons";
import { LNUpsellBanner, useLNUpsellBannerState } from "LLM/features/LNUpsell";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { NotificationContentCard } from "~/dynamicContent/types";
import { getTime } from "./helper";
import {
  setDynamicContentNotificationCards,
  markLocalCardsViewed,
  removeLocalCard,
} from "~/actions/dynamicContent";
import { localMobileCardsSelector } from "~/reducers/dynamicContent";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";
import getWindowDimensions from "~/logic/getWindowDimensions";
import {
  isLocalNotificationCard,
  removeBrazeNotificationCard,
  splitNotificationCardsBySource,
} from "./notificationCards";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const { height } = getWindowDimensions();

const Container = styled(SettingsNavigationScrollView)``;
const RemoveContainer = styled(TouchableHighlight)`
  background-color: ${p => p.theme.colors.neutral.c30};
  justify-content: center;
  display: flex;
  align-items: center;
  height: 100%;
  width: 90px;
`;

export default function NotificationCenter() {
  const rowRefs = useRef(new Map<string, React.RefObject<SwipeableMethods | null>>()).current;
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
  const localMobileCards = useSelector(localMobileCardsSelector);

  const dispatchCards = useCallback(() => {
    const { brazeCards, localCards } = splitNotificationCardsBySource(
      notificationCards,
      localMobileCards,
    );

    dispatch(setDynamicContentNotificationCards(brazeCards.map(n => ({ ...n, viewed: true }))));
    if (localCards.length > 0) {
      dispatch(markLocalCardsViewed(localCards.map(n => n.id)));
    }
  }, [notificationCards, localMobileCards, dispatch]);

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

    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Utils Functions ----------
  const onPress = useCallback(
    async (item: NotificationContentCard) => {
      if (!item) return;

      await trackContentCardEvent(ContentCardEvent.Clicked, {
        ...item.extras,
        screen: item.location,
        campaign: item.id,
        contentcard: item.title,
      });

      if (!item.link) return;

      // Notify Braze that the card has been clicked by the user
      logClickCard(item.id);
      await Linking.openURL(item.link);
    },
    [logClickCard, trackContentCardEvent],
  );

  const deleteNotification = useCallback(
    (item: NotificationContentCard) => {
      if (!item) return;

      logDismissCard(item.id);

      trackContentCardEvent(ContentCardEvent.Dismissed, {
        ...item.extras,
        screen: item.location,
        campaign: item.id,
        contentcard: item.title,
      });

      if (isLocalNotificationCard(localMobileCards, item.id)) {
        dispatch(removeLocalCard(item.id));
        return;
      }

      dispatch(
        setDynamicContentNotificationCards(
          removeBrazeNotificationCard(notificationCards, localMobileCards, item.id),
        ),
      );
    },
    [dispatch, localMobileCards, logDismissCard, notificationCards, trackContentCardEvent],
  );

  const onClickCard = useCallback(
    (item: NotificationContentCard) => {
      onPress(item);
    },
    [onPress],
  );

  // ----- Render functions --------
  const RightActions = ({
    item,
    translation,
  }: {
    item: NotificationContentCard;
    translation: SharedValue<number>;
  }) => {
    const animatedStyle = useAnimatedStyle(() => {
      "worklet";
      const scale = interpolate(translation.value, [-80, 0], [1, 0], Extrapolation.CLAMP);
      return {
        transform: [{ scale }],
      };
    });

    return (
      <RemoveContainer onPress={() => deleteNotification(item)} underlayColor={colors.primary.c20}>
        <Animated.View style={animatedStyle}>
          <TrashMedium color="neutral.c100" size={20} />
        </Animated.View>
      </RemoveContainer>
    );
  };

  const renderRightActions = (
    item: NotificationContentCard,
    _progress: SharedValue<number>,
    translation: SharedValue<number>,
  ) => <RightActions item={item} translation={translation} />;

  const isLNUpsellBannerShown = useLNUpsellBannerState("notification_center").isShown;

  const ListItem = (card: NotificationContentCard) => {
    const time = getTime(card.createdAt);
    const hasLink = !!card.link && !!card.cta;

    if (!rowRefs.has(card.id)) {
      rowRefs.set(card.id, React.createRef<SwipeableMethods>());
    }
    const swipeableRef = rowRefs.get(card.id)!;

    return (
      <Swipeable
        key={card.id}
        renderRightActions={(progress, translation) =>
          renderRightActions(card, progress, translation)
        }
        ref={swipeableRef}
        onSwipeableOpenStartDrag={() => {
          [...rowRefs.entries()].forEach(([id, ref]) => {
            if (id !== card.id && ref.current) ref.current.close();
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

  const visibleCardsRef = useRef<string[]>([]);
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<NotificationContentCard>[] }) => {
      const visibleCards = viewableItems.map(({ item }) => item.id);
      const newlyVisibleCards = visibleCards.filter(id => !visibleCardsRef.current.includes(id));
      visibleCardsRef.current = visibleCards;
      newlyVisibleCards.forEach(id => logImpressionCard(id));
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
        ListHeaderComponent={<LNUpsellBanner location="notification_center" mx={6} my={5} />}
        ItemSeparatorComponent={() => <Box height={1} width="100%" backgroundColor="neutral.c30" />}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onViewableItemsChanged={handleViewableItemsChanged}
        ListEmptyComponent={isLNUpsellBannerShown ? null : <EmptyComponent />}
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
