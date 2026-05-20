import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Config = {
  workspace?: string;
  binary?: string;
  model?: string;
  mode?: "plan" | "ask" | "agent";
  extraArgs?: string[];
  timeoutMs?: number;
};

type ToolCallRecord = {
  name: string;
  path?: string;
};

type StreamEvent = {
  type?: string;
  subtype?: string;
  session_id?: string;
  model?: string;
  message?: { content?: Array<{ type?: string; text?: string }> };
  tool_call?: {
    readToolCall?: { args?: { path?: string } };
    createPlanToolCall?: { args?: { plan?: string } };
    [key: string]:
      | { args?: { path?: string; plan?: string }; name?: string }
      | undefined;
  };
  result?: string;
  duration_ms?: number;
};

function augmentPromptForSkillEval(prompt: string): string {
  const suitePath = process.env.EVAL_SUITE;
  if (!suitePath) {
    return prompt;
  }
  const match = suitePath.match(/[/\\]skills[/\\]([^/\\]+)[/\\]evals\.json$/);
  if (!match) {
    return prompt;
  }
  const skillName = match[1];
  return (
    `Read the agent skill at .agents/skills/${skillName}/SKILL.md ` +
    `(use the Read tool) before answering.\n\n${prompt}`
  );
}

function findRepoRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  while (true) {
    if (
      existsSync(join(dir, "pnpm-workspace.yaml")) ||
      existsSync(join(dir, ".git"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return resolve(startDir);
    }
    dir = parent;
  }
}

function runProcess(
  binary: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(binary, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      rejectPromise(new Error(`cursor-agent timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      rejectPromise(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ stdout, stderr, code });
    });
  });
}

function parseStreamJson(stdout: string): {
  output: string;
  metadata: {
    filesRead: string[];
    toolCalls: ToolCallRecord[];
    sessionId?: string;
    durationMs?: number;
    mode?: string;
    model?: string;
  };
} {
  const filesRead: string[] = [];
  const toolCalls: ToolCallRecord[] = [];
  let output = "";
  let sessionId: string | undefined;
  let durationMs: number | undefined;
  let model: string | undefined;

  const lines = stdout.split("\n").filter((line) => line.trim().length > 0);

  for (const line of lines) {
    let event: StreamEvent;
    try {
      event = JSON.parse(line) as StreamEvent;
    } catch {
      continue;
    }

    if (event.type === "system" && event.subtype === "init") {
      sessionId = event.session_id ?? sessionId;
      model = event.model ?? model;
    }

    if (event.type === "assistant" && event.message?.content) {
      const text = event.message.content
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text)
        .join("");
      if (text && text.length > output.length) {
        output = text;
      }
    }

    if (event.type === "tool_call" && event.tool_call) {
      const planText = event.tool_call.createPlanToolCall?.args?.plan;
      if (planText && planText.length > output.length) {
        output = planText;
      }

      const readPath = event.tool_call.readToolCall?.args?.path;
      if (readPath) {
        filesRead.push(readPath);
        toolCalls.push({ name: "read", path: readPath });
      }
      for (const [key, value] of Object.entries(event.tool_call)) {
        if (key === "readToolCall" || key === "createPlanToolCall") continue;
        const path = value?.args?.path;
        if (!path) continue;
        filesRead.push(path);
        toolCalls.push({ name: key, path });
      }
    }

    if (event.type === "result") {
      if (typeof event.result === "string" && event.result.length > output.length) {
        output = event.result;
      }
      durationMs = event.duration_ms ?? durationMs;
      sessionId = event.session_id ?? sessionId;
    }
  }

  return {
    output,
    metadata: {
      filesRead: [...new Set(filesRead)],
      toolCalls,
      sessionId,
      durationMs,
      model,
    },
  };
}

export default class CursorAgentProvider {
  private cfg: Config;

  constructor(opts: { id?: string; config?: Config } = {}) {
    this.cfg = opts.config ?? {};
  }

  id() {
    return "cursor-agent";
  }

  async callApi(
    prompt: string,
    context: { vars?: Record<string, unknown> } = {},
  ) {
    const vars = context.vars ?? {};
    const mode =
      (vars.mode as Config["mode"] | undefined) ?? this.cfg.mode ?? "plan";
    const model = (vars.model as string | undefined) ?? this.cfg.model;
    const cwd = resolve(this.cfg.workspace ?? findRepoRoot());

    const args = [
      "-p",
      "--output-format",
      "stream-json",
      "--workspace",
      cwd,
      "--trust",
    ];

    const skillDirs = [
      join(cwd, ".agents", "skills"),
      join(cwd, ".claude", "skills"),
    ];
    for (const dir of skillDirs) {
      if (existsSync(dir)) {
        args.push("--plugin-dir", dir);
      }
    }

    if (mode && mode !== "agent") {
      args.push("--mode", mode);
    }
    if (model) {
      args.push("--model", model);
    }
    if (this.cfg.extraArgs?.length) {
      args.push(...this.cfg.extraArgs);
    }
    args.push(augmentPromptForSkillEval(prompt));

    const binary = this.cfg.binary ?? "cursor-agent";
    const timeoutMs = this.cfg.timeoutMs ?? 600_000;

    try {
      const { stdout, stderr, code } = await runProcess(
        binary,
        args,
        cwd,
        timeoutMs,
      );

      if (code !== 0) {
        return {
          error: `cursor-agent exited ${code}: ${stderr || stdout}`,
        };
      }

      const { output, metadata } = parseStreamJson(stdout);

      return {
        output,
        metadata: {
          ...metadata,
          mode,
          model: metadata.model ?? model,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }
}
