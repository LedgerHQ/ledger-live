import Transport from "@ledgerhq/hw-transport";
import { Account, DeviceId, AnyMessage } from "@ledgerhq/types-live";

export type Result = {
  rsv: {
    r: string;
    s: string;
    v: number | string;
  };
  signature: string;
};

export type SignMessage = (
  transport: Transport,
  account: Account,
  messageData: AnyMessage,
) => Promise<Result>;

export type MessageSignerFn = (
  deviceId: DeviceId,
  account: Account,
  messageData: AnyMessage,
) => Promise<Result>;
