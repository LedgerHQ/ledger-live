import React from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getStacksStakingPosition,
  getStacksUnlockCycle,
} from "@ledgerhq/live-common/families/stacks/react";
import type { StacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
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

type Props = {
  account: StacksAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const discreet = useDiscreetMode();
  const unit = useAccountUnit(account);

  if (account.type !== "Account") return null;

  const format = (value: BigNumber) =>
    formatCurrencyUnit(unit, value, { disableRounding: true, showCode: true, discreet });

  const stakingPosition = getStacksStakingPosition(account);

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
          <Discreet>{format(account.spendableBalance)}</Discreet>
        </AmountValue>
      </BalanceDetail>
      {stakingPosition ? (
        <>
          <BalanceDetail>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="stacks.account.staked" />
              </Title>
            </TitleWrapper>
            <AmountValue>
              <Discreet>{format(stakingPosition.amount)}</Discreet>
            </AmountValue>
          </BalanceDetail>
          <BalanceDetail>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="stacks.account.unlockCycle" />
              </Title>
            </TitleWrapper>
            <AmountValue>
              <Discreet>{getStacksUnlockCycle(stakingPosition)}</Discreet>
            </AmountValue>
          </BalanceDetail>
        </>
      ) : null}
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
