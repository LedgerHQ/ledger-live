import React from "react";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { AleoStakingPosition } from "./useStakingPosition";

type Props = {
  account: AleoAccount;
  position: AleoStakingPosition;
};

const StakingSummary = ({ account, position }: Props) => {
  const unit = useAccountUnit(account);
  const { bondedBalance, unbondingBalance, claimableBalance } = position;

  const format = (value: BigNumber) =>
    formatCurrencyUnit(unit, value, { showCode: true, disableRounding: true });

  return (
    <Wrapper>
      <Amount
        titleKey="aleo.account.stakedBalance"
        tooltipKey="aleo.account.stakedBalanceTooltip"
        value={format(bondedBalance)}
      />
      <Amount
        titleKey="aleo.account.unstakingBalance"
        tooltipKey="aleo.account.unstakingBalanceTooltip"
        value={format(unbondingBalance.minus(claimableBalance))}
      />
      <Amount
        titleKey="aleo.account.claimableBalance"
        tooltipKey="aleo.account.claimableBalanceTooltip"
        value={format(claimableBalance)}
      />
    </Wrapper>
  );
};

const Amount = ({
  titleKey,
  tooltipKey,
  value,
}: {
  titleKey: string;
  tooltipKey: string;
  value: string;
}) => (
  <Cell>
    <ToolTip content={<Trans i18nKey={tooltipKey} />}>
      <TitleWrapper>
        <Title>
          <Trans i18nKey={titleKey} />
        </Title>
        <InfoCircle size={13} />
      </TitleWrapper>
    </ToolTip>
    <Value>
      <Discreet>{value}</Discreet>
    </Value>
  </Cell>
);

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  px: 20,
  py: 4,
}))`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
`;

const Cell = styled(Box).attrs(() => ({
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
  fontSize: 3,
  ff: "Inter|Medium",
  color: "neutral.c70",
}))`
  margin-right: ${p => p.theme.space[1]}px;
`;

const Value = styled(Text).attrs(() => ({
  fontSize: 5,
  ff: "Inter|SemiBold",
  color: "neutral.c100",
}))``;

export default StakingSummary;
