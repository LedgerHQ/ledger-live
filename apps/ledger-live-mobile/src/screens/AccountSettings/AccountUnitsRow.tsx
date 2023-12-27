import React, { memo } from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import SettingsRow from "~/components/SettingsRow";
import LText from "~/components/LText";
import type { NavigationProps } from "./index";

type Props = {
  navigation: NavigationProps["navigation"];
  account: Account;
};

function AccountUnitsRow({ navigation, account }: Props) {
  const { colors } = useTheme();
  return (
    <SettingsRow
      event="AccountUnitsRow"
      title={<Trans i18nKey="account.settings.unit.title" />}
      desc={<Trans i18nKey="account.settings.unit.desc" />}
      arrowRight
      onPress={() =>
        navigation.navigate(ScreenName.EditAccountUnits, {
          accountId: account.id,
        })
      }
    >
      <LText
        semiBold
        style={{
          color: colors.grey,
        }}
      >
        {account.unit.code}
      </LText>
    </SettingsRow>
  );
}

export default memo<Props>(AccountUnitsRow);
