// @flow
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { BigNumber } from "bignumber.js";

import {
  formatCurrencyUnit,
  sanitizeValueString,
} from "@ledgerhq/live-common/lib/currencies";
import noop from "lodash/noop";
import clamp from "lodash/clamp";

import type { Unit } from "@ledgerhq/live-common/lib/types";

import { localeSelector } from "../reducers/settings";
import getFontStyle from "./LText/getFontStyle";
import { withTheme } from "../colors";
import TextInput from "./FocusedTextInput";

function format(
  unit: Unit,
  value: BigNumber,
  { isFocused, showAllDigits, subMagnitude, locale },
) {
  return formatCurrencyUnit(unit, value, {
    locale,
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
  renderLeft?: any,
  renderRight?: any,
  hasError?: boolean,
  hasWarning?: boolean,
  autoFocus?: boolean,
  editable: boolean,
  placeholder?: string,
  style?: *,
  inputStyle?: *,
  colors: *,
  dynamicFontRatio?: number,
  locale: string,
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
    hasWarning: false,
    autoFocus: false,
    editable: true,
    dynamicFontRatio: 0.75,
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
    const {
      value,
      showAllDigits,
      unit,
      subMagnitude,
      allowZero,
      locale,
    } = this.props;
    this.setState({
      isFocused,
      displayValue:
        !value || (value.isZero() && !allowZero)
          ? ""
          : format(unit, value, {
              isFocused,
              showAllDigits,
              subMagnitude,
              locale,
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
      inputStyle,
      showAllDigits,
      unit,
      subMagnitude,
      isActive,
      renderLeft,
      renderRight,
      hasError,
      hasWarning,
      autoFocus,
      editable,
      placeholder,
      colors,
      dynamicFontRatio = 0.75,
      locale,
    } = this.props;
    const { displayValue } = this.state;

    // calculating an approximative font size
    const screenWidth = Dimensions.get("window").width * dynamicFontRatio;
    const dynamicFontSize = Math.round(
      clamp(
        Math.sqrt((screenWidth * 32) / displayValue.length),
        8,
        isActive ? 32 : 24,
      ),
    );

    return (
      <View style={[styles.wrapper, style]}>
        {renderLeft}
        <TextInput
          allowFontScaling={false}
          hitSlop={{ top: 20, bottom: 20 }}
          style={[
            styles.input,
            { color: colors.darkBlue },
            hasError
              ? { color: colors.alert }
              : hasWarning
              ? { color: colors.orange }
              : null,
            editable ? {} : { color: colors.grey },
            { fontSize: dynamicFontSize },
            inputStyle,
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
              locale,
            })
          }
          placeholderTextColor={editable ? colors.darkBlue : colors.grey}
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
    justifyContent: "center",
  },
  input: {
    flex: 1,
    ...getFontStyle(),
    paddingRight: 8,
  },
});

const mapStateToProps = state => ({
  locale: localeSelector(state),
});

export default withTheme(
  connect(mapStateToProps, null, null, { forwardRef: true })(CurrencyInput),
);
