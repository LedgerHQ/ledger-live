/* @flow */
import React, { PureComponent, Fragment } from "react";
import { translate } from "react-i18next";
import colors from "../../../colors";
import { withReboot } from "../../../context/Reboot";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import BottomModal from "../../../components/BottomModal";
import Circle from "../../../components/Circle";
import HardResetModal from "../../../components/HardResetModal";
import Trash from "../../../icons/Trash";

type Props = {
  t: T,
  reboot: (?boolean) => *,
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
  onHardReset = () => this.props.reboot(true);

  render() {
    const { t } = this.props;
    const { isModalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          title={t("settings.help.hardReset")}
          titleStyle={{ color: colors.alert }}
          desc={t("settings.help.hardResetDesc")}
          iconLeft={
            <Circle bg="rgba(234,46,73,0.1)" size={32}>
              <Trash size={16} color={colors.alert} />
            </Circle>
          }
          onPress={this.onPress}
        />
        <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
          <HardResetModal
            onRequestClose={this.onRequestClose}
            onHardReset={this.onHardReset}
          />
        </BottomModal>
      </Fragment>
    );
  }
}

export default translate()(withReboot(HardResetRow));
