import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MaestroProject } from "../config/projects";

type Scalar = string | number | boolean | null;
type YamlValue = Scalar | YamlValue[] | { [key: string]: YamlValue };
export type MaestroCommand = { [key: string]: YamlValue };

const DEFAULT_TAP_SETTLE_TIMEOUT_MS = 250;

function quoteString(value: string): string {
  return JSON.stringify(value);
}

function toYaml(value: YamlValue, indent = 0): string {
  const padding = " ".repeat(indent);

  if (value === null) return "null";
  if (typeof value === "string") return quoteString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const rendered = toYaml(item, indent + 2);
          return `${padding}- ${rendered.trimStart()}`;
        }
        return `${padding}- ${toYaml(item, indent + 2)}`;
      })
      .join("\n");
  }

  return Object.entries(value)
    .map(([key, entry]) => {
      if (entry && typeof entry === "object") {
        return `${padding}${key}:\n${toYaml(entry, indent + 2)}`;
      }
      return `${padding}${key}: ${toYaml(entry, indent + 2)}`;
    })
    .join("\n");
}

function withFastTapDefaults(command: MaestroCommand): MaestroCommand {
  if (!("tapOn" in command)) return command;

  const tapOn = command.tapOn;
  if (typeof tapOn === "string") {
    return {
      tapOn: {
        text: tapOn,
        waitToSettleTimeoutMs: DEFAULT_TAP_SETTLE_TIMEOUT_MS,
      },
    };
  }

  if (tapOn && typeof tapOn === "object" && !Array.isArray(tapOn)) {
    return {
      tapOn: {
        waitToSettleTimeoutMs: DEFAULT_TAP_SETTLE_TIMEOUT_MS,
        ...tapOn,
      },
    };
  }

  return command;
}

const PACKAGE_ROOT = path.resolve(__dirname, "..");

export class MaestroRuntime {
  private readonly tmpDir = path.join(PACKAGE_ROOT, "artifacts", "maestro", "tmp");
  private flowCount = 0;

  constructor(private readonly project: MaestroProject) {}

  async runFlow(name: string, commands: MaestroCommand[], env: Record<string, string> = {}) {
    mkdirSync(this.tmpDir, { recursive: true });

    const flowPath = path.join(this.tmpDir, `${name}-${randomUUID()}.yaml`);
    const body = commands.map(command => toYaml([withFastTapDefaults(command)])).join("\n");
    const contents = [`appId: ${this.project.appId}`, `name: ${name}`, "---", body, ""].join("\n");

    writeFileSync(flowPath, contents);

    const maxAttempts = this.project.platform === "ios" ? 2 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const exitCode = await this.runMaestroProcess(flowPath, env);
      if (exitCode === 0) return;
      if (attempt === maxAttempts) {
        throw new Error(`Maestro flow "${name}" failed with exit code ${exitCode}`);
      }
      console.warn(`Maestro flow "${name}" failed with exit code ${exitCode}; retrying once.`);
    }
  }

  private async runMaestroProcess(flowPath: string, env: Record<string, string>): Promise<number> {
    const envArgs = Object.entries(env).flatMap(([key, value]) => ["-e", `${key}=${value}`]);
    const driverArgs = this.flowCount > 0 ? ["--no-reinstall-driver"] : [];
    this.flowCount += 1;
    const child = spawn(
      "maestro",
      [`--platform=${this.project.platform}`, "test", ...driverArgs, ...envArgs, flowPath],
      {
        stdio: "inherit",
      },
    );

    return new Promise<number>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", code => resolve(code ?? 1));
    });
  }
}
