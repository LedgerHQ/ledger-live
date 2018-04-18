// @flow
import React, { Component } from "react";
import type { Unit } from "@ledgerhq/currencies";
import { View, StyleSheet, TextInput } from "react-native";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/currencies";
import LText, { getFontStyle } from "../components/LText";
import { withLocale } from "../context/Locale";

const initialValueStringFromProps = props =>
  props.value === 0
    ? "" // empty string because we want to fallback on displaying the placeholder
    : formatCurrencyUnit(props.unit, props.value, {
        locale: props.locale,
        disableRounding: true
        // useGrouping: false // FIXME should we disable grouping?
      });

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    position: "relative",
    flexDirection: "row",
    padding: 8,
    height: 60,
    flex: 1
  },
  textInput: {
    paddingRight: 48,
    color: "#999",
    fontSize: 14,
    flex: 1
  },
  unit: {
    color: "#999",
    position: "absolute",
    right: 8,
    padding: 8,
    fontSize: 14,
    alignSelf: "center"
  }
});

type Props = {
  value: number,
  onChange: number => void,
  unit: Unit,

  locale?: string
};

type State = {
  value: number, // Track the last "stable" value coming from props
  valueString: string, // Track the TextInput string
  editing: boolean // Track the focus state
};

class CurrencyUnitInput extends Component<Props, State> {
  state = {
    editing: false,
    value: 0,
    valueString: ""
  };

  static getDerivedStateFromProps(
    nextProps: Props,
    prevState: State
  ): $Shape<State> {
    if (!prevState.editing && nextProps.value !== prevState.value) {
      return {
        value: nextProps.value,
        valueString: initialValueStringFromProps(nextProps)
      };
    }
    return null;
  }

  onChangeText = (valueString: string) => {
    const { unit, onChange } = this.props;
    const value = parseCurrencyUnit(unit, valueString);
    // TODO polish: valueString needs to be cleaned if there are more digits than required
    // TODO polish: we need to MAX the field if value is higher than threshold
    this.setState({ value, valueString });
    if (!isNaN(value)) {
      onChange(value);
    }
  };

  onFocus = () => {
    this.setState({ editing: true });
  };

  onBlur = () => {
    const { value } = this.props;
    const valueString = initialValueStringFromProps(this.props);
    this.setState({ editing: false, value, valueString });
  };

  render() {
    const { unit, locale } = this.props;
    const { valueString } = this.state;
    const placeholder = formatCurrencyUnit(unit, 0, { locale });
    return (
      <View style={styles.root}>
        <TextInput
          style={[styles.textInput, getFontStyle({ bold: true })]}
          keyboardType="numeric"
          autoCorrect={false}
          autoCapitalize="none"
          value={valueString}
          onChangeText={this.onChangeText}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          placeholder={placeholder}
        />
        <LText pointerEvents="none" style={styles.unit}>
          {unit.code}
        </LText>
      </View>
    );
  }
}

export default withLocale(CurrencyUnitInput);
