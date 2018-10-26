// @flow

import React, { PureComponent } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

import colors, { rgba } from "../../colors";
import LText from "../../components/LText";
import IconWarning from "../../icons/Warning";
import TranslatedError from "../../components/TranslatedError";

type Props = {
  t: *,
  error: Error,
  onRetry: () => void,
  style: *,
};

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class AddAccountsHeaderError extends PureComponent<Props> {
  render() {
    const { error, onRetry, style, t } = this.props;

    return (
      <View style={[styles.root, style]}>
        <IconWarning color={colors.alert} size={16} />
        <LText semiBold style={[styles.errorText, styles.leftSide]}>
          <TranslatedError error={error} />
        </LText>
        <TouchableOpacity onPress={onRetry} hitSlop={hitSlop}>
          <LText semiBold style={styles.errorText}>
            {t("addAccounts.retry")}
          </LText>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: rgba(colors.alert, 0.08),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: rgba(colors.alert, 0.3),
    borderRadius: 4,
    padding: 8,
  },
  leftSide: {
    flex: 1,
    marginRight: 24,
    marginLeft: 8,
  },
  errorText: {
    color: colors.alert,
  },
});

export default AddAccountsHeaderError;
