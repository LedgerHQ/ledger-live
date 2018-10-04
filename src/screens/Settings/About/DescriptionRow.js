/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import colors from "../../../colors";
import type { T } from "../../../types/common";
import LText from "../../../components/LText";
import LedgerLiveLogo from "../../../components/LedgerLiveLogo";
import LiveLogo from "../../../icons/LiveLogo";

class DescriptionRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.descriptionContainer}>
        <LedgerLiveLogo
          width={62}
          height={62}
          icon={<LiveLogo size={42} color={colors.live} />}
        />

        <LText style={styles.description}>
          {t("common:settings.about.appDescription")}
        </LText>
      </View>
    );
  }
}

export default translate()(DescriptionRow);

const styles = StyleSheet.create({
  descriptionContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    alignItems: "center",
  },
  imageContainer: {
    height: 62,
    width: 62,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00000014",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
  },
  description: {
    textAlign: "center",
    margin: 16,
    color: colors.smoke,
  },
});
