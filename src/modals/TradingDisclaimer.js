/* @flow */

import React, { Component } from "react";
import { Image, View, StyleSheet, Text } from "react-native";
import { translate } from "react-i18next";
import Button from "../components/Button";
import type { T } from "../types/common";
import BottomModal from "../components/BottomModal";
import type { Props as ModalProps } from "../components/BottomModal";
import colors from "../colors";

type Props = ModalProps & {
  t: T,
};

class TradingDisclaimer extends Component<Props> {
  render() {
    const { onClose, isOpened, t } = this.props;

    return (
      <BottomModal style={styles.root} isOpened={isOpened} onClose={onClose}>
        <Image
          style={styles.image}
          source={require("../images/shield-blue.png")}
        />
        <Text style={styles.title}>
          {t("portfolio.tradingDisclaimer.title")}
        </Text>
        <Text style={styles.text}>
          {t("portfolio.tradingDisclaimer.text1")}
        </Text>
        <Text style={{ ...styles.text, marginTop: 28 }}>
          {t("portfolio.tradingDisclaimer.text2")}
        </Text>
        <View style={{ marginTop: 24, flexDirection: "row" }}>
          <Button
            type="primary"
            containerStyle={styles.buttonContainer}
            title={t("common.gotit")}
            onPress={onClose}
          />
        </View>
      </BottomModal>
    );
  }
}

export default translate()(TradingDisclaimer);

const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingTop: 15,
    paddingBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    marginTop: 17,
    marginBottom: 24,
  },
  buttonContainer: {
    flexGrow: 1,
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    color: colors.grey,
  },
  title: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
    lineHeight: 17,
    marginBottom: 16,
  },
});
