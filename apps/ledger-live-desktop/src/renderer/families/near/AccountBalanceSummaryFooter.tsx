import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/live-common/types/index";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
const Wrapper: ThemedComponent<any> = styled(Box).attrs(() => ({
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
  vertical: true,
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
}))`
  ${p => p.paddingRight && `padding-right: ${p.paddingRight}px`};
`;
type Props = {
  account: Account;
  countervalue: any;
};
const AccountBalanceSummaryFooter = ({ account, countervalue }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const {
    spendableBalance: _spendableBalance,
    nearResources: {
      stakedBalance: _stakedBalance,
      storageUsageBalance: _storageUsageBalance,
      availableBalance: _availableBalance,
      pendingBalance: _pendingBalance,
    },
  } = account;
  const unit = getAccountUnit(account);
  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const spendableBalance = formatCurrencyUnit(unit, _spendableBalance, formatConfig);
  const stakedBalance = formatCurrencyUnit(unit, _stakedBalance, formatConfig);
  const storageUsageBalance = formatCurrencyUnit(unit, _storageUsageBalance, formatConfig);
  const availableBalance = formatCurrencyUnit(unit, _availableBalance, formatConfig);
  const pendingBalance = formatCurrencyUnit(unit, _pendingBalance, formatConfig);
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
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="near.account.storageUsageBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="near.account.storageUsageBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{storageUsageBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {_stakedBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="near.account.stakedBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="near.account.stakedBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{stakedBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {_pendingBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="near.account.pendingBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="near.account.pendingBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{pendingBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {_availableBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="near.account.availableBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="near.account.availableBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{availableBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
    </Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
