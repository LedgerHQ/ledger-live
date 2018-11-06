/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import SettingsRow from "../../components/SettingsRow";
import Circle from "../../components/Circle";
import Trash from "../../icons/Trash";
import colors from "../../colors";

type Props = {
  onPress: () => void,
};

class ArchiveAccountRow extends PureComponent<Props> {
  render() {
    const { onPress } = this.props;

    return (
      <SettingsRow
        title={<Trans i18nKey="account.settings.delete.title" />}
        desc={<Trans i18nKey="account.settings.delete.desc" />}
        iconLeft={
          <Circle bg="rgba(234,46,73,0.1)" size={32}>
            <Trash size={16} color={colors.alert} />
          </Circle>
        }
        onPress={onPress}
        titleStyle={{ color: colors.alert }}
      />
    );
  }
}

export default ArchiveAccountRow;
