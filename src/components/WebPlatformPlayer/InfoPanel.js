// @flow
import React, { useCallback } from "react";

import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, TouchableOpacity, Linking } from "react-native";
import { translateContent } from "@ledgerhq/live-common/lib/platform/logic";
import type { TranslatableString } from "@ledgerhq/live-common/lib/platform/types";

import { languageSelector } from "../../reducers/settings";
import ExternalLinkIcon from "../../icons/ExternalLink";
import AppIcon from "../../screens/Platform/AppIcon";
import CloseIcon from "../../icons/Close";
import BottomModal from "../BottomModal";
import LText from "../LText";

type Props = {
  name: string,
  icon?: string | null,
  description: TranslatableString,
  url?: string | null,
  isOpened: boolean,
  setIsOpened: (isOpened: boolean) => void,
};

const InfoPanel = ({
  name,
  icon,
  description,
  url,
  isOpened,
  setIsOpened,
}: Props) => {
  const settingsLocale = useSelector(languageSelector);
  const { colors } = useTheme();

  const onClose = useCallback(() => {
    setIsOpened(false);
  }, [setIsOpened]);
  const onLinkPress = useCallback(url => {
    Linking.openURL(url);
  }, []);

  return (
    <BottomModal
      style={{
        ...styles.root,
        backgroundColor: colors.card,
      }}
      id="InfoPanelModal"
      isOpened={isOpened}
      onClose={onClose}
    >
      <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
        <CloseIcon size={18} />
      </TouchableOpacity>
      <View style={{ ...styles.flexRow, ...styles.titleContainer }}>
        {icon ? (
          <View style={styles.appIcon}>
            <AppIcon size={40} name={name} icon={icon} />
          </View>
        ) : null}
        <LText
          semidbold
          style={{
            ...styles.title,
            color: colors.contrastBackground,
          }}
        >
          {name}
        </LText>
      </View>
      <LText
        style={{
          ...styles.basicFontStyle,
          ...styles.description,
          color: colors.contrastBackground,
        }}
      >
        {translateContent(description, settingsLocale)}
      </LText>
      {url ? (
        <>
          <View style={styles.hr} />
          <LText semibold style={styles.subSectionTitle}>
            <Trans i18nKey="platform.webPlatformPlayer.infoPanel.website" />
          </LText>
          <TouchableOpacity
            style={styles.flexRow}
            onPress={() => onLinkPress(url)}
          >
            <LText
              semibold
              style={{ ...styles.basicFontStyle, color: colors.live }}
            >
              {url}
            </LText>
            <View style={styles.externalLinkIcon}>
              <ExternalLinkIcon size={14} color={colors.live} />
            </View>
          </TouchableOpacity>
        </>
      ) : null}
    </BottomModal>
  );
};

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
  closeIcon: {
    position: "absolute",
    top: 8,
    right: 16,
    opacity: 0.5,
  },
});

export default InfoPanel;
