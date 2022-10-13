// @flow

import React from "react";
import { useSelector } from "react-redux";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import { useTheme } from "@react-navigation/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { themeSelector } from "../../../reducers/settings";

type Props = {
  isDisabled?: boolean;
};

const Icon = (props: Props) => {
  const theme = useTheme();
  const currentTheme = useSelector(themeSelector);
  const currency = getCryptoCurrencyById("celo");
  const CeloIcon = getCryptoCurrencyIcon(currency);

  const darkOverrideColor = !props.isDisabled
    ? theme.colors.dark
    : theme.colors.smoke;
  const overrideColor =
    currentTheme === "dark" ? darkOverrideColor : theme.colors.white;

  return (
    <CeloIcon
      color={theme.colors.white}
      overrideColor={overrideColor}
      size={18}
    />
  );
};

export default Icon;
