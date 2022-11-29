import React from "react";
import { FlatList } from "react-native";

import { CardC, Box } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";
import { NotificationContentCard } from "../../dynamicContent/types";

const Container = styled(SettingsNavigationScrollView)`
  padding: 16px;
`;

enum TypeOfTime {
  second = "second",
  minute = "minute",
  hour = "hour",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}
function getTime(timestampNew: number): Array<number, TypeOfTime> {
  const today = new Date().getTime();
  const fixedTimeStamp = new Date(timestampNew * 1000).getTime();
  const diff = Math.abs(today - fixedTimeStamp);

  const secs = Math.floor(Math.abs(diff) / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(weeks / 12);

  console.log(
    secs,
    mins,
    hours,
    days,
    weeks,
    months,
    new Date(timestampNew * 1000).getSeconds(),
    timestampNew,
  );

  if (secs < 60) {
    return [secs, TypeOfTime.second];
  }

  if (mins < 60) {
    return [mins, TypeOfTime.minute];
  }

  if (hours < 24) {
    return [hours, TypeOfTime.hour];
  }
  if (days < 24) {
    return [days, TypeOfTime.day];
  }
  if (weeks < 4) {
    return [weeks, TypeOfTime.week];
  }

  if (months < 12) {
    return [weeks, TypeOfTime.week];
  }

  return [
    Math.abs(new Date(timestampNew).getFullYear() - new Date().getFullYear()),
    TypeOfTime.year,
  ];
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const { notificationCards } = useDynamicContent();

  return (
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
          <Box height={1} width="100%" backgroundColor="neutral.c30" my={7} />
        )}
      />
    </Container>
  );
}
