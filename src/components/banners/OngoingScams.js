import React from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import { RectButton } from "react-native-gesture-handler";
import { urls } from "../../config/urls";

import LText from "../LText";
import colors from "../../colors";
import { useBanner } from "./hooks";
import AlertTriangle from "../../icons/AlertTriangle";
import ExternalLink from "../ExternalLink";
import CloseIcon from "../../icons/Close";

const OngoingScams = () => {
  const [isDismissed, dismiss] = useBanner("ONGOING_SCAMS");

  if (isDismissed) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <RectButton style={styles.closeButton} onPress={dismiss}>
        <CloseIcon size={16} color={colors.white} />
      </RectButton>
      <RectButton
        style={styles.innerContainer}
        onPress={() => Linking.openURL(urls.banners.ongoingScams)}
        event="LearMoreOngoingScams"
      >
        <View style={styles.iconContainer}>
          <AlertTriangle size={24} color={colors.orange} />
        </View>
        <View style={styles.contentContainer}>
          <LText semiBold style={styles.description}>
            {<Trans i18nKey="banners.ongoingScams.description" />}
          </LText>
          <View style={styles.learnMoreWrapper}>
            <ExternalLink
              color={colors.white}
              text={<Trans i18nKey="common.learnMore" />}
              ltextProps={{
                style: styles.learnMore,
              }}
              onPress={() => () => Linking.openURL(urls.banners.ongoingScams)}
              event="LearMoreOngoingScams"
            />
          </View>
        </View>
      </RectButton>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.orange,
    marginBottom: 8,
  },
  innerContainer: {
    padding: 16,
    flexDirection: "row",
    borderRadius: 4,
  },
  contentContainer: {},
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  description: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 19,
    marginRight: 40,
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
  learnMoreWrapper: {
    fontSize: 130,
    lineHeight: 18,
    marginTop: 4,
    alignItems: "flex-start",
  },
  learnMore: {
    fontSize: 13,
    lineHeight: 19,
    marginRight: 2,
    textDecorationLine: "underline",
    color: colors.white,
  },
});

export default OngoingScams;
