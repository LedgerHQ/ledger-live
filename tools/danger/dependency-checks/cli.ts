import { checkLockfile } from "./check-lockfile.ts";

const message = checkLockfile();
if (message) {
  console.error(message);
  process.exit(1);
}
console.log("dependency checks passed");
