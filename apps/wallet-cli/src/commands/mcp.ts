import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CliProcessExitError } from "../cli-process-exit-error";
import { buildMcpServer } from "../mcp/server";
import { DEFAULT_AGENT, SUPPORTED_AGENTS, type SupportedAgent } from "../skills/registry";
import { walletCliDebug } from "../shared/log";
import { colors, writeStdout, writeStderr } from "../shared/ui";
import { outputOption, resolveOutputFormat } from "./inputs";
import { emitJson, skillEnvelope } from "./skill/shared";

/** JSON-RPC server key + binary name used across every client config snippet. */
const SERVER_KEY = "ledger";
const BIN = "wallet-cli";

function jsonServerEntry(): Record<string, unknown> {
  return { command: BIN, args: ["mcp"] };
}

function cursorSnippet(): string {
  return JSON.stringify({ mcpServers: { [SERVER_KEY]: jsonServerEntry() } }, null, 2);
}

function codexSnippet(): string {
  return `[mcp_servers.${SERVER_KEY}]\ncommand = "${BIN}"\nargs = ["mcp"]\n`;
}

function claudeSnippet(): string {
  return `claude mcp add ${SERVER_KEY} -- ${BIN} mcp`;
}

type ConfigResolveOptions = { global?: boolean; dir?: string };

type McpClientConfig = {
  agent: SupportedAgent;
  /** File the config lives in, when known. */
  file?: string;
  /** The config text (JSON / TOML) or the command to run. */
  snippet: string;
  /** Human instructions for applying the snippet. */
  instructions: string;
  /** JSON file we can safely merge into without clobbering unrelated config. */
  jsonMergeFile?: string;
};

function baseDir({ global, dir }: ConfigResolveOptions): string {
  if (dir) return path.resolve(dir);
  return global ? os.homedir() : process.cwd();
}

function resolveClientConfig(agent: SupportedAgent, opts: ConfigResolveOptions): McpClientConfig {
  switch (agent) {
    case "cursor": {
      const file = path.join(baseDir(opts), ".cursor", "mcp.json");
      return {
        agent,
        file,
        snippet: cursorSnippet(),
        jsonMergeFile: file,
        instructions: `Adds the "${SERVER_KEY}" server to ${file}.`,
      };
    }
    case "codex": {
      const file = opts.dir
        ? path.join(path.resolve(opts.dir), "config.toml")
        : path.join(os.homedir(), ".codex", "config.toml");
      return {
        agent,
        file,
        snippet: codexSnippet(),
        instructions: `Append this block to ${file} (Codex TOML config).`,
      };
    }
    case "claude":
      return {
        agent,
        snippet: claudeSnippet(),
        instructions: "Run this command to register the server with Claude.",
      };
    case "agents":
    default:
      return {
        agent,
        snippet: cursorSnippet(),
        instructions:
          "Add this MCP server entry to your agent's client configuration (JSON shown; adapt as needed).",
      };
  }
}

async function mergeCursorConfig(file: string): Promise<void> {
  let existing: Record<string, unknown> = {};
  let contents: string | undefined;
  try {
    contents = await readFile(file, "utf8");
  } catch (e) {
    // Only a missing file is safe to create fresh; surface anything else (permissions, IO)
    // rather than masking it and overwriting.
    if ((e as NodeJS.ErrnoException)?.code !== "ENOENT") throw e;
  }
  if (contents !== undefined && contents.trim() !== "") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(contents);
    } catch {
      // The file exists but is not valid JSON — refuse rather than clobber the user's config.
      throw new Error(
        `Refusing to overwrite ${file}: it exists but is not valid JSON. Fix or remove it, then re-run.`,
      );
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(
        `Refusing to overwrite ${file}: expected a JSON object at the top level. Fix or remove it, then re-run.`,
      );
    }
    existing = parsed as Record<string, unknown>;
  }
  const prevServers =
    typeof existing.mcpServers === "object" && existing.mcpServers !== null
      ? (existing.mcpServers as Record<string, unknown>)
      : {};
  const merged = {
    ...existing,
    mcpServers: { ...prevServers, [SERVER_KEY]: jsonServerEntry() },
  };
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

function resolveAgent(agent: string | undefined): SupportedAgent {
  const name = (agent ?? DEFAULT_AGENT) as SupportedAgent;
  if (!SUPPORTED_AGENTS.includes(name)) {
    throw new Error(`Unknown agent "${name}". Supported agents: ${SUPPORTED_AGENTS.join(", ")}.`);
  }
  return name;
}

function printConfig(config: McpClientConfig): void {
  writeStdout(colors.bold(`MCP config for ${config.agent}:`));
  writeStdout(config.instructions);
  if (config.file) writeStdout(colors.dim(`File: ${config.file}`));
  writeStdout("");
  writeStdout(config.snippet);
}

async function runInstall(format: "human" | "json", config: McpClientConfig): Promise<void> {
  if (config.jsonMergeFile) {
    await mergeCursorConfig(config.jsonMergeFile);
    if (format === "json") {
      emitJson(skillEnvelope("mcp install", { agent: config.agent, file: config.jsonMergeFile }));
      return;
    }
    writeStdout(
      `Registered the "${SERVER_KEY}" MCP server for ${colors.bold(config.agent)} in ${colors.dim(config.jsonMergeFile)}.`,
    );
    return;
  }

  // No safe automatic write for this agent — print the snippet + instructions.
  if (format === "json") {
    emitJson(
      skillEnvelope("mcp install", {
        agent: config.agent,
        file: config.file,
        snippet: config.snippet,
        autoWrite: false,
      }),
    );
    return;
  }
  writeStderr(
    `No safe automatic config write for ${colors.bold(config.agent)}; apply this manually:\n`,
  );
  printConfig(config);
}

async function runServer(): Promise<void> {
  // Serve mode: stdout is the JSON-RPC stream ONLY. All diagnostics go to stderr.
  walletCliDebug("Starting wallet-cli MCP stdio server…");
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  walletCliDebug("MCP server connected on stdio; awaiting client requests.");
  // Keep the process alive until the client closes stdin; the transport tears down on 'end'.
  await new Promise<void>(resolve => {
    process.stdin.once("end", resolve);
    process.stdin.once("close", resolve);
  });
  await server.close();
  walletCliDebug("MCP transport closed; shutting down.");
}

export default defineCommand({
  name: "mcp",
  description:
    "Run the wallet-cli Model Context Protocol (MCP) stdio server, or manage its client config with --install / --print-config.",
  options: {
    install: option(z.boolean().default(false), {
      description: "Write (or print) the MCP client config for the selected agent, then exit.",
      argumentKind: "flag",
    }),
    "print-config": option(z.boolean().default(false), {
      description: "Print the MCP client config snippet for the selected agent, then exit.",
      argumentKind: "flag",
    }),
    agent: option(z.string().min(1).optional(), {
      description: `Target agent: ${SUPPORTED_AGENTS.join(", ")}. Default: ${DEFAULT_AGENT}.`,
    }),
    global: option(z.boolean().default(false), {
      description: "Resolve the config under the user home directory instead of the cwd.",
      argumentKind: "flag",
    }),
    dir: option(z.string().min(1).optional(), {
      description: "Explicit base directory for the client config (overrides --agent default).",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const wantsConfig = flags.install || flags["print-config"];
    if (!wantsConfig) {
      await runServer();
      return;
    }

    const format = resolveOutputFormat(flags.output);
    try {
      const agent = resolveAgent(flags.agent);
      const config = resolveClientConfig(agent, { global: flags.global, dir: flags.dir });
      if (flags["print-config"] && !flags.install) {
        if (format === "json") {
          emitJson(
            skillEnvelope("mcp print-config", {
              agent: config.agent,
              file: config.file,
              snippet: config.snippet,
            }),
          );
          return;
        }
        printConfig(config);
        return;
      }
      await runInstall(format, config);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (format === "json") {
        emitJson({ ok: false, error: { command: "mcp", message } });
      } else {
        writeStderr(message + "\n");
      }
      throw new CliProcessExitError(1);
    }
  },
});
