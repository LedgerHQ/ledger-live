import React, { useCallback, useState } from "react";
import { TouchableOpacity } from "react-native";

import { BaseModalProps } from "../BaseModal";
import BottomDrawer from "../BottomDrawer";

export default function Tooltip({
  children,
  tooltipContent,
  ...restProps
}: BaseModalProps & {
  tooltipContent: BaseModalProps["children"];
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      <TouchableOpacity onPress={openModal}>{children}</TouchableOpacity>
      <BottomDrawer
        {...restProps}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        {tooltipContent}
      </BottomDrawer>
    </>
  );
}
