import React, { useState, useEffect } from "react";
import { Observable } from "rxjs";
import TransportBLE from "../../react-native-hw-transport-ble";
import {
  BluetoothPromptResult,
  usePromptBluetoothCallbackWithState,
} from "../../logic/usePromptBluetoothCallback";
import BluetoothDisabled from "./BluetoothDisabled";
import BluetoothPermissionDenied from "./BluetoothPermissionDenied";

type Props = {
  children?: React.ReactNode;
};

const RequiresBluetoothEnabled: React.FC<Props> = ({ children }) => {
  const [type, setType] = useState<string>("Unknown");

  const { prompt, bluetoothPromptedOnce, bluetoothPromptResult } =
    usePromptBluetoothCallbackWithState();

  useEffect(() => {
    prompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = new Observable(TransportBLE.observeState).subscribe({
      next: ({ type }: { type: string }) => setType(type),
    });
    return () => sub.unsubscribe();
  }, []);

  if (type === "Unknown" || !bluetoothPromptedOnce) return null; // suspense PLZ

  if (bluetoothPromptResult === BluetoothPromptResult.UNAUTHORIZED) {
    return <BluetoothPermissionDenied />;
  }

  if (type === "PoweredOn") {
    return <>{children}</>;
  }

  return <BluetoothDisabled onRetry={prompt} />;
};

export default RequiresBluetoothEnabled;
