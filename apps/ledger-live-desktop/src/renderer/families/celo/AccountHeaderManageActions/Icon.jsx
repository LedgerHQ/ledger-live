// @flow

import React from "react";
import { useSelector } from "react-redux";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { themeSelector } from "~/renderer/actions/general";
import theme from "~/renderer/styles/theme";

type Props = {
  isDisabled?: boolean,
};

const Icon = (props: Props) => {
  const currentTheme = useSelector(themeSelector);
  const darkOverrideColor = !props.isDisabled ? theme.colors.dark : theme.colors.smoke;
  const overrideColor = currentTheme === "dark" ? darkOverrideColor : theme.colors.white;

  return <CryptoCurrencyIcon {...props} overrideColor={overrideColor} />;
};

export default Icon;
