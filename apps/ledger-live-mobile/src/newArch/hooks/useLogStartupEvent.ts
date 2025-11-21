import { useRef } from "react";
import { getTimeSinceStartup } from "react-native-startup-time";

export const startupEvents: Promise<{ event: string; time: number }>[] = [];

export function useLogStartupEvent(eventName: string) {
  const state = useRef({ firstCall: true });
  if (eventName && state.current.firstCall) {
    state.current.firstCall = false;
    logStartupEvent(eventName);
  }
}

let startupTsp: Promise<number>;

export function logStartupEvent(eventName: string) {
  const now = Date.now();
  if (!startupTsp) {
    startupTsp = getTimeSinceStartup().then((startedSince: number) => now - startedSince);
  }
  const event = startupTsp.then(start => ({ event: eventName, time: now - start }));
  startupEvents.push(event);
  return event;
}
