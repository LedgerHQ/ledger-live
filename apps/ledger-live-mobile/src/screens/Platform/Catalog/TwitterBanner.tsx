import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, Platform, TouchableOpacity, Linking } from "react-native";
import { urls } from "~/utils/urls";
import IconClose from "~/icons/Close";
import LText from "~/components/LText";
import IconTwitter from "~/icons/Twitter";
import { useBanner } from "~/components/banners/hooks";

const CatalogTwitterBanner = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isDismiss, dismiss] = useBanner("CatalogTwitterBanner");
  const sendTweet = useCallback(() => {
    const twitterURL = new URL(urls.banners.twitterIntent);
    twitterURL.searchParams.set("text", t("platform.catalog.twitterBanner.tweetText"));
    twitterURL.searchParams.set("hashtags", "LedgerLiveApp");
    Linking.openURL(twitterURL.toString());
  }, [t]);
  return !isDismiss ? (
    <View
      style={[
        styles.twitterBanner,
        {
          backgroundColor: colors.card,
          ...Platform.select({
            android: {},
            ios: {
              shadowColor: colors.black,
            },
          }),
        },
      ]}
    >
      <View style={styles.iconTwitter}>
        <IconTwitter size={20} color="#1B9DF0" />
      </View>
      <LText style={styles.textTwitter}>
        <Trans i18nKey="platform.catalog.twitterBanner.description" />
        <LText bold onPress={sendTweet}>
          {" #LedgerLiveApp"}
        </LText>
      </LText>
      <TouchableOpacity style={styles.iconClose} onPress={dismiss}>
        <IconClose size={16} />
      </TouchableOpacity>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  twitterBanner: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      },
    }),
  },
  iconTwitter: {
    width: 20,
    marginRight: 8,
  },
  textTwitter: {
    flex: 1,
  },
  iconClose: {
    width: 20,
    opacity: 0.5,
    alignItems: "flex-end",
  },
});
export default CatalogTwitterBanner;
