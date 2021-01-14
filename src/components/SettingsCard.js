/* @flow */

import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import Card from "./Card";
import LText from "./LText";
import Circle from "./Circle";

type Props = {
  title: string,
  desc: string,
  icon: any,
  onClick: Function,
};
export default function SettingsCard({ title, desc, icon, onClick }: Props) {
  const { colors } = useTheme();

  return (
    <Card
      onPress={onClick}
      style={[styles.cardStyle, { backgroundColor: colors.card }]}
    >
      <Circle bg={colors.lightLive} size={32}>
        {icon}
      </Circle>
      <View style={styles.cardTextBlock}>
        <LText secondary semiBold style={styles.title} color="darkBlue">
          {title}
        </LText>
        <LText style={styles.desc} color="grey">
          {desc}
        </LText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardStyle: {
    overflow: "visible",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginVertical: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  cardTextBlock: {
    flexDirection: "column",
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 17,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
  },
});
