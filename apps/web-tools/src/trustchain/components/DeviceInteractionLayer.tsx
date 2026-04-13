import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";

export function DeviceInteractionLayer({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-overlay">
      <div className="flex max-w-md flex-col items-center gap-12 rounded-lg bg-base p-24 text-center">
        <p className="heading-4 text-base">Please accept the interaction on your device</p>
        <Spinner size={20} className="text-base" />
      </div>
    </div>
  );
}
