import React, { ComponentType, memo } from "react";
import {
  getCryptoCurrencyIcon,
  getTokenCurrencyIcon,
} from "@ledgerhq/live-common/reactNative";

import {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";

import { useCurrencyColor } from "../helpers/getCurrencyColor";

const DefaultWrapper = styled(Flex)`
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
`;

const CircleWrapper = styled(Flex)`
  border-radius: 9999px;
  border: 1px solid transparent;
  background: ${p => p.color};
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
`;

type IconProps = {
  size: number;
  color: string;
};

type Icon = ComponentType<IconProps>;

const getIconComponent = (currency: CryptoCurrency | TokenCurrency): Icon => {
  const icon =
    currency.type === "TokenCurrency"
      ? getTokenCurrencyIcon(currency)
      : getCryptoCurrencyIcon(currency);

  if (icon) {
    return icon;
  }

  return ({ size, ...props }: IconProps) => (
    <Text fontWeight="semiBold" fontSize={size / 2} {...props}>
      {currency.ticker[0]}
    </Text>
  );
};

type Props = {
  currency: Currency;
  size: number;
  color?: string;
  radius?: number;
  bg?: string;
  circle?: boolean;
};

const CurrencyIcon = ({ size, currency, circle, color, radius, bg }: Props) => {
  const { colors } = useTheme();
  const currencyColor = useCurrencyColor(currency, colors.background.main);

  const overrideColor = color || currencyColor;

  if (currency.type === "FiatCurrency") {
    return null;
  }

  const IconComponent = getIconComponent(currency);

  if (circle) {
    return (
      <CircleWrapper size={size} color={bg || colors.background.main}>
        <IconComponent size={size} color={overrideColor} />
      </CircleWrapper>
    );
  }

  return (
    <DefaultWrapper size={size} borderRadius={radius} bg={bg}>
      <IconComponent size={size} color={overrideColor} />
    </DefaultWrapper>
  );
};

export default memo<Props>(CurrencyIcon);
