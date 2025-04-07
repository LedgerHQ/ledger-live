import { BehaviorSubject, Subscription } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

export type DMKTransport = Transport & {
  sessionId: string;
  dmk: DeviceManagementKit;
  listenToDisconnect: () => Subscription;
  disconnect: (id?: string) => Promise<void> | void;
};

export const activeDeviceSessionSubject = new BehaviorSubject<{
  sessionId: string;
  transport: DMKTransport;
} | null>(null);
