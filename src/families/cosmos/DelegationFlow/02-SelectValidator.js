// @flow
import invariant from "invariant";
import React, { useCallback, useState, useMemo, useEffect } from "react";
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
  COSMOS_MAX_DELEGATIONS,
  getMaxDelegationAvailable,
} from "@ledgerhq/live-common/lib/families/cosmos/logic";

import {
  useCosmosPreloadData,
  useSortedValidators,
} from "@ledgerhq/live-common/lib/families/cosmos/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import LText from "../../../components/LText";
import Item from "../shared/Item";
import Check from "../../../icons/Check";

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  fromSelectAmount?: true,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function DelegationSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account required");

  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);

  const { cosmosResources } = mainAccount;

  invariant(cosmosResources, "cosmosResources required");

  const { transaction, status, updateTransaction } = useBridgeTransaction(
    () => {
      const tx = route.params.transaction;

      if (!tx) {
        const t = bridge.createTransaction(mainAccount);

        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "delegate",
            validators: [],
            /** @TODO remove this once the bridge handles it */
            recipient: mainAccount.freshAddress,
          }),
        };
      }

      return { account, transaction: tx };
    },
  );

  useEffect(() => {
    if (!route.params.fromSelectAmount) {
      return;
    }

    updateTransaction(_ => route.params.transaction);
  }, [route.params, updateTransaction]);

  invariant(
    transaction && transaction.validators,
    "transaction and validators required",
  );

  const unit = getAccountUnit(account);

  const [searchQuery, setSearchQuery] = useState("");

  const { validators } = useCosmosPreloadData();
  const SR = useSortedValidators(searchQuery, validators, []);

  const delegationsSelected = transaction.validators.length;
  const delegationsUsed = transaction.validators.reduce(
    (sum, v) => sum.plus(v.amount),
    BigNumber(0),
  );
  const max = getMaxDelegationAvailable(mainAccount, delegationsSelected).minus(
    delegationsUsed,
  );

  const selectedValidators = transaction.validators;
  const delegations = cosmosResources.delegations;
  const allSelectedValidators = delegations
    .map(d => ({
      ...d,
      address: d.validatorAddress,
    }))
    .concat(selectedValidators);

  const sections = useMemo(
    () =>
      SR.reduce(
        (data, validator) => {
          const isSelected = allSelectedValidators.some(
            ({ address }) => address === validator.validator.validatorAddress,
          );
          if (isSelected) data[0].data.push(validator);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSelectedValidators, allSelectedValidators.length, SR],
  );

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CosmosDelegationSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);

  const onSelect = useCallback(
    (validator, value) => {
      const d = delegations.find(
        d => d.validatorAddress === validator.validatorAddress,
      );
      navigation.navigate(ScreenName.CosmosDelegationAmount, {
        ...route.params,
        transaction,
        validator,
        min: null,
        max,
        value,
        status,
        nextScreen: ScreenName.CosmosDelegationValidator,
        redelegatedBalance: d ? d.amount : null,
      });
    },
    [navigation, route.params, transaction, status, max, delegations],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const val = selectedValidators.find(
        ({ address }) => address === item.validator.validatorAddress,
      );
      const d = delegations.find(
        d => d.validatorAddress === item.validator.validatorAddress,
      );
      const disabled =
        (!val || val.amount.lte(0)) &&
        (max.lte(0) || delegationsSelected > COSMOS_MAX_DELEGATIONS);
      return (
        <Item
          disabled={disabled}
          value={val ? val.amount : null}
          delegatedValue={d ? d.amount : BigNumber(0)}
          unit={unit}
          item={item}
          onSelect={onSelect}
        />
      );
    },
    [selectedValidators, unit, onSelect, max, delegations, delegationsSelected],
  );

  const error = status && status.errors && Object.values(status.errors)[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <SelectValidatorSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      {sections.length <= 0 && (
        <View style={styles.noResult}>
          <LText style={styles.textCenter}>
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
        sections={sections}
        keyExtractor={(item, index) => item + index}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section: { title } }) => (
          <LText
            style={[styles.header, { backgroundColor: colors.lightFog }]}
            color="grey"
          >
            {title}
          </LText>
        )}
      />

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.lightFog, backgroundColor: colors.white },
        ]}
      >
        <View style={styles.paddingBottom}>
          {max.isZero() && (
            <View style={styles.labelContainer}>
              <Check size={16} color={colors.success} />
              <LText style={[styles.assetsRemaining]} color="success">
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
        </View>
        <Button
          disabled={!!error}
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
  },
  noResult: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 32,
    paddingHorizontal: 16,
    lineHeight: 32,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  assetsRemaining: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 10,
  },
  small: {
    fontSize: 12,
  },
  textCenter: { textAlign: "center" },
  paddingBottom: {
    paddingBottom: 8,
  },
});

export default DelegationSelectValidator;
