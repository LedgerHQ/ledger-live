import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { localeSelector } from "~/renderer/reducers/settings";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { SubAccount } from "@ledgerhq/types-live";
const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;
const BalanceDetail = styled(Box).attrs(() => ({
  flex: 1.25,
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

type Props = {
  account: TronAccount | SubAccount;
};
const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  if (account.type !== "Account") return null;
  const { tronResources } = account;
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const energy = tronResources.energy;
  const frozenBandwidthAmount = tronResources.frozen.bandwidth?.amount;
  const frozenEnergyAmount = tronResources.frozen.energy?.amount;
  const delegatedFrozenBandwidthAmount = tronResources.delegatedFrozen.bandwidth?.amount;
  const delegatedFrozenEnergyAmount = tronResources.delegatedFrozen.energy?.amount;
  const unfrozenBandwidthAmount = tronResources.unFrozen.bandwidth
    ? tronResources.unFrozen.bandwidth.reduce((accum, cur) => {
        return accum.plus(cur.amount);
      }, new BigNumber(0))
    : new BigNumber(0);
  const unfrozenEnergyAmount = tronResources.unFrozen.energy
    ? tronResources.unFrozen.energy.reduce((accum, cur) => {
        return accum.plus(cur.amount);
      }, new BigNumber(0))
    : new BigNumber(0);

  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = tronResources.bandwidth;

  const spendableBalance = formatCurrencyUnit(account.unit, account.spendableBalance, formatConfig);
  const frozenAmount = formatCurrencyUnit(
    account.unit,
    BigNumber(frozenBandwidthAmount || 0)
      .plus(BigNumber(frozenEnergyAmount || 0))
      .plus(BigNumber(delegatedFrozenBandwidthAmount || 0))
      .plus(BigNumber(delegatedFrozenEnergyAmount || 0))
      .plus(BigNumber(unfrozenBandwidthAmount))
      .plus(BigNumber(unfrozenEnergyAmount)),
    formatConfig,
  );
  const formatedEnergy = energy && energy.gt(0) ? energy : null;
  const formatedBandwidth = freeLimit.plus(gainedLimit).minus(gainedUsed).minus(freeUsed);
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
        <AmountValue>{spendableBalance}</AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.frozenAssetsTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.frozenAssets" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>{frozenAmount}</AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.bandwidthTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.bandwidth" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{`${formatedBandwidth || "–"}`}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.energyTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.energy" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{`${formatedEnergy || "–"}`}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
