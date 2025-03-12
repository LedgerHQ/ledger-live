import React from "react";
import styled, { useTheme } from "styled-components";
import { Trans } from "react-i18next";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import Tooltip from "~/renderer/components/Tooltip";
import CryptoCurrencyIcon, { TokenIconWrapper, TokenIcon } from "./CryptoCurrencyIcon";

type Props = {
  currency: Currency;
  count: number;
  withTooltip?: boolean;
  bigger?: boolean;
  inactive?: boolean;
};

const Wrapper = styled.div<{
  doubleIcon?: boolean;
  bigger?: boolean;
}>`
  ${p =>
    p.doubleIcon
      ? `
        padding-right: 10px;
        > :nth-child(2) {
            position: absolute;
            bottom: -10px;
            left: 2px;
            border: 2px solid transparent;
        }
      `
      : `
    display: flex;
    align-items: center;
  `}
  position: relative;

  line-height: ${p => (p.bigger ? "18px" : "18px")};
  font-size: ${p => (p.bigger ? "12px" : "12px")};

  > :nth-child(2) {
    margin-top: ${p => (p.bigger ? "-14px" : "-12px")};
    margin-left: ${p => (p.bigger ? "10px" : "8px")};
  }
`;

const CryptoCurrencyIconWithCount = ({ currency, bigger, withTooltip, inactive, count }: Props) => {
  const cuscount = 15;
  const theme = useTheme();
  const color = inactive
    ? theme.colors.palette.text.shade60
    : getCurrencyColor(currency, theme.colors.palette.background.paper);
  const size = bigger ? 20 : 16;
  const fontSize = size / 2 + (cuscount < 10 ? 2 : cuscount >= 100 ? -2 : 0);
  const content = (
    <Wrapper doubleIcon={true} bigger={bigger}>
      <CryptoCurrencyIcon inactive={inactive} currency={currency} size={size} />
      {true && (
        <TokenIconWrapper>
          <TokenIcon color={color} size={size} fontSize={fontSize}>
            {`+${cuscount}`}
          </TokenIcon>
        </TokenIconWrapper>
      )}
    </Wrapper>
  );
  const isToken =
    currency.type === "CryptoCurrency" && listTokenTypesForCryptoCurrency(currency).length > 0;
  if (withTooltip && count > 0) {
    return (
      <Tooltip
        content={
          <Trans
            i18nKey={isToken ? "tokensList.countTooltip" : "subAccounts.countTooltip"}
            count={count}
            values={{
              count,
            }}
          />
        }
      >
        {content}
      </Tooltip>
    );
  }
  return content;
};

export default React.memo(CryptoCurrencyIconWithCount);
