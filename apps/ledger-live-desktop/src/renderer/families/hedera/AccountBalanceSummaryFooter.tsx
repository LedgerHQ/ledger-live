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
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useStake } from "LLD/hooks/useStake";
import type { HederaFamily } from "./types";

const AccountBalanceSummaryFooter: HederaFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const { getCanStakeCurrency } = useStake();

  if (account.type !== "Account" || !account.hederaResources) {
    return null;
  }

  const isStakingEnabled = getCanStakeCurrency(account.currency.id);

  if (!isStakingEnabled) {
    return null;
  }

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const { delegation } = account.hederaResources;
  const spendableBalance = account.spendableBalance;
  const delegatedAssets = delegation?.delegated ?? new BigNumber(0);
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
      {delegation && (
        <>
          <BalanceDetail>
            <ToolTip content={<Trans i18nKey="hedera.account.balanceFooter.delegated.tooltip" />}>
              <TitleWrapper>
                <Title>
                  <Trans i18nKey="account.delegatedAssets" />
                </Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{formattedDelegatedAssets}</Discreet>
            </AmountValue>
          </BalanceDetail>
          <BalanceDetail>
            <ToolTip content={<Trans i18nKey="hedera.account.balanceFooter.claimable.tooltip" />}>
              <TitleWrapper>
                <Title>
                  <Trans i18nKey="account.claimableRewards" />
                </Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{formattedClaimableRewards}</Discreet>
            </AmountValue>
          </BalanceDetail>
        </>
      )}
    </Wrapper>
  );
};

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

export default AccountBalanceSummaryFooter;
