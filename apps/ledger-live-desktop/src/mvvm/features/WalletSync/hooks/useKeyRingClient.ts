import { createKeyRingClient, type KeyRingClient } from "@features/platform-key-ring";
import { createRotationReencryption } from "@features/platform-wallet-sync";
import { keyRingDeviceBridge } from "../keyRingDeviceBridge";
import { type KeyRingClientSetup, useKeyRingClientSetup } from "./useKeyRingClientSetup";

let cachedClient: KeyRingClient | null = null;

/** The key ring client of this app, built once with the setup of the first call. */
export function useKeyRingClient(): KeyRingClient {
  const setup = useKeyRingClientSetup();
  if (cachedClient === null) {
    cachedClient = createAppKeyRingClient(setup);
  }
  return cachedClient;
}

function createAppKeyRingClient({
  isMockEnv,
  instanceName,
  trustchainApiBaseUrl,
  cloudSyncApiBaseUrl,
  getCurrentWSState,
}: KeyRingClientSetup): KeyRingClient {
  const client = createKeyRingClient({
    mock: isMockEnv,
    instanceName,
    apiBaseUrl: trustchainApiBaseUrl,
    deviceBridge: keyRingDeviceBridge,
  });
  client.lifecycle.onKeyRotation(
    createRotationReencryption({ cloudSyncApiBaseUrl, getCurrentWSState }),
  );
  return client;
}
