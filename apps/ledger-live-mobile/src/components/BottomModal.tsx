import React, { useCallback, useEffect, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { isModalLockedSelector } from "../reducers/appstate";

let isModalOpenedref: boolean | undefined = false;

export type Props = {
  id?: string;
  isOpened?: boolean;
  onClose?: () => void;
  onModalHide?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  preventBackdropClick?: boolean;
  noCloseButton?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const BottomModal = ({
  isOpened,
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

  // workarround to make sure no double modal can be opened at same time
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
  }, [isOpened, modalLock]); // do not add onClose it might cause some issues on modals ie: filter manager modal

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
