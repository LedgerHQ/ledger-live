import { setTimeout as sleep } from "timers/promises";
import { hasExited, isInstalled, isUpdateStaged, quitApp } from "./utils/builds.mts";
import { parseAutoUpgradeOptions, startAutoUpgrade } from "./utils/startAutoUpgrade.mts";

const pollInterval = 1_000;
const checkTimeout = 120_000;
const stageTimeout = 60_000;
const installTimeout = 60_000;

const options = parseAutoUpgradeOptions();
const startedAt = Date.now();
let signatureFetched = false;

const { base, update, app } = await startAutoUpgrade(options, file => {
  if (file.endsWith(".sha512sum.sig")) signatureFetched = true;
});

if (!(await isInstalled(base.version))) {
  await quitApp(app);
  exit(false, `Could not read ${base.version} as the installed version`);
}

console.log(`Waiting for ${base.version} to download ${update.version} and check its signature`);
await poll(() => signatureFetched || hasExited(app), checkTimeout);
if (hasExited(app)) exit(false, `${base.version} quit early, is another Ledger Wallet running?`);
if (!signatureFetched) {
  await quitApp(app);
  exit(false, `${base.version} did not check ${update.version} within ${checkTimeout / 1000}s`);
}

console.log(`Waiting for ${update.version} to be ready to install`);
if (!(await poll(() => isUpdateStaged(startedAt), stageTimeout))) {
  console.log(`${update.version} was not staged within ${stageTimeout / 1000}s`);
}

console.log(`Quitting ${base.version} to install ${update.version}`);
await quitApp(app);
const upgraded = await poll(() => isInstalled(update.version), installTimeout);

if (options.wrongKey) {
  exit(
    !upgraded,
    upgraded
      ? `${base.version} installed ${update.version} although it is signed with another key`
      : `${base.version} refused ${update.version}, signed with another key`,
  );
}
exit(
  upgraded,
  upgraded
    ? `${base.version} upgraded to ${update.version}`
    : `${base.version} did not upgrade to ${update.version} within ${installTimeout / 1000}s`,
);

async function poll(check: () => boolean | Promise<boolean>, timeout: number) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(pollInterval);
  }
  return false;
}

function exit(passed: boolean, message: string): never {
  if (passed) console.log(`PASS: ${message}`);
  else console.error(`FAIL: ${message}`);
  process.exit(passed ? 0 : 1);
}
