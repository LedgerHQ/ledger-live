// @flow

import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";

import LText from "../../components/LText";
import Space from "../../components/Space";

import colors from "../../colors";

type Props = {
  nbAccounts: number,
  t: *,
};

const getCurrentGreetings = () => {
  const localTimeHour = new Date().getHours();
  const afternoonBreakpoint = 12;
  const eveningBreakpoint = 17;
  if (
    localTimeHour >= afternoonBreakpoint &&
    localTimeHour < eveningBreakpoint
  ) {
    return "common:portfolio.greeting.afternoon";
  } else if (localTimeHour >= eveningBreakpoint) {
    return "common:portfolio.greeting.evening";
  }
  return "common:portfolio.greeting.morning";
};

class Greetings extends PureComponent<Props> {
  render() {
    const { nbAccounts, t } = this.props;

    return (
      <View style={styles.root}>
        <LText secondary style={styles.greetingsText} bold>
          {t(getCurrentGreetings())}
        </LText>
        <Space h={5} />
        <LText secondary style={styles.nbAccountsText}>
          {t("common:portfolio.summary", { count: nbAccounts })}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  greetingsText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  nbAccountsText: {
    fontSize: 14,
    color: colors.darkBlue,
  },
});

export default translate()(Greetings);
