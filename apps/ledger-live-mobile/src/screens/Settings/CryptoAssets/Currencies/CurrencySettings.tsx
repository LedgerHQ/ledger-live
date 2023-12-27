import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans, withTranslation, useTranslation } from "react-i18next";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Box, Flex, Slider, Text } from "@ledgerhq/native-ui";
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
import { ConfirmationDefaults } from "~/types/common";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";

type NavigationProps =
  | StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.CurrencySettings>
  | StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.CurrencySettings>
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.CurrencySettings>;

type Props = {
  confirmationsNb: number;
  updateCurrencySettings: typeof updateCurrencySettings;
  defaults: ConfirmationDefaults;
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
              min={defaults.confirmationsNb.min}
              max={defaults.confirmationsNb.max}
              value={value}
              onChange={(val: number) => setValue(val)}
              onTouchEnd={(val: number) =>
                updateCurrencySettings({
                  ticker: currency.ticker,
                  patch: {
                    confirmationsNb: val,
                  },
                })
              }
            />
          </Box>
        </>
      ) : (
        <Text variant={"large"} fontWeight={"semiBold"}>
          <Trans i18nKey="settings.currencies.placeholder" />
        </Text>
      )}
    </Box>
  );
}

export default compose<React.ComponentType<NavigationProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
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
