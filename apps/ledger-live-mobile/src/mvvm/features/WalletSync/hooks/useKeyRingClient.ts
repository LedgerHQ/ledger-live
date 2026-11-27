import { createKeyRingClient, type KeyRingClient } from "@features/platform-key-ring";
import { keyRingDeviceBridge } from "../keyRingDeviceBridge";
import { useKeyRingClientSetup } from "./useKeyRingClientSetup";

let cachedClient: KeyRingClient | null = null;

/** The app's key ring client, built once with the setup of the first call. */
export function useKeyRingClient(): KeyRingClient {
  const setup = useKeyRingClientSetup();

  if (cachedClient === null) {
    cachedClient = createKeyRingClient({ ...setup, deviceBridge: keyRingDeviceBridge });
  }

  return cachedClient;
}
