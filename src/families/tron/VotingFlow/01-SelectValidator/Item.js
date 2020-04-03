// @flow
import React, { memo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import type { SuperRepresentative } from "@ledgerhq/live-common/lib/families/tron/types";

import colors from "../../../../colors";
import CheckBox from "../../../../components/CheckBox";
import LText from "../../../../components/LText";
import Trophy from "../../../../icons/Trophy";
import Medal from "../../../../icons/Medal";

type ItemProp = {
  address: string,
  sr: SuperRepresentative,
  isSR: boolean,
  rank: number,
  name: ?string,
};

type Props = {
  item: ItemProp,
  disabled: boolean,
  onSelectSuperRepresentative: (item: ItemProp, selected: boolean) => void,
  selected: boolean,
};

function Item({
  item,
  selected,
  disabled,
  onSelectSuperRepresentative,
}: Props) {
  const { sr, isSR, rank, address } = item;

  const onSelect = useCallback(
    () => onSelectSuperRepresentative(item, selected),
    [onSelectSuperRepresentative, item, selected],
  );

  const isDisabled = !selected && disabled;

  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={isDisabled}
      style={[styles.wrapper, isDisabled ? styles.disabledWrapper : {}]}
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
        <LText
          semiBold
          style={[styles.nameText, isDisabled ? styles.disabledText : {}]}
          numberOfLines={1}
        >
          {rank}. {(sr && sr.name) || address}
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
        <CheckBox isChecked={selected} disabled={disabled} />
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
  disabledWrapper: {
    backgroundColor: colors.lightGrey,
  },
  disabledText: {
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

export default memo<Props>(Item);
