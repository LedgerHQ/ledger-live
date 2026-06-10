import React, { useCallback, useEffect } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  mapDelegations,
  mapUnbondings,
  canDelegate,
  getValidatorExplorerUrl,
  prefetchValidators,
  hasUnbondingPeriod,
  getUnbondingPeriodDays,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { useFeature } from "@features/platform-feature-flags";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import IconChartLine from "~/renderer/icons/ChartLine";
import { Header, UnbondingHeader } from "./Header";
import { Row, UnbondingRow } from "./Row";
import ToolTip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { DelegationActionsModalName } from "../modals";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const Delegation = ({ account }: { account: StakingAccount }) => {
  const dispatch = useDispatch();
  const { enabled: isEvmNativeStakingEnabled, params } = useFeature("evmNativeStaking") ?? {};
  const isCurrencySupported = params?.supportedCurrencyIds?.includes(account.currency.id) || false;

  if (!isCurrencySupported || !isEvmNativeStakingEnabled) return null;

  const unit = useAccountUnit(account);
  const currencyId = account.currency.id;

  // Warm the validators cache on the account page so that opening either the
  // "Earn rewards" info modal or the "Delegate" modal directly never shows an
  // empty list while the first fetch resolves.
  useEffect(() => {
    if (isCurrencySupported && isEvmNativeStakingEnabled) {
      prefetchValidators(currencyId);
    }
  }, [currencyId, isCurrencySupported, isEvmNativeStakingEnabled]);

  const validators = account.stakingResources.validators ?? [];

  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    (address: string) => {
      const srURL =
        getValidatorExplorerUrl(account.currency.id, address) ||
        (explorerView && getAddressExplorer(explorerView, address));
      if (srURL) openURL(srURL);
    },
    [account.currency.id, explorerView],
  );

  const onEarnRewards = useCallback(
    () => dispatch(openModal("MODAL_EVM_REWARDS_INFO", { account })),
    [account, dispatch],
  );
  const onDelegate = useCallback(
    () => dispatch(openModal("MODAL_EVM_DELEGATE", { account })),
    [account, dispatch],
  );
  const onRedirect = useCallback(
    (validatorAddress: string, modalName: DelegationActionsModalName) => {
      dispatch(openModal(modalName, { account, validatorAddress }));
    },
    [account, dispatch],
  );
  const onClaimRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_EVM_CLAIM_REWARDS", {
        account,
      }),
    );
  }, [account, dispatch]);

  const { stakingResources } = account;

  const { delegations, unbondings, pendingRewardsBalance } = stakingResources;

  const delegationEnabled = canDelegate(account);

  const mappedDelegations = mapDelegations(delegations, validators, unit);
  const mappedUnbondings = mapUnbondings(unbondings, validators, unit);
  const onRowClaimRewards = useCallback(
    (validatorAddress: string) => {
      dispatch(openModal("MODAL_EVM_CLAIM_REWARDS", { account, validatorAddress }));
    },
    [account, dispatch],
  );
  const onWithdraw = useCallback(
    (validatorAddress: string, amount: BigNumber, withdrawId?: number) => {
      dispatch(openModal("MODAL_EVM_WITHDRAW", { account, validatorAddress, amount, withdrawId }));
    },
    [account, dispatch],
  );

  const hasDelegations = delegations.length > 0;
  // Only surface the "Pending undelegation" section when the chain enforces an unbonding
  // period (Acceptance Criteria: Tracking). Instant-withdrawal chains never have pending
  // unbondings so showing the header would be misleading.
  const hasUnbondings = unbondings.length > 0 && hasUnbondingPeriod(account.currency.id);
  const hasRewards = pendingRewardsBalance.gt(0);

  return (
    <>
      <TableContainer mb={6}>
        <TableHeader
          title={<Trans i18nKey="ethereum.evmStaking.delegation.header" />}
          titleProps={{ "data-e2e": "title_Delegation" }}
        >
          {hasDelegations || hasRewards ? (
            <>
              {hasDelegations ? (
                <ToolTip
                  content={
                    delegationEnabled ? null : (
                      <Trans i18nKey="ethereum.evmStaking.delegation.minSafeWarning" />
                    )
                  }
                >
                  <Button
                    id="account-delegate-button"
                    mr={2}
                    disabled={!delegationEnabled}
                    color="primary.c80"
                    small
                    onClick={onDelegate}
                  >
                    <Box horizontal flow={1} alignItems="center">
                      <DelegateIcon size={12} />
                      <Box>
                        <Trans i18nKey="ethereum.evmStaking.delegation.delegate" />
                      </Box>
                    </Box>
                  </Button>
                </ToolTip>
              ) : null}
              <ToolTip
                content={
                  hasRewards ? null : <Trans i18nKey="ethereum.evmStaking.delegation.noRewards" />
                }
              >
                <Button
                  id="account-rewards-button"
                  disabled={!hasRewards}
                  color="primary.c80"
                  small
                  onClick={onClaimRewards}
                >
                  <Box horizontal flow={1} alignItems="center">
                    <ClaimRewards size={12} />
                    <Box>
                      <Trans i18nKey="ethereum.evmStaking.delegation.claimRewards" />
                    </Box>
                  </Box>
                </Button>
              </ToolTip>
            </>
          ) : null}
        </TableHeader>
        {hasDelegations ? (
          <>
            <Header />
            {mappedDelegations.map(delegation => (
              <Row
                key={`${delegation.validatorAddress}-${delegation.status}`}
                account={account}
                delegation={delegation}
                onManageAction={onRedirect}
                onClaimRewards={onRowClaimRewards}
                onExternalLink={onExternalLink}
              />
            ))}
          </>
        ) : (
          <Wrapper horizontal>
            <Box style={{ maxWidth: "65%" }}>
              <Text ff="Inter|Medium|SemiBold" color="neutral.c70" fontSize={4}>
                <Trans
                  i18nKey="ethereum.evmStaking.delegation.emptyState.description"
                  values={{
                    name: account.currency.name,
                    currencyTicker: account.currency.ticker,
                  }}
                />
              </Text>
            </Box>
            <Box>
              <ToolTip
                content={
                  delegationEnabled ? null : (
                    <Trans i18nKey="ethereum.evmStaking.delegation.minSafeWarning" />
                  )
                }
              >
                <Button
                  data-testid="evm-earn-rewards-button"
                  primary
                  small
                  disabled={!delegationEnabled}
                  onClick={onEarnRewards}
                >
                  <Box horizontal flow={1} alignItems="center">
                    <IconChartLine size={12} />
                    <Box>
                      <Trans i18nKey="ethereum.evmStaking.delegation.emptyState.delegation" />
                    </Box>
                  </Box>
                </Button>
              </ToolTip>
            </Box>
          </Wrapper>
        )}
      </TableContainer>
      {hasUnbondings ? (
        <TableContainer mb={6}>
          <TableHeader
            title={<Trans i18nKey="ethereum.evmStaking.undelegation.header" />}
            titleProps={{ "data-e2e": "title_Undelegation" }}
            tooltip={
              <Trans
                i18nKey="ethereum.evmStaking.undelegation.headerTooltip"
                values={{ numberOfDays: getUnbondingPeriodDays(currencyId) }}
              />
            }
          />
          <UnbondingHeader />
          {mappedUnbondings.map(unbonding => (
            <UnbondingRow
              key={`${unbonding.validatorAddress}-${unbonding.completionDate.valueOf()}${unbonding.withdrawId !== undefined ? `-${unbonding.withdrawId}` : ""}`}
              delegation={unbonding}
              onWithdraw={onWithdraw}
              onExternalLink={onExternalLink}
            />
          ))}
        </TableContainer>
      ) : null}
    </>
  );
};

const Delegations = ({ account }: { account: Account | TokenAccount }) => {
  if (account.type !== "Account" || !isStakingAccount(account)) return null;
  return <Delegation account={account} />;
};

export default Delegations;
