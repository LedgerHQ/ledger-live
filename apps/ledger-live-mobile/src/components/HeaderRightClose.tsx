import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Props as BottomModalProps } from "./QueuedDrawer";
import Touchable from "./Touchable";
import CloseIcon from "../icons/Close";
import ConfirmationModal from "./ConfirmationModal";
import { StackNavigatorNavigation } from "./RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";

type Props = {
  preferDismiss?: boolean;
  skipNavigation?: boolean;
  color?: string;
  withConfirmation?: boolean;
  confirmationTitle?: React.ReactNode;
  confirmationDesc?: React.ReactNode;
  onClose?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyFunction = () => {};

export default function HeaderRightClose({
  color,
  preferDismiss = true,
  skipNavigation,
  withConfirmation,
  confirmationTitle,
  confirmationDesc,
  onClose = emptyFunction,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isConfirmationModalOpened, setIsConfirmationModalOpened] =
    useState(false);
  const [onModalHide, setOnModalHide] =
    useState<BottomModalProps["onModalHide"]>();
  const close = useCallback(() => {
    if (skipNavigation) {
      // onClose should always be called at the end of the close method,
      // so the callback will not interfere with the expected behavior of this component
      onClose && onClose();
      return;
    }

    if ((navigation.getParent() as { pop?: unknown }).pop && preferDismiss) {
      navigation
        .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
        .pop();
      onClose && onClose();
      return;
    }

    if ((navigation as { closeDrawer?: unknown }).closeDrawer)
      (navigation as unknown as { closeDrawer: () => void }).closeDrawer();
    navigation.goBack();
    onClose();
  }, [navigation, onClose, preferDismiss, skipNavigation]);
  const openConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpened(true);
  }, []);
  const onPress = useCallback(() => {
    if (withConfirmation) {
      openConfirmationModal();
    } else {
      close();
    }
  }, [close, openConfirmationModal, withConfirmation]);
  const closeConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpened(false);
  }, []);
  const onConfirm = useCallback(() => {
    setOnModalHide(close);
    setIsConfirmationModalOpened(false);
  }, [close]);
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
