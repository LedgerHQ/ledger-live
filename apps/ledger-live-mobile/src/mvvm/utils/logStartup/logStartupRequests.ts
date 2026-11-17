// Experiment for QAA-1501, not for develop: a startup event when each request is sent and when it
// ends, to see which requests the startup waits on. fetch and axios both go through XMLHttpRequest.
// Test branch: a request sent between the app gate and App started waits for App started (at most
// 5 s), so its network and response work cannot land in the first render.
import { logStartupEvent, type StartupEvent, startupEvents } from "../logStartupTime";

type TrackedRequest = XMLHttpRequest & { startupTarget?: string };
type Open = (this: XMLHttpRequest, ...args: unknown[]) => void;

const open = XMLHttpRequest.prototype.open as unknown as Open;
const send = XMLHttpRequest.prototype.send;
const HOLD_MAX_MS = 5_000;
let sent = 0;
let holding = false;
let releaseHeld: () => void = () => {};
const appStarted = new Promise<void>(resolve => {
  releaseHeld = resolve;
});

const push = startupEvents.push.bind(startupEvents);
startupEvents.push = (...events: StartupEvent[]) => {
  for (const { event } of events) {
    if (event === "WaitForAppReady done") holding = true;
    if (event === "App started") {
      holding = false;
      releaseHeld();
    }
  }
  return push(...events);
};

XMLHttpRequest.prototype.open = function (this: TrackedRequest, ...args: unknown[]) {
  this.startupTarget = String(args[1])
    .replace(/^\w+:\/\//, "")
    .split("?")[0];
  open.apply(this, args);
} as typeof XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.send = function (this: TrackedRequest, body) {
  sent += 1;
  const id = sent;
  const go = () => {
    logStartupEvent(`Request ${id} sent ${this.startupTarget ?? "?"}`);
    this.addEventListener("loadend", () => logStartupEvent(`Request ${id} ended ${this.status}`));
    send.call(this, body);
  };
  if (!holding) {
    go();
    return;
  }
  logStartupEvent(`Request ${id} held ${this.startupTarget ?? "?"}`);
  void Promise.race([appStarted, new Promise(resolve => setTimeout(resolve, HOLD_MAX_MS))]).then(
    () => {
      try {
        go();
      } catch (error) {
        // An aborted request cannot be sent any more.
        console.warn("Held startup request not sent", error);
      }
    },
  );
};
