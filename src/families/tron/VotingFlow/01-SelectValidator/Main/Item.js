// @flow
import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import colors from "../../../../../colors";
import CheckBox from "../../../../../components/CheckBox";
import LText from "../../../../../components/LText";
import Trophy from "../../../../../icons/Trophy";
import Medal from "../../../../../icons/Medal";
import { getIsVoted } from "../utils";
import type { Item as ItemProp } from "../utils";

type Props = {
  item: ItemProp,
  transaction: Transaction,
  remainingCount: number,
  onSelectSuperRepresentative: (item: ItemProp) => void,
};

export default function Item({
  item,
  transaction,
  remainingCount,
  onSelectSuperRepresentative,
}: Props) {
  const { address, sr, isSR, rank } = item;
  const isVoted = useMemo(
    () => getIsVoted(transaction, address),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transaction.votes, address],
  );
  const disabled = !isVoted && remainingCount <= 0;

  return (
    <TouchableOpacity
      onPress={() => onSelectSuperRepresentative(item)}
      disabled={disabled}
      style={styles.wrapper}
    >
      <View
        style={[styles.iconWrapper, !isSR ? styles.iconWrapperCandidate : {}]}
      >
        {isSR ? (
          <Trophy size={16} color={colors.live} />
        ) : (
          <Medal size={16} color={colors.grey} />
        )}
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold style={styles.nameText} numberOfLines={1}>
          {rank}. {sr.name}
        </LText>

        <LText style={styles.subText} numberOfLines={1}>
          <Trans
            i18nKey="vote.castVotes.nbOfVotes"
            values={{ amount: Number(sr.voteCount).toLocaleString() }}
          />
        </LText>
      </View>

      {/** <View style={styles.yieldWrapper}>
        <LText semiBold style={styles.yieldText}>
          {"6,8"} %
        </LText>

        <LText style={styles.subText}>Est. yield</LText>
      </View> */}

      <View>
        <CheckBox isChecked={isVoted} disabled={disabled} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconWrapper: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: colors.lightLive,
    marginRight: 12,
  },
  iconWrapperCandidate: {
    backgroundColor: colors.lightFog,
  },
  nameWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  nameText: {
    fontSize: 15,
  },
  subText: {
    fontSize: 13,
    color: colors.grey,
  },
  // yieldWrapper: {
  //   alignItems: "center",
  //   marginRight: 12,
  // },
  // yieldText: {
  //   fontSize: 17,
  // },
});
