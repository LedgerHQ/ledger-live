import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "artifacts/logs");

export class ADBUtils {
  static isDisabled(): boolean {
    return process.env.CAPTURE_ADB_LOGCAT === "0";
  }

  static async dumpLogcatToArtifacts(label: string): Promise<string | undefined> {
    if (ADBUtils.isDisabled()) return;
    console.log(`Dumping ADB logcat to artifacts with label: ${label}`);
    const logs = await driver.getLogs("logcat");
    console.log(`Retrieved ${logs.length} logcat entries`);
    mkdirSync(LOG_DIR, { recursive: true });
    const file = path.join(LOG_DIR, `logcat-${label}-${Date.now()}.txt`);
    const body = logs.map(entry => `[${entry.level}] ${entry.message}`).join("\n");
    writeFileSync(file, body, "utf8");
    console.log(`ADB logcat saved to ${file}`);
    return file;
  }
}

export default ADBUtils;
