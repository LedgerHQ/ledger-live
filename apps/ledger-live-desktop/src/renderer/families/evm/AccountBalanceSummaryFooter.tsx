import React from "react";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useAccountSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { CryptoCurrencyId, Currency } from "@ledgerhq/types-cryptoassets";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { PlaceholderLine } from "~/renderer/components/BalanceInfos/Placeholder";
import { TokenAccount, Account } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

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
  account: Account | TokenAccount;
  counterValue: Currency;
  discreetMode: boolean;
};

const AccountBalanceSummaryFooter = ({
  account,
  counterValue: _counterValue,
  discreetMode: _discreetMode,
}: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const { enabled: isEvmNativeStakingEnabled, params } = useFeature("evmNativeStaking") ?? {};
  const { pending: isSyncing } = useAccountSyncState({ accountId: account.id });

  if (account.type !== "Account") return null;

  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(account.currency.id as CryptoCurrencyId) || false;

  if (!isEvmNativeStakingEnabled || !isCurrencySupported) return null;

  if (!isStakingAccount(account)) {
    if (!isSyncing) return null;
    return (
      <Wrapper>
        <BalanceDetail>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.availableBalance" />
            </Title>
          </TitleWrapper>
          <PlaceholderLine width={80} height={14} />
        </BalanceDetail>
        <BalanceDetail>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.delegatedAssets" />
            </Title>
          </TitleWrapper>
          <PlaceholderLine width={80} height={14} />
        </BalanceDetail>
      </Wrapper>
    );
  }

  const formatConfig = {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const spendableBalance = formatCurrencyUnit(unit, account.spendableBalance, formatConfig);
  const delegatedBalance = formatCurrencyUnit(
    unit,
    account.stakingResources.delegatedBalance,
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
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.delegatedTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.delegatedAssets" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{delegatedBalance}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
