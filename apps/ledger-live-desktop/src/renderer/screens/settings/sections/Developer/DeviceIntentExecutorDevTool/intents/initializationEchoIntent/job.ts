import { of, type Observable } from "rxjs";
import type { Job } from "@ledgerhq/device-intent";
import type { InitializationEchoIntentInput, InitializationEchoIntentJobState } from "./types";

export const initializationEchoIntentJob: Job<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput
> = ({ deviceExtractedContext }): Observable<InitializationEchoIntentJobState> =>
  of({
    type: "contextReceived",
    deviceExtractedContext,
  });
