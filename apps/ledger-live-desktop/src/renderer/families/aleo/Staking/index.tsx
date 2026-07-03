import React, { useCallback } from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getClaimableStakingBalance } from "@ledgerhq/live-common/families/aleo/utils";
import { useAleoLiveBlockHeight } from "../hooks/useAleoLiveBlockHeight";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { openModal } from "~/renderer/actions/modals";
import { openURL } from "~/renderer/linking";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Discreet from "~/renderer/components/Discreet";
import ToolTip from "~/renderer/components/Tooltip";
import IconChartLine from "~/renderer/icons/ChartLine";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";

const EmptyStateWrapper = styled(Box).attrs(() => ({ p: 3 }))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const ManageLink = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "primary.c80",
  fontSize: 3,
}))`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ValidatorLineWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  px: 20,
  py: 3,
}))`
  gap: 8px;
`;

const ValidatorLabel = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c70",
  fontSize: 2,
}))`
  text-transform: uppercase;
`;

const ValidatorAddress = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c100",
  fontSize: 3,
}))`
  cursor: pointer;
  word-break: break-all;
  &:hover {
    color: ${p => p.theme.colors.primary.c80};
  }
`;

const CardGrid = styled(Box).attrs(() => ({
  horizontal: true,
  p: 20,
}))`
  gap: 16px;
  align-items: stretch;
`;

const Card = styled(Box).attrs(() => ({
  p: 20,
  flex: 1,
}))`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: ${p => p.theme.radii[1]}px;
`;

const Dot = styled(Box).attrs<{ bg: string }>(p => ({ bg: p.bg }))<{ bg: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const CardLabel = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c80",
  fontSize: 3,
}))``;

const CardAmount = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c100",
  fontSize: 6,
}))``;

const CardSubLine = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  color: "neutral.c70",
  fontSize: 2,
}))``;

const GreenButton = styled(Button)`
  background-color: ${p => p.theme.colors.success.c50};
  color: ${p => p.theme.colors.neutral.c00};
  &:hover {
    background-color: ${p => p.theme.colors.success.c60};
  }
  &:disabled {
    background-color: ${p => p.theme.colors.opacityDefault.c10};
    color: ${p => p.theme.colors.opacityDefault.c20};
  }
`;

const StakingCard = ({
  dotColor,
  label,
  amount,
  subLine,
  button,
}: {
  dotColor: string;
  label: React.ReactNode;
  amount: React.ReactNode;
  subLine?: React.ReactNode;
  button: React.ReactNode;
}) => (
  <Card>
    <Box horizontal alignItems="center" mb={2} style={{ gap: 8 }}>
      <Dot bg={dotColor} />
      <CardLabel>{label}</CardLabel>
    </Box>
    <CardAmount>{amount}</CardAmount>
    {subLine ? <Box mt={1}>{subLine}</Box> : null}
    <Box mt={3} alignItems="flex-start">
      {button}
    </Box>
  </Card>
);

const Staking = ({ account }: { account: AleoAccount }) => {
  const dispatch = useDispatch();
  const unit = useAccountUnit(account);

  const bondedBalance = account.aleoResources?.bondedBalance ?? new BigNumber(0);
  const bondedValidator = account.aleoResources?.bondedValidator ?? null;
  const unbondingBalance = account.aleoResources?.unbondingBalance ?? new BigNumber(0);
  const unbondingHeight = account.aleoResources?.unbondingHeight ?? null;
  const claimable = getClaimableStakingBalance(account);
  const isClaimable = claimable.gt(0);
  const hasBonded = bondedBalance.gt(0);
  const hasUnbonding = unbondingBalance.gt(0);

  // Poll the live block height so the countdown stays fresh between account syncs,
  // but only while an unstaking countdown is actually visible.
  const isCountingDown =
    hasUnbonding &&
    !isClaimable &&
    unbondingHeight != null &&
    unbondingHeight > account.blockHeight;
  const currentHeight = useAleoLiveBlockHeight(account.currency, {
    fallbackHeight: account.blockHeight,
    enabled: isCountingDown,
  });
  const blocksLeft = unbondingHeight != null ? Math.max(0, unbondingHeight - currentHeight) : null;
  const hasPosition = hasBonded || hasUnbonding;

  const formatAmount = (value: BigNumber) =>
    formatCurrencyUnit(unit, value, { showCode: true, disableRounding: true });

  const onManage = useCallback(() => {
    dispatch(openModal("MODAL_ALEO_MANAGE", { account }));
  }, [account, dispatch]);
  const onEarnRewards = useCallback(() => {
    dispatch(openModal("MODAL_ALEO_BOND_PUBLIC", { account }));
  }, [account, dispatch]);
  const onUnstake = useCallback(() => {
    dispatch(openModal("MODAL_ALEO_UNBOND", { account }));
  }, [account, dispatch]);
  const onClaim = useCallback(() => {
    dispatch(openModal("MODAL_ALEO_CLAIM_UNBOND", { account }));
  }, [account, dispatch]);
  const onValidatorClick = useCallback(() => {
    if (!bondedValidator) return;
    const explorerView = getDefaultExplorerView(account.currency);
    const url = explorerView && getAddressExplorer(explorerView, bondedValidator);
    if (url) openURL(url);
  }, [account.currency, bondedValidator]);

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="aleo.stake.table.header" />}
        titleProps={{ "data-e2e": "title_Staking" }}
      >
        {hasPosition ? (
          <ManageLink id="account-manage-staking-button" onClick={onManage}>
            <Trans i18nKey="aleo.stake.table.manage" />
          </ManageLink>
        ) : null}
      </TableHeader>
      {hasPosition ? (
        <>
          {bondedValidator ? (
            <ValidatorLineWrapper>
              <ValidatorLabel>
                <Trans i18nKey="aleo.stake.table.validator" />
              </ValidatorLabel>
              <ValidatorAddress onClick={onValidatorClick}>{bondedValidator}</ValidatorAddress>
            </ValidatorLineWrapper>
          ) : null}
          <CardGrid>
            {hasBonded ? (
              <StakingCard
                dotColor="primary.c80"
                label={<Trans i18nKey="aleo.stake.status.staked" />}
                amount={<Discreet>{formatAmount(bondedBalance)}</Discreet>}
                button={
                  <Button small outlineGrey onClick={onUnstake}>
                    <Trans i18nKey="aleo.stake.unstake" />
                  </Button>
                }
              />
            ) : null}
            {hasUnbonding ? (
              isClaimable ? (
                <StakingCard
                  dotColor="success.c50"
                  label={<Trans i18nKey="aleo.stake.status.claimable" />}
                  amount={<Discreet>{formatAmount(unbondingBalance)}</Discreet>}
                  button={
                    <GreenButton small onClick={onClaim}>
                      <Trans i18nKey="aleo.stake.claim" />
                    </GreenButton>
                  }
                />
              ) : (
                <StakingCard
                  dotColor="neutral.c70"
                  label={<Trans i18nKey="aleo.stake.status.unstaking" />}
                  amount={<Discreet>{formatAmount(unbondingBalance)}</Discreet>}
                  subLine={
                    blocksLeft != null ? (
                      <CardSubLine>
                        <Trans
                          i18nKey="aleo.stake.blocksRemaining"
                          values={{ count: blocksLeft }}
                        />
                      </CardSubLine>
                    ) : null
                  }
                  button={
                    <ToolTip
                      content={
                        unbondingHeight != null ? (
                          <Trans
                            i18nKey="aleo.stake.claimableAtTooltip"
                            values={{ height: unbondingHeight, current: currentHeight }}
                          />
                        ) : null
                      }
                    >
                      <Button small primary disabled onClick={onClaim}>
                        <Trans i18nKey="aleo.stake.claim" />
                      </Button>
                    </ToolTip>
                  }
                />
              )
            ) : null}
          </CardGrid>
        </>
      ) : (
        <EmptyStateWrapper horizontal>
          <Box style={{ maxWidth: "65%" }}>
            <Text ff="Inter|Medium|SemiBold" color="neutral.c70" fontSize={4}>
              <Trans
                i18nKey="aleo.stake.emptyState.description"
                values={{ name: account.currency.name }}
              />
            </Text>
          </Box>
          <Box>
            <Button primary small onClick={onEarnRewards}>
              <Box horizontal flow={1} alignItems="center">
                <IconChartLine size={12} />
                <Box>
                  <Trans i18nKey="aleo.stake.emptyState.earnRewards" />
                </Box>
              </Box>
            </Button>
          </Box>
        </EmptyStateWrapper>
      )}
    </TableContainer>
  );
};

const StakingSection = ({ account }: { account: AleoAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  return <Staking account={account} />;
};

export default StakingSection;
