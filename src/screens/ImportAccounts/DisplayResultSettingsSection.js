// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import LText from "../../components/LText";
import colors from "../../colors";
import ResultSection from "./ResultSection";
import CheckBox from "../../components/CheckBox";

class DisplayResultSettingsSection extends PureComponent<{
  checked: boolean,
  onSwitch: boolean => void,
}> {
  render() {
    const { checked, onSwitch } = this.props;
    return (
      <View style={styles.root}>
        <ResultSection mode="settings" />
        <View style={styles.row}>
          <Icon name="settings" size={20} color={colors.grey} />
          <LText style={styles.label} semiBold>
            <Trans i18nKey="account.import.result.includeGeneralSettings" />
          </LText>
          <CheckBox onChange={onSwitch} isChecked={checked} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {},
  row: {
    backgroundColor: colors.lightGrey,
    borderRadius: 4,
    paddingHorizontal: 8,

    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    marginHorizontal: 10,
    flex: 1,
  },
});

export default DisplayResultSettingsSection;
