/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { Trans, translate } from "react-i18next";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";
import colors from "../../colors";
import { knownDevicesSelector } from "../../reducers/ble";
import type { DeviceLike } from "../../reducers/ble";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      editMode: boolean,
    },
  }>,
  knownDevices: DeviceLike[],
};

const mapStateToProps = state => ({
  knownDevices: knownDevicesSelector(state),
});

class ToggleManagerEdition extends Component<Props> {
  onPress = () => {
    const { navigation } = this.props;
    const editMode = !navigation.getParam("editMode");
    navigation.setParams({ editMode });
    if (editMode) {
      const n = navigation.dangerouslyGetParent();
      if (n) n.setParams({ editMode });
    }
  };

  render() {
    const { navigation, knownDevices } = this.props;
    const editMode = !navigation.getParam("editMode");
    return knownDevices.length > 0 ? (
      <Touchable
        event="ManagerToggleEdit"
        eventProperties={{ editMode }}
        onPress={this.onPress}
      >
        <LText secondary semiBold style={styles.text}>
          <Trans i18nKey={`common.${editMode ? "edit" : "cancel"}`} />
        </LText>
      </Touchable>
    ) : null;
  }
}

export default compose(
  translate(),
  connect(mapStateToProps),
  withNavigation,
)(ToggleManagerEdition);

const styles = StyleSheet.create({
  text: {
    color: colors.live,
    fontSize: 16,
    padding: 16,
  },
});
