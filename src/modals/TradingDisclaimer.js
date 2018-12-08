/* @flow */

import React, { Component } from "react";
import { Image, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import { Trans } from "react-i18next";
import Button from "../components/Button";
import LText from "../components/LText";
import BottomModal from "../components/BottomModal";
import colors from "../colors";

const forceInset = { bottom: "always" };

type Props = {
  onClose: *,
  isOpened: *,
};

class TradingDisclaimer extends Component<Props> {
  render() {
    const { onClose, isOpened } = this.props;

    return (
      <BottomModal
        id="TradingDisclaimerModal"
        style={styles.root}
        isOpened={isOpened}
        onClose={onClose}
      >
        <SafeAreaView forceInset={forceInset}>
          <Image
            style={styles.image}
            source={require("../images/shield-blue.png")}
          />
          <LText semiBold style={styles.title}>
            <Trans i18nKey="portfolio.tradingDisclaimer.title" />
          </LText>
          <LText style={styles.text}>
            <Trans i18nKey="portfolio.tradingDisclaimer.text1" />
          </LText>
          <LText style={{ ...styles.text, marginTop: 16 }}>
            <Trans i18nKey="portfolio.tradingDisclaimer.text2" />
          </LText>
          <View style={{ marginTop: 24, flexDirection: "row" }}>
            <Button
              event="TradingDisclaimerGotIt"
              type="primary"
              containerStyle={styles.buttonContainer}
              title={<Trans i18nKey="common.gotit" />}
              onPress={onClose}
            />
          </View>
        </SafeAreaView>
      </BottomModal>
    );
  }
}

export default TradingDisclaimer;

const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingTop: 15,
    paddingBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    marginTop: 16,
    marginBottom: 16,
    alignSelf: "center",
  },
  buttonContainer: {
    flexGrow: 1,
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.smoke,
  },
  title: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});
