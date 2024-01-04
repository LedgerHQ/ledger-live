import React, { ComponentType, useMemo, memo } from "react";
import { getCryptoCurrencyIcon, getTokenCurrencyIcon } from "@ledgerhq/live-common/reactNative";

import { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Flex, Text, ensureContrast } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";

import { getCurrencyColor, useCurrencyColor } from "~/helpers/getCurrencyColor";

const DefaultWrapper = styled(Flex)<{ disabled?: boolean }>`
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
`;

const CircleWrapper = styled(Flex)<{ disabled?: boolean }>`
  border-radius: 9999px;
  border: 1px solid transparent;
  background: ${p => p.color};
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
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
  disabled?: boolean;
};

const CurrencyIcon = ({ size, currency, circle, color, radius, bg, disabled }: Props) => {
  const { colors } = useTheme();
  const bgColor = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );
  const currencyColor = useCurrencyColor(currency, colors.background.main);
  const overrideColor = color || currencyColor;
  const iconSize = size * 0.625;

  if (currency.type === "FiatCurrency") {
    return null;
  }

  const IconComponent = getIconComponent(currency);

  if (circle) {
    return (
      <CircleWrapper size={size} color={bg || bgColor} disabled={disabled}>
        <IconComponent size={iconSize} color={overrideColor} />
      </CircleWrapper>
    );
  }

  return (
    <DefaultWrapper size={size} borderRadius={radius} bg={bg} disabled={disabled}>
      <IconComponent size={iconSize} color={overrideColor} />
    </DefaultWrapper>
  );
};

export default memo<Props>(CurrencyIcon);
