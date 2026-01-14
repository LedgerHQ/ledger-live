import React from "react";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useWithdrawableBalance } from "@ledgerhq/live-common/families/canton/react";
import { localeSelector } from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { CantonFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c40};
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

const AccountBalanceSummaryFooter: CantonFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const accounts = useSelector(accountsSelector);
  const unit = useAccountUnit(account);

  const { balance, spendableBalance: spendableBalanceFromAccount } = account;
  const lockedBalanceFromAccount = balance.minus(spendableBalanceFromAccount);
  const withdrawableBalanceFromAccount = useWithdrawableBalance(account, accounts);

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const spendableBalance = formatCurrencyUnit(unit, spendableBalanceFromAccount, formatConfig);
  const lockedBalance = formatCurrencyUnit(unit, lockedBalanceFromAccount, formatConfig);
  const withdrawableBalance = formatCurrencyUnit(
    unit,
    withdrawableBalanceFromAccount,
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
          <Discreet>{spendableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {lockedBalanceFromAccount.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="families.canton.account.lockedBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="families.canton.account.lockedBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{lockedBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {withdrawableBalanceFromAccount.gt(0) && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="families.canton.account.withdrawableBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="families.canton.account.withdrawableBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{withdrawableBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
