// @flow
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import colors from "../../colors";

class ResultSection extends PureComponent<{ mode: string }> {
  render() {
    const { mode } = this.props;
    let text;
    switch (mode) {
      case "create":
        text = <Trans i18nKey="account.import.result.newAccounts" />;
        break;
      case "patch":
        text = <Trans i18nKey="account.import.result.updatedAccounts" />;
        break;
      case "id":
        text = <Trans i18nKey="account.import.result.alreadyImported" />;
        break;
      case "unsupported":
        text = <Trans i18nKey="account.import.result.unsupported" />;
        break;
      case "settings":
        text = <Trans i18nKey="account.import.result.settings" />;
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

export default ResultSection;
