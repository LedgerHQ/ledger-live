import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  SR_MAX_VOTES,
  SR_THRESHOLD, useIconPublicRepresentatives, useSortedSr
} from "@ledgerhq/live-common/families/icon/react";
import { IconAccount, Transaction as IconTransaction } from "@ledgerhq/live-common/families/icon/types";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../../analytics";
import { StackNavigatorProps } from "../../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../../const";
import Info from "../../../../icons/Info";
import Medal from "../../../../icons/Medal";
import Trophy from "../../../../icons/Trophy";
import InfoModal from "../../../../modals/Info";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { IconVoteFlowParamList } from "../types";
import SelectValidatorFooter from "./Footer";
import Item from "./Item";
import SelectValidatorSearchBox from "./SearchBox";

type Props = StackNavigatorProps<
  IconVoteFlowParamList,
  ScreenName.IconVoteSelectValidator
>;
export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account and icon resources required");
  invariant(account.type === "Account", "not main account");

  const bridge = getAccountBridge(account, undefined);
  const iconResources = useMemo(
    () => (account as IconAccount).iconResources || null,
    [account],
  );
  invariant(iconResources, "Icon resources required");
  const { votingPower } = iconResources;

  const { transaction, setTransaction } = useBridgeTransaction(() => {
    const tx = route.params.transaction;;
    if (!tx) {
      const t = bridge.createTransaction(account);
      const { votes } = iconResources;
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "vote",
          votes: votes.map((item)=>{ return {...item, value:Number(item?.value || 0)}}),
          }),
      };
    }
    return {
      account,
      transaction: tx,
    };
  });
invariant(transaction, "transaction is required");
invariant(
  (transaction as IconTransaction).votes,
  "transaction.votes is required",
);
const [searchQuery, setSearchQuery] = useState("");
const publicRepresentatives = useIconPublicRepresentatives(account.currency);
const { votes } = transaction as IconTransaction;
const sortedPublicRepresentatives = useSortedSr(
  searchQuery,
  publicRepresentatives,
  votes || [],
);
const onSelectPublicRepresentative = useCallback(
  ({ address }, selected) => {
    const newVotes = selected
      ? votes.filter(v => v.address !== address)
      : [
        ...votes,
        {
          address,
          value: 0,
        },
      ];
    const tx = bridge.updateTransaction(transaction, {
      votes: newVotes,
    });
    setTransaction(tx);
  },
  [bridge, setTransaction, transaction, votes],
);
const onContinue = useCallback(() => {
  const { votes } = transaction as IconTransaction;
  const tx =
    votes.length === 1 && Number(votes[0].value) === 0
      ? bridge.updateTransaction(transaction, {
        votes: [{ ...votes[0], value: Number(votingPower) }],
      })
      : transaction;

  if (route.params.fromStep2) {
    navigation.pop(2);
  }

  navigation.navigate(ScreenName.IconVoteCast, {
    accountId: account.id,
    transaction: tx,
  });
}, [
  account,
  navigation,
  transaction,
  votingPower,
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
      onSelectPublicRepresentative={onSelectPublicRepresentative}
    />
  ),
  [onSelectPublicRepresentative, remainingCount, votes],
);
return (
  <>
    <TrackScreen category="Vote" name="SelectValidator" />
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <SelectValidatorSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <FlatList
        keyExtractor={({ address }) => address}
        initialNumToRender={SR_THRESHOLD}
        data={sortedPublicRepresentatives}
        renderItem={renderItem}
      />
      <SelectValidatorFooter onContinue={onContinue} disabled={disabled} />
    </SafeAreaView>
  </>
);
}
export function SelectValidatorHeaderLeft() {
  const { colors } = useTheme();
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>();
  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);
  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);
  const infoModalData = [
    {
      Icon: () => <Trophy size={18} color={colors.live} />,
      title: <Trans i18nKey="icon.info.publicRepresentative.title" />,
      description: (
        <Trans i18nKey="icon.info.publicRepresentative.description" />
      ),
    },
    {
      Icon: () => <Medal size={18} color={colors.grey} />,
      title: <Trans i18nKey="icon.info.subPRepresentative.title" />,
      description: <Trans i18nKey="icon.info.subPRepresentative.description" />,
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
  topContainer: {
    paddingHorizontal: 32,
  },
});
