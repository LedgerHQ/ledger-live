import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import currencies, { type AccountType } from "./currencies";

export type Job = readonly [currency: string, accountType: AccountType];

export function validateConcurrency(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid concurrency: ${value}. It must be a positive integer`);
  }
  return value;
}

// A big scan takes minutes, a huge throughput 2 minutes
const LONGEST_FIRST: Partial<Record<AccountType, number>> = { big: 2, huge: 1 };

export function buildJobs(currencyIds: string[], accountTypes: AccountType[]): Job[] {
  return (
    currencyIds
      .flatMap(currency => accountTypes.map(accountType => [currency, accountType] as const))
      // Do not spawn a process for a currency without this account type
      .filter(([currency, accountType]) => currencies[currency].accounts[accountType])
      // Longest first, by account type: Datadog durations would pack better if needed
      .sort(([, a], [, b]) => (LONGEST_FIRST[b] ?? 0) - (LONGEST_FIRST[a] ?? 0))
  );
}

export function runIsolatedMonitor(
  [currency, accountType]: Job,
  script = path.join(__dirname, "cli.js"),
): Promise<void> {
  return new Promise((resolve, reject) => {
    // The running node binary, rather than whichever "node" comes first in the PATH
    const child = spawn(
      process.execPath,
      [script, "monitor", "--currencies", currency, "--account-types", accountType],
      { stdio: ["ignore", "pipe", "pipe"], env: process.env },
    );

    // Prefix each line so that parallel children stay readable, and stream them so
    // that nothing is lost if the job is killed by its timeout
    const prefix = `[${currency}/${accountType}]`;
    readline.createInterface({ input: child.stdout }).on("line", line => console.log(prefix, line));
    readline
      .createInterface({ input: child.stderr })
      .on("line", line => console.error(prefix, line));

    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const suffix = signal ? ` (signal ${signal})` : "";
        reject(new Error(`Process exited with code ${code}${suffix}`));
      }
    });

    child.on("error", reject);
  });
}

export async function runIsolated(
  jobs: Job[],
  concurrency: number,
  runOne: (job: Job) => Promise<void> = job => runIsolatedMonitor(job),
): Promise<boolean> {
  const queue = [...jobs];
  let failed = false;

  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const [currency, accountType] = job;
      try {
        await runOne(job);
      } catch (error) {
        // A huge account only reports its throughput, even a crash of its process does not fail the run
        if (accountType !== "huge") {
          failed = true;
        }
        console.error(
          `Process failed for currency ${currency} and account type ${accountType} with error ${error}`,
        );
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return failed;
}
