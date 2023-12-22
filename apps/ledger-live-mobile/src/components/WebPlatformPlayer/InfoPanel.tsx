import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, TouchableOpacity, Linking, ScrollView } from "react-native";
import { translateContent } from "@ledgerhq/live-common/platform/logic";
import type { TranslatableString } from "@ledgerhq/live-common/platform/types";
import ExternalLinkIcon from "~/icons/ExternalLink";
import AppIcon from "~/screens/Platform/AppIcon";
import QueuedDrawer from "../QueuedDrawer";
import LText from "../LText";
import { useSettings } from "~/hooks";

type Props = {
  name: string;
  icon?: string | null;
  description: TranslatableString;
  url?: string | null;
  uri?: string | null;
  isOpened: boolean;
  setIsOpened: (_: boolean) => void;
};

export function InfoPanel({ name, icon, description, url, uri, isOpened, setIsOpened }: Props) {
  const { language } = useSettings();
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    setIsOpened(false);
  }, [setIsOpened]);
  const onLinkPress = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);
  return (
    <QueuedDrawer
      style={{ ...styles.root, backgroundColor: colors.card }}
      isRequestingToBeOpened={isOpened}
      onClose={onClose}
    >
      <ScrollView>
        <View style={{ ...styles.flexRow, ...styles.titleContainer }}>
          {icon ? (
            <View style={styles.appIcon}>
              <AppIcon size={40} name={name} icon={icon} />
            </View>
          ) : null}
          <LText semiBold style={{ ...styles.title, color: colors.text }}>
            {name}
          </LText>
        </View>
        <LText
          style={{
            ...styles.basicFontStyle,
            ...styles.description,
            color: colors.text,
          }}
        >
          {translateContent(description, language)}
        </LText>
        {url ? (
          <>
            <View style={styles.hr} />
            <LText semiBold style={styles.subSectionTitle}>
              <Trans i18nKey="platform.webPlatformPlayer.infoPanel.website" />
            </LText>
            <TouchableOpacity style={styles.flexRow} onPress={() => onLinkPress(url)}>
              <LText semiBold style={{ ...styles.basicFontStyle, color: colors.live }}>
                {url}
              </LText>
              <View style={styles.externalLinkIcon}>
                <ExternalLinkIcon size={14} color={colors.live} />
              </View>
            </TouchableOpacity>
          </>
        ) : null}
        {__DEV__ && uri ? (
          <>
            <View style={styles.hr} />
            <LText semiBold style={styles.subSectionTitle}>
              URI:
            </LText>
            <TouchableOpacity style={styles.flexRow} onPress={() => onLinkPress(uri)}>
              <LText semiBold style={{ ...styles.basicFontStyle, color: colors.live }}>
                {uri}
              </LText>
              <View style={styles.externalLinkIcon}>
                <ExternalLinkIcon size={14} color={colors.live} />
              </View>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </QueuedDrawer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    position: "relative",
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  basicFontStyle: {
    fontSize: 14,
    lineHeight: 21,
  },
  titleContainer: {
    marginBottom: 16,
  },
  appIcon: {
    paddingRight: 12,
  },
  title: {
    fontSize: 22,
  },
  description: {
    opacity: 0.5,
  },
  hr: {
    borderBottomColor: "rgba(20, 37, 51, 0.1)",
    borderBottomWidth: 1,
    paddingTop: 32,
    marginBottom: 32,
  },
  subSectionTitle: {
    textTransform: "capitalize",
    fontWeight: "600",
    marginBottom: 4,
  },
  externalLinkIcon: {
    paddingLeft: 6,
  },
});
