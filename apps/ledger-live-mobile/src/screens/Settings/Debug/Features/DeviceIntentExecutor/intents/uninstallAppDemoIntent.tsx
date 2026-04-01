import React from "react";
import { type Observable, Subject, EMPTY, concat, of, timer, defer } from "rxjs";
import {
  map,
  filter,
  take,
  takeWhile,
  switchMap,
  ignoreElements,
  finalize,
  catchError,
} from "rxjs/operators";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { DeviceActionStatus, UninstallAppDeviceAction } from "@ledgerhq/device-management-kit";
import type {
  IntentPlatformDefinition,
  Job,
  DeviceConnectionResult,
} from "@ledgerhq/device-intent";

// ---------------------------------------------------------------------------
// Job state
// ---------------------------------------------------------------------------

export type UninstallAppJobState =
  | { type: "promptUninstall"; confirm: () => void; skip: () => void }
  | { type: "uninstalling"; userInteraction?: string }
  | { type: "uninstallSuccess" }
  | { type: "uninstallFailed"; error: unknown };

export type UninstallAppInput = { appName: string };

export type UninstallAppExtraProps = { appName: string };

// ---------------------------------------------------------------------------
// Device action helper
// ---------------------------------------------------------------------------

function runUninstallDeviceAction(
  connectionResult: DeviceConnectionResult,
  appName: string,
): Observable<UninstallAppJobState> {
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
      catchError(err => of<UninstallAppJobState>({ type: "uninstallFailed", error: err })),
    );
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TERMINAL_DELAY_MS = 3000;

const UninstallAppDemoIntentComponent: React.FC<{
  jobState: UninstallAppJobState | undefined;
  extraProps: UninstallAppExtraProps;
}> = ({ jobState, extraProps }) => (
  <Flex p={4} alignItems="center">
    {jobState?.type === "promptUninstall" ? (
      <>
        <Text variant="subtitle" mb={2}>
          Uninstall {extraProps.appName}?
        </Text>
        <Flex flexDirection="row" columnGap={12}>
          <Button size="small" type="main" onPress={jobState.confirm}>
            Start
          </Button>
          <Button size="small" type="shade" onPress={jobState.skip}>
            Skip
          </Button>
        </Flex>
      </>
    ) : jobState?.type === "uninstalling" ? (
      <>
        <Text variant="h5" mb={4}>
          Uninstalling {extraProps.appName}…
        </Text>
        {jobState.userInteraction && (
          <Text variant="small" color="neutral.c70" mb={1}>
            User interaction: {jobState.userInteraction}
          </Text>
        )}
      </>
    ) : jobState?.type === "uninstallSuccess" ? (
      <Text variant="body" color="success.c60">
        {extraProps.appName} uninstalled successfully
      </Text>
    ) : jobState?.type === "uninstallFailed" ? (
      <Text variant="body" color="error.c60">
        Failed to uninstall {extraProps.appName}:{" "}
        {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
      </Text>
    ) : null}
  </Flex>
);

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

const uninstallAppJob: Job<UninstallAppJobState, UninstallAppInput> = ({
  deviceConnectionResult,
  input,
}) => {
  const decision$ = new Subject<"confirm" | "skip">();

  return concat(
    of<UninstallAppJobState>({
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

// ---------------------------------------------------------------------------
// Intent definition
// ---------------------------------------------------------------------------

export type UninstallAppDemoIntentDef = IntentPlatformDefinition<
  UninstallAppJobState,
  UninstallAppInput,
  UninstallAppExtraProps
>;

/**
 * Prompts the user to confirm or skip, then runs a DMK `UninstallAppDeviceAction`.
 * Demonstrates user interactivity within a job (confirm/skip callbacks embedded in the
 * emitted job state), wrapping a DMK device action with `defer`/`pipe` operators,
 * and displaying a terminal success/failure state for a fixed duration before completing.
 */
export const uninstallAppDemoIntentDef: UninstallAppDemoIntentDef = {
  label: "Uninstall App",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: uninstallAppJob,
  component: UninstallAppDemoIntentComponent,
};
