import { globalTeardown } from "detox/runners/jest";
import { promises as fs } from "fs";
import path from "path";
import { glob } from "glob";
import { log } from "detox";

const USERDATA_DIR = path.resolve(__dirname, "userdata");
const USERDATA_GLOB = path.join(USERDATA_DIR, "temp-userdata-*.json");

export default async () => {
  // default Detox teardown
  await globalTeardown();
  // parallel file cleanups
  await Promise.all([cleanupUserdata()]);
};

async function cleanupUserdata() {
  try {
    const files = await glob(USERDATA_GLOB);
    await Promise.all(files.map(file => fs.unlink(file)));
    log.info(`Cleaned up ${files.length} temp‑userdata files`);
  } catch (error) {
    log.warn("Failed to cleanup temp‑userdata files:", error);
  }
}
