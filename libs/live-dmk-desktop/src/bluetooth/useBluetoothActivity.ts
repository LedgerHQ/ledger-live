import { useEffect, useState } from "react";
import {
  bluetoothActivity$,
  getBluetoothActivity,
  type BluetoothActivity,
} from "./bluetoothActivity";

export const useBluetoothActivity = (): BluetoothActivity => {
  const [activity, setActivity] = useState(getBluetoothActivity);

  useEffect(() => {
    const subscription = bluetoothActivity$.subscribe(setActivity);
    return () => subscription.unsubscribe();
  }, []);

  return activity;
};
