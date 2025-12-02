import React, { useMemo, memo } from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Flex, ensureContrast } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { getCurrencyColor } from "~/helpers/getCurrencyColor";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { getValidCryptoIconSizeNative } from "@ledgerhq/live-common/helpers/cryptoIconSize";

const DefaultWrapper = styled(Flex)<{ disabled?: boolean }>`
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

type Props = {
  currency: Currency;
  size: number;
  bg?: string;
  circle?: boolean;
  disabled?: boolean;
  hideNetwork?: boolean;
};

const CurrencyIcon = ({ size, currency, circle, bg, disabled, hideNetwork }: Props) => {
  const { colors } = useTheme();
  const bgColor = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );
  const validIconSize = getValidCryptoIconSizeNative(size);

  if (currency.type === "FiatCurrency") {
    return null;
  }

  const ledgerId = currency.id;
  const ticker = currency.ticker;
  const network = hideNetwork
    ? undefined
    : currency.type === "TokenCurrency"
      ? currency.parentCurrency.id
      : undefined;

  const cryptoIconElement = (
    <CryptoIcon
      ledgerId={ledgerId}
      ticker={ticker}
      size={validIconSize}
      backgroundColor={colors.background.main}
      {...(network && { network })}
    />
  );

  if (circle) {
    return (
      <CircleWrapper size={size} color={bg || bgColor} disabled={disabled}>
        {cryptoIconElement}
      </CircleWrapper>
    );
  }

  if (disabled) {
    return <DefaultWrapper disabled={disabled}>{cryptoIconElement}</DefaultWrapper>;
  }

  return cryptoIconElement;
};

export default memo<Props>(CurrencyIcon);
