import React, { useCallback, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";

import { Announcement } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider/types";
import { useTranslation } from "react-i18next";
import { InfoMedium, WarningMedium } from "@ledgerhq/native-ui/assets/icons";
import { Flex, Notification } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useDeepLinkHandler } from "../../navigation/useDeepLinking";

type Props = {
  item: Announcement;
  index: number;
  isLastElement?: boolean;
  isUnread?: boolean;
};

const icons = {
  info: InfoMedium,
  warning: WarningMedium,
};

export default function NewsRow({ item, isUnread, isLastElement }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { content, icon, utm_campaign: utmCampaign } = item;
  const { title, text, link } = content;
  const [hasBeenRead] = useState(!isUnread);
  const { handler } = useDeepLinkHandler();

  const iconColors = {
    info: "palette.neutral.c100",
    warning: "palette.warning.c100",
  };

  const Icon = icon && icons[icon];

  const openUrl = useCallback(() => {
    if (!link?.href) return;
    const url = new URL(link.href);
    url.searchParams.set("utm_medium", "announcement");
    if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);

    const isDeepLink = url.protocol === "ledgerlive:";

    if (isDeepLink) {
      handler(url.href);
    } else Linking.openURL(url.href);
  }, [handler, link?.href, utmCampaign]);

  // Todo: Track back NewsLearnMore click event
  return (
    <View
      style={[
        !hasBeenRead ? styles.unRead : null,
        isLastElement ? styles.marginBottom : null,
      ]}
    >
      {!hasBeenRead ? (
        <View
          style={[
            styles.unReadBadge,
            { backgroundColor: colors.palette.primary.c100 },
          ]}
        />
      ) : null}
      <Flex my={6}>
        <Notification
          variant={"secondary"}
          Icon={Icon}
          iconColor={(icon && iconColors[icon]) || "palette.neutral.c100"}
          title={title}
          subtitle={text || ""}
          linkText={link?.label || t("common.learnMore")}
          onLinkPress={openUrl}
        />
      </Flex>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
