import { spawnSync } from "node:child_process";

/**
 * @param {string[]} args
 * @param {string} cwd
 */
export function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1 << 30 });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

/**
 * Contents of `<rev>:<path>` blobs, read with a single `git cat-file --batch`; undefined when missing.
 * @param {string} cwd
 * @param {string[]} specs
 */
export function readBlobs(cwd, specs) {
  if (specs.length === 0) return [];
  const out = spawnSync("git", ["cat-file", "--batch"], {
    cwd,
    input: `${specs.join("\n")}\n`,
    maxBuffer: 1 << 30,
  }).stdout;
  const texts = [];
  let pos = 0;
  for (let i = 0; i < specs.length; i++) {
    const end = out.indexOf(0x0a, pos);
    const header = out.subarray(pos, end).toString();
    pos = end + 1;
    if (header.endsWith(" missing")) {
      texts.push(undefined);
      continue;
    }
    const size = Number(header.split(" ")[2]);
    texts.push(out.subarray(pos, pos + size).toString("utf8"));
    pos += size + 1;
  }
  return texts;
}
