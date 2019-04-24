/* @flow */
import React, { PureComponent, Fragment } from "react";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import colors from "../../../colors";
import { knownDevicesSelector } from "../../../reducers/ble";
import type { DeviceLike } from "../../../reducers/ble";
import { withReboot } from "../../../context/Reboot";
import SettingsRow from "../../../components/SettingsRow";
import BottomModal from "../../../components/BottomModal";
import Circle from "../../../components/Circle";
import HardResetModal from "../../../components/HardResetModal";
import Trash from "../../../icons/Trash";

type Props = {
  reboot: (?boolean) => *,
  knownDevices: DeviceLike[],
};

type State = {
  isModalOpened: boolean,
};
class HardResetRow extends PureComponent<Props, State> {
  state = {
    isModalOpened: false,
  };

  onRequestClose = () => this.setState({ isModalOpened: false });

  onPress = () => this.setState({ isModalOpened: true });

  onHardReset = async () => {
    await Promise.all(
      this.props.knownDevices.map(d => disconnect(d.id).catch(() => {})),
    );
    return this.props.reboot(true);
  };

  render() {
    const { isModalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          event="HardResetRow"
          title={<Trans i18nKey="settings.help.hardReset" />}
          titleStyle={{ color: colors.alert }}
          desc={<Trans i18nKey="settings.help.hardResetDesc" />}
          iconLeft={
            <Circle bg="rgba(234,46,73,0.1)" size={32}>
              <Trash size={16} color={colors.alert} />
            </Circle>
          }
          onPress={this.onPress}
        />
        <BottomModal
          id="HardResetModal"
          isOpened={isModalOpened}
          onClose={this.onRequestClose}
        >
          <HardResetModal />
        </BottomModal>
      </Fragment>
    );
  }
}

export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
)(withReboot(HardResetRow));
