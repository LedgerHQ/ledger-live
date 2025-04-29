import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Tooltip from "~/renderer/components/Tooltip";
import CryptoCurrencyIcon from "./CryptoCurrencyIcon";
import { Flex } from "@ledgerhq/react-ui/index";

type Props = {
  currency: Currency;
  count: number;
  withTooltip?: boolean;
  inactive?: boolean;
};

const CryptoCurrencyIconWithCount = ({ currency, withTooltip, inactive, count }: Props) => {
  const content = (
    <Wrapper>
      <CryptoCurrencyIcon circle currency={currency} size={32} inactive={inactive} />
      {count > 0 && <Chip>{`+${count}`}</Chip>}
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
              nbCount: count,
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

const Chip = styled(Flex)`
  color: ${p => p.theme.colors.neutral.c100};
  background-color: ${p => p.theme.colors.neutral.c50};
  align-items: center;
  justify-content: center;

  font-size: 8px;
  font-weight: 700;

  border-radius: 80px;
  padding-right: 4px;
  padding-left: 4px;
  gap: 8px;

  position: absolute;
  left: 20px;
  top: 19px;

  border: 2px solid var(--color);
`;

const Wrapper = styled.div`
  position: relative;
`;
