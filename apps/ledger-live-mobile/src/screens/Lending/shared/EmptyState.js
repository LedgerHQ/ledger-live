// @flow
import React from "react";
import { View, StyleSheet, Image } from "react-native";
// import { NavigatorName } from "../../../const";

import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import Button from "../../../components/Button";

import compoundImg from "../../../images/compound.png";

type EmptyStateProps = {
  title: string,
  description: string,
  buttonLabel: string,
  onClick?: () => void,
};

export default function EmptyState({
  title,
  description,
  buttonLabel,
  onClick,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyStateRoot, { backgroundColor: colors.card }]}>
      <Image resizeMode="contain" style={styles.image} source={compoundImg} />
      <LText semiBold style={styles.title}>
        {title}
      </LText>
      <LText style={styles.description} color="grey">
        {description}
      </LText>
      {onClick && (
        <Button
          type="primary"
          event="Lending Dashboard EmptyState Press"
          onPress={onClick}
          title={buttonLabel}
          containerStyle={styles.emptyStateButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 16,
  },
  image: {
    height: 90,
    marginVertical: 16,
  },
  emptyStateRoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 4,
    borderRadius: 4,
  },
  title: {
    lineHeight: 19,
    fontSize: 14,
    textAlign: "center",
  },
  description: {
    lineHeight: 19,
    fontSize: 13,
    textAlign: "center",
    padding: 16,
  },
  emptyStateButton: { width: "100%" },
});
