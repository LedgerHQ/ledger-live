// @flow
import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import Slider from "react-native-slider";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/bridge/EthereumJSBridge";
import {
  inferDynamicRange,
  reverseRangeIndex,
  projectRangeIndex,
} from "@ledgerhq/live-common/lib/range";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { BigNumber } from "bignumber.js";

import { editTxFeeByFamily } from "../helpers";
import type { T } from "../../types/common";
import colors from "../../colors";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import SettingsRow from "../../components/SettingsRow";
import Button from "../../components/Button";

type Props = {
  account: Account | TokenAccount,
  parentAccount: ?Account,
  transaction: Transaction,
  t: T,
  navigation: NavigationScreenProp<*>,
};

const GasSlider = React.memo(({ defaultGas, value, onChange }: *) => {
  const range = useMemo(() => inferDynamicRange(defaultGas), [defaultGas]);
  const index = reverseRangeIndex(range, value);
  const setValueIndex = useCallback(
    i => onChange(projectRangeIndex(range, i)),
    [range, onChange],
  );

  return (
    <Slider
      value={index}
      step={1}
      onValueChange={setValueIndex}
      minimumValue={0}
      maximumValue={range.steps - 1}
      thumbTintColor={colors.live}
      minimumTrackTintColor={colors.live}
    />
  );
});

const EditFeeUnitEthereum = ({
  account,
  parentAccount,
  transaction,
  t,
  navigation,
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  const [gasPrice, setGasPrice] = useState(() =>
    bridge.getTransactionExtra(mainAccount, transaction, "gasPrice"),
  );
  const feeCustomUnit = bridge.getTransactionExtra(
    mainAccount,
    transaction,
    "feeCustomUnit",
  );

  const onChangeF = useCallback(
    value => {
      const { gasPrice: gp } = bridge.editTransactionExtra(
        mainAccount,
        transaction,
        "gasPrice",
        value,
      );
      setGasPrice(gp);
    },
    [bridge, mainAccount, transaction],
  );

  const onValidateFees = useCallback(() => {
    navigation.navigate("SendSummary", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: editTxFeeByFamily(
        mainAccount,
        navigation,
        "gasPrice",
        gasPrice,
      ),
    });
  }, [account, gasPrice, navigation, mainAccount, parentAccount]);

  const fees = bridge.getTransactionNetworkInfo(mainAccount, transaction);

  if (!fees) return null;

  const serverGas = BigNumber(fees.serverFees.gas_price);

  return (
    <View style={styles.root}>
      <View style={styles.sliderContainer}>
        <SettingsRow
          title={t("send.fees.chooseGas")}
          desc={t("send.fees.higherFaster")}
          onPress={null}
          alignedTop
        >
          <LText
            tertiary
            style={[
              styles.currencyUnitText,
              { color: colors.live, marginLeft: 8 },
            ]}
          >
            <CurrencyUnitValue
              unit={feeCustomUnit || mainAccount.unit}
              value={gasPrice}
            />
          </LText>
        </SettingsRow>
        <View style={styles.container}>
          <GasSlider
            defaultGas={serverGas}
            value={gasPrice}
            onChange={onChangeF}
          />
          <View style={styles.textContainer}>
            <LText
              tertiary
              style={[styles.currencyUnitText, { color: colors.grey }]}
            >
              {t("common.slow")}
            </LText>
            <LText
              tertiary
              style={[styles.currencyUnitText, { color: colors.grey }]}
            >
              {t("common.fast")}
            </LText>
          </View>
        </View>
        <LText />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          event="EditFeeUnitConfirm"
          type="primary"
          title={t("common.confirm")}
          containerStyle={styles.continueButton}
          onPress={onValidateFees}
        />
      </View>
    </View>
  );
};

export default translate()(EditFeeUnitEthereum);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
  },
  sliderContainer: {
    flex: 1,
    backgroundColor: "white",
    minHeight: 200,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  currencyUnitText: {
    fontSize: 16,
  },
  buttonContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  continueButton: {
    alignSelf: "stretch",
  },
});
