import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";

import lottie from "~/screens/Onboarding/assets/nanoX/pairDevice/dark.json";

import Animation from "../Animation";
import Button from "../wrappedUi/Button";

type Props = {
  onPairNewDevice: () => void;
  hideAnimation?: boolean;
};

function BluetoothEmpty({ onPairNewDevice, hideAnimation }: Props) {
  return (
    <>
      {hideAnimation ? null : (
        <View style={styles.imageContainer}>
          <Animation source={lottie} style={styles.image} />
        </View>
      )}
      <Flex alignItems={"center"} flexDirection={"row"} mb={6}>
        <BluetoothMedium size={24} color={"neutral.c100"} />
        <Box ml={6}>
          <Text variant={"large"} fontWeight={"semiBold"}>
            <Trans i18nKey="SelectDevice.bluetooth.title" />
          </Text>
          <Text variant={"body"} fontWeight={"medium"}>
            <Trans i18nKey="SelectDevice.bluetooth.label" />
          </Text>
        </Box>
      </Flex>
      <Button mb={5} event="PairDevice" type="main" onPress={onPairNewDevice} testID="pair-device">
        <Trans i18nKey="SelectDevice.deviceNotFoundPairNewDevice" />
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    minHeight: 200,
    maxWidth: 550,
    position: "relative",
    overflow: "visible",
  },
  image: {
    position: "absolute",
    left: "15%",
    top: 30,
    width: "120%",
  },
});

export default memo<Props>(BluetoothEmpty);
