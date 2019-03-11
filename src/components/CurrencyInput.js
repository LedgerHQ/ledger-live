// @flow
import React, { PureComponent } from "react";
import { TextInput, StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import {
  formatCurrencyUnit,
  sanitizeValueString,
} from "@ledgerhq/live-common/lib/currencies";
import noop from "lodash/noop";

import type { Unit } from "@ledgerhq/live-common/lib/types";

import colors from "../colors";

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
  editable: boolean,
  placeholder?: string,
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
    editable: true,
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
      editable,
      placeholder,
    } = this.props;
    const { displayValue } = this.state;
    return (
      <View style={[styles.wrapper, style]}>
        <TextInput
          hitSlop={{ top: 20, bottom: 20 }}
          style={[
            styles.input,
            isActive ? styles.active : null,
            hasError ? styles.error : null,
          ]}
          editable={editable}
          onChangeText={this.handleChange}
          autoCorrect={false}
          value={displayValue}
          autoFocus={autoFocus}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          placeholder={
            placeholder ||
            format(unit, BigNumber(0), {
              isFocused: false,
              showAllDigits,
              subMagnitude,
            })
          }
          keyboardType="numeric"
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
    paddingRight: 8,
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
