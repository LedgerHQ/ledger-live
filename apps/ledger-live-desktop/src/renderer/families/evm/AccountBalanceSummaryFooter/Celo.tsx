import React, { memo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { withdrawableBalance } from "@ledgerhq/coin-evm/currencyHelpers/celo";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import { EvmFamily } from "../types";

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

const AccountBalanceSummaryFooter: EvmFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  if (account.type !== "Account" || !account.evmResources) return null;
  const { spendableBalance, evmResources } = account;
  const { lockedBalance, nonvotingLockedBalance } = evmResources;
  const withdrawableBalanceAmount = withdrawableBalance(account);

  const formatConfig = {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const formattedSpendableBalance = formatCurrencyUnit(unit, spendableBalance, formatConfig);
  const formattedLockedBalance = formatCurrencyUnit(unit, lockedBalance, formatConfig);
  const formattedNonvotingLockedBalance = formatCurrencyUnit(
    unit,
    nonvotingLockedBalance,
    formatConfig,
  );
  const formattedWithdrawableBalance = formatCurrencyUnit(
    unit,
    withdrawableBalanceAmount,
    formatConfig,
  );
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
          <Discreet>{formattedSpendableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="celo.lockedTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="celo.lockedBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formattedLockedBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="celo.nonvotingLockedTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="celo.nonvotingLockedBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formattedNonvotingLockedBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="celo.withdrawableTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="celo.withdrawableBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formattedWithdrawableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};
export default memo(AccountBalanceSummaryFooter);
