import { useSyncExternalStore } from "react";

// Tokens of the mock server sessions the transport module opened (or joined), keyed by deviceId,
// so the UI can link to the mock server's own interface to act on the emulated device.
const tokens = new Map<string, string>();
const listeners = new Set<() => void>();

export function setMockServerToken(deviceId: string, token: string): void {
  tokens.set(deviceId, token);
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMockServerToken(deviceId: string): string | undefined {
  return useSyncExternalStore(subscribe, () => tokens.get(deviceId));
}

export function getMockServerUiUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/#token=${encodeURIComponent(token)}`;
}
