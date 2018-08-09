/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, Modal, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
import colors from "../../../colors";
import { withReboot } from "../../../context/Reboot";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import Menu from "../../../components/Menu";
import Warning from "../../../images/icons/Warning";
import ModalBottomAction from "../../../components/ModalBottomAction";
import RedButton from "../../../components/GenericButton";

const mapStateToProps = createStructuredSelector({});

type Props = {
  t: T,
  reboot: (?boolean) => *,
};

type State = {
  modalOpened: boolean,
};
class HardResetRow extends PureComponent<Props, State> {
  state = {
    modalOpened: false,
  };

  onRequestClose = () => {
    this.setState({ modalOpened: false });
  };

  onPress = () => {
    this.setState({ modalOpened: true });
  };

  onHardReset = () => {
    this.props.reboot(true);
  };
  render() {
    const { t } = this.props;
    const { modalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          title={t("common:settings.help.hardReset")}
          desc={t("common:settings.help.hardResetDesc")}
          arrowRight
          onPress={this.onPress}
        />
        {modalOpened && (
          <Modal transparent onRequestClose={this.onRequestClose}>
            <Menu onRequestClose={this.onRequestClose}>
              <ModalBottomAction
                title={null}
                icon={
                  <View style={styles.imageContainer}>
                    <Warning size={16} color={colors.red} />
                  </View>
                }
                description={t("common:settings.help.hardResetModalDesc")}
                button={
                  <RedButton
                    title={t("common:settings.help.hardResetModalButton")}
                    onPress={this.onHardReset}
                    containerStyle={styles.buttonContainer}
                    titleStyle={styles.buttonTitle}
                  />
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
  connect(mapStateToProps),
  translate(),
)(withReboot(HardResetRow));

const styles = StyleSheet.create({
  imageContainer: {
    height: 56,
    width: 56,
    borderRadius: 50,
    backgroundColor: colors.redLight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    margin: 10,
    backgroundColor: colors.red,
    flexDirection: "row",
    flexGrow: 1,
    borderRadius: 4,
  },
  buttonTitle: {
    color: colors.white,
    fontSize: 14,
  },
});
