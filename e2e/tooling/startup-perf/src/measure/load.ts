// What else used the CPU around each launch, on the runner and in the device.
import { readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { run } from "./exec.ts";
import type { CpuLoad, Sample } from "../types.ts";
import type { CpuTimes, LoadSnapshot, Platform, ProcessTime } from "./types.ts";

// Linux counts CPU time in ticks of 1/100 s (USER_HZ).
const MS_PER_TICK = 10;
const TOP_PROCESSES = 6;
const TOP_THREADS = 6;
const LOGGED_PROCESSES = 3;

export function parseCpuLine(text: string): CpuTimes | null {
  const fields = /^cpu +([\d ]+)$/m.exec(text)?.[1].trim().split(/ +/).map(Number);
  if (!fields || fields.length < 4) return null;
  const [user, nice, system, idle, iowait = 0, irq = 0, softirq = 0, steal = 0] = fields;
  return { busy: user + nice + system + irq + softirq, idle, iowait, steal };
}

export function parseLoad1(text: string): number | null {
  const load = Number(/^(\d+\.\d+) \d+\.\d+ \d+\.\d+ /m.exec(text)?.[1]);
  return Number.isFinite(load) ? load : null;
}

export function parseMemAvailableMb(text: string): number | null {
  const kb = Number(/^MemAvailable: +(\d+) kB/m.exec(text)?.[1]);
  return Number.isFinite(kb) ? Math.round(kb / 1024) : null;
}

/** Lines of /proc/<pid>/stat (or of a thread's): each one's name and user + system time. */
export function parseProcessStats(text: string): Map<number, ProcessTime> {
  const processes = new Map<number, ProcessTime>();
  for (const line of text.split("\n")) {
    const open = line.indexOf(" (");
    const close = line.lastIndexOf(") ");
    if (open < 1 || close < open) continue;
    const pid = Number(line.slice(0, open));
    const fields = line.slice(close + 2).split(" ");
    const ticks = Number(fields[11]) + Number(fields[12]);
    if (!Number.isInteger(pid) || pid <= 0 || !Number.isFinite(ticks)) continue;
    processes.set(pid, { name: line.slice(open + 2, close), cpuMs: ticks * MS_PER_TICK });
  }
  return processes;
}

/** `ps -A -o pid=,time=,comm=` on macOS: CPU time as [[dd-]hh:]mm:ss.cc, the command as a path. */
export function parsePsTimes(text: string): Map<number, ProcessTime> {
  const processes = new Map<number, ProcessTime>();
  for (const line of text.split("\n")) {
    const match = /^ *(\d+) +([\d:.-]+) +(.+)$/.exec(line);
    if (!match) continue;
    const [days, clock] = match[2].includes("-") ? match[2].split("-") : ["0", match[2]];
    const seconds =
      Number(days) * 24 * 60 * 60 +
      clock.split(":").reduce((total, part) => total * 60 + Number(part), 0);
    if (Number.isFinite(seconds)) {
      processes.set(Number(match[1]), {
        name: path.basename(match[3].trim()),
        cpuMs: Math.round(seconds * 1000),
      });
    }
  }
  return processes;
}

export function parseLoadSnapshot(output: string, at: number): LoadSnapshot {
  const text = output.replaceAll("\r", "");
  return {
    at,
    cpu: parseCpuLine(text),
    load1: parseLoad1(text),
    memAvailableMb: parseMemAvailableMb(text),
    processes: parseProcessStats(text),
  };
}

/** CPU ms each process used between two snapshots, busiest first: pid, name, ms. */
export function busiest(
  before: Map<number, ProcessTime>,
  after: Map<number, ProcessTime>,
): Array<[number, string, number]> {
  return [...after]
    .map(([pid, { name, cpuMs }]): [number, string, number] => {
      const earlier = before.get(pid);
      // A process that started in between counts from zero, and so does a reused pid.
      const from = earlier?.name === name && earlier.cpuMs <= cpuMs ? earlier.cpuMs : 0;
      return [pid, name, cpuMs - from];
    })
    .filter(([, , ms]) => ms > 0)
    .sort((a, b) => b[2] - a[2]);
}

/** A thread name with its numbers as #, so that numbered workers share a group (llvmpipe-#). */
export const threadGroup = (name: string) => name.trim().replace(/(?<![A-Za-z\d])\d+/g, "#");

/** CPU ms of a process's threads between two snapshots, summed by name: llvmpipe-0 as llvmpipe-#. */
export function threadGroups(
  before: Map<number, ProcessTime>,
  after: Map<number, ProcessTime>,
): Array<[string, number]> {
  const groups = new Map<string, number>();
  for (const [, name, ms] of busiest(before, after)) {
    const group = threadGroup(name);
    groups.set(group, (groups.get(group) ?? 0) + ms);
  }
  return [...groups].sort((a, b) => b[1] - a[1]).slice(0, TOP_THREADS);
}

const twoDecimals = (value: number) => Math.round(value * 100) / 100;

export function cpuLoad(
  before: LoadSnapshot,
  after: LoadSnapshot,
  nameOf: (pid: number, name: string) => string = (_, name) => name,
): CpuLoad {
  const used = (pick: (times: CpuTimes) => number | null): number | null => {
    const from = before.cpu && pick(before.cpu);
    const to = after.cpu && pick(after.cpu);
    return from === null || to === null ? null : to - from;
  };
  const busy = used(t => t.busy);
  const idle = used(t => t.idle);
  const iowait = used(t => t.iowait);
  const steal = used(t => t.steal);
  const total = (busy ?? 0) + (idle ?? 0) + (iowait ?? 0) + (steal ?? 0);
  const share = (part: number | null) =>
    part === null || total <= 0 ? null : twoDecimals(part / total);
  return {
    ms: after.at - before.at,
    busy: share(busy),
    iowait: share(iowait),
    steal: share(steal),
    load1: after.load1 === null ? null : twoDecimals(after.load1),
    memAvailableMb: before.memAvailableMb,
    top: busiest(before.processes, after.processes)
      .slice(0, TOP_PROCESSES)
      .map(([pid, name, ms]) => [nameOf(pid, name), pid, ms]),
  };
}

const numericEntries = async (dir: string): Promise<string[]> =>
  (await readdir(dir).catch(() => [])).filter(entry => /^\d+$/.test(entry));

const readAll = async (files: string[]): Promise<string> =>
  (await Promise.all(files.map(file => readFile(file, "utf8").catch(() => "")))).join("\n");

function osCpuTimes(): CpuTimes {
  let busy = 0;
  let idle = 0;
  for (const { times } of os.cpus()) {
    busy += times.user + times.nice + times.sys + times.irq;
    idle += times.idle;
  }
  return { busy, idle, iowait: null, steal: null };
}

/** The runner's counters and processes; on macOS, without iowait, steal or memory. */
export async function readHostSnapshot(): Promise<LoadSnapshot> {
  const at = Date.now();
  if (process.platform === "linux") {
    const pids = await numericEntries("/proc");
    const text = await readAll([
      "/proc/stat",
      "/proc/loadavg",
      "/proc/meminfo",
      ...pids.map(pid => `/proc/${pid}/stat`),
    ]);
    return parseLoadSnapshot(text, at);
  }
  const { stdout } = await run("ps", ["-A", "-o", "pid=,time=,comm="], { allowFail: true });
  return {
    at,
    cpu: osCpuTimes(),
    load1: os.loadavg()[0] ?? null,
    memAvailableMb: null,
    processes: parsePsTimes(stdout),
  };
}

/** The pid of each emulator's process on the runner, by serial, from its -port argument. */
export async function emulatorProcesses(): Promise<Map<string, number>> {
  const found = new Map<string, number>();
  if (process.platform !== "linux") return found;
  for (const pid of await numericEntries("/proc")) {
    const args = (await readFile(`/proc/${pid}/cmdline`, "utf8").catch(() => "")).split("\0");
    const port = args.indexOf("-port");
    if (args[0].includes("qemu-system") && port > 0 && args[port + 1]) {
      found.set(`emulator-${args[port + 1]}`, Number(pid));
    }
  }
  return found;
}

async function readThreads(pid: number | undefined): Promise<Map<number, ProcessTime>> {
  if (pid === undefined) return new Map();
  const tids = await numericEntries(`/proc/${pid}/task`);
  return parseProcessStats(await readAll(tids.map(tid => `/proc/${pid}/task/${tid}/stat`)));
}

type LoadFields = Pick<Sample, "hostLoad" | "deviceLoad" | "emulatorThreads">;

/**
 * Snapshots around a launch: the device's when `watch` is called, before the idle time, the
 * runner's at `launching`, both again at `settled`. A failed read leaves its fields out.
 */
export function createLoadWatcher(platform: Platform) {
  let emulators: Promise<Map<string, number>> | null = null;
  const none = () => null;
  return async function watch(device: string) {
    emulators ??= emulatorProcesses().catch(() => new Map<string, number>());
    const serials = await emulators;
    const emulatorPid = serials.get(device);
    const nameOf = (pid: number, name: string) => {
      const serial = [...serials].find(([, p]) => p === pid)?.[0];
      return serial ? `${name} ${serial}` : name;
    };
    const deviceBefore = await platform.load(device).catch(none);
    let hostBefore: LoadSnapshot | null = null;
    let threadsBefore = new Map<number, ProcessTime>();
    return {
      async launching(): Promise<void> {
        [hostBefore, threadsBefore] = await Promise.all([
          readHostSnapshot().catch(none),
          readThreads(emulatorPid).catch(() => new Map<number, ProcessTime>()),
        ]);
      },
      async settled(): Promise<LoadFields> {
        const [hostAfter, threadsAfter] = await Promise.all([
          readHostSnapshot().catch(none),
          readThreads(emulatorPid).catch(() => new Map<number, ProcessTime>()),
        ]);
        const deviceAfter = await platform.load(device).catch(none);
        const fields: LoadFields = {};
        if (hostBefore && hostAfter) fields.hostLoad = cpuLoad(hostBefore, hostAfter, nameOf);
        if (deviceBefore && deviceAfter) fields.deviceLoad = cpuLoad(deviceBefore, deviceAfter);
        if (threadsBefore.size && threadsAfter.size) {
          fields.emulatorThreads = threadGroups(threadsBefore, threadsAfter);
        }
        return fields;
      },
    };
  };
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const percent = (share: number | null) => (share === null ? "?" : `${Math.round(share * 100)}%`);

function describeCpuLoad(machine: string, load: CpuLoad): string {
  const counters = [
    load.steal ? `steal ${percent(load.steal)}` : null,
    load.iowait ? `iowait ${percent(load.iowait)}` : null,
    load.load1 === null ? null : `load ${load.load1}`,
  ].filter(Boolean);
  const top = load.top
    .slice(0, LOGGED_PROCESSES)
    .map(([name, , ms]) => `${name} ${seconds(ms)}`)
    .join(", ");
  const details = counters.length ? ` (${counters.join(", ")})` : "";
  return `  ${machine} ${percent(load.busy)} busy${details}: ${top}`;
}

/** The launch's load, for the measure log: one line per machine. */
export function describeLoad(sample: Sample): string[] {
  const lines: string[] = [];
  if (sample.hostLoad) lines.push(describeCpuLoad("runner", sample.hostLoad));
  if (sample.emulatorThreads?.length) {
    const threads = sample.emulatorThreads.map(([name, ms]) => `${name} ${seconds(ms)}`);
    lines.push(`  ${sample.device} threads: ${threads.join(", ")}`);
  }
  if (sample.deviceLoad) lines.push(describeCpuLoad("device", sample.deviceLoad));
  return lines;
}
