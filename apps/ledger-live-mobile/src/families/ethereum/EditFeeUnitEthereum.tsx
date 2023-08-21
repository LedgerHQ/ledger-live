import React, { useCallback } from "react";
import Slider from "react-native-slider";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { getDefaultFeeUnit } from "@ledgerhq/live-common/families/ethereum/logic";
import { reverseRangeIndex, projectRangeIndex, Range } from "@ledgerhq/live-common/range";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

const FeeSlider = React.memo(
  ({
    value,
    onChange,
    range,
  }: {
    value: BigNumber;
    onChange: (arg: unknown) => void;
    range: Range;
  }) => {
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
  },
);

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  feeAmount: BigNumber;
  onChange: (value: BigNumber) => void;
  range: Range;
  title: string;
};
export default function EditFeeUnitEthereum({
  account,
  parentAccount,
  transaction,
  feeAmount,
  onChange,
  range,
  title,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const unit = getDefaultFeeUnit(mainAccount.currency);

  const feeCustomUnit = transaction.feeCustomUnit;

  const onChangeF = useCallback(
    value => {
      onChange(value);
    },
    [onChange],
  );

  return (
    <View>
      <View style={[styles.sliderContainer]}>
        <View style={styles.feeHeader}>
          <LText style={styles.feeLabel} semiBold>
            {t(title)}
          </LText>
          <View style={[styles.feeAmount, { backgroundColor: colors.lightLive }]}>
            <LText
              style={[
                styles.currencyUnitText,
                {
                  color: colors.live,
                },
              ]}
            >
              <CurrencyUnitValue unit={unit || feeCustomUnit} value={feeAmount} />
            </LText>
          </View>
        </View>
        <View style={styles.container}>
          <FeeSlider value={feeAmount} range={range} onChange={onChangeF} />
          <View style={styles.textContainer}>
            <LText color="grey" style={styles.currencyUnitText}>
              {t("fees.speed.slow")}
            </LText>
            <LText color="grey" style={styles.currencyUnitText}>
              {t("fees.speed.fast")}
            </LText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    paddingLeft: 0,
  },
  feeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 20,
  },
  feeAmount: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  container: {
    flexDirection: "column",
    justifyContent: "center",
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  currencyUnitText: {
    fontSize: 14,
    textTransform: "capitalize",
  },
});
