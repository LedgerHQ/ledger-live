import { concat, of, timer } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import type { Job } from "@ledgerhq/device-intent";
import type {
  GetEthAddressDMKSignerDemoIntentInput,
  GetEthAddressDMKSignerDemoIntentJobState,
} from "./types";

const TERMINAL_DELAY_MS = 1000;

export const getEthAddressDMKSignerDemoIntentJob: Job<
  GetEthAddressDMKSignerDemoIntentJobState,
  GetEthAddressDMKSignerDemoIntentInput
> = ({ input }) =>
  concat(
    of<GetEthAddressDMKSignerDemoIntentJobState>({
      type: "deriving",
      daStatus: "pending",
      userInteraction: "verifyAddress",
    }),
    of<GetEthAddressDMKSignerDemoIntentJobState>({
      type: "derived",
      address: `debug-eth-address-${input.derivationPath}`,
    }),
    timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
  );
