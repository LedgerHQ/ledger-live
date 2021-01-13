/* @flow */
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import Touchable from "./Touchable";
import CloseIcon from "../icons/Close";
import ConfirmationModal from "./ConfirmationModal";

type Props = {
  preferDismiss?: boolean,
  skipNavigation?: boolean,
  color?: string,
  withConfirmation?: boolean,
  confirmationTitle?: React$Node,
  confirmationDesc?: React$Node,
  onClose?: Function,
};

export default function HeaderRightClose({
  color,
  preferDismiss = true,
  skipNavigation,
  withConfirmation,
  confirmationTitle,
  confirmationDesc,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [isConfirmationModalOpened, setIsConfirmationModalOpened] = useState(
    false,
  );
  const [onModalHide, setOnModalHide] = useState();

  function close(): void {
    if (onClose) {
      onClose();
    }

    if (skipNavigation) {
      return;
    }

    if (navigation.dangerouslyGetParent().pop && preferDismiss) {
      navigation.dangerouslyGetParent().pop();
      return;
    }

    if (navigation.closeDrawer) navigation.closeDrawer();

    navigation.goBack();
  }

  function onPress(): void {
    if (withConfirmation) {
      openConfirmationModal();
    } else {
      close();
    }
  }

  function openConfirmationModal(): void {
    setIsConfirmationModalOpened(true);
  }

  function closeConfirmationModal(): void {
    setIsConfirmationModalOpened(false);
  }

  function onConfirm() {
    setOnModalHide(close);
    setIsConfirmationModalOpened(false);
  }

  return (
    <Touchable
      event="HeaderRightClose"
      onPress={onPress}
      style={styles.wrapper}
    >
      <CloseIcon size={18} color={color || colors.grey} />
      {withConfirmation && (
        <ConfirmationModal
          isOpened={isConfirmationModalOpened}
          onClose={closeConfirmationModal}
          onConfirm={onConfirm}
          confirmationTitle={confirmationTitle}
          confirmationDesc={confirmationDesc}
          onModalHide={onModalHide}
        />
      )}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
});
