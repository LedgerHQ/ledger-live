import React, { PureComponent } from "react";
import { Trans, withTranslation, TFunction } from "react-i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Track from "~/renderer/analytics/Track";
import { saveSettings } from "~/renderer/actions/settings";
import {
  currencySettingsSelector,
  storeSelector,
  currencySettingsDefaults,
  SettingsState,
  CurrencySettings,
} from "~/renderer/reducers/settings";
import StepperNumber from "~/renderer/components/StepperNumber";
import {
  SettingsSectionRow as Row,
  SettingsSectionRowContainer,
  SettingsSectionBody as Body,
} from "../../SettingsSection";
import Box from "~/renderer/components/Box";
type Props = {
  t: TFunction;
  currency: CryptoCurrency;
  currencySettings: CurrencySettings;
  // FIXME: the stuff bellow to be to be gone!
  settings: SettingsState;
  saveSettings: (a: Partial<SettingsState>) => void;
};
class CurrencyRows extends PureComponent<Props> {
  handleChangeConfirmationsNb = (nb: number) => this.updateCurrencySettings("confirmationsNb", nb);
  updateCurrencySettings = (key: string, val: any) => {
    // FIXME this really should be a dedicated action
    const { settings, saveSettings, currency } = this.props;
    const currencySettings = settings.currenciesSettings[currency.ticker];
    let newCurrenciesSettings = [];
    if (!currencySettings) {
      newCurrenciesSettings = {
        ...settings.currenciesSettings,
        [currency.ticker]: {
          [key]: val,
        },
      };
    } else {
      newCurrenciesSettings = {
        ...settings.currenciesSettings,
        [currency.ticker]: {
          ...currencySettings,
          [key]: val,
        },
      };
    }
    saveSettings({
      currenciesSettings: newCurrenciesSettings,
    });
  };

  render() {
    const { currency, t, currencySettings } = this.props;
    const { confirmationsNb } = currencySettings;
    const defaults = currencySettingsDefaults(currency);
    // NB ideally we would have a dynamic list of settings

    return (
      <Body>
        {defaults.confirmationsNb ? (
          <Row
            title={t("settings.currencies.confirmationsNb")}
            desc={t("settings.currencies.confirmationsNbDesc")}
            inset
          >
            <Track onUpdate event="ConfirmationsNb" confirmationsNb={confirmationsNb} />
            {defaults.confirmationsNb ? (
              <StepperNumber
                min={defaults.confirmationsNb.min}
                max={defaults.confirmationsNb.max}
                step={1}
                onChange={this.handleChangeConfirmationsNb}
                value={confirmationsNb}
              />
            ) : null}
          </Row>
        ) : (
          <SettingsSectionRowContainer>
            <Box ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
              <Trans i18nKey="settings.currencies.placeholder" />
            </Box>
          </SettingsSectionRowContainer>
        )}
      </Body>
    );
  }
}
export default withTranslation()(
  connect(
    createStructuredSelector({
      currencySettings: currencySettingsSelector,
      settings: storeSelector,
    }),
    {
      saveSettings,
    },
  )(CurrencyRows),
);
