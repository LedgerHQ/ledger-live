import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { RectButton } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName } from "../../const";

import LText from "../LText";
import colors from "../../colors";
import { useBanner } from "./hooks";
import SwapIcon from "../../icons/Swap";
import CloseIcon from "../../icons/Close";

export function SwapBanner() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [isDismissed, dismiss] = useBanner("EXCHANGE_SWAP_BANNER");

  if (isDismissed) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <RectButton style={styles.closeButton} onPress={dismiss}>
        <CloseIcon size={18} color={colors.grey} />
      </RectButton>
      <RectButton
        style={styles.innerContainer}
        onPress={() => navigation.navigate(NavigatorName.Swap)}
      >
        <View style={styles.iconContainer}>
          <SwapIcon size={22} color={colors.live} />
        </View>
        <View style={styles.contentContainer}>
          <LText style={styles.title} bold>
            {t("banner.swap.title")}
          </LText>
          <LText semiBold style={styles.description}>
            {t("banner.swap.description")}
          </LText>
        </View>
      </RectButton>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.darkBlue,
    marginBottom: 8,
  },
  innerContainer: {
    padding: 16,
    flexDirection: "row",
    borderRadius: 4,
  },
  title: {
    color: colors.grey,
    fontSize: 10,
    lineHeight: 15,
    marginRight: 90,
    marginBottom: 4,
  },
  contentContainer: {},
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 50,
    backgroundColor: colors.white,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  description: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 19,
    marginRight: 90,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    zIndex: 999,
    right: 0,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
