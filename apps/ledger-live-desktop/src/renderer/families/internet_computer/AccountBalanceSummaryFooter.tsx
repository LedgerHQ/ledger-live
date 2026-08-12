import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import {
  useTotalMaturity,
  useTotalStaked,
} from "@ledgerhq/live-common/families/internet_computer/react";
import { useSelector } from "LLD/hooks/redux";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { localeSelector } from "~/renderer/reducers/settings";
import type { TokenAccount } from "@ledgerhq/types-live";

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
}))``;

// Split out so the neuron hooks run unconditionally against a narrowed ICPAccount: the family slot
// is typed `ICPAccount | TokenAccount`, and narrowing in the caller would make the hooks conditional.
const Footer = ({ account }: { account: ICPAccount }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const totalStaked = useTotalStaked(account);
  const totalMaturity = useTotalMaturity(account);

  if (totalStaked.isZero() && totalMaturity.isZero()) return null;

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  return (
    <Wrapper>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="internetComputer.summaryFooter.stakedBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="internetComputer.summaryFooter.stakedBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue data-testid="icp-staked-balance">
          <Discreet>{formatCurrencyUnit(unit, totalStaked, formatConfig)}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="internetComputer.summaryFooter.totalMaturityTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="internetComputer.summaryFooter.totalMaturity" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue data-testid="icp-total-maturity">
          <Discreet>{formatCurrencyUnit(unit, totalMaturity, formatConfig)}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};

type Props = {
  account: ICPAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) =>
  account.type === "Account" ? <Footer account={account} /> : null;

export default AccountBalanceSummaryFooter;
