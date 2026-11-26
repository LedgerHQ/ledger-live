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
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { type Language, LanguageIds, Languages } from "~/config/languages";
import { setCounterValue, setTheme } from "~/renderer/actions/settings";
import { useSupportedLanguages } from "~/renderer/hooks/useSupportedLanguages";
import {
  counterValueCurrencySelector,
  counterValueIdOf,
  languageSelector,
  supportedCounterValuesSelector,
  userThemeSelector,
} from "~/renderer/reducers/settings";
import { useLanguageChange } from "./useLanguageChange";
import { useLedgerSync } from "./useLedgerSync";

const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set(LanguageIds);

function isLanguage(value: string): value is Language {
  return SUPPORTED_LANGUAGES.has(value);
}

/** The General part of the settings port, built from the desktop store. */
export function useGeneralSettingsAdapter(): GeneralSettingsPort {
  useGetSupportedFiatsQuery();
  const dispatch = useDispatch();
  const theme = useSelector(userThemeSelector);
  const language = useSelector(languageSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const supportedCounterValues = useSelector(supportedCounterValuesSelector);
  const { locales: supportedLanguages } = useSupportedLanguages();
  const changeLanguage = useLanguageChange();
  const ledgerSync = useLedgerSync();

  const values = useMemo<GeneralSettingsValues>(
    () => ({
      theme: theme ?? "system",
      language,
      currency: counterValueCurrency.ticker,
    }),
    [theme, language, counterValueCurrency.ticker],
  );

  const data = useMemo<GeneralSettingsData>(
    () => ({
      languages: supportedLanguages.map(id => ({ value: id, label: Languages[id].label })),
      currencies: supportedCounterValues.map(({ value, currency }) => ({
        value,
        label: currency.name,
        description: currency.ticker,
      })),
      ledgerSync,
    }),
    [supportedLanguages, supportedCounterValues, ledgerSync],
  );

  const effects = useMemo<GeneralSideEffects>(
    () => ({
      setTheme: value => dispatch(setTheme(value === "system" ? null : value)),
      setLanguage: picked => {
        if (isLanguage(picked)) changeLanguage(picked);
      },
      setCurrency: ticker => {
        const counterValue = supportedCounterValues.find(option => option.value === ticker);
        if (counterValue) dispatch(setCounterValue(counterValueIdOf(counterValue.currency)));
      },
    }),
    [dispatch, changeLanguage, supportedCounterValues],
  );

  const setValue = useCallback(
    (update: GeneralSettingUpdate) => applyGeneralSettingUpdate(effects, update, data),
    [effects, data],
  );

  return useMemo(() => ({ values, setValue, ...data }), [values, setValue, data]);
}
