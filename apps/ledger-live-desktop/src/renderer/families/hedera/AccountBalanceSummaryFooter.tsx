import React from "react";
import styled from "styled-components";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { HederaFamily } from "./types";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
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
  color: "palette.text.shade60",
}))`
  line-height: ${p => p.theme.space[4]}px;
  margin-right: ${p => p.theme.space[1]}px;
`;

const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
}))<{ paddingRight?: number }>`
  ${p => p.paddingRight && `padding-right: ${p.paddingRight}px`};
`;

const AccountBalanceSummaryFooter: HederaFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "Account" || !account.hederaResources) return null;

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const { delegation } = account.hederaResources;
  const spendableBalance = account.spendableBalance;
  const delegatedAssets = delegation ? spendableBalance : new BigNumber(0);
  const claimableRewards = delegation?.pendingReward ?? new BigNumber(0);

  const formattedAvailableBalance = formatCurrencyUnit(unit, spendableBalance, formatConfig);
  const formattedDelegatedAssets = formatCurrencyUnit(unit, delegatedAssets, formatConfig);
  const formattedClaimableRewards = formatCurrencyUnit(unit, claimableRewards, formatConfig);

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
          <Discreet>{formattedAvailableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {delegatedAssets.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="hedera.account.balanceFooter.delegated.tooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="hedera.account.balanceFooter.delegated.title" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{formattedDelegatedAssets}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {delegatedAssets.gt(0) && (
        <BalanceDetail>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="hedera.account.balanceFooter.claimable.title" />
            </Title>
          </TitleWrapper>
          <AmountValue>
            <Discreet>{formattedClaimableRewards}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
