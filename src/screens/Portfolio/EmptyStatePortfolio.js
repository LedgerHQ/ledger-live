/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, Image, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import colors from "../../colors";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import Button from "../../components/Button";
import AddAccountsModal from "../../components/AddAccountsModal";

type Props = {
  t: T,
  navigation: NavigationScreenProp<*>,
};

type State = {
  isAddModalOpened: boolean,
};

class EmptyStatePortfolio extends PureComponent<Props, State> {
  state = {
    isAddModalOpened: false,
  };

  openAddModal = () => this.setState({ isAddModalOpened: true });

  closeAddModal = () => this.setState({ isAddModalOpened: false });

  render() {
    const { t, navigation } = this.props;
    const { isAddModalOpened } = this.state;
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Image source={require("../../images/EmptyStatePortfolio.png")} />
          <LText secondary semiBold style={styles.title}>
            {t("portfolio.emptyState.title")}
          </LText>
          <LText style={styles.desc}>{t("portfolio.emptyState.desc")}</LText>
          <Button
            type="primary"
            title={t("portfolio.emptyState.buttons.import")}
            onPress={this.openAddModal}
            containerStyle={styles.receiveButton}
          />
          <AddAccountsModal
            navigation={navigation}
            isOpened={isAddModalOpened}
            onClose={this.closeAddModal}
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
  receiveButton: {
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
