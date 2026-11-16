import React from "react";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { localeSelector } from "~/renderer/reducers/settings";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountData } from "@features/platform-account-data";
import { useLegacyAccountDescriptor } from "~/renderer/hooks/useLegacyAccountDescriptor";
import { selectAccountBalances } from "@domain/entity-account-balance";
import { selectTronAvailableBandwidth, selectTronResources } from "@domain/entity-account-tron";
import type { State } from "~/renderer/reducers";
const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;
const BalanceDetail = styled(Box).attrs(() => ({
  flex: 1.25,
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
  account: TronAccount | TokenAccount;
};
const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);

  const unit = useMaybeAccountUnit(account);
  const { accountUUID, descriptor } = useLegacyAccountDescriptor(account.id);
  useAccountData("balance", descriptor);
  useAccountData("tron:resources", descriptor);
  const nativeBalance = useSelector((state: State) =>
    accountUUID && account.type === "Account"
      ? selectAccountBalances(state, accountUUID)?.find(row => row.assetId === account.currency.id)
      : undefined,
  );
  const resources = useSelector((state: State) =>
    accountUUID ? selectTronResources(state, accountUUID) : undefined,
  );
  const availableBandwidth = useSelector((state: State) =>
    accountUUID ? selectTronAvailableBandwidth(state, accountUUID) : undefined,
  );

  if (account.type !== "Account" || !unit) return null;
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const spendableBalance = formatCurrencyUnit(unit, account.spendableBalance, formatConfig);
  const frozenAmount = nativeBalance
    ? formatCurrencyUnit(
        unit,
        (nativeBalance.locked ?? []).reduce(
          (sum, { amount }) => sum.plus(amount),
          new BigNumber(0),
        ),
        formatConfig,
      )
    : "–";
  const formatedEnergy = resources && BigInt(resources.energy) > 0n ? resources.energy : null;
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
        <AmountValue>{spendableBalance}</AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.frozenAssetsTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.frozenAssets" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>{frozenAmount}</AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.bandwidthTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.bandwidth" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{availableBandwidth ?? "–"}</Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="account.energyTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="account.energy" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>{formatedEnergy ?? "–"}</Discreet>
        </AmountValue>
      </BalanceDetail>
    </Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
