import React, { useCallback, useMemo, useEffect, useState, FC } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";

import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../types";
import type { SummaryPropsType, ItemType } from "./types";

import InfoModal from "~/modals/Info";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";

import styles from "./styles";

/*
 * Create a higher order component that will return null if balance is zero (thus unable to delegate).
 */

const withSummary = (Component: FC<SummaryPropsType>) => (props: SummaryPropsType) =>
  props.account.balance.isGreaterThan(0) ? <Component {...props} /> : null;

/*
 * Handle the component declaration.
 */

const Summary = (props: SummaryPropsType) => {
  const { t } = useTranslation();

  const account = props.account as ElrondAccount;
  const unit = getAccountUnit(account);

  /*
   * Declare the data state (for the dynamic information modal) and the delegation resources state (tracking server updates).
   */

  const [data, setData] = useState<ItemType["modal"][]>([]);
  const [balance, setBalance] = useState<BigNumber>(account.spendableBalance);
  const [delegationsResources, setDelegationResources] = useState<DelegationType[]>(
    account.elrondResources ? account.elrondResources.delegations : [],
  );

  /*
   * Track delegations array updates and trigger state changes accordingly.
   */

  const fetchDelegations = useCallback(() => {
    setBalance(account.spendableBalance);
    setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);

    return () => {
      setBalance(account.spendableBalance);
      setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);
    };
  }, [account.elrondResources, account.spendableBalance]);

  /*
   * Format the three data items by denominating the value and filtering out zero resources.
   */

  const formatItems = useCallback(
    (items: ItemType[]) =>
      items.reduce((total: ItemType[], current: ItemType) => {
        const item: ItemType = Object.assign(current, {
          modal: {
            description: t(current.modal.description),
            title: t(current.modal.title),
          },
        });

        return current.show ? total.concat([item]) : total;
      }, []),
    [t],
  );

  /*
   * When closing the information modal, reset the data state.
   */

  const onCloseModal = useCallback(() => {
    setData([]);
  }, []);

  /*
   * Cumulate all the active stake for each delegation into one single sum.
   */

  const delegations = useMemo(
    () =>
      delegationsResources.reduce(
        (total: BigNumber, delegation) => total.plus(delegation.userActiveStake),
        new BigNumber(0),
      ),
    [delegationsResources],
  );

  /*
   * Cumulate all the unbonded stake for each delegation into one single sum.
   */

  const unbondings = useMemo(
    () =>
      delegationsResources.reduce(
        (total: BigNumber, delegation) => total.plus(delegation.userUnBondable),
        new BigNumber(0),
      ),
    [delegationsResources],
  );

  /*
   * Handle the data displayed, formatted and memoized.
   */

  const items = useMemo(
    () =>
      formatItems([
        {
          title: "account.availableBalance",
          show: true,
          value: balance,
          modal: {
            title: "elrond.info.available.title",
            description: "elrond.info.available.description",
          },
        },
        {
          title: "account.delegatedAssets",
          show: delegations.isGreaterThan(0),
          value: delegations,
          modal: {
            title: "elrond.info.delegated.title",
            description: "elrond.info.delegated.description",
          },
        },
        {
          title: "account.undelegating",
          show: unbondings.isGreaterThan(0),
          value: unbondings,
          modal: {
            title: "elrond.info.undelegating.title",
            description: "elrond.info.undelegating.description",
          },
        },
      ]),
    [balance, delegations, unbondings, formatItems],
  );

  /*
   * Track all callback reference updates and run the effect conditionally.
   */

  useEffect(fetchDelegations, [fetchDelegations]);

  /*
   * Return the rendered component.
   */

  return (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.root}>
      <InfoModal isOpened={data.length > 0} onClose={onCloseModal} data={data} />

      {items.map((item, index) => (
        <InfoItem
          key={item.title}
          title={t(item.title)}
          onPress={() => setData([item.modal])}
          isLast={index === items.length - 1}
          value={<CurrencyUnitValue unit={unit} value={new BigNumber(item.value)} />}
        />
      ))}
    </ScrollView>
  );
};

export default withSummary(Summary);
