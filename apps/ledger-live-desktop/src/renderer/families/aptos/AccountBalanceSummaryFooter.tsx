import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import BigNumber from "bignumber.js";
import { AptosFamily } from "./types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;
const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.25 0 auto",
  alignItems: "start",
}))`
  &:nth-child(n + 3) {
    flex: 0.75;
  }
`;
const TitleWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  mb: 1,
}))``;
const Title = styled(Text).attrs(() => ({
  fontSize: 4,
  ff: "Inter|Medium",
  color: "palette.text.shade60",
}))`
  line-height: ${p => p.theme.space[4]}px;
  margin-right: ${p => p.theme.space[1]}px;
`;
const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
}))``;

const AccountBalanceSummaryFooter: AptosFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const unit = useAccountUnit(account);
  const spendableBalance = account.spendableBalance;
  const delegatedAmount = account.aptosResources?.stakes?.reduce(
    (total, stake) => total + stake.stakeAccBalance,
    0,
  );

  const spendableBalanceFormatted = formatCurrencyUnit(unit, spendableBalance, {
    disableRounding: true,
    showCode: true,
  });

  const delegatedAmountFormatted = formatCurrencyUnit(unit, BigNumber(delegatedAmount), {
    disableRounding: true,
    showCode: true,
  });

  return (
    <Wrapper>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.availableBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.availableBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{spendableBalanceFormatted.toString()}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="aptos.delegation.delegatedInfoTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.delegatedAssets" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{delegatedAmountFormatted.toString()}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
