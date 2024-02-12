import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { isDefaultValidatorGroupAddress } from "@ledgerhq/live-common/families/celo/logic";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { CeloValidatorGroup, CeloVote } from "@ledgerhq/live-common/families/celo/types";
import { useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import ValidatorImage from "./ValidatorImage";

const ValidatorRow = ({
  onPress,
  validator,
  account,
  vote,
  amount,
}: {
  onPress: (validator: CeloValidatorGroup, vote?: CeloVote) => void;
  validator: CeloValidatorGroup;
  account: AccountLike;
  vote?: CeloVote;
  amount: BigNumber;
}) => {
  const { colors } = useTheme();

  const onPressT = useCallback(() => {
    onPress(validator, vote);
  }, [onPress, validator, vote]);

  return (
    <Touchable
      event="ChoseValidator"
      eventProperties={{
        validatorName: validator.name || validator.address,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage
          isLedger={isDefaultValidatorGroupAddress(validator.address)}
          size={32}
          name={validator.name ?? validator.address}
        />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name || validator.address}
          </Text>
          {vote?.type ? (
            <Text
              fontWeight="semiBold"
              numberOfLines={1}
              style={[
                styles.overdelegated,
                { color: vote.type === "active" ? colors.green : colors.grey },
              ]}
            >
              {vote.type === "active" ? (
                <Trans i18nKey="celo.revoke.flow.steps.validator.active" />
              ) : (
                <Trans i18nKey="celo.revoke.flow.steps.validator.pending" />
              )}
            </Text>
          ) : null}
        </View>
        <Text fontWeight="semiBold" numberOfLines={1} style={[styles.validatorYield]} color="smoke">
          <Text fontWeight="semiBold" numberOfLines={1}>
            <CurrencyUnitValue showCode unit={getAccountUnit(account)} value={amount} />
          </Text>
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
  overdelegatedIndicator: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
  },
  validatorYield: {
    fontSize: 14,
  },
  validatorYieldFull: {
    opacity: 0.5,
  },
});

export default ValidatorRow;
