/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import Icon from "react-native-vector-icons/dist/Feather";
import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import EmptyAccountsIllustration from "../../icons/EmptyAccountsIllustration";

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  isAddModalOpened: boolean,
};

const IconPlus = p => <Icon name="plus" {...p} size={18} />;

class EmptyStatePortfolio extends PureComponent<Props, State> {
  state = {
    isAddModalOpened: false,
  };

  navigateToManager = () => this.props.navigation.navigate("Manager");

  openAddModal = () => this.setState({ isAddModalOpened: true });

  closeAddModal = () => this.setState({ isAddModalOpened: false });

  render() {
    const { navigation } = this.props;
    const { isAddModalOpened } = this.state;
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <EmptyAccountsIllustration />
          <LText secondary semiBold style={styles.title}>
            {<Trans i18nKey="portfolio.emptyState.title" />}
          </LText>
          <LText style={styles.desc}>
            {<Trans i18nKey="portfolio.emptyState.desc" />}
          </LText>
          <Button
            type="primary"
            title={<Trans i18nKey="portfolio.emptyState.buttons.manager" />}
            onPress={this.navigateToManager}
            containerStyle={[styles.buttonFull, styles.primaryCTA]}
          />
          <Button
            type="lightSecondary"
            title={<Trans i18nKey="portfolio.emptyState.buttons.import" />}
            onPress={this.openAddModal}
            containerStyle={styles.buttonFull}
            IconLeft={IconPlus}
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

export default EmptyStatePortfolio;

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
  primaryCTA: {
    marginBottom: 16,
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
    fontSize: 16,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.grey,
    textAlign: "center",
    marginBottom: 32,
  },
});
