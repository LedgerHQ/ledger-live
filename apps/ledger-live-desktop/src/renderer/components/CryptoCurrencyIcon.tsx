import React from "react";
import styled from "styled-components";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CryptoIcon } from "@ledgerhq/react-ui/pre-ldls";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";

type Props = {
  currency: Currency;
  size: number;
};

// Container for the new CryptoIcon component
const Container = styled.div<{ size: number }>`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const CryptoCurrencyIcon = ({ currency, size }: Props) => {
  if (currency.type === "FiatCurrency") {
    return null;
  }

  const ledgerId = currency.id;
  const ticker = currency.ticker;
  const iconSize = size;
  const validSize = getValidCryptoIconSize(iconSize);

  return (
    <Container size={size}>
      {currency.type === "TokenCurrency" ? (
        <CryptoIcon
          ledgerId={ledgerId}
          ticker={ticker}
          size={validSize}
          network={currency.parentCurrency.id}
        />
      ) : (
        <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} />
      )}
    </Container>
  );
};

export default CryptoCurrencyIcon;
