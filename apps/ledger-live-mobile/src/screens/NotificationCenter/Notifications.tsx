import React, { useCallback, useEffect } from "react";
import {
  Animated,
  FlatList,
  Linking,
  TouchableHighlight,
  View,
} from "react-native";

import { CardC, Box, Flex, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Swipeable } from "react-native-gesture-handler";
import { TrashMedium } from "@ledgerhq/native-ui/assets/icons";

import useDynamicContent from "../../dynamicContent/dynamicContent";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { NotificationContentCard } from "../../dynamicContent/types";
import { getTime } from "./helper";
import { setDynamicContentNotificationCards } from "../../actions/dynamicContent";
import { useDynamicContentLogic } from "../../dynamicContent/useDynamicContentLogic";

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
    orderedNotificationsCards,
    logImpressionCard,
    logDismissCard,
    logClickCard,
    trackContentCardEvent,
  } = useDynamicContent();
  const { fetchData, refreshDynamicContent } = useDynamicContentLogic();

  useEffect(() => {
    refreshDynamicContent();
    fetchData();
    // Need to refresh just one time when coming in the Page
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
      });

      if (!item.link) return;

      // Notify Braze that the card has been clicked by the user
      logClickCard(item.id);
      Linking.openURL(item.link);
    },
    [logClickCard, trackContentCardEvent],
  );

  const deleteNotification = useCallback(
    (itemId: string) => {
      logDismissCard(itemId);
      dispatch(
        setDynamicContentNotificationCards(
          orderedNotificationsCards.filter(n => n.id !== itemId),
        ),
      );
    },
    [dispatch, logDismissCard, orderedNotificationsCards],
  );

  const onClickCard = useCallback(
    (item: NotificationContentCard) => {
      // TODO: REWORK like in the Carousel maybe? For Log impression only when it's clearly visible
      logImpressionCard(item.id);

      const cards = orderedNotificationsCards.map(n =>
        n.id === item.id
          ? {
              ...n,
              viewed: true,
            }
          : n,
      );

      dispatch(setDynamicContentNotificationCards(cards));
      onPress(item);
    },
    [dispatch, logImpressionCard, onPress, orderedNotificationsCards],
  );

  // ---------------

  // ----- Render functions --------
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation,
    dragX: Animated.AnimatedInterpolation,
    itemId: string,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    return (
      <RemoveContainer
        onPress={() => deleteNotification(itemId)}
        underlayColor={colors.primary.c20}
      >
        <AnimatedView style={{ transform: [{ scale }] }}>
          <TrashMedium color="neutral.c100" size={20} />
        </AnimatedView>
      </RemoveContainer>
    );
  };

  const ListItem = (item: NotificationContentCard) => {
    const time = getTime(item.createdAt);
    const hasLink = !!item.link && !!item.cta;

    return (
      <Swipeable
        key={item.id}
        renderRightActions={(_progress, dragX) =>
          renderRightActions(_progress, dragX, item.id)
        }
        ref={ref => {
          if (ref && !rowRefs.get(item.id)) {
            rowRefs.set(item.id, ref);
          }
        }}
        onBegan={() => {
          // Close row when starting swipe another
          [...rowRefs.entries()].forEach(([id, ref]) => {
            if (id !== item.id && ref) ref.close();
          });
        }}
      >
        <Box py={7} px={6} zIndex={4} bg="background.main">
          <CardC
            onClickCard={() => onClickCard(item)}
            time={t(`notificationCenter.news.time.${time[1]}`, {
              count: time[0],
            })}
            showLinkCta={hasLink}
            {...item}
          />
        </Box>
      </Swipeable>
    );
  };
  // -------------------------------

  return (
    <>
      {orderedNotificationsCards.length > 0 ? (
        <Container>
          <FlatList<NotificationContentCard>
            data={orderedNotificationsCards}
            keyExtractor={(card: NotificationContentCard) => card.id}
            renderItem={elem => ListItem(elem.item)}
            ItemSeparatorComponent={() => (
              <Box height={1} width="100%" backgroundColor="neutral.c30" />
            )}
          />
        </Container>
      ) : (
        <Flex alignItems="center" flex={1} px={3}>
          <Text
            variant="large"
            fontWeight="semiBold"
            color="neutral.c100"
            mb={3}
            mt={14}
            textAlign="center"
          >
            {t("notificationCenter.news.emptyState.title")} 💤
          </Text>
          <Text
            variant="paragraph"
            fontWeight="medium"
            color="neutral.c70"
            textAlign="center"
          >
            {t("notificationCenter.news.emptyState.desc")}
          </Text>
        </Flex>
      )}
    </>
  );
}
