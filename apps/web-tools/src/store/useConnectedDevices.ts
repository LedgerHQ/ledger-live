import { useSyncExternalStore } from "react";
import type { Device } from "@devtools/wire";

let devices: Device[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export function setDevices(next: Device[]) {
  devices = next;
  notify();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => devices;

export function useConnectedDevices(): Device[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
