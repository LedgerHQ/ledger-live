import React, { memo } from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Flex } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { getValidCryptoIconSizeNative } from "@ledgerhq/live-common/helpers/cryptoIconSize";

const DefaultWrapper = styled(Flex)<{ disabled?: boolean }>`
  align-items: center;
  justify-content: center;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
`;

type Props = {
  currency: Currency;
  size: number;
  disabled?: boolean;
  hideNetwork?: boolean;
};

const CurrencyIcon = ({ size, currency, disabled, hideNetwork }: Props) => {
  const { colors } = useTheme();
  const validIconSize = getValidCryptoIconSizeNative(size);

  if (currency.type === "FiatCurrency") {
    return null;
  }

  const ledgerId = currency.id;
  const ticker = currency.ticker;

  const cryptoIconElement =
    !hideNetwork && currency.type === "TokenCurrency" ? (
      <CryptoIcon
        ledgerId={ledgerId}
        ticker={ticker}
        size={validIconSize}
        backgroundColor={colors.background.main}
        network={currency.parentCurrency.id}
      />
    ) : (
      <CryptoIcon
        ledgerId={ledgerId}
        ticker={ticker}
        size={validIconSize}
        backgroundColor={colors.background.main}
      />
    );

  if (disabled) {
    return <DefaultWrapper disabled={disabled}>{cryptoIconElement}</DefaultWrapper>;
  }

  return cryptoIconElement;
};

export default memo<Props>(CurrencyIcon);
