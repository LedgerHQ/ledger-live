import React, { useCallback, useEffect } from "react";
import { FlatList } from "react-native";

import { CardC, Box, Flex, Text } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { NotificationContentCard } from "../../dynamicContent/types";
import { getTime } from "./helper";
import { setDynamicContentNotificationCards } from "../../actions/dynamicContent";
import { useDynamicContentLogic } from "../../dynamicContent/useDynamicContentLogic";

const Container = styled(SettingsNavigationScrollView)`
  padding: 16px;
`;

export default function NotificationCenter() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { notificationCards, logImpressionCard } = useDynamicContent();
  const { fetchData, refreshDynamicContent } = useDynamicContentLogic();

  const onClickCard = useCallback(
    (id: string) => {
      logImpressionCard(id);

      const cards = notificationCards.map(n =>
        n.id === id
          ? {
              ...n,
              viewed: true,
            }
          : n,
      );

      dispatch(setDynamicContentNotificationCards(cards));
    },
    [dispatch, logImpressionCard, notificationCards],
  );

  useEffect(() => {
    refreshDynamicContent();
    fetchData();
    // Need to refresh just one time when coming in the Page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {notificationCards.length > 0 ? (
        <Container>
          <FlatList<NotificationContentCard>
            data={notificationCards}
            keyExtractor={(card: NotificationContentCard) => card.id}
            renderItem={({ item }) => {
              const time = getTime(item.createdAt);
              return (
                <CardC
                  onClickCard={() => onClickCard(item.id)}
                  time={t(`notificationCenter.news.time.${time[1]}`, {
                    count: time[0],
                  })}
                  {...item}
                />
              );
            }}
            ItemSeparatorComponent={() => (
              <Box
                height={1}
                width="100%"
                backgroundColor="neutral.c30"
                my={7}
              />
            )}
          />
        </Container>
      ) : (
        <Flex alignItems="center" flex={1} px={6}>
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
