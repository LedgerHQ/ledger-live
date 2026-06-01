import { execFileSync, spawnSync } from "child_process";
import { setEnv } from "@ledgerhq/live-env";
import {
  setExchangeDependencies,
  specs,
  SpeculosDevice,
  startSpeculos,
  stopSpeculos,
} from "@ledgerhq/live-common/e2e/speculos";
import { CLI } from "../../mobile/utils/cliUtils";
import { MaestroProject } from "../config/projects";

export type SpeculosName = keyof typeof specs;

export class SpeculosDeviceManager {
  private readonly devices: SpeculosDevice[] = [];

  constructor(private readonly project: MaestroProject) {}

  async start(name: SpeculosName, testName: string) {
    const speculos = await startSpeculos(testName, specs[name]);
    if (!speculos?.port) {
      throw new Error(`${name} Speculos did not start with an API port`);
    }

    this.devices.push(speculos);
    return speculos;
  }

  async startExchangeWith(deps: SpeculosName[], testName: string) {
    setExchangeDependencies(deps.map(name => ({ name: String(name).replace(/ /g, "_") })));
    return this.start("Exchange", testName);
  }

  registerForCli(port: number) {
    process.env.SPECULOS_API_PORT = String(port);
    setEnv("SPECULOS_API_PORT", port);
    CLI.registerSpeculosTransport(String(port), process.env.SPECULOS_ADDRESS);
  }

  reversePort(port: number) {
    if (this.project.platform === "android") {
      execFileSync("adb", ["reverse", `tcp:${port}`, `tcp:${port}`], { stdio: "inherit" });
    }
  }

  unreversePort(port: number) {
    if (this.project.platform !== "android") return;
    spawnSync("adb", ["reverse", "--remove", `tcp:${port}`], { stdio: "ignore" });
  }

  address(port: number) {
    const configuredAddress = process.env.SPECULOS_ADDRESS?.trim();
    if (!configuredAddress) return `http://127.0.0.1:${port}`;

    const normalizedAddress = configuredAddress.startsWith("http")
      ? configuredAddress
      : `http://${configuredAddress}`;
    const withoutTrailingSlash = normalizedAddress.replace(/\/+$/, "");
    return /:\d+$/.test(withoutTrailingSlash)
      ? withoutTrailingSlash
      : `${withoutTrailingSlash}:${port}`;
  }

  async cleanup() {
    for (const speculos of this.devices) {
      this.unreversePort(speculos.port);
      await stopSpeculos(speculos.id);
    }
    this.devices.length = 0;
  }
}
