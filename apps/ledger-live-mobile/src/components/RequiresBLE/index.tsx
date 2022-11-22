// renders children if BLE is available
// otherwise render an error
import React, { useEffect, useState } from "react";
import { Observable } from "rxjs";
import TransportBLE from "../../react-native-hw-transport-ble";
import RequiresLocationOnAndroid from "./RequiresLocationOnAndroid";
import BluetoothDisabled from "./BluetoothDisabled";
import { usePromptBluetoothCallback } from "../../logic/usePromptBluetoothCallback";

type Props = {
  children: React.ReactNode;
};

const RequiresBLE: React.FC<Props> = ({ children }) => {
  const [type, setType] = useState<string>("Unknown");

  const [bluetoothPrompted, setBluetoothPrompted] = useState(false);
  const promptBluetoothPermissions = usePromptBluetoothCallback();

  useEffect(() => {
    promptBluetoothPermissions().finally(() => setBluetoothPrompted(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = Observable.create(TransportBLE.observeState).subscribe({
      next: ({ type }: { type: string }) => setType(type),
    });
    return () => sub.unsubscribe();
  }, []);

  if (!bluetoothPrompted) return null;
  if (type === "Unknown") return null; // suspense PLZ

  if (type === "PoweredOn") {
    return <>{children}</>;
  }

  return <BluetoothDisabled />;
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
