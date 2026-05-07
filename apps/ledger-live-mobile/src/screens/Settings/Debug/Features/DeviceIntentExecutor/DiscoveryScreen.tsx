import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  DefaultDeviceDiscoveryService,
  DiscoveryErrors,
  type DiscoveryError,
  type DiscoveryErrorResolution,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { Subscription } from "rxjs";

type ErrorDescription = {
  title: string;
  description: string;
  details?: string[];
};

export default function DebugDeviceIntentExecutorDiscovery() {
  const dmk = useDeviceManagementKit();
  const service = useMemo(() => (dmk ? new DefaultDeviceDiscoveryService(dmk) : null), [dmk]);
  const subscriptionsRef = useRef<Subscription | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [discoveryError, setDiscoveryError] = useState<DiscoveryError | null>(null);

  const stopDiscovery = useCallback(() => {
    service?.stop();
    subscriptionsRef.current?.unsubscribe();
    subscriptionsRef.current = null;
    setDevices([]);
    setIsRunning(false);
  }, [service]);

  const startDiscovery = useCallback(() => {
    if (!service || subscriptionsRef.current) return;

    setDevices([]);
    setDiscoveryError(null);

    const subscriptions = new Subscription();
    subscriptionsRef.current = subscriptions;

    subscriptions.add(service.discoveredDevices.subscribe(setDevices));
    subscriptions.add(
      service.errors.subscribe(error => {
        service.stop();
        subscriptions.unsubscribe();
        subscriptionsRef.current = null;
        setIsRunning(false);
        setDiscoveryError(error);
      }),
    );

    setIsRunning(true);
    service.start();
  }, [service]);

  useEffect(() => stopDiscovery, [stopDiscovery]);

  const retry = getRetry(discoveryError?.resolution);

  const handleRetry = useCallback(async () => {
    if (!retry) return;

    setIsRetrying(true);
    try {
      const retryResult = await retry();

      if (retryResult === true) {
        startDiscovery();
        return;
      }

      setDiscoveryError(retryResult);
    } catch (error) {
      setDiscoveryError({
        type: DiscoveryErrors.Unknown,
        error,
      });
    } finally {
      setIsRetrying(false);
    }
  }, [retry, startDiscovery]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          DIE Discovery Playground
        </Text>
        <Text variant="small" color="neutral.c70">
          Exercises DefaultDeviceDiscoveryService directly. It discovers with all configured mobile
          DMK transports, stops on discovery errors, and lets you retry the service&apos;s own
          resolution callback.
        </Text>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Controls
        </Text>
        <StateRow label="DMK" value={dmk ? "ready" : "unavailable"} />
        <StateRow label="Discovery" value={isRunning ? "running" : "stopped"} />
        <StateRow label="Discovered devices" value={String(devices.length)} />
        <Flex flexDirection="row" columnGap={12} mt={3}>
          <Button type="main" flex={1} onPress={startDiscovery} disabled={!service || isRunning}>
            Start
          </Button>
          <Button type="error" flex={1} onPress={stopDiscovery} disabled={!service || !isRunning}>
            Stop
          </Button>
        </Flex>
      </Flex>

      {discoveryError ? (
        <DiscoveryErrorCard error={discoveryError} isRetrying={isRetrying} onRetry={handleRetry} />
      ) : null}

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8}>
        <Text variant="subtitle" mb={2}>
          Discovered Devices
        </Text>
        {devices.length === 0 ? (
          <Text variant="body" color="neutral.c70">
            {isRunning ? "Looking for devices..." : "No discovered devices."}
          </Text>
        ) : (
          devices.map(device => <DiscoveredDeviceCard key={device.id} device={device} />)
        )}
      </Flex>
    </ScrollView>
  );
}

function DiscoveryErrorCard({
  error,
  isRetrying,
  onRetry,
}: {
  error: DiscoveryError;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const errorDescription = getDiscoveryErrorDescription(error);
  const retry = getRetry(error.resolution);

  return (
    <Flex p={3} backgroundColor="error.c10" borderRadius={8} mb={4}>
      <Text variant="subtitle" mb={2}>
        {errorDescription.title}
      </Text>
      <Text variant="body" color="neutral.c100" mb={3}>
        {errorDescription.description}
      </Text>
      <StateRow label="Type" value={error.type} />
      <StateRow label="Transport" value={error.transportID ?? "-"} />
      <StateRow label="Resolution" value={error.resolution?.type ?? "none"} />
      {errorDescription.details?.map(detail => (
        <Text key={detail} variant="small" color="neutral.c70" mt={2}>
          {detail}
        </Text>
      ))}
      {retry ? (
        <Button type="main" mt={3} onPress={onRetry} disabled={isRetrying}>
          {isRetrying ? "Retrying..." : "Retry"}
        </Button>
      ) : null}
    </Flex>
  );
}

function DiscoveredDeviceCard({ device }: { device: DiscoveredDevice }) {
  return (
    <Flex p={3} backgroundColor="neutral.c30" borderRadius={8} mb={3}>
      <Text variant="body" fontWeight="semiBold" mb={2}>
        {device.name || "Unnamed device"}
      </Text>
      <StateRow label="ID" value={device.id} />
      <StateRow label="Model" value={String(device.deviceModel.model)} />
      <StateRow label="Model name" value={device.deviceModel.name} />
      <Text variant="small" color="neutral.c70" mt={2} mb={1}>
        Raw device
      </Text>
      <Text variant="small" fontFamily="monospace" color="neutral.c70">
        {JSON.stringify(device, null, 2)}
      </Text>
    </Flex>
  );
}

function StateRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" mb={1} columnGap={12}>
      <Text variant="small" color="neutral.c70" flexShrink={0}>
        {label}
      </Text>
      <Text variant="small" fontWeight="semiBold" flexShrink={1} textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

function getRetry(
  resolution?: DiscoveryErrorResolution,
): (() => Promise<true | DiscoveryError>) | null {
  if (!resolution || resolution.type === "none") return null;
  return resolution.retry;
}

function getDiscoveryErrorDescription(error: DiscoveryError): ErrorDescription {
  switch (error.type) {
    case DiscoveryErrors.BluetoothPermissionDeniedPromptable:
      return {
        title: "Bluetooth permission denied",
        description:
          "Android Bluetooth runtime permissions are denied, but the app can request them again.",
        details: [`Permissions: ${error.permissions.join(", ")}`],
      };
    case DiscoveryErrors.BluetoothPermissionDeniedManualSettings:
      return {
        title: "Bluetooth permission denied in settings",
        description:
          "Android Bluetooth runtime permissions are denied and cannot be requested again from the app. Enable them manually in system settings.",
        details: [`Permissions: ${error.permissions.join(", ")}`],
      };
    case DiscoveryErrors.BluetoothPermissionUnauthorizedManualSettings:
      return {
        title: "Bluetooth access unauthorized",
        description:
          "The OS reports Bluetooth access as unauthorized. The app cannot show the permission prompt again, so Bluetooth access must be restored from system settings.",
      };
    case DiscoveryErrors.BluetoothDisabledPromptable:
      return {
        title: "Bluetooth disabled",
        description:
          "Bluetooth is disabled and the platform can show a native enable prompt from the retry action.",
      };
    case DiscoveryErrors.BluetoothDisabledManualAction:
      return {
        title: "Bluetooth disabled manually",
        description:
          "Bluetooth is disabled and cannot be enabled through an in-app prompt. Enable Bluetooth manually, then retry.",
        details: formatOptionalError(error.error),
      };
    case DiscoveryErrors.BluetoothStateUnknownCheckOnly:
      return {
        title: "Bluetooth state unknown",
        description:
          "Bluetooth is in an indeterminate state, such as Unknown or Resetting. Retry re-runs the state check.",
        details: error.state ? [`State: ${error.state}`] : undefined,
      };
    case DiscoveryErrors.BluetoothUnsupported:
      return {
        title: "Bluetooth unsupported",
        description:
          "This device or platform does not support BLE. This is not recoverable through retry.",
      };
    case DiscoveryErrors.LocationPermissionDeniedPromptable:
      return {
        title: "Location permission denied",
        description:
          "Android location permission is required for BLE scanning and can be requested again from retry.",
        details: [`Permission: ${error.permission}`],
      };
    case DiscoveryErrors.LocationPermissionDeniedManualSettings:
      return {
        title: "Location permission denied in settings",
        description:
          "Android location permission is required for BLE scanning but cannot be requested again from the app. Enable it manually in settings, then retry.",
        details: [`Permission: ${error.permission}`],
      };
    case DiscoveryErrors.LocationDisabledPromptable:
      return {
        title: "Location services disabled",
        description:
          "Android location services are disabled and the platform can show a native enable prompt from retry.",
      };
    case DiscoveryErrors.LocationDisabledManualAction:
      return {
        title: "Location services disabled manually",
        description:
          "Android location services are disabled and cannot be enabled through an in-app prompt. Enable them manually, then retry.",
        details: formatOptionalError(error.error),
      };
    case DiscoveryErrors.LocationServicePermissionMissing:
      return {
        title: "Location service permission missing",
        description:
          "Android location services could not be checked because location permission is missing unexpectedly. Retry re-runs the preflight checks.",
      };
    case DiscoveryErrors.Unknown:
      return {
        title: "Unknown discovery error",
        description:
          "An unexpected discovery or preflight failure occurred. Retry re-runs the discovery preflight when a retry action is available.",
        details: formatOptionalError(error.error),
      };
  }
}

function formatOptionalError(error: unknown): string[] | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return [`Error: ${error.message}`];

  try {
    return [`Error: ${JSON.stringify(error)}`];
  } catch {
    return [`Error: ${String(error)}`];
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
