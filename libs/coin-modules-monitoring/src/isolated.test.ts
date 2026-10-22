import fs from "fs";
import os from "os";
import path from "path";
import {
  buildJobs,
  runIsolated,
  runIsolatedMonitor,
  validateConcurrency,
  type Job,
} from "./isolated";

describe("isolated", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("validateConcurrency", () => {
    it.each([NaN, 0, 2.5, -1])("rejects %p", value => {
      expect(() => validateConcurrency(value)).toThrow("Invalid concurrency");
    });

    it("accepts a positive integer", () => {
      expect(validateConcurrency(4)).toBe(4);
    });
  });

  describe("buildJobs", () => {
    it("puts big accounts first, keeps currency order and skips missing accounts", () => {
      expect(buildJobs(["bitcoin", "solana", "tezos"], ["pristine", "big"])).toEqual([
        ["solana", "big"],
        ["tezos", "big"],
        ["bitcoin", "pristine"],
        ["solana", "pristine"],
        ["tezos", "pristine"],
      ]);
    });
  });

  describe("runIsolated", () => {
    const jobs: Job[] = Array.from({ length: 10 }, (_, i) => [`currency${i}`, "average"]);

    it("never runs more jobs than the concurrency", async () => {
      let running = 0;
      let maxRunning = 0;
      const runOne = jest.fn(async () => {
        maxRunning = Math.max(maxRunning, ++running);
        await new Promise(resolve => setTimeout(resolve, 5));
        running--;
      });

      expect(await runIsolated(jobs, 3, runOne)).toBe(false);
      expect(maxRunning).toBe(3);
      expect(runOne).toHaveBeenCalledTimes(10);
    });

    it("keeps running the other jobs when one fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      const runOne = jest.fn(async ([currency]: Job) => {
        if (currency === "currency2") throw new Error("boom");
      });

      expect(await runIsolated(jobs, 4, runOne)).toBe(true);
      expect(runOne).toHaveBeenCalledTimes(10);
    });

    it("does not fail when only a huge account fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      const runOne = jest.fn(async ([, accountType]: Job) => {
        if (accountType === "huge") throw new Error("out of memory");
      });

      expect(await runIsolated([["solana", "huge"], ...jobs], 4, runOne)).toBe(false);
    });

    it("does nothing without jobs", async () => {
      expect(await runIsolated([], 4, jest.fn())).toBe(false);
    });
  });

  describe("runIsolatedMonitor", () => {
    // The child behaves according to the currency it is given
    const script = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "monitoring-")), "child.js");
    fs.writeFileSync(
      script,
      `const currency = process.argv[process.argv.indexOf("--currencies") + 1];
console.log("out line");
console.error("err line");
if (currency === "kill") process.kill(process.pid, "SIGKILL");
process.exitCode = currency === "fail" ? 1 : 0;`,
    );

    beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("prefixes the child output and resolves on success", async () => {
      await runIsolatedMonitor(["ok", "average"], script);

      expect(console.log).toHaveBeenCalledWith("[ok/average]", "out line");
      expect(console.error).toHaveBeenCalledWith("[ok/average]", "err line");
    });

    it("rejects with the exit code", async () => {
      await expect(runIsolatedMonitor(["fail", "average"], script)).rejects.toThrow("code 1");
    });

    it("rejects with the signal", async () => {
      await expect(runIsolatedMonitor(["kill", "average"], script)).rejects.toThrow(
        "signal SIGKILL",
      );
    });
  });
});
