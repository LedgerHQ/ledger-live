// @flow
import React, { useCallback } from "react";
import {
  Linking,
  SafeAreaView,
  StyleSheet,
  View,
  FlatList,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";

import { useFilteredServiceStatus } from "@ledgerhq/live-common/lib/notifications/ServiceStatusProvider";
import type { Incident } from "@ledgerhq/live-common/lib/notifications/ServiceStatusProvider/types";
import CheckCircle from "../../icons/CheckCircle";
import Warning from "../../icons/WarningOutline";
import LText from "../../components/LText";
import ExternalLink from "../../components/ExternalLink";
import { urls } from "../../config/urls";

type Props = {
  item: Incident,
  index: number,
  style?: *,
};

const IncidentRow = ({ item, style }: Props) => {
  const { colors } = useTheme();
  const { id, incident_updates: incidentUpdates, name, shortlink } = item;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.leftSection}>
        <Warning size={16} color={colors.orange} />
      </View>
      <View style={styles.rightSection}>
        <LText semiBold style={[styles.rowTitle, { color: colors.darkBlue }]}>
          {name}
        </LText>
        {incidentUpdates &&
          incidentUpdates.length &&
          incidentUpdates.map(({ body }) => (
            <LText style={[styles.text, { color: colors.grey }]}>{body}</LText>
          ))}
        {shortlink && (
          <View style={styles.link}>
            <ExternalLink
              event="StatusLearnMore"
              eventProperties={{ id }}
              text={<Trans i18nKey="common.learnMore" />}
              onPress={() => Linking.openURL(shortlink)}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default function NotificationCenter() {
  const { incidents } = useFilteredServiceStatus();
  const { colors } = useTheme();

  const onHelpPageRedirect = useCallback(() => {
    Linking.openURL(urls.ledgerStatus); // @TODO redirect to correct url
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {incidents.length > 0 ? (
        <View style={styles.incidentContainer}>
          <Warning size={42} color={colors.orange} />
          <LText bold style={styles.title}>
            <Trans i18nKey="notificationCenter.status.error.title" />
          </LText>
        </View>
      ) : (
        <View style={styles.container}>
          <CheckCircle size={42} color={colors.success} />
          <LText bold style={styles.title}>
            <Trans i18nKey="notificationCenter.status.ok.title" />
          </LText>
          <LText bold style={[styles.desc]}>
            <Trans i18nKey="notificationCenter.status.ok.desc">
              <LText color="grey" />
              <LText semiBold color="live" onPress={onHelpPageRedirect} />
            </Trans>
          </LText>
        </View>
      )}
      <FlatList
        contentContainerStyle={styles.listContainer}
        style={{ flex: 1 }}
        data={incidents}
        renderItem={props => (
          <IncidentRow
            {...props}
            style={[styles.border, { borderColor: colors.lightFog }]}
          />
        )}
        keyExtractor={(item, index) => item.id + index}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.lightFog }]}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 16 },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  incidentContainer: {
    flex: 0.5,
    justifyContent: "flex-end",
    paddingBottom: 50,
    alignItems: "center",
  },
  border: { borderWidth: 1 },

  listContainer: { paddingHorizontal: 16 },
  title: { fontSize: 18, marginTop: 23, marginBottom: 8 },
  desc: { fontSize: 13 },
  separator: {
    width: "100%",
    height: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  leftSection: {
    width: 16,
    marginRight: 16,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  rightSection: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  rowTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
  },
  link: {
    marginTop: 16,
  },
});
