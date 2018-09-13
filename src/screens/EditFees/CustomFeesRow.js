// @flow
import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";

import LText from "../../components/LText/index";
import Check from "../../icons/Check";

import colors from "../../colors";

type Props = {
  title: string,
  last?: boolean,
  currentValue: number,
  onPress: number => void,
};

type State = {
  fees: ?number,
};

class FeesRow extends Component<Props, State> {
  static defaultProps = {
    link: "",
    last: false,
  };

  state = {
    fees: this.props.currentValue || undefined,
  };

  // $FlowFixMe
  input = React.createRef();

  onChangeText = (fees: string) => {
    const { onPress } = this.props;
    const nbFees = parseInt(fees, 10);
    this.setState(state => ({ ...state, fees: nbFees }), () => onPress(nbFees));
  };

  onPress = () => {
    const { onPress } = this.props;
    onPress(0);
    this.input.current.focus();
  };

  render(): React$Node {
    const { title, last, currentValue } = this.props;
    const isSelected =
      currentValue !== 5 && currentValue !== 10 && currentValue !== 15;

    return (
      <TouchableOpacity onPress={this.onPress}>
        <View style={[styles.root, last ? styles.last : null]}>
          <View
            style={[
              styles.iconContainer,
              isSelected ? styles.iconContainerSelected : null,
            ]}
          >
            {isSelected ? <Check size={14} color={colors.white} /> : null}
          </View>
          <View style={styles.titleContainer}>
            <LText
              semiBold={isSelected}
              style={[styles.title, isSelected ? styles.titleSelected : null]}
            >
              {title}
            </LText>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={this.input}
              style={[
                styles.textInput,
                isSelected ? styles.textInputSelected : null,
              ]}
              onChangeText={this.onChangeText}
              value={this.state.fees && isSelected ? `${this.state.fees}` : ""}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <LText style={styles.text} semiBold={isSelected}>
              Sat/bytes
            </LText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    paddingRight: 16,
    paddingVertical: 16,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  last: {
    borderBottomWidth: 0,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  title: {
    fontSize: 14,
    color: colors.grey,
  },
  titleSelected: {
    color: colors.darkBlue,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.fog,
    borderRadius: 50,
    marginRight: 16,
  },
  iconContainerSelected: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: colors.live,
    backgroundColor: colors.live,
  },
  text: {
    color: colors.darkBlue,
  },
  textInput: {
    fontSize: 14,
    marginRight: 6,
    color: colors.darkBlue,
    textAlign: "right",
  },
  textInputSelected: {
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default FeesRow;
