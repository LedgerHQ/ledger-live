// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import FeatherIcon from "react-native-vector-icons/dist/Feather";
import { connect } from "react-redux";
import { BigNumber } from "bignumber.js";

import type {
  Currency,
  Unit,
} from "@ledgerhq/live-common/lib/types/currencies";

import LText from "../../../../components/LText";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import Placeholder from "../../../../components/Placeholder";
import colors from "../../../../colors";
import CounterValues from "../../../../countervalues";
import {
  intermediaryCurrency,
  exchangeSettingsForPairSelector,
} from "../../../../reducers/settings";

export type OwnProps = {|
  from: Currency,
  to: Currency,
  style?: any,
|};

export type StateProps = {|
  unit: Unit,
  counterValue: ?BigNumber,
  value: BigNumber,
|};

export type Props = {| ...OwnProps, ...StateProps |};

const mapStateToProps = (state, props: OwnProps): StateProps => {
  const { from, to } = props;

  const unit = from.units[0];
  const value = new BigNumber(10 ** unit.magnitude);
  const intermediary = intermediaryCurrency(from, to);
  const fromExchange = exchangeSettingsForPairSelector(state, {
    from,
    to: intermediary,
  });

  let counterValue;
  if (intermediary.ticker !== from.ticker) {
    counterValue = CounterValues.calculateSelector(state, {
      from,
      to,
      exchange: fromExchange,
      value,
      disableRounding: true,
    });
  } else {
    const toExchange = exchangeSettingsForPairSelector(state, {
      from: intermediary,
      to,
    });

    counterValue = CounterValues.calculateWithIntermediarySelector(state, {
      from,
      to,
      intermediary,
      fromExchange,
      toExchange,
      value,
      disableRounding: true,
    });
  }

  return {
    counterValue,
    unit,
    value,
  };
};

const IconActivity = () => (
  <FeatherIcon name="activity" size={16} style={{ marginRight: 8 }} />
);

const Price = ({ counterValue, value, unit, to, style }: Props) => {
  if (!counterValue || counterValue.isZero()) {
    return <Placeholder width={200} containerHeight={16} style={style} />;
  }

  const subMagnitude = counterValue.lt(1) ? 1 : 0;

  return (
    <View style={[styles.container, style]}>
      <IconActivity />
      <LText styles={styles.value}>
        <CurrencyUnitValue value={value} unit={unit} showCode />
        {" = "}
        <CurrencyUnitValue
          unit={to.units[0]}
          value={counterValue}
          disableRounding={!!subMagnitude}
          subMagnitude={subMagnitude}
          showCode
        />
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    color: colors.black,
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter",
  },
});

export default connect(mapStateToProps)(Price);
