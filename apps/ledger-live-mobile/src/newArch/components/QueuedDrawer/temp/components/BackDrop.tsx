import React from "react";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";

interface BackDropProps extends React.ComponentProps<typeof BottomSheetBackdrop> {
  showBackdropPress?: boolean;
  onPress?: () => void;
}

const BackDrop = ({ showBackdropPress, onPress, ...props }: BackDropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    pressBehavior={showBackdropPress ? "none" : "close"}
    onPress={onPress}
  />
);

export default BackDrop;
