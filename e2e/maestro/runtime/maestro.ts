import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MaestroProject } from "../config/projects";
import { allureAttach, allureStep } from "./allure";

type Scalar = string | number | boolean | null;
type YamlValue = Scalar | YamlValue[] | { [key: string]: YamlValue };
export type MaestroCommand = { [key: string]: YamlValue };

const DEFAULT_TAP_SETTLE_TIMEOUT_MS = 250;
const DEFAULT_WAIT_TIMEOUT_MS = 60_000;

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

function withWaitDefaults(command: MaestroCommand): MaestroCommand {
  const wait = command.extendedWaitUntil;
  if (wait && typeof wait === "object" && !Array.isArray(wait) && !("timeout" in wait)) {
    return { ...command, extendedWaitUntil: { ...wait, timeout: DEFAULT_WAIT_TIMEOUT_MS } };
  }
  return command;
}

function deepNormalize(value: YamlValue): YamlValue {
  if (Array.isArray(value)) {
    return value.map(deepNormalize);
  }
  if (value !== null && typeof value === "object") {
    const normalized = withWaitDefaults(withFastTapDefaults(value));
    const out: { [key: string]: YamlValue } = {};
    for (const [key, entry] of Object.entries(normalized)) {
      out[key] = deepNormalize(entry);
    }
    return out;
  }
  return value;
}

const PACKAGE_ROOT = path.resolve(__dirname, "..");

export type RunFlowOptions = {
  webViewHierarchy?: boolean;
};

export class MaestroRuntime {
  private readonly tmpDir = path.join(PACKAGE_ROOT, "artifacts", "maestro", "tmp");
  private flowCount = 0;

  constructor(private readonly project: MaestroProject) {}

  async runFlow(
    name: string,
    commands: MaestroCommand[],
    env: Record<string, string> = {},
    options: RunFlowOptions = {},
  ) {
    mkdirSync(this.tmpDir, { recursive: true });

    const flowPath = path.join(this.tmpDir, `${name}-${randomUUID()}.yaml`);
    const contents = this.serialize(name, commands, options);

    writeFileSync(flowPath, contents);

    await allureStep(`native flow: ${name}`, async () => {
      allureAttach(`${name}.yaml`, contents, "text/yaml");

      const maxAttempts = this.project.platform === "ios" ? 2 : 1;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const exitCode = await this.runMaestroProcess(flowPath, env);
        if (exitCode === 0) return;
        if (attempt === maxAttempts) {
          throw new Error(`Maestro flow "${name}" failed with exit code ${exitCode}`);
        }
        console.warn(`Maestro flow "${name}" failed with exit code ${exitCode}; retrying once.`);
      }
    });
  }

  serialize(name: string, commands: MaestroCommand[], options: RunFlowOptions = {}): string {
    const config = [`appId: ${this.project.appId}`, `name: ${name}`];
    if (options.webViewHierarchy && this.project.platform === "android") {
      config.push("androidWebViewHierarchy: devtools");
    }
    const body = toYaml(commands.map(deepNormalize));
    return [...config, "---", body, ""].join("\n");
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
