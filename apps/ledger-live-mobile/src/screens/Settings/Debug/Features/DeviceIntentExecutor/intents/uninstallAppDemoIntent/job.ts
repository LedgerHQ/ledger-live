import { EMPTY, Subject, concat, defer, of, timer, type Observable } from "rxjs";
import {
  catchError,
  filter,
  finalize,
  ignoreElements,
  map,
  switchMap,
  take,
  takeWhile,
} from "rxjs/operators";
import { DeviceActionStatus, UninstallAppDeviceAction } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import type { UninstallAppDemoIntentInput, UninstallAppDemoIntentJobState } from "./types";

const TERMINAL_DELAY_MS = 3000;

function runUninstallDeviceAction(
  connectionResult: DeviceConnectionResult,
  appName: string,
): Observable<UninstallAppDemoIntentJobState> {
  return defer(() => {
    const { dmk, sessionId } = connectionResult;
    const da = new UninstallAppDeviceAction({
      input: { appName, unlockTimeout: 0 },
    });
    const { observable, cancel } = dmk.executeDeviceAction({
      sessionId,
      deviceAction: da,
    });

    return observable.pipe(
      finalize(cancel),
      map(state => {
        if (state.status === DeviceActionStatus.Pending) {
          return {
            type: "uninstalling" as const,
            userInteraction: state.intermediateValue.requiredUserInteraction,
          };
        }
        if (state.status === DeviceActionStatus.Completed) {
          return { type: "uninstallSuccess" as const };
        }
        if (state.status === DeviceActionStatus.Error) {
          return { type: "uninstallFailed" as const, error: state.error };
        }
        return null;
      }),
      filter((s): s is NonNullable<typeof s> => s !== null),
      takeWhile(s => s.type === "uninstalling", true),
      catchError(err =>
        of<UninstallAppDemoIntentJobState>({ type: "uninstallFailed", error: err }),
      ),
    );
  });
}

export const uninstallAppDemoIntentJob: Job<
  UninstallAppDemoIntentJobState,
  UninstallAppDemoIntentInput
> = ({ deviceConnectionResult, input }) => {
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
              runUninstallDeviceAction(deviceConnectionResult, input.appName),
              timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
            ),
      ),
    ),
  );
};
