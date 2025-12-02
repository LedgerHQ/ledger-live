import React from "react";
import styled, { useTheme } from "styled-components";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useCurrencyColor } from "~/renderer/getCurrencyColor";
import { mix } from "~/renderer/styles/helpers";
import { CryptoIcon } from "@ledgerhq/react-ui/pre-ldls";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";

type Props = {
  currency: Currency;
  circle?: boolean;
  size: number;
  overrideColor?: string;
  inactive?: boolean;
};

// NB this is to avoid seeing the parent icon through
export const TokenIconWrapper = styled.div`
  border-radius: 4px;
`;

export const CircleWrapper = styled.div<{ size: number }>`
  border-radius: 50%;
  border: 1px solid transparent;
  background: ${p => p.color};
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
  display: flex;
`;

export const TokenIcon = styled.div<{
  fontSize?: number;
  size: number;
  color: string;
  circle?: boolean;
}>`
  font-size: ${p => (p.fontSize ? p.fontSize : p.size / 2)}px;
  font-family: "Inter";
  font-weight: bold;
  color: ${p => p.color};
  background-color: ${p => mix(p.color, p.theme.colors.palette.background.default, 0.9)};
  border-radius: 4px;
  border-radius: ${p => (p.circle ? "50%" : "4px")};
  display: flex;
  overflow: hidden;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: ${p => p.size}px;
  height: ${p => p.size}px;
`;

// Container for the new CryptoIcon component
const Container = styled.div<{ size: number }>`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Ensure the CryptoIcon respects the container size */
  > * {
    width: ${p => p.size}px !important;
    height: ${p => p.size}px !important;
  }
`;
const CryptoCurrencyIcon = ({ currency, circle, size, overrideColor, inactive }: Props) => {
  const theme = useTheme();
  const currencyColor = useCurrencyColor(currency, theme.colors.palette.background.paper);
  const color = overrideColor || (inactive ? theme.colors.palette.text.shade60 : currencyColor);

  if (currency.type === "FiatCurrency") {
    return null;
  }

  const ledgerId = currency.id;
  const ticker = currency.ticker;
  const network = currency.type === "TokenCurrency" ? currency.parentCurrency.id : undefined;
  const iconSize = circle ? Math.round(size * 0.8) : size;
  const validSize = getValidCryptoIconSize(iconSize);

  const cryptoIconElement =
    currency.type === "TokenCurrency" ? (
      <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} network={network} />
    ) : (
      <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} />
    );

  if (circle) {
    return (
      <CircleWrapper size={size} color={color}>
        {cryptoIconElement}
      </CircleWrapper>
    );
  }

  return <Container size={size}>{cryptoIconElement}</Container>;
};

export default CryptoCurrencyIcon;
