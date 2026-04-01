import React from "react";
import { type Observable, concat, of, timer, defer } from "rxjs";
import { map, filter, takeWhile, ignoreElements, finalize, catchError } from "rxjs/operators";
import { Text, Flex } from "@ledgerhq/native-ui";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import type { IntentPlatformDefinition, Job, DeviceConnectionResult } from "@ledgerhq/device-intent";

// ---------------------------------------------------------------------------
// Job state
// ---------------------------------------------------------------------------

export type GetEthAddressDMKSignerJobState =
  | { type: "deriving"; daStatus: string; userInteraction?: string }
  | { type: "derived"; address: string }
  | { type: "failed"; error: unknown };

export type GetEthAddressDMKSignerInput = { derivationPath: string };

export type GetEthAddressDMKSignerExtraProps = Record<string, never>;

// ---------------------------------------------------------------------------
// Device action helper
// ---------------------------------------------------------------------------

const TERMINAL_DELAY_MS = 3000;

function runGetEthAddress(
  connectionResult: DeviceConnectionResult,
  derivationPath: string,
): Observable<GetEthAddressDMKSignerJobState> {
  return defer(() => {
    const { dmk, sessionId } = connectionResult;
    const signer = new SignerEthBuilder({ dmk, sessionId }).build();
    const { observable, cancel } = signer.getAddress(derivationPath, {
      skipOpenApp: true,
    });

    return observable.pipe(
      finalize(cancel),
      map(state => {
        if (state.status === DeviceActionStatus.Pending) {
          return {
            type: "deriving" as const,
            daStatus: state.status,
            userInteraction: state.intermediateValue.requiredUserInteraction,
          };
        }
        if (state.status === DeviceActionStatus.Completed) {
          return { type: "derived" as const, address: state.output.address };
        }
        if (state.status === DeviceActionStatus.Error) {
          return { type: "failed" as const, error: state.error };
        }
        return null;
      }),
      filter((s): s is NonNullable<typeof s> => s !== null),
      takeWhile(s => s.type === "deriving", true),
      catchError(err => of<GetEthAddressDMKSignerJobState>({ type: "failed", error: err })),
    );
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GetEthAddressDMKSignerDemoIntentComponent: React.FC<{
  jobState: GetEthAddressDMKSignerJobState | undefined;
  extraProps: GetEthAddressDMKSignerExtraProps;
}> = ({ jobState }) => (
  <Flex p={4}>
    {jobState?.type === "deriving" ? (
      <>
        <Text variant="h5" mb={4}>
          Deriving ETH address (DMK Signer)…
        </Text>
        <Text variant="small" color="neutral.c70" mb={2}>
          Status: {jobState.daStatus}
        </Text>
        {jobState.userInteraction && (
          <Text variant="small" color="neutral.c70" mb={1}>
            User interaction: {jobState.userInteraction}
          </Text>
        )}
      </>
    ) : jobState?.type === "derived" ? (
      <>
        <Text variant="body" color="success.c60" mb={2}>
          ETH address derived (DMK Signer)
        </Text>
        <Text variant="small" fontFamily="monospace" color="neutral.c70" numberOfLines={2}>
          {jobState.address}
        </Text>
      </>
    ) : jobState?.type === "failed" ? (
      <Text variant="body" color="error.c60">
        Failed (DMK Signer):{" "}
        {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
      </Text>
    ) : null}
  </Flex>
);

// ---------------------------------------------------------------------------
// Intent definition
// ---------------------------------------------------------------------------

export type GetEthAddressDMKSignerDemoIntentDef = IntentPlatformDefinition<
  GetEthAddressDMKSignerJobState,
  GetEthAddressDMKSignerInput,
  GetEthAddressDMKSignerExtraProps
>;

/**
 * Derives an ETH address using the DMK `SignerEthBuilder` directly.
 * Demonstrates how to wrap a DMK signer kit device action into an intent job,
 * mapping its `DeviceActionStatus` states to typed job states.
 */
export const getEthAddressDMKSignerDemoIntentDef: GetEthAddressDMKSignerDemoIntentDef = {
  label: "Get ETH Address (DMK Signer)",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: (({ deviceConnectionResult, input }) =>
    concat(
      runGetEthAddress(deviceConnectionResult, input.derivationPath),
      timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
    )) satisfies Job<GetEthAddressDMKSignerJobState, GetEthAddressDMKSignerInput>,
  component: GetEthAddressDMKSignerDemoIntentComponent,
};
