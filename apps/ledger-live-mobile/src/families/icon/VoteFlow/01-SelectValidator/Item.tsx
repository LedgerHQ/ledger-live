import React, { memo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import { PRep } from "@ledgerhq/live-common/families/icon/types";

import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Box, BoxedIcon, Text } from "@ledgerhq/native-ui";
import { MedalMedium, TrophyMedium } from "@ledgerhq/native-ui/assets/icons";
import CheckBox from "../../../../components/CheckBox";
import { localeSelector } from "../../../../reducers/settings";

type ItemProp = {
  address: string;
  pr: PRep;
  isPR: boolean;
  rank: number;
  name?: string;
};

type Props = {
  item: ItemProp;
  disabled: boolean;
  onSelectPublicRepresentative: (item: ItemProp, selected: boolean) => void;
  selected: boolean;
};

function Item({
  item,
  selected,
  disabled,
  onSelectPublicRepresentative,
}: Props) {
  const locale = useSelector(localeSelector);
  const { colors } = useTheme();
  const { pr, isPR, rank, address } = item;

  const onSelect = useCallback(
    () => onSelectPublicRepresentative(item, selected),
    [onSelectPublicRepresentative, item, selected],
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
      <Box mr={4}>
        <BoxedIcon Icon={isPR ? TrophyMedium : MedalMedium} />
      </Box>

      <View style={styles.nameWrapper}>
        <Text
          variant={"body"}
          fontWeight={"semiBold"}
          color={isDisabled ? "neutral.c70" : "neutral.c100"}
          numberOfLines={1}
          pb={1}
        >
          {rank}. {(pr && pr.name) || address}
        </Text>
        <Text variant={"small"} fontWeight={"medium"} color={"neutral.c80"}>
          <Trans
            i18nKey="vote.castVotes.nbOfVotes"
            values={{ amount: Number(pr.delegated).toLocaleString(locale) }}
          />
        </Text>
      </View>
      <View>
        <CheckBox
          onChange={onSelect}
          isChecked={selected}
          disabled={disabled}
        />
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
