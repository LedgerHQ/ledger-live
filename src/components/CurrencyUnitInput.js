// @flow
import React, { Component } from "react";
import type { Unit } from "@ledgerhq/currencies";
import { View, StyleSheet, TextInput } from "react-native";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/currencies";
import LText, { getFontStyle } from "../components/LText";
import { withLocale } from "./LocaleContext";

const initialValueStringFromProps = props =>
  props.value === 0
    ? "" // empty string because we want to fallback on displaying the placeholder
    : formatCurrencyUnit(props.unit, props.value, {
        locale: props.locale,
        disableRounding: true
      });

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    position: "relative",
    alignItems: "center",
    flexDirection: "row"
  },
  textInput: {
    paddingRight: 48,
    color: "#999"
  },
  unit: {
    color: "#999",
    position: "absolute"
  }
});

class CurrencyUnitInput extends Component<
  {
    value: number,
    onChange: number => void,
    unit: Unit,

    locale?: string,
    width: number,
    height: number,
    fontSize: number,
    padding: number
  },
  {
    value: number, // Track the last "stable" value coming from props
    valueString: string, // Track the TextInput string
    editing: boolean // Track the focus state
  }
> {
  state = {
    editing: false,
    value: 0,
    valueString: ""
  };

  static getDerivedStateFromProps(nextProps: *, prevState: *) {
    if (!prevState.editing && nextProps.value !== prevState.value) {
      return {
        value: nextProps.value,
        valueString: initialValueStringFromProps(nextProps)
      };
    }
    return null;
  }

  onChangeText = (valueString: string) => {
    const value = parseCurrencyUnit(this.props.unit, valueString);
    this.setState({ value, valueString });
    if (!isNaN(value)) {
      this.props.onChange(value);
    }
  };

  onFocus = () => {
    this.setState({ editing: true });
  };

  onBlur = () => {
    this.setState({
      editing: false,
      value: this.props.value,
      valueString: formatCurrencyUnit(this.props.unit, this.props.value)
    });
  };

  render() {
    const { padding, width, height, fontSize, unit, locale } = this.props;
    const { valueString } = this.state;
    return (
      <View style={[styles.root, { padding, width, height }]}>
        <TextInput
          style={[
            styles.textInput,
            getFontStyle({ bold: true }),
            { width, height, fontSize }
          ]}
          keyboardType="numeric"
          autoCorrect={false}
          autoCapitalize="none"
          value={valueString}
          onChangeText={this.onChangeText}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          placeholder={formatCurrencyUnit(unit, 0, { locale })}
        />
        <LText
          pointerEvents="none"
          style={[styles.unit, { right: padding, fontSize }]}
        >
          {unit.code}
        </LText>
      </View>
    );
  }
}

export default withLocale(CurrencyUnitInput);
