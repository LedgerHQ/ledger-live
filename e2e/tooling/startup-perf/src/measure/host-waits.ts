// How long the measured emulator's threads waited for a runner CPU during a launch (run.ts --trace).
// Every 50 ms, /proc/<pid>/task/<tid>/schedstat gives each thread's ns on a CPU and ns runnable but
// waiting. The vCPU threads' wait is what the guest counts as steal, which the emulator's Perfetto
// does not record; the renderer's threads (llvmpipe-#, RenderThread) wait for the same CPUs.
import { readdir, readFile } from "node:fs/promises";
import { sleep } from "./exec.ts";
import { emulatorProcesses, threadGroup } from "./load.ts";
import type { HostWaits, Sample } from "../types.ts";

const PERIOD_MS = 50;
// Since boot, the vCPUs and the renderer's workers are the busiest threads by far. Threads that
// start later (a host RenderThread per app connection) are added as they appear.
const THREADS = 24;
const NS_PER_MS = 1_000_000;
const VCPU = "vCPU";

export interface Schedstat {
  runNs: number;
  waitNs: number;
}

export function parseSchedstat(text: string): Schedstat | null {
  const [runNs, waitNs] = text.trim().split(/\s+/).map(Number);
  return Number.isFinite(runNs) && Number.isFinite(waitNs) ? { runNs, waitNs } : null;
}

/** Whether a thread's /proc stat line counts guest time (field 43): only KVM's vCPU threads do. */
export function isVcpu(statLine: string): boolean {
  const fields = statLine.slice(statLine.lastIndexOf(") ") + 2).split(" ");
  return Number(fields[40]) > 0;
}

/** One sample: when, then each group's cumulative ms on a CPU and ms waiting, in `groups` order. */
export function sampleOf(
  at: number,
  groups: string[],
  threads: Array<{ group: string; stat: Schedstat }>,
): number[] {
  const sums = groups.map(() => [0, 0]);
  for (const { group, stat } of threads) {
    const sum = sums[groups.indexOf(group)];
    sum[0] += stat.runNs;
    sum[1] += stat.waitNs;
  }
  return [
    at,
    ...sums.flatMap(([run, wait]) => [Math.round(run / NS_PER_MS), Math.round(wait / NS_PER_MS)]),
  ];
}

/** Each group's ms on a CPU and ms waiting in [from, to], interpolated; null outside the samples. */
export function waitsBetween(
  waits: HostWaits,
  from: number,
  to: number,
): Record<string, { runMs: number; waitMs: number }> | null {
  const at = (time: number): number[] | null => {
    for (let i = 1; i < waits.samples.length; i++) {
      const [t0, ...v0] = waits.samples[i - 1];
      const [t1, ...v1] = waits.samples[i];
      if (t0 <= time && time <= t1) {
        const share = t1 === t0 ? 0 : (time - t0) / (t1 - t0);
        return v0.map((value, k) => value + (v1[k] - value) * share);
      }
    }
    return null;
  };
  const start = at(from);
  const end = at(to);
  if (!start || !end) return null;
  return Object.fromEntries(
    waits.groups.map((group, k) => [
      group,
      {
        runMs: Math.round(end[2 * k] - start[2 * k]),
        waitMs: Math.round(end[2 * k + 1] - start[2 * k + 1]),
      },
    ]),
  );
}

/**
 * The startup on the runner's clock: from the app's origin (its start request, or its first JS
 * import on 4.26–4.27) to App started. The app's clock places its origin before the JS start epoch,
 * and processStart's one adb read gives the offset between the app's clock and the runner's.
 */
export function startupWindow(
  sample: Pick<Sample, "events" | "appStartupTime" | "processStartAt" | "processStartAppClockAt">,
): { from: number; to: number } | null {
  const { events, appStartupTime, processStartAt, processStartAppClockAt } = sample;
  const epochName = Object.keys(events ?? {}).find(name => /^JS start epoch \d+$/.test(name));
  const beforeImports = events?.["Before js imports"]?.time;
  if (!epochName || beforeImports === undefined || appStartupTime === undefined) return null;
  if (processStartAt == null || processStartAppClockAt == null) return null;
  const originOnAppClock = Number(epochName.split(" ").pop()) - beforeImports;
  const from = originOnAppClock + (processStartAt - processStartAppClockAt);
  return { from, to: from + appStartupTime };
}

interface Tracked {
  tid: string;
  group: string;
  stat: Schedstat;
}

export function createWaitSampler({
  proc = "/proc",
  pidOf = (device: string) => emulatorProcesses().then(found => found.get(device)),
}: { proc?: string; pidOf?: (device: string) => Promise<number | undefined> } = {}) {
  const pids = new Map<string, Promise<number | undefined>>();
  return {
    /** Starts sampling the device's emulator; null where it cannot (not Linux, no process). */
    async start(device: string): Promise<{ stop(): Promise<HostWaits | null> } | null> {
      if (!pids.has(device))
        pids.set(
          device,
          pidOf(device).catch(() => undefined),
        );
      const pid = await pids.get(device);
      if (pid === undefined) return null;
      const tasks = `${proc}/${pid}/task`;
      const read = (tid: string, file: string) =>
        readFile(`${tasks}/${tid}/${file}`, "utf8").catch(() => "");
      const tidsNow = () => readdir(tasks).catch((): string[] => []);
      const groupOf = async (tid: string) =>
        isVcpu(await read(tid, "stat")) ? VCPU : threadGroup(await read(tid, "comm"));

      const known = new Set(await tidsNow());
      const all = await Promise.all(
        [...known].map(async tid => ({ tid, stat: parseSchedstat(await read(tid, "schedstat")) })),
      );
      const threads: Tracked[] = await Promise.all(
        all
          .flatMap(({ tid, stat }) => (stat ? [{ tid, stat }] : []))
          .sort((a, b) => b.stat.runNs - a.stat.runNs)
          .slice(0, THREADS)
          .map(async ({ tid, stat }) => ({ tid, stat, group: await groupOf(tid) })),
      );
      if (!threads.length) return null;
      const groups = [...new Set(threads.map(t => t.group))];
      const samples: number[][] = [];
      let stopped = false;
      const loop = (async () => {
        while (!stopped) {
          const at = Date.now();
          // A thread started since counts from 0, its counters' start, so no group jumps.
          for (const tid of await tidsNow()) {
            if (known.has(tid)) continue;
            known.add(tid);
            const group = await groupOf(tid);
            if (!groups.includes(group)) groups.push(group);
            threads.push({ tid, group, stat: { runNs: 0, waitNs: 0 } });
          }
          const texts = await Promise.all(threads.map(thread => read(thread.tid, "schedstat")));
          // A thread that ended keeps its last counts, so no group goes backwards.
          texts.forEach((text, i) => {
            threads[i].stat = parseSchedstat(text) ?? threads[i].stat;
          });
          samples.push(sampleOf(at, groups, threads));
          await sleep(Math.max(0, PERIOD_MS - (Date.now() - at)));
        }
      })();
      return {
        async stop() {
          stopped = true;
          await loop;
          if (samples.length < 2) return null;
          // A group that appeared later had 0 before: its threads' counters started then.
          const width = 1 + 2 * groups.length;
          const padded = samples.map(row => [...row, ...Array<number>(width - row.length).fill(0)]);
          const counts = groups.map(group => threads.filter(t => t.group === group).length);
          return { periodMs: PERIOD_MS, groups, threads: counts, samples: padded };
        },
      };
    },
  };
}
