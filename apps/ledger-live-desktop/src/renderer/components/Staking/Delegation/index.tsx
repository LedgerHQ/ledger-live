import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  mapDelegations,
  mapUnbondings,
  mapRedelegations,
  canDelegate,
  getValidatorExplorerUrl,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { stakeFeatures } from "@ledgerhq/live-common/bridge/descriptor/stake/features";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import IconChartLine from "~/renderer/icons/ChartLine";
import { Header, UnbondingHeader, RedelegationHeader } from "./Header";
import { Row, UnbondingRow, RedelegationRow } from "./Row";
import ToolTip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const Delegation = ({ account }: { account: StakingAccount }) => {
  const dispatch = useDispatch();

  const unit = useAccountUnit(account);

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
    () => dispatch(openModal("MODAL_STAKE_REWARDS_INFO", { account })),
    [account, dispatch],
  );
  const onDelegate = useCallback(
    () => dispatch(openModal("MODAL_STAKE_DELEGATE", { account })),
    [account, dispatch],
  );

  const { stakingResources } = account;

  const { delegations, unbondings, redelegations, pendingRewardsBalance } = stakingResources;

  const delegationEnabled = canDelegate(account);

  const mappedDelegations = mapDelegations(delegations, validators, unit);
  const mappedUnbondings = mapUnbondings(unbondings, validators, unit);
  const mappedRedelegations = mapRedelegations(redelegations, validators, unit);
  const onClaimRewards = () => {};
  const onRedirect = () => {};

  const hasDelegations = delegations.length > 0;
  const hasUnbondings = unbondings.length > 0;
  const hasRedelegations = redelegations.length > 0;
  const hasRewards = pendingRewardsBalance.gt(0);

  return (
    <>
      <TableContainer mb={6}>
        <TableHeader
          title={<Trans i18nKey="staking.delegation.header" />}
          titleProps={{ "data-e2e": "title_Delegation" }}
        >
          {hasDelegations || hasRewards ? (
            <>
              {hasDelegations ? (
                <ToolTip
                  content={
                    delegationEnabled ? null : <Trans i18nKey="staking.delegation.minSafeWarning" />
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
                        <Trans i18nKey="staking.delegation.delegate" />
                      </Box>
                    </Box>
                  </Button>
                </ToolTip>
              ) : null}
              <ToolTip
                content={hasRewards ? null : <Trans i18nKey="staking.delegation.noRewards" />}
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
                      <Trans i18nKey="staking.delegation.claimRewards" />
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
                key={delegation.validatorAddress}
                account={account}
                delegation={delegation}
                onManageAction={onRedirect}
                onExternalLink={onExternalLink}
              />
            ))}
          </>
        ) : (
          <Wrapper horizontal>
            <Box style={{ maxWidth: "65%" }}>
              <Text ff="Inter|Medium|SemiBold" color="neutral.c70" fontSize={4}>
                <Trans
                  i18nKey="staking.delegation.emptyState.description"
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
                  delegationEnabled ? null : <Trans i18nKey="staking.delegation.minSafeWarning" />
                }
              >
                <Button primary small disabled={!delegationEnabled} onClick={onEarnRewards}>
                  <Box horizontal flow={1} alignItems="center">
                    <IconChartLine size={12} />
                    <Box>
                      <Trans i18nKey="staking.delegation.emptyState.delegation" />
                    </Box>
                  </Box>
                </Button>
              </ToolTip>
            </Box>
          </Wrapper>
        )}
      </TableContainer>
      {hasRedelegations ? (
        <TableContainer mb={6}>
          <TableHeader
            title={<Trans i18nKey="staking.redelegation.header" />}
            titleProps={{ "data-e2e": "title_Redelegation" }}
          />
          <RedelegationHeader />
          {mappedRedelegations.map(redelegation => (
            <RedelegationRow
              key={`${redelegation.validatorSrcAddress}-${redelegation.validatorDstAddress}-${redelegation.completionDate.valueOf()}`}
              redelegation={redelegation}
              onExternalLink={onExternalLink}
            />
          ))}
        </TableContainer>
      ) : null}
      {hasUnbondings ? (
        <TableContainer mb={6}>
          <TableHeader
            title={<Trans i18nKey="staking.undelegation.header" />}
            titleProps={{ "data-e2e": "title_Undelegation" }}
          />
          <UnbondingHeader />
          {mappedUnbondings.map(unbonding => (
            <UnbondingRow
              key={`${unbonding.validatorAddress}-${unbonding.completionDate.valueOf()}`}
              delegation={unbonding}
              onExternalLink={onExternalLink}
            />
          ))}
        </TableContainer>
      ) : null}
    </>
  );
};

/**
 * Generic staking delegation table.
 * Rendered for any coin that declares `stake` in its descriptor
 * (without `customUI: true`).
 */
const StakingDelegations = ({ account }: { account: Account | TokenAccount }) => {
  if (account.type !== "Account") return null;
  if (!stakeFeatures.usesGenericStakingUI(account.currency)) return null;
  if (!isStakingAccount(account)) return null;
  return <Delegation account={account} />;
};

export default StakingDelegations;
