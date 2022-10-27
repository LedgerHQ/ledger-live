import React, { useState, useEffect, useMemo, useCallback, FC } from "react";
import { View } from "react-native";
import { BigNumber } from "bignumber.js";

import type { AccountLike } from "@ledgerhq/types-live";
import type {
  ElrondProvider,
  ElrondAccount,
} from "@ledgerhq/live-common/families/elrond/types";
import type { BodyPropsType } from "./types";
import type { DrawerPropsType } from "./components/Drawer/types";
import type { DelegationType } from "../../types";

import { denominate, randomizeProviders } from "../../helpers";

import Delegations from "./components/Delegations";
import Unbondings from "./components/Unbondings";
import Rewards from "./components/Rewards";
import Drawer from "./components/Drawer";

import styles from "./styles";

/*
 * Create a higher order component that will return null if there are no resources for Elrond staking.
 */

const withBody =
  (Component: FC<BodyPropsType>) =>
  ({ account }: { account: AccountLike }) => {
    const elrondAccount = account as ElrondAccount;
    return elrondAccount.elrondResources ? (
      <Component account={elrondAccount} />
    ) : null;
  };

/*
 * Handle the component declaration.
 */

const Body = (props: BodyPropsType) => {
  const { account } = props;

  /*
   * Declare the drawer state (for the dynamic information drawer) and the delegation resources state (tracking server updates).
   */

  const [drawer, setDrawer] = useState<DrawerPropsType["data"] | false>();
  const [delegationResources, setDelegationResources] = useState<
    DelegationType[]
  >(account.elrondResources.delegations);

  /*
   * Randomize the list of the memoized validators..
   */

  const validators = useMemo(
    () => randomizeProviders(account.elrondResources.providers),
    [account.elrondResources.providers],
  );

  /*
   * Call the drawer callback and populate the state with the given data, thus activating it.
   */

  const onDrawer = useCallback(
    (data: DrawerPropsType["data"] | false) => setDrawer(data),
    [setDrawer],
  );

  /*
   * Find the validator of the current delegation, by contract address.
   */

  const findValidator = useCallback(
    (contract: string): ElrondProvider | undefined =>
      validators.find(validator => validator.contract === contract),
    [validators],
  );

  /*
   * Track delegations array updates and trigger state changes accordingly.
   */

  const fetchDelegations = useCallback(() => {
    setDelegationResources(account.elrondResources.delegations);

    return () => setDelegationResources(account.elrondResources.delegations);
  }, [account.elrondResources.delegations]);

  /*
   * Sort the delegations by amount, by transforming the given amount into a denominated value, assign the validator, and filter by rewards or stake.
   */

  const delegations = useMemo(() => {
    const transform = (input: string) =>
      new BigNumber(denominate({ input, showLastNonZeroDecimal: true }));

    const formatDelegations = (
      delegations: DelegationType[],
      delegation: DelegationType,
    ) => {
      const zeroStake = new BigNumber(delegation.userActiveStake).isZero();
      const zeroRewards = new BigNumber(delegation.claimableRewards).isZero();

      if (zeroStake && zeroRewards) {
        return delegations;
      }

      return delegations.concat([
        Object.assign(delegation, {
          validator: findValidator(delegation.contract),
        }),
      ]);
    };

    const sortDelegations = (alpha: DelegationType, beta: DelegationType) =>
      transform(alpha.userActiveStake).isGreaterThan(
        transform(beta.userActiveStake),
      )
        ? -1
        : 1;

    return delegationResources
      .sort(sortDelegations)
      .reduce(formatDelegations, []);
  }, [findValidator, delegationResources]);

  /*
   * Reduce all rewards into one number and see if it exceeds zero (thus, if there are any available).
   */

  const rewards = useMemo(
    () =>
      delegations.reduce(
        (total, delegation) => total.plus(delegation.claimableRewards),
        new BigNumber(0),
      ),
    [delegations],
  );

  /*
   * Track all callback reference updates and run the effect conditionally.
   */

  useEffect(fetchDelegations, [fetchDelegations]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={styles.root}>
      {drawer && (
        <Drawer
          account={account}
          onClose={() => setDrawer(false)}
          data={drawer}
        />
      )}

      {rewards.gt(0) && (
        <Rewards value={rewards} account={account} delegations={delegations} />
      )}

      <Delegations
        onDrawer={onDrawer}
        delegations={delegations}
        account={account}
        validators={validators}
      />

      <Unbondings
        onDrawer={onDrawer}
        delegations={delegations}
        account={account}
      />
    </View>
  );
};

export default withBody(Body);
