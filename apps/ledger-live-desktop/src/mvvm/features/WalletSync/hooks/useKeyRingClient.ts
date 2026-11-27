import { createKeyRingClient, type KeyRingClient } from "@features/platform-key-ring";
import { registerRotationReencryption } from "@features/platform-wallet-sync";
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
  runtime,
}: KeyRingClientSetup): KeyRingClient {
  const client = createKeyRingClient({
    mock: isMockEnv,
    instanceName,
    apiBaseUrl: trustchainApiBaseUrl,
    deviceBridge: keyRingDeviceBridge,
    runtime,
  });
  registerRotationReencryption(client, { cloudSyncApiBaseUrl, getCurrentWSState });
  return client;
}
