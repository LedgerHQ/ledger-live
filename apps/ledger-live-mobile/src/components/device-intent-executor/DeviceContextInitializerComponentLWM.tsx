/**
 * NOTE: this is a work in progress.
 *
 * DMK-native implementation of the DeviceContextInitializerComponent for LWM.
 *
 * Uses ConnectAppDeviceAction from @ledgerhq/live-dmk-shared directly via
 * dmk.executeDeviceAction, bypassing legacy live-common device actions.
 *
 * TODO (final version):
 * - Address derivation support
 * - Address validation ("is wrong device?")
 * - Device deprecation checks
 * - Richer UI beyond plain-text state dump
 */
import React, { useEffect, useRef, useState } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { DeviceActionStatus, type DeviceActionState } from "@ledgerhq/device-management-kit";
import type {
  DeviceContextInitializerComponent,
  DeviceExtractedContext,
} from "@ledgerhq/device-intent";
import {
  ConnectAppDeviceAction,
  type ConnectAppDAOutput,
  type ConnectAppDAError,
  type ConnectAppDAIntermediateValue,
} from "@ledgerhq/live-dmk-shared";

type ConnectAppDAState = DeviceActionState<
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue
>;

const DeviceContextInitializerComponentLWM: DeviceContextInitializerComponent = ({
  connectionResult,
  requiredDeviceContext,
  onContextInitialized,
  onError,
}) => {
  const [daState, setDaState] = useState<ConnectAppDAState>({
    status: DeviceActionStatus.NotStarted,
  });
  const completedRef = useRef(false);

  useEffect(() => {
    const { dmk, sessionId } = connectionResult;

    const deviceAction = new ConnectAppDeviceAction({
      input: {
        application: { name: requiredDeviceContext.appName },
        dependencies: requiredDeviceContext.dependencies.map(name => ({ name })),
        requireLatestFirmware: requiredDeviceContext.requireLatestFirmware,
        allowMissingApplication: requiredDeviceContext.allowPartialDependencies,
        unlockTimeout: 0,
      },
    });

    const { observable, cancel } = dmk.executeDeviceAction({
      sessionId,
      deviceAction,
    });

    const subscription = observable.subscribe({
      next(state) {
        setDaState(state);

        if (completedRef.current) return;

        if (state.status === DeviceActionStatus.Completed) {
          completedRef.current = true;
          const output = state.output;
          const extractedContext: DeviceExtractedContext = {
            currentOsVersion: output.deviceMetadata?.firmwareVersion.os ?? "unknown",
            osUpdateAvailable: !!output.deviceMetadata?.firmwareUpdateContext.availableUpdate,
            currentAppName: requiredDeviceContext.appName,
            currentAppVersion: "unknown",
            derivedAddress: output.derivation,
          };
          onContextInitialized(extractedContext);
        }

        if (state.status === DeviceActionStatus.Error) {
          completedRef.current = true;
          onError(state.error);
        }
      },
      error(err) {
        if (completedRef.current) return;
        completedRef.current = true;
        onError(err);
      },
    });

    return () => {
      subscription.unsubscribe();
      cancel();
    };
  }, [connectionResult, requiredDeviceContext, onContextInitialized, onError]);

  return (
    <Flex p={4}>
      <Text variant="h5" mb={4}>
        Initializing device context ({requiredDeviceContext.appName})
      </Text>
      <Text variant="small" color="neutral.c70" mb={2}>
        Status: {daState.status}
      </Text>
      {daState.status === DeviceActionStatus.Pending && (
        <>
          <Text variant="small" color="neutral.c70" mb={1}>
            User interaction: {daState.intermediateValue.requiredUserInteraction}
          </Text>
          {daState.intermediateValue.installPlan && (
            <Text variant="small" color="neutral.c70" mb={1}>
              Install plan: {daState.intermediateValue.installPlan.installPlan.length} app(s),
              progress: {daState.intermediateValue.installPlan.currentIndex}/
              {daState.intermediateValue.installPlan.installPlan.length} (
              {Math.round(daState.intermediateValue.installPlan.currentProgress * 100)}%)
            </Text>
          )}
        </>
      )}
      {daState.status === DeviceActionStatus.Error && (
        <Text variant="small" color="error.c60">
          Error: {String(daState.error)}
        </Text>
      )}
      {daState.status === DeviceActionStatus.Completed && (
        <Text variant="small" color="success.c60">
          Context initialized
        </Text>
      )}
    </Flex>
  );
};

export default DeviceContextInitializerComponentLWM;
