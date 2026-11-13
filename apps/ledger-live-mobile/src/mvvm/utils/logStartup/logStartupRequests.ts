// Experiment for QAA-1501, not for develop: a startup event when each request is sent and when it
// ends, to see which requests the startup waits on. fetch and axios both go through XMLHttpRequest.
import { logStartupEvent } from "../logStartupTime";

type TrackedRequest = XMLHttpRequest & { startupTarget?: string };
type Open = (this: XMLHttpRequest, ...args: unknown[]) => void;

const open = XMLHttpRequest.prototype.open as unknown as Open;
const send = XMLHttpRequest.prototype.send;
let sent = 0;

XMLHttpRequest.prototype.open = function (this: TrackedRequest, ...args: unknown[]) {
  this.startupTarget = String(args[1])
    .replace(/^\w+:\/\//, "")
    .split("?")[0];
  open.apply(this, args);
} as typeof XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.send = function (this: TrackedRequest, body) {
  sent += 1;
  const id = sent;
  logStartupEvent(`Request ${id} sent ${this.startupTarget ?? "?"}`);
  this.addEventListener("loadend", () => logStartupEvent(`Request ${id} ended ${this.status}`));
  send.call(this, body);
};
