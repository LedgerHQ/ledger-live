/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import SettingsRow from "../../components/SettingsRow";
import Circle from "../../components/Circle";
import Trash from "../../icons/Trash";
import type { T } from "../../types/common";
import colors from "../../colors";

type Props = {
  t: T,
  onPress: () => void,
};

class ArchiveAccountRow extends PureComponent<Props> {
  render() {
    const { t, onPress } = this.props;
    return (
      <SettingsRow
        title={t("common:account.settings.delete.title")}
        desc={t("common:account.settings.delete.desc")}
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

export default translate()(ArchiveAccountRow);
