// @flow
import React, { memo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import type { SuperRepresentative } from "@ledgerhq/live-common/lib/families/tron/types";

import { useTheme } from "@react-navigation/native";
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
  const { colors } = useTheme();
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
      style={[
        styles.wrapper,
        isDisabled ? { backgroundColor: colors.card } : {},
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          !isSR
            ? { backgroundColor: colors.lightFog }
            : { backgroundColor: colors.lightLive },
        ]}
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
          style={[styles.nameText]}
          numberOfLines={1}
          color={isDisabled ? "grey" : "darkBlue"}
        >
          {rank}. {(sr && sr.name) || address}
        </LText>

        <LText style={styles.subText} color="grey" numberOfLines={1}>
          <Trans
            i18nKey="vote.castVotes.nbOfVotes"
            values={{ amount: Number(sr.voteCount).toLocaleString() }}
          />
        </LText>
      </View>
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
    marginRight: 12,
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
  },
});

export default memo<Props>(Item);
