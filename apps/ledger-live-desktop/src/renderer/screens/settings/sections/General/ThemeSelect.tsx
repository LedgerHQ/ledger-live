import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setTheme } from "~/renderer/actions/settings";
import { userThemeSelector } from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Track from "~/renderer/analytics/Track";
import { useTheme, ThemeMode } from "@ledgerhq/ldls-ui-react";

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

  const { setMode } = useTheme();

  const avoidEmptyValue = (theme?: ThemeSelectOption | null) => theme && handleChangeTheme(theme);

  const handleChangeTheme = useCallback(
    (theme: ThemeSelectOption) => {
      setMode(theme.value as ThemeMode);
      dispatch(setTheme(theme.value));
    },
    [dispatch, setMode],
  );
  const options = useMemo(() => {
    const xs: ThemeSelectOption[] = [
      {
        value: null,
        label: t("theme.system"),
      },
    ];
    return xs.concat(
      Object.keys(themeLabels).map(key => ({
        value: key,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        label: t(themeLabels[key as keyof typeof themeLabels]),
      })),
    );
  }, [t]);
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
