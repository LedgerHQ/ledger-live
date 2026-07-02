import React, { useCallback } from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getClaimableStakingBalance } from "@ledgerhq/live-common/families/aleo/utils";
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
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader, HeaderWrapper } from "~/renderer/components/TableContainer";

const TableLine = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c70",
  horizontal: true,
  alignItems: "center",
  justifyContent: "flex-start",
  fontSize: 3,
  flex: 1,
  pr: 2,
}))`
  box-sizing: border-box;
  &:last-child {
    justify-content: flex-end;
    flex: 0.5;
    text-align: right;
    white-space: nowrap;
  }
`;

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column = styled(TableLine).attrs<{ strong?: boolean; clickable?: boolean }>(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "neutral.c100" : "neutral.c80",
  fontSize: 3,
}))<{ strong?: boolean; clickable?: boolean }>`
  cursor: ${p => (p.clickable ? "pointer" : "default")};
  ${p => (p.clickable ? `&:hover { color: ${p.theme.colors.primary.c80}; }` : "")}
`;

const Ellipsis = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyStateWrapper = styled(Box).attrs(() => ({ p: 3 }))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const Header = () => (
  <HeaderWrapper>
    <TableLine>
      <Trans i18nKey="aleo.stake.table.status" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="aleo.stake.table.validator" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="aleo.stake.table.amount" />
    </TableLine>
    <TableLine />
  </HeaderWrapper>
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
          <Button
            id="account-manage-staking-button"
            mr={2}
            color="primary.c80"
            small
            onClick={onManage}
          >
            <Box horizontal flow={1} alignItems="center">
              <DelegateIcon size={12} />
              <Box>
                <Trans i18nKey="aleo.stake.table.manage" />
              </Box>
            </Box>
          </Button>
        ) : null}
      </TableHeader>
      {hasPosition ? (
        <>
          <Header />
          {hasBonded ? (
            <RowWrapper>
              <Column strong>
                <Trans i18nKey="aleo.stake.status.staked" />
              </Column>
              <Column clickable={!!bondedValidator} onClick={onValidatorClick}>
                <Ellipsis>{bondedValidator ?? "-"}</Ellipsis>
              </Column>
              <Column strong>
                <Discreet>{formatAmount(bondedBalance)}</Discreet>
              </Column>
              <Column>
                <Button small outlineGrey onClick={onUnstake}>
                  <Trans i18nKey="aleo.stake.unstake" />
                </Button>
              </Column>
            </RowWrapper>
          ) : null}
          {hasUnbonding ? (
            <RowWrapper>
              <Column strong>
                <Trans
                  i18nKey={isClaimable ? "aleo.stake.status.claimable" : "aleo.stake.status.unstaking"}
                />
              </Column>
              <Column>
                <Ellipsis>-</Ellipsis>
              </Column>
              <Column strong>
                <Discreet>{formatAmount(unbondingBalance)}</Discreet>
              </Column>
              <Column>
                <ToolTip
                  content={
                    !isClaimable && unbondingHeight != null ? (
                      <Trans
                        i18nKey="aleo.stake.claimableAtTooltip"
                        values={{ height: unbondingHeight, current: account.blockHeight }}
                      />
                    ) : null
                  }
                >
                  <Button small primary disabled={!isClaimable} onClick={onClaim}>
                    <Trans i18nKey="aleo.stake.claim" />
                  </Button>
                </ToolTip>
              </Column>
            </RowWrapper>
          ) : null}
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
