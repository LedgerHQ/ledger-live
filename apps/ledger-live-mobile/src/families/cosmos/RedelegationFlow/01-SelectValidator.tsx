import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
} from "react-native";
import BigNumber from "bignumber.js";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import type {
  CosmosAccount,
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import { useTheme } from "@react-navigation/native";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import ValidatorRow from "../shared/ValidatorRow";
import ValidatorHead from "../shared/ValidatorHead";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import LText from "../../../components/LText";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import type { CosmosRedelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  CosmosRedelegationFlowParamList,
  ScreenName.CosmosRedelegationValidator
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
  const bridgeTransaction = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "redelegate",
        validators: [],
        sourceValidator: route.params?.validatorSrcAddress,
      }),
    };
  });
  const { status } = bridgeTransaction;
  const transaction = bridgeTransaction.transaction as Transaction;
  invariant(
    transaction && transaction.sourceValidator,
    "transaction src validator required",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(
    mainAccount.currency.id,
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
  const max = srcDelegation?.amount;
  const sections: SectionListData<CosmosValidatorItem>[] = useMemo(
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
    (validator: CosmosValidatorItem) => {
      navigation.navigate(ScreenName.CosmosRedelegationAmount, {
        ...route.params,
        transaction,
        validatorSrc,
        validator,
        max: max ?? new BigNumber(0),
        status,
        nextScreen: ScreenName.CosmosRedelegationSelectDevice,
      });
    },
    [navigation, route.params, transaction, status, max, validatorSrc],
  );
  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<CosmosValidatorItem>) => (
      <ValidatorRow account={account} validator={item} onPress={onSelect} />
    ),
    [onSelect, account],
  );

  if (!srcDelegation) return null;

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
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
        // FIXME: an addition with an object?
        keyExtractor={(item: CosmosValidatorItem, index: number) =>
          item.toString() + index
        }
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
