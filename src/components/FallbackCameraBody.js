/* @flow */
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import Button from "./Button";
import FallbackCamera from "../icons/FallbackCamera";

type Props = {
  title: string,
  description: string,
  buttonTitle: string,
  onPress: () => void,
};
function FallbackCameraBody({
  title,
  description,
  buttonTitle,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const IconSettings = <Icon name="settings" size={16} color={colors.white} />;
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <FallbackCamera />
        <LText secondary bold style={styles.title}>
          {title}
        </LText>
        <LText style={styles.desc} color="smoke">
          {description}
        </LText>
        <Button
          event="CameraOpenSettings"
          type="primary"
          title={buttonTitle}
          onPress={onPress}
          containerStyle={styles.buttonContainer}
          IconLeft={IconSettings}
        />
      </View>
    </View>
  );
}

export default memo<Props>(FallbackCameraBody);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    alignItems: "center",
  },
  title: {
    marginTop: 40,
    marginBottom: 16,
    fontSize: 18,
  },
  desc: {
    marginHorizontal: 40,
    textAlign: "center",
    marginBottom: 48,
  },
  buttonContainer: {
    width: 290,
  },
});
