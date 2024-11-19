import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import React from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { localeSelector } from "~/renderer/reducers/settings";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
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

type Props = {
  account: AptosAccount | SubAccount;
};
const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  if (account.type !== "Account") return null;
  const { spendableBalance: _spendableBalance, delegatedAmount: _delegatedAmount } = account;
  const unit = account.currency.units[0];
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const spendableBalance = formatCurrencyUnit(unit, _spendableBalance, formatConfig);
  const delegatedAmount = formatCurrencyUnit(unit, _delegatedAmount, formatConfig);

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
        <ToolTip content={<Trans i18nKey="aptos.delegation.delegatedInfoTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.delegatedAssets" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{delegatedAmount}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
