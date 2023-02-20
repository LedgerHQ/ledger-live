"use strict";
import "../../__tests__/test-helpers/environment";
import fs from "fs/promises";
import mkdirp from "mkdirp";
import path from "path";
import { promiseAllBatched } from "../../promise";
import { exec, spawn } from "child_process";
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
    .map((f) => f.trim())
    .filter(Boolean) || [];
for (const env of Object.keys(process.env)) {
  if (
    env.startsWith("SEED") &&
    (!filterSeeds.length || filterSeeds.includes(env.slice(4)))
  ) {
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
promiseAllBatched(
  parallelRuns,
  specsPerBots,
  async ({ env, family, key, seed }) => {
    const localFolder = REPORT_FOLDER
      ? path.join(REPORT_FOLDER, `${family}-${key}-${seed}`)
      : undefined;

    if (localFolder) {
      await mkdirp(localFolder);
    }

    const reportPromise = new Promise<Report>((resolve) => {
      const child = spawn(
        "node",
        [
          ...(localFolder ? ["--prof"] : []),
          path.join(__dirname, "process-sync.js"),
          family,
          key,
        ],
        {
          cwd: localFolder,
          env: {
            ...globalEnv,
            ...env,
            REPORT_FOLDER: localFolder,
            START_TIME: String(Date.now()),
          },
        }
      );

      // TODO timeout
      let lastResult = null;
      child.stdout.on("data", (data) => {
        const str = data.toString();
        if (VERBOSE) {
          // eslint-disable-next-line no-console
          console.log(`${family}:${key}: stdout: ${str}`);
        }
        if (str.startsWith("{")) {
          lastResult = JSON.parse(str);
        }
      });
      child.stderr.on("data", (data) => {
        console.error(`${family}:${key}: stderr: ${data}`);
      });
      child.on("error", (error) => {
        console.error(`${family}:${key}: error: ${error}`);
        resolve({ error: String(error) });
      });
      child.on("close", (code) => {
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
      `${Math.floor(
        (progress / specsPerBots.length) * 100
      )}% progress (${progress}/${specsPerBots.length})`
    );

    return report;
  }
).then(async (results: Report[]) => {
  if (REPORT_FOLDER) {
    try {
      const opts = { cwd: REPORT_FOLDER, env: { PATH: process.env.PATH } };
      await execp(
        `node --prof-process --preprocess -j */isolate*.log > cpuprofile.txt`,
        opts
      );
      await execp(`rm */isolate*.log`, opts);
    } catch (e) {
      console.error(e);
    }

    // TODO write folder
    fs.writeFile(
      path.join(REPORT_FOLDER, "report.json"),
      JSON.stringify(
        results.map((r, i) => {
          const spb = specsPerBots[i];
          if (!spb) return r;
          const { seed, family, key } = spb;
          return { seed, family, key, ...r };
        })
      )
    );

    const csvs = csvReports(results, specsPerBots);
    for (const { filename, content } of csvs) {
      const folder = path.join(REPORT_FOLDER, path.dirname(filename));
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

function execp(cmd, opts) {
  return new Promise((resolve, reject) => {
    exec(cmd, opts, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}
