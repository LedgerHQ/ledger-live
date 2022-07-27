// @flow
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";

import CounterValue from "../../../../../../components/CounterValue";
import ArrowRight from "../../../../../../icons/ArrowRight";
import LText from "../../../../../../components/LText";
import FirstLetterIcon from "../../../../../../components/FirstLetterIcon";
import { denominate } from "../../../../helpers";
import { constants } from "../../../../constants";

const styles = StyleSheet.create({
  delegationsWrapper: {
    borderRadius: 4,
  },
  wrapper: {
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeMore: {
    fontSize: 14,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 5,

    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
});

const Unbonding = (props: any) => {
  const {
    last,
    contract,
    validator,
    currency,
    amount,
    onDrawer,
    seconds,
    delegations,
  } = props;
  const { colors } = useTheme();
  const { t } = useTranslation();

  const name = validator ? validator.name : contract || "";
  const value = useMemo(
    () =>
      denominate({
        input: amount,
      }),
    [amount],
  );

  const onPress = useCallback(() => {
    if (onDrawer) {
      onDrawer({
        source: "undelegation",
        amount,
        validator,
        meta: {
          delegations,
          seconds,
        },
      });
    }
  }, [onDrawer, validator, seconds, delegations, amount]);

  return (
    <View style={[styles.delegationsWrapper, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={[
          styles.row,
          styles.wrapper,
          { backgroundColor: colors.card },
          !last
            ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey }
            : undefined,
        ]}
        onPress={onPress}
      >
        <View style={[styles.icon, { backgroundColor: colors.lightLive }]}>
          <FirstLetterIcon label={name} />
        </View>

        <View style={styles.nameWrapper}>
          <LText semiBold={true} numberOfLines={1}>
            {name}
          </LText>

          <View style={styles.row}>
            <LText style={styles.seeMore} color="live">
              {t("common.seeMore")}
            </LText>

            <ArrowRight color={colors.live} size={14} />
          </View>
        </View>

        <View style={styles.rightWrapper}>
          <LText semiBold={true}>
            {value} {constants.egldLabel}
          </LText>

          <LText color="grey">
            <CounterValue
              currency={currency}
              showCode={true}
              value={BigNumber(amount)}
              alwaysShowSign={false}
              withPlaceholder={true}
            />
          </LText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Unbonding;
