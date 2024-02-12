import { getDefaultFeeUnit } from "@ledgerhq/coin-evm/logic";
import { Range, projectRangeIndex, reverseRangeIndex } from "@ledgerhq/live-common/range";
import type { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Slider from "react-native-slider";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";

const FeeSlider = React.memo(
  ({
    value,
    onChange,
    range,
  }: {
    value: BigNumber;
    onChange: (arg: BigNumber) => void;
    range: Range;
  }) => {
    const { colors } = useTheme();
    const index = reverseRangeIndex(range, value);
    const setValueIndex = useCallback(
      (i: number | string) => onChange(projectRangeIndex(range, i as number)),
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
  account: Account;
  feeAmount: BigNumber;
  onChange: (value: BigNumber) => void;
  range: Range;
  title: string;
};
export default function EditFeeUnitEvm({ account, feeAmount, onChange, range, title }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const unit = getDefaultFeeUnit(account.currency);

  const onChangeF = useCallback(
    (value: BigNumber) => {
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
              <CurrencyUnitValue unit={unit} value={feeAmount} />
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
