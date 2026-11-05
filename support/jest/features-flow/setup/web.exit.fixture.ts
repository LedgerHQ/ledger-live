// The child process of web.test.ts, standing in for a jsdom worker: no MessageChannel and no
// setImmediate, so React's scheduler posts its work on the web setup's MessageChannel, whose ports
// must not hold the process. It prints "ran" once the scheduler ran its callback, then has to exit.
import { createRequire } from "node:module";

type Scheduler = {
  unstable_NormalPriority: number;
  unstable_scheduleCallback(priority: number, callback: () => void): unknown;
};

const require = createRequire(import.meta.url);

Reflect.deleteProperty(globalThis, "MessageChannel");
Reflect.deleteProperty(globalThis, "setImmediate");
require("./web.cts");

const scheduler: Scheduler = createRequire(require.resolve("react-dom"))("scheduler");
const keepAlive = setInterval(() => {}, 1000);
scheduler.unstable_scheduleCallback(scheduler.unstable_NormalPriority, () => {
  console.log("ran");
  clearInterval(keepAlive);
});
