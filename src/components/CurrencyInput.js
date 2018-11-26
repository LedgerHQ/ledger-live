// @flow
import React, { PureComponent } from "react";
import { TextInput, StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import noop from "lodash/noop";

import type { Unit } from "@ledgerhq/live-common/lib/types";

import colors from "../colors";

const numbers = "0123456789";
const sanitizeValueString = (
  unit: Unit,
  valueString: string,
): {
  display: string,
  value: string,
} => {
  let display = "";
  let value = "";
  let decimals = -1;
  for (let i = 0; i < valueString.length; i++) {
    const c = valueString[i];
    if (numbers.indexOf(c) !== -1) {
      if (decimals >= 0) {
        decimals++;
        if (decimals > unit.magnitude) break;
        value += c;
        display += c;
      } else if (value !== "0") {
        value += c;
        display += c;
      }
    } else if (decimals === -1 && (c === "," || c === ".")) {
      if (i === 0) display = "0";
      decimals = 0;
      display += ".";
    }
  }
  for (let i = Math.max(0, decimals); i < unit.magnitude; ++i) {
    value += "0";
  }
  if (!value) value = "0";
  return { display, value };
};

function format(
  unit: Unit,
  value: BigNumber,
  { isFocused, showAllDigits, subMagnitude },
) {
  return formatCurrencyUnit(unit, value, {
    useGrouping: !isFocused,
    disableRounding: true,
    showAllDigits: !!showAllDigits && !isFocused,
    subMagnitude: value.isLessThan(1) ? subMagnitude : 0,
  });
}

type Props = {
  isActive: boolean,
  onFocus: boolean => void,
  onChange: BigNumber => void,
  unit: Unit,
  value: ?BigNumber,
  showAllDigits?: boolean,
  subMagnitude: number,
  allowZero: boolean,
  renderRight?: any,
  hasError?: boolean,
  autoFocus?: boolean,
  style?: *,
};

type State = {
  isFocused: boolean,
  displayValue: string,
};

class CurrencyInput extends PureComponent<Props, State> {
  static defaultProps = {
    onFocus: noop,
    onChange: noop,
    value: null,
    showAllDigits: false,
    subMagnitude: 0,
    allowZero: false,
    isActive: false,
    hasError: false,
    autoFocus: false,
  };

  state = {
    isFocused: false,
    displayValue: "",
  };

  componentDidMount() {
    this.setDisplayValue();
  }

  componentDidUpdate(prevProps: Props) {
    const { value, showAllDigits, unit } = this.props;
    const needsToBeReformatted =
      !this.state.isFocused &&
      (value !== prevProps.value ||
        showAllDigits !== prevProps.showAllDigits ||
        unit !== prevProps.unit);

    if (needsToBeReformatted) {
      this.setDisplayValue();
    }
  }

  setDisplayValue = (isFocused: boolean = false) => {
    const { value, showAllDigits, unit, subMagnitude, allowZero } = this.props;
    this.setState({
      isFocused,
      displayValue:
        !value || (value.isZero() && !allowZero)
          ? ""
          : format(unit, value, {
              isFocused,
              showAllDigits,
              subMagnitude,
            }),
    });
  };

  handleChange = (v: string) => {
    const { onChange, unit, value } = this.props;
    const r = sanitizeValueString(unit, v);
    const satoshiValue = BigNumber(r.value);

    if (!value || !value.isEqualTo(satoshiValue)) {
      onChange(satoshiValue);
    }
    this.setState({ displayValue: r.display });
  };

  handleBlur = () => {
    this.syncInput({ isFocused: false });
    this.props.onFocus(false);
  };

  handleFocus = () => {
    this.syncInput({ isFocused: true });
    this.props.onFocus(true);
  };

  syncInput = ({ isFocused }: { isFocused: boolean }) => {
    if (isFocused !== this.state.isFocused) {
      this.setDisplayValue(isFocused);
    }
  };

  render() {
    const {
      style,
      showAllDigits,
      unit,
      subMagnitude,
      isActive,
      renderRight,
      hasError,
      autoFocus,
    } = this.props;
    const { displayValue } = this.state;
    return (
      <View style={[styles.wrapper, style]}>
        <TextInput
          style={[
            styles.input,
            isActive ? styles.active : null,
            hasError ? styles.error : null,
          ]}
          onChangeText={this.handleChange}
          value={displayValue}
          autoFocus={autoFocus}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          placeholder={format(unit, BigNumber(0), {
            isFocused: false,
            showAllDigits,
            subMagnitude,
          })}
          keyboardType="numeric"
          returnKeyType="done"
          blurOnSubmit
        />
        {renderRight}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontFamily: "Rubik",
    fontSize: 24,
    color: colors.darkBlue,
  },
  active: {
    fontSize: 32,
  },
  error: {
    color: colors.alert,
  },
});

export default CurrencyInput;
