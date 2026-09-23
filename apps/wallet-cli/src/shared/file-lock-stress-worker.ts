// Spawned as a real, separate OS process by file-lock.test.ts's multi-process stress test — NOT a
// test itself. In-process tests can't falsify a cross-process lock (every lock they take has the
// same, live pid), so this exercises the real thing: many actual processes racing `withFileLock`
// on one shared lock file, each appending its own enter/exit to one shared, append-only log so the
// test can check afterwards that no two processes were ever inside the critical section together.
import { appendFileSync } from "node:fs";
import { withFileLock } from "./file-lock";

const [, , lockPath, logPath, iterationsArg] = process.argv;
const iterations = Number(iterationsArg);

function log(line: string): void {
  appendFileSync(logPath, `${line}\n`);
}

async function main(): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    await withFileLock(lockPath, async () => {
      log(`enter:${process.pid}`);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 15));
      log(`exit:${process.pid}`);
    });
  }
}

await main();
