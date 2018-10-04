/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { cleanAccountsCache } from "../../../actions/accounts";
import colors from "../../../colors";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import Warning from "../../../icons/Warning";
import { withReboot } from "../../../context/Reboot";
import ModalBottomAction from "../../../components/ModalBottomAction";
import Button from "../../../components/Button";
import Archive from "../../../icons/Archive";
import Circle from "../../../components/Circle";
import BottomModal from "../../../components/BottomModal";

const mapDispatchToProps = {
  cleanAccountsCache,
};

type Props = {
  t: T,
  cleanAccountsCache: () => void,
  reboot: (?boolean) => *,
};

type State = {
  isModalOpened: boolean,
};

class ClearCacheRow extends PureComponent<Props, State> {
  state = {
    isModalOpened: false,
  };

  onRequestClose = () => {
    this.setState({ isModalOpened: false });
  };

  onPress = () => {
    this.setState({ isModalOpened: true });
  };

  onClearCache = async () => {
    await this.props.cleanAccountsCache();
    this.props.reboot();
  };

  render() {
    const { t } = this.props;
    const { isModalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          title={t("settings.help.clearCache")}
          desc={t("settings.help.clearCacheDesc")}
          iconLeft={
            <Circle bg="rgba(153,153,153,0.1)" size={32}>
              <Archive size={16} color={colors.grey} />
            </Circle>
          }
          onPress={this.onPress}
        />
        <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
          <ModalBottomAction
            title={null}
            icon={
              <Circle bg={colors.lightLive} size={56}>
                <Warning size={24} color={colors.live} />
              </Circle>
            }
            description={t("settings.help.clearCacheModalDesc")}
            footer={
              <View style={styles.footerContainer}>
                <Button
                  type="secondary"
                  title={t("common.cancel")}
                  onPress={this.onRequestClose}
                  containerStyle={styles.buttonContainer}
                />
                <Button
                  type="primary"
                  title={t("settings.help.clearCacheButton")}
                  onPress={this.onClearCache}
                  containerStyle={styles.buttonContainer}
                />
              </View>
            }
          />
        </BottomModal>
      </Fragment>
    );
  }
}

export default compose(
  connect(
    null,
    mapDispatchToProps,
  ),
  translate(),
)(withReboot(ClearCacheRow));

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonContainer: {
    width: 136,
  },
});
