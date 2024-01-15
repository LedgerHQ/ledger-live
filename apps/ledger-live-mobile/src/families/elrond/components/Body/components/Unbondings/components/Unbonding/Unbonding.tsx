import React, { useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";

import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import LedgerLogo from "~/icons/LiveLogo";
import Circle from "~/components/Circle";

import type { UnbondingPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const Unbonding = (props: UnbondingPropsType) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { last, validator, currency, amount, onDrawer, seconds } = props;

  const name: string = validator ? validator.identity.name || validator.contract : "";

  const value = denominate({
    input: amount,
    decimals: 4,
  });

  /*
   * When clicking on the unbonding, open the drawer with the details and actions, passing along required data.
   */

  const onPress = useCallback(() => {
    if (validator) {
      onDrawer({
        type: "undelegation",
        amount: new BigNumber(amount),
        validator,
        seconds,
      });
    }
  }, [onDrawer, validator, seconds, amount]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={styles.undelegationsWrapper}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.row, styles.wrapper, last ? undefined : styles.borderBottom]}
      >
        <View style={styles.icon}>
          {validator && (
            <Circle crop={true} size={42}>
              {ELROND_LEDGER_VALIDATOR_ADDRESS === validator.contract ? (
                <LedgerLogo size={42 * 0.7} color={colors.text} />
              ) : (
                <FirstLetterIcon label={name || "-"} round={true} size={42} fontSize={24} />
              )}
            </Circle>
          )}
        </View>

        <View style={styles.nameWrapper}>
          <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.row}>
            <LText style={styles.seeMore} color="live">
              {t("common.seeMore")}
            </LText>

            <ArrowRight color={colors.primary} size={14} />
          </View>
        </View>

        <View style={styles.rightWrapper}>
          <Text variant="body" fontWeight="semiBold">
            {value} {currency.ticker}
          </Text>

          <LText color="grey">
            <CounterValue
              currency={currency}
              value={new BigNumber(amount)}
              withPlaceholder={true}
            />
          </LText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Unbonding;
