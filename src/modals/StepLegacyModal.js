/* @flow */

import React from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import BottomModal from "../components/BottomModal";
import Button from "../components/Button";
import { rgba } from "../colors";
import IconInfo from "../icons/Info";
import LText from "../components/LText";
import Circle from "../components/Circle";

type Props = {
  isOpened: boolean,
  onClose: () => void,
};

export default function StepLegacyModal({ isOpened, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <BottomModal
      id="StepLegacyModal"
      style={styles.root}
      isOpened={isOpened}
      onClose={onClose}
    >
      <Circle bg={rgba(colors.live, 0.1)} size={56}>
        <IconInfo size={24} color={colors.live} />
      </Circle>
      <LText style={styles.description} color="smoke">
        <Trans i18nKey="StepLegacyModal.description" />
      </LText>
      <View style={styles.buttonWrapper}>
        <Button
          event="StepLegacyModalGotIt"
          type="primary"
          containerStyle={styles.buttonContainer}
          title={<Trans i18nKey="common.gotit" />}
          onPress={onClose}
        />
      </View>
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  description: {
    paddingVertical: 16,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  image: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  buttonWrapper: {
    flexDirection: "row",
  },
  buttonContainer: {
    flexGrow: 1,
    paddingHorizontal: 8,
  },
});
