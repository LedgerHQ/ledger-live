import React from "react";
import { concat, of, from, timer } from "rxjs";
import { map, ignoreElements, catchError } from "rxjs/operators";
import { Text, Flex } from "@ledgerhq/native-ui";
import type { DerivationMode } from "@ledgerhq/types-live";
import type { IntentPlatformDefinition, Job } from "@ledgerhq/device-intent";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

// ---------------------------------------------------------------------------
// Job state
// ---------------------------------------------------------------------------

export type GetAddressLegacyWithDeviceJobState =
  | { type: "deriving" }
  | { type: "gotTransport" }
  | { type: "completed"; address: string }
  | { type: "failed"; error: unknown };

export type GetAddressLegacyWithDeviceInput = {
  currencyId: string;
  path: string;
  derivationMode: string;
};

export type GetAddressLegacyWithDeviceExtraProps = Record<string, never>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TERMINAL_DELAY_MS = 3000;

const GetAddressLegacyWithDeviceDemoIntentComponent: React.FC<{
  jobState: GetAddressLegacyWithDeviceJobState | undefined;
  extraProps: GetAddressLegacyWithDeviceExtraProps;
}> = ({ jobState }) => (
  <Flex p={4}>
    {jobState?.type === "gotTransport" ? (
      <Text variant="h5">Got transport (legacy withDevice)</Text>
    ) : jobState?.type === "deriving" ? (
      <Text variant="h5">Deriving address (legacy withDevice)…</Text>
    ) : jobState?.type === "completed" ? (
      <>
        <Text variant="body" color="success.c60" mb={2}>
          Address derived (legacy withDevice)
        </Text>
        <Text variant="small" fontFamily="monospace" color="neutral.c70" numberOfLines={2}>
          {jobState.address}
        </Text>
      </>
    ) : jobState?.type === "failed" ? (
      <Text variant="body" color="error.c60">
        Failed (legacy withDevice):{" "}
        {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
      </Text>
    ) : null}
  </Flex>
);

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

const getAddressLegacyWithDeviceJob: Job<
  GetAddressLegacyWithDeviceJobState,
  GetAddressLegacyWithDeviceInput
> = ({ deviceConnectionResult, input }) =>
  concat(
    of<GetAddressLegacyWithDeviceJobState>({ type: "deriving" }),
    withDevice(deviceConnectionResult.compatDeviceId)(transport =>
      concat(
        of<GetAddressLegacyWithDeviceJobState>({ type: "gotTransport" }),
        from(
          getAddress(transport, {
            currency: getCryptoCurrencyById(input.currencyId),
            path: input.path,
            derivationMode: input.derivationMode as DerivationMode, // eslint-disable-line @typescript-eslint/consistent-type-assertions
          }),
        ).pipe(map(result => ({ type: "completed" as const, address: result.address }))),
      ),
    ).pipe(
      catchError(err => of<GetAddressLegacyWithDeviceJobState>({ type: "failed", error: err })),
    ),
    timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
  );

// ---------------------------------------------------------------------------
// Intent definition
// ---------------------------------------------------------------------------

export type GetAddressLegacyWithDeviceDemoIntentDef = IntentPlatformDefinition<
  GetAddressLegacyWithDeviceJobState,
  GetAddressLegacyWithDeviceInput,
  GetAddressLegacyWithDeviceExtraProps
>;

/**
 * Derives an address using the legacy `withDevice` + live-common `getAddress` code path.
 * Demonstrates how to bridge existing live-common transport-based logic into an intent job
 * by obtaining a transport via `withDevice` and the executor-provided `compatDeviceId`.
 */
export const getAddressLegacyWithDeviceDemoIntentDef: GetAddressLegacyWithDeviceDemoIntentDef = {
  label: "Get Address (Legacy withDevice)",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: getAddressLegacyWithDeviceJob,
  component: GetAddressLegacyWithDeviceDemoIntentComponent,
};
