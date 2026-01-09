import React from "react";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { BitcoinFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import BigNumber from "bignumber.js";
import { Currency } from "@ledgerhq/coin-bitcoin/wallet-btc/index";

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

const AccountBalanceSummaryFooter: BitcoinFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const { getFeature } = useFeatureFlags();

  const showComponent = getFeature("zcashShielded");

  if (
    account.type !== "Account" ||
    (account.currency.id as Currency) !== "zcash" ||
    !showComponent?.enabled
  )
    return null;

  // TODO: BitcoinAccount needs a new prop for private balance
  // const { spendableBalance, privateBalance } = account;
  const { spendableBalance } = account;
  const privateBalance = BigNumber(0);

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const _transparentBalance = spendableBalance ?? BigNumber(0);
  const _privateBalance = privateBalance ?? BigNumber(0);
  const _availableBalance = _transparentBalance.plus(_privateBalance);

  const transparentBalanceLabel = formatCurrencyUnit(unit, _transparentBalance, formatConfig);
  const privateBalanceLabel = formatCurrencyUnit(unit, _privateBalance, formatConfig);
  const availableBalanceLabel = formatCurrencyUnit(unit, _availableBalance, formatConfig);

  return (
    <Wrapper>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="zcash.account.availableBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="zcash.account.availableBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{availableBalanceLabel}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="zcash.account.transparentBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="zcash.account.transparentBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{transparentBalanceLabel}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="zcash.account.privateBalanceTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="zcash.account.privateBalance" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{privateBalanceLabel}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
