import { concat, of, timer } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import type { Job } from "@ledgerhq/device-intent";
import type {
  GetAddressLegacyWithDeviceDemoIntentInput,
  GetAddressLegacyWithDeviceDemoIntentJobState,
} from "./types";

const TERMINAL_DELAY_MS = 1000;

export const getAddressLegacyWithDeviceDemoIntentJob: Job<
  GetAddressLegacyWithDeviceDemoIntentJobState,
  GetAddressLegacyWithDeviceDemoIntentInput
> = ({ input }) =>
  concat(
    of<GetAddressLegacyWithDeviceDemoIntentJobState>({ type: "deriving" }),
    of<GetAddressLegacyWithDeviceDemoIntentJobState>({ type: "gotTransport" }),
    of<GetAddressLegacyWithDeviceDemoIntentJobState>({
      type: "completed",
      address: `debug-${input.currencyId}-${input.path}`,
    }),
    timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
  );
