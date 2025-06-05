import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text, Checkbox } from "../../../components";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";

export type SelectableAccount = {
  address: string;
  addressFormatter?: (address: string) => string;
  balance: string;
  checked: boolean;
  currency: {
    ticker: string;
    id: string;
  };
  id: string;
  name: string;
};

export type SelectableAccountItemProps = SelectableAccount & {
  onToggle: () => void;
};

const Wrapper = styled.div`
  ${withTokens(
    "spacing-s",
    "margin-s",
    "radius-s",
    // TODO review
    // "colors-surface-neutral-subtle",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
  )}
  display: flex;
  align-items: center;
  padding: var(--spacing-s);
  border-radius: var(--radius-s, 12px);
  cursor: pointer;

  &:hover {
    background-color: var(--colors-surface-transparent-hover);
  }

  &:active {
    background-color: var(--colors-surface-transparent-pressed);
  }
`;

const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: var(--margin-s);
`;

const BalanceWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-right: var(--margin-s);
`;

export const SelectableAccountItem = ({
  address,
  addressFormatter,
  balance,
  checked,
  currency,
  name,
  onToggle,
}: SelectableAccountItemProps) => (
  <Wrapper onClick={onToggle}>
    <InfoWrapper>
      <Text variant="paragraph" fontWeight="semiBold">
        {name}
      </Text>
      <Text variant="small" color="neutral.c70">
        {addressFormatter ? addressFormatter(address) : address}
      </Text>
      <CryptoIcon size="24px" ledgerId={currency.id} ticker={currency.ticker} />
    </InfoWrapper>
    <BalanceWrapper>
      <Text variant="paragraph" fontWeight="medium" style={{ whiteSpace: "nowrap" }}>
        {balance} {currency.ticker}
      </Text>
    </BalanceWrapper>
    <Checkbox name="checked" isChecked={checked} onChange={onToggle} />
  </Wrapper>
);
