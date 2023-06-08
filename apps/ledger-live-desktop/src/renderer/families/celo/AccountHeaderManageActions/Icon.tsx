import React from "react";
import { useSelector } from "react-redux";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { themeSelector } from "~/renderer/actions/general";
import theme from "~/renderer/styles/theme";
import { IconType } from "../../types";

type CeloIconProps = {
  isDisabled?: boolean;
} & IconType;

const Icon = (props: CeloIconProps) => {
  const currentTheme = useSelector(themeSelector);
  const darkOverrideColor = !props.isDisabled ? theme.colors.dark : theme.colors.smoke;
  const overrideColor = currentTheme === "dark" ? darkOverrideColor : theme.colors.white;
  return <CryptoCurrencyIcon {...props} overrideColor={overrideColor} />;
};
export default Icon;
