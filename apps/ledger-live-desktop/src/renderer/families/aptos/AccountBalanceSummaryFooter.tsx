import React from "react";
import styled from "styled-components";
import BigNumber from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { AptosFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getEnv } from "@ledgerhq/live-env";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.25 0 auto",
  alignItems: "start",
  paddingRight: 20,
}))``;

const TitleWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  mb: 1,
}))``;

const Title = styled(Text).attrs(() => ({
  fontSize: 4,
  ff: "Inter|Medium",
  color: "neutral.c70",
}))`
  line-height: ${p => p.theme.space[4]}px;
  margin-right: ${p => p.theme.space[1]}px;
`;

const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "neutral.c100",
}))<{ paddingRight?: number }>`
  ${p => p.paddingRight && `padding-right: ${p.paddingRight}px`};
`;

const AccountBalanceSummaryFooter: AptosFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "Account" || getEnv("APTOS_ENABLE_STAKING") === false) return null;

  const { spendableBalance: _spendableBalance, aptosResources } = account;

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const _activeBalance = aptosResources?.activeBalance || BigNumber(0);
  const _inactiveBalance = aptosResources?.inactiveBalance || BigNumber(0);
  const _pendingInactiveBalance = aptosResources?.pendingInactiveBalance || BigNumber(0);

  const spendableBalance = formatCurrencyUnit(unit, _spendableBalance, formatConfig);
  const activeBalance = formatCurrencyUnit(unit, _activeBalance, formatConfig);
  const inactiveBalance = formatCurrencyUnit(unit, _inactiveBalance, formatConfig);
  const pendingInactiveBalance = formatCurrencyUnit(unit, _pendingInactiveBalance, formatConfig);

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
          <Discreet>{spendableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {_activeBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="aptos.account.stakedBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="aptos.account.stakedBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{activeBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {_pendingInactiveBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="aptos.account.pendingBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="aptos.account.pendingBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{pendingInactiveBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {_inactiveBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="aptos.account.withdrawableBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="aptos.account.withdrawableBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{inactiveBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
