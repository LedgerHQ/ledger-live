import React from "react";
import { OsUpdateStateSheet } from "../sheets/OsUpdateStateSheet/OsUpdateStateSheet";
import { UpdateOnDesktopContent } from "../sheets/UpdateOnDesktopContent/UpdateOnDesktopContent";
import {
  useUpdateOnDesktopSheetViewModel,
  type UpdateOnDesktopSheetProps,
} from "./useUpdateOnDesktopSheetViewModel";

export function UpdateOnDesktopSheet(props: UpdateOnDesktopSheetProps) {
  const { onGotIt } = useUpdateOnDesktopSheetViewModel(props);

  return (
    <OsUpdateStateSheet isOpen={props.isOpen} onClose={props.onClose} hideHeader>
      <UpdateOnDesktopContent productName={props.productName} onGotIt={onGotIt} />
    </OsUpdateStateSheet>
  );
}
