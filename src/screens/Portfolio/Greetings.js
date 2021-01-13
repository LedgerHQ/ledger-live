// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText";

const getCurrentGreetings = () => {
  const localTimeHour = new Date().getHours();
  const afternoonBreakpoint = 12;
  const eveningBreakpoint = 17;
  if (
    localTimeHour >= afternoonBreakpoint &&
    localTimeHour < eveningBreakpoint
  ) {
    return "portfolio.greeting.afternoon";
  }
  if (localTimeHour >= eveningBreakpoint) {
    return "portfolio.greeting.evening";
  }
  return "portfolio.greeting.morning";
};

class Greetings extends PureComponent<{
  nbAccounts: number,
}> {
  render() {
    const { nbAccounts } = this.props;
    return (
      <View style={styles.root}>
        <LText secondary color="darkBlue" style={styles.title} bold>
          {<Trans i18nKey={getCurrentGreetings()} />}
        </LText>
        <LText
          secondary
          color="grey"
          style={styles.description}
          numberOfLines={2}
        >
          {
            <Trans
              i18nKey="portfolio.summary"
              count={nbAccounts}
              values={{ count: nbAccounts }}
            />
          }
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    justifyContent: "center",
  },
  description: {
    marginTop: 5,
    fontSize: 14,
  },
});

export default Greetings;
