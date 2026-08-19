import { getPackages } from "@manypkg/get-packages";
import { existsSync } from "node:fs";
import path from "node:path";

export type ChangelogTarget = { name: string; dir: string; path: string };

/**
 * Resolves targets through the workspace definition rather than a glob, so
 * build output and vendored copies (`apps/cli/dist/CHANGELOG.md`,
 * `apps/ledger-live-mobile/vendor/**\/CHANGELOG.md`) are unreachable by
 * construction instead of relying on an exclusion list.
 */
export async function findChangelogTargets(cwd: string): Promise<ChangelogTarget[]> {
  const { packages } = await getPackages(cwd);

  return packages
    .map(pkg => ({
      name: pkg.packageJson.name,
      dir: pkg.dir,
      path: path.join(pkg.dir, "CHANGELOG.md"),
    }))
    .filter(target => existsSync(target.path))
    .sort((a, b) => a.path.localeCompare(b.path));
}
