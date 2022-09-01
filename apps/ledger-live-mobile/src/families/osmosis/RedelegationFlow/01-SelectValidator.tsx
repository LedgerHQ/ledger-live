import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import type {
  Transaction as OsmosisTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/osmosis/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import { useTheme } from "@react-navigation/native";
import {
  CosmosAccount,
  CosmosLikeTransaction,
  CosmosValidatorItem,
} from "@ledgerhq/live-common/families/cosmos/types";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import ValidatorRow from "../shared/ValidatorRow";
import ValidatorHead from "../../cosmos/shared/ValidatorHead";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import LText from "../../../components/LText";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import type { OsmosisRedelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  OsmosisRedelegationFlowParamList,
  ScreenName.OsmosisRedelegationValidator
>;

function RedelegationSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account required");

  const mainAccount = getMainAccount(account, undefined) as CosmosAccount;
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
        sourceValidator: route.params?.validatorSrcAddress,
        /** @TODO remove this once the bridge handles it */
        recipient: mainAccount.freshAddress,
      }),
    };
  }) as { transaction: CosmosLikeTransaction; status: TransactionStatus };

  invariant(transaction?.sourceValidator, "transaction src validator required");

  const [searchQuery, setSearchQuery] = useState("");
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(
    "osmosis",
    searchQuery,
  );

  const validatorSrc = useMemo(
    () =>
      validators.find(
        ({ validatorAddress }) =>
          validatorAddress === transaction.sourceValidator,
      ),
    [validators, transaction.sourceValidator],
  );

  const srcDelegation = useMemo(
    () =>
      delegations.find(
        ({ validatorAddress }) =>
          validatorAddress === transaction.sourceValidator,
      ),
    [delegations, transaction.sourceValidator],
  );

  invariant(srcDelegation, "source delegation required");

  const max = srcDelegation.amount;

  const sections = useMemo(
    () =>
      validators
        .reduce(
          (data, validator) => {
            if (validator.validatorAddress === transaction?.sourceValidator)
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
              data: [] as CosmosValidatorItem[],
            },
            {
              title: (
                <Trans i18nKey="cosmos.redelegation.flow.steps.validator.validators" />
              ),
              data: [] as CosmosValidatorItem[],
            },
          ],
        )
        .filter(({ data }) => data.length > 0),
    [delegations, transaction, validators],
  );

  const onSelect = useCallback(
    (validator: CosmosValidatorItem, redelegatedBalance?) => {
      navigation.navigate(ScreenName.OsmosisRedelegationAmount, {
        ...route.params,
        transaction: transaction as OsmosisTransaction,
        validatorSrc,
        validator,
        max,
        redelegatedBalance,
        status,
        nextScreen: ScreenName.OsmosisRedelegationSelectDevice,
      });
    },
    [navigation, route.params, transaction, status, max, validatorSrc],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ValidatorRow account={account} validator={item} onPress={onSelect} />
    ),
    [onSelect, account],
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
      <SelectValidatorSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <SectionList
        style={[styles.section]}
        sections={sections}
        // FIXME: weird object + number addition????
        keyExtractor={(item, index) => item.toString() + index}
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
  section: {
    paddingHorizontal: 16,
  },
});

export default RedelegationSelectValidator;
