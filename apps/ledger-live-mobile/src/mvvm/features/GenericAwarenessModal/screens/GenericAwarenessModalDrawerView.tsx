import React from "react";
import { GenericAwarenessModalDrawer } from "../components/GenericAwarenessModalDrawer";
import { useGenericAwarenessModalDrawerViewModel } from "./useGenericAwarenessModalDrawerViewModel";

export function GenericAwarenessModalDrawerView() {
  const { isOpen, data, bottomInset, onClose } = useGenericAwarenessModalDrawerViewModel();

  return (
    <GenericAwarenessModalDrawer
      isOpen={isOpen}
      onClose={onClose}
      data={data}
      bottomInset={bottomInset}
    />
  );
}
