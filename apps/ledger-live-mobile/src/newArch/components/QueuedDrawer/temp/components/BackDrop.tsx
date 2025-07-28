import React from "react";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";

interface BackDropProps extends React.ComponentProps<typeof BottomSheetBackdrop> {
  showBackdropPress?: boolean;
}

const BackDrop = ({ showBackdropPress, ...props }: BackDropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    pressBehavior={showBackdropPress ? "none" : "close"}
  />
);

export default BackDrop;
