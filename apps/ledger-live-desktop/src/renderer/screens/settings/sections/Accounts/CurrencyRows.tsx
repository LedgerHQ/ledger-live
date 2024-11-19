import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import Track from "~/renderer/analytics/Track";
import { setCurrencySettings } from "~/renderer/actions/settings";
import {
  currencySettingsDefaults,
  CurrencySettings,
  currencySettingsLocaleSelector,
} from "~/renderer/reducers/settings";
import StepperNumber from "~/renderer/components/StepperNumber";
import { SettingsSectionRow as Row, SettingsSectionRowContainer } from "../../SettingsSection";
import Box from "~/renderer/components/Box";
import Select from "~/renderer/components/Select";
import { State } from "~/renderer/reducers";

type Props = {
  currency: CryptoCurrency;
};

type Key = keyof CurrencySettings;

function CurrencyRows({ currency }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const currencySettings = useSelector((state: State) =>
    currencySettingsLocaleSelector(state.settings, currency),
  );

  const handleChangeConfirmationsNb = (nb: number) => updateCurrencySettings("confirmationsNb", nb);
  const handleChangeUnit = (value?: Unit | null) => updateCurrencySettings("unit", value);
  const updateCurrencySettings = (key: Key, val?: number | Unit | null) => {
    const newCurrencySettings = {
      ...currencySettings,
      [key as keyof CurrencySettings]: val,
    };

    dispatch(
      setCurrencySettings({
        key: currency.ticker,
        value: newCurrencySettings,
      }),
    );
  };

  const { confirmationsNb, unit } = currencySettings;
  const defaults = currencySettingsDefaults(currency);
  // NB ideally we would have a dynamic list of settings

  const unitGetOptionValue = (unit: Unit) => unit.magnitude + "";
  const renderUnitItemCode = (item: { data: Unit }) => item.data.code;

  return (
    <>
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
              onChange={handleChangeConfirmationsNb}
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
        <Track onUpdate event="unit" unit={unit} />

        <Box
          style={{
            width: 150,
          }}
        >
          <Select
            isSearchable={false}
            onChange={handleChangeUnit}
            getOptionValue={unitGetOptionValue}
            renderValue={renderUnitItemCode}
            renderOption={renderUnitItemCode}
            value={unit}
            options={currency.units}
          />
        </Box>
      </Row>
    </>
  );
}

export default React.memo(CurrencyRows);
