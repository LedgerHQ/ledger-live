import { useCallback, useMemo } from "react";
import { useGetSupportedFiatsQuery } from "@domain/api-currency-fiat";
import {
  applyGeneralSettingUpdate,
  type GeneralSettingsData,
  type GeneralSettingsPort,
  type GeneralSettingsValues,
  type GeneralSettingUpdate,
  type GeneralSideEffects,
} from "@features/flow-settings-general";
import { useDispatch, useSelector } from "~/context/hooks";
import { setCountervalue, setLanguage, setTheme } from "~/actions/settings";
import { languages, supportedLocales } from "~/languages";
import {
  counterValueCurrencySelector,
  counterValueIdOf,
  languageSelector,
  supportedCounterValuesSelector,
  themeSelector,
} from "~/reducers/settings";
import { useLedgerSync } from "./useLedgerSync";

const SUPPORTED_LOCALES: ReadonlySet<string> = new Set(supportedLocales);

function isSupportedLocale(value: string): value is (typeof supportedLocales)[number] {
  return SUPPORTED_LOCALES.has(value);
}

/** The General part of the settings port, built from the mobile store. */
export function useGeneralSettingsAdapter(): GeneralSettingsPort {
  useGetSupportedFiatsQuery();
  const dispatch = useDispatch();
  const theme = useSelector(themeSelector);
  const language = useSelector(languageSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const supportedCounterValues = useSelector(supportedCounterValuesSelector);
  const ledgerSync = useLedgerSync();

  const values = useMemo<GeneralSettingsValues>(
    () => ({ theme, language, currency: counterValueCurrency.ticker }),
    [theme, language, counterValueCurrency.ticker],
  );

  const data = useMemo<GeneralSettingsData>(
    () => ({
      languages: supportedLocales.map(id => ({ value: id, label: languages[id] })),
      currencies: supportedCounterValues.map(({ value, label }) => ({ value, label })),
      ledgerSync,
    }),
    [supportedCounterValues, ledgerSync],
  );

  const effects = useMemo<GeneralSideEffects>(
    () => ({
      setTheme: value => dispatch(setTheme(value)),
      setLanguage: picked => {
        if (isSupportedLocale(picked)) dispatch(setLanguage(picked));
      },
      setCurrency: ticker => {
        const counterValue = supportedCounterValues.find(option => option.value === ticker);
        if (counterValue) dispatch(setCountervalue(counterValueIdOf(counterValue.currency)));
      },
    }),
    [dispatch, supportedCounterValues],
  );

  const setValue = useCallback(
    (update: GeneralSettingUpdate) => applyGeneralSettingUpdate(effects, update, data),
    [effects, data],
  );

  return useMemo(() => ({ values, setValue, ...data }), [values, setValue, data]);
}
