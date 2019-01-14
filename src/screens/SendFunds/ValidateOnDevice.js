// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors from "../../colors";

import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";
import { deviceNames } from "../../wording";
import { getAccountBridge } from "../../bridge";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import getWindowDimensions from "../../logic/getWindowDimensions";

type Props = {
  action: () => void,
  transaction: *,
  account: *,
};
const { width } = getWindowDimensions();

class ValidateOnDevice extends PureComponent<Props> {
  render() {
    const { transaction, account } = this.props;
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);

    return (
      <View style={styles.root}>
        <View style={styles.innerContainer}>
          <View style={styles.picture}>
            <DeviceNanoAction action width={width * 0.8} screen="validation" />
          </View>
          <View style={styles.titleContainer}>
            <LText secondary semiBold style={styles.title}>
              <Trans
                i18nKey="send.validation.title"
                values={deviceNames.nanoX}
              />
            </LText>
          </View>

          <View style={styles.transactionDataWrapper}>
            <View style={styles.transactionDataRow}>
              <LText style={styles.label}>
                <Trans i18nKey="send.validation.amount" />
              </LText>
              <LText tertiary style={styles.value}>
                <CurrencyUnitValue
                  unit={account.unit}
                  value={amount}
                  disableRounding
                />
              </LText>
            </View>
          </View>
        </View>

        <VerifyAddressDisclaimer
          text={<Trans i18nKey="send.validation.disclaimer" />}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  transactionDataWrapper: {
    marginVertical: 24,
    padding: 12,
    paddingBottom: 2,
    borderRadius: 4,
    backgroundColor: colors.lightGrey,
    flexDirection: "column",
    alignItems: "center",
  },
  transactionDataRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    color: colors.grey,
    flex: 1,
    textAlign: "left",
    fontSize: 14,
  },
  value: {
    color: colors.darkBlue,
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  picture: {
    marginBottom: 40,
  },
  titleContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    color: colors.darkBlue,
    textAlign: "center",
  },
});

export default ValidateOnDevice;
