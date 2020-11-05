// $flow
import React from "react";
import { View, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import colors from "../../../colors";
import { TrackScreen } from "../../../analytics";

type Props = {
  illustration: React$Node,
  title: string,
  badgeLabel: string,
  description: string,
  children?: React$Node,
  ctaLabel: string,
  onNext: () => {},
  disabled?: boolean,
  header?: React$Node,
  event?: string,
};

export default function BaseInfoModal({
  illustration,
  title,
  badgeLabel,
  description,
  children,
  ctaLabel = <Trans i18nKey="common.continue" />,
  onNext,
  disabled,
  header,
  event,
}: Props) {
  return (
    <SafeAreaView style={styles.root}>
      {event && <TrackScreen category="Lend" name={event} />}
      {header}
      <View style={styles.topSection}>{illustration}</View>
      <ScrollView style={styles.bottomSection}>
        <View style={styles.row}>
          <LText bold style={styles.badge}>
            {badgeLabel}
          </LText>
        </View>
        <LText bold style={styles.title}>
          {title}
        </LText>
        <LText style={styles.description}>{description}</LText>
      </ScrollView>
      <View style={styles.ctaSection}>
        {children && <View style={styles.childrenContainer}>{children}</View>}
        <Button
          type="primary"
          disabled={disabled}
          onPress={onNext}
          title={ctaLabel}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  topSection: { flex: 0.6, backgroundColor: colors.lightFog },
  bottomSection: { flex: 1, paddingHorizontal: 16, paddingVertical: 24 },
  ctaSection: { padding: 16 },
  childrenContainer: { paddingBottom: 16 },
  row: { flexDirection: "row", justifyContent: "center" },
  badge: {
    color: colors.live,
    backgroundColor: colors.lightLive,
    paddingHorizontal: 8,
    borderRadius: 4,
    textTransform: "uppercase",
    width: "auto",
    fontSize: 10,
    lineHeight: 20,
    height: 20,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    textAlign: "center",
    paddingVertical: 16,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingVertical: 16,
    color: colors.grey,
    paddingHorizontal: 16,
  },
});
