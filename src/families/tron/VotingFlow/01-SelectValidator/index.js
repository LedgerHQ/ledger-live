/* @flow */
import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-navigation";
import { useSelector } from "react-redux";
import i18next from "i18next";
import { Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import {
  useTronSuperRepresentatives,
  useSortedSr,
  SR_MAX_VOTES,
  SR_THRESHOLD,
} from "@ledgerhq/live-common/lib/families/tron/react";
import { accountAndParentScreenSelector } from "../../../../reducers/accounts";
import colors from "../../../../colors";
import { TrackScreen } from "../../../../analytics";
import { defaultNavigationOptions } from "../../../../navigation/navigatorConfig";
import StepHeader from "../../../../components/StepHeader";

import SelectValidatorFooter from "./Footer";

import InfoModal from "../../../../modals/Info";

import Trophy from "../../../../icons/Trophy";
import Medal from "../../../../icons/Medal";
import Info from "../../../../icons/Info";
import SelectValidatorSearchBox from "./SearchBox";
import Item from "./Item";

const infoModalData = [
  {
    Icon: () => <Trophy size={18} color={colors.live} />,
    title: <Trans i18nKey="tron.info.superRepresentative.title" />,
    description: <Trans i18nKey="tron.info.superRepresentative.description" />,
  },
  {
    Icon: () => <Medal size={18} color={colors.grey} />,
    title: <Trans i18nKey="tron.info.candidates.title" />,
    description: <Trans i18nKey="tron.info.candidates.description" />,
  },
];

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
};

function SelectValidator({ navigation }: Props) {
  const { account } = useSelector(state =>
    accountAndParentScreenSelector(state, { navigation }),
  );
  invariant(account, "account and tron resources required");

  const bridge = getAccountBridge(account, undefined);
  const { tronResources } = account;
  invariant(tronResources, "Tron resources required");

  const { tronPower } = tronResources;

  const { transaction, setTransaction } = useBridgeTransaction(() => {
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

  const { votes } = transaction;

  const sortedSuperRepresentatives = useSortedSr(
    searchQuery,
    superRepresentatives,
    votes || [],
  );

  const onSelectSuperRepresentative = useCallback(
    ({ address }, selected) => {
      const newVotes = selected
        ? votes.filter(v => v.address !== address)
        : [...votes, { address, voteCount: 0 }];
      const tx = bridge.updateTransaction(transaction, {
        votes: newVotes,
      });
      setTransaction(tx);
    },
    [bridge, setTransaction, transaction, votes],
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
    });
  }, [account, navigation, transaction, tronPower, bridge]);

  const remainingCount = SR_MAX_VOTES - votes.length;

  const disabled = useMemo(
    () => votes.length === 0 || votes.length > SR_MAX_VOTES,
    [votes],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Item
        item={item}
        selected={votes.some(v => v.address === item.address)}
        disabled={remainingCount === 0}
        onSelectSuperRepresentative={onSelectSuperRepresentative}
      />
    ),
    [onSelectSuperRepresentative, remainingCount, votes],
  );

  return (
    <>
      <TrackScreen category="Vote" name="SelectValidator" />
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <SelectValidatorSearchBox
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <FlatList
          keyExtractor={({ address }) => address}
          initialNumToRender={SR_THRESHOLD}
          data={sortedSuperRepresentatives}
          renderItem={renderItem}
        />
        <SelectValidatorFooter onContinue={onContinue} disabled={disabled} />
      </SafeAreaView>
    </>
  );
}

const HeaderLeft = () => {
  const [infoModalOpen, setInfoModalOpen] = useState();

  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);

  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);

  return (
    <>
      <TouchableOpacity style={styles.headerButton} onPress={openInfoModal}>
        <Info size={16} color={colors.grey} />
      </TouchableOpacity>
      <InfoModal
        isOpened={!!infoModalOpen}
        onClose={closeInfoModal}
        data={infoModalData}
      />
    </>
  );
};

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
  headerLeft: <HeaderLeft />,
  headerStyle: {
    ...defaultNavigationOptions.headerStyle,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  gesturesEnabled: false,
};

export default SelectValidator;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  topContainer: { paddingHorizontal: 32 },
});
