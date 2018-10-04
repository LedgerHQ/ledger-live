// @flow
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import { translate } from "react-i18next";
import LText from "../../components/LText";
import colors from "../../colors";

class ResultSection extends PureComponent<{ t: *, mode: string }> {
  render() {
    const { t, mode } = this.props;
    let text;
    switch (mode) {
      case "create":
        text = t("account.import.result.newAccounts");
        break;
      case "patch":
        text = t("account.import.result.updatedAccounts");
        break;
      case "id":
        text = t("account.import.result.alreadyImported");
        break;
      case "unsupported":
        text = t("account.import.result.unsupported");
        break;
      case "settings":
        text = t("account.import.result.settings");
        break;
      default:
        text = "";
    }
    return (
      <LText semiBold style={styles.sectionHeaderText}>
        {text}
      </LText>
    );
  }
}

const styles = StyleSheet.create({
  sectionHeaderText: {
    backgroundColor: colors.white,
    color: colors.grey,
    fontSize: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
});

export default translate()(ResultSection);
