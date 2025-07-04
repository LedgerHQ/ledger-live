import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import upperFirst from "lodash/upperFirst";
import { setLocale } from "~/renderer/actions/settings";
import { languageSelector, localeSelector } from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Track from "~/renderer/analytics/Track";
import regionsByKey from "./regions.json";
import { DEFAULT_LANGUAGE, OFAC_LOCALES } from "~/config/languages";

type RegionSelectOption = {
  value: string;
  locale: string;
  language: string;
  region: string;
  label: string;
};
const getRegionOption = (regionLocale: string, languageLocale: string | Intl.Locale) => {
  const regionLocaleWithoutOFAC = OFAC_LOCALES.includes(regionLocale) ? "en-US" : regionLocale;
  const [language, region = ""] = regionLocaleWithoutOFAC.split("-");
  const languageDisplayName = new window.Intl.DisplayNames([languageLocale], {
    type: "language",
  }).of(language);
  const regionDisplayName = new window.Intl.DisplayNames([languageLocale], {
    type: "region",
  }).of(region);
  const labelPrefix = upperFirst(regionDisplayName);
  const labelSuffix = regionDisplayName ? ` (${upperFirst(languageDisplayName)})` : "";
  const label = `${labelPrefix}${labelSuffix}`;
  return {
    value: regionLocaleWithoutOFAC,
    locale: regionLocaleWithoutOFAC,
    language,
    region,
    label,
  };
};
const getRegionsOptions = (languageLocale: string) =>
  Object.keys(regionsByKey)
    .filter(regionLocale => !OFAC_LOCALES.includes(regionLocale))
    .map(regionLocale => getRegionOption(regionLocale, languageLocale))
    .sort((a, b) => a.label.localeCompare(b.label));

const RegionSelectComponent: React.FC = () => {
  const dispatch = useDispatch();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);

  const regionsOptions = useMemo(() => getRegionsOptions(language), [language]);

  const handleChangeRegion = useCallback(
    (region?: RegionSelectOption) => {
      dispatch(setLocale(region?.locale ?? DEFAULT_LANGUAGE.locales.default));
    },
    [dispatch],
  );

  const avoidEmptyValue = useCallback(
    (region?: RegionSelectOption | null) => region && handleChangeRegion(region),
    [handleChangeRegion],
  );

  const currentRegionOption = useMemo(
    () => regionsOptions.find(o => o.value === locale) || getRegionOption(locale, language),
    [locale, language, regionsOptions],
  );

  return (
    <>
      <Track onUpdate event="RegionSelectChange" currentRegion={currentRegionOption.region} />
      <Select
        small
        minWidth={260}
        onChange={avoidEmptyValue}
        renderSelected={(item: { label: string }) => item && item.label}
        value={currentRegionOption}
        options={regionsOptions}
      />
    </>
  );
};

const RegionSelect = React.memo(RegionSelectComponent);
RegionSelect.displayName = "RegionSelect";

export default RegionSelect;
