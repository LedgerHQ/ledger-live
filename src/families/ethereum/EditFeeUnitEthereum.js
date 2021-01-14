// @flow
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useMemo, useState, useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import Slider from "react-native-slider";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import {
  inferDynamicRange,
  reverseRangeIndex,
  projectRangeIndex,
} from "@ledgerhq/live-common/lib/range";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import SettingsRow from "../../components/SettingsRow";
import Button from "../../components/Button";

const GasSlider = React.memo(({ value, onChange, range }: *) => {
  const { colors } = useTheme();
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

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  currentNavigation: string,
};
type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  route: { params: RouteParams },
};

const fallbackGasPrice = inferDynamicRange(BigNumber(10e9));
let lastNetworkGasPrice; // local cache of last value to prevent extra blinks

export default function EditFeeUnitEthereum({
  account,
  parentAccount,
  transaction,
  route,
}: Props) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const { setAccount, setTransaction } = useBridgeTransaction();

  useMemo(() => {
    setAccount(account, parentAccount);
    setTransaction(transaction);
  }, [setAccount, setTransaction, account, parentAccount, transaction]);

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  const networkGasPrice =
    transaction.networkInfo && transaction.networkInfo.gasPrice;
  if (!lastNetworkGasPrice && networkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }
  const range = networkGasPrice || lastNetworkGasPrice || fallbackGasPrice;
  const [gasPrice, setGasPrice] = useState(
    transaction.gasPrice || range.initial,
  );
  const feeCustomUnit = transaction.feeCustomUnit;

  const onChangeF = useCallback(
    value => {
      const { gasPrice } = bridge.updateTransaction(transaction, {
        gasPrice: value,
      });
      setGasPrice(gasPrice);
    },
    [bridge, transaction],
  );

  const onValidateFees = useCallback(() => {
    const { currentNavigation } = route.params;
    navigate(currentNavigation, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.updateTransaction(transaction, { gasPrice }),
    });
  }, [
    route.params,
    navigate,
    account.id,
    parentAccount,
    bridge,
    transaction,
    gasPrice,
  ]);

  const { networkInfo } = transaction;
  if (!networkInfo) return null;
  const { gasPrice: serverGas } = networkInfo;

  return (
    <View style={styles.root}>
      <View style={[styles.sliderContainer, { backgroundColor: colors.card }]}>
        <SettingsRow
          title={t("send.fees.chooseGas")}
          desc={t("send.fees.higherFaster")}
          onPress={null}
          alignedTop
        >
          <LText
            semiBold
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
            range={range}
            onChange={onChangeF}
          />
          <View style={styles.textContainer}>
            <LText
              semiBold
              style={[styles.currencyUnitText, { color: colors.grey }]}
            >
              {t("common.slow")}
            </LText>
            <LText
              semiBold
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
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
  },
  sliderContainer: {
    flex: 1,

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
