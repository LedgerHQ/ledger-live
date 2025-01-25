import React, { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { CosmosAPI } from "@ledgerhq/coin-cosmos/api/Cosmos";
import { SubAccount } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

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
  account: CosmosAccount | SubAccount;
};

const usdcUnit: Unit = {
  name: "USDC",
  code: "USDC",
  magnitude: 6,
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const [dydxUsdcRewards, setDydxUsdcRewards] = useState(new BigNumber(0));

  useEffect(() => {
    if (account.type !== "Account") {
      return;
    }
    if (account.currency.id !== "dydx") {
      return;
    }

    const cosmosAPI = new CosmosAPI(account.currency.id);

    cosmosAPI.getUsdcRewards(account.freshAddress).then((rewards: BigNumber) => {
      setDydxUsdcRewards(rewards);
    });
  }, [account]);

  const unit = useAccountUnit(account);
  if (account.type !== "Account") return null;
  const { spendableBalance: _spendableBalance, cosmosResources } = account;
  const { delegatedBalance: _delegatedBalance, unbondingBalance: _unbondingBalance } =
    cosmosResources;
  const formatConfig = {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const spendableBalance = formatCurrencyUnit(unit, _spendableBalance, formatConfig);
  const delegatedBalance = formatCurrencyUnit(unit, _delegatedBalance, formatConfig);
  const unbondingBalance = formatCurrencyUnit(unit, _unbondingBalance, formatConfig);
  const dydxUsdcRewardsBalance = formatCurrencyUnit(usdcUnit, dydxUsdcRewards, formatConfig);

  const isDyDx = account.currency.id === "dydx";

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
      {/* FIXME: this is a hack to display USDC claimableRewards for dYdX until ibc tokens are properly handle in LL */}
      {isDyDx && (
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="account.claimableRewardsTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="account.claimableRewards" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{dydxUsdcRewardsBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>
      )}
      {_unbondingBalance.gt(0) && (
        <BalanceDetail>
          <ToolTip
            content={
              <Trans
                i18nKey="account.undelegatingTooltip"
                values={{
                  timelockInDays: 21,
                }}
              />
            }
          >
            <TitleWrapper>
              <Title>
                <Trans i18nKey="account.undelegating" />
              </Title>
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
export default AccountBalanceSummaryFooter;
