import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage } from "~/renderer/actions/settings";
import { languageSelector } from "~/renderer/reducers/settings";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown } from "@ledgerhq/react-ui";
import { Languages } from "~/config/languages";

const options = (Object.keys(Languages) as Array<keyof typeof Languages>).map(language => {
  return {
    value: language,
    label: Languages[language].label,
  };
});

const styles = {
  // TODO: implement this behavior in the @ledger/ui lib, here we are just overriding the style from the design system lib to have the MENU right aligned
  menu: (styles: unknown) => ({
    ...(styles as object),
    backgroundColor: "transparent",
    width: "fit-content",
  }),

  // TODO: implement this behavior in the @ledger/ui lib, here we are just overriding the style from the design system lib to have the VALUE right aligned
  valueContainer: (styles: unknown) => ({ ...(styles as object) }),
  option: () => ({
    flex: 1,
    alignSelf: "center" as const,
    textAlign: "center" as const,
  }),
};

const LangSwitcher = () => {
  const language = useSelector(languageSelector);
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  const changeLanguage = useCallback(
    ({ value }: typeof currentLanguage) => {
      dispatch(setLanguage(value));
    },
    [dispatch],
  );

  const currentLanguage = useMemo(
    () => options.find(({ value }) => value === language) || options[0],
    [language],
  );

  return (
    <Dropdown
      label=""
      value={currentLanguage}
      options={options}
      // @ts-expect-error Dropdown being stubborn
      onChange={changeLanguage}
      styles={styles}
    />
  );
};

export default LangSwitcher;
