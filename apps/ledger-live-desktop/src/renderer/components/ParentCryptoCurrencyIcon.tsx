import React from "react";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { rgba } from "~/renderer/styles/helpers";
import Tooltip from "~/renderer/components/Tooltip";
import Text from "~/renderer/components/Text";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";

type ParentCryptoCurrencyIconWrapperProps = {
  doubleIcon?: boolean;
  bigger?: boolean;
  flat?: boolean;
  children: React.ReactNode;
};

const ParentCryptoCurrencyIconWrapper: React.ComponentType<ParentCryptoCurrencyIconWrapperProps> = styled.div`
  ${(p: ParentCryptoCurrencyIconWrapperProps) =>
    p.doubleIcon && !p.flat
      ? `
        padding-right: 10px;
        > :nth-child(2) {
            position: absolute;
            bottom: -8px;
            left: 8px;
            border: 2px solid transparent;
        }
      `
      : `
    display: flex;
    align-items: center;
  `}
  position: relative;
  line-height: ${p => (p.bigger ? "18px" : "18px")};
  font-size: 12px;
  max-height: 25px;
`;
const TooltipWrapper = styled.div`
  display: flex;
  max-width: 150px;
  flex-direction: column;
`;
const CryptoCurrencyIconTooltip = withTheme(
  ({ name, theme }: { theme: DefaultTheme; name: string }) => {
    const { t } = useTranslation();
    return (
      <TooltipWrapper>
        <Text color={rgba(theme.colors.palette.background.paper, 0.5)}>
          {t("tokensList.tooltip")}
        </Text>
        <Text>{name}</Text>
      </TooltipWrapper>
    );
  },
);
type Props = {
  currency: Currency;
  withTooltip?: boolean;
  bigger?: boolean;
  flat?: boolean;
};
const ParentCryptoCurrencyIcon = ({ currency, withTooltip, bigger, flat = false }: Props) => {
  // Only handle crypto currencies, not fiat
  if (currency.type === "FiatCurrency") {
    return null;
  }

  const parent = currency.type === "TokenCurrency" ? currency.parentCurrency : null;

  // Use CryptoIcon directly to avoid nesting issues
  const iconSize = bigger ? 28 : 22; // Match list mode size (28px) and increase default
  const ledgerId = currency.id;
  const ticker = currency.ticker;
  const network = currency.type === "TokenCurrency" ? currency.parentCurrency.id : undefined;

  const content = (
    <ParentCryptoCurrencyIconWrapper doubleIcon={false} bigger={bigger} flat={flat}>
      <CryptoIcon
        ledgerId={ledgerId}
        ticker={ticker}
        size={getValidCryptoIconSize(iconSize)}
        network={network}
      />
    </ParentCryptoCurrencyIconWrapper>
  );

  if (withTooltip && parent) {
    return <Tooltip content={<CryptoCurrencyIconTooltip name={parent.name} />}>{content}</Tooltip>;
  }
  return content;
};
export default ParentCryptoCurrencyIcon;
