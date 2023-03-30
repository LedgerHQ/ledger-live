import React from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { withdrawableBalance } from "@ledgerhq/live-common/families/celo/logic";
import * as S from "./AccountBalanceSummaryFooter.styles";
type Props = {
  account: any;
  countervalue: any;
};
const AccountBalanceSummaryFooter = ({ account, countervalue }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  if (!account.celoResources) return null;
  const { spendableBalance, celoResources } = account;
  const { lockedBalance, nonvotingLockedBalance } = celoResources;
  const withdrawableBalanceAmount = withdrawableBalance(account);
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const formattedSpendableBalance = formatCurrencyUnit(unit, spendableBalance, formatConfig);
  const formattedLockedBalance = formatCurrencyUnit(unit, lockedBalance, formatConfig);
  const formattedNonvotingLockedBalance = formatCurrencyUnit(
    unit,
    nonvotingLockedBalance,
    formatConfig,
  );
  const formattedWithdrawableBalance = formatCurrencyUnit(
    unit,
    withdrawableBalanceAmount,
    formatConfig,
  );
  return (
    <S.Wrapper>
      <S.BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.availableBalanceTooltip" />}>
          <S.TitleWrapper>
            <S.Title>
              <Trans i18nKey="account.availableBalance" />
            </S.Title>
            <InfoCircle size={13} />
          </S.TitleWrapper>
        </ToolTip>
        <S.AmountValue>
          <Discreet>{formattedSpendableBalance}</Discreet>
        </S.AmountValue>
      </S.BalanceDetail>
      <S.BalanceDetail>
        <ToolTip content={<Trans i18nKey="celo.lockedTooltip" />}>
          <S.TitleWrapper>
            <S.Title>
              <Trans i18nKey="celo.lockedBalance" />
            </S.Title>
            <InfoCircle size={13} />
          </S.TitleWrapper>
        </ToolTip>
        <S.AmountValue>
          <Discreet>{formattedLockedBalance}</Discreet>
        </S.AmountValue>
      </S.BalanceDetail>
      <S.BalanceDetail>
        <ToolTip content={<Trans i18nKey="celo.nonvotingLockedTooltip" />}>
          <S.TitleWrapper>
            <S.Title>
              <Trans i18nKey="celo.nonvotingLockedBalance" />
            </S.Title>
            <InfoCircle size={13} />
          </S.TitleWrapper>
        </ToolTip>
        <S.AmountValue>
          <Discreet>{formattedNonvotingLockedBalance}</Discreet>
        </S.AmountValue>
      </S.BalanceDetail>
      <S.BalanceDetail>
        <ToolTip content={<Trans i18nKey="celo.withdrawableTooltip" />}>
          <S.TitleWrapper>
            <S.Title>
              <Trans i18nKey="celo.withdrawableBalance" />
            </S.Title>
            <InfoCircle size={13} />
          </S.TitleWrapper>
        </ToolTip>
        <S.AmountValue>
          <Discreet>{formattedWithdrawableBalance}</Discreet>
        </S.AmountValue>
      </S.BalanceDetail>
    </S.Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
