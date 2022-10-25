import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import Touchable from "./Touchable";
import CloseIcon from "../icons/Close";
import ConfirmationModal from "./ConfirmationModal";

type Props = {
  preferDismiss?: boolean;
  skipNavigation?: boolean;
  color?: string;
  withConfirmation?: boolean;
  confirmationTitle?: React.ReactNode;
  confirmationDesc?: React.ReactNode;
  onClose?: (..._: Array<any>) => any;
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
  const [onModalHide, setOnModalHide] = useState();
  const close = useCallback(() => {
    if (skipNavigation) {
      // onClose should always be called at the end of the close method,
      // so the callback will not interfere with the expected behavior of this component
      onClose();
      return;
    }

    if (navigation.getParent().pop && preferDismiss) {
      navigation.getParent().pop();
      onClose();
      return;
    }

    if (navigation.closeDrawer) navigation.closeDrawer();
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
