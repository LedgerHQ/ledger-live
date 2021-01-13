// @flow
import React, { Component } from "react";
import { Trans } from "react-i18next";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { BigNumber } from "bignumber.js";
import {
  sanitizeValueString,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/lib/currencies";

import LText from "../../../components/LText/index";

import Check from "../../../icons/Check";
import { CUSTOM_FEES_CAP } from "../../../constants";
import { withTheme } from "../../../colors";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const satoshiUnit = bitcoinCurrency.units[bitcoinCurrency.units.length - 1];

type Props = {
  title: React$Node,
  last?: boolean,
  initialValue: ?BigNumber,
  onPress: BigNumber => void,
  isSelected: boolean,
  isValid?: boolean,
  colors: *,
};

type State = {
  fees: ?string,
};

class FeesRow extends Component<Props, State> {
  static defaultProps = {
    last: false,
    isValid: true,
  };

  state = {
    fees: (this.props.initialValue || "").toString(),
  };

  input: * = React.createRef();

  onChangeText = (text: string) => {
    const { onPress } = this.props;
    const fees = sanitizeValueString(satoshiUnit, text);

    if (BigNumber(fees.value).gt(CUSTOM_FEES_CAP)) {
      fees.value = `${CUSTOM_FEES_CAP}`;
      fees.display = `${CUSTOM_FEES_CAP}`;
    }

    this.setState({ fees: fees.display }, () => {
      if (fees.value !== "") {
        onPress(BigNumber(fees.value));
      } else {
        onPress(BigNumber(0));
      }
    });
  };

  onPress = () => {
    const { onPress, initialValue } = this.props;
    const { fees } = this.state;

    if (fees) {
      onPress(BigNumber(fees));
    } else if (initialValue) {
      onPress(initialValue);
    } else {
      onPress(BigNumber(0));
    }

    if (this.input.current) {
      this.input.current.focus();
    }
  };

  render() {
    const { title, last, isSelected, isValid, colors } = this.props;

    return (
      <TouchableOpacity onPress={this.onPress}>
        <View
          style={[
            styles.root,
            { borderBottomColor: colors.lightFog },
            last ? styles.last : null,
          ]}
        >
          <View
            style={[
              styles.iconContainer,

              isSelected
                ? {
                    ...styles.iconContainerSelected,
                    borderColor: colors.live,
                    backgroundColor: colors.live,
                  }
                : {
                    borderColor: colors.fog,
                  },
            ]}
          >
            {isSelected ? <Check size={14} color={colors.white} /> : null}
          </View>
          <View style={styles.titleContainer}>
            <LText
              semiBold={isSelected}
              style={[styles.title]}
              color={isSelected ? "darkBlue" : "grey"}
            >
              {title}
            </LText>
            <LText secondary color={isValid ? "grey" : "alert"}>
              <Trans i18nKey="send.fees.required" />
            </LText>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={this.input}
              style={[
                styles.textInput,
                isSelected ? styles.textInputSelected : null,
                { color: colors.darkBlue },
              ]}
              onFocus={this.onPress}
              onChangeText={this.onChangeText}
              value={this.state.fees && isSelected ? `${this.state.fees}` : ""}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <LText style={styles.text} semiBold={isSelected}>
              <Trans i18nKey="common.satPerByte" />
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
    ...Platform.select({
      ios: {
        paddingVertical: 16,
      },
    }),

    borderBottomWidth: 1,
  },
  last: {
    borderBottomWidth: 0,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: 24,
  },
  title: {
    fontSize: 14,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 50,
    marginRight: 16,
  },
  iconContainerSelected: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {},
  textInput: {
    fontSize: 14,

    textAlign: "right",
    ...Platform.select({
      ios: {
        marginRight: 6,
      },
    }),
  },
  textInputSelected: {
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default withTheme(FeesRow);
