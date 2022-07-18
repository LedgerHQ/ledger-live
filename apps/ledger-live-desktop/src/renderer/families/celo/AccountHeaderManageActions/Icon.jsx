// @flow

import React from "react";
import { useSelector } from "react-redux";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { themeSelector } from "~/renderer/actions/general";
import theme from "~/renderer/styles/theme";

const Icon = (props: *) => {
  const currentTheme = useSelector(themeSelector);

  return (
    <CryptoCurrencyIcon
      {...props}
      overrideColor={currentTheme === "dark" ? theme.colors.dark : theme.colors.white}
    />
  );
};

export default Icon;
