import { Device } from "@ledgerhq/live-common/hw/actions/types";

export type DisplayedDevice = Device & { available?: boolean };
