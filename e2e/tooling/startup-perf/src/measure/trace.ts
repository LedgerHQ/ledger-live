// Perfetto traces of Android launches (run.ts --trace): the scheduling of every thread, to tell
// where a slow launch spends its time. Started before the idle time, stopped after the read.
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEVICE_QUERY_TIMEOUT_MS, run, sleep } from "./exec.ts";

const CONFIG = fileURLToPath(new URL("../../devices/perfetto-startup.pbtx", import.meta.url));
const DEVICE_CONFIG = "/data/local/tmp/startup-perf-perfetto.pbtx";
const deviceTrace = (name: string) => `/data/misc/perfetto-traces/startup-perf-${name}.pftrace`;
const END_POLLS = 20;
const END_POLL_MS = 500;
const PULL_TIMEOUT_MS = 120_000;

export interface Tracer {
  start(device: string, name: string): Promise<void>;
  /** Stops the trace, pulls it into the traces folder and returns its file name. */
  collect(device: string, name: string): Promise<string>;
}

export function createTracer(tracesDir: string): Tracer {
  const configured = new Set<string>();
  const pids = new Map<string, string>();
  return {
    async start(device, name) {
      if (!configured.has(device)) {
        await run("adb", ["-s", device, "push", CONFIG, DEVICE_CONFIG]);
        configured.add(device);
      }
      // perfetto cannot read a config file from /data/local/tmp, but it reads one from stdin.
      // --background-wait returns once every data source has started, or fails.
      const { stdout } = await run("adb", [
        "-s",
        device,
        "shell",
        `cat ${DEVICE_CONFIG} | perfetto --background-wait --txt -c - -o ${deviceTrace(name)}`,
      ]);
      const pid = /^(\d+)\s*$/m.exec(stdout)?.[1];
      if (!pid) throw new Error(`perfetto printed no pid: ${stdout.trim()}`);
      pids.set(device, pid);
    },
    async collect(device, name) {
      const pid = pids.get(device);
      pids.delete(device);
      if (!pid) throw new Error("no trace was started");
      await run("adb", ["-s", device, "shell", "kill", "-TERM", pid], { allowFail: true });
      let ended = false;
      for (let poll = 0; poll < END_POLLS && !ended; poll++) {
        const { stdout } = await run(
          "adb",
          ["-s", device, "shell", `[ -d /proc/${pid} ] && echo running || echo ended`],
          { allowFail: true, timeoutMs: DEVICE_QUERY_TIMEOUT_MS },
        );
        ended = stdout.trim() === "ended";
        if (!ended) await sleep(END_POLL_MS);
      }
      if (!ended) throw new Error(`perfetto ${pid} was still writing the trace`);
      const file = `${name}.pftrace`;
      await run("adb", ["-s", device, "pull", deviceTrace(name), path.join(tracesDir, file)], {
        timeoutMs: PULL_TIMEOUT_MS,
      });
      await run("adb", ["-s", device, "shell", "rm", "-f", deviceTrace(name)], { allowFail: true });
      if ((await stat(path.join(tracesDir, file))).size === 0)
        throw new Error("the trace is empty");
      return file;
    },
  };
}
