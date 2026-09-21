import React, { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";
import { Flex, Alert, Text } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import Button from "~/components/Button";
import {
  buildStorageProbeReading,
  formatStorageProbeReading,
  type StorageProbeEntry,
  type StorageProbeReading,
} from "./storageProbeReading";

/**
 * Reads every key/value pair currently in AsyncStorage.
 *
 * v2 API used here: `AsyncStorage.multiGet`. When this screen is cherry-picked
 * onto the async-storage v3 branch (#22262), this becomes `AsyncStorage.getMany`,
 * which takes the same array of keys and returns the same key/value tuples —
 * no other change is needed in this file.
 */
async function readAllEntries(): Promise<readonly StorageProbeEntry[]> {
  const keys = await AsyncStorage.getAllKeys();
  return AsyncStorage.multiGet(keys);
}

/**
 * Dev-only probe (LIVE-37322) used to verify that on-device data survives the
 * async-storage 2.x -> 3.x upgrade. It never renders, copies or logs a stored
 * value: only key names, byte sizes, counts and hashes.
 */
export function DebugStorageProbe() {
  const [reading, setReading] = useState<StorageProbeReading | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunPress = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    try {
      const entries = await readAllEntries();
      setReading(buildStorageProbeReading(entries));
    } catch (e) {
      setReading(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleCopyPress = useCallback(() => {
    if (!reading) return;
    Clipboard.setString(formatStorageProbeReading(reading));
  }, [reading]);

  return (
    <NavigationScrollView style={{ flex: 1, marginBottom: 16 }}>
      <Flex p={4}>
        <Alert
          type="info"
          title="Reads AsyncStorage key names, sizes and hashes only. Values are never shown, copied or logged."
        />
      </Flex>
      <Flex p={4}>
        <Button type="main" disabled={isRunning} onPress={handleRunPress}>
          {isRunning ? "Running probe..." : "Run probe"}
        </Button>
        <Button mt={3} type="shade" disabled={!reading} onPress={handleCopyPress}>
          Copy reading to clipboard
        </Button>
      </Flex>

      {error ? (
        <Flex p={4}>
          <Alert type="error" title={error} />
        </Flex>
      ) : null}

      {reading ? (
        <Flex p={4}>
          <Text variant="body" fontWeight="semiBold">
            Total keys: {reading.totalKeys}
          </Text>
          <Text variant="body">Total hash: {reading.totalHash}</Text>

          <Text mt={6} variant="body" fontWeight="semiBold">
            Per-prefix breakdown ({reading.groups.length})
          </Text>
          {reading.groups.map(group => (
            <Text key={group.prefix} variant="small" color="neutral.c70">
              {group.prefix} — count={group.count} hash={group.hash}
            </Text>
          ))}

          <Text mt={6} variant="body" fontWeight="semiBold">
            {reading.largestKeys.length} largest keys (name, size in bytes)
          </Text>
          {reading.largestKeys.map(entry => (
            <Text key={entry.key} variant="small" color="neutral.c70">
              {entry.key} — {entry.sizeBytes} bytes
            </Text>
          ))}
        </Flex>
      ) : null}
    </NavigationScrollView>
  );
}
