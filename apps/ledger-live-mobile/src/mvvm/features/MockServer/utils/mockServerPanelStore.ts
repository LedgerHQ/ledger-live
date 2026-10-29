import { useSyncExternalStore } from "react";

type MockServerPanelState = {
  isPanelOpen: boolean;
  isFloatingButtonHidden: boolean;
};

let state: MockServerPanelState = { isPanelOpen: false, isFloatingButtonHidden: false };
const listeners = new Set<() => void>();

const setState = (patch: Partial<MockServerPanelState>) => {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const openMockServerPanel = () => setState({ isPanelOpen: true });
export const closeMockServerPanel = () => setState({ isPanelOpen: false });
export const setMockServerFloatingButtonHidden = (isFloatingButtonHidden: boolean) =>
  setState({ isFloatingButtonHidden });

export const resetMockServerPanelState = () =>
  setState({ isPanelOpen: false, isFloatingButtonHidden: false });

export const useMockServerPanelState = (): MockServerPanelState =>
  useSyncExternalStore(subscribe, () => state);
