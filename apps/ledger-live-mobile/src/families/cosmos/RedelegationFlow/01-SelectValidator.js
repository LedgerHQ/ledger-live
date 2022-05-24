// @flow
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, SectionList } from "react-native";
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

import { useLedgerFirstShuffledValidatorsCosmos } from "@ledgerhq/live-common/lib/families/cosmos/react";
import { useTheme } from "@react-navigation/native";
import ValidatorRow from "../shared/ValidatorRow";
import ValidatorHead from "../shared/ValidatorHead";

import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import LText from "../../../components/LText";

type RouteParams = {
  accountId: string,
  validatorSrcAddress: string,
  transaction: Transaction,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function RedelegationSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account required");

  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);

  const { cosmosResources } = mainAccount;

  invariant(cosmosResources, "cosmosResources required");

  const delegations = cosmosResources.delegations;

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);

    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "redelegate",
        validators: [],
        cosmosSourceValidator: route.params?.validatorSrcAddress,
        /** @TODO remove this once the bridge handles it */
        recipient: mainAccount.freshAddress,
      }),
    };
  });

  invariant(
    transaction && transaction.cosmosSourceValidator,
    "transaction src validator required",
  );

  const validators = useLedgerFirstShuffledValidatorsCosmos();

  const validatorSrc = useMemo(
    () =>
      validators.find(
        ({ validatorAddress }) =>
          validatorAddress === transaction.cosmosSourceValidator,
      ),
    [validators, transaction.cosmosSourceValidator],
  );

  const srcDelegation = useMemo(
    () =>
      delegations.find(
        ({ validatorAddress }) =>
          validatorAddress === transaction.cosmosSourceValidator,
      ),
    [delegations, transaction.cosmosSourceValidator],
  );

  invariant(srcDelegation, "source delegation required");

  const max = srcDelegation.amount;

  const sections = useMemo(
    () =>
      validators
        .reduce(
          (data, validator) => {
            if (
              validator.validatorAddress === transaction?.cosmosSourceValidator
            )
              return data;

            if (
              delegations.some(
                ({ validatorAddress }) =>
                  validatorAddress === validator.validatorAddress,
              )
            )
              data[0].data.push(validator);
            else data[1].data.push(validator);
            return data;
          },
          [
            {
              title: (
                <Trans i18nKey="cosmos.redelegation.flow.steps.validator.myDelegations" />
              ),
              data: [],
            },
            {
              title: (
                <Trans i18nKey="cosmos.redelegation.flow.steps.validator.validators" />
              ),
              data: [],
            },
          ],
        )
        .filter(({ data }) => data.length > 0),
    [delegations, transaction, validators],
  );

  const onSelect = useCallback(
    (validator, redelegatedBalance) => {
      navigation.navigate(ScreenName.CosmosRedelegationAmount, {
        ...route.params,
        transaction,
        validatorSrc,
        validator,
        max,
        redelegatedBalance,
        status,
        nextScreen: ScreenName.CosmosRedelegationSelectDevice,
      });
    },
    [navigation, route.params, transaction, status, max, validatorSrc],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ValidatorRow account={account} validator={item} onPress={onSelect} />
    ),
    [onSelect],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {sections.length <= 0 && (
        <View style={styles.noResult}>
          <LText>
            <Trans i18nKey="cosmos.redelegation.flow.steps.validator.noResultsFound">
              <LText bold>{""}</LText>
            </Trans>
          </LText>
        </View>
      )}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.header]}>
            <ValidatorHead title={title} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noResult: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 32,
    fontSize: 14,
    lineHeight: 32,
  },
});

export default RedelegationSelectValidator;
