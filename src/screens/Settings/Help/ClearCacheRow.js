/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, Modal, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
import colors from "../../../colors";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import Menu from "../../../components/Menu";
import Warning from "../../../images/icons/Warning";
import ModalBottomAction from "../../../components/ModalBottomAction";
import BlueButton from "../../../components/BlueButton";
import GreyButton from "../../../components/GreyButton";

const mapStateToProps = createStructuredSelector({});

type Props = {
  t: T,
};

type State = {
  modalOpened: boolean,
};

class ClearCacheRow extends PureComponent<Props, State> {
  state = {
    modalOpened: false,
  };

  onRequestClose = () => {
    this.setState({ modalOpened: false });
  };

  onPress = () => {
    this.setState({ modalOpened: true });
  };

  onClearCache = () => {
    console.log("Placeholder for clearing cache");
  };
  render() {
    const { t } = this.props;
    const { modalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          title={t("common:settings.help.clearCache")}
          desc={t("common:settings.help.clearCacheDesc")}
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
                    <Warning size={24} color={colors.live} />
                  </View>
                }
                description={t("common:settings.help.clearCacheModalDesc")}
                footer={
                  <View style={styles.footerContainer}>
                    <GreyButton
                      title={t("common:common.cancel")}
                      onPress={this.onRequestClose}
                      containerStyle={styles.buttonContainer}
                      titleStyle={styles.buttonTitle}
                    />

                    <BlueButton
                      title={t("common:settings.help.clearCacheButton")}
                      onPress={this.onClearCache}
                      containerStyle={[
                        styles.buttonContainer,
                        styles.clearCacheBg,
                      ]}
                      titleStyle={[styles.buttonTitle, styles.clearCacheTitle]}
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
  connect(mapStateToProps),
  translate(),
)(ClearCacheRow);

const styles = StyleSheet.create({
  imageContainer: {
    height: 56,
    width: 56,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    alignItems: "center",
    justifyContent: "center",
  },

  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonContainer: {
    height: 48,
    width: 136,
  },
  clearCacheBg: {
    backgroundColor: colors.live,
  },
  buttonTitle: {
    fontSize: 16,
  },
  clearCacheTitle: {
    color: colors.white,
  },
});
