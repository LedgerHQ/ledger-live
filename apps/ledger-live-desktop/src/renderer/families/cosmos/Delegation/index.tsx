import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { SubAccount } from "@ledgerhq/types-live";
import {
  useCosmosFamilyPreloadData,
  useCosmosFamilyMappedDelegations,
} from "@ledgerhq/live-common/families/cosmos/react";
import { mapUnbondings, canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import { Header, UnbondingHeader } from "./Header";
import { Row, UnbondingRow } from "./Row";
import ToolTip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { DelegationActionsModalName } from "../modals";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import cosmosBase from "@ledgerhq/coin-cosmos/chain/cosmosBase";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Delegation = ({ account }: { account: CosmosAccount }) => {
  const dispatch = useDispatch();
  const { cosmosResources } = account;
  const {
    delegations,
    pendingRewardsBalance: _pendingRewardsBalance,
    /** $FlowFixMe */
    unbondings,
  } = cosmosResources;

  const stakingUrl = useLocalizedUrl(urls.stakingCosmos);
  const validatorUrl = useLocalizedUrl(urls.ledgerValidator);
  const delegationEnabled = canDelegate(account);
  const mappedDelegations = useCosmosFamilyMappedDelegations(account);
  const currencyId = account.currency.id;
  const { validators } = useCosmosFamilyPreloadData(currencyId);
  const unit = useAccountUnit(account);
  const mappedUnbondings = mapUnbondings(unbondings, validators, unit);
  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_COSMOS_REWARDS_INFO", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onDelegate = useCallback(() => {
    dispatch(
      openModal("MODAL_COSMOS_DELEGATE", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onClaimRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_COSMOS_CLAIM_REWARDS", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onRedirect = useCallback(
    (validatorAddress: string, modalName: DelegationActionsModalName) => {
      dispatch(
        openModal(modalName, {
          account,
          validatorAddress,
        }),
      );
    },
    [account, dispatch],
  );
  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    (address: string) => {
      if (cosmosBase.COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.includes(address)) {
        openURL(validatorUrl);
      } else {
        const srURL = explorerView && getAddressExplorer(explorerView, address);
        if (srURL) openURL(srURL);
      }
    },
    [explorerView, validatorUrl],
  );
  const hasDelegations = delegations.length > 0;
  const hasUnbondings = unbondings && unbondings.length > 0;
  const hasRewards = _pendingRewardsBalance.gt(0);
  const crypto = cryptoFactory(account.currency.id);
  return (
    <>
      <TableContainer mb={6}>
        <TableHeader
          title={<Trans i18nKey="cosmos.delegation.header" />}
          titleProps={{
            "data-e2e": "title_Delegation",
          }}
        >
          {hasDelegations || hasRewards ? (
            <>
              {hasDelegations ? (
                <ToolTip
                  content={
                    !delegationEnabled ? <Trans i18nKey="cosmos.delegation.minSafeWarning" /> : null
                  }
                >
                  <Button
                    id={"account-delegate-button"}
                    mr={2}
                    disabled={!delegationEnabled}
                    color="palette.primary.main"
                    small
                    onClick={onDelegate}
                  >
                    <Box horizontal flow={1} alignItems="center">
                      <DelegateIcon size={12} />
                      <Box>
                        <Trans i18nKey="cosmos.delegation.delegate" />
                      </Box>
                    </Box>
                  </Button>
                </ToolTip>
              ) : null}
              <ToolTip
                content={!hasRewards ? <Trans i18nKey="cosmos.delegation.noRewards" /> : null}
              >
                <Button
                  id={"account-rewards-button"}
                  disabled={!hasRewards}
                  color="palette.primary.main"
                  small
                  onClick={onClaimRewards}
                >
                  <Box horizontal flow={1} alignItems="center">
                    <ClaimRewards size={12} />
                    <Box>
                      <Trans i18nKey="cosmos.delegation.claimRewards" />
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
            {mappedDelegations.map((delegation, index) => (
              <Row
                key={index}
                account={account}
                delegation={delegation}
                onManageAction={onRedirect}
                onExternalLink={onExternalLink}
              />
            ))}
          </>
        ) : (
          <Wrapper horizontal>
            <Box
              style={{
                maxWidth: "65%",
              }}
            >
              <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
                <Trans
                  i18nKey="cosmos.delegation.emptyState.description"
                  values={{
                    name: account.currency.name,
                    currencyTicker: account.currency.ticker,
                  }}
                />
              </Text>
              <Box mt={2}>
                <LinkWithExternalIcon
                  label={<Trans i18nKey="cosmos.delegation.emptyState.info" />}
                  onClick={() => openURL(stakingUrl)}
                />
              </Box>
            </Box>
            <Box>
              <ToolTip
                content={
                  !delegationEnabled ? <Trans i18nKey="cosmos.delegation.minSafeWarning" /> : null
                }
              >
                <Button primary small disabled={!delegationEnabled} onClick={onEarnRewards}>
                  <Box horizontal flow={1} alignItems="center">
                    <IconChartLine size={12} />
                    <Box>
                      <Trans i18nKey="cosmos.delegation.emptyState.delegation" />
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
            title={<Trans i18nKey="cosmos.undelegation.header" />}
            titleProps={{
              "data-e2e": "title_Undelegation",
            }}
            tooltip={
              <Trans
                i18nKey="cosmos.undelegation.headerTooltip"
                values={{ numberOfDays: crypto.unbondingPeriod }}
              />
            }
          />
          <UnbondingHeader />
          {mappedUnbondings.map((delegation, index) => (
            <UnbondingRow key={index} delegation={delegation} onExternalLink={onExternalLink} />
          ))}
        </TableContainer>
      ) : null}
    </>
  );
};
const Delegations = ({ account }: { account: CosmosAccount | SubAccount }) => {
  if (account.type !== "Account") return null;

  return <Delegation account={account} />;
};
export default Delegations;
