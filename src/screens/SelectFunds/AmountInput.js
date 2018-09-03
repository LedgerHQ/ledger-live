// @flow
import React, { Component, Fragment } from "react";
import { TextInput, View, StyleSheet, TouchableOpacity } from "react-native";

import LText from "../../components/LText/index";
import Close from "../../images/icons/Close";

import colors from "../../colors";

type Props = {
  currency: string,
  value: string,
  onChangeText: string => void,
  isWithinBalance: boolean,
};

class AmountInput extends Component<Props> {
  componentDidMount() {
    this.input.current.focus();
  }

  // $FlowFixMe
  input = React.createRef();

  clear = () => {
    const { onChangeText } = this.props;
    this.input.current.clear();
    onChangeText("");
  };

  render() {
    const { currency, value, onChangeText, isWithinBalance } = this.props;
    return (
      <Fragment>
        <View
          style={[
            styles.inputWrapper,
            !isWithinBalance ? styles.inputWrapperError : null,
          ]}
        >
          <LText style={styles.currency} tertiary>
            {currency}
          </LText>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            placeholder="0"
            ref={this.input}
          />
          {!!value && (
            <TouchableOpacity onPress={this.clear}>
              <View style={styles.closeContainer}>
                <Close color={colors.white} size={8} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        {!isWithinBalance && (
          <LText style={styles.errorText}>Oops, insufficient balance</LText>
        )}
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
  },
  inputWrapperError: {
    paddingBottom: 8,
  },
  currency: {
    fontSize: 30,
    color: colors.darkBlue,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontFamily: "Rubik",
    fontSize: 30,
    color: colors.darkBlue,
  },
  errorText: {
    color: colors.alert,
    fontSize: 12,
  },
  closeContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: colors.fog,
    marginLeft: 6,
  },
});

export default AmountInput;
