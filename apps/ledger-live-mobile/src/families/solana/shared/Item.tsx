import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { SolanaValidatorWithMeta } from "@ledgerhq/live-common/lib/families/solana/types";
import { Unit } from "@ledgerhq/live-common/lib/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import FirstLetterIcon from "../../../components/FirstLetterIcon";

type Props = {
  validatorWithMeta: SolanaValidatorWithMeta;
  onSelect: (validatorWithMeta: SolanaValidatorWithMeta) => void;
  unit: Unit;
};

function Item({ validatorWithMeta, onSelect, unit }: Props) {
  const { colors } = useTheme();
  const { validator, meta } = validatorWithMeta;

  const select = () => onSelect(validatorWithMeta);

  return (
    <TouchableOpacity onPress={select} style={[styles.wrapper]}>
      <View style={[styles.iconWrapper, { backgroundColor: colors.lightLive }]}>
        <FirstLetterIcon
          style={{ backgroundColor: colors.lightFog }}
          label={meta.name ?? validator.voteAccAddr}
        />
      </View>

      <View style={styles.nameWrapper}>
        <Text fontWeight="semiBold" style={[styles.nameText]} numberOfLines={1}>
          {meta.name ?? validator.voteAccAddr}
        </Text>

        <Text style={styles.subText} color="grey" numberOfLines={1}>
          {formatCurrencyUnit(unit, new BigNumber(validator.activatedStake), {
            showCode: true,
          })}
        </Text>
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
  valueContainer: { alignItems: "flex-end" },
  value: { flexDirection: "row", alignItems: "center" },
  valueLabel: { paddingHorizontal: 8, fontSize: 16 },
});

export default memo<Props>(Item);
