import React from "react";
import { FlatList } from "react-native";

import { CardC, Box, Flex, Text } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { NotificationContentCard } from "../../dynamicContent/types";
import { getTime } from "./helper";

const Container = styled(SettingsNavigationScrollView)`
  padding: 16px;
`;

export default function NotificationCenter() {
  const { t } = useTranslation();
  const { notificationCards } = useDynamicContent();

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
        <Flex alignItems="center" flex={1}>
          <Text
            variant="large"
            fontWeight="semiBold"
            color="neutral.c100"
            mb={3}
            mt={14}
          >
            {t("notificationCenter.news.emptyState.title")}
          </Text>
          <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
            {t("notificationCenter.news.emptyState.desc")}
          </Text>
        </Flex>
      )}
    </>
  );
}
