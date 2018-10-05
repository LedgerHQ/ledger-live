/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../components/SettingsRow";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import colors from "../../colors";

type Props = {
  t: T,
  navigation: NavigationScreenProp<*>,
  account: Account,
};

class AccountUnitsRow extends PureComponent<Props> {
  render() {
    const { t, navigation, account } = this.props;
    return (
      <SettingsRow
        title={t("common:account.settings.unit.title")}
        desc={t("common:account.settings.unit.desc")}
        arrowRight
        alignedTop
        onPress={() =>
          navigation.navigate("EditAccountUnits", {
            accountId: account.id,
          })
        }
      >
        <LText semiBold style={{ color: colors.grey }}>
          {account.unit.code}
        </LText>
      </SettingsRow>
    );
  }
}

export default translate()(AccountUnitsRow);
