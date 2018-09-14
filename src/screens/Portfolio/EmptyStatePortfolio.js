/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, Image, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import colors from "../../colors";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import BlueButton from "../../components/BlueButton";

class EmptyStatePortfolio extends PureComponent<{
  t: T,
  navigation: NavigationScreenProp<*>,
}> {
  goToImportAccounts = () => {
    const { navigation } = this.props;
    navigation.navigate("ImportAccounts");
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Image source={require("../../images/EmptyStatePortfolio.png")} />
          <LText secondary semiBold style={styles.title}>
            {t("portfolio.emptyState.title")}
          </LText>
          <LText style={styles.desc}>{t("portfolio.emptyState.desc")}</LText>
          <BlueButton
            title={t("portfolio.emptyState.buttons.import")}
            onPress={this.goToImportAccounts}
            containerStyle={styles.recieveButton}
            titleStyle={[styles.buttonTitle]}
          />
        </View>
      </View>
    );
  }
}

export default translate()(EmptyStatePortfolio);

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
  buttonTitle: {
    fontSize: 16,
  },
  recieveButton: {
    height: 48,
    width: 290,
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
    fontSize: 16,
  },
  desc: {
    color: colors.grey,
    marginHorizontal: 16,
    textAlign: "center",
    marginBottom: 32,
  },
});
