import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// The export is what agents install, so these tests read the exported tree, not the sources.

const root = path.resolve(import.meta.dir, "..");
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

const TOP_LEVEL_VERSIONED = [
  "package.json",
  "plugin.json",
  "openclaw.plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
];
const MARKETPLACES = [".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json"];

let target = "";

function readJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(target, rel), "utf8"));
}

beforeAll(async () => {
  target = await mkdtemp(path.join(tmpdir(), "export-agent-plugin-"));
  execFileSync(process.execPath, [path.join(root, "scripts/export-agent-plugin.mjs"), target], {
    stdio: "pipe",
  });
});

afterAll(async () => {
  await rm(target, { recursive: true, force: true });
});

describe("export-agent-plugin", () => {
  it.each(TOP_LEVEL_VERSIONED)("stamps the wallet-cli version into %s", rel => {
    expect(readJson(rel).version).toBe(version);
  });

  it("stamps the wallet-cli version into each Claude Code marketplace entry", () => {
    const { plugins } = readJson(".claude-plugin/marketplace.json") as {
      plugins: { version?: string }[];
    };
    expect(plugins.length).toBeGreaterThan(0);
    for (const plugin of plugins) expect(plugin.version).toBe(version);
  });

  it("names the plugin agent-skills in the marketplace named ledger", () => {
    for (const rel of [
      "package.json",
      "plugin.json",
      ".claude-plugin/plugin.json",
      ".cursor-plugin/plugin.json",
    ]) {
      expect(readJson(rel).name, rel).toBe("agent-skills");
    }
    expect(readJson("openclaw.plugin.json").id).toBe("agent-skills");
    for (const rel of MARKETPLACES) {
      const { name, plugins } = readJson(rel) as { name: string; plugins: { name: string }[] };
      expect(name, rel).toBe("ledger");
      expect(
        plugins.map(plugin => plugin.name),
        rel,
      ).toEqual(["agent-skills"]);
    }
  });

  it("ships the skill in its standalone form under skills/", () => {
    const skillDir = path.join(target, "skills", "wallet-cli-usage");
    const skillMd = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    expect(skillMd).toContain("name: wallet-cli-usage");
    expect(skillMd).not.toContain("pnpm --silent wallet-cli start");
    expect(existsSync(path.join(skillDir, "references", "agent-intent.md"))).toBe(true);
  });

  it("lists only wallet-cli-usage as the OpenClaw skill root", () => {
    expect(readJson("openclaw.plugin.json").skills).toEqual(["./skills/wallet-cli-usage"]);
  });

  it("points OpenClaw's git install at the shipped runtime entry", () => {
    const { openclaw } = readJson("package.json") as { openclaw: { extensions: string[] } };
    for (const entry of openclaw.extensions)
      expect(existsSync(path.join(target, entry))).toBe(true);
  });

  it("copies the changelog", () => {
    expect(existsSync(path.join(target, "CHANGELOG.md"))).toBe(true);
  });

  it("keeps the README and the smoke test out of the export", () => {
    expect(existsSync(path.join(target, "README.md"))).toBe(false);
    expect(existsSync(path.join(target, "tests"))).toBe(false);
  });
});

describe("agent-plugin sources", () => {
  it.each([...TOP_LEVEL_VERSIONED, ".claude-plugin/marketplace.json"])(
    "%s carries no version of its own",
    rel => {
      const source = readFileSync(path.join(root, "agent-plugin", rel), "utf8");
      expect(source).not.toContain('"version"');
    },
  );
});
