import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
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
import Select from "~/renderer/components/Select";

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
  handleChangeUnit = (value?: Unit | null) => this.updateCurrencySettings("unit", value);
  updateCurrencySettings = (key: string, val?: number | Unit | null) => {
    // FIXME this really should be a dedicated action
    const { settings, saveSettings, currency } = this.props;
    const currencySettings = settings.currenciesSettings[currency.ticker];
    let newCurrenciesSettings: {
      [currencyId: string]: CurrencySettings;
    } = {};

    newCurrenciesSettings = {
      ...settings.currenciesSettings,
      [currency.ticker]: {
        ...currencySettings,
        [key as keyof CurrencySettings]: val,
      },
    };

    saveSettings({
      currenciesSettings: newCurrenciesSettings,
    });
  };

  render() {
    const { currency, t, currencySettings } = this.props;
    const { confirmationsNb, unit } = currencySettings;
    const defaults = currencySettingsDefaults(currency);
    // NB ideally we would have a dynamic list of settings

    const unitGetOptionValue = (unit: Unit) => unit.magnitude + "";
    const renderUnitItemCode = (item: { data: Unit }) => item.data.code;
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

        <Row title={t("account.settings.unit.title")} desc={t("account.settings.unit.desc")} inset>
          <Track onUpdate event="ConfirmationsNb" confirmationsNb={confirmationsNb} />

          <Box
            style={{
              width: 150,
            }}
          >
            <Select
              isSearchable={false}
              onChange={this.handleChangeUnit}
              getOptionValue={unitGetOptionValue}
              renderValue={renderUnitItemCode}
              renderOption={renderUnitItemCode}
              value={unit}
              options={currency.units}
            />
          </Box>
        </Row>
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
