import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { sleep } from "./exec.ts";
import {
  createWaitSampler,
  isVcpu,
  parseSchedstat,
  sampleOf,
  startupWindow,
  waitsBetween,
} from "./host-waits.ts";
import { threadGroup } from "./load.ts";
import type { HostWaits } from "../types.ts";

// A /proc/<pid>/task/<tid>/stat line: guest_time is field 43.
const statLine = (tid: number, name: string, guestTicks: number) =>
  `${tid} (${name}) S ${Array.from({ length: 40 }, (_, i) => (i === 40 - 1 ? guestTicks : 0)).join(" ")} 0 0 0`;

describe("parseSchedstat", () => {
  it("reads the ns on a CPU and the ns waiting for one", () => {
    assert.deepEqual(parseSchedstat("1234567890 98765432 4321\n"), {
      runNs: 1234567890,
      waitNs: 98765432,
    });
  });

  it("gives null for a thread that ended", () => {
    assert.equal(parseSchedstat(""), null);
  });
});

describe("isVcpu", () => {
  it("tells the threads that count guest time", () => {
    assert.equal(isVcpu(statLine(10, "qemu-system-x86", 5000)), true);
    assert.equal(isVcpu(statLine(11, "qemu-system-x86", 0)), false);
    assert.equal(isVcpu(statLine(12, "a (b) c", 7)), true);
  });
});

describe("threadGroup", () => {
  it("puts numbered workers in one group and keeps names without numbers", () => {
    assert.equal(threadGroup("llvmpipe-12\n"), "llvmpipe-#");
    assert.equal(threadGroup("qemu-system-x86"), "qemu-system-x86");
  });
});

describe("sampleOf", () => {
  it("sums each group's threads, in ms", () => {
    const threads = [
      { group: "llvmpipe-#", stat: { runNs: 3_000_000, waitNs: 1_000_000 } },
      { group: "vCPU", stat: { runNs: 10_000_000, waitNs: 2_000_000 } },
      { group: "llvmpipe-#", stat: { runNs: 4_000_000, waitNs: 500_000 } },
    ];
    assert.deepEqual(sampleOf(1000, ["vCPU", "llvmpipe-#"], threads), [1000, 10, 2, 7, 2]);
  });
});

describe("waitsBetween", () => {
  const waits: HostWaits = {
    periodMs: 50,
    groups: ["vCPU", "llvmpipe-#"],
    threads: [4, 8],
    samples: [
      [1000, 0, 0, 0, 0],
      [1050, 40, 10, 20, 0],
      [1100, 80, 30, 40, 4],
    ],
  };

  it("interpolates each group's growth inside the window", () => {
    assert.deepEqual(waitsBetween(waits, 1025, 1100), {
      vCPU: { runMs: 60, waitMs: 25 },
      "llvmpipe-#": { runMs: 30, waitMs: 4 },
    });
  });

  it("gives null for a window outside the samples", () => {
    assert.equal(waitsBetween(waits, 990, 1100), null);
    assert.equal(waitsBetween(waits, 1000, 1200), null);
  });
});

describe("startupWindow", () => {
  // The runner's clock is 70 s ahead of the app's.
  const clocks = { processStartAt: 1_700_000_070_000, processStartAppClockAt: 1_700_000_000_000 };

  it("starts at the app's origin, its start request, on the runner's clock", () => {
    const window = startupWindow({
      ...clocks,
      appStartupTime: 1800,
      events: {
        "Before js imports": { count: 1, time: 560 },
        "JS start epoch 1700000000590": { count: 1, time: 560 },
      },
    });
    assert.deepEqual(window, { from: 1_700_000_070_030, to: 1_700_000_071_830 });
  });

  it("starts at the first JS import on builds that count from it", () => {
    const window = startupWindow({
      ...clocks,
      appStartupTime: 1300,
      events: {
        "Before js imports": { count: 1, time: 3 },
        "JS start epoch 1700000000903": { count: 1, time: 4 },
      },
    });
    assert.deepEqual(window, { from: 1_700_000_070_900, to: 1_700_000_072_200 });
  });

  it("gives null without the JS start epoch or the clocks", () => {
    const events = { "Before js imports": { count: 1, time: 560 } };
    assert.equal(startupWindow({ ...clocks, appStartupTime: 1800, events }), null);
    assert.equal(
      startupWindow({
        processStartAt: null,
        processStartAppClockAt: null,
        appStartupTime: 1800,
        events: { ...events, "JS start epoch 1": { count: 1, time: 560 } },
      }),
      null,
    );
  });
});

describe("createWaitSampler", () => {
  async function fakeProc() {
    const proc = await mkdtemp(path.join(os.tmpdir(), "host-waits-"));
    const task = path.join(proc, "4242", "task");
    const thread = async (tid: number, name: string, guestTicks: number, ms: [number, number]) => {
      await mkdir(path.join(task, String(tid)), { recursive: true });
      await writeFile(path.join(task, String(tid), "comm"), `${name}\n`);
      await writeFile(path.join(task, String(tid), "stat"), statLine(tid, name, guestTicks));
      await setStat(tid, ms);
    };
    const setStat = (tid: number, [run, wait]: [number, number]) =>
      writeFile(path.join(task, String(tid), "schedstat"), `${run * 1e6} ${wait * 1e6} 9\n`);
    return { proc, task, thread, setStat };
  }

  it("groups vCPUs apart, adds threads that start, and keeps the counts of threads that end", async () => {
    const { proc, task, thread, setStat } = await fakeProc();
    try {
      await thread(1, "qemu-system-x86", 900, [5000, 100]);
      await thread(2, "qemu-system-x86", 0, [3000, 50]);
      await thread(3, "llvmpipe-0", 0, [2000, 40]);
      const sampler = createWaitSampler({ proc, pidOf: async () => 4242 });
      const running = await sampler.start("emulator-5554");
      if (!running) throw new Error("the sampler did not start");
      await sleep(120);
      await setStat(1, [5100, 130]);
      await thread(4, "RenderThread", 0, [20, 6]);
      await rm(path.join(task, "3"), { recursive: true });
      await sleep(120);
      const waits = await running.stop();
      if (!waits) throw new Error("no samples");
      assert.deepEqual(waits.groups, ["vCPU", "qemu-system-x86", "llvmpipe-#", "RenderThread"]);
      assert.deepEqual(waits.threads, [1, 1, 1, 1]);
      const [first, last] = [waits.samples[0], waits.samples.at(-1)];
      assert.deepEqual(first.slice(1), [5000, 100, 3000, 50, 2000, 40, 0, 0]);
      assert.deepEqual(last?.slice(1), [5100, 130, 3000, 50, 2000, 40, 20, 6]);
      assert.ok(waits.samples.every(row => row.length === 9));
    } finally {
      await rm(proc, { recursive: true, force: true });
    }
  });

  it("does not start without the emulator's process", async () => {
    const sampler = createWaitSampler({ proc: os.tmpdir(), pidOf: async () => undefined });
    assert.equal(await sampler.start("emulator-5554"), null);
  });
});
