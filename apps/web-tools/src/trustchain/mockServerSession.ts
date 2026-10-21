import { useSyncExternalStore } from "react";

export type MockServerSession = {
  token: string;
  // Id of the emulated device on the mock server, known once the DMK is connected to it.
  mockDeviceId?: string;
};

// Mock server sessions the transport module opened (or joined), keyed by deviceId, so the UI can
// show the emulated device and link to the mock server's own interface.
const sessions = new Map<string, MockServerSession>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

export function setMockServerToken(deviceId: string, token: string): void {
  sessions.set(deviceId, { token });
  notify();
}

export function setMockServerDeviceId(deviceId: string, mockDeviceId: string): void {
  const session = sessions.get(deviceId);
  if (!session) return;
  sessions.set(deviceId, { ...session, mockDeviceId });
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMockServerSession(deviceId: string): MockServerSession | undefined {
  return useSyncExternalStore(subscribe, () => sessions.get(deviceId));
}

export function getMockServerUiUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/#token=${encodeURIComponent(token)}`;
}
