"use strict";
import "../../__tests__/test-helpers/environment";
import * as fsSync from "node:fs";
import fs from "node:fs/promises";
import mkdirp from "mkdirp";
import path from "node:path";
import { promiseAllBatched } from "../../promise";
import { spawn } from "node:child_process";
import { Report } from "./types";
import { getSpecsPerBots } from "./logic";
import { finalMarkdownReport, csvReports } from "./formatter";

// prepare envs

const {
  PATH,
  COINAPPS,
  SUMMARY,
  REPORT_FOLDER,
  FILTER_CURRENCIES,
  FILTER_FAMILIES,
  DEFAULT_FILTER_SEEDS,
  FILTER_SEEDS,
  VERBOSE,
} = process.env;

if (!COINAPPS) {
  throw new Error("COINAPPS env variable is required");
}
const SEEDS = {};
const filterSeeds =
  (DEFAULT_FILTER_SEEDS || FILTER_SEEDS)
    ?.split(",")
    .map(f => f.trim())
    .filter(Boolean) || [];
for (const env of Object.keys(process.env)) {
  if (env.startsWith("SEED") && (!filterSeeds.length || filterSeeds.includes(env.slice(4)))) {
    SEEDS[env] = process.env[env];
  }
}
if (Object.keys(SEEDS).length === 0) {
  throw new Error("SEED* env variables are required");
}

const specsPerBots = getSpecsPerBots(SEEDS, {
  currencies: FILTER_CURRENCIES,
  families: FILTER_FAMILIES,
});

const parallelRuns = parseInt(process.env.PARALLEL || "6", 10);
const globalEnv = {
  PATH,
  COINAPPS,
};

if (REPORT_FOLDER) {
  mkdirp.sync(REPORT_FOLDER);
}

let progress = 0;

// run the jobs with a max parallelism to trigger sync of accounts on different bots
promiseAllBatched(parallelRuns, specsPerBots, async ({ env, family, key, seed }) => {
  const localFolder = REPORT_FOLDER
    ? path.join(REPORT_FOLDER, `${family}-${key}-${seed}`)
    : undefined;

  if (localFolder) {
    await mkdirp(localFolder);
  }

  const reportPromise = new Promise<Report>(resolve => {
    const child = spawn(
      "node",
      [...(localFolder ? ["--prof"] : []), path.join(__dirname, "process-sync.js"), family, key],
      {
        cwd: localFolder,
        env: {
          ...globalEnv,
          ...env,
          REPORT_FOLDER: localFolder,
          START_TIME: String(Date.now()),
        },
      },
    );

    // TODO timeout
    let lastResult = null;
    child.stdout.on("data", data => {
      const str = data.toString();
      if (VERBOSE) {
        // eslint-disable-next-line no-console
        console.log(`${family}:${key}: stdout: ${str}`);
      }
      if (str.startsWith("{")) {
        lastResult = JSON.parse(str);
      }
    });
    child.stderr.on("data", data => {
      console.error(`${family}:${key}: stderr: ${data}`);
    });
    child.on("error", error => {
      console.error(`${family}:${key}: error: ${error}`);
      resolve({ error: String(error) });
    });
    child.on("close", code => {
      if (code === 0) {
        resolve(lastResult || { error: "no result" });
      } else {
        resolve({ error: `child process exited with code ${code}` });
      }
    });
  });

  const report = await reportPromise;

  progress++;

  // eslint-disable-next-line no-console
  console.log(
    `${Math.floor((progress / specsPerBots.length) * 100)}% progress (${progress}/${
      specsPerBots.length
    })`,
  );

  return report;
}).then(async (results: Report[]) => {
  if (REPORT_FOLDER) {
    const reportDir = path.resolve(REPORT_FOLDER);
    try {
      const isolateLogFiles = await globIsolateLogs(reportDir);
      if (isolateLogFiles.length > 0) {
        await runNodeProfProcess(reportDir, isolateLogFiles);
        for (const rel of isolateLogFiles) {
          await fs.unlink(path.join(reportDir, rel));
        }
      }
    } catch (e) {
      console.error(e);
    }

    // TODO write folder
    await fs.writeFile(
      path.join(reportDir, "report.json"),
      JSON.stringify(
        results.map((r, i) => {
          const spb = specsPerBots[i];
          if (!spb) return r;
          const { seed, family, key } = spb;
          return { seed, family, key, ...r };
        }),
      ),
    );

    const csvs = csvReports(results, specsPerBots);
    for (const { filename, content } of csvs) {
      const folder = path.join(reportDir, path.dirname(filename));
      await mkdirp(folder);
      await fs.writeFile(path.join(folder, path.basename(filename)), content);
    }
  }
  if (SUMMARY) {
    const markdown = finalMarkdownReport(results, specsPerBots);
    await fs.writeFile(SUMMARY, markdown, "utf-8");
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(results));
  }
});

/**
 * List isolate*.log paths relative to `dir` (e.g. `runFolder/isolate-0.log`).
 * Safe to pass to `node --prof-process` with `cwd: path.resolve(dir)` and to join with `dir` for parent `fs` calls.
 */
async function globIsolateLogs(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  const isolateRe = /^isolate.*\.log$/;
  for (const e of entries) {
    if (e.isDirectory()) {
      const subEntries = await fs.readdir(path.join(dir, e.name), { withFileTypes: true });
      for (const s of subEntries) {
        if (s.isFile() && isolateRe.test(s.name)) {
          files.push(path.join(e.name, s.name));
        }
      }
    }
  }
  return files;
}

/** Run node --prof-process --preprocess -j <files>; `logFiles` are relative to `cwd` (use absolute `cwd`). */
function runNodeProfProcess(cwd: string, logFiles: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let finalize!: (err: Error | null) => void;
    const outPath = path.join(cwd, "cpuprofile.txt");
    const outStream = fsSync.createWriteStream(outPath);
    outStream.on("error", streamError => {
      const err = streamError instanceof Error ? streamError : new Error(String(streamError));
      finalize(err);
    });

    let childProcess: ReturnType<typeof spawn> | null = null;
    let settled = false;

    finalize = (err: Error | null) => {
      if (settled) {
        return;
      }
      settled = true;

      // Ensure the child process is not left running in error scenarios.
      if (childProcess && childProcess.exitCode === null && childProcess.signalCode === null) {
        try {
          childProcess.kill();
        } catch {
          // Ignore kill errors; we're already handling the primary failure.
        }
      }

      const done = () => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      if (!outStream.destroyed) {
        outStream.end(done);
      } else {
        done();
      }
    };

    try {
      // Sonar S4036: use absolute path to executable (process.execPath), no PATH lookup.
      childProcess = spawn(
        process.execPath,
        ["--prof-process", "--preprocess", "-j", ...logFiles],
        {
          cwd,
          stdio: ["inherit", outStream, "inherit"],
        },
      );
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      finalize(err);
      return;
    }

    childProcess.on("error", childError => {
      const err = childError instanceof Error ? childError : new Error(String(childError));
      finalize(err);
    });

    childProcess.on("close", (code, signal) => {
      if (code === 0) {
        finalize(null);
        return;
      }
      if (code === null && signal) {
        finalize(new Error(`node terminated by signal ${signal}`));
        return;
      }
      finalize(new Error(`node exited with code ${code}`));
    });
  });
}
