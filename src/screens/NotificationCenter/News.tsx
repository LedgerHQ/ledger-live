import React, { useCallback } from "react";
import { StyleSheet, SectionList, RefreshControl, View } from "react-native";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { groupAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider/helpers";

import { Trans } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import FormatDate from "../../components/FormatDate";
import NewsRow from "./NewsRow";

const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 95,
};

const SectionHeader = styled.View`
  background-color: ${p => p.theme.colors.palette.neutral.c30};
  padding: 12px;
  border-radius: 4px;
`;

export default function NotificationCenter() {
  const { colors } = useTheme();
  const { cache, setAsSeen, updateCache, allIds, seenIds } = useAnnouncements();

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      viewableItems
        .reduce((s, a) => s.concat(a.item ? a.item : a.data), [])
        .map(({ uuid }) => uuid)
        .filter(Boolean)
        .forEach(setAsSeen);
    },
    [setAsSeen],
  );

  const sections = groupAnnouncements(allIds.map(uuid => cache[uuid])).map(
    d => ({
      ...d,
      title: d.day,
    }),
  );

  return (
    <SectionList
      style={[styles.sectionList, { backgroundColor: colors.background.main }]}
      contentContainerStyle={styles.root}
      sections={sections}
      stickySectionHeadersEnabled
      renderItem={({ item, index, section }) => (
        <NewsRow
          item={item}
          index={index}
          isLastElement={index >= section.data.length - 1}
          isUnread={!seenIds.includes(item.uuid)}
        />
      )}
      renderSectionHeader={({ section: { title } }) =>
        title && title instanceof Date ? (
          <SectionHeader>
            <Text
              variant={"small"}
              fontWeight={"semiBold"}
              color="palette.neutral.c80"
              style={{ textTransform: "uppercase" }}
            >
              <FormatDate date={title} />
            </Text>
          </SectionHeader>
        ) : null
      }
      keyExtractor={(item, index) => item.uuid + index}
      ItemSeparatorComponent={() => (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.palette.neutral.c40 },
          ]}
        />
      )}
      refreshControl={
        <RefreshControl
          progressBackgroundColor={colors.palette.neutral.c00}
          colors={[colors.palette.primary.c100]}
          tintColor={colors.palette.primary.c100}
          refreshing={false}
          onRefresh={updateCache}
        />
      }
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      ListEmptyComponent={
        <Flex alignItems={"center"} justifyContent={"center"} flex={1}>
          <Text
            variant={"h3"}
            textAlign={"center"}
            color={"palette.neutral.c100"}
          >
            <Trans i18nKey="notificationCenter.news.emptyState.title" />
          </Text>
          <Text
            variant={"paragraph"}
            fontWeight={"medium"}
            color={"palette.neutral.c80"}
            textAlign={"center"}
          >
            <Trans i18nKey="notificationCenter.news.emptyState.desc" />
          </Text>
        </Flex>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 16, height: "100%" },
  sectionList: {
    flex: 1,
    paddingHorizontal: 16,
    height: "100%",
  },
  separator: {
    width: "100%",
    height: 1,
    marginBottom: 8,
  },
});
