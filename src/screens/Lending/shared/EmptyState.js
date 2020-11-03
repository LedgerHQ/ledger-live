// @flow
import React from "react";
import { View, StyleSheet, Image } from "react-native";
import colors from "../../../colors";
// import { NavigatorName } from "../../../const";

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
  return (
    <View style={styles.emptyStateRoot}>
      <Image resizeMode="contain" style={styles.image} source={compoundImg} />
      <LText semiBold style={styles.title}>
        {title}
      </LText>
      <LText style={styles.description}>{description}</LText>
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
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
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
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  title: {
    lineHeight: 19,
    fontSize: 14,
    color: colors.darkBlue,
    textAlign: "center",
  },
  description: {
    lineHeight: 19,
    fontSize: 13,
    color: colors.grey,
    textAlign: "center",
    padding: 16,
  },
  emptyStateButton: { width: "100%" },
});
