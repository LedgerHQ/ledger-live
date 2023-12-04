import React from "react";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import { useTheme } from "styled-components/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

type Props = {
  isDisabled?: boolean;
};

const Icon = (props: Props) => {
  const theme = useTheme();
  const currency = getCryptoCurrencyById("celo");
  const CeloIcon = getCryptoCurrencyIcon(currency);

  if (CeloIcon) {
    return (
      <CeloIcon
        color={props.isDisabled ? theme.colors.neutral.c70 : theme.colors.neutral.c20}
        size={18}
      />
    );
  }

  return null;
};

export default Icon;
