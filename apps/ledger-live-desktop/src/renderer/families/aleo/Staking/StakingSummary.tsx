import React from "react";
import { Trans, useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  account: AleoAccount;
  position: AleoStakingPositionView;
};

const StakingSummary = ({ account, position }: Props) => {
  const unit = useAccountUnit(account);
  const { bondedBalance, unstakingBalance, claimableBalance } = position;

  const format = (value: BigNumber) =>
    formatCurrencyUnit(unit, value, { showCode: true, disableRounding: true });

  return (
    <Wrapper>
      <Amount
        titleKey="aleo.stake.stakedBalance"
        tooltipKey="aleo.stake.stakedBalanceTooltip"
        value={format(bondedBalance)}
        testId="aleo-staked-balance"
      />
      <Amount
        titleKey="aleo.stake.unstakingBalance"
        tooltipKey="aleo.stake.unstakingBalanceTooltip"
        value={format(unstakingBalance)}
        testId="aleo-unstaking-balance"
      />
      <Amount
        titleKey="aleo.stake.claimableBalance"
        tooltipKey="aleo.stake.claimableBalanceTooltip"
        value={format(claimableBalance)}
        testId="aleo-claimable-balance"
      />
    </Wrapper>
  );
};

const Amount = ({
  titleKey,
  tooltipKey,
  value,
  testId,
}: {
  titleKey: string;
  tooltipKey: string;
  value: string;
  testId: string;
}) => {
  const { t } = useTranslation();

  return (
    <Cell data-testid={testId}>
      <ToolTip content={t(tooltipKey)}>
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
};

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
