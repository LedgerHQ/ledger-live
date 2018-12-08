/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../components/SettingsRow";
import LText from "../../components/LText";
import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: Account,
};

class AccountUnitsRow extends PureComponent<Props> {
  render() {
    const { navigation, account } = this.props;

    return (
      <SettingsRow
        event="AccountUnitsRow"
        title={<Trans i18nKey="account.settings.unit.title" />}
        desc={<Trans i18nKey="account.settings.unit.desc" />}
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

export default AccountUnitsRow;
