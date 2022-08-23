// $flow
import React from "react";
import { View, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
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
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {event && <TrackScreen category="Lend" name={event} />}
      {header}
      <View style={[styles.topSection, { backgroundColor: colors.lightFog }]}>
        {illustration}
      </View>
      <ScrollView style={styles.bottomSection}>
        <View style={styles.row}>
          <LText
            bold
            style={[
              styles.badge,
              {
                backgroundColor: colors.lightLive,
              },
            ]}
            color="live"
          >
            {badgeLabel}
          </LText>
        </View>
        <LText bold style={styles.title}>
          {title}
        </LText>
        <LText style={styles.description} color="grey">
          {description}
        </LText>
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
  root: { flex: 1 },
  topSection: { flex: 0.6 },
  bottomSection: { flex: 1, paddingHorizontal: 16, paddingVertical: 24 },
  ctaSection: { padding: 16 },
  childrenContainer: { paddingBottom: 16 },
  row: { flexDirection: "row", justifyContent: "center" },
  badge: {
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
    paddingHorizontal: 16,
  },
});
