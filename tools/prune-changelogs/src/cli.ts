import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "./args.ts";
import { findChangelogTargets } from "./packages.ts";
import { pruneChangelog } from "./prune.ts";

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

export async function run(argv: string[]): Promise<number> {
  const options = parseArgs(argv);
  const targets = await findChangelogTargets(options.cwd);

  const pruned: { path: string; before: number; after: number; dropped: number }[] = [];
  let bytesBefore = 0;
  let bytesAfter = 0;
  let untouched = 0;
  let tooSmall = 0;
  let malformed = 0;

  for (const target of targets) {
    const text = await readFile(target.path, "utf8");
    bytesBefore += text.length;

    const outcome = pruneChangelog(text, options.keep);

    if (!outcome.changed) {
      bytesAfter += text.length;
      if (outcome.reason === "malformed-header") {
        malformed += 1;
        console.warn(`skipped (no "# name" header): ${target.path}`);
      } else if (outcome.reason === "no-saving") {
        tooSmall += 1;
      } else {
        untouched += 1;
      }
      continue;
    }

    bytesAfter += outcome.bytesAfter;
    pruned.push({
      path: path.relative(options.cwd, target.path),
      before: outcome.bytesBefore,
      after: outcome.bytesAfter,
      dropped: outcome.dropped,
    });

    if (!options.dryRun) await writeFile(target.path, outcome.text);
  }

  report({
    options,
    targets: targets.length,
    pruned,
    untouched,
    tooSmall,
    malformed,
    bytesBefore,
    bytesAfter,
  });
  return 0;
}

function report({
  options,
  targets,
  pruned,
  untouched,
  tooSmall,
  malformed,
  bytesBefore,
  bytesAfter,
}: {
  options: { keep: number; dryRun: boolean };
  targets: number;
  pruned: { path: string; before: number; after: number; dropped: number }[];
  untouched: number;
  tooSmall: number;
  malformed: number;
  bytesBefore: number;
  bytesAfter: number;
}): void {
  const mode = options.dryRun ? "dry run" : "write";
  console.log(`\nprune-changelogs (${mode}, keep=${options.keep})`);
  console.log(`  scanned ${targets} workspace changelogs`);

  for (const entry of [...pruned]
    .sort((a, b) => b.before - b.after - (a.before - a.after))
    .slice(0, 10)) {
    console.log(
      `  ${kb(entry.before).padStart(8)} -> ${kb(entry.after).padStart(7)}  (-${entry.dropped} entries)  ${entry.path}`,
    );
  }
  if (pruned.length > 10) console.log(`  ... and ${pruned.length - 10} more`);

  console.log(
    `  pruned ${pruned.length}, within limit ${untouched}, too small to benefit ${tooSmall}, skipped ${malformed}`,
  );
  console.log(`  total ${mb(bytesBefore)} -> ${mb(bytesAfter)}\n`);
}
