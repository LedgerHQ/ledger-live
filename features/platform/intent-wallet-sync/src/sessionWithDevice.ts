import { defer } from "rxjs";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";

/** The transport the key ring SDK hands to a device job, derived from its `WithDevice` type. */
type SdkTransport = Parameters<Parameters<ReturnType<WithDevice>>[0]>[0];

/**
 * The SDK's `WithDevice` for one DIE session: each device job runs on a transport the app
 * creates when the job is subscribed.
 */
export function sessionWithDevice(createTransport: () => SdkTransport): WithDevice {
  return () => job => defer(() => job(createTransport()));
}
