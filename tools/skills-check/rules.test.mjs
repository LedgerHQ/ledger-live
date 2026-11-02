import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { checkRepo, describeProblem, listFiles } from "./rules.mjs";

const roots = [];
after(() => roots.forEach(root => rmSync(root, { recursive: true, force: true })));

const repo = files => {
  const root = mkdtempSync(join(tmpdir(), "skills-check-"));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
};

const skill = (frontmatter, body = "# Skill\n") => `---\n${frontmatter}\n---\n\n${body}`;
const GOOD_DESCRIPTION = "description: Format the changed files. Use when committing.";

const codes = root => checkRepo(root).map(({ file, line, code }) => `${file}:${line}:${code}`);

describe("frontmatter", () => {
  it("accepts a skill whose name is its folder and that has a description", () => {
    const root = repo({ ".agents/skills/fmt/SKILL.md": skill(`name: fmt\n${GOOD_DESCRIPTION}`) });
    assert.deepEqual(codes(root), []);
  });

  it("reports a skill without a frontmatter block", () => {
    const root = repo({ ".agents/skills/fmt/SKILL.md": "# Skill\n" });
    assert.deepEqual(codes(root), [".agents/skills/fmt/SKILL.md:1:frontmatter"]);
  });

  it("reports a second frontmatter block", () => {
    const twice = `---\nname: fmt\n${GOOD_DESCRIPTION}\n---\n---\nname: fmt\n---\n`;
    const root = repo({ ".agents/skills/fmt/SKILL.md": twice });
    assert.deepEqual(codes(root), [".agents/skills/fmt/SKILL.md:5:frontmatter"]);
  });

  it("reports a name that differs from the skill folder", () => {
    const root = repo({
      ".agents/skills/fmt/SKILL.md": skill(`name: format\n${GOOD_DESCRIPTION}`),
    });
    assert.deepEqual(codes(root), [".agents/skills/fmt/SKILL.md:2:frontmatter"]);
  });

  it("reports a missing description", () => {
    const root = repo({ ".agents/skills/fmt/SKILL.md": skill("name: fmt") });
    assert.deepEqual(codes(root), [".agents/skills/fmt/SKILL.md:1:frontmatter"]);
  });

  it("reports an agent whose name differs from its file name", () => {
    const root = repo({
      ".agents/agents/runner.md": skill("name: test-runner\ndescription: Runs."),
    });
    assert.deepEqual(codes(root), [".agents/agents/runner.md:2:frontmatter"]);
  });

  it("reads a block scalar description", () => {
    const folded = "description: >-\n  Format the changed files.\n  Use when committing.";
    const root = repo({ ".agents/skills/fmt/SKILL.md": skill(`name: fmt\n${folded}`) });
    assert.deepEqual(codes(root), []);
  });

  it("asks no frontmatter of a skill reference file", () => {
    const root = repo({ ".agents/skills/fmt/references/rules.md": "# Rules\n" });
    assert.deepEqual(codes(root), []);
  });
});

describe("cursor-key", () => {
  it("reports each Cursor rule key", () => {
    const keys = `name: fmt\n${GOOD_DESCRIPTION}\nglobs: ["**/*.ts"]\nalwaysApply: true\nmodel: fast\nis_background: true`;
    const root = repo({ ".agents/skills/fmt/SKILL.md": skill(keys) });
    assert.deepEqual(codes(root), [
      ".agents/skills/fmt/SKILL.md:4:cursor-key",
      ".agents/skills/fmt/SKILL.md:5:cursor-key",
      ".agents/skills/fmt/SKILL.md:6:cursor-key",
      ".agents/skills/fmt/SKILL.md:7:cursor-key",
    ]);
  });
});

describe("description", () => {
  it("accepts what the skill does and when to read it", () => {
    assert.equal(describeProblem("Read when adding events. Import track from the package."), null);
    assert.equal(describeProblem("Prefer Set.has() for allowlists; use when reviewing."), null);
  });

  it("reports a description without a Use when or Read when clause", () => {
    assert.match(describeProblem("Fetch and summarize review comments"), /no "Use when"/);
    const root = repo({
      ".agents/skills/fmt/SKILL.md": skill("name: fmt\ndescription: Format the changed files."),
    });
    assert.deepEqual(codes(root), [".agents/skills/fmt/SKILL.md:3:description"]);
  });

  it("reports a description that only says when", () => {
    assert.match(describeProblem("Use when committing."), /not what it does/);
  });

  it("leaves agent descriptions alone", () => {
    const root = repo({
      ".agents/agents/runner.md": skill("name: runner\ndescription: Runs tests."),
    });
    assert.deepEqual(codes(root), []);
  });
});

describe("dead-link", () => {
  it("reports relative and root links that do not resolve", () => {
    const root = repo({
      "docs/guide.md": "See [a](./other.md), [b](/docs/gone.md) and [c](missing.md#part).\n",
      "docs/other.md": "# Other\n",
    });
    assert.deepEqual(codes(root), ["docs/guide.md:1:dead-link", "docs/guide.md:1:dead-link"]);
  });

  it("follows anchors, reference links and directories", () => {
    const root = repo({
      "docs/guide.md": "[a](other.md#part), [b](./), [c][ref]\n\n[ref]: ../docs/other.md\n",
      "docs/other.md": "# Other\n",
    });
    assert.deepEqual(codes(root), []);
  });

  it("ignores external links, anchors and code", () => {
    const root = repo({
      "docs/guide.md": [
        "[site](https://example.com) [mail](mailto:a@b.c) [top](#top) `[x](nowhere.md)`",
        "```md",
        "[y](nowhere.md)",
        "```",
      ].join("\n"),
    });
    assert.deepEqual(codes(root), []);
  });
});

describe("dead-path", () => {
  it("reports a backticked path under a top-level folder that does not exist", () => {
    const root = repo({
      "AGENTS.md": "Code lives in `apps/app/src/index.ts`, not in `apps/app/src/gone.ts`.\n",
      "apps/app/src/index.ts": "",
    });
    assert.deepEqual(codes(root), ["AGENTS.md:1:dead-path"]);
  });

  it("skips globs, placeholders, other roots and package-relative folders", () => {
    const root = repo({
      "AGENTS.md": [
        "`apps/*/package.json` `apps/<name>/src` `apps/{a,b}` `src/gone.ts`",
        "`tests/setup.ts` `scripts/build.mjs` `@shared/env` `apps/.../gone.ts`",
      ].join("\n"),
      "apps/app/index.ts": "",
      "tests/.keep": "",
      "scripts/.keep": "",
    });
    assert.deepEqual(codes(root), []);
  });

  it("skips paths in fenced code blocks", () => {
    const root = repo({ "AGENTS.md": "```sh\ncat `apps/gone.ts`\n```\n", "apps/app.ts": "" });
    assert.deepEqual(codes(root), []);
  });

  it("skips gitignored build outputs", () => {
    const root = repo({
      "AGENTS.md": "Built to `apps/app/dist/main.js`, from `apps/app/src/main.ts`.\n",
      "apps/app/.gitignore": "dist/\n",
      "apps/app/src/.keep": "",
    });
    execFileSync("git", ["init", "-q"], { cwd: root });
    assert.deepEqual(codes(root), ["AGENTS.md:1:dead-path"]);
  });
});

const waived = (root, waivers) =>
  checkRepo(root, { waivers, waiversFile: "waivers.json" }).map(
    ({ file, line, code }) => `${file}:${line}:${code}`,
  );

describe("waivers", () => {
  const files = {
    "AGENTS.md": "There is no `apps/aggregate`.\n",
    "docs/guide.md": "There is no `apps/aggregate` either.\n",
    "apps/app.ts": "",
  };

  it("waives a missing path in the one file it names", () => {
    const waivers = [{ file: "AGENTS.md", path: "apps/aggregate", reason: "Says it is absent." }];
    assert.deepEqual(waived(repo(files), waivers), ["docs/guide.md:1:dead-path"]);
  });

  it("waives no other code than dead-path", () => {
    const root = repo({ "AGENTS.md": "[a](apps/aggregate)\n" });
    const waivers = [{ file: "AGENTS.md", path: "apps/aggregate", reason: "Says it is absent." }];
    assert.deepEqual(waived(root, waivers), ["AGENTS.md:1:dead-link", "AGENTS.md:1:stale-waiver"]);
  });

  it("reports a waiver that matches nothing", () => {
    const waivers = [{ file: "AGENTS.md", path: "apps/app.ts", reason: "Exists now." }];
    const root = repo(files);
    assert.deepEqual(waived(root, waivers), [
      "AGENTS.md:1:dead-path",
      "AGENTS.md:1:stale-waiver",
      "docs/guide.md:1:dead-path",
    ]);
  });

  it("reports a waiver without a reason", () => {
    const waivers = [{ file: "AGENTS.md", path: "apps/aggregate", reason: " " }];
    assert.deepEqual(waived(repo(files), waivers), [
      "AGENTS.md:1:dead-path",
      "docs/guide.md:1:dead-path",
      "waivers.json:1:waiver",
    ]);
  });

  it("give every shipped waiver a file, a path and a reason", () => {
    const shipped = JSON.parse(readFileSync(new URL("./waivers.json", import.meta.url), "utf8"));
    for (const waiver of shipped) assert.ok(waiver.file && waiver.path && waiver.reason?.trim());
  });
});

describe("listFiles", () => {
  it("covers .agents, docs, AGENTS.md and the layer READMEs, not package READMEs", () => {
    const root = repo({
      ".agents/skills/fmt/SKILL.md": "",
      "docs/nested/guide.md": "",
      "AGENTS.md": "",
      "shared/README.md": "",
      "domain/entity/README.md": "",
      "shared/env/README.md": "",
      "apps/app/README.md": "",
      "docs/image.png": "",
    });
    assert.deepEqual(listFiles(root), [
      ".agents/skills/fmt/SKILL.md",
      "AGENTS.md",
      "docs/nested/guide.md",
      "domain/entity/README.md",
      "shared/README.md",
    ]);
  });
});
