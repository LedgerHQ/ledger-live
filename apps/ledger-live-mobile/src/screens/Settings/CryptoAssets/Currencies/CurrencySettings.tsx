import React, { useCallback, useEffect, useState } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans, useTranslation } from "~/context/Locale";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import Slider from "@react-native-community/slider";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "~/components/SettingsRow";
import { confirmationsNbForCurrencySelector } from "~/reducers/settings";
import { State } from "~/reducers/types";
import { updateCurrencySettings } from "~/actions/settings";
import { withTheme } from "../../../../colors";
import { TrackScreen } from "~/analytics";
import { currencySettingsDefaults } from "~/helpers/CurrencySettingsDefaults";
import CurrencyIcon from "~/components/CurrencyIcon";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { ConfirmationDefaults, UnitDefaults } from "~/types/common";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";
import CurrencyUnitsRow from "./CurrencyUnitsRow";

type NavigationProps =
  | StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.CurrencySettings>
  | StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.CurrencySettings>
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.CurrencySettings>;

type Props = {
  confirmationsNb: number;
  updateCurrencySettings: typeof updateCurrencySettings;
  defaults: ConfirmationDefaults & UnitDefaults;
  currency: CryptoCurrency;
};

const mapStateToProps = (state: State, props: NavigationProps) => {
  const currency = getCryptoCurrencyById(props.route?.params.currencyId);
  return {
    confirmationsNb: confirmationsNbForCurrencySelector(state, { currency }),
    defaults: currencySettingsDefaults(currency),
    currency,
  };
};

const mapDispatchToProps = {
  updateCurrencySettings,
};

export const getCurrencyHasSettings = (currency: CryptoCurrency) =>
  !!currencySettingsDefaults(currency).confirmationsNb;

function EachCurrencySettings({
  navigation,
  currency,
  confirmationsNb,
  defaults,
  updateCurrencySettings,
}: Props & NavigationProps) {
  const [value, setValue] = useState(confirmationsNb);
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleValueChange = useCallback((val: number) => setValue(val), []);
  const handleSlidingComplete = useCallback(
    (val: number) => {
      updateCurrencySettings({
        ticker: currency.ticker,
        patch: { confirmationsNb: val },
      });
    },
    [currency.ticker, updateCurrencySettings],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <CustomCurrencyHeader currency={currency} />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box backgroundColor={"background.main"} height={"100%"} px={6} pt={4}>
      <TrackScreen category="Settings" name="Currency" currency={currency.id} />
      {defaults.confirmationsNb ? (
        <>
          <SettingsRow
            event="CurrencyConfirmationsNb"
            title={t("settings.currencies.confirmationNb")}
            desc={t("settings.currencies.confirmationNbDesc")}
          >
            <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
              {value}
            </Text>
          </SettingsRow>
          <Box mt={7}>
            <Slider
              step={1}
              minimumValue={defaults.confirmationsNb.min}
              maximumValue={defaults.confirmationsNb.max}
              value={value}
              onValueChange={handleValueChange}
              onSlidingComplete={handleSlidingComplete}
              thumbTintColor={colors.primary}
              minimumTrackTintColor={colors.primary}
              style={{ width: "100%", height: 40 }}
            />
            <Flex flexDirection="row" justifyContent="space-between" px={2} mt={2}>
              <Text variant="small" fontWeight="medium" color="neutral.c70">
                {defaults.confirmationsNb.min}
              </Text>
              <Text variant="small" fontWeight="medium" color="neutral.c70">
                {defaults.confirmationsNb.max}
              </Text>
            </Flex>
          </Box>
        </>
      ) : (
        <Text variant={"large"} fontWeight={"semiBold"}>
          <Trans i18nKey="settings.currencies.placeholder" />
        </Text>
      )}

      {defaults.unit && <CurrencyUnitsRow currency={currency} />}
    </Box>
  );
}

export default compose<React.ComponentType<NavigationProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTheme,
)(EachCurrencySettings);

export function CustomCurrencyHeader({ currency }: { currency: CryptoCurrency }) {
  const { t } = useTranslation();
  return (
    <Flex flexDirection={"row"} alignItems={"center"} justifyContent={"center"}>
      <CurrencyIcon size={18} currency={currency} />
      <Text variant={"large"} ml={3} mt={1}>
        {t("settings.currencies.currencySettingsTitle", {
          currencyName: currency.name,
        })}
      </Text>
    </Flex>
  );
}
