import fs from "node:fs";
import path from "node:path";
import { parseAllDocuments } from "yaml";
import { assertDependencyChecks } from "./validate.js";

function findLockfile(from: string): string {
  const candidate = path.join(from, "pnpm-lock.yaml");
  if (fs.existsSync(candidate)) return candidate;
  const parent = path.dirname(from);
  if (parent === from) throw new Error("pnpm-lock.yaml not found");
  return findLockfile(parent);
}

export function checkLockfile(): string | null {
  // pnpm 12 prepends an env document (packageManagerDependencies); the dependency graph is the last one.
  const lockfile = parseAllDocuments(fs.readFileSync(findLockfile(process.cwd()), "utf8"))
    .at(-1)
    ?.toJS();
  try {
    assertDependencyChecks(lockfile);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
