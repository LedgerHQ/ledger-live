import React, { Fragment, useCallback, useMemo, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import { useElrondRandomizedValidators } from "@ledgerhq/live-common/families/elrond/react";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import ToolTip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Unbondings from "~/renderer/families/elrond/components/Unbondings";
import Delegations from "~/renderer/families/elrond/components/Delegations";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import { modals } from "./modals";
import { DelegationType, UnbondingType } from "~/renderer/families/elrond/types";
import { Account } from "@ledgerhq/types-live";
export interface DelegationPropsType {
  account: Account;
}
const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

/* eslint-disable react/display-name */
const withDelegation = (Component: JSX.Element) => (props: DelegationPropsType) =>
  props.account.elrondResources ? <Component {...props} /> : null;
const Delegation = (props: DelegationPropsType) => {
  const { account } = props;
  const validators = useElrondRandomizedValidators();
  const [delegationResources, setDelegationResources] = useState<DelegationType[]>(
    account.elrondResources ? account.elrondResources.delegations : [],
  );
  const dispatch = useDispatch();
  const delegationEnabled = useMemo(
    (): boolean =>
      BigNumber(
        denominate({
          input: account.spendableBalance,
          showLastNonZeroDecimal: true,
        }),
      ).gte(1),
    [account.spendableBalance],
  );
  const findValidator = useCallback(
    (validator: string) => validators.find(item => item.contract === validator),
    [validators],
  );
  const hasRewards = useMemo(
    (): boolean =>
      delegationResources
        .reduce(
          (total: BigNumber, delegation: DelegationType) => total.plus(delegation.claimableRewards),
          BigNumber(0),
        )
        .gt(0),
    [delegationResources],
  );
  const delegations = useMemo((): DelegationType[] => {
    const transform = (input: string): BigNumber =>
      BigNumber(
        denominate({
          input,
          showLastNonZeroDecimal: true,
        }),
      );
    const assignValidator = (delegation: DelegationType): DelegationType => ({
      ...delegation,
      validator: findValidator(delegation.contract),
    });
    const sortDelegations = (alpha: DelegationType, beta: DelegationType) =>
      transform(alpha.userActiveStake).isGreaterThan(transform(beta.userActiveStake)) ? -1 : 1;
    const filterDelegations = (delegation: DelegationType): boolean =>
      BigNumber(delegation.userActiveStake).isGreaterThan(0) ||
      BigNumber(delegation.claimableRewards).isGreaterThan(0);
    return delegationResources
      .map(assignValidator)
      .sort(sortDelegations)
      .filter(filterDelegations);
  }, [findValidator, delegationResources]);
  const unbondings = useMemo(
    (): UnbondingType[] =>
      delegationResources
        .reduce(
          (total: UnbondingType[], item: DelegationType) =>
            total.concat(
              item.userUndelegatedList.map(unbonding => ({
                ...unbonding,
                contract: item.contract,
                validator: findValidator(item.contract),
              })),
            ),
          [],
        )
        .sort((alpha, beta) => alpha.seconds - beta.seconds),
    [delegationResources, findValidator],
  );
  const fetchDelegations = useCallback(() => {
    setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);
    return () =>
      setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);
  }, [account.elrondResources]);
  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal(modals.rewards, {
        account,
        validators,
        delegations,
      }),
    );
  }, [account, dispatch, validators, delegations]);
  const onDelegate = useCallback(() => {
    if (validators) {
      dispatch(
        openModal(modals.stake, {
          account,
          validators,
          delegations,
        }),
      );
    }
  }, [account, dispatch, validators, delegations]);
  const onClaimRewards = useCallback(() => {
    if (validators && delegations) {
      dispatch(
        openModal(modals.claim, {
          account,
          validators,
          delegations,
        }),
      );
    }
  }, [account, delegations, validators, dispatch]);
  const hasDelegations = delegations.length > 0;
  const hasUnbondings = unbondings.length > 0;
  useEffect(fetchDelegations, [fetchDelegations]);

  // FIXME This component is a bit unbalanced and confusing, mixing rewards,
  // delegations and undelegations. The three should be split in their own component.
  return (
    <Fragment>
      <TableContainer mb={6}>
        <TableHeader
          title={<Trans i18nKey="elrond.delegation.header" />}
          titleProps={{
            "data-e2e": "title_Delegation",
          }}
        >
          {(hasDelegations || hasRewards) && (
            <Fragment>
              {delegations && (
                <ToolTip
                  content={
                    !delegationEnabled ? <Trans i18nKey="elrond.delegation.minSafeWarning" /> : null
                  }
                >
                  <Button
                    id={"account-delegate-button"}
                    mr={2}
                    disabled={!delegationEnabled}
                    color="palette.primary.main"
                    small={true}
                    onClick={onDelegate}
                  >
                    <Box horizontal={true} flow={1} alignItems="center">
                      <DelegateIcon size={12} />
                      <Box>
                        <Trans i18nKey="elrond.delegation.delegate" />
                      </Box>
                    </Box>
                  </Button>
                </ToolTip>
              )}

              <ToolTip
                content={!hasRewards ? <Trans i18nKey="elrond.delegation.noRewards" /> : null}
              >
                <Button
                  id="account-rewards-button"
                  disabled={!hasRewards}
                  color="palette.primary.main"
                  small={true}
                  onClick={onClaimRewards}
                >
                  <Box horizontal flow={1} alignItems="center">
                    <ClaimRewards size={12} />
                    <Box>
                      <Trans i18nKey="elrond.delegation.claimRewards" />
                    </Box>
                  </Box>
                </Button>
              </ToolTip>
            </Fragment>
          )}
        </TableHeader>

        {hasDelegations ? (
          <Delegations account={account} delegations={delegations} validators={validators} />
        ) : (
          <Wrapper horizontal={true}>
            <Box
              style={{
                maxWidth: "65%",
              }}
            >
              <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
                <Trans
                  i18nKey="elrond.delegation.emptyState.description"
                  values={{
                    name: account.currency.name,
                  }}
                />
              </Text>

              <Box mt={2}>
                <LinkWithExternalIcon
                  label={<Trans i18nKey="elrond.delegation.emptyState.info" />}
                  onClick={() => openURL(urls.elrondStaking)}
                />
              </Box>
            </Box>

            <Box>
              <ToolTip
                content={
                  !delegationEnabled ? <Trans i18nKey="elrond.delegation.minSafeWarning" /> : null
                }
              >
                <Button
                  primary={true}
                  small={true}
                  disabled={!delegationEnabled}
                  onClick={onEarnRewards}
                >
                  <Box horizontal={true} flow={1} alignItems="center">
                    <IconChartLine size={12} />

                    <Box>
                      <Trans i18nKey="elrond.delegation.emptyState.delegation" />
                    </Box>
                  </Box>
                </Button>
              </ToolTip>
            </Box>
          </Wrapper>
        )}
      </TableContainer>

      {hasUnbondings && <Unbondings account={account} unbondings={unbondings} />}
    </Fragment>
  );
};
export default withDelegation(Delegation);
