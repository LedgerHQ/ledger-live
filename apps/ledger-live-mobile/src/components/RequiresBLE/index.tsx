// renders children if BLE is available
// otherwise render an error
import React, { useCallback, useEffect, useState } from "react";
import { Observable } from "rxjs";
import TransportBLE from "../../react-native-hw-transport-ble";
import RequiresLocationOnAndroid from "./RequiresLocationOnAndroid";
import BluetoothDisabled from "./BluetoothDisabled";
import { usePromptBluetoothCallback } from "../../logic/usePromptBluetoothCallback";
import { Platform } from "react-native";

type Props = {
  children: React.ReactNode;
};

const RequiresBLE: React.FC<Props> = ({ children }) => {
  const [type, setType] = useState<string>("Unknown");

  const [bluetoothPromptedOnce, setBluetoothPromptedOnce] = useState(false);
  const [bluetoothPromptSucceeded, setBluetoothPromptSucceeded] =
    useState(true);
  const promptBluetoothPermissions = usePromptBluetoothCallback();

  const prompt = useCallback(() => {
    setBluetoothPromptedOnce(true);
    promptBluetoothPermissions()
      .then(
        res =>
          setBluetoothPromptSucceeded(Platform.OS === "android" ? !!res : true), // on iOS we don't have the actual result
      )
      .catch(() => setBluetoothPromptSucceeded(false));
  }, [promptBluetoothPermissions]);

  useEffect(() => {
    prompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = Observable.create(TransportBLE.observeState).subscribe({
      next: ({ type }: { type: string }) => setType(type),
    });
    return () => sub.unsubscribe();
  }, []);

  if (type === "Unknown" || !bluetoothPromptedOnce) return null; // suspense PLZ

  if (!bluetoothPromptSucceeded) return <BluetoothDisabled onRetry={prompt} />;

  if (type === "PoweredOn") {
    return <>{children}</>;
  }

  return <BluetoothDisabled onRetry={prompt} />;
};

export default function RequiresBLEWrapped({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <RequiresLocationOnAndroid>
      <RequiresBLE>{children}</RequiresBLE>
    </RequiresLocationOnAndroid>
  );
}
