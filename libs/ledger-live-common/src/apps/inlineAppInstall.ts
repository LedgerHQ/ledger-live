import Transport from "@ledgerhq/hw-transport";
import { Observable, concat, of, from, EMPTY, defer } from "rxjs";
import { ConnectAppEvent } from "../hw/connectApp";
import getDeviceInfo from "../hw/getDeviceInfo";
import { listApps, execWithTransport } from "./hw";
import { reducer, initState, isOutOfMemoryState, predictOptimisticState } from "./logic";
import { runAllWithProgress } from "./runner";
import { InlineAppInstallEvent } from "./types";
import { mergeMap, map, throttleTime } from "rxjs/operators";

/**
 * Tries to install a list of apps
 *
 * @param transport Transport instance
 * @param appNames List of app names to install
 * @param onSuccessObs Optional observable to run after the installation
 * @param allowPartialDependencies If true, keep installing apps even if some are missing
 * @returns Observable of InlineAppInstallEvent or ConnectAppEvent
 * - Event "inline-install" contains a global progress of the installation
 */
const inlineAppInstall = ({
  transport,
  appNames,
  onSuccessObs,
  allowPartialDependencies = false,
}: {
  transport: Transport;
  appNames: string[];
  onSuccessObs?: () => Observable<any>;
  allowPartialDependencies?: boolean;
}): Observable<InlineAppInstallEvent | ConnectAppEvent> =>
  concat(
    of({
      type: "listing-apps",
    }),
    from(getDeviceInfo(transport)).pipe(
      mergeMap(deviceInfo => listApps(transport, deviceInfo)),
      mergeMap(e => {
        // Bubble up events
        if (e.type === "device-permission-granted" || e.type === "device-permission-requested") {
          return of(e);
        }

        if (e.type === "result") {
          // Figure out the operations that need to happen
          const state = appNames.reduce(
            (state, name) =>
              reducer(state, {
                type: "install",
                name,
                allowPartialDependencies,
              }),
            initState(e.result),
          );

          // Failed appOps in this flow will throw by default but if we're here
          // it means we didn't throw, so we wan't to notify the action about it.
          const maybeSkippedEvent: Observable<InlineAppInstallEvent> = state.skippedAppOps.length
            ? of({
                type: "some-apps-skipped",
                skippedAppOps: state.skippedAppOps,
              })
            : EMPTY;

          if (!state.installQueue.length) {
            // There's nothing to install, we can consider this a success.
            return defer(onSuccessObs || (() => EMPTY));
          }

          if (isOutOfMemoryState(predictOptimisticState(state))) {
            // In this case we can't install either by lack of storage, or permissions,
            // we fallback to the error case listing the missing apps.
            const missingAppNames: string[] = state.installQueue;
            return of({
              type: "app-not-installed",
              appNames: missingAppNames,
              appName: missingAppNames[0] || appNames[0], // TODO remove when LLD/LLM integrate appNames
            });
          }

          const exec = execWithTransport(transport);
          return concat(
            of({
              type: "listed-apps",
              installQueue: state.installQueue,
            }),
            maybeSkippedEvent,
            runAllWithProgress(state, exec).pipe(
              throttleTime(100),
              map(({ globalProgress, itemProgress, installQueue, currentAppOp }) => ({
                type: "inline-install",
                progress: globalProgress,
                itemProgress,
                installQueue,
                currentAppOp,
              })),
            ),
            defer(onSuccessObs || (() => EMPTY)),
          );
        }

        return EMPTY;
      }),
    ),
  );

export default inlineAppInstall;
