import React, { useCallback, useEffect, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import type { BaseModalProps } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal";
import { useSelector } from "react-redux";
import { isModalLockedSelector } from "../reducers/appstate";
import { Merge } from "../types/helpers";

let isModalOpenedref: boolean | undefined = false;

export type Props = Merge<
  BaseModalProps,
  {
    isOpened?: boolean;
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
  }
>;

const BottomModal = ({
  isOpened,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClose = () => {},
  children,
  style,
  preventBackdropClick,
  onModalHide,
  containerStyle,
  noCloseButton,
  ...rest
}: Props) => {
  const [open, setIsOpen] = useState(false);
  const modalLock = useSelector(isModalLockedSelector);

  // workaround to make sure no double modal can be opened at same time
  useEffect(
    () => () => {
      isModalOpenedref = false;
    },
    [],
  );

  useEffect(() => {
    if (!!isModalOpenedref && isOpened) {
      onClose();
    } else {
      setIsOpen(isOpened ?? false);
    }
    isModalOpenedref = isOpened;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]); // do not add onClose it might cause some issues on modals ie: filter manager modal

  const handleClose = useCallback(() => {
    if (modalLock) return;
    onClose && onClose();
    onModalHide && onModalHide();
  }, [modalLock, onClose, onModalHide]);

  return (
    <BottomDrawer
      preventBackdropClick={modalLock || preventBackdropClick}
      isOpen={open}
      onClose={handleClose}
      noCloseButton={modalLock || noCloseButton}
      modalStyle={style}
      containerStyle={containerStyle}
      {...rest}
    >
      {children}
    </BottomDrawer>
  );
};

export default BottomModal;
