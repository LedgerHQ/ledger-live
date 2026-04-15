import { type Observable, concat, interval } from "rxjs";
import { map, take } from "rxjs/operators";
import type { Job } from "@ledgerhq/device-intent";
import type { TimerDemoIntentInput, TimerDemoIntentJobState } from "./types";

export const timerDemoIntentJob: Job<TimerDemoIntentJobState, TimerDemoIntentInput> = ({
  input,
}): Observable<TimerDemoIntentJobState> =>
  concat(
    interval(1000).pipe(
      take(input.tickCount),
      map(i => ({ type: "tick" as const, count: i + 1, total: input.tickCount })),
    ),
  );
