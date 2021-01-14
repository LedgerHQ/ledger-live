/* @flow */
import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, TouchableOpacity, FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import {
  useTronSuperRepresentatives,
  useSortedSr,
  SR_MAX_VOTES,
  SR_THRESHOLD,
} from "@ledgerhq/live-common/lib/families/tron/react";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { ScreenName } from "../../../../const";
import { TrackScreen } from "../../../../analytics";
import SelectValidatorFooter from "./Footer";
import InfoModal from "../../../../modals/Info";
import Trophy from "../../../../icons/Trophy";
import Medal from "../../../../icons/Medal";
import Info from "../../../../icons/Info";
import SelectValidatorSearchBox from "./SearchBox";
import Item from "./Item";

const forceInset = { bottom: "always" };

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  fromStep2?: boolean,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account and tron resources required");

  const bridge = getAccountBridge(account, undefined);
  const { tronResources } = account;
  invariant(tronResources, "Tron resources required");

  const { tronPower } = tronResources;

  const { transaction, setTransaction } = useBridgeTransaction(() => {
    const tx = route.params.transaction;

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

    if (route.params.fromStep2) {
      navigation.pop(2);
    }

    navigation.navigate(ScreenName.VoteCast, {
      accountId: account.id,
      transaction: tx,
    });
  }, [
    account,
    navigation,
    transaction,
    tronPower,
    bridge,
    route.params.fromStep2,
  ]);

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
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
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

export function SelectValidatorHeaderLeft() {
  const { colors } = useTheme();
  const [infoModalOpen, setInfoModalOpen] = useState();

  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);

  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);

  const infoModalData = [
    {
      Icon: () => <Trophy size={18} color={colors.live} />,
      title: <Trans i18nKey="tron.info.superRepresentative.title" />,
      description: (
        <Trans i18nKey="tron.info.superRepresentative.description" />
      ),
    },
    {
      Icon: () => <Medal size={18} color={colors.grey} />,
      title: <Trans i18nKey="tron.info.candidates.title" />,
      description: <Trans i18nKey="tron.info.candidates.description" />,
    },
  ];

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
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  topContainer: { paddingHorizontal: 32 },
});
