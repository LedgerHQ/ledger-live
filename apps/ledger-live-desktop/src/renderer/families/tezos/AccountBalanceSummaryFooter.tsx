import React from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@features/platform-feature-flags";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import type { TokenAccount } from "@ledgerhq/types-live";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
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
}))``;

type Props = {
  account: TezosAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const stakingEnabled = !!useFeature("lldTezosStaking")?.enabled;
  const {
    isDelegated,
    isStaked,
    stakedBalance,
    unstakedBalance,
    unstakedFinalizable,
    availableBalance: delegatedAmount,
  } = useTezosStakingInfo(account);

  if (account.type !== "Account") return null;

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const format = (value: BigNumber) => formatCurrencyUnit(unit, value, formatConfig);

  const showStaked = stakingEnabled && isStaked;
  const showPending = stakingEnabled && unstakedBalance.gt(0);
  const showWithdrawable = stakingEnabled && unstakedFinalizable.gt(0);

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
          <Discreet>{format(account.spendableBalance)}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {isDelegated && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="tezos.account.delegatedAssetsTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="account.delegatedAssets" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{format(delegatedAmount)}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {showStaked && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="tezos.account.stakedAssetsTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="tezos.account.stakedAssets" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{format(stakedBalance)}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {showPending && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="tezos.account.pendingWithdrawableTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="tezos.account.pendingWithdrawable" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{format(unstakedBalance)}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {showWithdrawable && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="tezos.account.withdrawableAssetsTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="tezos.account.withdrawableAssets" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{format(unstakedFinalizable)}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
