// @flow
import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, SectionList } from "react-native";
import { BigNumber } from "bignumber.js";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";

import type { Transaction } from "@ledgerhq/live-common/lib/families/cosmos/types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";

import {
  useCosmosPreloadData,
  useSortedValidators,
} from "@ledgerhq/live-common/lib/families/cosmos/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

import { accountScreenSelector } from "../../../reducers/accounts";
import colors from "../../../colors";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import LText from "../../../components/LText";
import Item from "./Item";
import Check from "../../../icons/Check";

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function DelegationSelectValidator({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));

  invariant(
    account && account.cosmosResources,
    "account and cosmos resources required",
  );

  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);

  const cosmosResources = account.cosmosResources || {};
  const delegations = cosmosResources.delegations;

  const { transaction, status } = useBridgeTransaction(() => {
    const tx = route.params.transaction;

    if (!tx) {
      const t = bridge.createTransaction(mainAccount);

      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "delegate",
          validators: delegations.map(({ validatorAddress, amount }) => ({
            address: validatorAddress,
            amount,
          })),
          /** @TODO remove this once the bridge handles it */
          recipient: mainAccount.freshAddress,
        }),
      };
    }

    return { account, transaction: tx };
  });

  const unit = getAccountUnit(account);

  const [searchQuery, setSearchQuery] = useState("");

  const { validators } = useCosmosPreloadData();
  const SR = useSortedValidators(searchQuery, validators, delegations);

  const delegationsAvailable = cosmosResources.delegatedBalance.plus(
    account.spendableBalance,
  );
  const delegationsUsed = transaction.validators.reduce(
    (sum, v) => sum.plus(v.amount),
    BigNumber(0),
  );
  const max = delegationsAvailable.minus(delegationsUsed);

  const selectedValidators = useMemo(() => transaction.validators || [], [
    transaction,
  ]);

  const sections = useMemo(
    () =>
      SR.reduce(
        (data, validator) => {
          if (
            selectedValidators.some(
              ({ address }) => address === validator.validator.validatorAddress,
            )
          )
            data[0].data.push(validator);
          else data[1].data.push(validator);
          return data;
        },
        [
          {
            title: (
              <Trans i18nKey="cosmos.delegation.flow.steps.validator.myDelegations" />
            ),
            data: [],
          },
          {
            title: (
              <Trans i18nKey="cosmos.delegation.flow.steps.validator.validators" />
            ),
            data: [],
          },
        ],
      ).filter(({ data }) => data.length > 0),
    [selectedValidators, SR],
  );

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CosmosDelegationConnectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);

  const onSelect = useCallback(
    (validator, value) => {
      navigation.navigate(ScreenName.CosmosDelegationAmount, {
        ...route.params,
        transaction,
        validator,
        max,
        value,
        status,
      });
    },
    [navigation, route.params, transaction, status, max],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const val = selectedValidators.find(
        ({ address }) => address === item.validator.validatorAddress,
      );
      const disabled = (!val || val.amount.lte(0)) && max.lte(0);
      return (
        <Item
          disabled={disabled}
          value={val ? val.amount : null}
          unit={unit}
          item={item}
          onSelect={onSelect}
        />
      );
    },
    [selectedValidators, unit, onSelect, max],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.main}>
        <View style={styles.searchSection}>
          <SelectValidatorSearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </View>
        {sections.length <= 0 && (
          <View style={styles.noResult}>
            <LText>
              <Trans
                i18nKey="cosmos.delegation.flow.steps.validator.noResultsFound"
                values={{ search: searchQuery }}
              >
                <LText bold>{""}</LText>
              </Trans>
            </LText>
          </View>
        )}
        <SectionList
          style={styles.list}
          sections={sections}
          keyExtractor={(item, index) => item + index}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <LText style={styles.header}>{title}</LText>
          )}
        />
      </View>

      <View style={styles.footer}>
        {max.isZero() && (
          <View style={styles.labelContainer}>
            <Check size={16} color={colors.success} />
            <LText style={[styles.assetsRemaining, styles.success]}>
              <Trans i18nKey="cosmos.delegation.flow.steps.validator.allAssetsUsed" />
            </LText>
          </View>
        )}
        {max.gt(0) && (
          <View style={styles.labelContainer}>
            <LText style={styles.assetsRemaining}>
              <Trans
                i18nKey="cosmos.delegation.flow.steps.validator.totalAvailable"
                values={{
                  amount: formatCurrencyUnit(unit, max, {
                    showCode: true,
                  }),
                }}
              >
                <LText semiBold>{""}</LText>
              </Trans>
            </LText>
          </View>
        )}
        <Button
          event="Cosmos DelegationSelectValidatorContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="cosmos.delegation.flow.steps.validator.cta" />}
          type="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  searchSection: { height: 55, paddingHorizontal: 16 },
  list: { width: "100%" },
  noResult: {
    flex: 1,
    justifyContent: "flex-end",
  },
  header: {
    width: "100%",
    height: 32,
    paddingHorizontal: 16,
    fontSize: 14,
    lineHeight: 32,
    backgroundColor: colors.lightFog,
    color: colors.grey,
  },
  footer: {
    alignSelf: "stretch",
    padding: 16,
    backgroundColor: colors.white,
  },
  labelContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
  },
  assetsRemaining: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 10,
  },
  error: {
    color: colors.alert,
  },
  success: {
    color: colors.success,
  },
});

export default DelegationSelectValidator;
