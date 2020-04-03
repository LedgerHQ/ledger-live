/* @flow */
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import { useSelector } from "react-redux";
import i18next from "i18next";
import { translate } from "react-i18next";
import type { TFunction } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import {
  useTronSuperRepresentatives,
  useSortedSr,
} from "@ledgerhq/live-common/lib/families/tron/react";
import { accountAndParentScreenSelector } from "../../../../reducers/accounts";
import colors from "../../../../colors";
import { TrackScreen } from "../../../../analytics";
import { defaultNavigationOptions } from "../../../../navigation/navigatorConfig";
import StepHeader from "../../../../components/StepHeader";
import SelectValidatorMain from "./Main";
import SelectValidatorFooter from "./Footer";
import { getIsVoted, SelectValidatorProvider } from "./utils";
import type { Section } from "./utils";

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
  t: TFunction,
};

function SelectValidator({ navigation, t }: Props) {
  const { account } = useSelector(state =>
    accountAndParentScreenSelector(state, { navigation }),
  );
  invariant(account, "account and tron resources required");

  const bridge = getAccountBridge(account, undefined);
  const { tronResources } = account;
  invariant(tronResources, "Tron resources required");

  const { tronPower } = tronResources;

  const {
    transaction,
    status,
    setTransaction,
    bridgePending,
  } = useBridgeTransaction(() => {
    const tx = navigation.getParam("transaction");

    if (!tx) {
      const t = bridge.createTransaction(account);
      const { votes } = tronResources;

      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "vote",
          votes,
        }),
      };
    }

    return { account, transaction: tx };
  });

  invariant(transaction, "transaction is required");
  invariant(transaction.votes, "transaction.votes is required");

  const [searchQuery, setSearchQuery] = useState("");
  const superRepresentatives = useTronSuperRepresentatives();
  const sortedSuperRepresentatives = useSortedSr(
    searchQuery,
    superRepresentatives,
    transaction.votes || [],
  );

  const sections = useMemo<Section[]>(() => {
    const selected = sortedSuperRepresentatives.filter(({ address }) =>
      getIsVoted(transaction, address),
    );

    if (!selected.length) {
      return [
        {
          type: "superRepresentatives",
          data: sortedSuperRepresentatives.filter(({ isSR }) => isSR),
        },
        {
          type: "candidates",
          data: sortedSuperRepresentatives.filter(({ isSR }) => !isSR),
        },
      ];
    }

    return [
      {
        type: "selected",
        data: selected,
      },
      {
        type: "superRepresentatives",
        data: sortedSuperRepresentatives.filter(
          ({ address, isSR }) => !getIsVoted(transaction, address) && isSR,
        ),
      },
      {
        type: "candidates",
        data: sortedSuperRepresentatives.filter(
          ({ address, isSR }) => !getIsVoted(transaction, address) && !isSR,
        ),
      },
    ];
  }, [sortedSuperRepresentatives, transaction]);

  const onSelectSuperRepresentative = useCallback(
    ({ address }) => {
      const isVoted = getIsVoted(transaction, address);
      const newVotes = isVoted
        ? transaction.votes.filter(v => v.address !== address)
        : [...transaction.votes, { address, voteCount: 0 }];
      const tx = bridge.updateTransaction(transaction, {
        votes: newVotes,
      });
      setTransaction(tx);
    },
    [bridge, setTransaction, transaction],
  );

  const onContinue = useCallback(() => {
    const { votes } = transaction;
    const tx =
      votes.length === 1 && votes[0].voteCount === 0
        ? bridge.updateTransaction(transaction, {
            votes: [{ ...votes[0], voteCount: tronPower }],
          })
        : transaction;

    navigation.navigate("CastVote", {
      accountId: account.id,
      transaction: tx,
      status,
    });
  }, [account, navigation, transaction, status, tronPower, bridge]);

  const remainingCount =
    DEFAULT_REPRESENTATIVES_COUNT - transaction.votes.length;

  return (
    <>
      <TrackScreen category="Vote" name="SelectValidator" />

      <SelectValidatorProvider
        value={{
          bridgePending,
          onContinue,
          onSelectSuperRepresentative,
          remainingCount,
          searchQuery,
          sections,
          setSearchQuery,
          status,
          transaction,
          t,
        }}
      >
        <SafeAreaView style={styles.root} forceInset={forceInset}>
          <SelectValidatorMain />
          <SelectValidatorFooter />
        </SafeAreaView>
      </SelectValidatorProvider>
    </>
  );
}

const DEFAULT_REPRESENTATIVES_COUNT = 5;

SelectValidator.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("vote.stepperHeader.selectValidator")}
      subtitle={i18next.t("vote.stepperHeader.stepRange", {
        currentStep: "1",
        totalSteps: "4",
      })}
    />
  ),
  headerLeft: null,
  headerStyle: {
    ...defaultNavigationOptions.headerStyle,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
};

export default translate()(SelectValidator);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topContainer: { paddingHorizontal: 32 },
});
