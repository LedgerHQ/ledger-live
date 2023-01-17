import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTheme } from "styled-components/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import Button from "./Button";
import FallbackCamera from "../icons/FallbackCamera";

type Props = {
  title: string;
  description: string;
  buttonTitle: string;
  onPress: () => void;
};

function FallbackCameraBody({
  title,
  description,
  buttonTitle,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const IconSettings = () => (
    <Icon name="settings" size={16} color={colors.palette.neutral.c100} />
  );

  return (
    <Flex flex={1} bg="background.main" px={6}>
      <View style={styles.body}>
        <FallbackCamera color={colors.constant.white} />
        <Text variant="paragraph" mt={9} mb={3} fontSize={6}>
          {title}
        </Text>
        <Text variant="paragraph" color="neutral.c70" mb={10}>
          {description}
        </Text>
        <Button
          event="CameraOpenSettings"
          type="primary"
          title={buttonTitle}
          onPress={onPress}
          containerStyle={styles.buttonContainer}
          IconLeft={IconSettings}
        />
      </View>
    </Flex>
  );
}

export default memo<Props>(FallbackCameraBody);
const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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
