import React, { useCallback, useState } from "react";

import { BaseModalProps } from "@components/Layout/Modal/BaseModal";
import { TouchableOpacity } from "react-native";
import BottomDrawer from "@components/Layout/Modal/BottomDrawer";

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
