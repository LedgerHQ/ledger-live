import { log } from "@ledgerhq/logs";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === "object" && error !== null && "code" in error;

export type UserDataCleanupOptions = {
  readonly patterns: RegExp[];
};

export class UserDataCleanup {
  private readonly patterns: RegExp[];

  constructor(
    private readonly userDataPath: string,
    options: UserDataCleanupOptions,
  ) {
    this.patterns = options.patterns;
  }

  private shouldCleanup(fileName: string) {
    return this.patterns.some(matcher => matcher.test(fileName));
  }

  async cleanup(): Promise<void> {
    try {
      const entries = await fsPromises.readdir(this.userDataPath, { withFileTypes: true });
      const staleFiles: string[] = [];
      for (const entry of entries) {
        if (entry.isFile() && this.shouldCleanup(entry.name)) {
          staleFiles.push(path.join(this.userDataPath, entry.name));
        }
      }

      if (!staleFiles.length) return;

      const results = await Promise.allSettled(
        staleFiles.map(filePath => fsPromises.unlink(filePath)),
      );
      const failures = results.filter(result => result.status === "rejected");
      if (failures.length) {
        log("user-data", `cleanup failed for ${failures.length} file(s)`);
      }
    } catch (error) {
      if (isErrnoException(error) && error.code === "ENOENT") return;
      log("user-data", `cleanup failed: ${String(error)}`);
    }
  }
}
