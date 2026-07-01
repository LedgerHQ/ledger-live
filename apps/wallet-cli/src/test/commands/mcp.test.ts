import { describe, it, expect, afterEach } from "bun:test";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "../helpers/cli-runner";

let tmpDir: string | undefined;
afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

async function makeTmpDir(): Promise<string> {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-mcptest-"));
  return tmpDir;
}

describe("mcp --install (cursor config merge)", () => {
  it("creates a fresh config when none exists (ENOENT)", async () => {
    const dir = await makeTmpDir();
    const { stdout, exitCode, stderr } = await runCli([
      "mcp",
      "--install",
      "--agent",
      "cursor",
      "--dir",
      dir,
      "--output",
      "json",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout).status).toBe("success");

    const written = JSON.parse(await readFile(path.join(dir, ".cursor", "mcp.json"), "utf8"));
    expect(written.mcpServers.ledger).toEqual({ command: "wallet-cli", args: ["mcp"] });
  });

  it("merges into an existing valid config, preserving unrelated servers", async () => {
    const dir = await makeTmpDir();
    const cfgPath = path.join(dir, ".cursor", "mcp.json");
    await mkdir(path.dirname(cfgPath), { recursive: true });
    await writeFile(
      cfgPath,
      JSON.stringify({ mcpServers: { other: { command: "other-bin" } }, extra: true }),
      "utf8",
    );

    const { exitCode, stderr } = await runCli([
      "mcp",
      "--install",
      "--agent",
      "cursor",
      "--dir",
      dir,
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const written = JSON.parse(await readFile(cfgPath, "utf8"));
    // Our entry added, the unrelated server + top-level keys preserved.
    expect(written.mcpServers.ledger).toEqual({ command: "wallet-cli", args: ["mcp"] });
    expect(written.mcpServers.other).toEqual({ command: "other-bin" });
    expect(written.extra).toBe(true);
  });

  it("refuses to overwrite an existing but unparseable config (never clobbers user data)", async () => {
    const dir = await makeTmpDir();
    const cfgPath = path.join(dir, ".cursor", "mcp.json");
    await mkdir(path.dirname(cfgPath), { recursive: true });
    const corrupt = "not json{{{";
    await writeFile(cfgPath, corrupt, "utf8");

    const { stdout, exitCode } = await runCli([
      "mcp",
      "--install",
      "--agent",
      "cursor",
      "--dir",
      dir,
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/Refusing to overwrite/i);
    // The corrupt file must be left exactly as-is.
    expect(await readFile(cfgPath, "utf8")).toBe(corrupt);
  });

  it("rejects an unknown agent with a clear message and no misleading --dir hint", async () => {
    const { stdout, exitCode } = await runCli([
      "mcp",
      "--install",
      "--agent",
      "bogus",
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/Unknown agent "bogus"/);
    expect(err.error.message).not.toContain("--dir");
    expect(err.error.message).not.toContain("undefined");
  });
});
