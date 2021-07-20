// @flow
import React, { useCallback, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";

import type { Announcement } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider/types";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import Info from "../../icons/Info";
import Warning from "../../icons/WarningOutline";
import ExternalLink from "../../components/ExternalLink";
import { useDeepLinkHandler } from "../../navigation/useDeepLinking";

type Props = {
  item: Announcement,
  index: number,
  isLastElement?: boolean,
  style?: *,
  isUnread?: boolean,
};

const icons = {
  info: Info,
  warning: Warning,
};

export default function NewsRow({
  item,
  style,
  isUnread,
  isLastElement,
}: Props) {
  const { colors } = useTheme();
  // $FlowFixMe until live-common is bumped
  const { content, uuid, level, icon, utm_campaign: utmCampaign } = item;
  const { title, text, link } = content;
  const [hasBeenRead] = useState(!isUnread);
  const { handler } = useDeepLinkHandler();

  const iconColors = {
    info: colors.live,
    warning: colors.orange,
  };

  const Icon = icon && icons[icon];
  const iconColor = icon && iconColors[icon];
  const { backgroundColor, color } =
    level === "warning"
      ? { backgroundColor: colors.orange, color: "#FFF" }
      : {};

  const openUrl = useCallback(() => {
    const url = new URL(link.href);
    url.searchParams.set("utm_medium", "announcement");
    if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);

    const isDeepLink = url.protocol === "ledgerlive:";

    if (isDeepLink) {
      handler(url.href);
    } else Linking.openURL(url.href);
  }, [handler, link?.href, utmCampaign]);

  return (
    <View
      style={[
        !hasBeenRead ? styles.unRead : null,
        isLastElement ? styles.marginBottom : null,
      ]}
    >
      {!hasBeenRead ? (
        <View style={[styles.unReadBadge, { backgroundColor: colors.live }]} />
      ) : null}
      <View
        style={[
          styles.root,
          style,
          backgroundColor ? { backgroundColor } : null,
        ]}
      >
        <View style={styles.section}>
          <View style={styles.titleSection}>
            {Icon && <Icon size={16} color={color || iconColor} />}
            <LText
              semiBold
              style={[styles.title, { color: color || colors.darkBlue }]}
            >
              {title}
            </LText>
          </View>

          {text && (
            <LText style={[styles.text, { color: color || colors.grey }]}>
              {text}
            </LText>
          )}
          {link && (
            <View style={styles.link}>
              <ExternalLink
                event="NewsLearnMore"
                eventProperties={{ uuid }}
                text={link.label || <Trans i18nKey="common.learnMore" />}
                color={color}
                onPress={openUrl}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  marginBottom: {
    marginBottom: 32,
  },
  unRead: {
    paddingLeft: 16,
    position: "relative",
  },
  unReadBadge: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 8,
    top: "45%",
    left: 0,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
    justifyContent: "flex-start",
    marginBottom: 4,
  },
  section: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 14,
    marginLeft: 8,
  },
  text: {
    fontSize: 13,
  },
  link: {
    marginTop: 16,
  },
});
