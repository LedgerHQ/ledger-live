import { BehaviorSubject } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

type DMKTransport = Transport & {
  sessionId: string;
  dmk: DeviceManagementKit;
  listenToDisconnect: () => void;
  disconnect: (id?: string) => Promise<void> | void;
};

export const activeDeviceSessionSubject = new BehaviorSubject<{
  sessionId: string;
  transport: DMKTransport;
  reenableRefresher?: () => void;
} | null>(null);
