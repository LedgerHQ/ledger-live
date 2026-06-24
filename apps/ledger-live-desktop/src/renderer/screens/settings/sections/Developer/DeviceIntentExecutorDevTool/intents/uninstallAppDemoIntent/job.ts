import { EMPTY, Subject, concat, of, timer } from "rxjs";
import { ignoreElements, switchMap, take } from "rxjs/operators";
import type { Job } from "@ledgerhq/device-intent";
import type { UninstallAppDemoIntentInput, UninstallAppDemoIntentJobState } from "./types";

const TERMINAL_DELAY_MS = 1000;

export const uninstallAppDemoIntentJob: Job<
  UninstallAppDemoIntentJobState,
  UninstallAppDemoIntentInput
> = () => {
  const decision$ = new Subject<"confirm" | "skip">();

  return concat(
    of<UninstallAppDemoIntentJobState>({
      type: "promptUninstall",
      confirm: () => decision$.next("confirm"),
      skip: () => decision$.next("skip"),
    }),
    decision$.pipe(
      take(1),
      switchMap(choice =>
        choice === "skip"
          ? EMPTY
          : concat(
              of<UninstallAppDemoIntentJobState>({
                type: "uninstalling",
                userInteraction: "confirmOnDevice",
              }),
              of<UninstallAppDemoIntentJobState>({ type: "uninstallSuccess" }),
              timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
            ),
      ),
    ),
  );
};
