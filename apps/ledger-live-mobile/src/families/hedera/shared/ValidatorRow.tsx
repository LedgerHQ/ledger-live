import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { AccountLike } from "@ledgerhq/types-live";
import { Icons, Text } from "@ledgerhq/native-ui";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import ValidatorIcon from "./ValidatorIcon";

interface Props {
  onPress: (_: HederaValidator) => void;
  validator: HederaValidator;
  account: AccountLike;
}

const ValidatorRow = ({ onPress, validator, account }: Props) => {
  const unit = useAccountUnit(account);

  const handlePress = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="ChooseValidator"
      eventProperties={{ validatorName: validator.name }}
      onPress={handlePress}
    >
      <View style={styles.validator}>
        <ValidatorIcon size={32} validator={validator} />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name}
          </Text>
        </View>
        <View style={styles.validatorColumn}>
          <Text
            fontWeight="semiBold"
            numberOfLines={1}
            style={[styles.validatorYield]}
            color="smoke"
          >
            <Text fontWeight="semiBold" numberOfLines={1}>
              <CurrencyUnitValue showCode unit={unit} value={validator.activeStake} />
            </Text>
          </Text>
          {validator.overstaked ? (
            <View style={styles.overstakedWarning}>
              <Icons.Warning size="XS" color="warning.c70" style={styles.overstakedIcon} />
              <Text numberOfLines={1} fontSize={10} color="warning.c70">
                <Trans i18nKey="hedera.delegation.steps.validator.rowSubtitleOverstaked" />
              </Text>
            </View>
          ) : (
            <Text numberOfLines={1} fontSize={10}>
              <Trans
                i18nKey="hedera.delegation.steps.validator.rowSubtitlePercentage"
                values={{ percentage: validator.activeStakePercentage }}
              />
            </Text>
          )}
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  validator: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  validatorBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  validatorColumn: {
    flexDirection: "column",
    gap: 2,
    alignItems: "flex-end",
  },
  validatorName: {
    fontSize: 14,
  },
  validatorYield: {
    fontSize: 14,
  },
  overstakedWarning: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  overstakedIcon: {
    maxWidth: 10,
  },
});

export default ValidatorRow;
