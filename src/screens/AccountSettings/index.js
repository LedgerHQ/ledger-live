/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet, Modal } from "react-native";
import { translate, Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { deleteAccount } from "../../actions/accounts";
import HeaderRightClose from "../../components/HeaderRightClose";
import type { T } from "../../types/common";
import SettingsRow from "../../components/SettingsRow";
import Menu from "../../components/Menu";
import LText from "../../components/LText";
import colors from "../../colors";
import Trash from "../../images/icons/Trash";
import Archive from "../../images/icons/Archive";
import ModalBottomAction from "../../components/ModalBottomAction";
import RedButton from "../../components/RedButton";
import GreyButton from "../../components/GreyButton";
import Circle from "../../components/Circle";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  t: T,
  account: Account,
  deleteAccount: Function,
};

type State = {
  modalOpened: boolean,
};
const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
const mapDispatchToProps = {
  deleteAccount,
};
class AccountSettings extends PureComponent<Props, State> {
  // NOTE dangerouslyGetParent - hopefully temp

  static navigationOptions = ({ navigation }: *) => ({
    title: "Account Settings",
    headerRight: (
      <HeaderRightClose navigation={navigation.dangerouslyGetParent()} />
    ),
    headerLeft: null,
  });

  state = {
    modalOpened: false,
  };

  onRequestClose = () => {
    this.setState({ modalOpened: false });
  };

  onPress = () => {
    this.setState({ modalOpened: true });
  };
  deleteAccount = () => {
    const { account, deleteAccount, navigation } = this.props;
    deleteAccount(account);
    navigation.navigate("Accounts");
  };
  render() {
    const { navigation, t, account } = this.props;
    const { modalOpened } = this.state;
    if (!account) return null;
    return (
      <Fragment>
        <View style={styles.sectionRow}>
          <SettingsRow
            title={t("common:account.settings.accountName.title")}
            desc={t("common:account.settings.accountName.desc")}
            arrowRight
            onPress={() =>
              navigation.navigate("EditAccountName", {
                accountId: account.id,
              })
            }
          >
            <LText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.accountName}
            >
              {account.name}
            </LText>
          </SettingsRow>
          <SettingsRow
            title={t("common:account.settings.unit.title")}
            desc={t("common:account.settings.unit.desc")}
            arrowRight
            onPress={() =>
              navigation.navigate("EditAccountUnits", {
                accountId: account.id,
              })
            }
          >
            <LText style={{ color: colors.grey }}>{account.unit.code}</LText>
          </SettingsRow>
        </View>
        <View style={styles.sectionRow}>
          <SettingsRow
            title={t("common:account.settings.archive.title")}
            desc={t("common:account.settings.archive.desc")}
            iconLeft={
              <Circle bg="rgba(153,153,153,0.1)" size={32}>
                <Archive size={16} color={colors.grey} />
              </Circle>
            }
            onPress={() => navigation.navigate("")}
          />
          <SettingsRow
            title={t("common:account.settings.delete.title")}
            desc={t("common:account.settings.delete.desc")}
            iconLeft={
              <Circle bg="rgba(234,46,73,0.1)" size={32}>
                <Trash size={16} color={colors.alert} />
              </Circle>
            }
            onPress={this.onPress}
            titleStyle={{ color: colors.alert }}
          />
        </View>
        {modalOpened && (
          <Modal transparent onRequestClose={this.onRequestClose}>
            <Menu onRequestClose={this.onRequestClose}>
              <ModalBottomAction
                title={null}
                icon={
                  <Circle bg={colors.lightAlert} size={56}>
                    <Trash size={24} color={colors.alert} />
                  </Circle>
                }
                description={
                  <Trans i18nKey="common:account.settings.delete.confirmationDesc">
                    {"Are you sure you want to delete "}
                    <LText bold>{account.name}</LText>
                    {"account"}
                  </Trans>
                }
                footer={
                  <View style={styles.footerContainer}>
                    <GreyButton
                      title={t("common:common.cancel")}
                      onPress={this.onRequestClose}
                      containerStyle={styles.buttonContainer}
                      titleStyle={styles.buttonTitle}
                    />
                    <RedButton
                      title={t("common:common.delete")}
                      onPress={this.deleteAccount}
                      containerStyle={[
                        styles.buttonContainer,
                        styles.deleteButtonBg,
                      ]}
                      titleStyle={[
                        styles.buttonTitle,
                        styles.deleteButtonTitle,
                      ]}
                    />
                  </View>
                }
              />
            </Menu>
          </Modal>
        )}
      </Fragment>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(AccountSettings);

const styles = StyleSheet.create({
  sectionRow: {
    marginTop: 16,
  },
  accountName: {
    flex: 1,
    flexShrink: 1,
    color: colors.grey,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonContainer: {
    height: 48,
    width: 136,
  },
  deleteButtonBg: {
    backgroundColor: colors.alert,
  },
  buttonTitle: {
    fontSize: 16,
  },
  deleteButtonTitle: {
    color: colors.white,
  },
});
