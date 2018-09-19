/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import SettingsRow from "../../components/SettingsRow";
import Circle from "../../components/Circle";
import Archive from "../../icons/Archive";
import type { T } from "../../types/common";
import colors from "../../colors";

type Props = {
  t: T,
};

class ArchiveAccountRow extends PureComponent<Props> {
  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:account.settings.archive.title")}
        desc={t("common:account.settings.archive.desc")}
        iconLeft={
          <Circle bg="rgba(153,153,153,0.1)" size={32}>
            <Archive size={16} color={colors.grey} />
          </Circle>
        }
        onPress={() => null}
      />
    );
  }
}

export default translate()(ArchiveAccountRow);
