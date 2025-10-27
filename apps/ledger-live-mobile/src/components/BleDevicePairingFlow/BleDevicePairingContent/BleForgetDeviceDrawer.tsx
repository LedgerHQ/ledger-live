import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { BleForgetDeviceIllustration } from "./BleForgetDeviceIllustration";

type BleForgetDeviceDrawerProps = {
  isOpen: boolean;
  productName: string;
  onRetry: () => void;
};

/**
 * Drawer displayed to tell the user how to forget the device from bluetooth settings
 * @params productName Device name: e.g. "Ledger Flex"
 */
export function BleForgetDeviceDrawer({
  isOpen,
  productName,
  onRetry,
}: Readonly<BleForgetDeviceDrawerProps>) {
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onRetry} hasBackButton={false}>
      <BleForgetDeviceIllustration productName={productName} onRetry={onRetry} />
    </QueuedDrawer>
  );
}
