import React, { useState, useEffect, useMemo, useCallback, FC } from "react";
import { View } from "react-native";
import { BigNumber } from "bignumber.js";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { useElrondRandomizedValidators } from "@ledgerhq/live-common/families/elrond/react";

import type { ElrondProvider, ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { BodyPropsType, WithBodyPropsType } from "./types";
import type { DrawerPropsType } from "./components/Drawer/types";
import type { DelegationType } from "../../types";

import Delegations from "./components/Delegations";
import Unbondings from "./components/Unbondings";
import Rewards from "./components/Rewards";
import Drawer from "./components/Drawer";

import styles from "./styles";

/*
 * Create a higher order component that will return null if there are no resources for Elrond staking.
 */

const withBody = (Component: FC<BodyPropsType>) => (props: WithBodyPropsType) => {
  const account = props.account as ElrondAccount;

  /*
   * Return nothing if there isn't any data for the "elrondResources" key.
   */

  if (!account.elrondResources) {
    return null;
  }

  /*
   * Return the rendered wrapped component and pass along the account.
   */

  return <Component account={account} />;
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
  const [delegationResources, setDelegationResources] = useState<DelegationType[]>(
    account.elrondResources ? account.elrondResources.delegations : [],
  );

  /*
   * Randomize the list of the memoized validators..
   */

  const validators = useElrondRandomizedValidators();

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
    setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);

    return () =>
      setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);
  }, [account.elrondResources]);

  /*
   * Sort the delegations by amount, by transforming the given amount into a denominated value, assign the validator, and filter by rewards or stake.
   */

  const delegations = useMemo(() => {
    const transform = (input: string) =>
      new BigNumber(denominate({ input, showLastNonZeroDecimal: true }));

    const formatDelegations = (delegation: DelegationType) =>
      Object.assign(delegation, {
        validator: findValidator(delegation.contract),
      });

    const sortDelegations = (alpha: DelegationType, beta: DelegationType) =>
      transform(alpha.userActiveStake).isGreaterThan(transform(beta.userActiveStake)) ? -1 : 1;

    return delegationResources.sort(sortDelegations).map(formatDelegations);
  }, [findValidator, delegationResources]);

  /*
   * Track all callback reference updates and run the effect conditionally.
   */

  useEffect(fetchDelegations, [fetchDelegations]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={styles.root}>
      {drawer && <Drawer account={account} onClose={() => setDrawer(false)} data={drawer} />}

      <Rewards account={account} delegations={delegations} />

      <Delegations
        onDrawer={onDrawer}
        delegations={delegations}
        account={account}
        validators={validators}
      />

      <Unbondings onDrawer={onDrawer} delegations={delegations} account={account} />
    </View>
  );
};

export default withBody(Body);
