// @flow
import React, { useCallback } from "react";
import { StyleSheet, SectionList, RefreshControl, View } from "react-native";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { groupAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider/helpers";
import { useTheme } from "@react-navigation/native";

import { Trans } from "react-i18next";
import NewsRow from "./NewsRow";
import LText from "../../components/LText";
import FormatDate from "../../components/FormatDate";

const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 95,
};

export default function NotificationCenter() {
  const { colors, dark } = useTheme();
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
      style={[styles.sectionList, { backgroundColor: colors.background }]}
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
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: colors.background },
            ]}
          >
            <LText
              style={[styles.label, { backgroundColor: colors.lightFog }]}
              semiBold
              color="grey"
            >
              <FormatDate date={title} />
            </LText>
          </View>
        ) : null
      }
      keyExtractor={(item, index) => item.uuid + index}
      ItemSeparatorComponent={() => (
        <View
          style={[styles.separator, { backgroundColor: colors.lightFog }]}
        />
      )}
      refreshControl={
        <RefreshControl
          progressBackgroundColor={dark ? colors.background : colors.card}
          colors={[colors.live]}
          tintColor={colors.live}
          refreshing={false}
          onRefresh={updateCache}
        />
      }
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <LText bold style={styles.title}>
            <Trans i18nKey="notificationCenter.news.emptyState.title" />
          </LText>
          <LText style={styles.text}>
            <Trans i18nKey="notificationCenter.news.emptyState.desc" />
          </LText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 16 },
  sectionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 11,
    paddingHorizontal: 16,
    lineHeight: 26,
    height: 26,
    borderRadius: 4,
  },
  sectionHeader: { paddingTop: 16, paddingBottom: 8 },
  separator: {
    width: "100%",
    height: 1,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
});
