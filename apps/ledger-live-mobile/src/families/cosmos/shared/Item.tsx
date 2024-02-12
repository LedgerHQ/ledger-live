import React, { memo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import type {
  CosmosMappedValidator,
  CosmosMappedDelegation,
  CosmosValidatorItem,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import cosmosBase from "@ledgerhq/live-common/families/cosmos/chain/cosmosBase";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import ArrowRight from "~/icons/ArrowRight";
import ValidatorImage from "./ValidatorImage";

type Props = {
  item: CosmosMappedValidator | CosmosMappedDelegation;
  disabled: boolean;
  value: BigNumber | null | undefined;
  showVal?: boolean;
  onSelect: (validator: CosmosValidatorItem, value: BigNumber | null | undefined) => void;
  unit: Unit;
  delegatedValue?: BigNumber;
};

function Item({ item, value, disabled, onSelect, unit, showVal = true, delegatedValue }: Props) {
  const { colors } = useTheme();
  const { validator } = item;
  const { validatorAddress, estimatedYearlyRewardsRate, name } = validator || {};
  const select = useCallback(
    () => validator && onSelect(validator, value),
    [onSelect, validator, value],
  );
  const isDisabled = (!value || value.gt(0)) && disabled;

  return (
    <TouchableOpacity onPress={select} disabled={isDisabled} style={[styles.wrapper]}>
      <View style={[styles.iconWrapper]}>
        <ValidatorImage
          size={32}
          isLedger={
            validatorAddress !== undefined &&
            cosmosBase.COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.includes(validatorAddress)
          }
          name={name || validatorAddress}
        />
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold style={[styles.nameText]} numberOfLines={1}>
          {name || validatorAddress}
        </LText>

        <LText style={styles.subText} color="grey" numberOfLines={1}>
          <Trans
            i18nKey="cosmos.delegation.flow.steps.validator.estYield"
            values={{
              amount: estimatedYearlyRewardsRate
                ? Number(100 * estimatedYearlyRewardsRate).toFixed(2)
                : "N/A",
            }}
          />
        </LText>
      </View>
      <View style={styles.value}>
        {(showVal || value) && (
          <View style={styles.valueContainer}>
            <LText semiBold style={[styles.valueLabel]} color={isDisabled ? "grey" : "darkBlue"}>
              {value ? <CurrencyUnitValue value={value} unit={unit} showCode={false} /> : "0"}
            </LText>

            {delegatedValue && delegatedValue.gt(0) ? (
              <LText style={[styles.valueLabel, styles.subText]} color="grey" numberOfLines={1}>
                <Trans i18nKey="cosmos.delegation.flow.steps.validator.currentAmount">
                  <CurrencyUnitValue value={delegatedValue} unit={unit} showCode={false} />
                </Trans>
              </LText>
            ) : null}
          </View>
        )}
        <ArrowRight size={16} color={colors.grey} />
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
  valueContainer: {
    alignItems: "flex-end",
  },
  value: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueLabel: {
    paddingHorizontal: 8,
    fontSize: 16,
  },
});
export default memo<Props>(Item);
