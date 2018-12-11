/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import IconReceive from "../../icons/Receive";
import PortfolioNoOpIllustration from "../../icons/PortfolioNoOpIllustration";

type Props = {
  navigation: NavigationScreenProp<*>,
};

class NoOpStatePortfolio extends PureComponent<Props> {
  navigateToReceive = () =>
    this.props.navigation.navigate({
      routeName: "ReceiveFunds",
      params: {
        goBackKey: this.props.navigation.state.key,
      },
      key: "receivefunds",
    });

  render() {
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <PortfolioNoOpIllustration />
          <LText secondary semiBold style={styles.title}>
            {<Trans i18nKey="portfolio.noOpState.title" />}
          </LText>
          <LText style={styles.desc}>
            {<Trans i18nKey="portfolio.noOpState.desc" />}
          </LText>
          <Button
            event="PortfolioNoOpToReceive"
            type="primary"
            IconLeft={IconReceive}
            onPress={this.navigateToReceive}
            title={<Trans i18nKey="account.receive" />}
            containerStyle={styles.buttonFull}
          />
        </View>
      </View>
    );
  }
}

export default NoOpStatePortfolio;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
  },
  body: {
    alignItems: "center",
  },
  buttonFull: {
    alignSelf: "stretch",
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
    fontSize: 16,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    marginHorizontal: 18,
    color: colors.grey,
    textAlign: "center",
    marginBottom: 32,
  },
});
