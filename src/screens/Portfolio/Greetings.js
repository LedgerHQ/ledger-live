// @flow

import React from "react";
import { useTranslation } from "react-i18next";

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

const Greetings = ({ nbAccounts }: { nbAccounts: number }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <LText secondary color="darkBlue" style={styles.title} bold>
        {t(getCurrentGreetings())}
      </LText>
      <LText
        secondary
        color="grey"
        style={styles.description}
        numberOfLines={2}
      >
        {t("portfolio.summary", { count: nbAccounts })}
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    justifyContent: "center",
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
