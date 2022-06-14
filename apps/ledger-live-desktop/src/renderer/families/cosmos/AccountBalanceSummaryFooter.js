// @flow

import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";

import { useTranslation } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

import { localeSelector } from "~/renderer/reducers/settings";

import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";

import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";

const Wrapper: ThemedComponent<*> = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.25 0 auto",
  vertical: true,
  alignItems: "start",
}))`
  &:nth-child(n + 3) {
    flex: 0.75;
  }
`;

const TitleWrapper = styled(Box).attrs(() => ({ horizontal: true, alignItems: "center", mb: 1 }))``;

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

export const AccountBalanceSummaryFooterComponent = ({
  spendableBalance,
  delegatedBalance,
  unbondingBalance,
  hasUnbondingBalance,
  localizations,
}: {
  spendableBalance: any,
  delegatedBalance: any,
  unbondingBalance: any,
  hasUnbondingBalance?: boolean,
  localizations: {
    availableBalanceTooltip: string,
    availableBalance: string,
    delegatedAssetsTooltip: string,
    delegatedAssets: string,
    undelegatedAssetsTooltip: string,
    undelegatedAssets: string,
  },
}) => {
  return (
    <Wrapper>
      <BalanceDetail>
        <ToolTip content={localizations.availableBalanceTooltip}>
          <TitleWrapper>
            <Title>{localizations.availableBalance}</Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{spendableBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={localizations.delegatedAssetsTooltip}>
          <TitleWrapper>
            <Title>{localizations.delegatedAssets}</Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{delegatedBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {hasUnbondingBalance && (
        <BalanceDetail>
          <ToolTip content={localizations.undelegatedAssetsTooltip}>
            <TitleWrapper>
              <Title>{localizations.undelegatedAssets}</Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{unbondingBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
    </Wrapper>
  );
};

type Props = {
  account: any,
  countervalue: any,
};

const AccountBalanceSummaryFooter = ({ account, countervalue }: Props) => {
  const { t } = useTranslation();
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  if (!account.cosmosResources) return null;

  const { spendableBalance: _spendableBalance, cosmosResources } = account;
  const {
    delegatedBalance: _delegatedBalance,
    unbondingBalance: _unbondingBalance,
  } = cosmosResources;

  const unit = getAccountUnit(account);

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const spendableBalance = formatCurrencyUnit(unit, _spendableBalance, formatConfig);

  const delegatedBalance = formatCurrencyUnit(unit, _delegatedBalance, formatConfig);

  const unbondingBalance = formatCurrencyUnit(unit, _unbondingBalance, formatConfig);

  return (
    <AccountBalanceSummaryFooterComponent
      spendableBalance={spendableBalance}
      delegatedBalance={delegatedBalance}
      unbondingBalance={unbondingBalance}
      hasUnbondingBalance={_unbondingBalance.gt(0)}
      localizations={{
        availableBalanceTooltip: t("account.availableBalanceTooltip"),
        availableBalance: t("account.availableBalance"),
        delegatedAssetsTooltip: t("account.cosmosDelegatedTooltip"),
        delegatedAssets: t("account.delegatedAssets"),
        undelegatedAssetsTooltip: t("account.cosmosUndelegatingTooltip"),
        undelegatedAssets: t("account.undelegating"),
      }}
    />
  );
};

export default AccountBalanceSummaryFooter;
