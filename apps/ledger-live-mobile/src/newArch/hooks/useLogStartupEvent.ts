import { useEffect, useRef, useState } from "react";
import { getTimeSinceStartup } from "react-native-startup-time";
import {
  logStartupEvent,
  resolveStartupEvents as _resolveStartupEvents,
  type StartupEvent,
} from "../utils/logStartupTime";

export function useLogStartupEvent(eventName: string) {
  const state = useRef({ firstCall: true });
  if (eventName && state.current.firstCall) {
    state.current.firstCall = false;
    logStartupEvent(eventName);
  }
}

export function useStartupEvents() {
  const [startupEvents, setStartupEvents] = useState<StartupEvent[]>([]);
  useEffect(() => {
    resolveStartupEvents().then(setStartupEvents);
  }, []);
  return startupEvents;
}

// This function is here instead of in utils/logStartupTime.ts to avoid importing startup-time there
let startupTsp: Promise<number>;
export function resolveStartupEvents() {
  if (!startupTsp) {
    const now = Date.now();
    // react-native-startup-time get startup timestamp by running a native module before react-native launch
    startupTsp = getTimeSinceStartup().then((startedXAgo: number) => now - startedXAgo);
  }
  return _resolveStartupEvents(startupTsp);
}

export { logStartupEvent };
