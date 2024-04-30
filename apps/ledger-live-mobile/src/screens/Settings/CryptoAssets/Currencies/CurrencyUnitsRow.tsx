import React, { memo } from "react";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import SettingsRow from "~/components/SettingsRow";
import LText from "~/components/LText";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import { currencySettingsSelector } from "~/reducers/settings";
import { State } from "~/reducers/types";

type Props = {
  currency: CryptoCurrency;
};

function CurrencyUnitsRow({ currency }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const currencySettings = useSelector((s: State) =>
    currencySettingsSelector(s.settings, {
      currency,
    }),
  );

  return (
    <SettingsRow
      event="AccountUnitsRow"
      title={<Trans i18nKey="account.settings.unit.title" />}
      desc={<Trans i18nKey="account.settings.unit.desc" />}
      arrowRight
      onPress={() =>
        navigation.navigate(ScreenName.EditCurrencyUnits, {
          currency,
        })
      }
    >
      <LText
        semiBold
        style={{
          color: colors.grey,
        }}
      >
        {currencySettings.unit.code}
      </LText>
    </SettingsRow>
  );
}

export default memo<Props>(CurrencyUnitsRow);
