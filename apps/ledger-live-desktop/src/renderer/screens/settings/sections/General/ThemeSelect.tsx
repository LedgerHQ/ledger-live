import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setTheme } from "~/renderer/actions/settings";
import { userThemeSelector } from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Track from "~/renderer/analytics/Track";

type ThemeSelectOption = {
  value: string | null;
  label: string;
};
const themeLabels = {
  light: "theme.light",
  dark: "theme.dark",
};
const ThemeSelect = () => {
  const dispatch = useDispatch();
  const theme = useSelector(userThemeSelector);
  const { t } = useTranslation();

  const avoidEmptyValue = (theme?: ThemeSelectOption | null) => theme && handleChangeTheme(theme);

  const handleChangeTheme = useCallback(
    (theme: ThemeSelectOption) => {
      dispatch(setTheme(theme.value));
    },
    [dispatch],
  );
  const options = useMemo(
    () =>
      (
        [
          {
            value: null,
            label: t("theme.system"),
          },
        ] as ThemeSelectOption[]
      ).concat(
        Object.keys(themeLabels).map(key => ({
          value: key,
          label: t(themeLabels[key as keyof typeof themeLabels]),
        })),
      ),
    [t],
  );
  const currentTheme = options.find(option => option.value === theme);
  return (
    <>
      <Track onUpdate event="ThemeSelect" currentTheme={theme} />
      <Select
        small
        minWidth={260}
        isSearchable={false}
        onChange={avoidEmptyValue}
        value={currentTheme}
        options={options}
      />
    </>
  );
};
export default ThemeSelect;
