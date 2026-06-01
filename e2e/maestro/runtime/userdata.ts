import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { USERDATA_DIR } from "./paths";

// Copies a userdata fixture to a unique temp file so a run can mutate/import it
// without touching the committed fixture. Removed in the session's finally.
export function createTempUserdata(baseName: string): { name: string; path: string } {
  const name = `temp-userdata-${randomUUID()}`;
  const targetPath = path.join(USERDATA_DIR, `${name}.json`);
  fs.copyFileSync(path.join(USERDATA_DIR, `${baseName}.json`), targetPath);
  return { name, path: targetPath };
}

export function removeTempUserdata(filePath: string): void {
  fs.rmSync(filePath, { force: true });
}
