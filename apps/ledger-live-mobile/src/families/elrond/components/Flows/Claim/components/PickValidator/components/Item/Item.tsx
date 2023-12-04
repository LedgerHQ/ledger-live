import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";

import LText from "../../../../../../../../../components/LText";
import FirstLetterIcon from "../../../../../../../../../components/FirstLetterIcon";
import CurrencyUnitValue from "../../../../../../../../../components/CurrencyUnitValue";
import ArrowRight from "../../../../../../../../../icons/ArrowRight";
import Circle from "../../../../../../../../../components/Circle";
import LedgerLogo from "../../../../../../../../../icons/LiveLogo";

import type { ItemPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const Item = (props: ItemPropsType) => {
  const { colors } = useTheme();
  const { item, unit, onSelect } = props;
  const { validator, contract, claimableRewards } = item;
  const name = validator ? validator.identity.name || contract : contract;

  /*
   * Return the rendered component.
   */

  return (
    <TouchableOpacity onPress={() => onSelect(validator, claimableRewards)} style={styles.wrapper}>
      <View style={styles.iconWrapper}>
        <Circle crop={true} size={32}>
          {ELROND_LEDGER_VALIDATOR_ADDRESS === contract ? (
            <LedgerLogo size={32 * 0.7} color={colors.neutral.c100} />
          ) : (
            <FirstLetterIcon label={name || "-"} round={true} size={32} fontSize={24} />
          )}
        </Circle>
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold style={styles.nameText} numberOfLines={1}>
          {name}
        </LText>

        <LText style={styles.subText} color="neutral.c70" numberOfLines={1}>
          <Trans
            i18nKey="cosmos.delegation.flow.steps.validator.estYield"
            values={{
              amount: validator ? validator.apr : "N/A",
            }}
          />
        </LText>
      </View>

      <View style={styles.value}>
        <View style={styles.valueContainer}>
          <LText semiBold={true} style={styles.valueLabel} color="neutral.c80">
            <CurrencyUnitValue
              value={new BigNumber(claimableRewards)}
              unit={unit}
              showCode={false}
            />
          </LText>
        </View>

        <ArrowRight size={16} color={colors.primary.c70} />
      </View>
    </TouchableOpacity>
  );
};

export default Item;
