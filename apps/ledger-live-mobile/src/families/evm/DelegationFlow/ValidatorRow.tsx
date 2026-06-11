import type { StakingValidatorItem } from "@ledgerhq/live-common/families/evm/staking/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo } from "react";
import { Trans } from "~/context/Locale";
import { StyleSheet, View } from "react-native";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import ValidatorImage from "../shared/ValidatorImage";

const ValidatorRow = ({
  onPress,
  validator,
  account,
}: {
  onPress: (_: StakingValidatorItem) => void;
  validator: StakingValidatorItem;
  account: AccountLike;
}) => {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);
  const unit = useAccountUnit(account);
  const tokens = useMemo(() => new BigNumber(validator.tokens), [validator.tokens]);

  return (
    <Touchable
      event="EvmDelegationFlowChoseValidator"
      touchableTestID={`evm-validator-row-${validator.validatorAddress}`}
      eventProperties={{
        validatorName: validator.name || validator.validatorAddress,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage
          isLedger={false}
          size={32}
          name={validator.name ?? validator.validatorAddress}
        />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name || validator.validatorAddress}
          </Text>
          <Text fontWeight="semiBold" numberOfLines={1} style={styles.commission}>
            <Trans i18nKey="evm.delegation.commission" /> {(validator.commission * 100).toFixed(2)}{" "}
            %
          </Text>
        </View>
        <Text fontWeight="semiBold" numberOfLines={1} style={styles.totalStake} color="smoke">
          <CurrencyUnitValue showCode unit={unit} value={tokens} />
        </Text>
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
  validatorName: {
    fontSize: 14,
  },
  commission: {
    fontSize: 12,
  },
  totalStake: {
    fontSize: 14,
  },
});

export default ValidatorRow;
