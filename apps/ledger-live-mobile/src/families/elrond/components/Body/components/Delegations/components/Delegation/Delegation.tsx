import React, { useCallback, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";

import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import LedgerLogo from "~/icons/LiveLogo";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import Circle from "~/components/Circle";

import type { DelegationPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const Delegation = (props: DelegationPropsType) => {
  const { last, validator, currency, userActiveStake, claimableRewards, onDrawer } = props;
  const { colors } = useTheme();
  const { t } = useTranslation();

  const name: string = validator ? validator.identity.name || validator.contract : "";

  /*
   * Memoize the denominate active stake as the amount.
   */

  const amount = useMemo(
    () =>
      denominate({
        input: userActiveStake,
        decimals: 4,
      }),
    [userActiveStake],
  );

  /*
   * Trigger the drawer callback and pass along the required data.
   */

  const onPress = useCallback(() => {
    if (validator) {
      onDrawer({
        type: "delegation",
        amount: new BigNumber(userActiveStake),
        validator,
        claimableRewards,
      });
    }
  }, [onDrawer, validator, claimableRewards, userActiveStake]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={styles.delegationsWrapper}>
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
            {amount} {currency.ticker}
          </Text>

          <LText color="grey">
            <CounterValue
              currency={currency}
              value={new BigNumber(userActiveStake)}
              withPlaceholder={true}
            />
          </LText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Delegation;
