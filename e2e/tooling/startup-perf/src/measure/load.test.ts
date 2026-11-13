import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  busiest,
  cpuLoad,
  describeLoad,
  parseLoadSnapshot,
  parsePsTimes,
  threadGroups,
} from "./load.ts";
import type { Sample } from "../types.ts";
import type { ProcessTime } from "./types.ts";

const FIELDS_BEFORE_UTIME = "S 1 2 3 4 5 6 7 8 9 10";
const stat = (pid: number, name: string, utime: number, stime: number) =>
  `${pid} (${name}) ${FIELDS_BEFORE_UTIME} ${utime} ${stime} 0 0 20 0 1 0 500`;

const DEVICE_OUTPUT = [
  "cpu  100 20 50 800 10 5 15 0 0 0",
  "1.50 1.20 0.90 3/812 4321",
  "MemAvailable:    1048576 kB",
  stat(1, "init", 10, 5),
  stat(4321, "com.ledger.live", 300, 100),
  stat(77, "a) b", 1, 1),
  "",
].join("\r\n");

const processes = (entries: Array<[number, string, number]>) =>
  new Map<number, ProcessTime>(entries.map(([pid, name, cpuMs]) => [pid, { name, cpuMs }]));

describe("parseLoadSnapshot", () => {
  const snapshot = parseLoadSnapshot(DEVICE_OUTPUT, 1000);

  it("splits the CPU time into busy, idle, iowait and steal", () => {
    assert.deepEqual(snapshot.cpu, { busy: 190, idle: 800, iowait: 10, steal: 0 });
  });
  it("reads the load average and the available memory", () => {
    assert.equal(snapshot.load1, 1.5);
    assert.equal(snapshot.memAvailableMb, 1024);
  });
  it("reads each process's CPU time in ms, past a name that holds a parenthesis", () => {
    assert.deepEqual(snapshot.processes.get(4321), { name: "com.ledger.live", cpuMs: 4000 });
    assert.deepEqual(snapshot.processes.get(77), { name: "a) b", cpuMs: 20 });
    assert.equal(snapshot.processes.size, 3);
  });
  it("has no CPU time when the device answered nothing", () => {
    assert.equal(parseLoadSnapshot("error: device offline", 1000).cpu, null);
  });
});

describe("parsePsTimes", () => {
  it("reads macOS CPU times and names the process by its executable", () => {
    const parsed = parsePsTimes(
      ["  12   1:02.50 /usr/libexec/mds stores", "345 1-00:00:01.00 launchd", "junk"].join("\n"),
    );
    assert.deepEqual(parsed.get(12), { name: "mds stores", cpuMs: 62_500 });
    assert.deepEqual(parsed.get(345), { name: "launchd", cpuMs: 86_401_000 });
    assert.equal(parsed.size, 2);
  });
});

describe("busiest", () => {
  it("counts a process that started in between, or reused a pid, from zero", () => {
    const before = processes([
      [1, "system_server", 1000],
      [2, "old", 500],
      [3, "idle", 40],
    ]);
    const after = processes([
      [1, "system_server", 1300],
      [2, "new", 200],
      [3, "idle", 40],
      [4, "com.ledger.live", 2500],
    ]);
    assert.deepEqual(busiest(before, after), [
      [4, "com.ledger.live", 2500],
      [1, "system_server", 300],
      [2, "new", 200],
    ]);
  });
});

describe("threadGroups", () => {
  it("sums the threads whose names differ only by a number", () => {
    const before = processes([
      [10, "llvmpipe-0", 100],
      [11, "llvmpipe-1", 100],
      [12, "qemu-system-x86", 1000],
    ]);
    const after = processes([
      [10, "llvmpipe-0", 400],
      [11, "llvmpipe-1", 300],
      [12, "qemu-system-x86", 1200],
    ]);
    assert.deepEqual(threadGroups(before, after), [
      ["llvmpipe-#", 500],
      ["qemu-system-x86", 200],
    ]);
  });
});

describe("cpuLoad", () => {
  const before = {
    at: 1000,
    cpu: { busy: 100, idle: 900, iowait: 0, steal: 0 },
    load1: 0.5,
    memAvailableMb: 2000,
    processes: processes([[1, "qemu-system-x86", 0]]),
  };
  const after = {
    at: 6000,
    cpu: { busy: 400, idle: 1000, iowait: 50, steal: 50 },
    load1: 2.25,
    memAvailableMb: 1500,
    processes: processes([[1, "qemu-system-x86", 3000]]),
  };

  it("gives shares of the CPU time between the two snapshots", () => {
    const load = cpuLoad(before, after);
    assert.equal(load.ms, 5000);
    assert.equal(load.busy, 0.6);
    assert.equal(load.iowait, 0.1);
    assert.equal(load.steal, 0.1);
  });
  it("keeps the memory before the launch and the load average after it", () => {
    const load = cpuLoad(before, after);
    assert.equal(load.memAvailableMb, 2000);
    assert.equal(load.load1, 2.25);
  });
  it("names the busiest processes with nameOf", () => {
    const load = cpuLoad(before, after, (pid, name) => `${name} emulator-555${pid + 3}`);
    assert.deepEqual(load.top, [["qemu-system-x86 emulator-5554", 1, 3000]]);
  });
  it("has no shares where the machine does not count iowait or steal", () => {
    const load = cpuLoad(
      { ...before, cpu: { ...before.cpu, iowait: null, steal: null } },
      { ...after, cpu: { ...after.cpu, iowait: null, steal: null } },
    );
    assert.equal(load.busy, 0.75);
    assert.equal(load.iowait, null);
    assert.equal(load.steal, null);
  });
});

describe("describeLoad", () => {
  it("writes a line per machine with its busiest processes", () => {
    const sample = {
      device: "emulator-5554",
      hostLoad: {
        ms: 5000,
        busy: 0.63,
        iowait: 0,
        steal: 0.02,
        load1: 5.1,
        memAvailableMb: 9000,
        top: [
          ["qemu-system-x86 emulator-5554", 1, 7400],
          ["java", 2, 300],
        ],
      },
      emulatorThreads: [["llvmpipe-#", 2100]],
      deviceLoad: {
        ms: 7500,
        busy: 0.71,
        iowait: null,
        steal: null,
        load1: null,
        memAvailableMb: null,
        top: [["com.ledger.live", 3, 6800]],
      },
    } as Sample;
    assert.deepEqual(describeLoad(sample), [
      "  runner 63% busy (steal 2%, load 5.1): qemu-system-x86 emulator-5554 7.4 s, java 0.3 s",
      "  emulator-5554 threads: llvmpipe-# 2.1 s",
      "  device 71% busy: com.ledger.live 6.8 s",
    ]);
  });
});
