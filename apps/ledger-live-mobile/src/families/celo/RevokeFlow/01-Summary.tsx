import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useValidatorGroups } from "@ledgerhq/live-common/families/celo/react";
import type { CeloValidatorGroup, CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import { revokableVotes } from "@ledgerhq/live-common/families/celo/logic";
import { AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo } from "react";
import { Trans } from "react-i18next";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import Selectable from "../components/Selectable";
import Line from "../components/Line";
import Words from "../components/Words";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CeloRevokeFlowFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<CeloRevokeFlowFlowParamList, ScreenName.CeloRevokeSummary>
>;

export default function RevokeSummary({ navigation, route }: Props) {
  const { validator } = route.params;
  const { vote } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const validators = useValidatorGroups();
  const votes = revokableVotes(account as CeloAccount);
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, undefined);

  const chosenValidator = useMemo(() => {
    if (validator !== undefined) {
      return validator;
    }

    if (votes.length) {
      return validators.find(v => v.address === votes[0].validatorGroup);
    }

    return undefined;
  }, [votes, validator, validators]);

  const chosenVote = useMemo(() => {
    if (vote !== undefined) {
      return vote;
    }

    if (votes.length) {
      return votes[0];
    }

    return undefined;
  }, [vote, votes]);

  const { transaction, updateTransaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const tx = route.params.transaction;

      if (!tx) {
        const t = bridge.createTransaction(mainAccount);

        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "revoke",
            amount: route.params.amount ?? 0,
          }),
        };
      }

      return { account, transaction: tx };
    });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "celo", "transaction celo");

  useEffect(() => {
    setTransaction(
      bridge.updateTransaction(transaction, {
        amount: new BigNumber(route.params.amount ?? new BigNumber(0)),
        recipient: chosenValidator?.address ?? "",
        index: chosenVote?.index,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params, updateTransaction, bridge, setTransaction, chosenValidator, chosenVote]);

  const onChangeDelegator = useCallback(() => {
    navigation.navigate(ScreenName.CeloRevokeValidatorSelect, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
    });
  }, [navigation, route.params, account.id, parentAccount?.id, transaction]);

  const onChangeAmount = () => {
    navigation.navigate(ScreenName.CeloRevokeAmount, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      vote: chosenVote,
    });
  };

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CeloRevokeSelectDevice, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [navigation, account.id, parentAccount?.id, transaction, status]);

  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="CeloRevoke"
        name="Summary"
        flow="stake"
        action="revoke"
        currency="celo"
      />

      <View style={styles.body}>
        <View style={styles.summary}>
          <SummaryWords
            onChangeValidator={onChangeDelegator}
            onChangeAmount={onChangeAmount}
            validator={chosenValidator}
            account={account}
            amount={transaction.amount}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  summary: {
    alignItems: "center",
    marginVertical: 30,
  },
  summaryLine: {
    marginVertical: 10,
    flexDirection: "row",
    height: 40,
    alignItems: "center",
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: 12,
  },
});

function SummaryWords({
  validator,
  account,
  amount,
  onChangeValidator,
  onChangeAmount,
}: {
  validator?: CeloValidatorGroup;
  account: AccountLike;
  amount: BigNumber;
  onChangeValidator: () => void;
  onChangeAmount: () => void;
}) {
  const unit = getAccountUnit(account);
  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });
  return (
    <>
      <Line>
        <Words>
          <Trans i18nKey={`celo.revoke.iRevoke`} />
        </Words>
        <Touchable onPress={onChangeAmount}>
          <Selectable name={formattedAmount} />
        </Touchable>
      </Line>
      <Line>
        <Words>
          <Trans i18nKey="delegation.from" />
        </Words>
        <Touchable onPress={onChangeValidator}>
          <Selectable name={validator?.name ?? validator?.address ?? "-"} />
        </Touchable>
      </Line>
    </>
  );
}
