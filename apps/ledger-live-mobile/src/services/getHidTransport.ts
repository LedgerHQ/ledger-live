import HIDTransport, { DeviceObj } from "@ledgerhq/react-native-hid";
import { DeviceManagementKitHIDTransport } from "@ledgerhq/live-dmk-mobile";
import type {
  DescriptorEvent,
  Observer as TransportObserver,
  Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
import { HwTransportError } from "@ledgerhq/errors";
import { TraceContext } from "@ledgerhq/logs";
import { SchedulerLike } from "rxjs";

/**
 * Temporary interface while DeviceManagementKitTransport and legacy hid transport
 * are integrated together in LLM
 */
interface CommonTransportConstructor {
  listen: (
    observer: TransportObserver<DescriptorEvent<string>, HwTransportError>,
    context?: TraceContext,
  ) => TransportSubscription;
  open: (
    deviceOrId: DeviceObj & string,
    timeoutMs?: number,
    context?: TraceContext,
    options?: { rxjsScheduler?: SchedulerLike },
  ) => Promise<HIDTransport | DeviceManagementKitHIDTransport>;
  disconnect?: () => Promise<void>;
}

export const getHIDTransport = (isLDMKEnabled: boolean): CommonTransportConstructor =>
  isLDMKEnabled ? DeviceManagementKitHIDTransport : HIDTransport;
