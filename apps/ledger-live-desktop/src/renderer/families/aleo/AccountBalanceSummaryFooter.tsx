import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

interface Props {
  account: AleoAccount | TokenAccount;
}

const AccountBalanceSummaryFooter = ({ account }: Readonly<Props>) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "Account") {
    return null;
  }

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const spendableBalance = account.spendableBalance;
  const transparentBalance = account.aleoResources.transparentBalance;
  const privateBalance = account.aleoResources.privateBalance;

  const formattedAvailableBalance = formatCurrencyUnit(unit, spendableBalance, formatConfig);
  const formattedTransparentBalance = formatCurrencyUnit(unit, transparentBalance, formatConfig);
  const formattedPrivateBalance = privateBalance
    ? formatCurrencyUnit(unit, privateBalance, formatConfig)
    : "***";

  return (
    <Wrapper>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="aleo.account.availableBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="aleo.account.availableBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formattedAvailableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="aleo.account.transparentBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="aleo.account.transparentBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formattedTransparentBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="aleo.account.privateBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="aleo.account.privateBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formattedPrivateBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
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
