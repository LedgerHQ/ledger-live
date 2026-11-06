import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useIsFocused, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { useDeviceOnboarding, type DeviceOnboardingSession } from "./useDeviceOnboarding";

export type DeviceOnboardingHost = {
  navigation: NavigationProp<ParamListBase>;
  onLeave?: () => void;
  dmk: DeviceManagementKit | null;
  knownDevices: KnownDevice[];
  offerSync: boolean;
  wasReadOnlyAtEntry: boolean;
};

type Registry = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => DeviceOnboardingHost | null;
  upsert: (token: object, host: DeviceOnboardingHost) => void;
  remove: (token: object) => void;
};

const RegistryContext = createContext<Registry | null>(null);
const SessionContext = createContext<DeviceOnboardingSession | null>(null);
const noDevices: KnownDevice[] = [];

function sameHost(left: DeviceOnboardingHost | null, right: DeviceOnboardingHost | null) {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.navigation === right.navigation &&
    left.onLeave === right.onLeave &&
    left.dmk === right.dmk &&
    left.knownDevices === right.knownDevices &&
    left.offerSync === right.offerSync &&
    left.wasReadOnlyAtEntry === right.wasReadOnlyAtEntry
  );
}

function createRegistry(): Registry {
  const hosts = new Map<object, DeviceOnboardingHost>();
  let active: object | null = null;
  let snapshot: DeviceOnboardingHost | null = null;
  const listeners = new Set<() => void>();

  function commit() {
    const next = active ? (hosts.get(active) ?? null) : null;
    if (sameHost(snapshot, next)) return;
    snapshot = next;
    listeners.forEach(listener => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    upsert(token, host) {
      hosts.set(token, host);
      active = token;
      commit();
    },
    remove(token) {
      if (!hosts.delete(token) || active !== token) return;
      active = null;
      commit();
    },
  };
}

export function DeviceOnboardingProvider({ children }: { children: ReactNode }) {
  const [current] = useState(createRegistry);
  const host = useSyncExternalStore(current.subscribe, current.getSnapshot, current.getSnapshot);
  const session = useDeviceOnboarding({
    dmk: host?.dmk ?? null,
    knownDevices: host?.knownDevices ?? noDevices,
    offerSync: host?.offerSync ?? false,
    wasReadOnlyAtEntry: host?.wasReadOnlyAtEntry ?? false,
    onLeave: () => current.getSnapshot()?.onLeave?.(),
    getNavigation: () => current.getSnapshot()?.navigation ?? null,
  });

  return (
    <RegistryContext.Provider value={current}>
      <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
    </RegistryContext.Provider>
  );
}

export function useDeviceOnboardingSession(): DeviceOnboardingSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Device onboarding session is unavailable");
  return session;
}

export function useDeviceOnboardingHost(host: DeviceOnboardingHost) {
  const registry = useContext(RegistryContext);
  const [token] = useState(() => ({}));
  const focused = useIsFocused();

  useLayoutEffect(() => {
    if (!registry) return;
    return () => registry.remove(token);
  }, [registry, token]);

  useLayoutEffect(() => {
    if (!registry || !focused) return;
    registry.upsert(token, host);
  }, [focused, host, registry, token]);
}
